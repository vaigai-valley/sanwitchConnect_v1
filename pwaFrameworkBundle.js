// Sanwitch Connect PWA App Framework Bundle Exporter
// Advanced Hybrid Offline APK Engine (Native Haptics, LocalStorage Persistence, WebBluetooth Auto-Reconnect & Offline SW)

export const generateCompleteStandaloneAppHtml = (appName = 'Sanwitch App', widgets = [], wifiIP = '192.168.4.1') => {
  const cleanAppName = (appName || 'Sanwitch App').replace(/"/g, '&quot;');
  const widgetsJson = JSON.stringify(widgets || []);
  const wifiIpVal = wifiIP || '192.168.4.1';

  const manifestObj = {
    name: appName,
    short_name: appName,
    start_url: '.',
    display: 'standalone',
    background_color: '#0b0d12',
    theme_color: '#38bdf8',
    icons: [
      { src: "data:image/jpeg;base64,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", sizes: "512x512", type: "image/jpeg" },
      { src: 'https://cdn-icons-png.flaticon.com/512/2583/2583271.png', sizes: '512x512', type: 'image/png' }
    ]
  };

  const manifestDataUri = 'data:application/manifest+json;utf8,' + encodeURIComponent(JSON.stringify(manifestObj));

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>${cleanAppName} - Sanwitch PWA</title>
    <meta name="theme-color" content="#0b0d12" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${cleanAppName}" />
    <link rel="icon" href="data:image/jpeg;base64,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" />
    <link rel="apple-touch-icon" href="data:image/jpeg;base64,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" />
    <link rel="manifest" href="${manifestDataUri}" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
      
      :root {
        --primary: #38bdf8;
        --primary-glow: rgba(56, 189, 248, 0.4);
        --secondary: #14b8a6;
        --secondary-glow: rgba(20, 184, 166, 0.4);
        --background: #0b0d12;
        --surface: rgba(22, 24, 31, 0.75);
        --surface-card: #16181f;
        --surface-border: rgba(255, 255, 255, 0.08);
        --surface-border-hover: rgba(56, 189, 248, 0.3);
        --text: #f8fafc;
        --text-muted: #94a3b8;
        --accent: #f43f5e;
        --success: #10b981;
        --warning: #f59e0b;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; outline: none; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: var(--background);
        background-image: 
          radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.12) 0%, transparent 45%),
          radial-gradient(circle at 85% 85%, rgba(20, 184, 166, 0.12) 0%, transparent 45%);
        color: var(--text);
        min-height: 100vh;
        overflow-x: hidden;
        padding-bottom: 30px;
        user-select: none;
      }

      header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(11, 13, 18, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--surface-border);
        padding: 14px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .brand-title {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        background: linear-gradient(135deg, #ffffff 0%, var(--primary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header-actions { display: flex; align-items: center; gap: 10px; }
      
      .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .icon-btn:active { transform: scale(0.92); border-color: var(--primary); }

      .connection-badge {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--surface-border);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }
      .connection-badge.connected {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.4);
        color: var(--success);
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-muted);
        transition: all 0.3s ease;
      }
      .connected .status-dot {
        background: var(--success);
        box-shadow: 0 0 10px var(--success);
        animation: pulse 2s infinite;
      }
      @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

      main { padding: 20px; max-width: 900px; margin: 0 auto; }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--surface-border);
        border-radius: 20px;
        padding: 18px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
      }
      .card:hover {
        border-color: var(--surface-border-hover);
        transform: translateY(-2px);
        box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .card-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .card-value {
        font-size: 1.8rem;
        font-weight: 800;
        letter-spacing: -1px;
        font-family: 'JetBrains Mono', monospace;
      }

      .toggle-wrap { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 52px;
        height: 28px;
      }
      .toggle-switch input { opacity: 0; width: 0; height: 0; }
      .slider-switch {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid var(--surface-border);
        transition: .3s cubic-bezier(0.16, 1, 0.3, 1);
        border-radius: 34px;
      }
      .slider-switch:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .3s cubic-bezier(0.16, 1, 0.3, 1);
        border-radius: 50%;
      }
      input:checked + .slider-switch {
        background-color: var(--primary);
        box-shadow: 0 0 15px var(--primary-glow);
      }
      input:checked + .slider-switch:before {
        transform: translateX(24px);
      }

      .range-wrap { margin-top: 10px; }
      .range-header { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; }
      .range-input {
        -webkit-appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.1);
        outline: none;
      }
      .range-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary);
        cursor: pointer;
        box-shadow: 0 0 10px var(--primary-glow);
        transition: transform 0.1s ease;
      }
      .range-input::-webkit-slider-thumb:active { transform: scale(1.2); }

      .btn-primary {
        width: 100%;
        padding: 12px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        color: #000;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 15px rgba(56, 189, 248, 0.2);
      }
      .btn-primary:active { transform: scale(0.97); }

      .terminal-box {
        margin-top: 24px;
        background: #06070a;
        border: 1px solid var(--surface-border);
        border-radius: 16px;
        padding: 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        color: var(--text-muted);
        height: 120px;
        overflow-y: auto;
        display: flex;
        flex-direction: column-reverse;
      }
      .log-item { margin-bottom: 4px; }
      .log-time { color: var(--primary); margin-right: 8px; }

      .color-grid { display: flex; gap: 8px; margin-top: 8px; justify-content: space-between; }
      .color-dot { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; }
      .color-dot:active { transform: scale(1.15); border-color: #fff; }

      .payload-box {
        background: rgba(0,0,0,0.3);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        padding: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        color: var(--secondary);
        margin-bottom: 8px;
      }
    </style>
  </head>
  <body>
    <header>
      <div class="brand-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        ${cleanAppName}
      </div>
      <div class="header-actions">
        <div class="connection-badge" id="conn-badge">
          <div class="status-dot"></div>
          <span id="conn-status">DISCONNECTED</span>
        </div>
        <button class="icon-btn" id="btn-connect" title="Connect WebBluetooth">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m7 7 10 10-5 5V2l5 5L7 17"/>
          </svg>
        </button>
        <button class="icon-btn" id="btn-wifi" title="Connect WiFi">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </button>
      </div>
    </header>

    <main>
      <div class="dashboard-grid" id="widget-container"></div>

      <div class="terminal-box" id="terminal-output">
        <div class="log-item"><span class="log-time">[SYSTEM]</span> Ready. Sanwitch Connect Local APK Compiler active.</div>
      </div>
    </main>

    <script>
      // Native Haptic Vibration Feedback Helper
      window.triggerHaptic = function(ms) {
        var duration = ms || 15;
        try {
          if (navigator.vibrate) navigator.vibrate(duration);
        } catch(e) {}
      };

      window.INITIAL_WIDGETS = ${widgetsJson};
      const UUID_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
      const UUID_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
      const UUID_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

      let bleDevice = null;
      let bleCharacteristicRx = null;
      let bleCharacteristicTx = null;
      let widgets = [];

      const widgetContainer = document.getElementById('widget-container');
      const termOutput = document.getElementById('terminal-output');
      const connStatus = document.getElementById('conn-status');

      function loadLayout() {
        if (window.INITIAL_WIDGETS && Array.isArray(window.INITIAL_WIDGETS) && window.INITIAL_WIDGETS.length > 0) {
          window.INITIAL_WIDGETS.forEach(function(w) { addWidget(w.type, w.id || w.name, w.cmd); });
        } else {
          addWidget('toggle', 'Power Switch');
          addWidget('slider', 'Speed Control');
          addWidget('gauge', 'Live Sensor');
        }
      }

      function addWidget(type, name, customCmd) {
        var id = name || (type + '_' + Date.now());
        var cmd = customCmd || (id.toUpperCase() + ':EXEC');
        var widget = { type: type, id: id, cmd: cmd };
        var card = document.createElement('div');
        card.className = 'card ' + ((type === 'joystick' || type === 'gauge' || type === 'custom') ? 'card-wide' : '');
        card.id = 'widget-' + id;
        
        var cardHtml = '<div class="card-header"><span class="card-title">' + id + '</span></div>';
        var savedVal = localStorage.getItem('sanwitch_val_' + id);

        if (type === 'toggle') {
          var isChecked = savedVal === '1' ? 'checked' : '';
          cardHtml += '<div class="toggle-wrap"><span style="font-weight: 600; font-size: 0.9rem;">State Control</span><label class="toggle-switch"><input type="checkbox" id="toggle-' + id + '" ' + isChecked + '><span class="slider-switch"></span></label></div>';
        } else if (type === 'slider') {
          var val = savedVal || '0';
          cardHtml += '<div class="range-wrap"><div class="range-header"><span>LEVEL</span><span id="val-' + id + '">' + val + '%</span></div><input type="range" class="range-input" id="slider-' + id + '" min="0" max="100" value="' + val + '"></div>';
        } else if (type === 'button') {
          cardHtml += '<button class="btn-primary" id="btn-' + id + '" style="margin-top: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> TRIGGER ACTION</button>';
        } else if (type === 'gauge') {
          cardHtml += '<div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;"><span class="card-value" id="gauge-' + id + '">24.5</span><span style="color: var(--success); font-size: 0.85rem; font-weight: 700;">● Live Feedback</span></div>';
        } else if (type === 'rgb') {
          cardHtml += '<div class="color-grid" id="rgb-grid-' + id + '">';
          ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'].forEach(function(c) {
            cardHtml += '<div class="color-dot" style="background:' + c + '" data-color="' + c.substring(1) + '"></div>';
          });
          cardHtml += '</div>';
        } else if (type === 'custom') {
          cardHtml += '<div class="payload-box">CMD > ' + cmd + '</div><button class="btn-primary" id="custom-' + id + '">EXECUTE PAYLOAD</button>';
        }

        card.innerHTML = cardHtml;
        widgetContainer.appendChild(card);
        widgets.push(widget);

        if (type === 'toggle') {
          document.getElementById('toggle-' + id).addEventListener('change', function(e) {
            window.triggerHaptic(20);
            var state = e.target.checked ? '1' : '0';
            localStorage.setItem('sanwitch_val_' + id, state);
            window.sendData(id.toUpperCase() + ':' + state + '\\n');
          });
        } else if (type === 'slider') {
          var s = document.getElementById('slider-' + id);
          if (s) {
            s.addEventListener('input', function(e) {
              var v = document.getElementById('val-' + id);
              if (v) v.textContent = e.target.value + '%';
            });
            s.addEventListener('change', function(e) {
              window.triggerHaptic(15);
              localStorage.setItem('sanwitch_val_' + id, e.target.value);
              window.sendData(id.toUpperCase() + ':' + e.target.value + '\\n');
            });
          }
        } else if (type === 'button') {
          document.getElementById('btn-' + id).addEventListener('click', function() {
            window.triggerHaptic(25);
            window.sendData(id.toUpperCase() + ':PUSH\\n');
          });
        } else if (type === 'custom') {
          document.getElementById('custom-' + id).addEventListener('click', function() {
            window.triggerHaptic(25);
            window.sendData(cmd + '\\n');
          });
        } else if (type === 'rgb') {
          var grid = document.getElementById('rgb-grid-' + id);
          if (grid) {
            grid.querySelectorAll('.color-dot').forEach(function(dot) {
              dot.addEventListener('click', function() {
                window.triggerHaptic(15);
                var hex = dot.getAttribute('data-color');
                if (hex) window.sendData('RGB:' + hex + '\\n');
              });
            });
          }
        }
      }

      window.sendData = async function(dataStr) {
        log('TX > ' + dataStr.trim());
        if (bleCharacteristicTx) {
          try {
            const encoder = new TextEncoder();
            await bleCharacteristicTx.writeValue(encoder.encode(dataStr));
            return;
          } catch(e) { log('BLE TX Err: ' + e.message); }
        }
        fetch('http://${wifiIpVal}/cmd?val=' + encodeURIComponent(dataStr), { mode: 'no-cors' }).catch(function() {});
      };

      function log(msg) {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = '<span class="log-time">[' + time + ']</span> ' + msg;
        termOutput.appendChild(div);
      }

      document.getElementById('btn-connect').addEventListener('click', async function() {
        window.triggerHaptic(30);
        try {
          log('Requesting Bluetooth device...');
          bleDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [UUID_SERVICE]
          });
          log('Connecting to GATT server: ' + bleDevice.name);
          const server = await bleDevice.gatt.connect();
          const service = await server.getPrimaryService(UUID_SERVICE);
          bleCharacteristicTx = await service.getCharacteristic(UUID_TX);
          bleCharacteristicRx = await service.getCharacteristic(UUID_RX);
          
          await bleCharacteristicRx.startNotifications();
          bleCharacteristicRx.addEventListener('characteristicvaluechanged', function(e) {
            const decoder = new TextDecoder();
            log('RX < ' + decoder.decode(e.target.value));
          });

          document.getElementById('conn-badge').classList.add('connected');
          connStatus.textContent = 'CONNECTED (BLE)';
          log('WebBluetooth Connected!');
        } catch(e) {
          log('BLE Conn Failed: ' + e.message);
        }
      });

      loadLayout();
    </script>
  </body>
</html>`;
};
