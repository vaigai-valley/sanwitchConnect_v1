import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Switch,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// 🎨 Cyber-Glassmorphism Theme Tokens (Matched 1:1 with pwaFrameworkBundle.js)
const THEME = {
  primary: '#38bdf8',
  primaryGlow: 'rgba(56, 189, 248, 0.4)',
  secondary: '#14b8a6',
  secondaryGlow: 'rgba(20, 184, 166, 0.4)',
  background: '#0b0d12',
  surface: 'rgba(22, 24, 31, 0.75)',
  surfaceCard: '#16181f',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  accent: '#f43f5e',
  success: '#10b981',
  warning: '#f59e0b',
};

/**
 * 🕹️ 2D Interactive Touch Vector Joystick Component
 */
const JoystickPad = ({ id, customCmd, onSend }) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const maxDist = 50;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        let dx = gestureState.dx;
        let dy = gestureState.dy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        pan.setValue({ x: dx, y: dy });
        const jx = Math.round((dx / maxDist) * 100);
        const jy = Math.round((-dy / maxDist) * 100);
        setCoords({ x: jx, y: jy });

        const prefix = customCmd && !customCmd.endsWith(':EXEC') ? customCmd.replace(/:.*/, '') : id.toUpperCase();
        onSend(`${prefix}:${jx},${jy}\n`);
      },
      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        setCoords({ x: 0, y: 0 });
        const prefix = customCmd && !customCmd.endsWith(':EXEC') ? customCmd.replace(/:.*/, '') : id.toUpperCase();
        onSend(`${prefix}:0,0\n`);
      },
    })
  ).current;

  return (
    <View style={styles.joystickContainer}>
      <View style={styles.joystickBase} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.joystickHandle,
            {
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
            },
          ]}
        />
      </View>
      <Text style={styles.joystickText}>
        JOYSTICK ({coords.x}, {coords.y})
      </Text>
    </View>
  );
};

/**
 * 📱 Main Standalone React Native JSX Framework Component
 * Clones 100% of all features from pwaFrameworkBundle.js
 */
