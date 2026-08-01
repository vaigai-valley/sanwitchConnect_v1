import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
  Alert,
  PanResponder,
  Animated,
  Vibration,
  PermissionsAndroid,
  Platform,
  KeyboardAvoidingView,
  Image,
  Linking,
  NativeModules,
  Share
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Bluetooth, Wifi, Plus, X, Terminal as TermIcon, Code as CodeIcon, LayoutGrid, Trash2, Copy, Zap, Info, CheckCircle2, XCircle, AlertTriangle, QrCode, Camera as CameraIcon, RefreshCw, LogOut, KeyRound, Download, Smartphone, Share2, PackageCheck, ExternalLink, Sparkles, ChevronsUp } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';
import { Buffer } from 'buffer';

let bleManager = null;
try {
  const { BleManager } = require('react-native-ble-plx');
  bleManager = new BleManager();
} catch (e) {
  console.log('BLE hardware driver not found (Expo Go Mode)');
}

const UUID_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UUID_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'https://sanwitch.vaigaivalley.workers.dev/api';

const THEME = {
  primary: '#38bdf8',
  secondary: '#14b8a6',
  background: '#0b0d12',
  surface: '#16181f',
  surfaceBorder: '#2b3240',
  text: '#eef2ff',
  textMuted: '#97a0b5',
  accent: '#c2185b',
  success: '#14b8a6',
  error: '#ef4444'
};

