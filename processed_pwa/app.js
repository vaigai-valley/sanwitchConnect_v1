window.triggerHaptic = function(ms) {
        var duration = ms || 15;
        try { if (navigator.vibrate) navigator.vibrate(duration); } catch(e) {}
      };

      window.INITIAL_WIDGETS = [{"type":"toggle","id":"Power Switch"},{"type":"slider","id":"Speed Control"},{"type":"gauge","id":"Live Sensor"},{"type":"joystick","id":"Drive Pad"},{"type":"rgb","id":"RGB LED"}];
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
          cardHtml += '<div class="toggle-wrap"><span style="font-weight: 600; font-size: 0.9rem;">State Control</span><label class="toggle-switch"><input type="checkbox" id="toggle-' + id + '"><span class="slider-switch"></span></label></div>';
        } else if (type === 'slider') {
          cardHtml += '<div class="range-wrap"><div class="range-header"><span>LEVEL</span><span id="val-' + id + '">0%</span></div><input type="range" class="range-input" id="slider-' + id + '" min="0" max="100" value="0"></div>';
        } else if (type === 'button') {
          cardHtml += '<button class="btn-primary" id="btn-' + id + '" style="margin-top: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> TRIGGER ACTION</button>';
        } else if (type === 'gauge') {
          cardHtml += '<div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;"><span class="card-value" id="gauge-' + id + '">24.5</span><span style="color: var(--success); font-size: 0.85rem; font-weight: 700;">ΓùÅ Live Feedback</span></div>';
        } else if (type === 'rgb') {
          cardHtml += '<div class="color-grid" id="rgb-grid-' + id + '">';
          ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'].forEach(c => {
            cardHtml += '<div class="color-dot" style="background:' + c + '" data-color="' + c.substring(1) + '"></div>';
          });
          cardHtml += '</div>';
        } else if (type === 'custom') {
          cardHtml += '<div class="payload-box">CMD > ' + cmd + '</div><button class="btn-primary" id="custom-' + id + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; pointer-events: none;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71.79-1.81.2-2.55L4.5 16.5z"/><path d="M12 15l-3-3 7.5-7.5.78.78c.42.42.42 1.1 0 1.52L12 15z"/><path d="M9 18l-1.5-1.5"/><path d="M15 12l-1.5-1.5"/></svg> EXECUTE CUSTOM PAYLOAD</button>';
        } else if (type === 'joystick') {
          cardHtml += '<div class="joystick-pad" id="joy-' + id + '"><div class="joystick-handle" id="joy-handle-' + id + '"></div></div><div style="text-align:center; font-size:0.75rem; color:var(--text-muted);" id="joy-text-' + id + '">JOYSTICK (0,0)</div>';
        }

        card.innerHTML = cardHtml;
        widgetContainer.appendChild(card);
        widgets.push(widget);

        if (type === 'toggle') {
          document.getElementById('toggle-' + id)?.addEventListener('change', (e) => {
            window.triggerHaptic(20);
            localStorage.setItem('sanwitch_val_' + id, e.target.checked ? '1' : '0');
            window.sendData(id.toUpperCase() + ':' + (e.target.checked ? '1' : '0') + '\n');
          });
        } else if (type === 'slider') {
          const s = document.getElementById('slider-' + id);
          if (s) {
            s.addEventListener('input', (e) => {
              const v = document.getElementById('val-' + id);
              if (v) v.textContent = e.target.value + '%';
            });
            s.addEventListener('change', (e) => {
              window.triggerHaptic(15);
              localStorage.setItem('sanwitch_val_' + id, e.target.value);
              window.sendData(id.toUpperCase() + ':' + e.target.value + '\n');
            });
          }
        } else if (type === 'button') {
          document.getElementById('btn-' + id)?.addEventListener('click', () => {
            window.triggerHaptic(25);
            window.sendData(id.toUpperCase() + ':PUSH\n');
          });
        } else if (type === 'custom') {
          document.getElementById('custom-' + id)?.addEventListener('click', () => {
            window.triggerHaptic(25);
            window.sendData(cmd + '\n');
          });
        } else if (type === 'rgb') {
          const grid = document.getElementById('rgb-grid-' + id);
          if (grid) {
            grid.querySelectorAll('.color-dot').forEach(dot => {
              dot.addEventListener('click', () => {
                window.triggerHaptic(15);
                const hex = dot.getAttribute('data-color');
                if (hex) window.sendData('RGB:' + hex + '\n');
              });
            });
          }
        } else if (type === 'joystick') {
          setupJoystick(id, customCmd);
        }
      }

      function setupJoystick(id, customCmd = '') {
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
          const prefix = (customCmd && !customCmd.endsWith(':EXEC')) ? customCmd.replace(/:.*/, '') : id.toUpperCase();
          window.sendData(prefix + ':' + jx + ',' + jy + '\n');
        };

        const stop = () => {
          if (!active) return;
          active = false;
          handle.style.transform = 'translate(0px, 0px)';
          txt.textContent = 'JOYSTICK (0, 0)';
          const prefix = (customCmd && !customCmd.endsWith(':EXEC')) ? customCmd.replace(/:.*/, '') : id.toUpperCase();
          window.sendData(prefix + ':0,0\n');
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
          try { await bleCharacteristicRx.writeValue(new TextEncoder().encode(data)); } catch(e) { log('BLE Err: ' + e.message, 'err'); }
        } else {
          const ip = document.getElementById('wifi-ip')?.value || '192.168.4.1';
          fetch('http://' + ip + '/control?cmd=' + encodeURIComponent(data.trim()), { mode: 'no-cors' }).catch(()=>{});
        }
      };

      function log(msg, type = '') {
        const div = document.createElement('div');
        div.style.color = type === 'rx' ? 'var(--secondary)' : (type === 'tx' ? 'var(--primary)' : (type === 'err' ? 'var(--accent)' : 'var(--text-muted)'));
        div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
        const termOutput = document.getElementById('terminal-output');
        if (termOutput) {
          termOutput.appendChild(div);
          termOutput.scrollTop = termOutput.scrollHeight;
        }
      }

      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetBtn = e.currentTarget || btn;
          const viewId = targetBtn.getAttribute('data-view');
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          targetBtn.classList.add('active');
          document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
          if (viewId && document.getElementById('view-' + viewId)) {
            document.getElementById('view-' + viewId).classList.add('active');
          }
        });
      });

      document.getElementById('terminal-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const val = e.target.value.trim();
          if (val) { window.sendData(val + '\n'); e.target.value = ''; }
        }
      });

      document.getElementById('ble-scan-btn')?.addEventListener('click', async () => {
        const connStatus = document.getElementById('conn-status');
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
            
            try {
              bleCharacteristicTx = await service.getCharacteristic(UUID_TX);
              if (bleCharacteristicTx) {
                bleCharacteristicTx.addEventListener('characteristicvaluechanged', (event) => {
                  const val = new TextDecoder().decode(event.target.value).trim();
                  log('RX: ' + val, 'rx');
                  if (val.includes(':')) {
                    const parts = val.split(':');
                    const key = parts[0];
                    const num = parts[1];
                    const el = document.getElementById('gauge-' + key) || document.getElementById('gauge-' + key.toUpperCase());
                    if (el) el.textContent = num;
                  }
                });
                await bleCharacteristicTx.startNotifications();
              }
            } catch(e) { log('TX Notifications not available: ' + e.message, 'sys'); }

            if (connStatus) connStatus.classList.add('connected');
            document.getElementById('conn-text').textContent = 'BLE Connected';
            log('Connected to ' + bleDevice.name, 'sys');
          } catch(e) { log('BLE Error: ' + e.message, 'err'); }
        } else {
          log('WebBluetooth requires Chrome TWA (Trusted Web Activity).', 'err');
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LAUNCH_TWA' }));
          } else {
            alert('WebBluetooth requires Chrome TWA / Custom Tabs on Android. Please open in Chrome for full WebBluetooth support.');
          }
        }
      });

      const voiceBtn = document.getElementById('voice-btn');
      if (voiceBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.onstart = () => log('Listening for voice command...', 'sys');
        rec.onresult = (e) => {
          const text = e.results[0][0].transcript.toLowerCase();
          log('Voice: ' + text, 'tx');
          widgets.forEach(w => {
            const wName = w.id.toLowerCase();
            if (text.includes(wName) || text.includes('all')) {
              if (w.type === 'toggle') {
                if (text.includes('on') || text.includes('start') || text.includes('enable')) window.sendData(w.id.toUpperCase() + ':1\n');
                if (text.includes('off') || text.includes('stop') || text.includes('disable')) window.sendData(w.id.toUpperCase() + ':0\n');
              } else if (w.type === 'button') {
                if (text.includes('press') || text.includes('trigger') || text.includes('push') || text.includes('click')) window.sendData(w.id.toUpperCase() + ':PUSH\n');
              } else if (w.type === 'slider') {
                if (text.includes('max') || text.includes('full') || text.includes('100')) window.sendData(w.id.toUpperCase() + ':100\n');
                if (text.includes('min') || text.includes('zero') || text.includes('0')) window.sendData(w.id.toUpperCase() + ':0\n');
                if (text.includes('half') || text.includes('50')) window.sendData(w.id.toUpperCase() + ':50\n');
              } else if (w.type === 'rgb') {
                if (text.includes('red')) window.sendData('RGB:ff0000\n');
                if (text.includes('green')) window.sendData('RGB:00ff00\n');
                if (text.includes('blue')) window.sendData('RGB:0000ff\n');
                if (text.includes('yellow')) window.sendData('RGB:ffff00\n');
                if (text.includes('white')) window.sendData('RGB:ffffff\n');
              } else if (w.type === 'custom') {
                window.sendData(w.cmd + '\n');
              }
            }
          });
        };
        voiceBtn.addEventListener('click', () => rec.start());
      }

      let deferredInstallPrompt = null;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        const banner = document.getElementById('pwa-install-banner');
        const iconBtn = document.getElementById('pwa-install-btn');
        if (banner) banner.style.display = 'flex';
        if (iconBtn) iconBtn.style.display = 'flex';
      });

      const triggerInstallPrompt = async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const choice = await deferredInstallPrompt.userChoice;
          if (choice.outcome === 'accepted') {
            log('App successfully installed to Android App Drawer!', 'sys');
          }
          deferredInstallPrompt = null;
          const banner = document.getElementById('pwa-install-banner');
          const iconBtn = document.getElementById('pwa-install-btn');
          if (banner) banner.style.display = 'none';
          if (iconBtn) iconBtn.style.display = 'none';
        }
      };

      document.getElementById('pwa-banner-install-btn')?.addEventListener('click', triggerInstallPrompt);
      document.getElementById('pwa-install-btn')?.addEventListener('click', triggerInstallPrompt);

      loadLayout();