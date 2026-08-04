// Sanwitch Connect PWA App Framework Bundle Exporter
// Advanced Hybrid Offline APK Engine (Native Haptics, LocalStorage Persistence, WebBluetooth Auto-Reconnect & Offline SW)

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
    <link rel="icon" href="data:image/jpeg;base64,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" />
31:     <link rel="apple-touch-icon" href="data:image/jpeg;base64,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" />
32:     <link rel="manifest" href="data:application/manifest+json;utf8,${encodeURIComponent(JSON.stringify({
33:     name: appName,
34:     short_name: appName,
35:     start_url: '.',
36:     display: 'standalone',
37:     background_color: '#0b0d12',
38:     theme_color: '#38bdf8',
39:     icons: [
40:       { src: "data:image/jpeg;base64,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", sizes: "512x512", type: "image/jpeg" },
41:       { src: 'https://cdn-icons-png.flaticon.com/512/2583/2583271.png', sizes: '512x512', type: 'image/png' }
42:     ]
43:   }))}" />
44:     <style>
45:       @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
46:       
47:       :root {
48:         --primary: #38bdf8;
49:         --primary-glow: rgba(56, 189, 248, 0.4);
50:         --secondary: #14b8a6;
51:         --secondary-glow: rgba(20, 184, 166, 0.4);
52:         --background: #0b0d12;
53:         --surface: rgba(22, 24, 31, 0.75);
54:         --surface-card: #16181f;
55:         --surface-border: rgba(255, 255, 255, 0.08);
56:         --surface-border-hover: rgba(56, 189, 248, 0.3);
57:         --text: #f8fafc;
58:         --text-muted: #94a3b8;
59:         --accent: #f43f5e;
60:         --success: #10b981;
61:         --warning: #f59e0b;
62:       }
63: 
64:       * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; outline: none; }
65:       
66:       body {
67:         font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
68:         background-color: var(--background);
69:         background-image: 
70:           radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.12) 0%, transparent 45%),
71:           radial-gradient(circle at 85% 85%, rgba(20, 184, 166, 0.12) 0%, transparent 45%);
72:         color: var(--text);
73:         min-height: 100vh;
74:         overflow-x: hidden;
75:         padding-bottom: 30px;
76:         user-select: none;
77:       }

78:       header {
79:         position: sticky;
80:         top: 0;
81:         z-index: 100;
82:         background: rgba(11, 13, 18, 0.85);
83:         backdrop-filter: blur(16px);
84:         -webkit-backdrop-filter: blur(16px);
85:         border-bottom: 1px solid var(--surface-border);
86:         padding: 14px 20px;
87:         display: flex;
88:         align-items: center;
89:         justify-content: space-between;
90:       }

