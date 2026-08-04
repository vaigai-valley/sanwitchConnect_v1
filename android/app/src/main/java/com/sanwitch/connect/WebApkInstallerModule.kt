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
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
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

      val targetApkFile = File(context.cacheDir, "${appName.lowercase().replace(Regex("[^a-z0-9]"), "_")}.apk")

      // 2. HTTPS Network Download Pipeline (with binary APK verification)
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

          // Fallthrough: Package using pre-compiled lightweight APK template
          injectHtmlAndLaunchApk(context, appName, targetApkFile, htmlPayload ?: "", promise)
        }.start()
        return
      }

      // 3. Primary Pre-compiled APK Template Packaging Engine
      injectHtmlAndLaunchApk(context, appName, targetApkFile, htmlPayload ?: "", promise)
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }

  private fun injectHtmlAndLaunchApk(context: ReactApplicationContext, appName: String, targetApkFile: File, htmlContent: String, promise: Promise) {
    try {
      val templateStream: InputStream? = try {
        context.assets.open("standalone_template.apk")
      } catch (e: Exception) {
        null
      }

      if (templateStream != null) {
        val zis = ZipInputStream(templateStream)
        val zos = ZipOutputStream(java.io.FileOutputStream(targetApkFile))

        var entry: ZipEntry? = zis.nextEntry
        val buffer = ByteArray(4096)

        while (entry != null) {
          val newEntry = ZipEntry(entry.name)
          zos.putNextEntry(newEntry)

          if (entry.name == "assets/index.html" && htmlContent.isNotBlank()) {
            val htmlBytes = htmlContent.toByteArray(Charsets.UTF_8)
            zos.write(htmlBytes, 0, htmlBytes.size)
          } else {
            var count: Int
            while (zis.read(buffer).also { count = it } != -1) {
              zos.write(buffer, 0, count)
            }
          }
          zos.closeEntry()
          zis.closeEntry()
          entry = zis.nextEntry
        }
        zis.close()
        zos.close()

        val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", targetApkFile)
        val intent = Intent(Intent.ACTION_VIEW).apply {
          setDataAndType(apkUri, "application/vnd.android.package-archive")
          flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        promise.resolve("INSTALL_PROMPT_OPENED")
      } else {
        launchBaseApkPackageInstaller(context, appName, targetApkFile, promise)
      }
    } catch (e: Exception) {
      e.printStackTrace()
      launchBaseApkPackageInstaller(context, appName, targetApkFile, promise)
    }
  }

  private fun launchBaseApkPackageInstaller(context: ReactApplicationContext, appName: String, targetApkFile: File, promise: Promise) {
    try {
      val baseApkPath = context.applicationInfo.sourceDir
      val baseApkFile = File(baseApkPath)

      if (baseApkFile.exists()) {
        baseApkFile.copyTo(targetApkFile, overwrite = true)
        val apkUri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", targetApkFile)
        val intent = Intent(Intent.ACTION_VIEW).apply {
          setDataAndType(apkUri, "application/vnd.android.package-archive")
          flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        promise.resolve("INSTALL_PROMPT_OPENED")
      } else {
        promise.reject("BUILD_ERROR", "Unable to locate base APK binary template for $appName")
      }
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("BUILD_ERROR", e.message)
    }
  }
}
