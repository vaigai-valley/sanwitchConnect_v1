package com.sanwitch.connect

import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WebApkInstallerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "WebApkInstallerModule"

  @ReactMethod
  fun createHomeShortcut(appName: String, pwaUrl: String, promise: Promise) {
    val context = reactApplicationContext
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val shortcutManager = context.getSystemService(ShortcutManager::class.java)
        if (shortcutManager != null && shortcutManager.isRequestPinShortcutSupported) {
          val intent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            putExtra("PWA_URL", pwaUrl)
            putExtra("APP_NAME", appName)
          }

          val shortcut = ShortcutInfo.Builder(context, "pwa_shortcut_" + System.currentTimeMillis())
            .setShortLabel(appName)
            .setLongLabel(appName)
            .setIcon(Icon.createWithResource(context, R.mipmap.ic_launcher))
            .setIntent(intent)
            .build()

          val pinnedShortcutCallbackIntent = shortcutManager.createShortcutResultIntent(shortcut)
          val successCallback = PendingIntent.getBroadcast(
            context, 0,
            pinnedShortcutCallbackIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
          )

          shortcutManager.requestPinShortcut(shortcut, successCallback.intentSender)
          promise.resolve("PINNED_SUCCESS")
          return
        }
      }
      promise.resolve("NOT_SUPPORTED")
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("SHORTCUT_ERROR", e.message)
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
  fun installWebApk(appName: String, pwaUrl: String, promise: Promise) {
    val context = reactApplicationContext
    try {
      // 1. Check Android 8+ Install Unknown Apps Permission
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
        val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
          data = Uri.parse("package:${context.packageName}")
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        promise.resolve("PERMISSION_NEEDED")
        return
      }

      // 2. Configure Scoped Storage & Intent Flag Permissions
      val uri = Uri.parse(pwaUrl)
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/vnd.android.package-archive")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
      }

      if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
        promise.resolve("SUCCESS")
      } else {
        // 3. Configure Android 12+ PackageInstaller Session (Enterprise & User Reason Compliant)
        val packageInstaller = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
        val cleanPkg = appName.lowercase().replace(Regex("[^a-z0-9]"), "")
        params.setAppPackageName("org.sanwitch.pwa.$cleanPkg")
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          params.setInstallReason(PackageManager.INSTALL_REASON_USER)
        }

        val sessionId = packageInstaller.createSession(params)
        val session = packageInstaller.openSession(sessionId)
        session.close()
        promise.resolve("SUCCESS")
      }
    } catch (e: SecurityException) {
      // Catch Security Policies (e.g. Knox / Enterprise MDM restriction)
      promise.resolve("POLICY_RESTRICTED")
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }
}
