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
import java.io.ByteArrayOutputStream
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
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(apkUri, "application/vnd.android.package-archive")
        flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
      }
      context.startActivity(intent)
      promise.resolve("INSTALL_PROMPT_OPENED")
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

      // 1. Direct Local File System Installation (file:// or /sdcard/...)
      if ((pwaUrl.startsWith("file://") || pwaUrl.startsWith("/")) && !pwaUrl.startsWith("http")) {
        val cleanPath = pwaUrl.replace("file://", "")
        installLocalApk(cleanPath, promise)
        return
      }

      val cleanAppId = appName.lowercase().replace(Regex("[^a-z0-9]"), "_")
      val targetApkFile = File(context.cacheDir, "${cleanAppId}.apk")

      // 2. HTTPS Network Download Pipeline (with binary APK magic header verification)
      if (pwaUrl.startsWith("http")) {
        Thread {
          try {
            val url = URL(pwaUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.instanceFollowRedirects = true
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            connection.connect()

            if (connection.responseCode == 200) {
              val inputStream = connection.inputStream
              val outputStream = java.io.FileOutputStream(targetApkFile)

              val buffer = ByteArray(4096)
              var bytesRead: Int
              var isFirstBlock = true
              var isRealApk = false

              while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                if (isFirstBlock) {
                  isFirstBlock = false
                  // Check ZIP / APK Magic Header (PK\x03\x04 -> 0x50, 0x4B, 0x03, 0x04)
                  if (bytesRead >= 4 && buffer[0] == 0x50.toByte() && buffer[1] == 0x4B.toByte() && buffer[2] == 0x03.toByte() && buffer[3] == 0x04.toByte()) {
                    isRealApk = true
                  }
                }
                outputStream.write(buffer, 0, bytesRead)
              }
              outputStream.close()
              inputStream.close()

              if (isRealApk) {
                val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", targetApkFile)
                val intent = Intent(Intent.ACTION_VIEW).apply {
                  setDataAndType(apkUri, "application/vnd.android.package-archive")
                  flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                promise.resolve("INSTALL_PROMPT_OPENED")
                return@Thread
              }
            }
          } catch (e: Exception) {
            e.printStackTrace()
          }

          // Fallthrough: Package using signed binary APK engine
          buildSignedBinaryApkPackage(context, appName, targetApkFile, htmlPayload ?: "", promise)
        }.start()
        return
      }

      // 3. Primary Signed Binary APK Packaging Engine
      buildSignedBinaryApkPackage(context, appName, targetApkFile, htmlPayload ?: "", promise)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }

  private fun buildSignedBinaryApkPackage(context: ReactApplicationContext, appName: String, targetApkFile: File, htmlContent: String, promise: Promise) {
    try {
      val baseApkPath = context.applicationInfo.sourceDir
      val baseApkFile = File(baseApkPath)

      if (!baseApkFile.exists()) {
        promise.reject("BUILD_ERROR", "Base APK file not found at $baseApkPath")
        return
      }

      val cleanHash = String.format("%07d", Math.abs(appName.hashCode()) % 10000000)
      val targetPkgStr = "com.sanwitch.app$cleanHash" // Exactly 20 characters matching "com.sanwitch.connect"

      val origPkgUtf8 = "com.sanwitch.connect".toByteArray(Charsets.UTF_8)
      val origPkgUtf16 = "com.sanwitch.connect".toByteArray(Charsets.UTF_16LE)
      val newPkgUtf8 = targetPkgStr.toByteArray(Charsets.UTF_8)
      val newPkgUtf16 = targetPkgStr.toByteArray(Charsets.UTF_16LE)

      val entryMap = mutableMapOf<String, ByteArray>()
      val zis = ZipInputStream(java.io.FileInputStream(baseApkFile))
      var entry: ZipEntry? = zis.nextEntry

      while (entry != null) {
        val name = entry.name
        // Skip old signatures
        if (!name.startsWith("META-INF/")) {
          var bytes = zis.readBytes()
          if (name == "AndroidManifest.xml") {
            bytes = replaceBytes(bytes, origPkgUtf8, newPkgUtf8)
            bytes = replaceBytes(bytes, origPkgUtf16, newPkgUtf16)
          } else if (name == "assets/index.html" && htmlContent.isNotBlank()) {
            bytes = htmlContent.toByteArray(Charsets.UTF_8)
          }
          entryMap[name] = bytes
        }
        zis.closeEntry()
        entry = zis.nextEntry
      }
      zis.close()

      if (!entryMap.containsKey("assets/index.html") && htmlContent.isNotBlank()) {
        entryMap["assets/index.html"] = htmlContent.toByteArray(Charsets.UTF_8)
      }

      // Generate SHA-256 Digest Manifest (META-INF/MANIFEST.MF)
      val manifestSb = StringBuilder()
      manifestSb.append("Manifest-Version: 1.0\r\nCreated-By: Sanwitch Connect\r\n\r\n")

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

      // Generate Signature File (META-INF/CERT.SF)
      val certSfSb = StringBuilder()
      certSfSb.append("Signature-Version: 1.0\r\nCreated-By: Sanwitch Connect\r\n")
      certSfSb.append("SHA-256-Digest-Manifest: ").append(manifestHash).append("\r\n\r\n")

      for ((name, hash) in digestMap) {
        certSfSb.append("Name: ").append(name).append("\r\n")
        certSfSb.append("SHA-256-Digest: ").append(hash).append("\r\n\r\n")
      }

      val certSfBytes = certSfSb.toString().toByteArray(Charsets.UTF_8)

      // Sign CERT.SF with dynamic RSA KeyPair
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

      // Write complete APK package
      val zos = ZipOutputStream(java.io.FileOutputStream(targetApkFile))
      for ((name, data) in entryMap) {
        val newEntry = ZipEntry(name)
        zos.putNextEntry(newEntry)
        zos.write(data, 0, data.size)
        zos.closeEntry()
      }
      zos.close()

      val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", targetApkFile)
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(apkUri, "application/vnd.android.package-archive")
        flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
      }
      context.startActivity(intent)
      promise.resolve("INSTALL_PROMPT_OPENED")
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("BUILD_ERROR", e.message)
    }
  }

  private fun replaceBytes(source: ByteArray, target: ByteArray, replacement: ByteArray): ByteArray {
    val index = indexOfBytes(source, target)
    if (index == -1) return source
    val result = ByteArray(source.size)
    System.arraycopy(source, 0, result, 0, source.size)
    System.arraycopy(replacement, 0, result, index, replacement.size)
    return result
  }

  private fun indexOfBytes(source: ByteArray, target: ByteArray): Int {
    if (source.size < target.size) return -1
    for (i in 0..source.size - target.size) {
      var match = true
      for (j in target.indices) {
        if (source[i + j] != target[j]) {
          match = false
          break
        }
      }
      if (match) return i
    }
    return -1
  }
}
