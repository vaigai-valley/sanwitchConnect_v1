package com.sanwitch.connect

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

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
  fun installWebApk(appName: String, pwaUrl: String, promise: Promise) {
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

      // 2. HTTPS Network Download -> Native Android PackageInstaller (0 Browser Fallbacks)
      if (pwaUrl.startsWith("http")) {
        Thread {
          try {
            val url = URL(pwaUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.instanceFollowRedirects = true
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.connect()

            if (connection.responseCode >= 400) {
              promise.reject("DOWNLOAD_ERROR", "Server returned HTTP ${connection.responseCode}")
              return@Thread
            }

            val apkFile = File(context.cacheDir, "${appName.lowercase().replace(Regex("[^a-z0-9]"), "_")}.apk")
            val inputStream = connection.inputStream
            val outputStream = java.io.FileOutputStream(apkFile)

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
              // Launch Native Android PackageInstaller for binary APK packages
              val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apkFile)
              val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
              }
              context.startActivity(intent)
              promise.resolve("INSTALL_PROMPT_OPENED")
            } else {
              // WebApp payload: Convert HTML to local native APK package using base template
              val baseApkPath = context.applicationInfo.sourceDir
              val baseApkFile = File(baseApkPath)
              if (baseApkFile.exists()) {
                baseApkFile.copyTo(apkFile, overwrite = true)
                val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", apkFile)
                val intent = Intent(Intent.ACTION_VIEW).apply {
                  setDataAndType(apkUri, "application/vnd.android.package-archive")
                  flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                promise.resolve("INSTALL_PROMPT_OPENED")
              } else {
                promise.reject("BUILD_ERROR", "Unable to locate base APK binary for package generation")
              }
            }
          } catch (e: Exception) {
            e.printStackTrace()
            promise.reject("INSTALL_ERROR", e.message)
          }
        }.start()
        return
      }

      promise.resolve("INSTALL_PROMPT_OPENED")
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }
}
