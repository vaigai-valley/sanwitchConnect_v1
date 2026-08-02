package com.sanwitch.connect

import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WebApkInstallerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "WebApkInstallerModule"

  @ReactMethod
  fun installWebApk(appName: String, pwaUrl: String) {
    val context = reactApplicationContext
    try {
      // Direct Android PackageInstaller / Package Archive Intent (No Shortcut API)
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(Uri.parse(pwaUrl), "application/vnd.android.package-archive")
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
      }
      if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
      } else {
        // Fallback: Register PackageInstaller Session for Android WebAPK
        val packageInstaller = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
        val cleanPkg = appName.lowercase().replace(Regex("[^a-z0-9]"), "")
        params.setAppPackageName("org.sanwitch.pwa.$cleanPkg")
        val sessionId = packageInstaller.createSession(params)
        val session = packageInstaller.openSession(sessionId)
        session.close()
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }
}
