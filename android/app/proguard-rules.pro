# Add project specific ProGuard rules here.
# React Native & Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.HybridData { *; }

# Expo Modules
-keep class expo.modules.** { *; }
-keep class expo.modules.core.** { *; }

# Sanwitch Connect Native Modules & WebApk Installer
-keep class com.sanwitch.connect.** { *; }
-keepclassmembers class com.sanwitch.connect.** { *; }

# Android WebKit & WebView
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native methods and JNI bindings
-keepclasseswithmembernames class * {
    native <methods>;
}

# Kotlin Coroutines & Reflection
-dontwarn kotlin.**
-dontwarn kotlinx.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn okhttp3.**
-dontwarn okio.**
