// Sanwitch Connect PWA App Framework Bundle Exporter
// Premium Fixed-Layout PWA Runtime (Stunning Cyber-Glassmorphism UI)

export const generateCompleteStandaloneAppHtml = (appName = 'Sanwitch App', widgets = [], wifiIP = '192.168.4.1') => {
  const cleanAppName = (appName || 'Sanwitch App').replace(/"/g, '&quot;');
  const widgetsJson = JSON.stringify(widgets || []);
  const wifiIpVal = wifiIP || '192.168.4.1';

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
    <link rel="icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2338bdf8'/><text x='50%' y='65%' font-size='60' text-anchor='middle'>⚡</text></svg>" />
    <link rel="apple-touch-icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2338bdf8'/><text x='50%' y='65%' font-size='60' text-anchor='middle'>⚡</text></svg>" />
    <link rel="manifest" href="data:application/manifest+json;utf8,${encodeURIComponent(JSON.stringify({
    name: appName,
    short_name: appName,
    start_url: '.',
    display: 'standalone',
    background_color: '#0b0d12',
    theme_color: '#38bdf8',
    icons: [
      { src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%230b0d12'/><rect x='5' y='5' width='90' height='90' rx='20' fill='%2316181f' stroke='%2338bdf8' stroke-width='4'/><text x='50%' y='68%' font-size='55' text-anchor='middle'>⚡</text></svg>", sizes: '512x512', type: 'image/svg+xml' },
      { src: 'https://cdn-icons-png.flaticon.com/512/2583/2583271.png', sizes: '512x512', type: 'image/png' }
    ]
  }))}" />
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
        background-attachment: fixed;
        color: var(--text);
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      #app { flex: 1; display: flex; flex-direction: column; height: 100vh; }

      header {
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(11, 13, 18, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--surface-border);
        z-index: 100;
      }

      .logo-wrap { display: flex; align-items: center; gap: 12px; }
      .logo-icon {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px var(--primary-glow);
        font-weight: 800;
        color: #0b0d12;
        font-size: 1.2rem;
      }
      
      h1 { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
      .app-tag { font-size: 0.7rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

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

      nav {
        display: flex;
        background: rgba(22, 24, 31, 0.6);
        backdrop-filter: blur(12px);
        margin: 12px 20px;
        padding: 4px;
        border-radius: 16px;
        border: 1px solid var(--surface-border);
      }
      .nav-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-weight: 700;
        font-size: 0.85rem;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .nav-btn.active {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(20, 184, 166, 0.2));
        border: 1px solid rgba(56, 189, 248, 0.3);
        color: #ffffff;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      main { flex: 1; overflow-y: auto; padding: 8px 20px 80px; position: relative; }
      .view { display: none; opacity: 0; transition: opacity 0.3s ease; }
      .view.active { display: block; opacity: 1; }

      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 6px; }
      
      .card {
        background: var(--surface);
        backdrop-filter: blur(16px);
        border: 1px solid var(--surface-border);
        border-radius: 24px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        position: relative;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        transition: all 0.25s ease;
      }
      .card:hover { border-color: var(--surface-border-hover); transform: translateY(-2px); }
      .card:active { transform: scale(0.98); }
      .card-wide { grid-column: span 2; }
      
      .card-header { display: flex; justify-content: space-between; align-items: center; }
      .card-title { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      .card-value { font-size: 2.2rem; font-weight: 800; color: var(--text); font-family: 'JetBrains Mono', monospace; }
      
      .btn-primary {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: #0b0d12;
        border: none;
        padding: 14px 20px;
        border-radius: 14px;
        font-weight: 800;
        font-size: 0.95rem;
        cursor: pointer;
        width: 100%;
        box-shadow: 0 8px 25px var(--primary-glow);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .btn-primary:active { transform: scale(0.96); opacity: 0.9; }

      /* Custom Toggle Switch */
      .toggle-wrap { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
      .toggle-switch { position: relative; display: inline-block; width: 60px; height: 32px; }
      .toggle-switch input { opacity: 0; width: 0; height: 0; }
      .slider-switch {
        position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(255, 255, 255, 0.08); transition: .3s ease;
        border-radius: 32px; border: 1px solid var(--surface-border);
      }
      .slider-switch:before {
        position: absolute; content: ""; height: 24px; width: 24px; left: 3px; bottom: 3px;
        background-color: var(--text-muted); transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      }
      input:checked + .slider-switch { background-color: var(--primary); border-color: var(--primary); }
      input:checked + .slider-switch:before { transform: translateX(28px); background-color: #0b0d12; }

      /* Range Slider */
      .range-wrap { margin-top: 6px; }
      .range-header { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; }
      .range-input {
        width: 100%; height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 6px; outline: none; -webkit-appearance: none;
      }
      .range-input::-webkit-slider-thumb {
        -webkit-appearance: none; width: 22px; height: 22px; background: linear-gradient(135deg, var(--primary), var(--secondary));
        border-radius: 50%; cursor: pointer; box-shadow: 0 0 12px var(--primary-glow); border: 2px solid #ffffff;
      }

      /* Custom Payload Badge */
      .payload-box {
        background: rgba(0, 0, 0, 0.35);
        border-radius: 12px;
        padding: 10px 14px;
        border: 1px dashed var(--primary-glow);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
        color: var(--primary);
        word-break: break-all;
        margin-bottom: 10px;
      }

      /* Color Input Dot Grid */
      .color-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
      .color-dot { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; }
      .color-dot:active, .color-dot.active { transform: scale(1.15); border-color: #ffffff; box-shadow: 0 0 12px rgba(255,255,255,0.4); }

      /* Joystick Pad */
      .joystick-pad {
        width: 160px; height: 160px; border-radius: 50%; background: rgba(0, 0, 0, 0.4);
        border: 2px solid var(--surface-border); margin: 10px auto; position: relative;
        display: flex; align-items: center; justify-content: center; touch-action: none;
      }
      .joystick-handle {
        width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary));
        box-shadow: 0 0 20px var(--primary-glow); position: absolute; transition: transform 0.05s ease;
      }

      /* Terminal Styling */
      .terminal-card {
        background: #06070a;
        font-family: 'JetBrains Mono', monospace;
        padding: 18px;
        height: 320px;
        display: flex;
        flex-direction: column;
        border-radius: 20px;
        border: 1px solid var(--surface-border);
      }
      #terminal-output { flex: 1; overflow-y: auto; font-size: 0.82rem; line-height: 1.5; color: var(--text); margin-bottom: 12px; }
      .terminal-input-row { display: flex; gap: 10px; align-items: center; background: rgba(255, 255, 255, 0.04); padding: 8px 14px; border-radius: 12px; border: 1px solid var(--surface-border); }
      .terminal-input-row input { flex: 1; background: transparent; border: none; color: white; font-family: inherit; font-size: 0.85rem; outline: none; }

      @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } .card-wide { grid-column: span 1; } }
    </style>
  </head>
  <body>
    <div id="app">
      <header>
        <div class="logo-wrap">
          <div class="logo-icon">⚡</div>
          <div>
            <h1>${cleanAppName}</h1>
            <div class="app-tag">Sanwitch PWA Runtime</div>
          </div>
        </div>
        <div class="header-actions">
          <button id="voice-btn" class="icon-btn" title="Voice Control">🎙️</button>
          <div class="connection-badge" id="conn-status">
            <div class="status-dot"></div>
            <span id="conn-text">Offline</span>
          </div>
        </div>
      </header>

      <nav>
        <button class="nav-btn active" data-view="dashboard">🎛️ Panel</button>
        <button class="nav-btn" data-view="connect">🔗 Link</button>
        <button class="nav-btn" data-view="terminal">💻 Terminal</button>
      </nav>

      <main>
        <div id="view-dashboard" class="view active">
          <div id="widget-container" class="grid"></div>
        </div>

        <div id="view-connect" class="view">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div class="card card-wide">
              <div class="card-header">
                <span class="card-title">Bluetooth BLE Hardware</span>
                <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">WebBluetooth</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Scan and pair directly with ESP32 / Arduino BLE UART hardware.</p>
              <button class="btn-primary" id="ble-scan-btn">
                <span>📡 Scan BLE Devices</span>
              </button>
            </div>

            <div class="card card-wide">
              <div class="card-header">
                <span class="card-title">WiFi Direct IP Connection</span>
                <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700;">HTTP Control</span>
              </div>
              <div class="terminal-input-row" style="margin: 6px 0;">
                <span style="color: var(--secondary); font-family: monospace;">http://</span>
                <input type="text" id="wifi-ip" value="${wifiIpVal}" placeholder="ESP32 IP Address (e.g. 192.168.4.1)">
              </div>
              <button class="btn-primary" style="background: rgba(255, 255, 255, 0.08); color: var(--text); box-shadow: none;" id="wifi-connect-btn">
                <span>Connect via WiFi IP</span>
              </button>
            </div>
          </div>
        </div>

        <div id="view-terminal" class="view">
          <div class="card card-wide terminal-card">
            <div id="terminal-output">
              <div style="color: var(--primary); margin-bottom: 6px;">⚡ Sanwitch Control Terminal Ready...</div>
            </div>
            <div class="terminal-input-row">
              <span style="color: var(--primary); font-weight: 800;">></span>
              <input type="text" id="terminal-input" placeholder="Type custom payload (e.g. RELAY_1:ON or AT+MODE=1)">
            </div>
          </div>
        </div>
      </main>
    </div>

    <script>
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
          window.INITIAL_WIDGETS.forEach(w => addWidget(w.type, w.id || w.name, w.cmd));
        } else {
          addWidget('toggle', 'Power Switch');
          addWidget('slider', 'Speed Control');
          addWidget('gauge', 'Live Sensor');
        }
      }

      function addWidget(type, name = '', customCmd = '') {
        const id = name || (type + '_' + Date.now());
        const cmd = customCmd || (id.toUpperCase() + ':EXEC');
        const widget = { type, id, cmd };
        const card = document.createElement('div');
        card.className = 'card ' + ((type === 'joystick' || type === 'gauge' || type === 'custom') ? 'card-wide' : '');
        card.id = 'widget-' + id;
        
        let cardHtml = '<div class="card-header"><span class="card-title">' + id + '</span></div>';

        if (type === 'toggle') {
          cardHtml += '<div class="toggle-wrap"><span style="font-weight: 600; font-size: 0.9rem;">State Control</span><label class="toggle-switch"><input type="checkbox" onchange="window.sendData(\\'' + id.toUpperCase() + ':\\' + (this.checked ? \'1\' : \'0\') + \'\\\\n\')"><span class="slider-switch"></span></label></div>';
        } else if (type === 'slider') {
          cardHtml += '<div class="range-wrap"><div class="range-header"><span>LEVEL</span><span id="val-' + id + '">0%</span></div><input type="range" class="range-input" min="0" max="100" value="0" oninput="document.getElementById(\\'val-' + id + '\\').textContent = this.value + \'%\'" onchange="window.sendData(\\'' + id.toUpperCase() + ':\\' + this.value + \'\\\\n\')"></div>';
        } else if (type === 'button') {
          cardHtml += '<button class="btn-primary" style="margin-top: 4px;" onclick="window.sendData(\\'' + id.toUpperCase() + ':PUSH\\\\n\')">⚡ TRIGGER ACTION</button>';
        } else if (type === 'gauge') {
          cardHtml += '<div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;"><span class="card-value" id="gauge-' + id + '">24.5</span><span style="color: var(--success); font-size: 0.85rem; font-weight: 700;">● Live Feedback</span></div>';
        } else if (type === 'rgb') {
          cardHtml += '<div class="color-grid">';
          ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'].forEach(c => {
            cardHtml += '<div class="color-dot" style="background:' + c + '" onclick="window.sendData(\\'RGB:' + c.substring(1) + '\\\\n\\')"></div>';
          });
          cardHtml += '</div>';
        } else if (type === 'custom') {
          cardHtml += '<div class="payload-box">CMD > ' + cmd + '</div><button class="btn-primary" onclick="window.sendData(\\'' + cmd + \'\\\\n\')">🚀 EXECUTE CUSTOM PAYLOAD</button>';
        } else if (type === 'joystick') {
          cardHtml += '<div class="joystick-pad" id="joy-' + id + '"><div class="joystick-handle" id="joy-handle-' + id + '"></div></div><div style="text-align:center; font-size:0.75rem; color:var(--text-muted);" id="joy-text-' + id + '">JOYSTICK (0,0)</div>';
        }

        card.innerHTML = cardHtml;
        widgetContainer.appendChild(card);
        widgets.push(widget);

        if (type === 'joystick') setupJoystick(id);
      }

      function setupJoystick(id) {
        const pad = document.getElementById('joy-' + id);
        const handle = document.getElementById('joy-handle-' + id);
        const txt = document.getElementById('joy-text-' + id);
        if (!pad || !handle) return;

        let active = false;
        const maxDist = 55;

        const move = (e) => {
          if (!active) return;
          const rect = pad.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          let dx = clientX - (rect.left + rect.width / 2);
          let dy = clientY - (rect.top + rect.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
          handle.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
          const jx = Math.round((dx / maxDist) * 100);
          const jy = Math.round((-dy / maxDist) * 100);
          txt.textContent = 'JOYSTICK (' + jx + ', ' + jy + ')';
          window.sendData('JOY:' + jx + ',' + jy + '\\n');
        };

        const stop = () => {
          if (!active) return;
          active = false;
          handle.style.transform = 'translate(0px, 0px)';
          txt.textContent = 'JOYSTICK (0, 0)';
          window.sendData('JOY:0,0\\n');
        };

        pad.addEventListener('mousedown', () => active = true);
        pad.addEventListener('touchstart', () => active = true);
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move);
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchend', stop);
      }

      window.sendData = async (data) => {
        log('TX: ' + data.trim(), 'tx');
        if (bleCharacteristicRx) {
          try { await bleCharacteristicRx.writeValue(new TextEncoder().encode(data)); } catch(e) { log('BLE Err', 'err'); }
        } else {
          const ip = document.getElementById('wifi-ip').value || '${wifiIpVal}';
          fetch('http://' + ip + '/control?cmd=' + encodeURIComponent(data.trim()), { mode: 'no-cors' }).catch(()=>{});
        }
      };

      function log(msg, type = '') {
        const div = document.createElement('div');
        div.style.color = type === 'rx' ? 'var(--secondary)' : (type === 'tx' ? 'var(--primary)' : 'var(--text-muted)');
        div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
        termOutput.appendChild(div);
        termOutput.scrollTop = termOutput.scrollHeight;
      }

      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
          document.getElementById('view-' + btn.dataset.view).classList.add('active');
        });
      });

      document.getElementById('terminal-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const val = e.target.value.trim();
          if (val) { window.sendData(val + '\\n'); e.target.value = ''; }
        }
      });

      // BLE Scanner Trigger
      document.getElementById('ble-scan-btn').addEventListener('click', async () => {
        if ('bluetooth' in navigator) {
          try {
            log('Requesting WebBluetooth device...', 'sys');
            bleDevice = await navigator.bluetooth.requestDevice({
              filters: [{ namePrefix: 'Sanwitch' }],
              optionalServices: [UUID_SERVICE]
            });
            const server = await bleDevice.gatt.connect();
            const service = await server.getPrimaryService(UUID_SERVICE);
            bleCharacteristicRx = await service.getCharacteristic(UUID_RX);
            connStatus.classList.add('connected');
            document.getElementById('conn-text').textContent = 'BLE Connected';
            log('Connected to ' + bleDevice.name, 'sys');
          } catch(e) { log('BLE Error: ' + e.message, 'err'); }
        } else {
          log('WebBluetooth is not supported on this browser.', 'err');
        }
      });

      // Web Speech Recognition
      const voiceBtn = document.getElementById('voice-btn');
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.onstart = () => log('Listening for voice command...', 'sys');
        rec.onresult = (e) => {
          const text = e.results[0][0].transcript.toLowerCase();
          log('Voice: ' + text, 'tx');
          widgets.forEach(w => {
            if (text.includes(w.id.toLowerCase())) {
              if (w.type === 'toggle') {
                if (text.includes('on') || text.includes('start')) window.sendData(w.id.toUpperCase() + ':1\\n');
                if (text.includes('off') || text.includes('stop')) window.sendData(w.id.toUpperCase() + ':0\\n');
              } else if (w.type === 'custom') {
                window.sendData(w.cmd + '\\n');
              }
            }
          });
        };
        voiceBtn.addEventListener('click', () => rec.start());
      }

      loadLayout();
    </script>
  </body>
</html>`;
};
