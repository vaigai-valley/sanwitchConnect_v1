// Sanwitch Connect PWA App Framework Bundle Exporter
// Clean fixed-layout PWA runtime (custom widget editing & code tabs reserved for Sanwitch Connect)

export const generateCompleteStandaloneAppHtml = (appName = 'Sanwitch App', widgets = [], wifiIP = '192.168.4.1') => {
  const cleanAppName = (appName || 'Sanwitch App').replace(/"/g, '&quot;');
  const widgetsJson = JSON.stringify(widgets || []);
  const wifiIpVal = wifiIP || '192.168.4.1';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>${cleanAppName} - Sanwitch PWA Framework</title>
    <meta name="theme-color" content="#38bdf8" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${cleanAppName}" />
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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono&display=swap');
      :root {
        --primary: #38bdf8;
        --primary-glow: rgba(56, 189, 248, 0.4);
        --secondary: #14b8a6;
        --background: #0b0d12;
        --surface: #16181f;
        --surface-border: #2b3240;
        --text: #eef2ff;
        --text-muted: #97a0b5;
        --accent: #c2185b;
        --success: #14b8a6;
        --error: #ef4444;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
      body { font-family: 'Inter', sans-serif; background-color: var(--background); background-image: radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(20, 184, 166, 0.15) 0%, transparent 50%); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
      #app { flex: 1; display: flex; flex-direction: column; height: 100vh; }
      header { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid var(--surface-border); z-index: 100; }
      .logo-wrap { display: flex; align-items: center; gap: 10px; }
      .logo-icon { width: 34px; height: 34px; background: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); font-weight: 800; color: #0b0d12; font-size: 1.1rem; }
      h1 { font-size: 1.15rem; font-weight: 700; letter-spacing: -0.5px; }
      .connection-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--surface-border); display: flex; align-items: center; gap: 6px; transition: all 0.3s ease; }
      .connection-badge.connected { background: rgba(34, 197, 94, 0.1); border-color: var(--success); color: var(--success); }
      .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
      .connected .status-dot { background: var(--success); box-shadow: 0 0 8px var(--success); }
      nav { display: flex; background: var(--surface); backdrop-filter: blur(10px); margin: 10px 20px; padding: 4px; border-radius: 12px; border: 1px solid var(--surface-border); }
      .nav-btn { flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-muted); font-weight: 600; font-size: 0.85rem; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; }
      .nav-btn.active { background: rgba(255, 255, 255, 0.1); color: var(--text); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
      main { flex: 1; overflow-y: auto; padding: 10px 20px 100px; position: relative; }
      .view { display: none; }
      .view.active { display: block; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 10px; }
      .card { background: var(--surface); backdrop-filter: blur(16px); border: 1px solid var(--surface-border); border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 12px; position: relative; transition: transform 0.2s ease; }
      .card:active { transform: scale(0.98); }
      .card-wide { grid-column: span 2; }
      .card-title { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      .card-value { font-size: 1.8rem; font-weight: 700; color: var(--text); }
      .btn-primary { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 0.95rem; cursor: pointer; width: 100%; box-shadow: 0 8px 20px rgba(56, 189, 248, 0.3); transition: all 0.3s ease; }
      .btn-primary:active { transform: scale(0.95); }
      .toggle-switch { position: relative; display: inline-block; width: 56px; height: 30px; }
      .toggle-switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255, 255, 255, 0.1); transition: .3s; border-radius: 30px; border: 1px solid var(--surface-border); }
      .slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
      input:checked + .slider { background-color: var(--primary); }
      input:checked + .slider:before { transform: translateX(26px); }
      .range-input { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 5px; outline: none; -webkit-appearance: none; }
      .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: var(--primary); border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px var(--primary-glow); }
      .terminal-card { background: #000; font-family: 'JetBrains Mono', monospace; padding: 15px; height: 240px; display: flex; flex-direction: column; border-radius: 16px; border: 1px solid var(--surface-border); }
      #terminal-output { flex: 1; overflow-y: auto; font-size: 0.8rem; color: var(--accent); margin-bottom: 10px; }
      .terminal-input-row { display: flex; gap: 10px; }
      .terminal-input-row input { flex: 1; background: transparent; border: none; border-bottom: 1px solid var(--surface-border); color: white; font-family: inherit; font-size: 0.8rem; outline: none; }
      .color-input { -webkit-appearance: none; border: none; width: 100%; height: 40px; border-radius: 8px; background: transparent; cursor: pointer; }
      @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } .card-wide { grid-column: span 1; } }
    </style>
  </head>
  <body>
    <div id="app">
      <header>
        <div class="logo-wrap">
          <div class="logo-icon">⚡</div>
          <h1>${cleanAppName}</h1>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="voice-btn" class="connection-badge" style="cursor: pointer; border-radius: 50%; width: 36px; height: 36px; padding: 0; justify-content: center;">🎙️</button>
          <div class="connection-badge" id="conn-status">
            <div class="status-dot"></div>
            <span id="conn-text">Offline</span>
          </div>
        </div>
      </header>

      <nav>
        <button class="nav-btn active" data-view="dashboard">Panel</button>
        <button class="nav-btn" data-view="connect">Connect</button>
        <button class="nav-btn" data-view="terminal">Term</button>
      </nav>

      <main>
        <div id="view-dashboard" class="view active">
          <div id="widget-container" class="grid"></div>
        </div>

        <div id="view-connect" class="view">
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div class="card card-wide">
              <span class="card-title">Bluetooth BLE</span>
              <button class="btn-primary" id="ble-scan-btn">Scan Devices</button>
            </div>
            <div class="card card-wide">
              <span class="card-title">WiFi Connection</span>
              <div class="terminal-input-row" style="margin-bottom: 10px;">
                <input type="text" id="wifi-ip" value="${wifiIpVal}" placeholder="ESP32 IP Address">
              </div>
              <button class="btn-primary" style="background: var(--surface);" id="wifi-connect-btn">Connect via WiFi</button>
            </div>
          </div>
        </div>

        <div id="view-terminal" class="view">
          <div class="card card-wide terminal-card">
            <div id="terminal-output">Ready...</div>
            <div class="terminal-input-row">
              <span style="color: var(--primary)">></span>
              <input type="text" id="terminal-input" placeholder="Command (e.g. RELAY1:1)">
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
          addWidget('toggle', 'Power');
          addWidget('gauge', 'Sensor');
        }
      }

      function addWidget(type, name = '', customCmd = '') {
        const id = name || (type + '_' + Date.now());
        const cmd = customCmd || (id.toUpperCase() + ':EXEC');
        const widget = { type, id, cmd };
        const card = document.createElement('div');
        card.className = 'card ' + ((type === 'joystick' || type === 'gauge') ? 'card-wide' : '');
        card.id = 'widget-' + id;
        card.innerHTML = '<span class="card-title">' + id + '</span>';

        if (type === 'toggle') {
          card.innerHTML += '<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;"><span>Switch</span><label class="toggle-switch"><input type="checkbox" onchange="window.sendData(\\'' + id.toUpperCase() + ':\\' + (this.checked ? \'1\' : \'0\') + \'\\\\n\')"><span class="slider"></span></label></div>';
        } else if (type === 'slider') {
          card.innerHTML += '<div style="margin-top: 10px;"><div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span id="val-' + id + '">0</span></div><input type="range" class="range-input" min="0" max="100" value="0" oninput="document.getElementById(\\'val-' + id + '\\').textContent = this.value" onchange="window.sendData(\\'' + id.toUpperCase() + ':\\' + this.value + \'\\\\n\')"></div>';
        } else if (type === 'button') {
          card.innerHTML += '<button class="btn-primary" style="margin-top: 10px; padding: 10px;" onclick="window.sendData(\\'' + id.toUpperCase() + ':PUSH\\\\n\')">Action</button>';
        } else if (type === 'gauge') {
          card.innerHTML += '<div style="display: flex; align-items: baseline; gap: 8px; margin-top: 5px;"><span class="card-value" id="gauge-' + id + '">--.-</span><span style="color: var(--text-muted); font-size: 0.8rem;">Data</span></div>';
        } else if (type === 'rgb') {
          card.innerHTML += '<input type="color" class="color-input" style="margin-top: 10px;" onchange="window.sendData(\\'RGB:\\' + this.value.substring(1) + \'\\\\n\')">';
        } else if (type === 'custom') {
          card.innerHTML += '<div style="margin-top: 10px;"><span style="font-size: 0.75rem; color: var(--primary); display: block; margin-bottom: 8px;">Cmd: ' + cmd + '</span><button class="btn-primary" style="padding: 10px;" onclick="window.sendData(\\'' + cmd + \'\\\\n\')">Execute Custom</button></div>';
        }

        widgetContainer.appendChild(card);
        widgets.push(widget);
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

      // Web Speech Recognition
      const voiceBtn = document.getElementById('voice-btn');
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.onstart = () => log('Listening...', 'sys');
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