export default function JSXAppFramwork({ appName = 'Sanwitch App', initialWidgets = [], wifiIP = '192.168.4.1' }) {
  const [activeTab, setActiveTab] = useState('panel'); // panel | link | code | term
  const [widgets, setWidgets] = useState(initialWidgets.length > 0 ? initialWidgets : [
    { id: 'Power Switch', type: 'toggle' },
    { id: 'Speed Control', type: 'slider' },
    { id: 'Live Sensor', type: 'gauge' }
  ]);
  const [widgetStates, setWidgetStates] = useState({});
  const [connStatus, setConnStatus] = useState('Disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [termLogs, setTermLogs] = useState([]);
  const [termInput, setTermInput] = useState('');
  const [voiceListening, setVoiceListening] = useState(false);

  // Load persistent widget state on startup
  useEffect(() => {
    loadPersistentState();
  }, []);

  const loadPersistentState = async () => {
    try {
      const stored = {};
      for (const w of widgets) {
        const val = await AsyncStorage.getItem(`sanwitch_val_${w.id}`);
        if (val !== null) stored[w.id] = val;
      }
      setWidgetStates(stored);
    } catch (e) {}
  };

  const logTerminal = (msg, type = 'sys') => {
    const timestamp = new Date().toLocaleTimeString();
    setTermLogs((prev) => [...prev, { timestamp, msg, type }]);
  };

  const sendData = (cmd) => {
    logTerminal(`TX: ${cmd.trim()}`, 'tx');
    // Simulates BLE / WiFi command dispatch
  };

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const handleToggleChange = async (id, val) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const strVal = val ? '1' : '0';
    setWidgetStates((prev) => ({ ...prev, [id]: strVal }));
    await AsyncStorage.setItem(`sanwitch_val_${id}`, strVal);
    sendData(`${id.toUpperCase()}:${strVal}\n`);
  };

  const handleSliderChange = async (id, val) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const roundVal = Math.round(val).toString();
    setWidgetStates((prev) => ({ ...prev, [id]: roundVal }));
    await AsyncStorage.setItem(`sanwitch_val_${id}`, roundVal);
    sendData(`${id.toUpperCase()}:${roundVal}\n`);
  };

  const handleButtonClick = (id) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    sendData(`${id.toUpperCase()}:PUSH\n`);
  };

  const handleCustomClick = (id, cmd) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    sendData(`${cmd || `${id.toUpperCase()}:EXEC`}\n`);
  };

  const handleRgbClick = (id, hex) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setWidgetStates((prev) => ({ ...prev, [id]: hex }));
    sendData(`RGB:${hex}\n`);
  };

  const handleVoiceCommand = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setVoiceListening(!voiceListening);
    if (!voiceListening) {
      logTerminal('Listening for voice commands...', 'sys');
      // Simulate Voice AI Trigger
      setTimeout(() => {
        logTerminal('Voice AI Recognized: "Power Switch ON"', 'sys');
        handleToggleChange('Power Switch', true);
        setVoiceListening(false);
      }, 2000);
    }
  };

  const renderWidgetCard = (w) => {
    const isWide = w.type === 'joystick' || w.type === 'gauge' || w.type === 'custom';
    const stateVal = widgetStates[w.id];

    return (
      <View key={w.id} style={[styles.card, isWide && styles.cardWide]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{w.id}</Text>
        </View>

        {/* 1. TOGGLE */}
        {w.type === 'toggle' && (
          <View style={styles.widgetControlRow}>
            <Text style={styles.textMuted}>{stateVal === '1' ? 'ACTIVE' : 'READY'}</Text>
            <Switch
              value={stateVal === '1'}
              onValueChange={(val) => handleToggleChange(w.id, val)}
              trackColor={{ false: '#334155', true: THEME.primary }}
              thumbColor={stateVal === '1' ? THEME.primary : '#94a3b8'}
            />
          </View>
        )}

        {/* 2. SLIDER */}
        {w.type === 'slider' && (
          <View style={{ marginTop: 8 }}>
            <View style={styles.widgetControlRow}>
              <Text style={styles.textMuted}>LEVEL</Text>
              <Text style={{ color: THEME.primary, fontWeight: 'bold' }}>{stateVal || '0'}%</Text>
            </View>
            <TouchableOpacity
              style={styles.sliderMock}
              onPress={() => {
                const nextVal = ((parseInt(stateVal || '0') + 25) % 125).toString();
                handleSliderChange(w.id, parseInt(nextVal > 100 ? 100 : nextVal));
              }}
            >
              <View style={[styles.sliderFill, { width: `${stateVal || 0}%` }]} />
            </TouchableOpacity>
          </View>
        )}

        {/* 3. BUTTON */}
        {w.type === 'button' && (
          <TouchableOpacity style={styles.btnPrimary} onPress={() => handleButtonClick(w.id)}>
            <Text style={styles.btnPrimaryText}>⚡ TRIGGER ACTION</Text>
          </TouchableOpacity>
        )}

        {/* 4. GAUGE */}
        {w.type === 'gauge' && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.gaugeValue}>24.5</Text>
            <Text style={{ color: THEME.success, fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
              ● Live Feedback
            </Text>
          </View>
        )}

        {/* 5. RGB PALETTE */}
        {w.type === 'rgb' && (
          <View style={styles.rgbGrid}>
            {['ff0000', '00ff00', '0000ff', 'ffff00', 'ff00ff', '00ffff', 'ffffff'].map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: `#${c}` }]}
                onPress={() => handleRgbClick(w.id, c)}
              />
            ))}
          </View>
        )}

        {/* 6. CUSTOM PAYLOAD */}
        {w.type === 'custom' && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.payloadBox}>CMD &gt; {w.cmd || `${w.id.toUpperCase()}:EXEC`}</Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => handleCustomClick(w.id, w.cmd)}>
              <Text style={styles.btnPrimaryText}>🚀 EXECUTE PAYLOAD</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 7. JOYSTICK */}
        {w.type === 'joystick' && (
          <JoystickPad id={w.id} customCmd={w.cmd} onSend={sendData} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text style={styles.headerTitle}>{appName}</Text>
          <Text style={styles.headerBadge}>PWA</Text>
        </View>

        <View style={[styles.connBadge, isConnected && styles.connBadgeConnected]}>
          <View style={[styles.connDot, isConnected && styles.connDotConnected]} />
          <Text style={{ color: isConnected ? THEME.success : THEME.textMuted, fontSize: 12, fontWeight: '600' }}>
            {connStatus}
          </Text>
        </View>
      </View>

      {/* TOP NAVIGATION TABS */}
      <View style={styles.navRow}>
        {['panel', 'link', 'code', 'term'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.navBtn, activeTab === tab && styles.navBtnActive]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
          >
            <Text style={[styles.navBtnText, activeTab === tab && styles.navBtnTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* MAIN CONTENT VIEWS */}
      <ScrollView contentContainerStyle={styles.mainScroll}>
        {/* VIEW 1: PANEL (DASHBOARD) */}
        {activeTab === 'panel' && (
          <View style={styles.dashboardGrid}>
            {widgets.map((w) => renderWidgetCard(w))}
          </View>
        )}

        {/* VIEW 2: LINK (CONNECTIVITY) */}
        {activeTab === 'link' && (
          <View style={styles.cardWide}>
            <Text style={styles.cardTitle}>CONNECTIVITY DRIVERS</Text>
            <Text style={styles.textMuted}>Target WiFi IP: {wifiIP}</Text>
            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 12 }]}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                setIsConnected(!isConnected);
                setConnStatus(!isConnected ? 'BLE Connected' : 'Disconnected');
                logTerminal(!isConnected ? 'Connected to Sanwitch BLE' : 'Disconnected BLE', 'sys');
              }}
            >
              <Text style={styles.btnPrimaryText}>
                {!isConnected ? '📡 CONNECT WEBBLUETOOTH' : '🔌 DISCONNECT'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* VIEW 3: CODE VIEWER */}
        {activeTab === 'code' && (
          <View style={styles.cardWide}>
            <Text style={styles.cardTitle}>MICROPYTHON CODE</Text>
            <Text style={styles.codeText}>
              {`# Sanwitch Connect Firmware\nimport machine, time\n\nwhile True:\n    # Auto Generated Code\n    time.sleep(1)`}
            </Text>
          </View>
        )}

        {/* VIEW 4: TERMINAL LOGS */}
        {activeTab === 'term' && (
          <View style={styles.cardWide}>
            <Text style={styles.cardTitle}>SERIAL TERMINAL</Text>
            <ScrollView style={styles.terminalBox}>
              {termLogs.map((log, i) => (
                <Text key={i} style={[styles.termLogText, { color: log.type === 'tx' ? THEME.primary : THEME.secondary }]}>
                  [{log.timestamp}] {log.msg}
                </Text>
              ))}
            </ScrollView>
            <View style={styles.termInputRow}>
              <TextInput
                style={styles.termInput}
                value={termInput}
                onChangeText={setTermInput}
                placeholder="Enter command..."
                placeholderTextColor={THEME.textMuted}
              />
              <TouchableOpacity
                style={styles.btnSend}
                onPress={() => {
                  if (termInput.trim()) {
                    sendData(termInput.trim());
                    setTermInput('');
                  }
                }}
              >
                <Text style={styles.btnPrimaryText}>SEND</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FLOATING VOICE AI ACTION BUTTON */}
      <TouchableOpacity
        style={[styles.fabVoice, voiceListening && styles.fabVoiceActive]}
        onPress={handleVoiceCommand}
      >
        <Text style={{ fontSize: 20 }}>🎙️</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * 📦 Helper function to generate clean JSX Code string for export
 */
export const generateJsxAppCode = (appName, widgets, wifiIP) => {
  return `// Sanwitch Connect Standalone JSX App
import React from 'react';
import JSXAppFramwork from './JSXAppFramwork';

export default function App() {
  return (
    <JSXAppFramwork
      appName="${appName || 'Sanwitch App'}"
      initialWidgets={${JSON.stringify(widgets || [])}}
      wifiIP="${wifiIP || '192.168.4.1'}"
    />
  );
}`;
};

// 💅 STYLES MATRIX
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.surfaceBorder,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    color: THEME.primary,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
  },
  connBadgeConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.textMuted,
  },
  connDotConnected: {
    backgroundColor: THEME.success,
  },
  navRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.surfaceBorder,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: THEME.surfaceCard,
  },
  navBtnActive: {
    backgroundColor: THEME.primary,
  },
  navBtnText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  navBtnTextActive: {
    color: THEME.background,
  },
  mainScroll: {
    padding: 16,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: (width - 44) / 2,
    backgroundColor: THEME.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
  },
  cardWide: {
    width: '100%',
    backgroundColor: THEME.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  widgetControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textMuted: {
    color: THEME.textMuted,
    fontSize: 12,
  },
  sliderMock: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: THEME.primary,
  },
  btnPrimary: {
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: {
    color: THEME.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  gaugeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.primary,
  },
  rgbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  payloadBox: {
    backgroundColor: '#000000',
    color: THEME.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    padding: 8,
    borderRadius: 6,
  },
  joystickContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  joystickBase: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: THEME.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickHandle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.primary,
  },
  joystickText: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 8,
  },
  terminalBox: {
    height: 200,
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  termLogText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    marginBottom: 4,
  },
  termInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  termInput: {
    flex: 1,
    backgroundColor: '#000000',
    color: THEME.text,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
  },
  btnSend: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  fabVoice: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fabVoiceActive: {
    backgroundColor: THEME.accent,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: THEME.secondary,
    fontSize: 12,
    marginTop: 8,
  },
});
