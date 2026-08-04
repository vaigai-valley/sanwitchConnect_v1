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
      val targetApkFile = File(context.cacheDir, "${cleanAppId}.apk")

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
   * Derives a unique Android package name the same byte-length as the host package.
   * Required for in-place binary AXML patching (no offset recalculation needed).
   * Uses CRC32 of cleanAppId for stable, collision-resistant uniqueness.
   *
   * Example: hostPkg="com.sanwitch.connect" (20 chars)
   *        → newPkg ="com.sw.pwa.a1b2c3d4e" (20 chars)
   */
  /**
   * Derives a unique Android package name the EXACT same byte-length as hostPkg.
   *
   * F1 Fix: The old implementation used padEnd/take which could truncate mid-segment,
   * producing invalid package names on short host packages. The new implementation
   * directly computes exactly (targetLen - prefix.length) suffix chars — guaranteed
   * to fill the field without any mid-dot truncation.
   *
   * All chars are ASCII so UTF-8 byte-length == char-length, safe for in-place AXML patch.
   *
   * Example: hostPkg="com.sanwitch.connect" (20) → "com.sw.pwa.p1a2b3caa" (20)
   */
  private fun deriveUniquePackageName(cleanAppId: String, hostPkg: String): String {
    val targetLen = hostPkg.length
    val crc = java.util.zip.CRC32()
    crc.update(cleanAppId.toByteArray(Charsets.UTF_8))
    var hashStr = java.lang.Long.toString(crc.value, 36).lowercase()
    // Ensure last segment does not start with a digit (Android package rule)
    if (hashStr[0].isDigit()) hashStr = "p$hashStr"

    val prefix = "com.sw.pwa."  // 11 chars
    return if (targetLen > prefix.length) {
      // Normal path: suffix fills exactly the remaining chars — no truncation risk
      val suffixLen = targetLen - prefix.length
      val suffix = hashStr.padEnd(suffixLen, 'a').take(suffixLen)
      "$prefix$suffix"  // exactly targetLen chars ✅
    } else {
      // Short host package (< 12 chars): use a compact prefix
      val shortPrefix = "sw."  // 3 chars
      val suffixLen = (targetLen - shortPrefix.length).coerceAtLeast(1)
      val suffix = hashStr.padEnd(suffixLen, 'a').take(suffixLen)
      val result = "$shortPrefix$suffix"
      // Pad only if somehow still short — fill with 'a', never truncates a dot segment
      result.padEnd(targetLen, 'a')
    }
  }

  /**
   * Reads a little-endian 32-bit integer from a byte array at the given offset.
   */
  private fun readInt32LE(buf: ByteArray, offset: Int): Int =
    (buf[offset].toInt() and 0xFF) or
    ((buf[offset + 1].toInt() and 0xFF) shl 8) or
    ((buf[offset + 2].toInt() and 0xFF) shl 16) or
    ((buf[offset + 3].toInt() and 0xFF) shl 24)

  /**
   * Replaces all in-place occurrences of oldBytes followed by nullTerminator
   * with newBytes (same size) inside buf. The null-terminator check prevents
   * false matches within longer strings (e.g. avoid matching "com.sanwitch.connect"
   * inside "com.sanwitch.connect.fileprovider").
   */
  private fun replaceInPlaceBytes(buf: ByteArray, oldBytes: ByteArray, newBytes: ByteArray, nullTerminator: ByteArray) {
    if (oldBytes.size != newBytes.size) return
    var i = 0
    while (i <= buf.size - oldBytes.size) {
      var match = true
      for (j in oldBytes.indices) {
        if (buf[i + j] != oldBytes[j]) { match = false; break }
      }
      if (match) {
        val afterIdx = i + oldBytes.size
        var nullMatch = afterIdx + nullTerminator.size <= buf.size
        if (nullMatch) {
          for (j in nullTerminator.indices) {
            if (buf[afterIdx + j] != nullTerminator[j]) { nullMatch = false; break }
          }
        }
        if (nullMatch) {
          System.arraycopy(newBytes, 0, buf, i, newBytes.size)
          i += newBytes.size + nullTerminator.size
          continue
        }
      }
      i++
    }
  }

  /**
   * Patches a binary Android XML (AXML) byte array to replace the package name string.
   *
   * F2 Fix: Previous implementation only handled UTF-8 AXML string pools. Android APKs
   * built with older aapt or targeting API < 21 use UTF-16LE string pools. This version
   * reads the string pool flags at AXML byte offset 24 (ResStringPool_header.flags,
   * bit 0x100 = UTF8_FLAG) and applies the correct encoding and null terminator:
   *   UTF-8  mode: search [utf8-bytes][0x00]
   *   UTF-16 mode: search [utf16le-bytes][0x00 0x00]
   */
  private fun patchAXMLPackageName(axml: ByteArray, oldPkg: String, newPkg: String): ByteArray {
    if (oldPkg == newPkg) return axml
    val oldUtf8 = oldPkg.toByteArray(Charsets.UTF_8)
    val newUtf8 = newPkg.toByteArray(Charsets.UTF_8)
    if (oldUtf8.size != newUtf8.size) return axml // safety guard
    val result = axml.copyOf()

    // AXML layout: [8-byte XML header][StringPool chunk starting at offset 8]
    // ResStringPool_header.flags is at: 8 (chunk start) + 16 (flags offset in header) = 24
    val isUtf8Pool = if (axml.size > 28) (readInt32LE(axml, 24) and 0x00000100) != 0 else true

    if (isUtf8Pool) {
      // UTF-8 string pool: null-terminated with single 0x00
      replaceInPlaceBytes(result, oldUtf8, newUtf8, byteArrayOf(0x00))
    } else {
      // UTF-16LE string pool: null-terminated with 0x00 0x00
      val oldUtf16 = oldPkg.toByteArray(Charsets.UTF_16LE)
      val newUtf16 = newPkg.toByteArray(Charsets.UTF_16LE)
      // ASCII package names always produce equal-length UTF-16LE arrays
      replaceInPlaceBytes(result, oldUtf16, newUtf16, byteArrayOf(0x00, 0x00))
    }

    return result
  }

  private fun buildLocalSignedApk(context: ReactApplicationContext, appName: String, targetApkFile: File, payloadStr: String, promise: Promise) {
    try {
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
            while (zis.read(buffer).also { len = it } > 0) {
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

      if (isHermesBytecode) {
        entryMap["assets/index.android.bundle"] = payloadBytes
      } else if (payloadStr.isNotBlank()) {
        entryMap["assets/index.html"] = payloadBytes
      }

      // *** CRITICAL FIX: Patch binary AndroidManifest.xml to unique package name ***
      // When using host APK as base template, the manifest contains the host package name
      // (e.g. "com.sanwitch.connect"). Android PackageInstaller sees this as an "update"
      // but rejects it because the signing key differs → "package conflicts" error.
      // Solution: Replace the package name string in-place in the binary AXML.
      val hostPkg = context.packageName
      val cleanAppId = appName.lowercase().replace(Regex("[^a-z0-9]"), "_")
      val newPkg = deriveUniquePackageName(cleanAppId, hostPkg)
      entryMap["AndroidManifest.xml"]?.let { rawManifest ->
        entryMap["AndroidManifest.xml"] = patchAXMLPackageName(rawManifest, hostPkg, newPkg)
      }

      // 1. Generate Manifest Digests (META-INF/MANIFEST.MF) & CERT.SF Section Digests (Bug 1.1 Fix)
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

      // 3. Persistent Cryptographic RSA Key Pair Signature
      val keyPair = getOrCreatePersistentKeyPair(context)

      val sig = Signature.getInstance("SHA256withRSA")
      sig.initSign(keyPair.private)
      sig.update(certSfBytes)
      val rawSignatureBytes = sig.sign()

      // Bug 1.1 (PKCS#7 Fix): Android JarVerifier requires CERT.RSA to be a valid
      // PKCS#7 SignedData ASN.1 DER structure, not a raw RSA byte array.
      val selfSignedCert = getOrCreateSelfSignedCert(context, keyPair)
      val pkcs7Der = buildPkcs7SignedData(selfSignedCert, rawSignatureBytes)

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
      launchPackageInstallerDirectly(context, apkUri, promise)
    } catch (e: Exception) {
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
