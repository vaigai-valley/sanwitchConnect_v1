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
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyPairGenerator
import java.security.MessageDigest
import java.security.Signature
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
      // Uses the pwaFrameworkBundle.js HTML payload directly to compile a signed binary .apk file locally
      val payload = if (!htmlPayload.isNullOrBlank()) htmlPayload else ""
      buildLocalSignedApk(context, appName, targetApkFile, payload, promise)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }

  private fun buildLocalSignedApk(context: ReactApplicationContext, appName: String, targetApkFile: File, payloadStr: String, promise: Promise) {
    try {
      val baseApkPath = context.applicationInfo.sourceDir
      val baseApkFile = File(baseApkPath)

      if (!baseApkFile.exists()) {
        promise.reject("BUILD_ERROR", "Base APK template missing at $baseApkPath")
        return
      }

      // Detect Hermes Bytecode Header (0x1F 0x06 0x1E 0xCE) vs HTML String
      val payloadBytes = payloadStr.toByteArray(Charsets.UTF_8)
      val isHermesBytecode = payloadBytes.size >= 4 &&
          payloadBytes[0] == 0x1F.toByte() && payloadBytes[1] == 0x06.toByte() &&
          payloadBytes[2] == 0x1E.toByte() && payloadBytes[3] == 0xCE.toByte()

      val entryMap = mutableMapOf<String, ByteArray>()
      val zis = ZipInputStream(java.io.FileInputStream(baseApkFile))
      var entry: ZipEntry? = zis.nextEntry

      while (entry != null) {
        val name = entry.name
        // Skip old signatures. Skip heavy native lib/ for lightweight PWA APK compilation.
        val shouldSkipLib = !isHermesBytecode && name.startsWith("lib/")
        if (!name.startsWith("META-INF/") && !shouldSkipLib) {
          var bytes = zis.readBytes()
          if (name == "AndroidManifest.xml") {
            // Dynamically patch package identifier to a unique 20-character string (matching "com.sanwitch.connect")
            val oldPkg = "com.sanwitch.connect"
            val cleanTitle = appName.lowercase().replace(Regex("[^a-z0-9]"), "")
            val suffixSeed = (cleanTitle + "app123456789").take(7)
            val newPkg = "com.sanwitch.$suffixSeed" // Exactly 13 + 7 = 20 characters
            bytes = patchAxmlPackageName(bytes, oldPkg, newPkg)
          } else if (name == "assets/index.html" && payloadStr.isNotBlank() && !isHermesBytecode) {
            bytes = payloadBytes
          } else if (name == "assets/index.android.bundle" && isHermesBytecode) {
            bytes = payloadBytes
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

      // 1. Generate Manifest Digests (META-INF/MANIFEST.MF)
      val manifestSb = StringBuilder()
      manifestSb.append("Manifest-Version: 1.0\r\nCreated-By: Sanwitch Connect Local APK Compiler\r\n\r\n")

      val digestMap = mutableMapOf<String, String>()
      val md = MessageDigest.getInstance("SHA-256")

      for ((name, data) in entryMap) {
        val hash = Base64.encodeToString(md.digest(data), Base64.NO_WRAP)
        digestMap[name] = hash
        manifestSb.append("Name: ").append(name).append("\r\n")
        manifestSb.append("SHA-256-Digest: ").append(hash).append("\r\n\r\n")
      }

      val manifestBytes = manifestSb.toString().toByteArray(Charsets.UTF_8)
      val manifestHash = Base64.encodeToString(md.digest(manifestBytes), Base64.NO_WRAP)

      // 2. Generate Signature File (META-INF/CERT.SF)
      val certSfSb = StringBuilder()
      certSfSb.append("Signature-Version: 1.0\r\nCreated-By: Sanwitch Connect Local APK Compiler\r\n")
      certSfSb.append("SHA-256-Digest-Manifest: ").append(manifestHash).append("\r\n\r\n")

      for ((name, hash) in digestMap) {
        certSfSb.append("Name: ").append(name).append("\r\n")
        certSfSb.append("SHA-256-Digest: ").append(hash).append("\r\n\r\n")
      }

      val certSfBytes = certSfSb.toString().toByteArray(Charsets.UTF_8)

      // 3. Cryptographic RSA Key Pair Signature
      val keyGen = KeyPairGenerator.getInstance("RSA")
      keyGen.initialize(1024)
      val keyPair = keyGen.generateKeyPair()

      val sig = Signature.getInstance("SHA256withRSA")
      sig.initSign(keyPair.private)
      sig.update(certSfBytes)
      val signatureData = sig.sign()

      entryMap["META-INF/MANIFEST.MF"] = manifestBytes
      entryMap["META-INF/CERT.SF"] = certSfBytes
      entryMap["META-INF/CERT.RSA"] = signatureData

      // 4. Output Complete Signed Binary APK File
      val zos = ZipOutputStream(java.io.FileOutputStream(targetApkFile))
      for ((name, data) in entryMap) {
        val newEntry = ZipEntry(name)
        zos.putNextEntry(newEntry)
        zos.write(data, 0, data.size)
        zos.closeEntry()
      }
      zos.close()

      val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", targetApkFile)
      launchPackageInstallerDirectly(context, apkUri, promise)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("BUILD_ERROR", e.message)
    }
  }

  private fun patchAxmlPackageName(axmlBytes: ByteArray, oldPkg: String, newPkg: String): ByteArray {
    if (oldPkg.length != newPkg.length) return axmlBytes

    val oldUtf16 = oldPkg.toByteArray(Charsets.UTF_16LE)
    val newUtf16 = newPkg.toByteArray(Charsets.UTF_16LE)
    var result = replaceBytes(axmlBytes, oldUtf16, newUtf16)

    val oldUtf8 = oldPkg.toByteArray(Charsets.UTF_8)
    val newUtf8 = newPkg.toByteArray(Charsets.UTF_8)
    result = replaceBytes(result, oldUtf8, newUtf8)

    return result
  }

  private fun replaceBytes(source: ByteArray, target: ByteArray, replacement: ByteArray): ByteArray {
    val result = source.clone()
    val tSize = target.size
    if (tSize == 0 || result.size < tSize) return result

    for (i in 0..(result.size - tSize)) {
      var match = true
      for (j in 0 until tSize) {
        if (result[i + j] != target[j]) {
          match = false
          break
        }
      }
      if (match) {
        for (j in 0 until tSize) {
          result[i + j] = replacement[j]
        }
      }
    }
    return result
  }

  private fun launchPackageInstallerDirectly(context: ReactApplicationContext, apkUri: Uri, promise: Promise) {
    val intent = Intent(Intent.ACTION_VIEW).apply {
      setDataAndType(apkUri, "application/vnd.android.package-archive")
      flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
    }

    context.startActivity(intent)
    promise.resolve("INSTALL_PROMPT_OPENED")
  }
}