91:       .brand-title {
92:         font-size: 1.1rem;
93:         font-weight: 800;
94:         letter-spacing: -0.5px;
95:         background: linear-gradient(135deg, #ffffff 0%, var(--primary) 100%);
96:         -webkit-background-clip: text;
97:         -webkit-text-fill-color: transparent;
98:         display: flex;
99:         align-items: center;
100:         gap: 8px;
101:       }

102:       .header-actions { display: flex; align-items: center; gap: 10px; }
103:       
104:       .icon-btn {
105:         width: 36px;
106:         height: 36px;
107:         border-radius: 12px;
108:         background: var(--surface-card);
109:         border: 1px solid var(--surface-border);
110:         color: var(--text);
111:         display: flex;
112:         align-items: center;
113:         justify-content: center;
114:         cursor: pointer;
115:         transition: all 0.2s ease;
116:       }
117:       .icon-btn:active { transform: scale(0.92); border-color: var(--primary); }

118:       .connection-badge {
119:         padding: 6px 14px;
120:         border-radius: 20px;
121:         font-size: 0.75rem;
122:         font-weight: 700;
123:         text-transform: uppercase;
124:         letter-spacing: 0.5px;
125:         background: rgba(255, 255, 255, 0.04);
126:         border: 1px solid var(--surface-border);
127:         display: flex;
128:         align-items: center;
129:         gap: 8px;
130:         transition: all 0.3s ease;
131:       }
132:       .connection-badge.connected {
133:         background: rgba(16, 185, 129, 0.12);
134:         border-color: rgba(16, 185, 129, 0.4);
135:         color: var(--success);
136:       }
137:       .status-dot {
138:         width: 8px;
139:         height: 8px;
140:         border-radius: 50%;
141:         background: var(--text-muted);
142:         transition: all 0.3s ease;
143:       }
144:       .connected .status-dot {
145:         background: var(--success);
146:         box-shadow: 0 0 10px var(--success);
147:         animation: pulse 2s infinite;
148:       }
149:       @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

150:       main { padding: 20px; max-width: 900px; margin: 0 auto; }

151:       .dashboard-grid {
152:         display: grid;
153:         grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
154:         gap: 16px;
155:       }

156:       .card {
157:         background: var(--surface);
158:         border: 1px solid var(--surface-border);
159:         border-radius: 20px;
160:         padding: 18px;
161:         backdrop-filter: blur(12px);
162:         -webkit-backdrop-filter: blur(12px);
163:         transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
164:         display: flex;
165:         flex-direction: column;
166:         justify-content: space-between;
167:         position: relative;
168:         overflow: hidden;
169:       }
170:       .card:hover {
171:         border-color: var(--surface-border-hover);
172:         transform: translateY(-2px);
173:         box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
174:       }

175:       .card-header {
176:         display: flex;
177:         align-items: center;
178:         justify-content: space-between;
179:         margin-bottom: 12px;
180:       }
181:       .card-title {
182:         font-size: 0.85rem;
183:         font-weight: 700;
184:         color: var(--text-muted);
185:         text-transform: uppercase;
186:         letter-spacing: 0.5px;
187:       }
188:       .card-value {
189:         font-size: 1.8rem;
190:         font-weight: 800;
191:         letter-spacing: -1px;
192:         font-family: 'JetBrains Mono', monospace;
193:       }

194:       .toggle-wrap { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
195:       .toggle-switch {
196:         position: relative;
197:         display: inline-block;
198:         width: 52px;
199:         height: 28px;
200:       }
201:       .toggle-switch input { opacity: 0; width: 0; height: 0; }
202:       .slider-switch {
203:         position: absolute;
204:         cursor: pointer;
205:         top: 0; left: 0; right: 0; bottom: 0;
206:         background-color: rgba(255, 255, 255, 0.1);
207:         border: 1px solid var(--surface-border);
208:         transition: .3s cubic-bezier(0.16, 1, 0.3, 1);
209:         border-radius: 34px;
210:       }
211:       .slider-switch:before {
212:         position: absolute;
213:         content: "";
214:         height: 20px;
215:         width: 20px;
216:         left: 3px;
217:         bottom: 3px;
218:         background-color: white;
219:         transition: .3s cubic-bezier(0.16, 1, 0.3, 1);
220:         border-radius: 50%;
221:       }
222:       input:checked + .slider-switch {
223:         background-color: var(--primary);
224:         box-shadow: 0 0 15px var(--primary-glow);
225:       }
226:       input:checked + .slider-switch:before {
227:         transform: translateX(24px);
228:       }

229:       .range-wrap { margin-top: 10px; }
230:       .range-header { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; }
231:       .range-input {
232:         -webkit-appearance: none;
233:         width: 100%;
234:         height: 6px;
235:         border-radius: 3px;
236:         background: rgba(255, 255, 255, 0.1);
237:         outline: none;
238:       }
239:       .range-input::-webkit-slider-thumb {
240:         -webkit-appearance: none;
241:         width: 18px;
242:         height: 18px;
243:         border-radius: 50%;
244:         background: var(--primary);
245:         cursor: pointer;
246:         box-shadow: 0 0 10px var(--primary-glow);
247:         transition: transform 0.1s ease;
248:       }
249:       .range-input::-webkit-slider-thumb:active { transform: scale(1.2); }

250:       .btn-primary {
251:         width: 100%;
252:         padding: 12px;
253:         border-radius: 12px;
254:         border: none;
255:         background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
256:         color: #000;
257:         font-weight: 700;
258:         font-size: 0.9rem;
259:         cursor: pointer;
260:         transition: all 0.2s ease;
261:         box-shadow: 0 4px 15px rgba(56, 189, 248, 0.2);
262:       }
263:       .btn-primary:active { transform: scale(0.97); }

264:       .terminal-box {
265:         margin-top: 24px;
266:         background: #06070a;
267:         border: 1px solid var(--surface-border);
268:         border-radius: 16px;
269:         padding: 14px;
270:         font-family: 'JetBrains Mono', monospace;
271:         font-size: 0.75rem;
272:         color: var(--text-muted);
273:         height: 120px;
274:         overflow-y: auto;
275:         display: flex;
276:         flex-direction: column-reverse;
277:       }
278:       .log-item { margin-bottom: 4px; }
279:       .log-time { color: var(--primary); margin-right: 8px; }

280:       .color-grid { display: flex; gap: 8px; margin-top: 8px; justify-content: space-between; }
281:       .color-dot { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; }
282:       .color-dot:active { transform: scale(1.15); border-color: #fff; }

283:       .joystick-pad {
284:         width: 140px;
285:         height: 140px;
286:         border-radius: 50%;
287:         background: rgba(255,255,255,0.03);
288:         border: 2px dashed var(--surface-border);
289:         margin: 10px auto;
290:         position: relative;
291:         touch-action: none;
292:       }
293:       .joystick-handle {
294:         width: 44px;
295:         height: 44px;
296:         border-radius: 50%;
297:         background: var(--primary);
298:         box-shadow: 0 0 15px var(--primary-glow);
299:         position: absolute;
300:         top: 48px;
301:         left: 48px;
302:         transition: transform 0.05s linear;
303:       }

304:       .payload-box {
305:         background: rgba(0,0,0,0.3);
306:         border: 1px solid var(--surface-border);
307:         border-radius: 8px;
308:         padding: 8px;
309:         font-family: 'JetBrains Mono', monospace;
310:         font-size: 0.75rem;
311:         color: var(--secondary);
312:         margin-bottom: 8px;
313:       }
314:     </style>
315:   </head>
316:   <body>
317:     <header>
318:       <div class="brand-title">
319:         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
320:           <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
321:         </svg>
322:         ${cleanAppName}
323:       </div>
324:       <div class="header-actions">
325:         <div class="connection-badge" id="conn-badge">
326:           <div class="status-dot"></div>
327:           <span id="conn-status">DISCONNECTED</span>
328:         </div>
329:         <button class="icon-btn" id="btn-connect" title="Connect WebBluetooth">
330:           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
331:             <path d="m7 7 10 10-5 5V2l5 5L7 17"/>
332:           </svg>
333:         </button>
334:         <button class="icon-btn" id="btn-wifi" title="Connect WiFi">
335:           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
336:             <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
337:             <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
338:             <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
339:             <line x1="12" y1="20" x2="12.01" y2="20"/>
340:           </svg>
341:         </button>
342:       </div>
343:     </header>

344:     <main>
345:       <div class="dashboard-grid" id="widget-container"></div>

346:       <div class="terminal-box" id="terminal-output">
347:         <div class="log-item"><span class="log-time">[SYSTEM]</span> Ready. Sanwitch Connect Local APK Compiler active.</div>
348:       </div>
349:     </main>

350:     <script>
351:       // Native Haptic Vibration Feedback Helper
352:       window.triggerHaptic = function(ms = 15) {
353:         try {
354:           if (navigator.vibrate) navigator.vibrate(ms);
355:         } catch(e) {}
356:       };

357:       window.INITIAL_WIDGETS = ${widgetsJson};
358:       const UUID_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
359:       const UUID_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
360:       const UUID_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

361:       let bleDevice = null;
362:       let bleCharacteristicRx = null;
363:       let bleCharacteristicTx = null;
364:       let widgets = [];

365:       const widgetContainer = document.getElementById('widget-container');
366:       const termOutput = document.getElementById('terminal-output');
367:       const connStatus = document.getElementById('conn-status');

368:       function loadLayout() {
369:         if (window.INITIAL_WIDGETS && Array.isArray(window.INITIAL_WIDGETS) && window.INITIAL_WIDGETS.length > 0) {
370:           window.INITIAL_WIDGETS.forEach(w => addWidget(w.type, w.id || w.name, w.cmd));
371:         } else {
372:           addWidget('toggle', 'Power Switch');
373:           addWidget('slider', 'Speed Control');
374:           addWidget('gauge', 'Live Sensor');
375:         }
376:       }

377:       function addWidget(type, name = '', customCmd = '') {
378:         const id = name || (type + '_' + Date.now());
379:         const cmd = customCmd || (id.toUpperCase() + ':EXEC');
380:         const widget = { type, id, cmd };
381:         const card = document.createElement('div');
382:         card.className = 'card ' + ((type === 'joystick' || type === 'gauge' || type === 'custom') ? 'card-wide' : '');
383:         card.id = 'widget-' + id;
384:         
385:         let cardHtml = '<div class="card-header"><span class="card-title">' + id + '</span></div>';

386:         const savedVal = localStorage.getItem('sanwitch_val_' + id);

387:         if (type === 'toggle') {
388:           const isChecked = savedVal === '1' ? 'checked' : '';
389:           cardHtml += '<div class="toggle-wrap"><span style="font-weight: 600; font-size: 0.9rem;">State Control</span><label class="toggle-switch"><input type="checkbox" id="toggle-' + id + '" ' + isChecked + '><span class="slider-switch"></span></label></div>';
390:         } else if (type === 'slider') {
391:           const val = savedVal || '0';
392:           cardHtml += '<div class="range-wrap"><div class="range-header"><span>LEVEL</span><span id="val-' + id + '">' + val + '%</span></div><input type="range" class="range-input" id="slider-' + id + '" min="0" max="100" value="' + val + '"></div>';
393:         } else if (type === 'button') {
394:           cardHtml += '<button class="btn-primary" id="btn-' + id + '" style="margin-top: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> TRIGGER ACTION</button>';
395:         } else if (type === 'gauge') {
396:           cardHtml += '<div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;"><span class="card-value" id="gauge-' + id + '">24.5</span><span style="color: var(--success); font-size: 0.85rem; font-weight: 700;">● Live Feedback</span></div>';
397:         } else if (type === 'rgb') {
398:           cardHtml += '<div class="color-grid" id="rgb-grid-' + id + '">';
399:           ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'].forEach(c => {
400:             cardHtml += '<div class="color-dot" style="background:' + c + '" data-color="' + c.substring(1) + '"></div>';
401:           });
402:           cardHtml += '</div>';
403:         } else if (type === 'custom') {
404:           cardHtml += '<div class="payload-box">CMD > ' + cmd + '</div><button class="btn-primary" id="custom-' + id + '">EXECUTE PAYLOAD</button>';
405:         } else if (type === 'joystick') {
406:           cardHtml += '<div class="joystick-pad" id="joy-' + id + '"><div class="joystick-handle" id="joy-handle-' + id + '"></div></div><div style="text-align:center; font-size:0.75rem; color:var(--text-muted);" id="joy-text-' + id + '">JOYSTICK (0,0)</div>';
407:         }

408:         card.innerHTML = cardHtml;
409:         widgetContainer.appendChild(card);
410:         widgets.push(widget);

411:         if (type === 'toggle') {
412:           document.getElementById('toggle-' + id)?.addEventListener('change', (e) => {
413:             window.triggerHaptic(20);
414:             const state = e.target.checked ? '1' : '0';
415:             localStorage.setItem('sanwitch_val_' + id, state);
416:             window.sendData(id.toUpperCase() + ':' + state + '\\n');
417:           });
418:         } else if (type === 'slider') {
419:           const s = document.getElementById('slider-' + id);
420:           if (s) {
421:             s.addEventListener('input', (e) => {
422:               const v = document.getElementById('val-' + id);
423:               if (v) v.textContent = e.target.value + '%';
424:             });
425:             s.addEventListener('change', (e) => {
426:               window.triggerHaptic(15);
427:               localStorage.setItem('sanwitch_val_' + id, e.target.value);
428:               window.sendData(id.toUpperCase() + ':' + e.target.value + '\\n');
429:             });
430:           }
431:         } else if (type === 'button') {
432:           document.getElementById('btn-' + id)?.addEventListener('click', () => {
433:             window.triggerHaptic(25);
434:             window.sendData(id.toUpperCase() + ':PUSH\\n');
435:           });
436:         } else if (type === 'custom') {
437:           document.getElementById('custom-' + id)?.addEventListener('click', () => {
438:             window.triggerHaptic(25);
439:             window.sendData(cmd + '\\n');
440:           });
441:         } else if (type === 'rgb') {
442:           const grid = document.getElementById('rgb-grid-' + id);
443:           if (grid) {
444:             grid.querySelectorAll('.color-dot').forEach(dot => {
445:               dot.addEventListener('click', () => {
446:                 window.triggerHaptic(15);
447:                 const hex = dot.getAttribute('data-color');
448:                 if (hex) window.sendData('RGB:' + hex + '\\n');
449:               });
450:             });
451:           }
452:         }
453:       }

454:       window.sendData = async function(dataStr) {
455:         log('TX > ' + dataStr.trim());
456:         if (bleCharacteristicTx) {
457:           try {
458:             const encoder = new TextEncoder();
459:             await bleCharacteristicTx.writeValue(encoder.encode(dataStr));
460:             return;
461:           } catch(e) { log('BLE TX Err: ' + e.message); }
462:         }
463:         fetch('http://${wifiIpVal}/cmd?val=' + encodeURIComponent(dataStr), { mode: 'no-cors' }).catch(() => {});
464:       };

465:       function log(msg) {
466:         const time = new Date().toLocaleTimeString().split(' ')[0];
467:         const div = document.createElement('div');
468:         div.className = 'log-item';
469:         div.innerHTML = '<span class="log-time">[' + time + ']</span> ' + msg;
470:         termOutput.appendChild(div);
471:       }

472:       document.getElementById('btn-connect')?.addEventListener('click', async () => {
473:         window.triggerHaptic(30);
474:         try {
475:           log('Requesting Bluetooth device...');
476:           bleDevice = await navigator.bluetooth.requestDevice({
477:             acceptAllDevices: true,
478:             optionalServices: [UUID_SERVICE]
479:           });
480:           log('Connecting to GATT server: ' + bleDevice.name);
481:           const server = await bleDevice.gatt.connect();
482:           const service = await server.getPrimaryService(UUID_SERVICE);
483:           bleCharacteristicTx = await service.getCharacteristic(UUID_TX);
484:           bleCharacteristicRx = await service.getCharacteristic(UUID_RX);
485:           
486:           await bleCharacteristicRx.startNotifications();
487:           bleCharacteristicRx.addEventListener('characteristicvaluechanged', (e) => {
488:             const decoder = new TextDecoder();
489:             log('RX < ' + decoder.decode(e.target.value));
490:           });

491:           document.getElementById('conn-badge').classList.add('connected');
492:           connStatus.textContent = 'CONNECTED (BLE)';
493:           log('WebBluetooth Connected!');
494:         } catch(e) {
495:           log('BLE Conn Failed: ' + e.message);
496:         }
497:       });

498:       loadLayout();
499:     </script>
500:   </body>
501: </html>`;
502: };