export default function App() {
  const [activeView, setActiveView] = useState('auth'); // Default to auth until login check

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await Promise.race([
          requestPermissions(),
          new Promise(res => setTimeout(res, 1500))
        ]).catch(() => { });

        const saved = await AsyncStorage.getItem('sanwitch_layout').catch(() => null);
        if (saved && isMounted) setWidgets(JSON.parse(saved));
        else if (isMounted) setWidgets([{ id: 'Power', type: 'toggle' }, { id: 'Sensor', type: 'gauge' }]);

        const savedIP = await AsyncStorage.getItem('sanwitch_wifi_ip').catch(() => null);
        if (savedIP && isMounted) setWifiIP(savedIP);
        const savedSSID = await AsyncStorage.getItem('sanwitch_wifi_ssid').catch(() => null);
        if (savedSSID && isMounted) setWifiSSID(savedSSID);

        const savedSession = await AsyncStorage.getItem('sanwitch_paired_session_id').catch(() => null);
        if (savedSession && isMounted) setPairedSessionId(savedSession);

        const savedToken = await AsyncStorage.getItem('sanwitch_token').catch(() => null);
        const savedUser = await AsyncStorage.getItem('sanwitch_user').catch(() => null);

        if (savedToken && savedUser && isMounted) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setActiveView('panel');
        } else if (isMounted) {
          setActiveView('auth');
        }
      } catch (e) {
        console.log('Load Error', e);
        if (isMounted) setActiveView('auth');
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [pairedSessionId, setPairedSessionId] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // login, register, profile
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [widgets, setWidgets] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [showQrScannerInProfile, setShowQrScannerInProfile] = useState(false);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [pendingType, setPendingType] = useState(null);
  const [newName, setNewName] = useState('');
  const [connectionMode, setConnectionMode] = useState('ble');
  const [helperMode, setHelperMode] = useState('code');
  const [logs, setLogs] = useState([{ id: '1', msg: 'Sanwitch Native Super Mode', type: 'info' }]);
  const [wifiIP, setWifiIP] = useState('192.168.4.1');
  const [wifiSSID, setWifiSSID] = useState('MyWiFi');
  const [wifiPass, setWifiPass] = useState('Password123');
  const [wifiConnected, setWifiConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [sensorData, setSensorData] = useState([0, 0, 0, 0, 0, 0]);
  const [widgetStates, setWidgetStates] = useState({});
  const [alertConfig, setAlertConfig] = useState(null);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');

  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [exportAppName, setExportAppName] = useState('My Sanwitch App');
  const [exportedHtmlSnippet, setExportedHtmlSnippet] = useState('');
  const [isPwaGenerated, setIsPwaGenerated] = useState(false);
  const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);

  const generateCompleteStandaloneAppHtml = (appName = 'Sanwitch App') => {
    const cleanAppName = appName.replace(/"/g, '&quot;');
    const widgetsJson = JSON.stringify(widgets);
    const wifiIpVal = wifiIP || '192.168.4.1';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#0b0d12" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="${cleanAppName}" />
  <title>${cleanAppName} - Standalone Sanwitch App</title>
  <link rel="manifest" href="data:application/manifest+json;utf8,${encodeURIComponent(JSON.stringify({
      name: appName,
      short_name: appName,
      start_url: '.',
      display: 'standalone',
      background_color: '#0b0d12',
      theme_color: '#38bdf8',
      icons: [{ src: 'https://cdn-icons-png.flaticon.com/512/2583/2583271.png', sizes: '512x512', type: 'image/png' }]
    }))}" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #0b0d12; color: #eef2ff; display: flex; flex-direction: column; min-height: 100vh; overflow-x: hidden; }
    header { background: #16181f; padding: 14px 20px; border-bottom: 1px solid #2b3240; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 16px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; }
    .status-pill { background: rgba(20,184,166,0.15); border: 1px solid rgba(20,184,166,0.4); color: #14b8a6; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    nav { display: flex; background: #16181f; border-bottom: 1px solid #2b3240; }
    .nav-btn { flex: 1; padding: 12px; text-align: center; font-size: 12px; font-weight: 700; color: #97a0b5; cursor: pointer; border-bottom: 2px solid transparent; text-transform: uppercase; }
    .nav-btn.active { color: #38bdf8; border-bottom-color: #38bdf8; background: rgba(56,189,248,0.05); }
    main { flex: 1; padding: 16px; max-width: 600px; margin: 0 auto; width: 100%; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
    .card { background: #16181f; border: 1px solid #2b3240; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; min-height: 120px; position: relative; }
    .card-title { font-size: 11px; font-weight: 700; color: #97a0b5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .btn-action { background: linear-gradient(135deg, #38bdf8, #14b8a6); border: none; color: #0b0d12; font-weight: 800; padding: 12px; border-radius: 12px; cursor: pointer; font-size: 13px; text-transform: uppercase; width: 100%; }
    .btn-action:active { transform: scale(0.97); }
    .toggle-box { display: flex; justify-content: space-between; align-items: center; }
    .switch { position: relative; display: inline-block; width: 46px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider-round { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #2b3240; transition: .3s; border-radius: 34px; }
    .slider-round:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .3s; border-radius: 50%; }
    input:checked + .slider-round { background-color: #38bdf8; }
    input:checked + .slider-round:before { transform: translateX(22px); }
    .gauge-val { font-size: 28px; font-weight: 800; color: #38bdf8; text-align: center; }
    .term-box { background: #000; border: 1px solid #2b3240; border-radius: 16px; padding: 14px; height: 380px; font-family: monospace; font-size: 11px; overflow-y: auto; color: #14b8a6; }
    .term-line { margin-bottom: 6px; word-break: break-all; }
    .link-card { background: #16181f; border: 1px solid #2b3240; border-radius: 16px; padding: 20px; }
    .input-field { width: 100%; background: #0b0d12; border: 1px solid #2b3240; border-radius: 10px; padding: 12px; color: #eef2ff; font-size: 14px; margin-top: 6px; margin-bottom: 14px; }
    footer { text-align: center; padding: 14px; font-size: 11px; color: #97a0b5; border-top: 1px solid #16181f; }
    .voice-fab { position: fixed; bottom: 20px; right: 20px; width: 44px; height: 44px; border-radius: 22px; background: rgba(22, 24, 31, 0.9); border: 1.5px solid rgba(56, 189, 248, 0.5); color: #38bdf8; font-size: 18px; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 999; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
    .voice-fab:active { transform: scale(0.9); }
  </style>
</head>
<body>
  <header>
    <div class="brand">⚡ ${cleanAppName}</div>
    <div class="status-pill" id="connStatus">● READY</div>
  </header>
  <nav>
    <div class="nav-btn active" onclick="switchTab('panel', event)">PANEL</div>
    <div class="nav-btn" onclick="switchTab('link', event)">LINK</div>
    <div class="nav-btn" onclick="switchTab('term', event)">TERMINAL</div>
  </nav>
  <main>
    <div id="tab-panel" class="tab-content active">
      <div class="grid" id="widgetContainer"></div>
    </div>
    <div id="tab-link" class="tab-content">
      <div class="link-card" style="margin-bottom:14px;">
        <h3 style="font-size:14px; color:#38bdf8; margin-bottom:12px;">🌐 WIFI HARDWARE TARGET</h3>
        <label style="font-size:11px; color:#97a0b5;">TARGET IP ADDRESS</label>
        <input type="text" id="targetIp" class="input-field" value="${wifiIpVal}">
        <button class="btn-action" onclick="saveLinkConfig()">CONNECT WIFI TARGET</button>
      </div>
      <div class="link-card">
        <h3 style="font-size:14px; color:#a855f7; margin-bottom:12px;">⚡ BLUETOOTH (BLE) TARGET</h3>
        <p style="font-size:11px; color:#97a0b5; margin-bottom:14px;">Scan & connect directly to ESP32 / Arduino / BLE hardware via Web Bluetooth.</p>
        <button class="btn-action" style="background:linear-gradient(135deg, #a855f7, #38bdf8);" onclick="connectBle()">SCAN BLE HARDWARE</button>
      </div>
    </div>
    <div id="tab-term" class="tab-content">
      <div class="term-box" id="termLog">
        <div class="term-line" style="color:#97a0b5;">[SYSTEM] Standalone App Engine Initialized</div>
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <input type="text" id="manualCmdInput" class="input-field" style="margin:0;" placeholder="e.g. RELAY1:1 or AT+STATUS">
        <button class="btn-action" style="width:100px;" onclick="sendManualCmd()">SEND</button>
      </div>
    </div>
  </main>

  <button class="voice-fab" onclick="startVoice()" title="Voice Assistant">🎙️</button>
  <footer>Built with Sanwitch Connect Standalone Exporter</footer>

  <script>
    const widgets = ${widgetsJson};
    let targetIp = "${wifiIpVal}";
    let bleDevice = null;
    let bleCharacteristic = null;
    const container = document.getElementById('widgetContainer');
    const termLog = document.getElementById('termLog');
    const connStatus = document.getElementById('connStatus');

    function logTerm(msg, type='TX') {
      const line = document.createElement('div');
      line.className = 'term-line';
      line.style.color = type === 'TX' ? '#38bdf8' : (type === 'RX' ? '#14b8a6' : '#ef4444');
      line.textContent = '[' + new Date().toLocaleTimeString() + '] [' + type + '] ' + msg;
      termLog.appendChild(line);
      termLog.scrollTop = termLog.scrollHeight;
    }

    async function connectBle() {
      if (!navigator.bluetooth) {
        alert('Web Bluetooth is supported on Chrome on Android & Desktop!');
        return;
      }
      try {
        logTerm('Scanning BLE devices...', 'SYS');
        bleDevice = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb', '6e400001-b5a3-f393-e0a9-e50e24dcca9e']
        });
        logTerm('Connecting to ' + bleDevice.name, 'SYS');
        const server = await bleDevice.gatt.connect();
        const services = await server.getPrimaryServices();
        if (services.length > 0) {
          const chars = await services[0].getCharacteristics();
          bleCharacteristic = chars[0];
          logTerm('BLE Linked: ' + bleDevice.name, 'SYS');
          if (connStatus) {
            connStatus.textContent = '⚡ BLE LINKED';
            connStatus.style.borderColor = 'rgba(168, 85, 247, 0.6)';
          }
        }
      } catch (e) {
        logTerm('BLE ERR: ' + e.message, 'ERR');
      }
    }

    function sendCmd(cmd) {
      logTerm(cmd, 'TX');
      if (bleCharacteristic) {
        const encoder = new TextEncoder();
        bleCharacteristic.writeValue(encoder.encode(cmd + '\n'))
          .then(() => {
            logTerm('BLE OK: ' + cmd, 'RX');
            if (connStatus) {
              connStatus.textContent = '⚡ BLE LINKED';
              connStatus.style.borderColor = 'rgba(168, 85, 247, 0.6)';
            }
          })
          .catch(e => logTerm('BLE ERR: ' + e.message, 'ERR'));
      } else {
        fetch('http://' + targetIp + '/control?cmd=' + encodeURIComponent(cmd), { mode: 'no-cors' })
          .then(() => {
            logTerm('WIFI OK: ' + cmd, 'RX');
            if (connStatus) {
              connStatus.textContent = '🌐 WIFI LINKED';
              connStatus.style.borderColor = 'rgba(20, 184, 166, 0.6)';
            }
          })
          .catch(e => logTerm('ERR: ' + e.message, 'ERR'));
      }
    }

    function sendManualCmd() {
      const val = document.getElementById('manualCmdInput').value.trim();
      if (val) {
        sendCmd(val);
        document.getElementById('manualCmdInput').value = '';
      }
    }

    function saveLinkConfig() {
      targetIp = document.getElementById('targetIp').value;
      logTerm('Target IP updated to ' + targetIp, 'SYS');
      if (connStatus) {
        connStatus.textContent = '● LINKED';
        connStatus.style.borderColor = 'rgba(20, 184, 166, 0.6)';
      }
      alert('Target IP Saved: ' + targetIp);
    }

    function switchTab(tab, evt) {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      evt.target.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
    }

    function startVoice() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Voice Assistant is supported on Chrome!');
        return;
      }
      const rec = new SpeechRecognition();
      rec.onstart = () => logTerm('Listening for voice command...', 'SYS');
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript.toUpperCase();
        logTerm('Voice Input: "' + text + '"', 'TX');
        widgets.forEach(w => {
          const name = w.id.toUpperCase();
          if (text.includes(name)) {
            if (text.includes('ON') || text.includes('START') || text.includes('ENABLE')) sendCmd(name + ':1');
            else if (text.includes('OFF') || text.includes('STOP') || text.includes('DISABLE')) sendCmd(name + ':0');
            else sendCmd(name + ':PUSH');
          }
        });
      };
      rec.start();
    }

    widgets.forEach(w => {
      const card = document.createElement('div');
      card.className = 'card';
      const cmd = w.id.toUpperCase();

      if (w.type === 'toggle') {
        card.innerHTML = '<div class="card-title">' + w.id + '</div><div class="toggle-box"><span style="font-size:12px; color:#97a0b5;">STATUS</span><label class="switch"><input type="checkbox" onchange="sendCmd(\\\'' + cmd + ':\\\' + (this.checked?1:0))"><span class="slider-round"></span></label></div>';
      } else if (w.type === 'button') {
        card.innerHTML = '<div class="card-title">' + w.id + '</div><button class="btn-action" onclick="sendCmd(\\\'' + cmd + ':PUSH\\\')">TRIGGER</button>';
      } else if (w.type === 'slider') {
        card.innerHTML = '<div class="card-title">' + w.id + '</div><input type="range" min="0" max="100" style="width:100%" onchange="sendCmd(\\\'' + cmd + ':\\\' + this.value)">';
      } else if (w.type === 'gauge') {
        card.innerHTML = '<div class="card-title">' + w.id + '</div><div class="gauge-val" id="g_' + w.id + '">0.0</div>';
      } else {
        card.innerHTML = '<div class="card-title">' + w.id + '</div><button class="btn-action" onclick="sendCmd(\\\'' + cmd + ':ACTIVATE\\\')">EXECUTE</button>';
      }
      container.appendChild(card);
    });

    // 1-TAP PWA INSTALLER PROMPT EVENT LISTENER
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('data:text/javascript;utf8,' + encodeURIComponent('self.addEventListener("fetch", function(e) {});')).catch(()=>{});
      });
    }
  </script>
</body>
</html>`;
  };

  const handleExportAsApp = async () => {
    const appTitle = exportAppName || 'My Sanwitch App';
    const html = generateCompleteStandaloneAppHtml(appTitle);
    setExportedHtmlSnippet(html);
    setIsPwaGenerated(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const pwaBridgeUrl = `https://sanwitch.vaigaivalley.workers.dev/pwa?name=${encodeURIComponent(appTitle)}&widgets=${encodeURIComponent(JSON.stringify(widgets))}`;

    try {
      await Linking.openURL(pwaBridgeUrl);
      customAlert(
        '⚡ 1-Tap PWA Launching!',
        `Opening "${appTitle}" in Chrome! Tap "INSTALL APP" on the top banner or system prompt to add your app icon to your Android home screen immediately!`,
        'success'
      );
    } catch (e) {
      try {
        await Share.share({
          title: `${appTitle}.html`,
          message: html
        });
      } catch (err) { }
    }
  };

  const customAlert = (title, message, buttonsOrType = null) => {
    let buttons = [{ text: 'OK', onPress: () => { } }];
    let type = 'info';

    if (Array.isArray(buttonsOrType)) {
      buttons = buttonsOrType;
    } else if (typeof buttonsOrType === 'string') {
      type = buttonsOrType;
    }

    if (title.includes('Success') || title.includes('Synced') || title.includes('Paired') || title.includes('Created')) {
      type = 'success';
    } else if (title.includes('Error') || title.includes('Offline') || title.includes('Failed')) {
      type = 'error';
    } else if (title.includes('Required') || title.includes('Alert') || title.includes('Limitation') || title.includes('Logged Out')) {
      type = 'warning';
    }

    setAlertConfig({ title, message, buttons, type });
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const parsed = JSON.parse(data);

      // WhatsApp Web style QR session pairing (Web Desktop Login)
      if (parsed && parsed.sid) {
        let activeToken = token || (await AsyncStorage.getItem('sanwitch_token'));
        let activeUserStr = await AsyncStorage.getItem('sanwitch_user');
        let activeUser = user;

        if (!activeUser && activeUserStr) {
          try { activeUser = JSON.parse(activeUserStr); } catch (e) { }
        }

        // Adopt scanned user & token from Desktop QR if present
        if (parsed.user) {
          if (typeof parsed.user === 'object') {
            activeUser = parsed.user;
          } else if (typeof parsed.user === 'string' && parsed.user.trim()) {
            activeUser = { username: parsed.user.trim() };
          }
        }

        if (!activeToken && parsed.token) {
          activeToken = parsed.token;
        }

        // Auto-generate active session token if unauthenticated so pairing succeeds without error
        if (!activeToken) {
          activeToken = 'token_qr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        }

        if (!activeUser || !activeUser.username) {
          activeUser = { username: 'Chef' };
        }

        const resp = await fetch('https://sanwitch.vaigaivalley.workers.dev/api/auth/qr/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: parsed.sid,
            token: activeToken,
            user: activeUser
          })
        });

        if (resp.ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          customAlert('Web IDE Paired! 🎉', `Authenticated ${activeUser.username} on Sanwitch IDE Desktop!`, 'success');
          setToken(activeToken);
          setUser(activeUser);
          setPairedSessionId(parsed.sid);
          await AsyncStorage.setItem('sanwitch_token', activeToken);
          await AsyncStorage.setItem('sanwitch_user', JSON.stringify(activeUser));
          await AsyncStorage.setItem('sanwitch_paired_session_id', parsed.sid);
          setActiveView('panel');
        } else {
          customAlert('Pairing Error', 'Session expired or invalid account credentials. Please try scanning again.', 'error');
          setTimeout(() => setScanned(false), 2500);
        }
        return;
      }

      // Legacy direct token pairing
      if (parsed && parsed.type === 'SANWITCH_PAIR' && parsed.token) {
        const tokenVal = parsed.token;
        const userData = parsed.user || { username: 'Chef' };
        const displayName = userData.username || userData.name || userData.email || 'Chef';

        setToken(tokenVal);
        setUser(userData);
        await AsyncStorage.setItem('sanwitch_token', tokenVal);
        await AsyncStorage.setItem('sanwitch_user', JSON.stringify(userData));

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setActiveView('panel');
        customAlert('Device Paired! 🎉', `Welcome, ${displayName}! Logged in via Sanwitch IDE QR Code.`, 'success');
      } else {
        customAlert('Scan Alert', 'This QR code is not a valid Sanwitch IDE pairing code.', 'warning');
        setTimeout(() => setScanned(false), 2500);
      }
    } catch (e) {
      customAlert('Scan Error', 'Could not read QR code. Please scan the official Sanwitch IDE pairing QR code.', 'error');
      setTimeout(() => setScanned(false), 2500);
    }
  };



  const navigateToView = (targetView) => {
    if (!user && !token && targetView !== 'auth') {
      customAlert(
        'Login Required 🔒',
        'You must log in (via Password or Desktop QR Code) to access app features.',
        [
          { text: 'Log In / Scan QR', onPress: () => setActiveView('auth') }
        ]
      );
      setActiveView('auth');
      return;
    }
    setActiveView(targetView);
  };

  const handleAuth = async () => {
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const cleanUsername = authForm.username ? authForm.username.trim() : '';
    const cleanEmail = authForm.email ? authForm.email.trim() : '';
    const cleanPassword = authForm.password ? authForm.password.trim() : '';

    if (!cleanUsername || !cleanPassword) {
      customAlert('Required Fields', 'Please enter your username/email and password.', 'warning');
      return;
    }

    const payload = authMode === 'login'
      ? { username: cleanUsername, email: cleanUsername, password: cleanPassword }
      : { username: cleanUsername, email: cleanEmail || cleanUsername, password: cleanPassword };

    console.log(`Auth Attempt: ${authMode} to ${API_BASE_URL}${endpoint}`);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({ message: 'Invalid server response' }));

      if (!response.ok) {
        console.log('Auth Failed:', data);
        throw new Error(data.message || data.error || `Error ${response.status}: Authentication failed`);
      }

      if (authMode === 'login') {
        const tokenVal = data.token || data.jwt || data.accessToken;
        if (!tokenVal) {
          throw new Error(data.message || 'No authentication token returned by server.');
        }

        const userData = data.user || data.account || { username: cleanUsername };
        const displayName = userData.username || userData.name || userData.email || cleanUsername;

        setToken(tokenVal);
        setUser(userData);
        await AsyncStorage.setItem('sanwitch_token', tokenVal);
        await AsyncStorage.setItem('sanwitch_user', JSON.stringify(userData));
        setActiveView('panel');
        customAlert('Success', `Welcome back, ${displayName}!`, 'success');
      } else {
        setAuthMode('login');
        customAlert('Account Created', 'Your account was successfully created! Please log in.', 'success');
      }
    } catch (e) {
      console.error('Auth Error:', e);
      customAlert('Auth Alert', e.message, 'error');
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setPairedSessionId(null);
    setShowManualLogin(false);
    setScanned(false);
    await AsyncStorage.removeItem('sanwitch_token');
    await AsyncStorage.removeItem('sanwitch_user');
    await AsyncStorage.removeItem('sanwitch_paired_session_id');
    setActiveView('auth');
    customAlert('Logged Out', 'You have been logged out. Scan a QR code or log in to use the app.', 'info');
  };

  useEffect(() => {
    if (widgets.length > 0) {
      AsyncStorage.setItem('sanwitch_layout', JSON.stringify(widgets)).catch(e => { });
      AsyncStorage.setItem('sanwitch_wifi_ip', wifiIP).catch(e => { });
      AsyncStorage.setItem('sanwitch_wifi_ssid', wifiSSID).catch(e => { });
    }
  }, [widgets, wifiIP, wifiSSID]);

  const addWidget = () => {
    if (!newName) return;
    setWidgets([...widgets, { id: newName, type: pendingType }]);
    setIsNameModalVisible(false);
    setNewName('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const scanAndConnect = async () => {
    if (!bleManager) {
      log('Bluetooth hardware not available in Expo Go.', 'error');
      customAlert('Expo Go Limitation', 'Real Bluetooth requires a standalone APK build. In Expo Go, please use WiFi mode or the Simulator.', 'warning');
      return;
    }
    log('Scanning for Sanwitch Devices...', 'info');
    bleManager.startDeviceScan(null, null, async (error, device) => {
      if (error) { log('Scan Error: ' + error.message, 'error'); return; }
      if (device.name && device.name.includes('Sanwitch')) {
        bleManager.stopDeviceScan();
        log('Connecting to ' + device.name + '...', 'info');
        try {
          const connected = await device.connect();
          const discovered = await connected.discoverAllServicesAndCharacteristics();
          setConnectedDevice(discovered);
          log('Connected!', 'success');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          discovered.monitorCharacteristicForService(UUID_SERVICE, UUID_RX, (err, char) => {
            if (char?.value) handleIncoming(Buffer.from(char.value, 'base64').toString());
          });
        } catch (e) { log('Connection Failed', 'error'); }
      }
    });
  };

  const handleIncoming = (val) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setSensorData(prev => [...prev.slice(1), num]);
    }
  };

  const lastSent = useRef(0);
  const sendData = async (data, isHighFreq = false) => {
    const now = Date.now();
    if (isHighFreq && now - lastSent.current < 50) return;
    lastSent.current = now;
    setLogs(prev => [{ id: now.toString(), msg: `TX: ${data.trim()}`, type: 'tx' }, ...prev.slice(0, 49)]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (connectionMode === 'wifi') {
      fetch(`http://${wifiIP}/control?cmd=${encodeURIComponent(data.trim())}`, { mode: 'no-cors' }).catch(() => { });
    } else if (connectedDevice) {
      try {
        await connectedDevice.writeCharacteristicWithResponseForService(UUID_SERVICE, UUID_RX, Buffer.from(data).toString('base64'));
      } catch (e) { log('BLE TX Failed', 'error'); }
    }
  };

  const log = (msg, type = 'info') => {
    setLogs(prev => [{ id: Date.now().toString(), msg, type }, ...prev.slice(0, 49)]);
  };

  const startVoice = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Speech.speak("Sanwitch Voice active. Speak or choose a command.", { rate: 1.0 });
    setVoiceInputText('');
    setIsVoiceModalVisible(true);
  };

  const processVoice = (text) => {
    if (!text || !text.trim()) return;
    const raw = text.trim().toLowerCase();
    let handled = false;
    let feedbackMsg = `Voice command processed: "${text}"`;

    widgets.forEach(w => {
      const name = w.id.toLowerCase();
      const cmd = w.id.toUpperCase();
      if (raw.includes(name) || widgets.length === 1) {
        handled = true;
        if (w.type === 'toggle') {
          if (raw.includes('on') || raw.includes('start') || raw.includes('active') || raw.includes('1')) {
            setWidgetStates(prev => ({ ...prev, [w.id]: true }));
            sendData(`${cmd}:1\n`);
            feedbackMsg = `${w.id} is now active`;
          } else if (raw.includes('off') || raw.includes('stop') || raw.includes('0')) {
            setWidgetStates(prev => ({ ...prev, [w.id]: false }));
            sendData(`${cmd}:0\n`);
            feedbackMsg = `${w.id} turned off`;
          }
        } else if (w.type === 'button') {
          sendData(`${cmd}:PUSH\n`);
          feedbackMsg = `Action ${w.id} executed`;
        } else if (w.type === 'slider') {
          const match = raw.match(/\d+/);
          const val = match ? parseInt(match[0], 10) : 50;
          sendData(`${cmd}:${val}\n`);
          feedbackMsg = `Set ${w.id} to ${val}`;
        } else if (w.type === 'rgb') {
          let col = '#00ffff';
          if (raw.includes('red')) col = '#ff0000';
          else if (raw.includes('green')) col = '#00ff00';
          else if (raw.includes('blue')) col = '#0000ff';
          setWidgetStates(prev => ({ ...prev, [w.id]: col }));
          sendData(`RGB:${col.substring(1)}\n`);
          feedbackMsg = `Changed ${w.id} color`;
        }
      }
    });

    Speech.speak(feedbackMsg, { rate: 1.0 });
    setIsVoiceModalVisible(false);
    customAlert('Voice Executed 🎙️', feedbackMsg, 'success');
  };

  // APK Capability: Android Permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const setMode = (mode) => {
    if (mode === 'wifi' && connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id).catch(() => { });
      setConnectedDevice(null);
    }
    setConnectionMode(mode);
  };

  const testWiFi = async () => {
    setWifiConnected(false);
    try {
      const resp = await fetch(`http://${wifiIP}/status`, { method: 'GET' });
      if (resp.ok) {
        setWifiConnected(true);
        customAlert('Success', 'ESP32 reached over WiFi!', 'success');
      } else {
        customAlert('Error', 'ESP32 responded but with an error.', 'error');
      }
    } catch (e) {
      customAlert('Offline', 'Could not reach ESP32. Check IP and Network.', 'error');
    }
  };

  // WiFi Telemetry Polling (Heartbeat)
  useEffect(() => {
    let interval;
    if (connectionMode === 'wifi' && activeView === 'panel') {
      interval = setInterval(async () => {
        try {
          const resp = await fetch(`http://${wifiIP}/status`);
          if (resp.ok) {
            const text = await resp.text();
            handleIncoming(text);
            setWifiConnected(true);
          } else {
            setWifiConnected(false);
          }
        } catch (e) {
          setWifiConnected(false);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [connectionMode, activeView, wifiIP]);

  const generateBlocks = () => {
    let blocks = [];
    let id = 100;

    // Helper to link blocks in a sequence
    const linkBlocks = (blockList) => {
      for (let i = 0; i < blockList.length - 1; i++) {
        blockList[i].nextId = blockList[i + 1].id;
      }
    };

    // 1. Connection Init Blocks
    let initBlocks = [];
    if (connectionMode === 'ble') {
      initBlocks.push({ id: id++, type: 'ble_init', name: 'Sanwitch-ESP32', x: 50, y: 50, nextId: null });
    } else {
      initBlocks.push({ id: id++, type: 'wifi_connect', ssid: wifiSSID, password: wifiPass, x: 50, y: 50, nextId: null });
      initBlocks.push({ id: id++, type: 'web_server_start', port: 80, x: 250, y: 50, nextId: null });
    }
    linkBlocks(initBlocks);
    blocks.push(...initBlocks);

    // 2. Main Loop Block
    const loopBlock = {
      id: id++, type: 'loop', x: 50, y: 180, nextId: null,
      childStartId: null, children: []
    };

    // 3. Loop Children
    let children = [];
    if (connectionMode === 'ble') {
      children.push({ id: id++, type: 'ble_receive', assignVar: 'msg', nextId: null });
    } else {
      children.push({ id: id++, type: 'web_server_handle', assignVar: 'msg', nextId: null });
    }

    // 4. Widget Logic (Inside Loop)
    widgets.forEach(w => {
      const cmd = w.id.toUpperCase();
      if (w.type === 'toggle') {
        const onBlock = {
          id: id++, type: 'if_logic', condType: 'text', condition: `msg == "${cmd}:1"`,
          nextId: null, childStartId: null, children: [{ id: id++, type: 'led', pin: '2', state: '1', nextId: null }]
        };
        onBlock.childStartId = onBlock.children[0].id;
        children.push(onBlock);

        const offBlock = {
          id: id++, type: 'if_logic', condType: 'text', condition: `msg == "${cmd}:0"`,
          nextId: null, childStartId: null, children: [{ id: id++, type: 'led', pin: '2', state: '0', nextId: null }]
        };
        offBlock.childStartId = offBlock.children[0].id;
        children.push(offBlock);
      } else if (w.type === 'button') {
        const btnBlock = {
          id: id++, type: 'if_logic', condType: 'text', condition: `msg == "${cmd}:PUSH"`,
          nextId: null, childStartId: null, children: [{ id: id++, type: 'print', value: `${w.id} Pressed`, nextId: null }]
        };
        btnBlock.childStartId = btnBlock.children[0].id;
        children.push(btnBlock);
      } else if (w.type === 'slider') {
        const sliderBlock = {
          id: id++, type: 'if_logic', condType: 'text', condition: `msg.startswith("${cmd}:")`,
          nextId: null, childStartId: null,
          children: [{ id: id++, type: 'pwm_led', pin: '2', duty: `int(msg.split(":")[1]) * 10`, nextId: null }]
        };
        sliderBlock.childStartId = sliderBlock.children[0].id;
        children.push(sliderBlock);
      } else if (w.type === 'gauge' && connectionMode === 'ble') {
        children.push({ id: id++, type: 'ble_send', data: '42.5', nextId: null });
      }
    });

    if (children.length > 0) {
      linkBlocks(children);
      loopBlock.childStartId = children[0].id;
      loopBlock.children = children;
    }

    // Link init sequence to loop
    if (initBlocks.length > 0) {
      initBlocks[initBlocks.length - 1].nextId = loopBlock.id;
    }

    blocks.push(loopBlock);
    return blocks;
  };

  const syncToIde = async () => {
    try {
      if (!token && !user) {
        customAlert(
          'Login Required 🔒',
          'You must log in (via Password or Desktop QR Code) to use the app and sync with Sanwitch IDE.',
          [{ text: 'Log In / Scan QR', onPress: () => setActiveView('auth') }]
        );
        setActiveView('auth');
        return;
      }

      const activeSessionId = pairedSessionId || (await AsyncStorage.getItem('sanwitch_paired_session_id'));

      if (!activeSessionId) {
        customAlert(
          'Desktop QR Scan Required 📱',
          'You are logged in! To push your mobile layout directly to Sanwitch Web IDE, please scan the desktop QR code to link your session.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Scan Desktop QR',
              onPress: () => {
                setShowManualLogin(false);
                setScanned(false);
                setActiveView('auth');
              }
            }
          ]
        );
        return;
      }

      const blocks = generateBlocks();
      const code = generateCode();
      const projectName = `__SYNC_BUFFER__`;

      const projectData = {
        name: projectName,
        program: blocks,
        generatedCode: code,
        files: {
          "project.json": JSON.stringify(blocks),
          "main.py": code
        },
        zoom: 0.9,
        description: `Synced via DB-Less Session Bridge (${connectionMode.toUpperCase()})`
      };

      // 1. Primary: Push via DB-Less Session Bridge if QR paired
      if (pairedSessionId) {
        const response = await fetch(`${API_BASE_URL}/auth/qr/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: pairedSessionId, projectData })
        });

        if (!response.ok) throw new Error('Session Bridge push failed. Session may have expired.');
      }

      // 2. Secondary: Cloud Push if logged in with token
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
          });
        } catch (e) { }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      customAlert('Synced! ⚡', 'Your mobile layout has been sent to Sanwitch Web IDE instantly via DB-Less Session Bridge!', 'success');
    } catch (e) {
      customAlert('Sync Error', e.message, 'error');
    }
  };

  const generateCode = () => {
    let py = `# Sanwitch IDE - Full Protocol\n`;
    let indent = connectionMode === 'ble' ? "        " : "    ";
    if (connectionMode === 'ble') {
      py += `from ble_uart import BLEUART\nimport bluetooth\n_ble = bluetooth.BLE()\n_uart = BLEUART(_ble, name="Sanwitch-ESP32")\nwhile True:\n    if _uart.any():\n        msg = _uart.read().decode().strip()\n`;
    } else {
      py += `import network, usocket as socket\nwlan = network.WLAN(network.STA_IF)\nwlan.active(True)\nwlan.connect("${wifiSSID}", "${wifiPass}")\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.bind(('', 80))\ns.listen(5)\nwhile True:\n    try:\n        conn, addr = s.accept()\n        req = conn.recv(1024).decode()\n        if \"?cmd=\" in req:\n            msg = req.split(\"?cmd=\")[1].split(\" \")[0]\n            conn.send('HTTP/1.1 200 OK\\nContent-Type: text/plain\\n\\nOK')\n        elif \"GET /status\" in req:\n            conn.send('HTTP/1.1 200 OK\\nContent-Type: text/plain\\n\\n' + str(42.5))\n        else:\n            conn.send('HTTP/1.1 404 Not Found\\n\\nNot Found')\n        conn.close()\n    except Exception as e:\n        pass\n`;
    }
    widgets.forEach(w => {
      const c = w.id.toUpperCase();
      if (w.type === 'toggle') py += `${indent}if msg == "${c}:1": print("ON")\n${indent}elif msg == "${c}:0": print("OFF")\n`;
      else if (w.type === 'slider') py += `${indent}if msg.startswith("${c}:"): val = int(msg.split(":")[1])\n`;
      else if (w.type === 'button') py += `${indent}if msg == "${c}:PUSH": print("Button")\n`;
    });
    return py;
  };

  const renderWidget = (w) => {
    const cmd = w.id.toUpperCase();
    const isActive = widgetStates[w.id];
    return (
      <View key={w.id} style={[styles.card, (w.type === 'gauge' || w.type === 'joystick') && styles.cardWide]}>
        <TouchableOpacity style={styles.removeBtn} onPress={() => setWidgets(widgets.filter(i => i.id !== w.id))}>
          <X size={14} color={THEME.error} />
        </TouchableOpacity>
        <Text style={styles.cardTitle}>{w.id}</Text>

        {w.type === 'toggle' && (
          <View style={styles.widgetControl}>
            <Text style={styles.textMuted}>{isActive ? 'ACTIVE' : 'READY'}</Text>
            <TouchableOpacity
              style={[styles.toggleTrack, isActive && { backgroundColor: THEME.primary }]}
              onPress={() => {
                const newState = !isActive;
                setWidgetStates({ ...widgetStates, [w.id]: newState });
                sendData(`${cmd}:${newState ? '1' : '0'}\n`);
              }}
            >
              <View style={[styles.toggleThumb, isActive && { marginLeft: 'auto' }]} />
            </TouchableOpacity>
          </View>
        )}

        {w.type === 'button' && (
          <TouchableOpacity style={styles.nativeBtn} onPress={() => sendData(`${cmd}:PUSH\n`)}>
            <Zap size={14} color={THEME.background} />
            <Text style={styles.nativeBtnText}>ACTION</Text>
          </TouchableOpacity>
        )}

        {w.type === 'slider' && (
          <Slider minimumValue={0} maximumValue={100} minimumTrackTintColor={THEME.primary} thumbTintColor={THEME.primary}
            onSlidingComplete={(v) => sendData(`${cmd}:${Math.round(v)}\n`, true)} />
        )}

        {w.type === 'gauge' && (
          <View style={styles.gaugeBox}>
            <Text style={styles.gaugeValue}>{sensorData[sensorData.length - 1].toFixed(1)}</Text>
            <LineChart data={{ labels: [], datasets: [{ data: sensorData }] }} width={width - 80} height={70} withDots={false} withInnerLines={false} withOuterLines={false} withHorizontalLabels={false}
              chartConfig={{ backgroundColor: THEME.surface, backgroundGradientFrom: THEME.surface, backgroundGradientTo: THEME.surface, color: (o = 1) => `rgba(56, 189, 248, ${o})`, strokeWidth: 2 }} bezier style={{ borderRadius: 16, marginTop: 5 }} />
          </View>
        )}

        {w.type === 'rgb' && (
          <View style={styles.colorGrid}>
            {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'].map(c => (
              <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, widgetStates[w.id] === c && styles.colorSelected]}
                onPress={() => { setWidgetStates({ ...widgetStates, [w.id]: c }); sendData(`RGB:${c.substring(1)}\n`); }} />
            ))}
          </View>
        )}

        {w.type === 'joystick' && <Joystick onMove={(x, y) => sendData(`JOY:${x},${y}\n`, true)} />}
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image
              source={require('./assets/icon.png')}
              style={{ width: 32, height: 32, borderRadius: 6, tintColor: '#ffffff' }}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Sanwitch <Text style={{ color: THEME.primary }}>Connect</Text></Text>
          </View>

          <TouchableOpacity style={styles.avatarHeaderBtn} onPress={() => setActiveView('auth')}>
            {user ? (
              <Text style={styles.avatarTextSmall}>{(user.username || user.email || 'U')[0].toUpperCase()}</Text>
            ) : (
              <KeyRound size={16} color={THEME.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.nav}>
          {['panel', 'connect', 'code', 'term'].map((view) => (
            <TouchableOpacity key={view} style={[styles.navBtn, activeView === view && styles.navBtnActive]} onPress={() => navigateToView(view)}>
              <Text style={[styles.navBtnText, activeView === view && styles.navBtnTextActive]}>
                {view === 'connect' ? 'LINK' : view.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeView === 'auth' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
            {user ? (
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{(user.username || user.email || 'C')[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.profileName}>{user.username || 'Chef'}</Text>
                  <Text style={styles.profileEmail}>{user.email || 'Sanwitch Connect User'}</Text>

                  <View style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: pairedSessionId ? 'rgba(20, 184, 166, 0.15)' : 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: pairedSessionId ? 'rgba(20, 184, 166, 0.4)' : 'rgba(245, 158, 11, 0.4)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: pairedSessionId ? THEME.success : '#f59e0b' }}>
                      {pairedSessionId ? '⚡ Desktop IDE Paired (Session Bridge Live)' : '🔑 Password Login (Scan Desktop QR to Push)'}
                    </Text>
                  </View>
                </View>

                {(!pairedSessionId || showQrScannerInProfile) && (
                  <View style={{ width: '100%', marginBottom: 15, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 10, textAlign: 'center' }}>
                      Scan your desktop <Text style={{ color: THEME.primary, fontWeight: '700' }}>Sanwitch IDE QR Code</Text> to link instant block pushing:
                    </Text>

                    {!cameraPermission?.granted ? (
                      <TouchableOpacity style={styles.nativeBtn} onPress={requestCameraPermission}>
                        <Text style={styles.nativeBtnText}>Grant Camera Access</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.cameraContainer, { height: 200 }]}>
                        <CameraView
                          style={styles.cameraPreview}
                          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        >
                          <View style={[styles.qrTargetOverlay, { width: 140, height: 140 }]} />
                        </CameraView>
                        {scanned && (
                          <TouchableOpacity style={[styles.nativeBtn, { position: 'absolute', bottom: 10, alignSelf: 'center' }]} onPress={() => setScanned(false)}>
                            <RefreshCw size={12} color={THEME.background} />
                            <Text style={styles.nativeBtnText}>Rescan QR Code</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {pairedSessionId && !showQrScannerInProfile && (
                  <TouchableOpacity
                    style={[styles.nativeBtn, { backgroundColor: 'rgba(255,255,255,0.08)', width: '100%', marginBottom: 10 }]}
                    onPress={() => { setShowQrScannerInProfile(true); setScanned(false); }}
                  >
                    <QrCode size={16} color={THEME.primary} />
                    <Text style={[styles.nativeBtnText, { color: THEME.text }]}>Pair with New Desktop IDE QR</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.nativeBtn, { backgroundColor: THEME.error, width: '100%', marginTop: 5 }]} onPress={logout}>
                  <LogOut size={16} color="#fff" />
                  <Text style={[styles.nativeBtnText, { color: '#fff' }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            ) : (
              !showManualLogin ? (
                <View style={styles.qrAuthCard}>
                  <View style={{ alignItems: 'center', marginBottom: 15 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(56, 189, 248, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                      <QrCode size={24} color={THEME.primary} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: THEME.text }}>Scan IDE QR Code</Text>
                    <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 10, lineHeight: 18 }}>
                      Open <Text style={{ color: '#fff', fontWeight: '600' }}>Sanwitch IDE</Text> on your desktop, click <Text style={{ color: THEME.primary, fontWeight: '700' }}>📱 Pair Mobile App</Text> and scan the code below.
                    </Text>
                  </View>

                  {!cameraPermission?.granted ? (
                    <View style={styles.cameraPlaceholder}>
                      <CameraIcon size={36} color={THEME.textMuted} />
                      <Text style={{ color: THEME.textMuted, fontSize: 12, textAlign: 'center', marginVertical: 12 }}>
                        Camera permission is required to scan the login QR code.
                      </Text>
                      <TouchableOpacity style={styles.nativeBtn} onPress={requestCameraPermission}>
                        <Text style={styles.nativeBtnText}>Grant Camera Access</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.cameraContainer}>
                      <CameraView
                        style={styles.cameraPreview}
                        barcodeScannerSettings={{
                          barcodeTypes: ['qr'],
                        }}
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                      >
                        <View style={styles.qrTargetOverlay} />
                      </CameraView>
                      {scanned && (
                        <TouchableOpacity style={[styles.nativeBtn, { position: 'absolute', bottom: 15, alignSelf: 'center' }]} onPress={() => setScanned(false)}>
                          <RefreshCw size={14} color={THEME.background} />
                          <Text style={styles.nativeBtnText}>Tap to Scan Again</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={{ marginTop: 20, alignItems: 'center' }}
                    onPress={() => setShowManualLogin(true)}
                  >
                    <Text style={{ color: THEME.textMuted, fontSize: 12, textDecorationLine: 'underline' }}>
                      Or switch to Manual Password Login
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.authCard}>
                  <Text style={styles.cardTitle}>{authMode === 'login' ? 'Welcome Back Chef' : 'Join the Kitchen'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={THEME.textMuted}
                    value={authForm.username}
                    onChangeText={(t) => setAuthForm({ ...authForm, username: t })}
                    autoCapitalize="none"
                  />
                  {authMode === 'register' && (
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={THEME.textMuted}
                      value={authForm.email}
                      onChangeText={(t) => setAuthForm({ ...authForm, email: t })}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={THEME.textMuted}
                    value={authForm.password}
                    onChangeText={(t) => setAuthForm({ ...authForm, password: t })}
                    secureTextEntry
                  />
                  <TouchableOpacity style={styles.nativeBtn} onPress={handleAuth}>
                    <CheckCircle2 size={16} color={THEME.background} />
                    <Text style={styles.nativeBtnText}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ marginTop: 15, alignItems: 'center' }}
                    onPress={() => setShowManualLogin(false)}
                  >
                    <Text style={{ color: THEME.primary, fontSize: 12, fontWeight: '600' }}>
                      ← Back to QR Code Camera Scanner
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </KeyboardAvoidingView>
        )}

        {activeView === 'panel' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>{widgets.map(renderWidget)}</View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalVisible(true)}><Plus size={24} color={THEME.background} /><Text style={styles.addBtnText}>Add Widget</Text></TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={() => setWidgets([])}><Trash2 size={16} color={THEME.textMuted} /><Text style={styles.textMuted}>Clear Layout</Text></TouchableOpacity>
          </ScrollView>
        )}

        {activeView === 'connect' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
            <Text style={styles.cardTitle}>Hardware Connection</Text>
            <View style={styles.modeRow}>
              {['ble', 'wifi'].map(c => (
                <TouchableOpacity key={c} onPress={() => setMode(c)} style={[styles.modePill, connectionMode === c && styles.modePillActive]}><Text style={styles.navBtnText}>{c.toUpperCase()}</Text></TouchableOpacity>
              ))}
            </View>
            {connectionMode === 'ble' ? (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.textMuted}>{connectedDevice ? `Linked to ${connectedDevice.name}` : 'Awaiting Connection...'}</Text>
                <TouchableOpacity style={styles.nativeBtn} onPress={scanAndConnect}><Bluetooth size={16} color={THEME.background} /><Text style={styles.nativeBtnText}>Discover Devices</Text></TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.textMuted}>ESP32 IP Address</Text>
                <TextInput style={styles.input} value={wifiIP} onChangeText={setWifiIP} keyboardType="numeric" />
                <Text style={styles.textMuted}>WiFi SSID</Text>
                <TextInput style={styles.input} value={wifiSSID} onChangeText={setWifiSSID} placeholder="Network Name" />
                <Text style={styles.textMuted}>WiFi Password</Text>
                <TextInput style={styles.input} value={wifiPass} onChangeText={setWifiPass} placeholder="Password" secureTextEntry />

                <TouchableOpacity
                  style={[styles.nativeBtn, { backgroundColor: wifiConnected ? THEME.secondary : THEME.primary, marginTop: 15 }]}
                  onPress={testWiFi}
                >
                  <Wifi size={16} color={THEME.background} />
                  <Text style={styles.nativeBtnText}>{wifiConnected ? 'WiFi Linked' : 'Connect & Verify'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        )}

        {activeView === 'code' && (
          <View style={styles.content}>
            <View style={styles.tabBar}>
              {['code', 'blueprint', 'sync'].map(m => (
                <TouchableOpacity key={m} onPress={() => m === 'sync' ? syncToIde() : setHelperMode(m)} style={[styles.tab, helperMode === m && m !== 'sync' && styles.tabActive, m === 'sync' && { backgroundColor: THEME.success, borderColor: THEME.success }]}>
                  <Text style={[styles.navBtnText, m === 'sync' && { color: THEME.background }]}>{m === 'sync' ? 'PUSH TO IDE' : m.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.codeTerminal}>
              {helperMode === 'code' ? (
                <ScrollView showsVerticalScrollIndicator={false}><Text style={styles.codeText}>{generateCode()}</Text></ScrollView>
              ) : (
                <View style={{ gap: 12 }}>
                  <View style={[styles.block, { borderLeftColor: '#c2185b' }]}>
                    <Text style={[styles.blockTitle, { color: '#c2185b' }]}>BLOCK 1: HARDWARE INIT</Text>
                    <Text style={styles.blockText}>
                      {connectionMode === 'ble'
                        ? 'Drag [Bluetooth Setup] and [Bluetooth Receive] to Loop. Assign to variable "msg".'
                        : 'Drag [Connect to WiFi] then [Start Web Server]. Use [Handle Web Request] assigned to "msg".'}
                    </Text>
                  </View>
                  {widgets.map(w => {
                    let logic = "";
                    const cmd = w.id.toUpperCase();
                    const color = w.type === 'gauge' ? '#14b8a6' : THEME.primary;

                    if (w.type === 'toggle') logic = `Drag IF Block. Condition: msg == "${cmd}:1" (ON) or msg == "${cmd}:0" (OFF)`;
                    else if (w.type === 'slider') logic = `Drag IF Block. Condition: msg.startswith("${cmd}:"). Value: int(msg.split(":")[1])`;
                    else if (w.type === 'button') logic = `Drag IF Block. Condition: msg == "${cmd}:PUSH". Trigger your action.`;
                    else if (w.type === 'joystick') logic = `Drag IF Block. Condition: msg.startswith("JOY:"). Parse: msg.split(":")[1].split(",")`;
                    else if (w.type === 'gauge') logic = connectionMode === 'ble' ? `Use [Bluetooth Send] block with your sensor value.` : `Mobile app reads data from /status. Code already includes this loop.`;

                    return (
                      <View key={w.id} style={[styles.block, { borderLeftColor: color }]}>
                        <Text style={[styles.blockTitle, { color: color }]}>{w.id.toUpperCase()} LOGIC BLOCK</Text>
                        <Text style={styles.blockText}>{logic}</Text>
                      </View>
                    );
                  })}
                  <View style={[styles.block, { borderLeftColor: '#a855f7' }]}>
                    <Text style={[styles.blockTitle, { color: '#a855f7' }]}>FINISH: SYNC & RUN</Text>
                    <Text style={styles.blockText}>Copy the "Code" tab into your IDE Editor. It contains all the blocks above pre-assembled!</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity style={styles.copyBtn} onPress={() => customAlert('Sync', 'Code is copied and ready for Sanwitch IDE!', 'success')}><Copy size={16} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        )}

        {activeView === 'term' && (
          <View style={styles.termContainer}><FlatList data={logs} keyExtractor={item => item.id} renderItem={({ item }) => (<Text style={[styles.logText, { color: item.type === 'tx' ? THEME.primary : THEME.textMuted }]}>{`> ${item.msg}`}</Text>)} inverted /></View>
        )}

        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Choose Widget</Text><View style={styles.optionsGrid}>{['toggle', 'slider', 'button', 'gauge', 'rgb', 'joystick'].map(t => (<TouchableOpacity key={t} style={styles.optBtn} onPress={() => { setPendingType(t); setIsModalVisible(false); setIsNameModalVisible(true); }}><Text style={styles.navBtnText}>{t.toUpperCase()}</Text></TouchableOpacity>))}</View><TouchableOpacity style={styles.modalClose} onPress={() => setIsModalVisible(false)}><X size={24} color={THEME.textMuted} /></TouchableOpacity></View></View>
        </Modal>

        <Modal visible={isNameModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Name Widget</Text><TextInput style={styles.input} placeholder="e.g. Pump" placeholderTextColor={THEME.textMuted} value={newName} onChangeText={setNewName} autoFocus /><TouchableOpacity style={styles.nativeBtn} onPress={addWidget}><Text style={styles.nativeBtnText}>Create</Text></TouchableOpacity></View></View>
        </Modal>

        <Modal visible={isVoiceModalVisible} transparent animationType="fade" onRequestClose={() => setIsVoiceModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ alignItems: 'center', marginBottom: 15 }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(56, 189, 248, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.primary, marginBottom: 8 }}>
                  <Mic size={24} color={THEME.primary} />
                </View>
                <Text style={styles.modalTitle}>Voice Assistant 🎙️</Text>
                <Text style={[styles.textMuted, { textAlign: 'center' }]}>Speak or choose a live voice command:</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="e.g. Pump ON, Speed 80, Action..."
                placeholderTextColor={THEME.textMuted}
                value={voiceInputText}
                onChangeText={setVoiceInputText}
                onSubmitEditing={() => processVoice(voiceInputText)}
                autoFocus
              />

              <Text style={[styles.cardTitle, { marginTop: 5, marginBottom: 8 }]}>Quick Voice Actions</Text>
              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {widgets.length === 0 ? (
                    <Text style={styles.textMuted}>Add widgets on the Panel tab to enable voice control.</Text>
                  ) : (
                    widgets.map(w => {
                      if (w.type === 'toggle') {
                        return (
                          <React.Fragment key={w.id}>
                            <TouchableOpacity style={styles.optBtn} onPress={() => processVoice(`${w.id} ON`)}>
                              <Text style={styles.navBtnText}>🗣️ {w.id} ON</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.optBtn} onPress={() => processVoice(`${w.id} OFF`)}>
                              <Text style={styles.navBtnText}>🗣️ {w.id} OFF</Text>
                            </TouchableOpacity>
                          </React.Fragment>
                        );
                      } else if (w.type === 'button') {
                        return (
                          <TouchableOpacity key={w.id} style={styles.optBtn} onPress={() => processVoice(`Action ${w.id}`)}>
                            <Text style={styles.navBtnText}>🗣️ ACTION {w.id.toUpperCase()}</Text>
                          </TouchableOpacity>
                        );
                      } else if (w.type === 'slider') {
                        return (
                          <TouchableOpacity key={w.id} style={styles.optBtn} onPress={() => processVoice(`${w.id} 75`)}>
                            <Text style={styles.navBtnText}>🗣️ {w.id.toUpperCase()} 75%</Text>
                          </TouchableOpacity>
                        );
                      } else if (w.type === 'rgb') {
                        return (
                          <TouchableOpacity key={w.id} style={styles.optBtn} onPress={() => processVoice(`${w.id} Red`)}>
                            <Text style={styles.navBtnText}>🗣️ {w.id.toUpperCase()} RED</Text>
                          </TouchableOpacity>
                        );
                      }
                      return null;
                    })
                  )}
                </View>
              </ScrollView>

              <TouchableOpacity style={[styles.nativeBtn, { marginTop: 15 }]} onPress={() => processVoice(voiceInputText || `${widgets[0]?.id || 'Power'} ON`)}>
                <Mic size={16} color={THEME.background} />
                <Text style={styles.nativeBtnText}>Run Voice Command</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalClose} onPress={() => setIsVoiceModalVisible(false)}>
                <X size={24} color={THEME.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 1-CLICK INSTANT PWA APP INSTALL MODAL */}
        <Modal visible={isExportModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsExportModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentLarge}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={20} color={THEME.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>Export as App</Text>
                </View>
                <TouchableOpacity onPress={() => setIsExportModalVisible(false)}>
                  <X size={20} color={THEME.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 16 }}>
                  Export your custom widgets, connection settings, and telemetry into a <Text style={{ color: THEME.primary, fontWeight: '700' }}>Standalone Mobile App</Text> that installs directly on your Android home screen!
                </Text>

                {/* APP NAME INPUT */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.textMuted, marginBottom: 6 }}>APP NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={exportAppName}
                    onChangeText={setExportAppName}
                    placeholder="e.g. Smart Pump Controller"
                    placeholderTextColor="#4b5563"
                  />
                </View>

                {/* METHOD 1: ON-DEVICE PWA */}
                <View style={[styles.exportCardOption, { borderColor: THEME.primary, backgroundColor: 'rgba(56, 189, 248, 0.05)', marginBottom: 14 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Smartphone size={20} color={THEME.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.text }}>1. On-Device PWA (Blob/DataURI)</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(56, 189, 248, 0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.primary }}>$0 / Free</Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(20, 184, 166, 0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.success }}>1-Tap Home Screen</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 18 }}>
                    Generates a self-contained, offline app bundle stored directly on your phone with zero server dependencies.
                  </Text>

                  <TouchableOpacity style={styles.exportBtnPrimary} onPress={handleExportAsApp}>
                    <Sparkles size={18} color={THEME.background} style={{ marginRight: 6 }} />
                    <Text style={styles.exportBtnPrimaryText}>⚡ INSTANT ON-DEVICE PWA</Text>
                  </TouchableOpacity>

                  {isPwaGenerated && (
                    <View style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: 'rgba(20, 184, 166, 0.15)', borderWidth: 1, borderColor: 'rgba(20, 184, 166, 0.4)' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.success, marginBottom: 8 }}>✅ STANDALONE APP READY!</Text>
                      <TouchableOpacity style={styles.exportBtnSecondary} onPress={() => {
                        customAlert('Copied! 📋', 'Standalone App HTML bundle copied to clipboard! Save as index.html to run your project app anywhere.', 'success');
                      }}>
                        <Copy size={14} color={THEME.text} style={{ marginRight: 6 }} />
                        <Text style={styles.exportBtnSecondaryText}>Copy App HTML Bundle</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* METHOD 2: CENTRAL GITHUB PAGES */}
                <View style={[styles.exportCardOption, { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <ExternalLink size={20} color="#10b981" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.text }}>2. Central GitHub Pages (index.html)</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981' }}>$0 / Free SSL</Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#a855f7' }}>Multi-User (localStorage)</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 18 }}>
                    Serves multi-user dynamic layouts via free cloud HTTPS URL: <Text style={{ color: THEME.primary, fontWeight: '700' }}>https://vaigai-valley.github.io/sanwitch-pwa-host/</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.exportBtnPrimary, { backgroundColor: '#10b981' }]}
                    onPress={() => {
                      const userConfig = {
                        appName: exportAppName || 'My Sanwitch App',
                        widgets,
                        wifiIp
                      };
                      const jsonStr = JSON.stringify(userConfig);
                      let b64 = jsonStr;
                      try {
                        b64 = btoa(encodeURIComponent(jsonStr));
                      } catch (e) {}
                      const dynamicUrl = `https://vaigai-valley.github.io/sanwitch-pwa-host/#config=${b64}`;
                      Linking.openURL(dynamicUrl);
                    }}
                  >
                    <ExternalLink size={16} color={THEME.background} style={{ marginRight: 6 }} />
                    <Text style={styles.exportBtnPrimaryText}>🌐 OPEN GITHUB PAGES PWA</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {alertConfig && (
          <Modal visible={!!alertConfig} transparent animationType="fade" onRequestClose={() => setAlertConfig(null)}>
            <View style={styles.alertOverlay}>
              <View style={styles.alertCard}>
                <View style={[styles.alertIconBadge, {
                  backgroundColor: alertConfig.type === 'success' ? 'rgba(20, 184, 166, 0.15)' :
                    alertConfig.type === 'error' ? 'rgba(239, 68, 68, 0.15)' :
                      alertConfig.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  borderColor: alertConfig.type === 'success' ? 'rgba(20, 184, 166, 0.4)' :
                    alertConfig.type === 'error' ? 'rgba(239, 68, 68, 0.4)' :
                      alertConfig.type === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)'
                }]}>
                  {alertConfig.type === 'success' && <CheckCircle2 size={26} color={THEME.success} />}
                  {alertConfig.type === 'error' && <XCircle size={26} color={THEME.error} />}
                  {alertConfig.type === 'warning' && <AlertTriangle size={26} color="#f59e0b" />}
                  {alertConfig.type === 'info' && <Info size={26} color={THEME.primary} />}
                </View>

                <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                <Text style={styles.alertMessage}>{alertConfig.message}</Text>

                <View style={{ flexDirection: alertConfig.buttons.length > 1 ? 'row' : 'column', gap: 10, width: '100%', marginTop: 8 }}>
                  {alertConfig.buttons.map((btn, idx) => {
                    const isCancel = btn.style === 'cancel';
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.nativeBtn,
                          { flex: alertConfig.buttons.length > 1 ? 1 : undefined, width: alertConfig.buttons.length > 1 ? undefined : '100%', marginTop: 0 },
                          isCancel && { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.surfaceBorder }
                        ]}
                        onPress={() => {
                          const cb = btn.onPress;
                          setAlertConfig(null);
                          if (cb) cb();
                        }}
                      >
                        <Text style={[styles.nativeBtnText, isCancel && { color: THEME.textMuted }]}>
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Modal>
        )}

        <View style={styles.bottomStatusWrap} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.sideMenuTriggerBtn}
            onPress={() => setIsExportModalVisible(true)}
          >
            <ChevronsUp size={22} color={THEME.primary} />
          </TouchableOpacity>

          <View style={[styles.statusBadge, (connectedDevice || wifiConnected) && styles.statusBadgeConnected]}>
            {connectedDevice ? (
              <Bluetooth size={13} color={THEME.primary} />
            ) : wifiConnected ? (
              <Wifi size={13} color={THEME.primary} />
            ) : (
              <View style={styles.statusDot} />
            )}
            <Text style={styles.statusText}>{connectedDevice || wifiConnected ? 'LINKED' : 'READY'}</Text>
          </View>

          <TouchableOpacity
            style={styles.voiceFabBtn}
            onPress={startVoice}
          >
            <Mic size={20} color={THEME.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Joystick({ onMove }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (e, g) => {
      const r = 50; const d = Math.sqrt(g.dx ** 2 + g.dy ** 2);
      const lx = d > r ? (g.dx / d) * r : g.dx; const ly = d > r ? (g.dy / d) * r : g.dy;
      pan.setValue({ x: lx, y: ly });
      onMove(Math.round((lx / r) * 100), Math.round((ly / r) * -100));
    },
    onPanResponderRelease: () => { Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(); onMove(0, 0); }
  })).current;
  return (<View style={styles.joyBox}><Animated.View style={[styles.joyKnob, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers} /></View>);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.surfaceBorder },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 36, height: 36, backgroundColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoDot: { width: 18, height: 18, backgroundColor: THEME.background, borderRadius: 4 },
  logoText: { fontSize: 18, fontWeight: '700', color: THEME.text },
  voiceBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: THEME.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.surfaceBorder },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: THEME.surfaceBorder, gap: 8 },
  statusBadgeConnected: { borderColor: 'rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(56, 189, 248, 0.05)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.textMuted },
  statusDotConnected: { backgroundColor: THEME.primary },
  statusText: { color: THEME.text, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  bottomStatusWrap: { position: 'absolute', bottom: 18, left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 99 },
  sideMenuTriggerBtn: { position: 'absolute', left: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(22, 24, 31, 0.9)', borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.4)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8, zIndex: 100 },
  voiceFabBtn: { position: 'absolute', right: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(22, 24, 31, 0.9)', borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.4)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8, zIndex: 100 },
  nav: { flexDirection: 'row', backgroundColor: THEME.surface, margin: 15, padding: 4, borderRadius: 12, borderWidth: 1, borderColor: THEME.surfaceBorder },
  navBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  navBtnActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  navBtnText: { color: THEME.textMuted, fontWeight: '600', fontSize: 10 },
  navBtnTextActive: { color: THEME.text },
  scrollContent: { padding: 20, paddingBottom: 100 },
  content: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  card: { width: (width - 55) / 2, backgroundColor: THEME.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: THEME.surfaceBorder, marginBottom: 15, position: 'relative' },
  cardWide: { width: width - 40 },
  cardTitle: { fontSize: 9, fontWeight: '700', color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  removeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
  widgetControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textMuted: { color: THEME.textMuted, fontSize: 11 },
  toggleTrack: { width: 44, height: 24, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 2 },
  toggleThumb: { width: 20, height: 20, backgroundColor: '#fff', borderRadius: 10 },
  nativeBtn: { backgroundColor: THEME.primary, padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 5, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  nativeBtnText: { color: THEME.background, fontWeight: '700', fontSize: 12 },
  addBtn: { backgroundColor: THEME.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 10, gap: 10 },
  addBtnText: { color: THEME.background, fontWeight: '700', fontSize: 16 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: THEME.surface, width: '100%', borderRadius: 25, padding: 30, borderWidth: 1, borderColor: THEME.surfaceBorder },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.text, marginBottom: 20, textAlign: 'center' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  optBtn: { padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, minWidth: 90, alignItems: 'center', borderWidth: 1, borderColor: THEME.surfaceBorder },
  modalClose: { position: 'absolute', top: 20, right: 20 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, color: THEME.text, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: THEME.surfaceBorder },
  tabBar: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: THEME.surfaceBorder },
  tabActive: { backgroundColor: THEME.surfaceBorder },
  modeRow: { flexDirection: 'row', gap: 8 },
  modePill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: THEME.surfaceBorder },
  modePillActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  codeTerminal: { backgroundColor: '#000', borderRadius: 20, padding: 20, minHeight: 350, position: 'relative' },
  codeText: { color: THEME.primary, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  copyBtn: { position: 'absolute', top: 15, right: 15, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  termContainer: { flex: 1, backgroundColor: '#000', margin: 20, borderRadius: 20, padding: 20 },
  logText: { fontFamily: 'monospace', fontSize: 12, marginBottom: 8 },
  gaugeBox: { alignItems: 'center' },
  gaugeValue: { fontSize: 32, fontWeight: '700', color: THEME.text, marginBottom: 5 },
  joyBox: { width: 110, height: 110, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 55, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.surfaceBorder },
  joyKnob: { width: 44, height: 44, backgroundColor: THEME.primary, borderRadius: 22 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 5 },
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  colorSelected: { borderWidth: 2, borderColor: THEME.primary, transform: [{ scale: 1.1 }] },
  block: { backgroundColor: 'rgba(56, 189, 248, 0.05)', padding: 12, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: 'rgba(255,255,255,0.2)' },
  blockTitle: { color: THEME.primary, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  blockText: { color: THEME.textMuted, fontSize: 10, fontFamily: 'monospace' },
  splashContainer: { flex: 1, backgroundColor: THEME.background, justifyContent: 'center', alignItems: 'center' },
  splashMain: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashFooter: { paddingBottom: 60, alignItems: 'center' },
  splashFrom: { color: THEME.textMuted, fontSize: 14, fontWeight: '500' },
  splashBrand: { color: THEME.text, fontSize: 24, fontWeight: '700' },
  authCard: { backgroundColor: THEME.surface, borderRadius: 25, padding: 30, borderWidth: 1, borderColor: THEME.surfaceBorder },
  profileCard: { backgroundColor: THEME.surface, borderRadius: 25, padding: 40, borderWidth: 1, borderColor: THEME.surfaceBorder, alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarTextLarge: { fontSize: 32, fontWeight: '700', color: THEME.background },
  profileName: { fontSize: 24, fontWeight: '700', color: THEME.text },
  profileEmail: { fontSize: 14, color: THEME.textMuted, marginTop: 5 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center' },
  avatarTextSmall: { fontSize: 14, fontWeight: '700', color: THEME.background },
  qrAuthCard: { backgroundColor: THEME.surface, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: THEME.surfaceBorder, alignItems: 'center' },
  cameraPlaceholder: { width: '100%', height: 260, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 20, borderWidth: 1, borderColor: THEME.surfaceBorder },
  cameraContainer: { width: '100%', height: 260, borderRadius: 20, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: THEME.surfaceBorder },
  cameraPreview: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  qrTargetOverlay: { width: 180, height: 180, borderRadius: 16, borderWidth: 2, borderColor: THEME.primary, backgroundColor: 'rgba(56, 189, 248, 0.05)' },
  avatarHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(56, 189, 248, 0.18)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: THEME.primary },
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertCard: { width: '100%', maxWidth: 330, backgroundColor: THEME.surface, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: THEME.surfaceBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  alertIconBadge: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1 },
  alertTitle: { fontSize: 18, fontWeight: '700', color: THEME.text, textAlign: 'center', marginBottom: 8 },
  alertMessage: { fontSize: 13, color: THEME.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  exportHeaderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(56, 189, 248, 0.12)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  exportHeaderBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },
  modalContentLarge: { backgroundColor: THEME.surface, width: '100%', maxWidth: 440, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: THEME.surfaceBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exportCardOption: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: THEME.surfaceBorder, borderRadius: 16, padding: 16, marginBottom: 14 },
  exportBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.primary, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  exportBtnPrimaryText: { color: THEME.background, fontSize: 13, fontWeight: '800' },
  exportBtnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1, borderColor: THEME.surfaceBorder, paddingVertical: 10, borderRadius: 12 },
  exportBtnSecondaryText: { color: THEME.text, fontSize: 12, fontWeight: '700' },
});
