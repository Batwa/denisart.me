(function () {
class Component extends DCLogic {
constructor(props) {
super(props);
this.state = {
turned: false, paused: false, sound: false, webgl: true, sceneReady: false, menuOpen: false,
clock: '', wx: { kind: 'pending' }, hudScale: 3, heroW: 1440, heroH: 820,
model: '',
wheel: false,
wheelGo: false,
langAt: 1, skillAt: 1,
held: ''
};
this.langDrumRef = (el) => { this.langDrumEl = el; };
this.skillDrumRef = (el) => { this.skillDrumEl = el; };
this.canvasRef = (el) => { this.canvasEl = el; };
this.heroRef = (el) => { this.heroEl = el; };
this.scrollRef = (el) => { this.scrollEl = el; };
this.hudRef = (el) => { this.hudEl = el; };
this.hudPinRef = (el) => { this.hudPinEl = el; };
this.rootRef = (el) => { this.rootEl = el; };
this.modelCanvasRef = (el) => { this.modelCanvasEl = el; };
this.modelHostRef = (el) => { this.modelHostEl = el; };
this.scene3d = null;
this.model3d = null;
}
sceneOpts() {
const p = this.props || {};
return {
palette: p.palette === 'Blue day' ? 'day' : 'golden',
stopMotion: p.stopMotion !== false,
dof: p.depthOfField !== false,
density: p.grassDensity == null ? 1 : p.grassDensity,
walkSpeed: p.walkSpeed == null ? 1 : p.walkSpeed
};
}
renderVals() {
const st = this.state;
const golden = this.sceneOpts().palette === 'golden';
const hud = this.hudInfo(), F = window.HS && window.HS.FONT;
let hudW = 0;
if (F) { hud.lines.forEach((l) => { hudW = Math.max(hudW, F.measure(l) + 2); }); }
const hudX = Math.round(Math.min(72, Math.max(16, st.heroW * 0.05)));
const hudK = this.readoutScale(hudW, st.heroW - 2 * hudX);
const hudHpx = (F ? hud.lines.length * F.LINE : 0) * hudK;
const hudMid = st.heroW / Math.max(1, st.heroH) >= 0.95 ? 0.28 : 0.34;
const p = this.props || {};
const langs = this.wordList(p.languages, 'English, Russian, Spanish');
const skills = this.wordList(p.skills, 'Python, SQL, HTML, CSS, Java, JavaScript, C, C++, Git, spaCy, Presidio, OpenCV, MediaPipe, Tesseract, pytest, Ren\'Py, User Research, Product Analysis, Benchmarking');
return {
factsClass: (({ 'Hand-drawn': 'bf-hand', 'Clean sans': 'bf-sans' })[p.blockFont] || 'bf-serif') + (p.blockLabels === 'Pixel tags' ? ' bl-pixel' : ' bl-caps'),
wheelClass: st.wheel && !st.paused ? 'drum-on' : '', wheelGoClass: st.wheelGo ? 'go' : '',
langBoxClass: (st.wheel && !st.paused ? 'drum-on' : '') + (/lang/.test(st.held) ? ' drum-held' : ''),
skillBoxClass: (st.wheel && !st.paused ? 'drum-on' : '') + (/skill/.test(st.held) ? ' drum-held' : ''),
wheelTab: st.wheel && !st.paused ? '0' : '-1',
langItems: this.listItems(langs), langFaces: this.drumFaces(langs, st.langAt), langDrumRef: this.langDrumRef,
skillItems: this.listItems(skills), skillFaces: this.drumFaces(skills, st.skillAt), skillDrumRef: this.skillDrumRef,
intro: !st.turned, uiClass: st.turned ? 'in' : '', heroClass: st.paused ? 'paused' : '',
paused: st.paused, sound: st.sound, menuOpen: st.menuOpen,
navOpenClass: st.menuOpen ? 'open' : '',
canvasReadyClass: st.sceneReady && st.webgl ? 'ready' : '',
pauseLabel: st.paused ? 'Resume motion' : 'Pause motion',
soundLabel: st.sound ? 'Sound on' : 'Sound off',
heroRef: this.heroRef, canvasRef: this.canvasRef, scrollRef: this.scrollRef, hudRef: this.hudRef, hudPinRef: this.hudPinRef, rootRef: this.rootRef,
modelCanvasRef: this.modelCanvasRef, modelHostRef: this.modelHostRef,
modelClass: st.model,
themeClass: (golden ? 'golden' : 'day') + this.toneClass() + (F ? ' px-on' : ''),
statementClass: ({ 'Hand-drawn': 'f-hand', 'Pixel': 'f-pixel' })[(this.props || {}).headlineFont] || 'f-serif',
hudLabel: hud.label, hudTitle: hud.title, hudW: hudW * hudK + 'px', hudH: hudHpx + 'px',
hudX: hudX + 'px', hudY: Math.max(16, Math.round(st.heroH * hudMid - hudHpx / 2)) + 'px',
heroBase: golden ? '#ead58e' : '#84bbea',
fallbackSky: golden
? 'linear-gradient(180deg, #d9bf70 0%, #ead58e 34%, #f7eabb 61%, #c6d5ac 62%, #69a59c 66%, #35807f 74%, #35807f 100%)'
: 'linear-gradient(180deg, #3f86d2 0%, #84bbea 38%, #dcedf6 61%, #b4d8e8 62%, #4d9cc4 66%, #2a79ad 74%, #2a79ad 100%)',
fallbackSun: golden
? 'radial-gradient(circle, #fffbe8 0%, #ffe6a0 30%, rgba(255, 230, 160, 0) 70%)'
: 'radial-gradient(circle, #ffffff 0%, #fff4d2 30%, rgba(255, 244, 210, 0) 70%)',
fallbackHill: golden ? 'linear-gradient(180deg, #9bb14d 0%, #5a8732 30%, #263417 100%)' : 'linear-gradient(180deg, #7cc64c 0%, #3f9638 30%, #1c3a18 100%)',
toggleMenu: () => this.setState({ menuOpen: !st.menuOpen }),
skipIntro: () => {
if (this.scene3d) { this.scene3d.skip(); }
this.setState({ turned: true });
setTimeout(() => { if (this.scrollEl) { try { this.scrollEl.focus(); } catch (e) {} } }, 60);
},
togglePause: () => {
const paused = !st.paused;
this.drumStop();
this.setState({ paused, wheelGo: false, held: '' });
if (this.scene3d) { this.scene3d.setPaused(paused); }
if (this.model3d && this.model3d.setPaused) { this.model3d.setPaused(paused); }
if (paused) { clearTimeout(this.wheelTimer); } else if (this.wheelSeen && (this.wheelSeen.lang || this.wheelSeen.skill)) { this.armWheel(true); }
},
toggleSound: () => this.setState({ sound: !st.sound })
};
}
sfNow(at) {
const d = at ? new Date(at) : new Date(), tz = 'America/Los_Angeles';
try {
const clock = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz }).format(d).replace(/[\u202f\u00a0]/g, ' ');
const p = {};
new Intl.DateTimeFormat('en-US', { hour: 'numeric', month: 'numeric', hourCycle: 'h23', timeZone: tz }).formatToParts(d).forEach((x) => { p[x.type] = x.value; });
return { clock, hour: (+p.hour) % 24, month: +p.month - 1 };
} catch (e) { return { clock: '', hour: d.getHours(), month: d.getMonth() }; }
}
typicalC(now) {
const HI = [57.8, 60.4, 62.1, 63.0, 64.1, 66.5, 66.3, 67.9, 70.2, 69.8, 63.7, 57.9], LO = [46.6, 47.9, 48.9, 49.7, 51.4, 53.0, 54.4, 55.5, 55.6, 54.4, 50.7, 47.0];
const h = now.hour, m = now.month;
const s = h >= 6 && h <= 15 ? 0.5 - 0.5 * Math.cos(Math.PI * (h - 6) / 9) : 0.5 + 0.5 * Math.cos(Math.PI * ((h + 9) % 24) / 15);
return (LO[m] + (HI[m] - LO[m]) * s - 32) * 5 / 9;
}
tickClock() {
if (this.gone) return;
const now = this.sfNow(), wx = this.state.wx, next = {};
if (now.clock !== this.state.clock) next.clock = now.clock;
if (wx.kind === 'avg') {
const c = this.typicalC(now);
if (Math.abs(wx.c - c) > 0.05) next.wx = { kind: 'avg', c };
} else if (wx.kind === 'live' && Date.now() - wx.read > 75 * 60000) {
next.wx = { kind: 'avg', c: this.typicalC(now) };
}
if (next.clock !== undefined || next.wx) this.setState(next);
const due = wx.kind === 'live' ? 15 : Math.min(30, 5 * Math.pow(2, Math.max(0, (this.wxFails || 1) - 1)));
if (wx.kind !== 'pending' && !document.hidden && Date.now() - (this.wxTried || 0) > due * 60000) this.loadWeather();
clearTimeout(this.clockTimer);
this.clockTimer = setTimeout(() => this.tickClock(), 60000 - (Date.now() % 60000) + 50);
}
loadWeather() {
if (this.gone || this.wxBusy) return;
this.wxTried = Date.now();
if (typeof fetch !== 'function') { this.weatherFailed(); return; }
this.wxBusy = true;
let ctl = null;
try { ctl = new AbortController(); } catch (e) {}
this.wxCtl = ctl;
const giveUp = setTimeout(() => { if (ctl) { try { ctl.abort(); } catch (e) {} } }, 8000);
const url = 'https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current=temperature_2m&timezone=America%2FLos_Angeles';
fetch(url, { signal: ctl ? ctl.signal : undefined, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' })
.then((r) => { if (!r.ok) { throw new Error('status ' + r.status); } return r.json(); })
.then((d) => {
const cur = d && d.current, c = cur ? cur.temperature_2m : null;
if (typeof c !== 'number' || !isFinite(c) || c < -60 || c > 60) { throw new Error('unexpected answer'); }
let read = Date.parse(cur.time + ':00Z') - (d.utc_offset_seconds || 0) * 1000;
if (!isFinite(read)) read = Date.now();
if (Date.now() - read > 75 * 60000) { throw new Error('old reading'); }
clearTimeout(giveUp); this.wxBusy = false; this.wxFails = 0;
if (!this.gone) this.setState({ wx: { kind: 'live', c, read } });
})
.catch(() => { clearTimeout(giveUp); this.wxBusy = false; this.weatherFailed(); });
}
weatherFailed() {
if (this.gone) return;
this.wxFails = (this.wxFails || 0) + 1;
const wx = this.state.wx;
if (wx.kind === 'live' && Date.now() - wx.read < 75 * 60000) return;
this.setState({ wx: { kind: 'avg', c: this.typicalC(this.sfNow()) } });
}
hudInfo() {
const st = this.state, wx = st.wx, lines = ['San Francisco'];
let label = 'San Francisco.', title = '';
if (st.clock) { lines.push(st.clock); label += ' Local time ' + st.clock + '.'; }
if (wx.kind === 'pending') {
lines.push('--\u00b0F / --\u00b0C'); title = 'Checking the live weather.'; label += ' ' + title;
} else {
const f = Math.round(wx.c * 9 / 5 + 32) + 0, c = Math.round(wx.c) + 0, temp = f + ' degrees Fahrenheit, ' + c + ' degrees Celsius.';
if (wx.kind === 'live') {
lines.push(f + '\u00b0F / ' + c + '\u00b0C');
title = 'Live from Open-Meteo. Reading for ' + this.sfNow(wx.read).clock + '.'; label += ' ' + temp;
} else {
lines.push('avg ' + f + '\u00b0F / ' + c + '\u00b0C');
title = 'The live weather could not be loaded. This is the average for this hour in San Francisco.'; label += ' ' + title + ' ' + temp;
}
}
return { lines, label, title };
}
readoutScale(wide, room) {
const pct = +((this.props || {}).readoutSize), k = isFinite(pct) && pct >= 50 ? Math.min(300, pct) / 100 : 1.3;
const dpr = Math.max(1, Math.min(4, window.devicePixelRatio || 1)), base = this.state.hudScale;
let px = Math.max(1, Math.round(base * k * dpr));
if (wide > 0 && room > 0) px = Math.max(1, Math.min(px, Math.floor(room / wide * dpr)));
return px / dpr;
}
paintHud() {
const el = this.hudEl, F = window.HS && window.HS.FONT;
if (!el || !F) return;
const golden = this.sceneOpts().palette === 'golden', lines = this.hudInfo().lines, key = JSON.stringify([lines, golden]);
if (key === this.hudKey) return;
this.hudKey = key;
F.paint(el, lines, golden ? { box: 'rgba(147, 135, 93, 0.92)', ink: '#fdfbe7' } : { box: 'rgba(114, 138, 157, 0.92)', ink: '#fdfdfd' });
}
toneClass() {
const v = (this.props || {}).pageColors;
return v === 'Paper (light)' ? '' : v === '1 Night hill' ? ' t-hill' : v === '3 Graphite' ? ' t-graphite' : ' t-sky';
}
paintLabels() {
const root = this.rootEl, F = window.HS && window.HS.FONT;
if (!root || !F) return;
const golden = this.sceneOpts().palette === 'golden', cs = getComputedStyle(root);
const look = { box: cs.getPropertyValue('--tag-box').trim() || (golden ? 'rgba(147, 135, 93, 0.92)' : 'rgba(114, 138, 157, 0.92)'), ink: cs.getPropertyValue('--tag-ink').trim() || (golden ? '#fdfbe7' : '#fdfdfd') };
const list = root.querySelectorAll('canvas[data-px]'), tag = this.state.hudScale;
for (let i = 0; i < list.length; i++) {
const c = list[i], scale = (+c.getAttribute('data-px-scale') || tag) * (+c.getAttribute('data-px-mult') || 1), key = c.getAttribute('data-px') + '|' + look.box + '|' + look.ink + '|' + scale;
if (c.__px === key) continue;
c.__px = key;
const r = F.paint(c, [c.getAttribute('data-px')], look);
c.style.width = r.w * scale + 'px'; c.style.height = r.h * scale + 'px';
}
}
fitAboutTitle() {
const col = this.rootEl && this.rootEl.querySelector('.about-col'), label = col && col.querySelector('.eyebrow');
if (!label) return;
const usual = window.HS && window.HS.FONT ? window.HS.FONT.LINE * this.state.hudScale : 21;
const extra = Math.max(0, Math.round((label.getBoundingClientRect().height - usual) * 100) / 100);
if (col.__extra !== extra) { col.__extra = extra; col.style.setProperty('--title-extra', extra + 'px'); }
}
paintStatement() {
const root = this.rootEl, F = window.HS && window.HS.FONT;
if (!root || !F) return;
const c = root.querySelector('canvas[data-px-text]'), host = c && c.parentElement;
if (!host || getComputedStyle(c).display === 'none') return;
const span = host.querySelector('span'), text = (span ? span.textContent : '').replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim(), colW = host.clientWidth;
if (!text || !colW) return;
const scale = colW >= 440 ? 4 : colW >= 300 ? 3 : 2, pitch = 11, maxW = Math.floor(colW / scale), ink = getComputedStyle(host).color;
const key = [text, maxW, scale, ink].join('|');
if (c.__px === key) return;
c.__px = key;
const words = text.split(' '), n = words.length, wd = (i, j) => F.measure(words.slice(i, j).join(' '));
let count = 1, from = 0;
for (let i = 2; i <= n; i++) { if (wd(from, i) > maxW) { count++; from = i - 1; } }
const cost = [], cut = [];
for (let k = 0; k <= count; k++) { cost.push(new Array(n + 1).fill(Infinity)); cut.push(new Array(n + 1).fill(0)); }
cost[0][0] = 0;
for (let k = 1; k <= count; k++) {
for (let i = k; i <= n; i++) {
for (let j = k - 1; j < i; j++) {
const lw = wd(j, i);
if (lw > maxW && i - j > 1) continue;
const v = cost[k - 1][j] + (maxW - lw) * (maxW - lw);
if (v < cost[k][i]) { cost[k][i] = v; cut[k][i] = j; }
}
}
}
const lines = [];
for (let k = count, i = n; k >= 1; k--) { const j = cut[k][i]; lines.unshift(words.slice(j, i).join(' ')); i = j; }
let w = 1;
lines.forEach((l) => { w = Math.max(w, F.measure(l)); });
c.width = w; c.height = (lines.length - 1) * pitch + F.H + 1;
const g = c.getContext('2d');
g.clearRect(0, 0, c.width, c.height);
g.fillStyle = ink;
lines.forEach((l, i) => { F.each(l, 0, i * pitch, (x, y) => g.fillRect(x, y, 1, 1)); });
c.style.width = c.width * scale + 'px'; c.style.height = c.height * scale + 'px';
}
wordList(text, fallback) {
const cut = (t) => String(t == null ? '' : t).split(',').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
const list = cut(text);
return list.length ? list : cut(fallback);
}
listItems(words) { return words.map((text, i) => ({ text, sep: i < words.length - 1 ? ', ' : '' })); }
drumFaces(words, at) {
const n = words.length, POS = ['d-m2', 'd-m1', 'd-0', 'd-p1', 'd-p2'], out = [];
for (let j = 0; j < 5; j++) {
const d = (((j - at) % 5) + 7) % 5 - 2;
out.push({ pos: POS[d + 2], text: n ? words[(((at + d) % n) + n) % n] : '' });
}
return out;
}
wheelPause() {
const v = +((this.props || {}).wordPauseMs);
return isFinite(v) && v >= 200 ? Math.min(10000, v) : 1935;
}
armWheel(first) {
clearTimeout(this.wheelTimer);
if (this.gone || this.reduceMotion) return;
const rest = this.wheelPause();
this.wheelTimer = setTimeout(() => { this.turnWheel(); this.armWheel(false); }, first ? rest : rest + 1000);
}
turnWheel() {
const st = this.state, seen = this.wheelSeen || {};
if (this.gone || !st.wheel || st.paused || document.hidden) return;
const next = { wheelGo: true };
if (seen.lang && !this.drumHeld('lang')) next.langAt = st.langAt + 1;
if (seen.skill && !this.drumHeld('skill')) next.skillAt = st.skillAt + 1;
if (next.langAt === undefined && next.skillAt === undefined) return;
this.turnedDrums = { lang: next.langAt !== undefined, skill: next.skillAt !== undefined }; this.turnedAt = performance.now();
this.setState(next);
clearTimeout(this.wheelRest);
this.wheelRest = setTimeout(() => { if (!this.gone) this.setState({ wheelGo: false }); }, 1150);
}
fitDrums() {
[this.langDrumEl, this.skillDrumEl].forEach((el) => {
const probe = el && el.querySelector('.drum-probe'), room = el ? el.clientWidth : 0, need = probe ? probe.offsetWidth : 0;
if (!room || !need) return;
const fit = Math.max(0.5, Math.min(1, room / need));
if (el.__fit === undefined || Math.abs(el.__fit - fit) > 0.004) { el.__fit = fit; el.style.setProperty('--fit', fit.toFixed(3)); }
});
}
drumSetup() {
this.ctl = {};
[['lang', this.langDrumEl], ['skill', this.skillDrumEl]].forEach((d) => {
const key = d[0], el = d[1], box = el && el.closest('.fact');
if (!box) return;
const c = this.ctl[key] = { key, el, box, pos: 0, target: 0, at: 0, manual: false, active: false, focus: false, drag: null, raf: 0, wheelUntil: 0, holdUntil: 0, step: 38, dim: 0.32 };
c.on = {
pointerdown: (ev) => this.drumDown(c, ev), pointermove: (ev) => this.drumMove(c, ev), pointerup: (ev) => this.drumUp(c, ev), pointercancel: (ev) => this.drumUp(c, ev),
pointerleave: () => { if (!c.drag && c.active) this.drumRelease(c); },
keydown: (ev) => this.drumKey(c, ev),
focus: () => { let ring = false; try { ring = box.matches(':focus-visible'); } catch (e) {} if (ring) { c.focus = true; this.syncHeld(); } },
blur: () => { if (c.focus) { c.focus = false; this.drumRelease(c); } }
};
Object.keys(c.on).forEach((type) => box.addEventListener(type, c.on[type]));
c.onWheel = (ev) => this.drumWheel(c, ev);
box.addEventListener('wheel', c.onWheel, { passive: false });
});
}
drumTeardown() {
Object.keys(this.ctl || {}).forEach((key) => {
const c = this.ctl[key];
if (c.raf) cancelAnimationFrame(c.raf);
Object.keys(c.on).forEach((type) => c.box.removeEventListener(type, c.on[type]));
c.box.removeEventListener('wheel', c.onWheel);
});
this.ctl = {};
}
drumLive() { return this.state.wheel && !this.state.paused; }
drumHeld(key) { const c = this.ctl && this.ctl[key]; return !!c && (c.manual || c.active || c.focus || performance.now() < c.holdUntil); }
syncHeld() {
const held = ['lang', 'skill'].filter((k) => this.ctl[k] && (this.ctl[k].active || this.ctl[k].focus)).join(' ');
if (held !== this.state.held) this.setState({ held });
}
drumRelease(c) { c.active = false; c.holdUntil = performance.now() + 2500; this.syncHeld(); }
drumStop() {
Object.keys(this.ctl || {}).forEach((key) => {
const c = this.ctl[key];
if (c.raf) { cancelAnimationFrame(c.raf); c.raf = 0; }
c.drag = null; c.active = false; c.focus = false; c.holdUntil = 0;
if (c.manual) this.drumEnd(c);
});
}
easeTurn(t) {
const x1 = 0.65, x2 = 0.35;
let u = t;
for (let i = 0; i < 8; i++) {
const v = 1 - u, x = 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u - t, dx = 3 * v * v * x1 + 6 * v * u * (x2 - x1) + 3 * u * u * (1 - x2);
if (Math.abs(dx) < 1e-6) break;
u = Math.max(0, Math.min(1, u - x / dx));
}
return 3 * (1 - u) * u * u + u * u * u;
}
drumBegin(c) {
if (c.manual) return;
const at = this.state[c.key + 'At'];
let pos = at;
if (this.state.wheelGo && this.turnedDrums && this.turnedDrums[c.key]) {
const t = (performance.now() - this.turnedAt) / 1000;
if (t >= 0 && t < 1) pos = at - 1 + this.easeTurn(t);
}
const cs = getComputedStyle(c.el);
c.step = parseFloat(cs.getPropertyValue('--step')) || 38; c.dim = parseFloat(cs.getPropertyValue('--dim')) || 0.32;
c.manual = true; c.pos = pos; c.target = at; c.at = Math.round(pos);
if (c.at !== at) this.setState({ [c.key + 'At']: c.at });
this.paintDrum(c);
}
drumEnd(c) {
c.manual = false;
if (this.state[c.key + 'At'] !== c.at) this.setState({ [c.key + 'At']: c.at });
const faces = c.el.querySelectorAll('.drum-face');
for (let j = 0; j < faces.length; j++) { const s = faces[j].style; s.transform = ''; s.opacity = ''; s.transition = ''; }
if (!c.active && !c.focus) c.holdUntil = performance.now() + 2500;
}
paintDrum(c) {
const faces = c.el.querySelectorAll('.drum-face'), off = c.pos - c.at;
for (let j = 0; j < faces.length; j++) {
const d = (((j - c.at) % 5) + 7) % 5 - 2, x = d - off, ax = Math.abs(x);
const turn = ax <= 1 ? x : (x < 0 ? -1 : 1) * (1 + (Math.min(ax, 2) - 1) * 0.55);
const op = ax <= 1 ? 1 - (1 - c.dim) * ax : Math.max(0, c.dim * (1 - (ax - 1) / 0.6));
const s = faces[j].style;
s.transition = 'none';
s.transform = 'var(--see) rotateX(' + (-c.step * turn).toFixed(3) + 'deg) translateZ(var(--r))';
s.opacity = op.toFixed(3);
}
}
drumKick(c) { if (!c.raf) c.raf = requestAnimationFrame(() => this.drumFrame(c)); }
drumFrame(c) {
c.raf = 0;
if (this.gone || !c.manual) return;
const now = performance.now();
if (!c.drag && now >= c.wheelUntil) c.target = Math.round(c.target);
c.pos += (c.target - c.pos) * (c.drag && c.drag.moved ? 0.5 : 0.2);
if (Math.abs(c.target - c.pos) < 0.002) c.pos = c.target;
const at = Math.round(c.pos);
if (at !== c.at) { c.at = at; this.setState({ [c.key + 'At']: at }); }
this.paintDrum(c);
if (c.drag || c.pos !== c.target || now < c.wheelUntil) { this.drumKick(c); } else { this.drumEnd(c); }
}
drumDown(c, ev) {
if (!this.drumLive() || ev.pointerType === 'touch' || ev.button !== 0) return;
c.active = true; this.syncHeld();
this.drumBegin(c);
c.drag = { id: ev.pointerId, y: ev.clientY, pos: c.target, moved: false, pitch: Math.max(16, parseFloat(getComputedStyle(c.el).fontSize) * 1.39) };
try { c.box.setPointerCapture(ev.pointerId); } catch (e) {}
this.drumKick(c);
}
drumMove(c, ev) {
const g = c.drag;
if (!g || ev.pointerId !== g.id) return;
const dy = ev.clientY - g.y;
if (!g.moved && Math.abs(dy) < 3) return;
g.moved = true;
c.target = g.pos - dy / g.pitch;
this.drumKick(c);
}
drumUp(c, ev) {
const g = c.drag;
if (!g || ev.pointerId !== g.id) return;
c.drag = null;
try { c.box.releasePointerCapture(ev.pointerId); } catch (e) {}
this.drumKick(c);
const r = c.box.getBoundingClientRect();
if (ev.type === 'pointercancel' || ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) this.drumRelease(c);
}
drumWheel(c, ev) {
if (!c.active || !this.drumLive() || ev.ctrlKey) return;
ev.preventDefault();
const dy = Math.max(-150, Math.min(150, ev.deltaY * (ev.deltaMode === 1 ? 33 : ev.deltaMode === 2 ? 300 : 1)));
if (!dy) return;
this.drumBegin(c);
c.target += dy / 100;
c.wheelUntil = performance.now() + 160;
this.drumKick(c);
}
drumKey(c, ev) {
if (!this.drumLive() || (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') || ev.altKey || ev.ctrlKey || ev.metaKey) return;
ev.preventDefault();
if (!c.focus) { c.focus = true; this.syncHeld(); }
this.drumBegin(c);
c.target = Math.round(c.target) + (ev.key === 'ArrowDown' ? 1 : -1);
this.drumKick(c);
}
fitHud() {
const w = this.heroEl ? this.heroEl.clientWidth : window.innerWidth, h = this.heroEl ? this.heroEl.clientHeight : window.innerHeight;
const scale = w >= 1000 ? 3 : 2, st = this.state;
if (scale !== st.hudScale || w !== st.heroW || h !== st.heroH) this.setState({ hudScale: scale, heroW: w, heroH: h });
}
componentDidMount() {
this.reduceMotion = false;
try { this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
this.fitHero(); this.fitHud();
this.onWinResize = () => { this.fitHero(); this.fitHud(); };
window.addEventListener('resize', this.onWinResize);
this.paintLabels(); this.paintStatement(); this.fitAboutTitle();
if (window.ResizeObserver && this.rootEl && this.rootEl.querySelector('.statement')) {
this.statementRO = new ResizeObserver(() => { this.paintStatement(); this.fitAboutTitle(); });
this.statementRO.observe(this.rootEl.querySelector('.statement'));
}
this.loadWeather();
this.tickClock();
this.onVisible = () => { if (!document.hidden) this.tickClock(); };
document.addEventListener('visibilitychange', this.onVisible);
this.sceneKey = JSON.stringify(this.sceneOpts());
setTimeout(() => this.initScene(), 0);
const stage = this.modelHostEl;
if (stage) {
this.onModelKey = (ev) => {
const m = this.model3d, step = Math.PI / 12;
if (!m) return;
if (ev.key === 'ArrowLeft') { m.rotateBy(-step); } else if (ev.key === 'ArrowRight') { m.rotateBy(step); } else if (ev.key === 'Home') { m.setAngle(0); } else { return; }
ev.preventDefault(); this.syncModelAria();
};
this.onModelSettle = () => { clearTimeout(this.modelAriaTimer); this.modelAriaTimer = setTimeout(() => this.syncModelAria(), 500); };
stage.addEventListener('keydown', this.onModelKey);
stage.addEventListener('focus', this.onModelSettle);
stage.addEventListener('pointerup', this.onModelSettle);
stage.addEventListener('pointercancel', this.onModelSettle);
if (window.IntersectionObserver) {
this.modelIO = new IntersectionObserver((entries) => {
if (!entries.some((e) => e.isIntersecting)) return;
this.modelIO.disconnect(); this.modelIO = null; this.initModel();
}, { rootMargin: '100px 0px' });
this.modelIO.observe(stage);
} else { setTimeout(() => this.initModel(), 0); }
}
this.wheelSeen = { lang: false, skill: false };
this.pauseWas = this.wheelPause();
this.drumSetup();
const drums =[['lang', this.langDrumEl], ['skill', this.skillDrumEl]].filter((d) => d[1] && d[1].closest('.fact'));
if (!this.reduceMotion && drums.length) {
this.setState({ wheel: true });
if (window.ResizeObserver) {
this.drumRO = new ResizeObserver(() => this.fitDrums());
drums.forEach((d) => { this.drumRO.observe(d[1]); const probe = d[1].querySelector('.drum-probe'); if (probe) this.drumRO.observe(probe); });
}
if (document.fonts && document.fonts.ready) { document.fonts.ready.then(() => { if (!this.gone) this.fitDrums(); }); }
if (window.IntersectionObserver) {
this.wheelIO = new IntersectionObserver((entries) => {
const before = this.wheelSeen.lang || this.wheelSeen.skill;
entries.forEach((e) => { const d = drums.find((x) => x[1].closest('.fact') === e.target); if (d) this.wheelSeen[d[0]] = e.isIntersecting; });
const now = this.wheelSeen.lang || this.wheelSeen.skill;
if (now && !before) { this.armWheel(true); } else if (!now) { clearTimeout(this.wheelTimer); }
}, { threshold: 0.6 });
drums.forEach((d) => this.wheelIO.observe(d[1].closest('.fact')));
} else { drums.forEach((d) => { this.wheelSeen[d[0]] = true; }); this.armWheel(true); }
}
this.armReveal();
}
armReveal() {
clearTimeout(this.revealTimer);
const speed = Math.max(0.3, this.sceneOpts().walkSpeed);
this.revealTimer = setTimeout(() => { if (!this.state.turned) this.setState({ turned: true }); }, (9 / speed + 7) * 1000);
}
componentDidUpdate() {
this.paintHud(); this.paintLabels(); this.paintStatement(); this.fitAboutTitle();
const pr = this.props || {}, wheelKey = [pr.languages, pr.skills, pr.blockFont, this.state.wheel, this.state.paused].join('|');
if (wheelKey !== this.wheelKey) { this.wheelKey = wheelKey; this.fitDrums(); }
const pause = this.wheelPause();
if (pause !== this.pauseWas) {
this.pauseWas = pause;
if (this.state.wheel && !this.state.paused && this.wheelSeen && (this.wheelSeen.lang || this.wheelSeen.skill)) this.armWheel(true);
}
const key = JSON.stringify(this.sceneOpts());
if (key !== this.sceneKey) {
this.sceneKey = key;
clearTimeout(this.optTimer);
if (this.model3d) { try { const o = this.sceneOpts(); this.model3d.setOptions({ palette: o.palette, stopMotion: o.stopMotion }); } catch (e) {} }
this.optTimer = setTimeout(() => {
if (!this.scene3d) return;
if (!this.state.paused) { this.setState({ turned: false }); this.armReveal(); }
try { this.scene3d.setOptions(this.sceneOpts()); } catch (e) { this.setState({ turned: true }); }
}, 200);
}
}
componentWillUnmount() {
this.gone = true;
this.drumTeardown();
clearTimeout(this.optTimer); clearTimeout(this.revealTimer); clearTimeout(this.clockTimer); clearTimeout(this.wheelTimer); clearTimeout(this.wheelRest);
if (this.wheelIO) { try { this.wheelIO.disconnect(); } catch (e) {} }
if (this.drumRO) { try { this.drumRO.disconnect(); } catch (e) {} }
document.removeEventListener('visibilitychange', this.onVisible);
if (this.wxCtl) { try { this.wxCtl.abort(); } catch (e) {} }
window.removeEventListener('resize', this.onWinResize);
if (this.statementRO) { try { this.statementRO.disconnect(); } catch (e) {} }
clearTimeout(this.modelAriaTimer);
if (this.modelIO) { try { this.modelIO.disconnect(); } catch (e) {} }
if (this.modelHostEl && this.onModelKey) {
this.modelHostEl.removeEventListener('keydown', this.onModelKey); this.modelHostEl.removeEventListener('focus', this.onModelSettle);
this.modelHostEl.removeEventListener('pointerup', this.onModelSettle); this.modelHostEl.removeEventListener('pointercancel', this.onModelSettle);
}
if (this.model3d) { try { this.model3d.dispose(); } catch (e) {} this.model3d = null; }
if (this.scene3d) { try { this.scene3d.dispose(); } catch (e) {} this.scene3d = null; }
}
fitHero() {
if (!this.heroEl) return;
const h = window.innerHeight;
if (h >= 480 && h <= 1400) this.heroEl.style.height = h + 'px';
if (this.rootEl) this.rootEl.style.setProperty('--hero-h', this.heroEl.offsetHeight + 'px');
}
initModel() {
const el = this.modelCanvasEl, host = this.modelHostEl;
if (this.model3d || this.gone || !el || !host) return;
if (!window.THREE || !window.HillScene || !window.HillScene.createTurntable) { this.setState({ model: 'off' }); return; }
const o = this.sceneOpts();
try {
this.model3d = window.HillScene.createTurntable(el, host, {
palette: o.palette, stopMotion: o.stopMotion, spin: !this.reduceMotion, period: 24, reduceMotion: this.reduceMotion,
stand: false,
onReady: () => this.setState({ model: 'on' })
});
if (this.state.paused && this.model3d.setPaused) { this.model3d.setPaused(true); }
this.model3d.start();
} catch (e) {
this.model3d = null;
this.setState({ model: 'off' });
}
}
syncModelAria() {
const m = this.model3d, host = this.modelHostEl;
if (!m || !host) return;
const deg = ((Math.round(m.angle * 180 / Math.PI) % 360) + 360) % 360;
host.setAttribute('aria-valuenow', String(deg));
host.setAttribute('aria-valuetext', deg === 0 ? 'Facing you' : 'Turned ' + deg + ' degrees');
}
initScene() {
const el = this.canvasEl, hero = this.heroEl;
if (!el || !hero || !window.THREE || !window.HillScene) { this.setState({ webgl: false, turned: true, model: 'off' }); return; }
const o = this.sceneOpts();
try {
this.scene3d = window.HillScene.create(el, hero, {
palette: o.palette, stopMotion: o.stopMotion, dof: o.dof, density: o.density, walkSpeed: o.walkSpeed,
reduceMotion: this.reduceMotion,
onTurned: () => this.setState({ turned: true }),
onReady: () => this.setState({ sceneReady: true })
});
if (this.hudPinEl && this.scene3d.pin) { this.scene3d.pin(this.hudPinEl); }
if (this.state.paused) { this.scene3d.setPaused(true); this.scene3d.renderAt(0.5); } else { this.scene3d.start(); }
} catch (e) {
this.scene3d = null;
this.setState({ webgl: false, turned: true, model: 'off' });
}
}
}
DC.mount(Component);
})();
