package com.sanwitch.connect

import android.content.Context
import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ShortcutModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "ShortcutModule"

  @ReactMethod
  fun pinShortcut(appName: String) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val context = reactApplicationContext
      val shortcutManager = context.getSystemService(ShortcutManager::class.java)
      if (shortcutManager != null && shortcutManager.isRequestPinShortcutSupported) {
        val intent = Intent(context, MainActivity::class.java).apply {
          action = Intent.ACTION_MAIN
          putExtra("APP_NAME", appName)
        }
        val pinShortcutInfo = ShortcutInfo.Builder(context, "sanwitch_app_${System.currentTimeMillis()}")
          .setShortLabel(appName)
          .setLongLabel(appName)
          .setIcon(Icon.createWithResource(context, R.mipmap.ic_launcher))
          .setIntent(intent)
          .build()

        shortcutManager.requestPinShortcut(pinShortcutInfo, null)
      }
    }
  }
}
