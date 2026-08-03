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
      // 1. Android 8.0+ Native System Pinning Prompt ("Add to Home Screen / Install App")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val shortcutManager = context.getSystemService(ShortcutManager::class.java)
        if (shortcutManager != null && shortcutManager.isRequestPinShortcutSupported) {
          val intent = Intent(Intent.ACTION_VIEW, Uri.parse(if (pwaUrl.startsWith("http")) pwaUrl else "https://sanwitch.vaigaivalley.workers.dev")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
          }

          val shortcutId = "sanwitch_app_" + appName.lowercase().replace(Regex("[^a-z0-9]"), "_")
          val shortcut = ShortcutInfo.Builder(context, shortcutId)
            .setShortLabel(appName)
            .setLongLabel("Sanwitch - $appName")
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
          promise.resolve("PROMPT_SHOWN")
          return
        }
      }

      // 2. WebAPK Browser Minting Fallback (triggers Chrome "Install App" prompt)
      if (pwaUrl.startsWith("http")) {
        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(pwaUrl)).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(browserIntent)
        promise.resolve("BROWSER_OPENED")
        return
      }

      promise.resolve("NOT_SUPPORTED")
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject("INSTALL_ERROR", e.message)
    }
  }
}
