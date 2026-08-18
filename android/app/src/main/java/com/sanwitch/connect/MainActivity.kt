package com.sanwitch.connect

import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  private var splashOverlayView: View? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme)
    super.onCreate(null)
    setupNativeSplashLauncher()
  }

  private fun setupNativeSplashLauncher() {
    try {
      val rootView = window.decorView.findViewById<ViewGroup>(android.R.id.content)
      splashOverlayView = layoutInflater.inflate(R.layout.launch_screen, rootView, false)
      rootView.addView(splashOverlayView)

      val stage1View = splashOverlayView?.findViewById<LinearLayout>(R.id.stage1View)
      val stage2View = splashOverlayView?.findViewById<LinearLayout>(R.id.stage2View)

      // Stage 1 (0.0s - 1.8s): Vaigai Valley
      stage1View?.visibility = View.VISIBLE
      stage2View?.visibility = View.GONE

      // Stage 2 (1.8s - 3.6s): CRUD
      Handler(Looper.getMainLooper()).postDelayed({
        stage1View?.visibility = View.GONE
        stage2View?.visibility = View.VISIBLE
      }, 1800)

      // Stage 3 (3.6s+): Remove Native Splash Overlay
      Handler(Looper.getMainLooper()).postDelayed({
        splashOverlayView?.let { overlay ->
          (overlay.parent as? ViewGroup)?.removeView(overlay)
        }
      }, 3600)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              super.invokeDefaultOnBackPressed()
          }
          return
      }
      super.invokeDefaultOnBackPressed()
  }
}
