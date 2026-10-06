(function () {
class Component extends DCLogic {
constructor(props) {
super(props);
this.state = { tag: 3 };
this.rootRef = (el) => { this.rootEl = el; };
}
toneClass() {
const v = (this.props || {}).pageColors;
return v === 'Paper (light)' ? '' : v === '1 Night hill' ? ' t-hill' : v === '3 Graphite' ? ' t-graphite' : ' t-sky';
}
renderVals() {
const F = window.HS && window.HS.FONT;
return { rootRef: this.rootRef, themeClass: 'golden' + this.toneClass() + (F ? ' px-on' : '') };
}
paintLabels() {
const root = this.rootEl, F = window.HS && window.HS.FONT;
if (!root || !F) return;
const cs = getComputedStyle(root);
const look = { box: cs.getPropertyValue('--tag-box').trim() || 'rgba(147, 135, 93, 0.92)', ink: cs.getPropertyValue('--tag-ink').trim() || '#fdfbe7' };
const list = root.querySelectorAll('canvas[data-px]'), tag = this.state.tag;
for (let i = 0; i < list.length; i++) {
const c = list[i], text = c.getAttribute('data-px'), room = c.parentElement ? c.parentElement.clientWidth : 0;
let scale = (+c.getAttribute('data-px-scale') || tag) * (+c.getAttribute('data-px-mult') || 1);
if (room > 0) scale = Math.max(2, Math.min(scale, Math.floor(room / (F.measure(text) + 2))));
const key = text + '|' + look.box + '|' + look.ink + '|' + scale;
if (c.__px === key) continue;
c.__px = key;
const r = F.paint(c, [text], look);
c.style.width = r.w * scale + 'px'; c.style.height = r.h * scale + 'px';
}
}
fit() {
const w = this.rootEl ? this.rootEl.clientWidth : window.innerWidth, tag = w >= 1000 ? 3 : 2;
if (tag !== this.state.tag) { this.setState({ tag }); } else { this.paintLabels(); }
}
componentDidMount() {
this.fit();
this.onWinResize = () => this.fit();
window.addEventListener('resize', this.onWinResize);
this.paintLabels();
}
componentDidUpdate() { this.paintLabels(); }
componentWillUnmount() { window.removeEventListener('resize', this.onWinResize); }
}
DC.mount(Component);
})();
