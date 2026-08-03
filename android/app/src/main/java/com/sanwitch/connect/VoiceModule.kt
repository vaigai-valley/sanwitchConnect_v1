package com.sanwitch.connect

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

class VoiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private var speechRecognizer: SpeechRecognizer? = null

  override fun getName(): String {
    return "VoiceModule"
  }

  @ReactMethod
  fun startListening(promise: Promise) {
    Handler(Looper.getMainLooper()).post {
      try {
        if (speechRecognizer != null) {
          try {
            speechRecognizer?.stopListening()
            speechRecognizer?.destroy()
          } catch (e: Exception) {}
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactApplicationContext)
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
          putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
          putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
          putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
          putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        }

        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
          override fun onReadyForSpeech(params: Bundle?) {
            sendEvent("onSpeechStart", null)
          }

          override fun onBeginningOfSpeech() {}
          override fun onRmsChanged(rmsdB: Float) {}
          override fun onBufferReceived(buffer: ByteArray?) {}
          override fun onEndOfSpeech() {
            sendEvent("onSpeechEnd", null)
          }

          override fun onError(error: Int) {
            val map = Arguments.createMap().apply { putInt("error", error) }
            sendEvent("onSpeechError", map)
          }

          override fun onResults(results: Bundle?) {
            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (matches != null && matches.isNotEmpty()) {
              val transcript = matches[0]
              val map = Arguments.createMap().apply {
                putString("value", transcript)
              }
              sendEvent("onSpeechResults", map)
            }
          }

          override fun onPartialResults(partialResults: Bundle?) {
            val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (matches != null && matches.isNotEmpty()) {
              val transcript = matches[0]
              val map = Arguments.createMap().apply {
                putString("value", transcript)
              }
              sendEvent("onSpeechPartialResults", map)
            }
          }

          override fun onEvent(eventType: Int, params: Bundle?) {}
        })

        speechRecognizer?.startListening(intent)
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("VOICE_ERROR", e.message)
      }
    }
  }

  @ReactMethod
  fun stopListening(promise: Promise) {
    Handler(Looper.getMainLooper()).post {
      try {
        speechRecognizer?.stopListening()
        speechRecognizer?.destroy()
        speechRecognizer = null
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("STOP_ERROR", e.message)
      }
    }
  }

  private fun sendEvent(eventName: String, params: WritableMap?) {
    try {
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, params)
    } catch (e: Exception) {}
  }
}
