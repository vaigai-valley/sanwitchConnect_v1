package com.sanwitch.connect

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Base64
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.InputStream
import java.math.BigInteger
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.MessageDigest
import java.security.Signature
import java.security.cert.X509Certificate
import java.util.Date
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

class WebApkInstallerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "WebApkInstallerModule"

  /** Emits a real-time build step message to the JS terminal via DeviceEventEmitter. */
  private fun emitBuildLog(msg: String) {
    try {
      reactApplicationContext
        .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("APKBuildLog", msg)
    } catch (e: Exception) {
      android.util.Log.d("WebApkInstaller", "[LOG] $msg")
    }
  }

  @ReactMethod
  fun canInstallPackages(promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val canInstall = reactApplicationContext.packageManager.canRequestPackageInstalls()
      promise.resolve(canInstall)
    } else {
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun requestInstallPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val context = reactApplicationContext
      if (!context.packageManager.canRequestPackageInstalls()) {
        val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
          data = Uri.parse("package:${context.packageName}")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
      }
    }
  }

  @ReactMethod
  fun installLocalApk(filePath: String, promise: Promise) {
    val context = reactApplicationContext
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
        requestInstallPermission()
        promise.resolve("PERMISSION_NEEDED")
        return
      }

      val apkFile = File(filePath)
      if (!apkFile.exists()) {
        promise.reject("FILE_NOT_FOUND", "APK file does not exist at $filePath")
        return
      }

      val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apkFile)
      launchPackageInstallerDirectly(context, apkUri, promise)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }

  @ReactMethod
  fun installWebApk(appName: String, pwaUrl: String, htmlPayload: String?, promise: Promise) {
    val context = reactApplicationContext
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
        requestInstallPermission()
        promise.resolve("PERMISSION_NEEDED")
        return
      }

      // 1. Direct Local File Path Installation (file:// or /sdcard/...)
      if ((pwaUrl.startsWith("file://") || pwaUrl.startsWith("/")) && !pwaUrl.startsWith("http")) {
        val cleanPath = pwaUrl.replace("file://", "")
        installLocalApk(cleanPath, promise)
        return
      }

      val cleanAppId = appName.lowercase().replace(Regex("[^a-z0-9]"), "_")
      // Use filesDir not cacheDir: Android OS can purge cacheDir before PackageInstaller reads the APK
      val targetApkFile = File(context.filesDir, "${cleanAppId}_pwa.apk")

      // 2. Direct On-Device Native APK Minting Engine
      val payload = if (!htmlPayload.isNullOrBlank()) htmlPayload else ""
      // Issue 2.1 Fix: Run APK compilation on background thread to prevent ANR / JS bridge timeout.
      // buildLocalSignedApk calls promise.resolve/reject internally (thread-safe in React Native).
      Thread { buildLocalSignedApk(context, appName, targetApkFile, payload, promise) }.start()
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }

  private fun getOrCreatePersistentKeyPair(context: ReactApplicationContext): KeyPair {
    val keyFile = File(context.filesDir, "sanwitch_compiler_key.dat")

    // O2 Fix: Invalidate any stale RSA-1024 key and regenerate at 2048-bit
    if (keyFile.exists()) {
      try {
        java.io.ObjectInputStream(java.io.FileInputStream(keyFile)).use { ois ->
          val kp = ois.readObject() as KeyPair
          val rsaKey = kp.public as? java.security.interfaces.RSAPublicKey
          if (rsaKey != null && rsaKey.modulus.bitLength() < 2048) {
            keyFile.delete() // stale 1024-bit key — regenerate
            File(context.filesDir, "sanwitch_compiler_cert.dat").delete() // invalidate paired cert
          } else {
            return kp
          }
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    val keyGen = KeyPairGenerator.getInstance("RSA")
    keyGen.initialize(2048) // O2 Fix: RSA-1024 deprecated by NIST since 2013; use 2048-bit minimum
    val keyPair = keyGen.generateKeyPair()
    try {
      java.io.ObjectOutputStream(java.io.FileOutputStream(keyFile)).use { oos ->
        oos.writeObject(keyPair)
        oos.flush()
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
    return keyPair
  }

  private fun getBaseApkInputStream(context: ReactApplicationContext): InputStream {
    // Priority 1: Check internal files directory (/files/pwa_template.apk)
    val customTemplateFile = File(context.filesDir, "pwa_template.apk")
    if (customTemplateFile.exists()) {
      return java.io.FileInputStream(customTemplateFile)
    }

    // Priority 2: Check bundled assets (assets/pwa_template.apk)
    try {
      return context.assets.open("pwa_template.apk")
    } catch (e: Exception) {
      // Asset template missing, proceed to self-host fallback
    }

    // Priority 3: Dynamic Self-Host Fallback (host app's own source APK)
    val hostApkPath = context.applicationInfo.sourceDir
    if (!hostApkPath.isNullOrBlank()) {
      val hostApkFile = File(hostApkPath)
      if (hostApkFile.exists()) {
        return java.io.FileInputStream(hostApkFile)
      }
    }

    throw java.io.FileNotFoundException("No base APK template found in filesDir, assets, or host application sourceDir.")
  }

  /**
   * Retrieves or generates a persistent self-signed X.509 v1 DER certificate.
   * Bug 1 Fix: Uses only Android-native standard Java APIs (no Bouncy Castle).
   * The DER bytes are cached to disk and parsed back via CertificateFactory.
   */
  private fun getOrCreateSelfSignedCert(context: ReactApplicationContext, keyPair: KeyPair): X509Certificate {
    val certFile = File(context.filesDir, "sanwitch_compiler_cert.dat")
    if (certFile.exists()) {
      try {
        val certFactory = java.security.cert.CertificateFactory.getInstance("X.509")
        java.io.FileInputStream(certFile).use { fis ->
          val cert = certFactory.generateCertificate(fis)
          if (cert is X509Certificate) return cert
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    // Build a minimal self-signed X.509 v1 DER certificate using only standard Java/Android APIs
    fun derLen(len: Int): ByteArray = when {
      len < 0x80 -> byteArrayOf(len.toByte())
      len < 0x100 -> byteArrayOf(0x81.toByte(), len.toByte())
      else -> byteArrayOf(0x82.toByte(), (len shr 8).toByte(), (len and 0xFF).toByte())
    }
    fun tlv(tag: Byte, c: ByteArray) = byteArrayOf(tag) + derLen(c.size) + c
    fun seq(c: ByteArray) = tlv(0x30.toByte(), c)
    fun set(c: ByteArray) = tlv(0x31.toByte(), c)
    fun oid(hex: String) = tlv(0x06.toByte(), hex.chunked(2).map { it.toInt(16).toByte() }.toByteArray())
    fun utf8str(s: String) = tlv(0x0C.toByte(), s.toByteArray(Charsets.UTF_8))
    fun bitString(d: ByteArray) = tlv(0x03.toByte(), byteArrayOf(0x00.toByte()) + d)
    fun utcTime(s: String) = tlv(0x17.toByte(), s.toByteArray(Charsets.US_ASCII))
    fun integerDer(d: ByteArray) = tlv(0x02.toByte(), d)

    val sha256WithRsaOid = oid("2a864886f70d01010b")
    val algId = seq(sha256WithRsaOid + byteArrayOf(0x05, 0x00))

    // Distinguished Name: CN=Sanwitch Connect, O=Vaigaivalley, C=IN
    val dn = seq(
      set(seq(oid("550403") + utf8str("Sanwitch Connect"))) +
      set(seq(oid("55040a") + utf8str("Vaigaivalley"))) +
      set(seq(oid("550406") + utf8str("IN")))
    )

    val sdf = java.text.SimpleDateFormat("yyMMddHHmmss", java.util.Locale.US)
    sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
    val now = Date()
    val tenYears = Date(now.time + 10L * 365 * 24 * 60 * 60 * 1000)
    val validity = seq(utcTime(sdf.format(now) + "Z") + utcTime(sdf.format(tenYears) + "Z"))

    val serialBytes = BigInteger.valueOf(System.currentTimeMillis()).toByteArray()
    val serial = integerDer(serialBytes)

    // subjectPublicKeyInfo: already DER-encoded SubjectPublicKeyInfo by Java's RSA key generator
    val spki = keyPair.public.encoded

    val tbsCert = seq(serial + algId + dn + validity + dn + spki)

    val sigEngine = Signature.getInstance("SHA256withRSA")
    sigEngine.initSign(keyPair.private)
    sigEngine.update(tbsCert)
    val sigBytes = sigEngine.sign()

    val certDer = seq(tbsCert + algId + bitString(sigBytes))

    try {
      java.io.FileOutputStream(certFile).use { fos -> fos.write(certDer) }
    } catch (e: Exception) {
      e.printStackTrace()
    }

    val certFactory = java.security.cert.CertificateFactory.getInstance("X.509")
    return certFactory.generateCertificate(java.io.ByteArrayInputStream(certDer)) as X509Certificate
  }

  /**
   * Constructs a minimal PKCS#7 SignedData ASN.1 DER structure for META-INF/CERT.RSA.
   *
   * Android's JarVerifier (PackageParser) requires CERT.RSA to be a DER-encoded PKCS#7
   * ContentInfo structure containing:
   *   - SignedData OID (1.2.840.113549.1.7.2)
   *   - X.509 certificate (for public key extraction)
   *   - SignerInfo with SHA256withRSA algorithm and raw RSA signature bytes
   *
   * This is a hand-crafted minimal PKCS#7 envelope. No external Bouncy Castle SignedData
   * builder is used so it is compatible with all Android SDK levels.
   */
  private fun buildPkcs7SignedData(cert: X509Certificate, rawSignature: ByteArray): ByteArray {
    val certDer = cert.encoded

    fun derLen(len: Int): ByteArray {
      return when {
        len < 0x80 -> byteArrayOf(len.toByte())
        len < 0x100 -> byteArrayOf(0x81.toByte(), len.toByte())
        else -> byteArrayOf(0x82.toByte(), (len shr 8).toByte(), (len and 0xFF).toByte())
      }
    }

    fun tlv(tag: Byte, content: ByteArray): ByteArray =
      byteArrayOf(tag) + derLen(content.size) + content

    fun seq(content: ByteArray) = tlv(0x30.toByte(), content)
    fun set(content: ByteArray) = tlv(0x31.toByte(), content)
    fun ctx0(content: ByteArray) = tlv(0xA0.toByte(), content)
    fun oid(hex: String): ByteArray = tlv(0x06.toByte(), hex.chunked(2).map { it.toInt(16).toByte() }.toByteArray())
    fun integer(value: Int) = tlv(0x02.toByte(), byteArrayOf(value.toByte()))
    fun octetString(data: ByteArray) = tlv(0x04.toByte(), data)

    // OIDs
    val oidSignedData = oid("2a864886f70d010702")   // pkcs7-signedData
    val oidSha256 = oid("608648016503040201")         // sha-256
    val oidSha256WithRsa = oid("2a864886f70d01010b") // sha256WithRSAEncryption
    val oidData = oid("2a864886f70d010701")          // pkcs7-data

    // AlgorithmIdentifier: sha256 NULL
    val sha256AlgId = seq(oidSha256 + byteArrayOf(0x05, 0x00))
    // AlgorithmIdentifier: sha256WithRSA NULL (Bug 2 Fix: removed unused rsaAlgId)
    val sha256WithRsaAlgId = seq(oidSha256WithRsa + byteArrayOf(0x05, 0x00))

    // X.509 Certificate wrapped in [0] IMPLICIT context tag (Bug 3 Fix: was ctx3/0xA3, must be ctx0/0xA0)
    // PKCS#7 SignedData.certificates is [0] IMPLICIT CertificateSet per RFC 2315
    val certificates = ctx0(certDer)

    // IssuerAndSerialNumber
    val issuerAndSerial = seq(cert.issuerX500Principal.encoded + tlv(0x02.toByte(),
      cert.serialNumber.toByteArray().let { b ->
        if (b[0] < 0) byteArrayOf(0x00) + b else b
      }
    ))

    // SignerInfo
    val signerInfo = seq(
      integer(1) +                      // version
      issuerAndSerial +
      sha256AlgId +                     // digestAlgorithm
      sha256WithRsaAlgId +              // digestEncryptionAlgorithm
      octetString(rawSignature)         // encryptedDigest
    )

    // DigestAlgorithmIdentifiers SET
    val digestAlgIds = set(sha256AlgId)

    // ContentInfo: pkcs7-data with EMPTY content
    val contentInfo = seq(oidData)

    // SignerInfos SET
    val signerInfos = set(signerInfo)

    // SignedData
    val signedData = seq(
      integer(1) +                      // version
      digestAlgIds +
      contentInfo +
      certificates +
      signerInfos
    )

    // ContentInfo wrapper: pkcs7-signedData [0] EXPLICIT
    val pkcs7 = seq(oidSignedData + ctx0(signedData))

    return pkcs7
  }

  /**
   * Derives a unique Android package name the EXACT same byte-length as hostPkg.
   * Required for in-place binary AXML patching (no offset recalculation needed).
   * All chars are ASCII so UTF-8 byte-length == char-length.
   *
   * The suffix is split into two halves:
   *   namePart: CRC32(cleanAppId) — stable per app name
   *   certPart: CRC32(cert.encoded) — changes when the signing key is regenerated
   *
   * Result:
   *   Same app name + same key → same package → Android "update" dialog    ✅
   *   Same app name + new key  → new package  → fresh install, no conflict ✅
   *
   * Example: hostPkg="com.sanwitch.connect" (20) → "com.sw.pwa.naaa1kbcd" (20)
   */
  private fun deriveUniquePackageName(cleanAppId: String, cert: java.security.cert.X509Certificate, hostPkg: String): String {
    val targetLen = hostPkg.length
    val prefix = "com.sw.pwa."  // 11 chars

    if (targetLen <= prefix.length) {
      // Short host package fallback: compact prefix + name hash
      val shortPrefix = "sw."
      val suffixLen = (targetLen - shortPrefix.length).coerceAtLeast(1)
      val crc = java.util.zip.CRC32()
      crc.update(cleanAppId.toByteArray(Charsets.UTF_8))
      var h = java.lang.Long.toString(crc.value, 36).lowercase()
      if (h[0].isDigit()) h = "n$h"
      return ("$shortPrefix${h.padEnd(suffixLen, 'a').take(suffixLen)}").padEnd(targetLen, 'a')
    }

    val suffixLen = targetLen - prefix.length  // e.g. 9 for "com.sanwitch.connect"
    val halfA = suffixLen / 2                  // name-identity chars (e.g. 4)
    val halfB = suffixLen - halfA              // cert-identity chars (e.g. 5)

    // Part A: stable per app name
    val nameCrc = java.util.zip.CRC32()
    nameCrc.update(cleanAppId.toByteArray(Charsets.UTF_8))
    var nameHash = java.lang.Long.toString(nameCrc.value, 36).lowercase()
    if (nameHash[0].isDigit()) nameHash = "n$nameHash"
    val namePart = nameHash.padEnd(halfA, 'a').take(halfA)

    // Part B: changes when the signing key/cert is regenerated — prevents signature mismatch conflict
    val certCrc = java.util.zip.CRC32()
    certCrc.update(cert.encoded)
    var certHash = java.lang.Long.toString(certCrc.value, 36).lowercase()
    if (certHash[0].isDigit()) certHash = "k$certHash"
    val certPart = certHash.padEnd(halfB, 'a').take(halfB)

    return "$prefix$namePart$certPart"  // exactly targetLen chars ✅
  }

  /**
   * Reads a little-endian 32-bit integer from a byte array at the given offset.
   */
  private fun readInt32LE(buf: ByteArray, offset: Int): Int =
    (buf[offset].toInt() and 0xFF) or
    ((buf[offset + 1].toInt() and 0xFF) shl 8) or
    ((buf[offset + 2].toInt() and 0xFF) shl 16) or
    ((buf[offset + 3].toInt() and 0xFF) shl 24)

  private fun writeInt32LE(buf: ByteArray, offset: Int, value: Int) {
    buf[offset] = (value and 0xFF).toByte()
    buf[offset + 1] = ((value ushr 8) and 0xFF).toByte()
    buf[offset + 2] = ((value ushr 16) and 0xFF).toByte()
    buf[offset + 3] = ((value ushr 24) and 0xFF).toByte()
  }

  private fun clearArscSortedFlags(buf: ByteArray) {
    if (buf.size < 12) return
    val type = (buf[0].toInt() and 0xFF) or ((buf[1].toInt() and 0xFF) shl 8)
    if (type != 0x0002) return // RES_TABLE_TYPE
    val headerSize = (buf[2].toInt() and 0xFF) or ((buf[3].toInt() and 0xFF) shl 8)
    
    var offset = headerSize
    while (offset + 8 <= buf.size) {
      val cType = (buf[offset].toInt() and 0xFF) or ((buf[offset + 1].toInt() and 0xFF) shl 8)
      val cHeaderSize = (buf[offset + 2].toInt() and 0xFF) or ((buf[offset + 3].toInt() and 0xFF) shl 8)
      val cSize = readInt32LE(buf, offset + 4)
      if (cSize <= 0 || offset + cSize > buf.size) break
      
      if (cType == 0x0001 && cHeaderSize >= 28) { // RES_STRING_POOL_TYPE
        val flagsOffset = offset + 16
        val flags = readInt32LE(buf, flagsOffset)
        if ((flags and 0x00000001) != 0) { // SORTED_FLAG
          writeInt32LE(buf, flagsOffset, flags and 0xFFFFFFFE.toInt())
        }
      }
      offset += cSize
    }
  }

  /**
   * Replaces all in-place occurrences of oldBytes followed by nullTerminator
   * with newBytes (same size) inside buf. The null-terminator check prevents
   * false matches within longer strings (e.g. avoid matching "com.sanwitch.connect"
   * inside "com.sanwitch.connect.fileprovider").
   */
  private fun replaceInPlaceBytes(buf: ByteArray, oldBytes: ByteArray, newBytes: ByteArray, nullTerminator: ByteArray): Boolean {
    if (oldBytes.size != newBytes.size) return false
    var replaced = false
    var i = 0
    while (i <= buf.size - oldBytes.size) {
      var match = true
      for (j in oldBytes.indices) {
        if (buf[i + j] != oldBytes[j]) { match = false; break }
      }
      if (match) {
        val afterIdx = i + oldBytes.size
        val nullMatch = if (nullTerminator.isEmpty()) true
          else afterIdx + nullTerminator.size <= buf.size &&
               (0 until nullTerminator.size).all { buf[afterIdx + it] == nullTerminator[it] }
        if (nullMatch) {
          System.arraycopy(newBytes, 0, buf, i, newBytes.size)
          replaced = true
          i += newBytes.size + nullTerminator.size
          continue
        }
      }
      i++
    }
    return replaced
  }

  /**
   * Patches a binary Android XML (AXML) byte array to replace the package name string.
   * Handles both UTF-8 and UTF-16LE string pools.
   * Falls back to a brute-force search (without null-terminator check) if the
   * null-terminated search finds zero matches — covers edge cases in AXML variants.
   */
  private fun patchAXMLPackageName(axml: ByteArray, oldPkg: String, newPkg: String): ByteArray {
    if (oldPkg == newPkg) return axml
    val oldUtf8 = oldPkg.toByteArray(Charsets.UTF_8)
    val newUtf8 = newPkg.toByteArray(Charsets.UTF_8)
    if (oldUtf8.size != newUtf8.size) return axml
    val result = axml.copyOf()

    // Read AXML string pool flags at offset 24 (UTF8_FLAG = 0x100)
    val isUtf8Pool = if (axml.size > 28) (readInt32LE(axml, 24) and 0x00000100) != 0 else true

    var replaced = false
    if (isUtf8Pool) {
      // Primary: null-terminated UTF-8 search
      replaced = replaceInPlaceBytes(result, oldUtf8, newUtf8, byteArrayOf(0x00))
      // Fallback: brute-force (no null-terminator) if primary found nothing
      if (!replaced) replaced = replaceInPlaceBytes(result, oldUtf8, newUtf8, byteArrayOf())
    } else {
      val oldUtf16 = oldPkg.toByteArray(Charsets.UTF_16LE)
      val newUtf16 = newPkg.toByteArray(Charsets.UTF_16LE)
      replaced = replaceInPlaceBytes(result, oldUtf16, newUtf16, byteArrayOf(0x00, 0x00))
      if (!replaced) replaced = replaceInPlaceBytes(result, oldUtf16, newUtf16, byteArrayOf())
    }

    if (!replaced) android.util.Log.w("WebApkInstaller", "AXML patch: package name not found in manifest! APK may conflict.")
    return result
  }

  private fun buildLocalSignedApk(context: ReactApplicationContext, appName: String, targetApkFile: File, payloadStr: String, promise: Promise) {
    try {
      emitBuildLog("► Loading base APK template...")
      val baseInputStream = getBaseApkInputStream(context)

      // Detect Hermes Bytecode Header (0x1F 0x06 0x1E 0xCE) vs HTML String
      val payloadBytes = payloadStr.toByteArray(Charsets.UTF_8)
      val isHermesBytecode = payloadBytes.size >= 4 &&
          payloadBytes[0] == 0x1F.toByte() && payloadBytes[1] == 0x06.toByte() &&
          payloadBytes[2] == 0x1E.toByte() && payloadBytes[3] == 0xCE.toByte()

      val entryMap = mutableMapOf<String, ByteArray>()
      val md = MessageDigest.getInstance("SHA-256")
      val buffer = ByteArray(8192)

      val zis = ZipInputStream(baseInputStream)
      var entry: ZipEntry? = zis.nextEntry

      // Pass 1: Stream entries safely into memory/temp storage & calculate digests
      while (entry != null) {
        val name = entry.name
        val shouldSkipLib = !isHermesBytecode && name.startsWith("lib/")
        if (!name.startsWith("META-INF/") && !shouldSkipLib) {
          var bytes: ByteArray
          if (name == "assets/index.html" && payloadStr.isNotBlank() && !isHermesBytecode) {
            bytes = payloadBytes
          } else if (name == "assets/index.android.bundle" && isHermesBytecode) {
            bytes = payloadBytes
          } else {
            val baos = java.io.ByteArrayOutputStream()
            var len: Int
            // Fix: use != -1 not > 0; read() can return 0 on AssetInputStream (non-blocking)
            // which caused silent truncation of large entries on some Android versions.
            while (zis.read(buffer).also { len = it } != -1) {
              baos.write(buffer, 0, len)
            }
            bytes = baos.toByteArray()
          }
          entryMap[name] = bytes
        }
        zis.closeEntry()
        entry = zis.nextEntry
      }
      zis.close()
      emitBuildLog("► ZIP entries loaded: ${entryMap.size} files")

      if (isHermesBytecode) {
        entryMap["assets/index.android.bundle"] = payloadBytes
      } else if (payloadStr.isNotBlank()) {
        entryMap["assets/index.html"] = payloadBytes
      }

      // Key+cert loaded FIRST so cert fingerprint is part of the derived package name
      emitBuildLog("► Loading persistent RSA-2048 keypair...")
      val keyPair = getOrCreatePersistentKeyPair(context)
      emitBuildLog("► Loading self-signed X.509 certificate...")
      val selfSignedCert = getOrCreateSelfSignedCert(context, keyPair)

      val hostPkg = context.packageName
      val cleanAppId2 = appName.lowercase().replace(Regex("[^a-z0-9]"), "_")
      val newPkg = deriveUniquePackageName(cleanAppId2, selfSignedCert, hostPkg)
      emitBuildLog("► Patching AndroidManifest: $hostPkg → $newPkg")
      entryMap["AndroidManifest.xml"]?.let { rawManifest ->
        var patched = rawManifest.copyOf()
        val isUtf8Pool = if (patched.size > 28) (readInt32LE(patched, 24) and 0x00000100) != 0 else true
        
        val oldBytes = if (isUtf8Pool) hostPkg.toByteArray(Charsets.UTF_8)
                       else           hostPkg.toByteArray(Charsets.UTF_16LE)
        val newBytes = if (isUtf8Pool) newPkg.toByteArray(Charsets.UTF_8)
                       else           newPkg.toByteArray(Charsets.UTF_16LE)

        // Global prefix replacement: replace hostPkg with newPkg everywhere it appears in the AXML.
        // By passing an empty nullTerminator, it will replace "com.sanwitch.connect" even when it's
        // part of a longer string like "com.sanwitch.connect.FileSystemFileProvider".
        // This guarantees EVERY provider authority and intent action is isolated.
        val found = replaceInPlaceBytes(patched, oldBytes, newBytes, byteArrayOf())
        
        if (!found) {
          android.util.Log.w("WebApkInstaller", "AXML: package name patch may not have applied — conflict possible")
          emitBuildLog("⚠ WARNING: Could not find package name in manifest. Install may conflict.")
        } else {
          emitBuildLog("► AndroidManifest fully patched (package + all providers)")
        }
        
        entryMap["AndroidManifest.xml"] = patched
      }

      emitBuildLog("► Patching resources.arsc...")
      entryMap["resources.arsc"]?.let { rawArsc ->
        var patched = rawArsc.copyOf()
        
        // resources.arsc strings can be UTF-8 or UTF-16LE. Since we don't parse the ARSC header here,
        // we just attempt to replace in both encodings. Safe because sizes are identical.
        val oldUtf8 = hostPkg.toByteArray(Charsets.UTF_8)
        val newUtf8 = newPkg.toByteArray(Charsets.UTF_8)
        val oldUtf16 = hostPkg.toByteArray(Charsets.UTF_16LE)
        val newUtf16 = newPkg.toByteArray(Charsets.UTF_16LE)
        
        val found8 = replaceInPlaceBytes(patched, oldUtf8, newUtf8, byteArrayOf())
        val found16 = replaceInPlaceBytes(patched, oldUtf16, newUtf16, byteArrayOf())
        
        if (found8 || found16) {
          clearArscSortedFlags(patched)
          emitBuildLog("► resources.arsc fully patched (sorting flags cleared)")
        } else {
          emitBuildLog("⚠ WARNING: Could not find package name in resources.arsc.")
        }
        entryMap["resources.arsc"] = patched
      }

      // 1. Generate Manifest Digests (META-INF/MANIFEST.MF) & CERT.SF
      emitBuildLog("► Computing SHA-256 digests for ${entryMap.size} entries...")
      val manifestSb = StringBuilder()
      manifestSb.append("Manifest-Version: 1.0\r\nCreated-By: Sanwitch Connect Local APK Compiler\r\n\r\n")

      val certSfSectionsSb = StringBuilder()

      for ((name, data) in entryMap) {
        val fileHash = Base64.encodeToString(md.digest(data), Base64.NO_WRAP)
        
        // Manifest section for this entry
        val manifestSection = "Name: $name\r\nSHA-256-Digest: $fileHash\r\n\r\n"
        manifestSb.append(manifestSection)

        // Bug 1.1 Fix: CERT.SF SHA-256-Digest MUST be the hash of the MANIFEST.MF section snippet
        val sectionBytes = manifestSection.toByteArray(Charsets.UTF_8)
        val sectionHash = Base64.encodeToString(md.digest(sectionBytes), Base64.NO_WRAP)
        certSfSectionsSb.append("Name: $name\r\nSHA-256-Digest: $sectionHash\r\n\r\n")
      }

      val manifestBytes = manifestSb.toString().toByteArray(Charsets.UTF_8)
      val manifestHash = Base64.encodeToString(md.digest(manifestBytes), Base64.NO_WRAP)

      // 2. Generate Signature File (META-INF/CERT.SF)
      val certSfSb = StringBuilder()
      certSfSb.append("Signature-Version: 1.0\r\nCreated-By: Sanwitch Connect Local APK Compiler\r\n")
      certSfSb.append("SHA-256-Digest-Manifest: ").append(manifestHash).append("\r\n\r\n")
      certSfSb.append(certSfSectionsSb.toString())

      val certSfBytes = certSfSb.toString().toByteArray(Charsets.UTF_8)
      emitBuildLog("► CERT.SF generated")

      // Key+cert already obtained above before AXML patch — reuse here
      emitBuildLog("► Signing with RSA-2048 / SHA256withRSA...")
      val sig = Signature.getInstance("SHA256withRSA")
      sig.initSign(keyPair.private)
      sig.update(certSfBytes)
      val rawSignatureBytes = sig.sign()

      // Bug 1.1 (PKCS#7 Fix): Android JarVerifier requires CERT.RSA to be a valid
      // PKCS#7 SignedData ASN.1 DER structure, not a raw RSA byte array.
      val pkcs7Der = buildPkcs7SignedData(selfSignedCert, rawSignatureBytes)
      emitBuildLog("► PKCS#7 SignedData (CERT.RSA) assembled")

      entryMap["META-INF/MANIFEST.MF"] = manifestBytes
      entryMap["META-INF/CERT.SF"] = certSfBytes
      entryMap["META-INF/CERT.RSA"] = pkcs7Der

      // 4. Output Complete Signed Binary APK File with Zipalign (4-Byte Alignment)
      // O3 Fix: Direct counting OutputStream over FileOutputStream — removes DataOutputStream
      // indirection layer and makes writtenBytes tracking simpler and more transparent.
      val fos = java.io.FileOutputStream(targetApkFile)
      var writtenBytes = 0L

      val countingOs = object : java.io.OutputStream() {
        override fun write(b: Int) { fos.write(b); writtenBytes++ }
        override fun write(b: ByteArray, off: Int, len: Int) { fos.write(b, off, len); writtenBytes += len }
        override fun flush() = fos.flush()
        override fun close() = fos.close()
      }

      val zos = ZipOutputStream(countingOs)

      for ((name, data) in entryMap) {
        val newEntry = ZipEntry(name)
        val nameBytes = name.toByteArray(Charsets.UTF_8)

        val isUncompressedRequired = name == "resources.arsc" || name.startsWith("assets/raw/")
        if (isUncompressedRequired) {
          newEntry.method = ZipEntry.STORED
          newEntry.size = data.size.toLong()
          newEntry.compressedSize = data.size.toLong()

          val crc = java.util.zip.CRC32()
          crc.update(data)
          newEntry.crc = crc.value

          // Zipalign: compute 4-byte padding so data starts at a 4-byte boundary
          // Local header = 30 (fixed) + nameLen + extraLen; we set extra = padding bytes
          val dataOffsetWithoutExtra = writtenBytes + 30L + nameBytes.size
          val padding = ((4 - (dataOffsetWithoutExtra % 4)) % 4).toInt()
          if (padding > 0) newEntry.extra = ByteArray(padding)
        } else {
          newEntry.method = ZipEntry.DEFLATED
        }

        zos.putNextEntry(newEntry)
        zos.write(data, 0, data.size)
        zos.closeEntry()
      }
      zos.close() // also closes countingOs which closes fos

      val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", targetApkFile)
      emitBuildLog("► APK written to ${targetApkFile.name} (${targetApkFile.length() / 1024}KB) — launching PackageInstaller...")
      launchPackageInstallerDirectly(context, apkUri, promise)
    } catch (e: Exception) {
      emitBuildLog("✗ BUILD FAILED: ${e.message}")
      e.printStackTrace()
      promise.reject("BUILD_ERROR", e.message)
    }
  }

  @ReactMethod
  fun openInTwa(url: String, promise: Promise) {
    try {
      val context = reactApplicationContext

      // Issue 1.1 Fix: Only HTTPS URLs accepted. Chrome blocks content:// and file:// URIs.
      // Dead HTML-string and file:// branches removed — App.js always sends https:// now.
      if (!url.startsWith("https://") && !url.startsWith("http://")) {
        promise.reject("TWA_ERROR", "openInTwa requires an https:// URL. Received: $url")
        return
      }

      val uri = Uri.parse(url)

      // 1. Launch Chrome Custom Tabs / TWA (In-App Chromium Activity with WebBluetooth)
      val intent = Intent(Intent.ACTION_VIEW, uri).apply {
        setPackage("com.android.chrome")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        putExtra("android.support.customtabs.extra.SESSION", null as String?)
        putExtra("android.support.customtabs.extra.TOOLBAR_COLOR", android.graphics.Color.parseColor("#0b0d12"))
        putExtra("android.support.customtabs.extra.TITLE_VISIBILITY", 1)
      }

      if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
        promise.resolve("TWA_OPENED_CHROME")
        return
      }

      // 2. Fallback to default browser if Chrome is not present
      val genericIntent = Intent(Intent.ACTION_VIEW, uri).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(genericIntent)
      promise.resolve("TWA_OPENED_GENERIC")
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("TWA_ERROR", e.message)
    }
  }

  private fun launchPackageInstallerDirectly(context: ReactApplicationContext, apkUri: Uri, promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(apkUri, "application/vnd.android.package-archive")
        // Issue 1.2 Fix: FLAG_GRANT_WRITE_URI_PERMISSION causes SecurityException on Android 13+.
        // PackageInstaller only needs READ permission on the FileProvider URI.
        flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
      }

      context.startActivity(intent)
      promise.resolve("INSTALL_PROMPT_OPENED")
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_LAUNCH_ERROR", e.message)
    }
  }
}
