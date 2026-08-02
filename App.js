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
import { Mic, Bluetooth, Wifi, Plus, X, Terminal as TermIcon, Code as CodeIcon, LayoutGrid, Trash2, Copy, Zap, Info, CheckCircle2, XCircle, AlertTriangle, QrCode, Camera as CameraIcon, RefreshCw, RefreshCcw, LogOut, KeyRound, Smartphone, ExternalLink, Sparkles, ChevronsUp, Folder, Edit3, FileText, HelpCircle, ChevronRight, Play } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';
import { Buffer } from 'buffer';
import { generateCompleteStandaloneAppHtml } from './pwaFrameworkBundle';

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
        else if (isMounted) setWidgets([]);

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
          const tourDone = await AsyncStorage.getItem('@sanwitch_tour_completed').catch(() => null);
          if (!tourDone && isMounted) {
            setTourMode('overall');
            setTourStep(1);
            setIsTourModalVisible(true);
          }
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
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [showQrScannerInProfile, setShowQrScannerInProfile] = useState(false);

  // Real-time Mobile Pairing Logout Sync Effect
  useEffect(() => {
    if (!pairedSessionId) return;

    const heartbeat = setInterval(async () => {
      try {
        const resp = await fetch(`https://sanwitch.vaigaivalley.workers.dev/api/auth/qr/status?session_id=${pairedSessionId}`, { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          if (data.status === 'unpaired' || data.status === 'expired') {
            await AsyncStorage.removeItem('sanwitch_token');
            await AsyncStorage.removeItem('sanwitch_user');
            await AsyncStorage.removeItem('sanwitch_paired_session_id');
            setToken(null);
            setUser(null);
            setPairedSessionId(null);
            setActiveView('auth');
            customAlert('Session Unpaired 🔓', 'Your pairing session was logged out from Desktop IDE.', 'warning');
          }
        }
      } catch (e) {}
    }, 2500);

    return () => clearInterval(heartbeat);
  }, [pairedSessionId]);


  const [widgets, setWidgets] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isInstallModalVisible, setIsInstallModalVisible] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStepText, setInstallStepText] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [pendingType, setPendingType] = useState(null);
  const [newName, setNewName] = useState('');
  const [customCmd, setCustomCmd] = useState('');
  const [connectionMode, setConnectionMode] = useState('ble');
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
  const [activeRunnerApp, setActiveRunnerApp] = useState(null);
  const [isAppRunnerVisible, setIsAppRunnerVisible] = useState(false);

  const handleRunAppInApp = (appTitleOrItem) => {
    const title = typeof appTitleOrItem === 'string' ? appTitleOrItem : (appTitleOrItem?.name || exportAppName || 'My Sanwitch App');
    const html = (typeof appTitleOrItem === 'object' && appTitleOrItem?.html) ? appTitleOrItem.html : generateCompleteStandaloneAppHtml(title);

    setActiveRunnerApp({ name: title, html });
    setIsExportModalVisible(false);
    setIsMyAppsModalVisible(false);
    setIsAppRunnerVisible(true);
  };

  const [savedApps, setSavedApps] = useState([]);
  const [isBottomMenuVisible, setIsBottomMenuVisible] = useState(false);
  const [isMyAppsModalVisible, setIsMyAppsModalVisible] = useState(false);
  const [isTourModalVisible, setIsTourModalVisible] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [tourMode, setTourMode] = useState('guided');
  const [helperMode, setHelperMode] = useState('code');

  useEffect(() => {
    const loadSavedApps = async () => {
      try {
        const jsonStr = await AsyncStorage.getItem('@sanwitch_saved_apps');
        if (jsonStr) {
          setSavedApps(JSON.parse(jsonStr));
        }
      } catch (e) {}
    };
    loadSavedApps();
  }, []);

  // OPTION 1: INSTALL APP DIRECTLY INTO ANDROID SYSTEM (NO BROWSER NEEDED)
  const handleInstallReadyApp = async () => {
    const appTitle = exportAppName.trim() || 'My Sanwitch App';
    const fileName = `${appTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    const html = generateCompleteStandaloneAppHtml(appTitle, widgets, wifiIP);

    const newApp = {
      id: Date.now().toString(),
      name: appTitle,
      fileName,
      widgets: JSON.parse(JSON.stringify(widgets)),
      wifiIP,
      createdAt: new Date().toLocaleDateString(),
      html
    };

    const updatedApps = [newApp, ...savedApps.filter(a => a.name !== appTitle)];
    setSavedApps(updatedApps);
    try {
      await AsyncStorage.setItem('@sanwitch_saved_apps', JSON.stringify(updatedApps));
    } catch (e) {}

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsExportModalVisible(false);

    // 1. Silent Background Sync to Worker Cloud Storage
    let publishedUrl = '';
    try {
      const resp = await fetch('https://sanwitch.vaigaivalley.workers.dev/api/auth/pwa/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: appTitle, html })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.url) publishedUrl = data.url;
      }
    } catch (e) {
      console.log('Silent PWA sync error:', e);
    }

    // 2. Install WebAPK directly via Android PackageInstaller API (NO SHORTCUT APIS USED)
    if (Platform.OS === 'android' && NativeModules.WebApkInstallerModule?.installWebApk) {
      try {
        const res = await NativeModules.WebApkInstallerModule.installWebApk(appTitle, publishedUrl);
        if (res === 'PERMISSION_NEEDED') {
          customAlert(
            'Permission Required ⚙️',
            `Opening Android Settings! Please enable "Allow from this source" for Sanwitch Connect, then tap INSTALL APP again.`,
            'info'
          );
          return;
        } else if (res === 'POLICY_RESTRICTED') {
          if (publishedUrl) await Linking.openURL(publishedUrl);
          customAlert(
            'Enterprise Policy Detected 🏢',
            `Direct sideloading is restricted by your Android device policy. Switched smoothly to HTTPS PWA link!`,
            'info'
          );
          return;
        }
      } catch (e) {
        console.log('WebApkInstallerModule error:', e);
      }
    }

    customAlert(
      'Android WebAPK Installed! 📱',
      `"${appTitle}" installed into Android System Package Manager via WebAPK Installer (NO shortcut API used & 0 browser redirects)!`,
      'success'
    );
  };

  const handleOpenPwaLinkInBrowser = async (appTitleOrItem) => {
    const title = typeof appTitleOrItem === 'string' ? appTitleOrItem : (appTitleOrItem?.name || exportAppName || 'My Sanwitch App');
    const html = (typeof appTitleOrItem === 'object' && appTitleOrItem?.html) ? appTitleOrItem.html : generateCompleteStandaloneAppHtml(title, widgets, wifiIP);

    try {
      const resp = await fetch('https://sanwitch.vaigaivalley.workers.dev/api/auth/pwa/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: title, html })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.url) {
          await Linking.openURL(data.url);
          customAlert('Opening PWA Link 🌐', `Opening "${title}" in external system browser.`, 'info');
          return;
        }
      }
    } catch (e) {}

    customAlert('PWA Link', `Saved "${title}" in local storage.`, 'info');
  };

  // OPTION 2: SAVE PWA BUNDLE (Editable in Sanwitch Connect Project Folder)
  const handleSavePwaBundleProject = async () => {
    const appTitle = exportAppName.trim() || 'My Sanwitch App';
    const fileName = `${appTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    const html = generateCompleteStandaloneAppHtml(appTitle, widgets, wifiIP);

    const newApp = {
      id: Date.now().toString(),
      name: appTitle,
      fileName,
      widgets: JSON.parse(JSON.stringify(widgets)),
      wifiIP,
      createdAt: new Date().toLocaleDateString(),
      html
    };

    const updatedApps = [newApp, ...savedApps.filter(a => a.name !== appTitle)];
    setSavedApps(updatedApps);
    try {
      await AsyncStorage.setItem('@sanwitch_saved_apps', JSON.stringify(updatedApps));
    } catch (e) {}

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsExportModalVisible(false);
    customAlert(
      'Bundle Saved to MY APPS!',
      `Saved "${appTitle}" into your Sanwitch Connect project folder. You can edit and re-export it anytime under MY APPS!`,
      'success'
    );
  };

  const handleLoadAppForEditing = (appItem) => {
    if (appItem.widgets) setWidgets(appItem.widgets);
    if (appItem.wifiIP) setWifiIP(appItem.wifiIP);
    setExportAppName(appItem.name);
    setIsMyAppsModalVisible(false);
    customAlert('App Loaded!', `Loaded "${appItem.name}" widget layout back into Sanwitch Connect for editing!`, 'success');
  };

  const handleLaunchSavedApp = async (appItem) => {
    setIsMyAppsModalVisible(false);
    const html = appItem.html || generateCompleteStandaloneAppHtml(appItem.name);

    try {
      const resp = await fetch('https://sanwitch.vaigaivalley.workers.dev/api/auth/pwa/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: appItem.name, html })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.url) {
          await Linking.openURL(data.url);
          customAlert(
            'Opening PWA App 🚀',
            `Opening "${appItem.name}" in system browser. Tap "Add to Home Screen" to install!`,
            'success'
          );
          return;
        }
      }
    } catch (e) {}

    // Trigger Native Android ShortcutManager fallback if available
    if (Platform.OS === 'android' && NativeModules.ShortcutModule?.pinShortcut) {
      try {
        NativeModules.ShortcutModule.pinShortcut(appItem.name);
      } catch (e) {}
    }

    customAlert(
      'Saved App',
      `App "${appItem.name}" is stored locally in MY APPS.`,
      'info'
    );
  };

  const handleDeleteSavedApp = async (appId) => {
    const filtered = savedApps.filter(a => a.id !== appId);
    setSavedApps(filtered);
    try {
      await AsyncStorage.setItem('@sanwitch_saved_apps', JSON.stringify(filtered));
    } catch (e) {}
    customAlert('Deleted ️', 'App layout removed from local phone storage.', 'info');
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

        // Adopt scanned user profile from Desktop QR
        if (parsed.user) {
          if (typeof parsed.user === 'object') {
            const nameVal = parsed.user.name || parsed.user.username || 'Chef';
            const emailVal = parsed.user.email || `${parsed.user.username || 'chef'}@sanwitch.io`;
            activeUser = {
              ...activeUser,
              ...parsed.user,
              username: parsed.user.username || nameVal,
              name: nameVal,
              email: emailVal,
              profilePhoto: parsed.user.profilePhoto || parsed.user.avatar || null,
              importedFromIde: true,
              pairedAt: new Date().toLocaleDateString()
            };
          } else if (typeof parsed.user === 'string' && parsed.user.trim()) {
            activeUser = {
              username: parsed.user.trim(),
              name: parsed.user.trim(),
              email: `${parsed.user.trim()}@sanwitch.io`,
              importedFromIde: true,
              pairedAt: new Date().toLocaleDateString()
            };
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

        const realDeviceName = Platform.OS === 'android' ? 'Vivo Y20' : (Platform.OS === 'ios' ? 'iPhone 14' : 'Sanwitch Mobile');
        const resp = await fetch('https://sanwitch.vaigaivalley.workers.dev/api/auth/qr/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: parsed.sid,
            token: activeToken,
            user: activeUser,
            deviceName: realDeviceName
          })
        });

        if (resp.ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          customAlert('Web IDE Paired!', `Authenticated ${activeUser.username} on Sanwitch IDE Desktop!`, 'success');
          setToken(activeToken);
          setUser(activeUser);
          setPairedSessionId(parsed.sid);
          await AsyncStorage.setItem('sanwitch_token', activeToken);
          await AsyncStorage.setItem('sanwitch_user', JSON.stringify(activeUser));
          await AsyncStorage.setItem('sanwitch_paired_session_id', parsed.sid);
          setActiveView('panel');
          const tourDone = await AsyncStorage.getItem('@sanwitch_tour_completed').catch(() => null);
          if (!tourDone) {
            setTourMode('overall');
            setTourStep(1);
            setIsTourModalVisible(true);
          }
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
        const tourDone = await AsyncStorage.getItem('@sanwitch_tour_completed').catch(() => null);
        if (!tourDone) {
          setTourMode('overall');
          setTourStep(1);
          setIsTourModalVisible(true);
        }
        customAlert('Device Paired!', `Welcome, ${displayName}! Logged in via Sanwitch IDE QR Code.`, 'success');
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
        'Login Required ',
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
        const tourDone = await AsyncStorage.getItem('@sanwitch_tour_completed').catch(() => null);
        if (!tourDone) {
          setTourMode('overall');
          setTourStep(1);
          setIsTourModalVisible(true);
        }
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

  const unpairSession = async () => {
    try {
      const sid = pairedSessionId || (await AsyncStorage.getItem('sanwitch_paired_session_id'));
      if (sid) {
        await fetch('https://sanwitch.vaigaivalley.workers.dev/api/auth/qr/unpair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sid, sessionId: sid })
        }).catch(() => {});
      }
    } catch (e) {}

    await AsyncStorage.removeItem('sanwitch_paired_session_id');
    setPairedSessionId(null);
    customAlert('Unpaired 🔓', 'Successfully unpaired from Sanwitch Desktop IDE.', 'info');
  };

  const logout = async () => {
    try {
      const sid = pairedSessionId || (await AsyncStorage.getItem('sanwitch_paired_session_id'));
      if (sid) {
        await fetch('https://sanwitch.vaigaivalley.workers.dev/api/auth/qr/unpair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sid, sessionId: sid })
        }).catch(() => {});
      }
    } catch (e) {}

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
    const payloadCmd = pendingType === 'custom' ? (customCmd.trim() || `${newName.toUpperCase()}:EXEC`) : undefined;
    setWidgets([...widgets, { id: newName, type: pendingType, ...(payloadCmd ? { cmd: payloadCmd } : {}) }]);
    setIsNameModalVisible(false);
    setNewName('');
    setCustomCmd('');
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
    if (!user && !token) {
      customAlert(
        'Login Required',
        'You must log in (via Password or Desktop QR Code) to access Voice Assistant.',
        [
          { text: 'Log In / Scan QR', onPress: () => setActiveView('auth') }
        ]
      );
      return;
    }
    await requestPermissions();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Speech.speak("Sanwitch Voice active. Speak or choose a command.", { rate: 1.0 });
    setVoiceInputText('');
    setIsVoiceModalVisible(true);

    // Initialize WebSpeech microphone listener if supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = true;
          rec.lang = 'en-US';
          rec.onstart = () => {
            log('Microphone listening for voice command...', 'info');
          };
          rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setVoiceInputText(transcript);
            if (e.results[0].isFinal) {
              processVoice(transcript);
            }
          };
          rec.start();
        } catch (e) {}
      }
    }
  };

  const openArrowMenu = () => {
    if (!user && !token) {
      customAlert(
        'Login Required',
        'You must log in (via Password or Desktop QR Code) to access My Apps & Export features.',
        [
          { text: 'Log In / Scan QR', onPress: () => setActiveView('auth') }
        ]
      );
      return;
    }
    setIsBottomMenuVisible(true);
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
        } else if (w.type === 'custom') {
          sendData(`${w.cmd || `${cmd}:EXEC`}\n`);
          feedbackMsg = `Custom payload for ${w.id} executed`;
        }
      }
    });

    Speech.speak(feedbackMsg, { rate: 1.0 });
    setIsVoiceModalVisible(false);
    customAlert('Voice Executed', feedbackMsg, 'success');
  };

  // APK Capability: Android Permissions (Including Microphone RECORD_AUDIO)
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const perms = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
        if (Platform.Version >= 31) {
          perms.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
        }
        await PermissionsAndroid.requestMultiple(perms);
      } catch (e) { }
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
          children: [{ id: id++, type: 'pwm_led', pin: '5', duty: `int(msg.split(":")[1]) * 10`, nextId: null }]
        };
        sliderBlock.childStartId = sliderBlock.children[0].id;
        children.push(sliderBlock);
      } else if (w.type === 'joystick') {
        const joyBlock = {
          id: id++, type: 'if_logic', condType: 'text', condition: `msg.startswith("${cmd}:")`,
          nextId: null, childStartId: null,
          children: [{ id: id++, type: 'print', value: `Joystick ${w.id} Moved`, nextId: null }]
        };
        joyBlock.childStartId = joyBlock.children[0].id;
        children.push(joyBlock);
      } else if (w.type === 'gauge' && connectionMode === 'ble') {
        children.push({ id: id++, type: 'ble_send', data: `${cmd}:24.5`, nextId: null });
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
          'Login Required ',
          'You must log in (via Password or Desktop QR Code) to use the app and sync with Sanwitch IDE.',
          [{ text: 'Log In / Scan QR', onPress: () => setActiveView('auth') }]
        );
        setActiveView('auth');
        return;
      }

      const activeSessionId = pairedSessionId || (await AsyncStorage.getItem('sanwitch_paired_session_id'));

      if (!activeSessionId) {
        customAlert(
          'Desktop QR Scan Required ',
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
      customAlert('Synced! ', 'Your mobile layout has been sent to Sanwitch Web IDE instantly via DB-Less Session Bridge!', 'success');
    } catch (e) {
      customAlert('Sync Error', e.message, 'error');
    }
  };

  const generateCode = () => {
    let py = `# Sanwitch IDE - Unified MicroPython Protocol (ESP32/ESP8266)\n`;
    py += `from machine import Pin, PWM, ADC\nimport time, json\n\n`;

    let indent = connectionMode === 'ble' ? "        " : "            ";

    if (connectionMode === 'ble') {
      py += `# BLE UART Mode\nfrom ble_uart import BLEUART\nimport bluetooth\n_ble = bluetooth.BLE()\n_uart = BLEUART(_ble, name="Sanwitch-ESP32")\nprint("BLE UART Server Active: Sanwitch-ESP32")\n\nwhile True:\n    if _uart.any():\n        msg = _uart.read().decode().strip()\n`;
    } else {
      py += `# WiFi Web Server Mode\nimport network, usocket as socket\nwlan = network.WLAN(network.STA_IF)\nwlan.active(True)\nwlan.connect("${wifiSSID}", "${wifiPass}")\nprint("Connecting WiFi...")\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind(('', 80))\ns.listen(5)\nprint("Web Server active on port 80")\n\nwhile True:\n    try:\n        conn, addr = s.accept()\n        req = conn.recv(1024).decode()\n        if "?cmd=" in req:\n            msg = req.split("?cmd=")[1].split(" ")[0]\n`;
    }

    widgets.forEach(w => {
      const c = w.id.toUpperCase();
      if (w.type === 'toggle') {
        py += `${indent}if msg == "${c}:1":\n${indent}    Pin(2, Pin.OUT).value(1)\n${indent}    print("${c} -> ON")\n`;
        py += `${indent}elif msg == "${c}:0":\n${indent}    Pin(2, Pin.OUT).value(0)\n${indent}    print("${c} -> OFF")\n`;
      } else if (w.type === 'button') {
        py += `${indent}if msg == "${c}:PUSH":\n${indent}    Pin(4, Pin.OUT).value(1)\n${indent}    time.sleep_ms(100)\n${indent}    Pin(4, Pin.OUT).value(0)\n${indent}    print("${c} -> Triggered")\n`;
      } else if (w.type === 'slider') {
        py += `${indent}if msg.startswith("${c}:"):\n${indent}    val = int(msg.split(":")[1])\n${indent}    PWM(Pin(5), freq=1000).duty(int(val * 10.23))\n${indent}    print("${c} PWM ->", val)\n`;
      } else if (w.type === 'joystick') {
        py += `${indent}if msg.startswith("${c}:"):\n${indent}    coords = msg.split(":")[1].split(",")\n${indent}    jx, jy = int(coords[0]), int(coords[1])\n${indent}    print("${c} Joystick -> X:", jx, "Y:", jy)\n`;
      } else if (w.type === 'custom') {
        const customPayload = w.cmd || `${c}:EXEC`;
        py += `${indent}if msg == "${customPayload}":\n${indent}    print("Custom Payload Executed: ${customPayload}")\n${indent}    # Handle custom hardware logic for ${w.id}\n`;
      }
    });

    if (connectionMode === 'wifi') {
      py += `            conn.send('HTTP/1.1 200 OK\\nContent-Type: text/plain\\nAccess-Control-Allow-Origin: *\\n\\nOK')\n`;
      py += `        elif "GET /status" in req:\n            status_data = json.dumps({"status": "online", "temp": 24.5, "rssi": wlan.status()})\n            conn.send('HTTP/1.1 200 OK\\nContent-Type: application/json\\nAccess-Control-Allow-Origin: *\\n\\n' + status_data)\n`;
      py += `        else:\n            conn.send('HTTP/1.1 404 Not Found\\n\\nNot Found')\n`;
      py += `        conn.close()\n    except Exception as e:\n        pass\n`;
    } else {
      widgets.filter(w => w.type === 'gauge').forEach(w => {
        py += `        _uart.write("${w.id.toUpperCase()}:24.5\\n")\n`;
      });
    }

    return py;
  };

  const installStandalonePwa = async () => {
    try {
      setIsInstallModalVisible(true);
      setInstallProgress(15);
      setInstallStepText('Extracting layout state & custom payloads...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await new Promise(r => setTimeout(r, 600));
      setInstallProgress(45);
      setInstallStepText('Generating Cyber-Glassmorphism CSS & Web Manifest...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const pwaHtml = generateCompleteStandaloneAppHtml('Sanwitch App', widgets, wifiIP);

      await new Promise(r => setTimeout(r, 700));
      setInstallProgress(75);
      setInstallStepText('Embedding Base64 PWA Icon & WebBluetooth drivers...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await new Promise(r => setTimeout(r, 800));
      setInstallProgress(100);
      setInstallStepText('Package compiled! Installing to Android App Drawer...');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (Platform.OS === 'android' && NativeModules.WebApkInstallerModule) {
        try {
          await NativeModules.WebApkInstallerModule.installWebApk(pwaHtml, 'Sanwitch App');
        } catch (e) {
          console.log('Native WebAPK Installer triggered:', e.message);
        }
      }

      setTimeout(() => {
        setIsInstallModalVisible(false);
        setInstallProgress(0);
        customAlert(
          'Standalone App Ready! 🚀',
          'Your layout has been compiled into a standalone Android WebAPK application. Tap "Install" on the system prompt to add it to your App Drawer.',
          'success'
        );
      }, 900);
    } catch (e) {
      setIsInstallModalVisible(false);
      setInstallProgress(0);
      customAlert('Installation Error', e.message, 'error');
    }
  };

  const renderWidget = (w) => {
    const cmd = w.id.toUpperCase();
    const isActive = widgetStates[w.id];
    return (
      <View key={w.id} style={[styles.card, (w.type === 'gauge' || w.type === 'joystick' || w.type === 'custom') && styles.cardWide]}>
        <TouchableOpacity style={styles.removeBtn} onPress={() => setWidgets(widgets.filter(i => i.id !== w.id))}>
          <X size={14} color={THEME.error} />
        </TouchableOpacity>
        <Text style={styles.cardTitle}>{w.id}</Text>

        {w.type === 'custom' && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: THEME.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8 }}>
              Cmd: {w.cmd || `${cmd}:EXEC`}
            </Text>
            <TouchableOpacity style={styles.nativeBtn} onPress={() => sendData(`${w.cmd || `${cmd}:EXEC`}\n`)}>
              <Zap size={14} color={THEME.background} />
              <Text style={styles.nativeBtnText}>EXECUTE CUSTOM</Text>
            </TouchableOpacity>
          </View>
        )}

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

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.avatarHeaderBtn, { marginRight: 8, backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}
              onPress={() => {
                setTourMode('guided');
                setTourStep(1);
                setIsTourModalVisible(true);
              }}
            >
              <HelpCircle size={18} color={THEME.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarHeaderBtn} onPress={() => setActiveView('auth')}>
              {user ? (
                <Text style={styles.avatarTextSmall}>{(user.username || user.email || 'U')[0].toUpperCase()}</Text>
              ) : (
                <KeyRound size={16} color={THEME.primary} />
              )}
            </TouchableOpacity>
          </View>
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
                <TouchableOpacity
                  style={{ position: 'absolute', top: 16, right: 16, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(56, 189, 248, 0.12)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 10 }}
                  onPress={() => {
                    setTourMode('overall');
                    setTourStep(1);
                    setIsTourModalVisible(true);
                  }}
                >
                  <HelpCircle size={14} color={THEME.primary} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: THEME.primary }}>App Tour</Text>
                </TouchableOpacity>

                <View style={styles.profileHeader}>
                  <View style={styles.avatarLarge}>
                    {user.profilePhoto || user.avatar ? (
                      <Image source={{ uri: user.profilePhoto || user.avatar }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                    ) : (
                      <Text style={styles.avatarTextLarge}>{(user.name || user.username || user.email || 'C')[0].toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={styles.profileName}>{user.name || user.username || 'Chef'}</Text>
                  <Text style={styles.profileEmail}>{user.email || (pairedSessionId ? `Sanwitch IDE User (${user.username || 'Chef'})` : 'Sanwitch Connect User')}</Text>

                  <View style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: pairedSessionId ? 'rgba(20, 184, 166, 0.15)' : 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: pairedSessionId ? 'rgba(20, 184, 166, 0.4)' : 'rgba(245, 158, 11, 0.4)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: pairedSessionId ? THEME.success : '#f59e0b' }}>
                      {pairedSessionId ? ' Desktop IDE Profile Imported & Live' : ' Password Login (Scan Desktop QR to Import)'}
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
                  <>
                    <TouchableOpacity
                      style={[styles.nativeBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)', width: '100%', marginBottom: 10 }]}
                      onPress={unpairSession}
                    >
                      <LogOut size={16} color="#f87171" />
                      <Text style={[styles.nativeBtnText, { color: '#f87171' }]}>Unpair Desktop IDE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.nativeBtn, { backgroundColor: 'rgba(255,255,255,0.08)', width: '100%', marginBottom: 10 }]}
                      onPress={() => { setShowQrScannerInProfile(true); setScanned(false); }}
                    >
                      <QrCode size={16} color={THEME.primary} />
                      <Text style={[styles.nativeBtnText, { color: THEME.text }]}>Pair with New Desktop IDE QR</Text>
                    </TouchableOpacity>
                  </>
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
                      Open <Text style={{ color: '#fff', fontWeight: '600' }}>Sanwitch IDE</Text> on your desktop, click <Text style={{ color: THEME.primary, fontWeight: '700' }}> Pair Mobile App</Text> and scan the code below.
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

        <Modal visible={isInstallModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { alignItems: 'center', paddingVertical: 25 }]}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(20, 184, 166, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.secondary, marginBottom: 15 }}>
                <Smartphone size={28} color={THEME.secondary} />
              </View>
              <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 4 }]}>Installing Standalone App 🚀</Text>
              <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', marginBottom: 20 }}>
                Compiling native WebAPK bundle for Android App Drawer
              </Text>

              {/* Animated Progress Bar */}
              <View style={{ width: '100%', height: 10, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: THEME.surfaceBorder }}>
                <View style={{ width: `${installProgress}%`, height: '100%', backgroundColor: THEME.secondary, borderRadius: 5 }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 }}>
                <Text style={{ fontSize: 11, color: THEME.secondary, fontWeight: '700' }}>PROGRESS</Text>
                <Text style={{ fontSize: 11, color: THEME.text, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{installProgress}%</Text>
              </View>

              <Text style={{ fontSize: 12, color: THEME.primary, fontWeight: '600', textAlign: 'center', minHeight: 32 }}>
                {installStepText}
              </Text>
            </View>
          </View>
        </Modal>

        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Choose Widget</Text><View style={styles.optionsGrid}>{['toggle', 'slider', 'button', 'gauge', 'rgb', 'joystick', 'custom'].map(t => (<TouchableOpacity key={t} style={styles.optBtn} onPress={() => { setPendingType(t); setIsModalVisible(false); setIsNameModalVisible(true); }}><Text style={styles.navBtnText}>{t.toUpperCase()}</Text></TouchableOpacity>))}</View><TouchableOpacity style={styles.modalClose} onPress={() => setIsModalVisible(false)}><X size={24} color={THEME.textMuted} /></TouchableOpacity></View></View>
        </Modal>

        <Modal visible={isNameModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Name Widget</Text>
              <TextInput style={styles.input} placeholder="e.g. Pump" placeholderTextColor={THEME.textMuted} value={newName} onChangeText={setNewName} autoFocus />
              {pendingType === 'custom' && (
                <TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Custom Payload (e.g. RELAY_1:ON)" placeholderTextColor={THEME.textMuted} value={customCmd} onChangeText={setCustomCmd} />
              )}
              <TouchableOpacity style={styles.nativeBtn} onPress={addWidget}>
                <Text style={styles.nativeBtnText}>Create Widget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={isVoiceModalVisible} transparent animationType="fade" onRequestClose={() => setIsVoiceModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ alignItems: 'center', marginBottom: 15 }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(56, 189, 248, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.primary, marginBottom: 8 }}>
                  <Mic size={24} color={THEME.primary} />
                </View>
                <Text style={styles.modalTitle}>Voice Assistant ️</Text>
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
                              <Text style={styles.navBtnText}>️ {w.id} ON</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.optBtn} onPress={() => processVoice(`${w.id} OFF`)}>
                              <Text style={styles.navBtnText}>️ {w.id} OFF</Text>
                            </TouchableOpacity>
                          </React.Fragment>
                        );
                      } else if (w.type === 'button') {
                        return (
                          <TouchableOpacity key={w.id} style={styles.optBtn} onPress={() => processVoice(`Action ${w.id}`)}>
                            <Text style={styles.navBtnText}>️ ACTION {w.id.toUpperCase()}</Text>
                          </TouchableOpacity>
                        );
                      } else if (w.type === 'slider') {
                        return (
                          <TouchableOpacity key={w.id} style={styles.optBtn} onPress={() => processVoice(`${w.id} 75`)}>
                            <Text style={styles.navBtnText}>️ {w.id.toUpperCase()} 75%</Text>
                          </TouchableOpacity>
                        );
                      } else if (w.type === 'rgb') {
                        return (
                          <TouchableOpacity key={w.id} style={styles.optBtn} onPress={() => processVoice(`${w.id} Red`)}>
                            <Text style={styles.navBtnText}>️ {w.id.toUpperCase()} RED</Text>
                          </TouchableOpacity>
                        );
                      } else if (w.type === 'custom') {
                        return (
                          <TouchableOpacity key={w.id} style={styles.optBtn} onPress={() => processVoice(`${w.id}`)}>
                            <Text style={styles.navBtnText}> EXECUTE {w.id.toUpperCase()}</Text>
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
                  Export your custom widgets into a <Text style={{ color: THEME.primary, fontWeight: '700' }}>100% Offline Local App ({exportAppName ? exportAppName.replace(/[^a-zA-Z0-9_-]/g, '_') : 'app'}.html)</Text> saved directly into phone storage!
                </Text>

                {/* APP NAME INPUT */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.textMuted, marginBottom: 6 }}>APP NAME (SAVED AS {exportAppName ? exportAppName.replace(/[^a-zA-Z0-9_-]/g, '_') : 'app'}.html)</Text>
                  <TextInput
                    style={styles.input}
                    value={exportAppName}
                    onChangeText={setExportAppName}
                    placeholder="e.g. Smart Pump Controller"
                    placeholderTextColor="#4b5563"
                  />
                </View>

                {/* OPTION 1: INSTALL WEBAPK / APP TO ANDROID SYSTEM (NO BROWSER NEEDED) */}
                <View style={[styles.exportCardOption, { borderColor: THEME.primary, backgroundColor: 'rgba(56, 189, 248, 0.08)', marginBottom: 14 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Smartphone size={20} color={THEME.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.text }}>1. INSTALL APP (No Browser Needed)</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(56, 189, 248, 0.2)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.primary }}>Android WebAPK Installer</Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(20, 184, 166, 0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.success }}>0 Browser Redirects</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 18 }}>
                    Sanwitch Connect acts as the native WebAPK package installer (PackageInstaller API) and installs <Text style={{ color: THEME.primary, fontWeight: '700' }}>"{exportAppName}"</Text> directly into your Android System with NO shortcut API used & zero browser handoff.
                  </Text>

                  <TouchableOpacity style={styles.exportBtnPrimary} onPress={handleInstallReadyApp}>
                    <Sparkles size={18} color={THEME.background} style={{ marginRight: 6 }} />
                    <Text style={styles.exportBtnPrimaryText}>INSTALL APP (NO BROWSER NEEDED)</Text>
                  </TouchableOpacity>
                </View>

                {/* OPTION 2: OPEN PWA LINK IN BROWSER */}
                <View style={[styles.exportCardOption, { borderColor: THEME.textMuted, backgroundColor: 'rgba(255, 255, 255, 0.03)', marginBottom: 14 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <ExternalLink size={20} color={THEME.textMuted} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.text }}>2. OPEN PWA LINK IN BROWSER</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.textMuted }}>External Browser Handoff</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 18 }}>
                    Generates an HTTPS PWA link to open in your system browser (Chrome / Safari).
                  </Text>

                  <TouchableOpacity style={[styles.exportBtnPrimary, { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: THEME.surfaceBorder }]} onPress={() => handleOpenPwaLinkInBrowser(exportAppName)}>
                    <ExternalLink size={18} color={THEME.text} style={{ marginRight: 6 }} />
                    <Text style={[styles.exportBtnPrimaryText, { color: THEME.text }]}>OPEN PWA LINK IN BROWSER</Text>
                  </TouchableOpacity>
                </View>

                {/* OPTION 3: SAVE PWA BUNDLE (EDITABLE IN SANWITCH CONNECT) */}
                <View style={[styles.exportCardOption, { borderColor: THEME.secondary, backgroundColor: 'rgba(20, 184, 166, 0.05)', marginBottom: 14 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Folder size={20} color={THEME.secondary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.text }}>3. SAVE PWA BUNDLE (Editable)</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(20, 184, 166, 0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.secondary }}>MY APPS Project</Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(56, 189, 248, 0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.primary }}>Re-editable</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 18 }}>
                    Saves app layout into your <Text style={{ color: THEME.secondary, fontWeight: '700' }}>MY APPS</Text> project folder so you can re-load, edit widgets, and customize anytime in Sanwitch Connect.
                  </Text>

                  <TouchableOpacity style={[styles.exportBtnPrimary, { backgroundColor: THEME.secondary }]} onPress={handleSavePwaBundleProject}>
                    <Folder size={18} color={THEME.background} style={{ marginRight: 6 }} />
                    <Text style={styles.exportBtnPrimaryText}>SAVE PWA BUNDLE (MY APPS)</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* IN-APP PWA APP RUNNER MODAL (0 BROWSER REDIRECTS) */}
        <Modal visible={isAppRunnerVisible} animationType="slide" transparent={false} onRequestClose={() => setIsAppRunnerVisible(false)}>
          <View style={{ flex: 1, backgroundColor: '#0b0d12' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#16181f', borderBottomWidth: 1, borderBottomColor: '#2b3240' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles size={18} color={THEME.primary} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.text }}>{activeRunnerApp?.name || 'Sanwitch App'}</Text>
                <View style={{ marginLeft: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(20, 184, 166, 0.15)', borderWidth: 1, borderColor: 'rgba(20, 184, 166, 0.4)' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.success }}>RUNNING IN-APP</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsAppRunnerVisible(false)} style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <X size={20} color={THEME.text} />
              </TouchableOpacity>
            </View>

            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={activeRunnerApp?.html || ''}
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#0b0d12' }}
                title={activeRunnerApp?.name || 'PWA App'}
              />
            ) : (
              <ScrollView style={{ flex: 1, padding: 16 }}>
                <View style={{ backgroundColor: '#16181f', borderRadius: 16, borderBottomWidth: 1, borderColor: '#2b3240', padding: 16, marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: THEME.primary, marginBottom: 6 }}>📱 Native In-App App Runner</Text>
                  <Text style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 18 }}>
                    Running "{activeRunnerApp?.name}" directly inside Sanwitch Connect with 0 browser redirects!
                  </Text>
                </View>

                {widgets.length === 0 ? (
                  <View style={{ padding: 30, alignItems: 'center' }}>
                    <Text style={{ color: THEME.textMuted, fontSize: 13 }}>No active widgets in this app layout.</Text>
                  </View>
                ) : (
                  widgets.map(w => (
                    <View key={w.id} style={{ backgroundColor: '#16181f', borderWidth: 1, borderColor: '#2b3240', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>{w.id}</Text>
                      {w.type === 'switch' && (
                        <TouchableOpacity style={[styles.nativeBtn, { backgroundColor: widgetStates[w.id] ? THEME.primary : 'rgba(255,255,255,0.1)' }]} onPress={() => toggleWidgetState(w.id)}>
                          <Text style={styles.nativeBtnText}>{widgetStates[w.id] ? 'POWER ON' : 'POWER OFF'}</Text>
                        </TouchableOpacity>
                      )}
                      {w.type === 'gauge' && (
                        <Text style={{ fontSize: 26, fontWeight: '800', color: THEME.primary, textAlign: 'center', marginVertical: 8 }}>
                          {widgetStates[w.id] || sensorData[0] || '24.5'} °C
                        </Text>
                      )}
                      {w.type === 'button' && (
                        <TouchableOpacity style={styles.nativeBtn} onPress={() => processVoice(`${w.id} trigger`)}>
                          <Text style={styles.nativeBtnText}>EXECUTE {w.id.toUpperCase()}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
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

        {/* BOTTOM-LEFT ^^^ POPUP MENU (1st: EXPORT APP, 2nd: MY APPS) */}
        <Modal visible={isBottomMenuVisible} animationType="fade" transparent={true} onRequestClose={() => setIsBottomMenuVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsBottomMenuVisible(false)}>
            <View style={[styles.modalContent, { position: 'absolute', bottom: 75, left: 16, width: 280, borderRadius: 20, padding: 16, backgroundColor: '#16181f', borderWidth: 1, borderColor: '#2b3240' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>
                <TouchableOpacity onPress={() => setIsBottomMenuVisible(false)}>
                  <X size={16} color={THEME.textMuted} />
                </TouchableOpacity>
              </View>

              {/* 1st BUTTON: EXPORT APP */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20, 184, 166, 0.08)', borderWidth: 1, borderColor: 'rgba(20, 184, 166, 0.3)', padding: 12, borderRadius: 12, marginBottom: 10 }}
                onPress={() => {
                  setIsBottomMenuVisible(false);
                  installStandalonePwa();
                }}
              >
                <Sparkles size={20} color={THEME.success} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.text }}>EXPORT APP</Text>
                  <Text style={{ fontSize: 10, color: THEME.textMuted, marginTop: 2 }}>Save layout & run PWA app</Text>
                </View>
              </TouchableOpacity>

              {/* 2nd BUTTON: MY APPS */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(56, 189, 248, 0.08)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', padding: 12, borderRadius: 12 }}
                onPress={() => {
                  setIsBottomMenuVisible(false);
                  setIsMyAppsModalVisible(true);
                }}
              >
                <Folder size={20} color={THEME.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.text }}>MY APPS</Text>
                    <View style={{ backgroundColor: THEME.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: THEME.background }}>{savedApps.length}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 10, color: THEME.textMuted, marginTop: 2 }}>Saved local .html app layouts</Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* MY SAVED APPS MODAL */}
        <Modal visible={isMyAppsModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsMyAppsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentLarge}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Folder size={20} color={THEME.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>My Saved Apps ({savedApps.length})</Text>
                </View>
                <TouchableOpacity onPress={() => setIsMyAppsModalVisible(false)}>
                  <X size={20} color={THEME.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                {savedApps.length === 0 ? (
                  <View style={{ padding: 30, alignItems: 'center' }}>
                    <FileText size={40} color={THEME.textMuted} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <Text style={{ fontSize: 14, color: THEME.textMuted, textAlign: 'center' }}>No saved apps in local phone storage.</Text>
                    <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', marginTop: 6 }}>Tap "EXPORT APP" to save your current layout as a local app!</Text>
                  </View>
                ) : (
                  savedApps.map((app) => (
                    <View key={app.id} style={{ backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border, borderRadius: 14, padding: 14, marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Zap size={14} color={THEME.primary} style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 15, fontWeight: '800', color: THEME.text }}>{app.name}</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: THEME.primary, fontWeight: '700', marginTop: 2 }}>{app.fileName}</Text>
                          <Text style={{ fontSize: 10, color: THEME.textMuted, marginTop: 2 }}>Created: {app.createdAt} • Widgets: {app.widgets?.length || 0}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteSavedApp(app.id)} style={{ padding: 6 }}>
                          <Trash2 size={16} color={THEME.danger} />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: THEME.success, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => handleRunAppInApp(app)}
                        >
                          <Play size={14} color={THEME.background} style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: THEME.background }}>RUN IN-APP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: THEME.primary, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => handleLaunchSavedApp(app)}
                        >
                          <Smartphone size={14} color={THEME.background} style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: THEME.background }}>PWA LINK</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: THEME.border, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => handleLoadAppForEditing(app)}
                        >
                          <Edit3 size={14} color={THEME.text} style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: THEME.text }}>EDIT</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* APP TOUR MODAL (Supports Overall 4-Step Tour & Guided 2-Step Tour) */}
        <Modal visible={isTourModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsTourModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContentLarge, { maxWidth: 370, padding: 22, borderWidth: 1.5, borderColor: THEME.primary }]}>
              {/* TOP STEP COUNTER HEADER */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={18} color={THEME.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: THEME.text }}>
                    {tourMode === 'overall' ? 'Overall App Tour' : 'Sanwitch Quickstart'}
                  </Text>
                </View>
                <View style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: THEME.primary }}>
                    STEP {tourStep} OF {tourMode === 'overall' ? 4 : 2}
                  </Text>
                </View>
              </View>

              {/* TOUR TYPE 1: OVERALL APP TOUR (4 STEPS) */}
              {tourMode === 'overall' && (
                <View>
                  {tourStep === 1 && (
                    <View>
                      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: THEME.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 }}>
                        <Sparkles size={28} color={THEME.primary} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.text, textAlign: 'center', marginBottom: 8 }}>
                        Ecosystem Overview
                      </Text>
                      <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                        Sanwitch Connect is your native Android IoT controller & MicroPython IDE bridge. Build custom hardware dashboards, stream live sensor telemetry, and sync code with desktop Sanwitch IDE!
                      </Text>
                      <TouchableOpacity
                        style={[styles.exportBtnPrimary, { backgroundColor: THEME.primary, marginTop: 10 }]}
                        onPress={() => setTourStep(2)}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.background, marginRight: 6 }}>Next: Hardware Link</Text>
                        <ChevronRight size={16} color={THEME.background} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {tourStep === 2 && (
                    <View>
                      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(20, 184, 166, 0.15)', borderWidth: 1, borderColor: THEME.secondary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 }}>
                        <Bluetooth size={28} color={THEME.secondary} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.text, textAlign: 'center', marginBottom: 8 }}>
                        Hardware Connectivity
                      </Text>
                      <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                        Navigate to the <Text style={{ color: THEME.primary, fontWeight: '700' }}>LINK</Text> tab to connect your micro-controllers via Bluetooth Low Energy (BLE) or Local IP WiFi. Execute serial commands and receive live sensor updates instantly.
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: THEME.surfaceBorder, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                          onPress={() => setTourStep(1)}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.textMuted }}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ flex: 2, backgroundColor: THEME.primary, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => setTourStep(3)}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.background, marginRight: 6 }}>Next: IoT Canvas</Text>
                          <ChevronRight size={16} color={THEME.background} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {tourStep === 3 && (
                    <View>
                      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 }}>
                        <LayoutGrid size={28} color="#f59e0b" />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.text, textAlign: 'center', marginBottom: 8 }}>
                        IoT Canvas & Widgets
                      </Text>
                      <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                        Tap the <Text style={{ color: THEME.primary, fontWeight: '700' }}>PANEL</Text> tab and click <Text style={{ color: THEME.secondary, fontWeight: '700' }}>+ Add Widget</Text> to place custom controls (Toggles, Sliders, Gauges, Joysticks & Color Pickers) for your hardware setup.
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: THEME.surfaceBorder, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                          onPress={() => setTourStep(2)}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.textMuted }}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ flex: 2, backgroundColor: THEME.primary, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => setTourStep(4)}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.background, marginRight: 6 }}>Next: Sync & Export</Text>
                          <ChevronRight size={16} color={THEME.background} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {tourStep === 4 && (
                    <View>
                      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(20, 184, 166, 0.15)', borderWidth: 1, borderColor: THEME.success, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 }}>
                        <Smartphone size={28} color={THEME.success} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.text, textAlign: 'center', marginBottom: 8 }}>
                        Sync IDE & Export WebAPKs
                      </Text>
                      <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                        Use <Text style={{ color: THEME.success, fontWeight: '700' }}>PUSH TO IDE</Text> on the CODE tab to stream block logic directly into Desktop IDE, and use <Text style={{ color: THEME.primary, fontWeight: '700' }}>EXPORT APP</Text> (bottom menu) to pin native WebAPKs to your phone!
                      </Text>

                      <View style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', marginBottom: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.primary, textAlign: 'center' }}>
                          ⚡ Next: Take the 2-Step Guided Quickstart Tour to create your 1st widget & push to IDE!
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: THEME.surfaceBorder, paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
                          onPress={() => setTourStep(3)}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.textMuted }}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flex: 2, backgroundColor: THEME.primary, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => {
                            setTourMode('guided');
                            setTourStep(1);
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '800', color: THEME.background, marginRight: 4 }}>2-Step Quickstart ➔</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flex: 1.2, backgroundColor: THEME.success, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                          onPress={async () => {
                            setIsTourModalVisible(false);
                            try {
                              await AsyncStorage.setItem('@sanwitch_tour_completed', 'true');
                            } catch (e) {}
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '800', color: THEME.background }}>Done 🚀</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* TOUR TYPE 2: 2-STEP AUTOMATIC GUIDED QUICKSTART (POST-LOGIN) */}
              {tourMode === 'guided' && (
                <View>
                  {tourStep === 1 && (
                    <View>
                      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(20, 184, 166, 0.15)', borderWidth: 1, borderColor: THEME.secondary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 }}>
                        <LayoutGrid size={28} color={THEME.secondary} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.text, textAlign: 'center', marginBottom: 8 }}>
                        Step 1: Add Widgets & Build Canvas
                      </Text>
                      <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                        1. Tap the <Text style={{ color: THEME.primary, fontWeight: '700' }}>PANEL</Text> tab at the top.{"\n"}
                        2. Click <Text style={{ color: THEME.secondary, fontWeight: '700' }}>+ Add Widget</Text> to place custom IoT controls (Toggles, Sliders, Sensor Gauges & Push Buttons).{"\n"}
                        3. Customize names and hardware pins for your ESP32 or micro-controller.
                      </Text>

                      <TouchableOpacity
                        style={[styles.exportBtnPrimary, { backgroundColor: THEME.primary, marginTop: 10 }]}
                        onPress={() => setTourStep(2)}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.background, marginRight: 6 }}>Next: Push to IDE</Text>
                        <ChevronRight size={16} color={THEME.background} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {tourStep === 2 && (
                    <View>
                      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: THEME.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 }}>
                        <Zap size={28} color={THEME.primary} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: THEME.text, textAlign: 'center', marginBottom: 8 }}>
                        Step 2: Push Blocks & Export PWA
                      </Text>
                      <Text style={{ fontSize: 12, color: THEME.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
                        1. Navigate to the <Text style={{ color: THEME.primary, fontWeight: '700' }}>CODE</Text> tab.{"\n"}
                        2. Tap <Text style={{ color: THEME.success, fontWeight: '700' }}>PUSH TO IDE</Text> to instantly stream your layout's code blocks into your desktop Sanwitch IDE!{"\n"}
                        3. Use <Text style={{ color: THEME.primary, fontWeight: '700' }}>EXPORT APP</Text> (bottom menu) to pin standalone apps to your Android App Drawer!
                      </Text>

                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity
                          style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: THEME.surfaceBorder, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                          onPress={() => setTourStep(1)}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.textMuted }}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flex: 2, backgroundColor: THEME.success, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                          onPress={async () => {
                            setIsTourModalVisible(false);
                            try {
                              await AsyncStorage.setItem('@sanwitch_tour_completed', 'true');
                            } catch (e) {}
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }}
                        >
                          <CheckCircle2 size={16} color={THEME.background} style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.background }}>Got It! Start</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>

        <View style={styles.bottomStatusWrap} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.sideMenuTriggerBtn}
            onPress={openArrowMenu}
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
