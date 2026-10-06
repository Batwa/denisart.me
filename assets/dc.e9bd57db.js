(function (global) {
'use strict';
class DCLogic {
constructor(props) { this.props = props || {}; this.state = {}; }
setState(update, cb) {
const h = this.__host;
if (!h) { this.state = Object.assign({}, this.state, typeof update === 'function' ? update(this.state, this.props) : update); if (cb) cb(); return; }
h.queue.push(update);
if (cb) h.cbs.push(cb);
h.schedule();
}
forceUpdate(cb) { const h = this.__host; if (!h) return; if (cb) h.cbs.push(cb); h.force = true; h.schedule(); }
componentDidMount() {}
componentDidUpdate() {}
componentWillUnmount() {}
renderVals() { return {}; }
}
const HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;
const WHOLE = /^\{\{\s*([^}]*?)\s*\}\}$/;
function get(path, scope, vals) {
path = path.trim();
if (path === 'true') return true;
if (path === 'false') return false;
if (path === 'null') return null;
if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
const segs = path.split('.'), first = segs[0];
let s = scope, cur;
while (s) { if (first in s.vars) { cur = s.vars[first]; break; } s = s.parent; }
if (!s) cur = vals[first];
for (let i = 1; i < segs.length && cur != null; i++) cur = cur[segs[i]];
return cur;
}
function interp(tpl, scope, vals) { return tpl.replace(HOLE, (m, p) => { const v = get(p, scope, vals); return v == null || v === false ? '' : String(v); }); }
function attrValue(name, tpl, scope, vals) {
const m = WHOLE.exec(tpl);
if (!m) return interp(tpl, scope, vals);
const v = get(m[1], scope, vals);
if (/^(aria|data)-/.test(name)) return v == null ? null : String(v);
if (v == null || v === false) return null;
if (v === true) return '';
return String(v);
}
function parseStyle(s) {
const out = {}, parts = [];
let depth = 0, q = '', cur = '';
for (let i = 0; i < s.length; i++) {
const ch = s[i];
if (q) { cur += ch; if (ch === q) q = ''; continue; }
if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
if (ch === '(') depth++;
if (ch === ')') depth--;
if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; continue; }
cur += ch;
}
if (cur.trim()) parts.push(cur);
parts.forEach((p) => { const i = p.indexOf(':'); if (i > 0) { const k = p.slice(0, i).trim(), v = p.slice(i + 1).trim(); if (k) out[k] = v; } });
return out;
}
class Bound {
constructor(host, el, entry, scope) {
this.host = host; this.el = el; this.entry = entry; this.scope = scope; this.last = {}; this.style = null;
if (entry.on) Object.keys(entry.on).forEach((type) => {
el.addEventListener(type, (ev) => { const fn = get(entry.on[type], scope, host.vals); if (typeof fn === 'function') fn(ev); });
});
if (entry.ref) { const r = get(entry.ref, scope, host.vals); this.ref = r; if (typeof r === 'function') r(el); else if (r && typeof r === 'object') r.current = el; }
}
update(vals) {
const e = this.entry, el = this.el, scope = this.scope;
if (e.t !== undefined) {
const v = get(e.t, scope, vals), s = v == null || typeof v === 'boolean' ? '' : String(v);
if (s !== this.last.t) { this.last.t = s; el.textContent = s; }
}
if (!e.attrs) return;
Object.keys(e.attrs).forEach((name) => {
const v = attrValue(name, e.attrs[name], scope, vals);
if (name === 'style') {
const next = parseStyle(v || ''), prev = this.style || {};
Object.keys(next).forEach((k) => { if (prev[k] !== next[k]) el.style.setProperty(k, next[k]); });
Object.keys(prev).forEach((k) => { if (!(k in next)) el.style.removeProperty(k); });
this.style = next;
return;
}
if (v === this.last[name]) return;
this.last[name] = v;
if (v == null) el.removeAttribute(name); else el.setAttribute(name, v);
});
}
dispose() { const r = this.ref; if (typeof r === 'function') r(null); else if (r && typeof r === 'object') r.current = null; }
}
class Region {
constructor(host, start, end, entry, scope) {
this.host = host; this.start = start; this.end = end; this.entry = entry; this.scope = scope; this.items = [];
let n = start.nextSibling;
while (n && n !== end) { const next = n.nextSibling; n.parentNode.removeChild(n); n = next; }
if (!host.tpls[entry.id]) { const t = document.createElement('template'); t.innerHTML = entry.tpl; host.tpls[entry.id] = t; }
}
make(vars) {
const frag = document.importNode(this.host.tpls[this.entry.id].content, true);
const scope = { vars, parent: this.scope }, bindings = bind(this.host, frag, scope), nodes = Array.prototype.slice.call(frag.childNodes);
this.end.parentNode.insertBefore(frag, this.end);
return { scope, bindings, nodes };
}
drop(item) { item.bindings.forEach((b) => b.dispose()); item.nodes.forEach((n) => { if (n.parentNode) n.parentNode.removeChild(n); }); }
update(vals) {
const e = this.entry;
if (e.if !== undefined) {
const on = !!get(e.if, this.scope, vals);
if (on && !this.items.length) this.items.push(this.make({}));
else if (!on && this.items.length) { this.drop(this.items[0]); this.items = []; }
this.items.forEach((it) => it.bindings.forEach((b) => b.update(vals)));
return;
}
const list = get(e.for, this.scope, vals) || [], n = list.length;
if (n !== this.items.length) {
this.items.forEach((it) => this.drop(it));
this.items = [];
for (let i = 0; i < n; i++) { const vars = {}; vars[e.as] = list[i]; vars.$index = i; this.items.push(this.make(vars)); }
} else {
for (let i = 0; i < n; i++) { this.items[i].scope.vars[e.as] = list[i]; this.items[i].scope.vars.$index = i; }
}
this.items.forEach((it) => it.bindings.forEach((b) => b.update(vals)));
}
dispose() { this.items.forEach((it) => this.drop(it)); this.items = []; }
}
function bind(host, root, scope) {
const out = [];
const walk = (node) => {
let n = node.firstChild;
while (n) {
let next = n.nextSibling;
if (n.nodeType === 8) {
const m = /^dc-(for|if):(\d+)$/.exec(n.nodeValue);
if (m) {
let depth = 1, e = n.nextSibling;
while (e) { if (e.nodeType === 8) { if (/^dc-(for|if):/.test(e.nodeValue)) depth++; else if (/^\/dc-(for|if)$/.test(e.nodeValue) && --depth === 0) break; } e = e.nextSibling; }
if (e) { out.push(new Region(host, n, e, host.table[+m[2]], scope)); next = e.nextSibling; }
}
} else if (n.nodeType === 1) {
const id = n.getAttribute('data-dc');
if (id !== null) out.push(new Bound(host, n, host.table[+id], scope));
walk(n);
}
n = next;
}
};
walk(root);
return out;
}
class Host {
constructor(inst, data) {
this.inst = inst; this.table = data.b; this.name = data.name; this.tpls = {};
this.queue = []; this.cbs = []; this.scheduled = false; this.force = false; this.mounted = false; this.vals = {}; this.bindings = [];
this.table.forEach((e, i) => { e.id = i; });
}
schedule() { if (this.scheduled) return; this.scheduled = true; Promise.resolve().then(() => { this.scheduled = false; this.flush(); }); }
render() { const vals = this.inst.renderVals(); this.vals = vals; this.bindings.forEach((b) => b.update(vals)); }
flush() {
if (!this.mounted) return;
let guard = 0;
while ((this.queue.length || this.force) && guard++ < 50) {
const inst = this.inst, prevState = inst.state, prevProps = this.prevProps || inst.props;
let state = prevState;
this.queue.forEach((u) => { state = Object.assign({}, state, typeof u === 'function' ? u(state, inst.props) : u); });
this.queue.length = 0; this.force = false; this.prevProps = inst.props;
inst.state = state;
this.render();
const cbs = this.cbs.splice(0);
inst.componentDidUpdate(prevProps, prevState);
cbs.forEach((cb) => cb());
}
}
}
const DC = global.DC = {
mount(Component) {
const data = JSON.parse(document.getElementById('dc-data').textContent), root = document.querySelector('#dc-root .sc-host');
if (!root) return null;
const inst = new Component(Object.assign({}, data.props)), host = new Host(inst, data);
inst.__host = host;
host.vals = inst.renderVals();
host.bindings = bind(host, root, null);
host.bindings.forEach((b) => b.update(host.vals));
host.mounted = true;
inst.componentDidMount();
host.flush();
global.__dcRootName = () => host.name;
global.__dcSetProps = (name, partial) => { host.prevProps = inst.props; inst.props = Object.assign({}, inst.props, partial); host.force = true; host.flush(); };
if (global.__DC_TEST__) global.__page = inst;
return inst;
}
};
global.DCLogic = DCLogic;
})(window);
