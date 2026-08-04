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
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyPair
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
      val payload = if (!htmlPayload.isNullOrBlank()) htmlPayload else ""
      buildLocalSignedApk(context, appName, targetApkFile, payload, promise)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }

  private fun getOrCreatePersistentKeyPair(context: ReactApplicationContext): KeyPair {
    val keyFile = File(context.filesDir, "sanwitch_compiler_key.dat")
    if (keyFile.exists()) {
      try {
        java.io.ObjectInputStream(java.io.FileInputStream(keyFile)).use { ois ->
          return ois.readObject() as KeyPair
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }

    val keyGen = KeyPairGenerator.getInstance("RSA")
    keyGen.initialize(1024)
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
    // Check if custom template file exists in app internal storage (/files/full_template.apk)
    val customFile = File(context.filesDir, "full_template.apk")
    if (customFile.exists()) {
      return java.io.FileInputStream(customFile)
    }

    // Default to fully compiled installed app package for 100% valid classes.dex & PackageParser success
    val baseApkPath = context.applicationInfo.sourceDir
    return java.io.FileInputStream(File(baseApkPath))
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
      val zis = ZipInputStream(baseInputStream)
      var entry: ZipEntry? = zis.nextEntry

      while (entry != null) {
        val name = entry.name
        // Preserve clean AXML binary structure & resources.arsc match. Skip heavy native lib/ for lightweight PWA APK compilation.
        val shouldSkipLib = !isHermesBytecode && name.startsWith("lib/")
        if (!name.startsWith("META-INF/") && !shouldSkipLib) {
          var bytes = zis.readBytes()
          if (name == "assets/index.html" && payloadStr.isNotBlank() && !isHermesBytecode) {
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

      // 3. Persistent Cryptographic RSA Key Pair Signature
      val keyPair = getOrCreatePersistentKeyPair(context)

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

  private fun launchPackageInstallerDirectly(context: ReactApplicationContext, apkUri: Uri, promise: Promise) {
    val intent = Intent(Intent.ACTION_VIEW).apply {
      setDataAndType(apkUri, "application/vnd.android.package-archive")
      flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
    }

    context.startActivity(intent)
    promise.resolve("INSTALL_PROMPT_OPENED")
  }
}
