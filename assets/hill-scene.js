(function (global) {
'use strict';
var THREE = global.THREE;
if (!THREE) { return; }
var HS = global.HS = global.HS || {};
HS.version = '2.0';
HS.modules = HS.modules || {};
HS.register = function (name, factory) { HS.modules[name] = factory; };
HS.PALETTES = {
golden: {
skyTop: '#dfc47c', skyMid: '#eeda9a', skyHorizon: '#f9eec6',
sunGlow: '#ffe4a2', sunDisc: '#fffbe8',
sunLight: '#ffd28f', sunIntensity: 2.4,
ambSky: '#f2e3b4', ambSkyIntensity: 0.70,
ambGround: '#8a9858', ambGroundIntensity: 0.32,
fill: '#fff0d2', fillIntensity: 0.26,
fogStart: 30, fogDensity: 0.0021, fogMax: 0.95,
seaNear: '#35807f', seaMid: '#69a59c', seaFar: '#c6d5ac', seaGlint: '#fff3c4',
landA: '#b9b98a', landB: '#9da576', landC: '#7f8c5c',
bridge: '#c2402a',
grassRoot: '#263417', grassMid: '#5a8732', grassLight: '#9bb14d', grassTip: '#dcd87c', grassDry: '#c6b066', soil: '#1a240f',
cloud: '#fff7da',
sunAz: 0.058, sunEl: 0.075
},
day: {
skyTop: '#3f86d2', skyMid: '#84bbea', skyHorizon: '#dcedf6',
sunGlow: '#fff4d2', sunDisc: '#ffffff',
sunLight: '#fff0d0', sunIntensity: 2.3,
ambSky: '#cfe4fb', ambSkyIntensity: 0.74,
ambGround: '#6f9a58', ambGroundIntensity: 0.36,
fill: '#ffffff', fillIntensity: 0.30,
fogStart: 30, fogDensity: 0.0019, fogMax: 0.93,
seaNear: '#2a79ad', seaMid: '#4d9cc4', seaFar: '#b4d8e8', seaGlint: '#ffffff',
landA: '#9fbcd6', landB: '#86a6c4', landC: '#6c8fae',
bridge: '#cf4a30',
grassRoot: '#1c3a18', grassMid: '#3f9638', grassLight: '#7cc64c', grassTip: '#cdea8c', grassDry: '#b9c668', soil: '#152a10',
cloud: '#ffffff',
sunAz: 0.085, sunEl: 0.30
}
};
HS.PRINCE_COLORS = {
skin: '#e2c69e', skinShade: '#c4a078', face: '#ead6b4', ear: '#d9ab8a',
hair: '#dcae3e', hairLight: '#f3d46c', hairDeep: '#a2741f',
suit: '#62a336', suitDark: '#3f7a2b', suitGlow: '#b6d24c',
sash: '#cfa340', scarf: '#e3a431', scarfDeep: '#d2761a', scarfGlow: '#f09a2a',
shoe: '#a8873a', eye: '#1b1712', button: '#a8742a', mouth: '#6b4a3a'
};
HS.LAYOUT = {
camZ: 8.0,
eyeHeight: 1.05,
princeZ: 0.0,
princeHeight: 1.15,
seaY: -7.0,
wind: { dirX: 0.94, dirZ: 0.34, speed: 2.2, strength: 1.0 },
bridge: { x: -123, z: -640, yaw: 0.78, scale: 0.127 },
farRadius: 1500
};
HS.rng = function (seed) {
var a = (seed >>> 0) || 1;
return function () {
a |= 0; a = (a + 0x6D2B79F5) | 0;
var t = Math.imul(a ^ (a >>> 15), 1 | a);
t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
};
function hash2(ix, iy) {
var n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
return n - Math.floor(n);
}
HS.hash2 = hash2;
HS.noise2 = function (x, y) {
var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
var a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
HS.fbm2 = function (x, y, oct) {
var s = 0, a = 0.5, n = oct || 4;
for (var i = 0; i < n; i++) { s += a * HS.noise2(x, y); x = x * 2.03 + 17.7; y = y * 2.03 + 9.2; a *= 0.5; }
return s;
};
function sstep(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
HS.smoothstep = sstep;
HS.crestZ = function (x) {
return -2.3 + 0.55 * Math.sin(x * 0.31 + 0.8) + 0.25 * Math.sin(x * 0.83 - 1.1) - 0.05 * x;
};
HS.heightAt = function (x, z) {
var dx = x - 2.4, dz = z + 0.3;
var knoll = 0.26 * Math.exp(-(dx * dx) / 12.0 - (dz * dz) / 18.0);
var tilt = 0.05 * Math.max(-6.5, Math.min(3.0, x));
tilt -= 0.55 * sstep(1.0, -4.5, x);
var roll = 0.06 * Math.sin(x * 0.9 + 0.4) * Math.cos(z * 0.7 - 0.3) + 0.035 * Math.sin(x * 1.9 - z * 1.3 + 1.7);
var h = knoll + tilt + roll;
var d = HS.crestZ(x) - z;
if (d > 0) {
var s = Math.min(d / 4.5, 1.0);
h -= (s * s * (3 - 2 * s)) * 10.0 + d * 0.12;
} else if (d > -1.6) {
var r = 1 + d / 1.6;
h -= 0.10 * r * r;
}
return h;
};
HS.grassScaleAt = function (x, z) {
var trailZ = HS.LAYOUT.princeZ + 0.10 * Math.sin(x * 0.6 + 0.4);
var d = Math.abs(z - trailZ);
var k = 1 - sstep(0.22, 0.85, d);
var fade = sstep(-1.6, 0.2, x);
return 1 - 0.52 * k * fade;
};
var U = HS.U = {
uTime: { value: 0 },
uFrame: { value: 0 },
uWindDir: { value: new THREE.Vector2(HS.LAYOUT.wind.dirX, HS.LAYOUT.wind.dirZ).normalize() },
uWindSpeed: { value: HS.LAYOUT.wind.speed },
uWindStrength: { value: HS.LAYOUT.wind.strength },
uSunDir: { value: new THREE.Vector3(0, 0.1, -1).normalize() },
uSunColor: { value: new THREE.Color(1, 1, 1) },
uSunGlow: { value: new THREE.Color(1, 1, 1) },
uSunDisc: { value: new THREE.Color(1, 1, 1) },
uSkyTop: { value: new THREE.Color() },
uSkyMid: { value: new THREE.Color() },
uSkyHorizon: { value: new THREE.Color() },
uAmbSky: { value: new THREE.Color() },
uAmbGround: { value: new THREE.Color() },
uFogStart: { value: 30 },
uFogDensity: { value: 0.002 },
uFogMax: { value: 0.95 },
uFillDir: { value: new THREE.Vector3(-0.35, 0.40, 0.85).normalize() },
uFillColor: { value: new THREE.Color() },
uPrincePos: { value: new THREE.Vector3(999, 0, 999) },
uBoil: { value: 1.0 }
};
HS.shared = function (extra) {
var o = {};
for (var k in U) { if (Object.prototype.hasOwnProperty.call(U, k)) { o[k] = U[k]; } }
if (extra) { for (var j in extra) { if (Object.prototype.hasOwnProperty.call(extra, j)) { o[j] = extra[j]; } } }
return o;
};
HS.color = function (hex) { return new THREE.Color(hex); };
HS.applyPalette = function (name) {
var p = HS.PALETTES[name] || HS.PALETTES.golden;
HS.palette = p; HS.paletteName = HS.PALETTES[name] ? name : 'golden';
U.uSkyTop.value.set(p.skyTop); U.uSkyMid.value.set(p.skyMid); U.uSkyHorizon.value.set(p.skyHorizon);
U.uSunGlow.value.set(p.sunGlow); U.uSunDisc.value.set(p.sunDisc);
U.uSunColor.value.set(p.sunLight).multiplyScalar(p.sunIntensity);
U.uAmbSky.value.set(p.ambSky).multiplyScalar(p.ambSkyIntensity);
U.uAmbGround.value.set(p.ambGround).multiplyScalar(p.ambGroundIntensity);
U.uFillColor.value.set(p.fill).multiplyScalar(p.fillIntensity);
U.uFogStart.value = p.fogStart; U.uFogDensity.value = p.fogDensity; U.uFogMax.value = p.fogMax;
var ce = Math.cos(p.sunEl);
U.uSunDir.value.set(Math.sin(p.sunAz) * ce, Math.sin(p.sunEl), -Math.cos(p.sunAz) * ce).normalize();
return p;
};
HS.gustAt = function (x, z, t) {
var w = U.uWindDir.value, sp = U.uWindSpeed.value;
var px = x - w.x * t * sp, pz = z - w.y * t * sp;
var g = HS.noise2(px * 0.17, pz * 0.17) * 0.6 + HS.noise2(px * 0.53 + 7.1, pz * 0.53 + 7.1) * 0.4;
return sstep(0.2, 0.85, g) * U.uWindStrength.value;
};
var GLSL = HS.GLSL = {};
GLSL.uniforms = [
'uniform float uTime;',
'uniform float uFrame;',
'uniform vec2 uWindDir;',
'uniform float uWindSpeed;',
'uniform float uWindStrength;',
'uniform vec3 uSunDir;',
'uniform vec3 uSunColor;',
'uniform vec3 uSunGlow;',
'uniform vec3 uSunDisc;',
'uniform vec3 uSkyTop;',
'uniform vec3 uSkyMid;',
'uniform vec3 uSkyHorizon;',
'uniform vec3 uAmbSky;',
'uniform vec3 uAmbGround;',
'uniform float uFogStart;',
'uniform float uFogDensity;',
'uniform float uFogMax;',
'uniform vec3 uFillDir;',
'uniform vec3 uFillColor;',
'uniform vec3 uPrincePos;',
'uniform float uBoil;'
].join('\n');
GLSL.noise = [
'float hsHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
'float hsHash3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }',
'float hsNoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
'  return mix(mix(hsHash(i), hsHash(i + vec2(1.0, 0.0)), u.x), mix(hsHash(i + vec2(0.0, 1.0)), hsHash(i + vec2(1.0, 1.0)), u.x), u.y); }',
'float hsNoise3(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);',
'  float a = mix(mix(hsHash3(i), hsHash3(i + vec3(1.0, 0.0, 0.0)), u.x), mix(hsHash3(i + vec3(0.0, 1.0, 0.0)), hsHash3(i + vec3(1.0, 1.0, 0.0)), u.x), u.y);',
'  float b = mix(mix(hsHash3(i + vec3(0.0, 0.0, 1.0)), hsHash3(i + vec3(1.0, 0.0, 1.0)), u.x), mix(hsHash3(i + vec3(0.0, 1.0, 1.0)), hsHash3(i + vec3(1.0, 1.0, 1.0)), u.x), u.y);',
'  return mix(a, b, u.z); }',
'float hsFbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * hsNoise(p); p = p * 2.03 + vec2(17.7, 9.2); a *= 0.5; } return s; }'
].join('\n');
GLSL.sky = [
'vec3 hsSky(vec3 d){',
'  float h = clamp(d.y, 0.0, 1.0);',
'  vec3 col = mix(uSkyHorizon, uSkyMid, smoothstep(0.0, 0.16, h));',
'  col = mix(col, uSkyTop, smoothstep(0.10, 0.62, h));',
'  float s = max(dot(normalize(d), uSunDir), 0.0);',
'  col += uSunGlow * (pow(s, 5.0) * 0.30 + pow(s, 36.0) * 0.45);',
'  return col;',
'}'
].join('\n');
GLSL.fog = [
'vec3 hsFog(vec3 col, vec3 worldPos){',
'  vec3 v = worldPos - cameraPosition; float dist = length(v);',
'  float f = (1.0 - exp(-max(dist - uFogStart, 0.0) * uFogDensity)) * uFogMax;',
'  vec3 dir = v / max(dist, 1e-4);',
'  vec3 fc = hsSky(normalize(vec3(dir.x, 0.02 + max(dir.y, 0.0) * 0.4, dir.z)));',
'  return mix(col, fc, f);',
'}'
].join('\n');
GLSL.wind = [
'float hsGust(vec2 xz){',
'  vec2 p = xz - uWindDir * uTime * uWindSpeed;',
'  float g = hsNoise(p * 0.17) * 0.6 + hsNoise(p * 0.53 + 7.1) * 0.4;',
'  return smoothstep(0.2, 0.85, g) * uWindStrength;',
'}',
'float hsLightDrift(vec2 xz){',
'  vec2 p = xz - uWindDir * uTime * 0.55;',
'  return 0.78 + 0.22 * smoothstep(0.28, 0.72, hsNoise(p * 0.085 + 3.7));',
'}'
].join('\n');
GLSL.common = [GLSL.uniforms, GLSL.noise, GLSL.sky, GLSL.fog, GLSL.wind].join('\n');
HS.makePaperMaterial = function (opts) {
opts = opts || {};
var color = new THREE.Color(opts.color || '#ffffff');
var trans = opts.transColor ? new THREE.Color(opts.transColor) : color.clone();
var uniforms = HS.shared({
uColor: { value: color },
uTransColor: { value: trans },
uTranslucency: { value: opts.translucency == null ? 0.0 : opts.translucency },
uCrumple: { value: opts.crumple == null ? 0.5 : opts.crumple },
uCrumpleScale: { value: opts.crumpleScale == null ? 16.0 : opts.crumpleScale },
uFiber: { value: opts.fiber == null ? 0.5 : opts.fiber },
uRim: { value: opts.rim == null ? 0.6 : opts.rim },
uBoilAmt: { value: opts.boil == null ? 0.0012 : opts.boil },
uEmissive: { value: opts.emissive == null ? 0.0 : opts.emissive },
uFogAmt: { value: opts.fog == null ? 1.0 : opts.fog }
});
var useFacets = !(opts.crumple === 0);
var mat = new THREE.ShaderMaterial({
uniforms: uniforms,
side: opts.side == null ? THREE.FrontSide : opts.side,
vertexShader: [
GLSL.common,
'uniform float uBoilAmt;',
'varying vec3 vWorldPos; varying vec3 vWorldNormal; varying vec3 vObjPos;',
'void main(){',
'  vec3 p = position;',
'  // stop-motion paper boil: a tiny continuous wobble that changes every stepped frame',
'  float b = hsNoise3(position * 23.0 + vec3(uFrame * 7.31, uFrame * 3.17, uFrame * 5.71)) - 0.5;',
'  p += normal * b * uBoilAmt * uBoil;',
'  vObjPos = position;',
'  vec4 wp = modelMatrix * vec4(p, 1.0);',
'  vWorldPos = wp.xyz;',
'  vWorldNormal = normalize(mat3(modelMatrix) * normal);',
'  gl_Position = projectionMatrix * viewMatrix * wp;',
'}'
].join('\n'),
fragmentShader: [
GLSL.common,
'uniform vec3 uColor; uniform vec3 uTransColor; uniform float uTranslucency; uniform float uCrumple; uniform float uCrumpleScale;',
'uniform float uFiber; uniform float uRim; uniform float uEmissive; uniform float uFogAmt;',
'uniform mat4 modelMatrix;',
'varying vec3 vWorldPos; varying vec3 vWorldNormal; varying vec3 vObjPos;',
'// crumpled paper = flat facets with straight creases: nearest-cell (Voronoi) lookup. xyz = facet tilt, w = distance to the crease',
'vec4 hsFacet(vec3 p){',
'  vec3 ip = floor(p), fp = fract(p); float d1 = 9.0, d2 = 9.0; vec3 id = vec3(0.0);',
'  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {',
'    vec3 g = vec3(float(i), float(j), float(k));',
'    vec3 o = vec3(hsHash3(ip + g), hsHash3(ip + g + 17.13), hsHash3(ip + g + 41.71));',
'    vec3 r = g + o - fp; float d = dot(r, r);',
'    if (d < d1) { d2 = d1; d1 = d; id = ip + g; } else if (d < d2) { d2 = d; }',
'  }',
'  vec3 rv = vec3(hsHash3(id + 3.1), hsHash3(id + 7.7), hsHash3(id + 13.3)) - 0.5;',
'  return vec4(rv, sqrt(d2) - sqrt(d1));',
'}',
'void main(){',
'  vec3 N = normalize(vWorldNormal);',
(opts.flat ? '  N = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));' : ''),
'  if (!gl_FrontFacing) N = -N;',
'  float crease = 0.0; float cell = 0.5;',
(useFacets ? [
'  vec3 cp = vObjPos * uCrumpleScale;',
'  cp += (vec3(hsNoise3(cp * 0.55), hsNoise3(cp * 0.55 + 5.2), hsNoise3(cp * 0.55 + 9.1)) - 0.5) * 1.5;   // warp: irregular, non-tiled facets',
'  vec4 fc = hsFacet(cp);',
'  vec3 g = mat3(modelMatrix) * fc.xyz;',
'  g -= N * dot(g, N);',
'  N = normalize(N + g * uCrumple * 0.55);',
'  float cmask = smoothstep(0.25, 0.7, hsNoise3(cp * 1.7 + 3.3));',
'  crease = (1.0 - smoothstep(0.0, 0.045, fc.w)) * uCrumple * cmask;',
'  cell = fc.x + 0.5;'
].join('\n') : ''),
'  vec3 V = normalize(cameraPosition - vWorldPos);',
'  vec3 L = uSunDir;',
'  float ndl = dot(N, L);',
'  float wrap = clamp((ndl + 0.4) / 1.4, 0.0, 1.0);',
'  vec3 amb = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5);',
'  float fill = clamp(dot(N, uFillDir), 0.0, 1.0);',
'  vec3 base = uColor;',
'  // paper fibre: fine luminance speckle; creases read slightly darker',
'  float fib = hsNoise3(vObjPos * 210.0) - 0.5;',
'  base *= 1.0 + fib * 0.12 * uFiber;',
'  base *= 1.0 - crease * 0.10;',
'  vec3 col = base * (amb + uSunColor * wrap * wrap + uFillColor * fill);',
'  // back-light through thin paper (varies facet to facet, darker in the folds)',
'  float back = clamp(-ndl, 0.0, 1.0);',
'  float toward = pow(clamp(dot(V, -L) * 0.5 + 0.5, 0.0, 1.0), 3.0);',
'  float thick = (0.82 + 0.36 * cell) * (1.0 - crease * 0.35);',
'  col += uTransColor * uSunColor * uTranslucency * thick * (0.26 * back + 0.62 * toward * (0.35 + 0.65 * back));',
'  // warm rim where the surface turns edge-on to the camera and toward the light',
'  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);',
'  float rimMask = smoothstep(-0.35, 0.25, ndl) * clamp(dot(V, -L) * 0.7 + 0.6, 0.0, 1.0);',
'  col += uSunColor * mix(vec3(1.0), base, 0.4) * fres * rimMask * uRim * 0.8;',
'  col += base * uEmissive;',
'  col = mix(col, hsFog(col, vWorldPos), uFogAmt);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <colorspace_fragment>',
'}'
].join('\n')
});
mat.extensions = { derivatives: true };
return mat;
};
HS.lerp = function (a, b, t) { return a + (b - a) * t; };
HS.clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
HS.damp = function (cur, target, lambda, dt) { return cur + (target - cur) * (1 - Math.exp(-lambda * dt)); };
})(window);
;
(function (global) {
'use strict';
var HS = global.HS = global.HS || {};
var H = 7, LINE = 9;
var G = {
' ': ['...', '...', '...', '...', '...', '...', '...'],
'A': ['.###.', '#...#', '#####', '#...#', '#...#', '#...#', '#...#'],
'B': ['####.', '#...#', '####.', '#...#', '#...#', '#...#', '####.'],
'C': ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
'E': ['#####', '#....', '###..', '#....', '#....', '#....', '#####'],
'F': ['#####', '#....', '###..', '#....', '#....', '#....', '#....'],
'G': ['.####', '#....', '#..##', '#...#', '#...#', '#...#', '.###.'],
'H': ['#...#', '#...#', '#####', '#...#', '#...#', '#...#', '#...#'],
'I': ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
'J': ['....#', '....#', '....#', '....#', '....#', '#...#', '.###.'],
'K': ['#...#', '#..#.', '###..', '#..#.', '#...#', '#...#', '#...#'],
'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
'P': ['####.', '#...#', '####.', '#....', '#....', '#....', '#....'],
'Q': ['.###.', '#...#', '#...#', '#...#', '#...#', '#..#.', '.##.#'],
'R': ['####.', '#...#', '####.', '#...#', '#...#', '#...#', '#...#'],
'S': ['.####', '#....', '.###.', '....#', '....#', '#...#', '.###.'],
'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
'V': ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
'W': ['#...#', '#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
'X': ['#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#', '#...#'],
'Y': ['#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..', '..#..'],
'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
'a': ['.....', '.....', '.###.', '....#', '.####', '#...#', '.####'],
'b': ['#....', '#....', '#.##.', '##..#', '#...#', '#...#', '####.'],
'c': ['.....', '.....', '.###.', '#...#', '#....', '#...#', '.###.'],
'd': ['....#', '....#', '.##.#', '#..##', '#...#', '#...#', '.####'],
'e': ['.....', '.....', '.###.', '#...#', '#####', '#....', '.####'],
'f': ['..##', '.#..', '####', '.#..', '.#..', '.#..', '.#..'],
'g': ['.....', '.....', '.####', '#...#', '#...#', '.####', '....#', '####.'],
'h': ['#....', '#....', '#.##.', '##..#', '#...#', '#...#', '#...#'],
'i': ['#', '.', '#', '#', '#', '#', '#'],
'j': ['....#', '.....', '....#', '....#', '....#', '#...#', '#...#', '.###.'],
'k': ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#'],
'l': ['#.', '#.', '#.', '#.', '#.', '#.', '.#'],
'm': ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#...#', '#...#'],
'n': ['.....', '.....', '#.##.', '##..#', '#...#', '#...#', '#...#'],
'o': ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
'p': ['.....', '.....', '#.##.', '##..#', '#...#', '####.', '#....', '#....'],
'q': ['.....', '.....', '.##.#', '#..##', '#...#', '.####', '....#', '....#'],
'r': ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'],
's': ['.....', '.....', '.####', '#....', '.###.', '....#', '####.'],
't': ['.#.', '.#.', '###', '.#.', '.#.', '.#.', '..#'],
'u': ['.....', '.....', '#...#', '#...#', '#...#', '#...#', '.####'],
'v': ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
'w': ['.....', '.....', '#...#', '#...#', '#.#.#', '#.#.#', '.####'],
'x': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
'y': ['.....', '.....', '#...#', '#...#', '#...#', '.####', '....#', '####.'],
'z': ['.....', '.....', '#####', '...#.', '..#..', '.#...', '#####'],
'0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
'1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '#####'],
'2': ['.###.', '#...#', '....#', '..##.', '.#...', '#...#', '#####'],
'3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
'4': ['...##', '..#.#', '.#..#', '#...#', '#####', '....#', '....#'],
'5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
'6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
'7': ['#####', '#...#', '....#', '...#.', '..#..', '..#..', '..#..'],
'8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
'9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
':': ['.', '.', '#', '.', '.', '#', '.'],
'.': ['.', '.', '.', '.', '.', '.', '#'],
',': ['.', '.', '.', '.', '.', '.', '#', '#'],
'\'': ['#', '#', '.', '.', '.', '.', '.'],
'!': ['#', '#', '#', '#', '#', '.', '#'],
'?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
'-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
'+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
'/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
'%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
'(': ['..#', '.#.', '#..', '#..', '#..', '.#.', '..#'],
')': ['#..', '.#.', '..#', '..#', '..#', '.#.', '#..'],
'~': ['.....', '.....', '.#...', '#.#.#', '...#.', '.....', '.....'],
'°': ['.#.', '#.#', '.#.', '...', '...', '...', '...']
};
function measure(text) {
var w = 0, n = 0, i, g;
for (i = 0; i < text.length; i++) { g = G[text.charAt(i)]; if (g) { w += g[0].length; n++; } }
return w + Math.max(0, n - 1);
}
function each(text, x0, y0, put) {
var x = x0, i, g, r, c;
for (i = 0; i < text.length; i++) {
g = G[text.charAt(i)];
if (!g) { continue; }
for (r = 0; r < g.length; r++) { for (c = 0; c < g[r].length; c++) { if (g[r].charAt(c) === '#') { put(x + c, y0 + r); } } }
x += g[0].length + 1;
}
}
function bitmap(text, pad) {
pad = pad == null ? 1 : pad;
var w = measure(text) + 2 * pad, h = H + 2 * pad, ink = new Uint8Array(w * h);
each(text, pad, pad, function (x, y) { if (x >= 0 && x < w && y >= 0 && y < h) { ink[y * w + x] = 255; } });
return { w: w, h: h, ink: ink };
}
function paint(canvas, lines, opts) {
opts = opts || {};
var widths = [], w = 1, i, h = Math.max(1, lines.length) * LINE;
for (i = 0; i < lines.length; i++) { widths.push(measure(lines[i]) + 2); w = Math.max(w, widths[i]); }
if (canvas.width !== w) { canvas.width = w; }
if (canvas.height !== h) { canvas.height = h; }
var c2 = canvas.getContext('2d');
c2.clearRect(0, 0, w, h);
for (i = 0; i < lines.length; i++) {
if (!lines[i]) { continue; }
c2.fillStyle = opts.box || 'rgba(0, 0, 0, 0.35)';
c2.fillRect(0, i * LINE, widths[i], LINE);
c2.fillStyle = opts.ink || '#ffffff';
each(lines[i], 1, i * LINE + 1, function (x, y) { c2.fillRect(x, y, 1, 1); });
}
return { w: w, h: h };
}
HS.FONT = { H: H, LINE: LINE, glyphs: G, measure: measure, each: each, bitmap: bitmap, paint: paint };
})(window);
;
(function () {
'use strict';
var THREE = window.THREE, HS = window.HS;
if (!THREE || !HS) { return; }
var TUNE = {
skyRadius: 1900,
cloudAlphaGolden: [0.30, 0.20, 0.26],
cloudAlphaDay: [0.95, 0.40, 0.45],
calmAmount: 0.22,
calmFrom: 0.40, calmTo: 0.56,
rays: 0.06,
grain: 0.07,
seaStroke: 0.60,
seaGlint: 0.85,
seaColumn: 0.20,
land: { bridgeFog: 0.24 },
bridgeMargin: 0.04,
boats: 3, gulls: 4
};
var G = HS.GLSL;
var GLSL_ENV = [
'uniform float uGrainAmt; uniform float uSunAddK;',
'vec3 envSunAdd(vec3 dir){',
'  vec3 dv = dir - uSunDir; float a2 = dot(dv, dv);',
'  float core = exp(-a2 / (2.0 * 0.0155 * 0.0155));',
'  float mid = exp(-a2 / (2.0 * 0.045 * 0.045));',
'  float halo = exp(-a2 / (2.0 * 0.16 * 0.16));',
'  return (uSunDisc * core * 1.25 + uSunGlow * (mid * 0.42 + halo * 0.14)) * uSunAddK;',
'}',
'vec3 envGrain(vec3 col, vec3 dir){',
'  vec2 pp = vec2(dir.x, dir.y) / max(-dir.z, 0.05) * 1300.0;',
'  float g1 = hsNoise(pp * vec2(0.05, 0.55)) - 0.5;',
'  float g2 = hsNoise(pp * 0.33 + 17.0) - 0.5;',
'  float g3 = hsHash(floor(pp * 0.6) + 3.0) - 0.5;',
'  return col * (1.0 + (g1 * 0.5 + g2 * 0.35 + g3 * 0.15) * uGrainAmt);',
'}'
].join('\n');
var SKY_VERT = [
G.common,
'varying vec3 vWorldPos;',
'void main(){',
'  vec4 wp = modelMatrix * vec4(position, 1.0);',
'  vWorldPos = wp.xyz;',
'  gl_Position = projectionMatrix * viewMatrix * wp;',
'}'
].join('\n');
var SKY_FRAG = [
G.common,
GLSL_ENV,
'uniform vec2 uCalm; uniform float uLow; uniform float uDay; uniform vec3 uCloud; uniform vec3 uCloudA; uniform float uCalmAmt; uniform float uRays;',
'varying vec3 vWorldPos;',
'float skyFbm(vec2 p){',
'  float s = 0.0, a = 0.5;',
'  for (int i = 0; i < 3; i++) { s += a * hsNoise(p); p = p * 2.07 + vec2(11.3, 5.7); a *= 0.5; }',
'  return s / 0.875;',
'}',
'// one tissue-paper layer: stretched, domain-warped fbm thresholded into a soft torn-edged smear',
'float tissue(vec2 uv, vec2 sc, float off, float lo, float hi, float warp){',
'  vec2 p = uv * sc + vec2(off, 0.0);',
'  p += (vec2(hsNoise(p * 0.7 + 3.1), hsNoise(p * 0.7 + 9.4)) - 0.5) * warp;',
'  float n = skyFbm(p);',
'  float fib = hsNoise(vec2(p.x * 3.0, p.y * 40.0)) - 0.5;',
'  return smoothstep(lo, hi, n + fib * 0.07);',
'}',
'// 8 explicit horizontal tissue-paper strips: soft torn ends, slow wind drift (q = tan-space x,y of the view ray)',
'float streaks(vec2 q, float t){',
'  float a = 0.0;',
'  for (int i = 0; i < 8; i++) {',
'    float fi = float(i);',
'    float h1 = hsHash(vec2(fi, 1.7)), h2 = hsHash(vec2(fi, 4.1)), h3 = hsHash(vec2(fi, 8.3)), h4 = hsHash(vec2(fi, 2.9));',
'    float yc = 0.050 + fi * 0.038 + (h1 - 0.5) * 0.018;',
'    float hh = 0.006 + 0.011 * h2;',
'    float len = 0.22 + 0.38 * h3;',
'    float xc = mod(h2 * 7.0 + h4 * 3.0 + t * (0.003 + 0.005 * h4) + 1.5, 3.0) - 1.5;',
'    vec2 d = vec2((q.x - xc) / len, (q.y - yc) / hh);',
'    if (abs(d.y) > 1.21 || abs(d.x) > 1.16) { continue; }     // exactly 0 below (|nz| <= 0.5 shifts the edges by at most 0.2 / 0.15): skip the noise',
'    float nz = hsNoise(vec2(q.x * 9.0 + fi * 5.0, q.y * 150.0)) - 0.5;',
'    float sh = (1.0 - smoothstep(0.50, 1.0, abs(d.y) + nz * 0.40)) * (1.0 - smoothstep(0.30, 1.0, abs(d.x) + nz * 0.30));',
'    a = max(a, sh * (0.25 + 0.30 * h1));',
'  }',
'  return a;',
'}',
'void main(){',
'  vec3 dir = normalize(vWorldPos - cameraPosition);',
'  vec3 col = hsSky(dir) + envSunAdd(dir);',
'  float y = max(dir.y, 0.0);',
'  float tx = dir.x / max(-dir.z, 0.05);',
'  float calm = smoothstep(uCalm.x, uCalm.y, tx);',
'  float act = mix(uCalmAmt, 1.0, calm);',
'  float ang = length(dir - uSunDir);',
'  float sunNear = exp(-ang * ang / (2.0 * 0.30 * 0.30));',
'  // cloud deck mapping: streaks thin out toward the horizon like a real layer of cloud',
'  float inv = 1.0 / (y + 0.11);',
'  vec2 uv = vec2(dir.x, dir.z) * inv;',
'  float drift = uTime * 0.012;',
'  float hz = smoothstep(0.015, 0.11, y);',
'  float aHi = smoothstep(0.06, 0.30, y);',
'  col = mix(col, uSkyTop, uDay * 0.50 * smoothstep(0.05, 0.34, y));',
'  float aLo = smoothstep(0.015, 0.09, y) * (1.0 - smoothstep(0.16, 0.34, y));',
'  vec3 cloudCol = uCloud * (1.0 + 0.45 * sunNear) + uSunGlow * 0.18 * sunNear;',
'  // layer 1: broad soft smears (cumulus-like in the day palette)',
'  float l1 = tissue(uv, mix(vec2(0.50, 1.9), vec2(0.95, 2.4), uDay), -drift, mix(0.44, 0.56, uDay), mix(0.80, 0.74, uDay), 1.2);',
'  float shade = 0.0;',
'  if (uDay > 0.5) {',
'    float l1b = tissue(uv + vec2(0.0, 0.09), vec2(0.95, 2.4), -drift, 0.56, 0.74, 1.2);',
'    shade = clamp((l1b - l1) * 2.6 + 0.15, 0.0, 1.0);',
'  }',
'  vec3 c1 = mix(cloudCol, mix(uSkyMid, uCloud, 0.35) * 0.97, shade * 0.75);',
'  col = mix(col, c1, l1 * uCloudA.x * aHi * hz * act);',
'  // layer 2: finer streaks',
'  if (uLow < 0.5) {',
'    float l2 = tissue(uv, vec2(1.10, 6.0), -drift * 1.6 + 3.7, 0.55, 0.86, 0.8);',
'    col = mix(col, cloudCol, l2 * uCloudA.y * mix(aHi, 1.0, 0.4) * hz * act);',
'    // layer 3: low bands hugging the horizon',
'    float l3 = tissue(uv, vec2(0.32, 3.4), -drift * 0.6 + 8.1, 0.50, 0.84, 1.0);',
'    col = mix(col, cloudCol, l3 * uCloudA.z * aLo * act);',
'  }',
'  float ty = dir.y / max(-dir.z, 0.05);',
'  col = mix(col, cloudCol, streaks(vec2(tx, ty), uTime) * mix(0.9, 0.40, uDay) * hz * act);',
'  // soft brush banding of the paper wash',
'  float band = hsNoise(vec2(tx * 0.8 + 2.0, dir.y * 26.0)) - 0.5;',
'  col *= 1.0 + band * 0.045 * hz;',
'  // a few very faint long rays from the sun',
'  vec3 sr = normalize(cross(vec3(0.0, 1.0, 0.0), uSunDir));',
'  vec3 su = cross(uSunDir, sr);',
'  float mu = max(dot(dir, uSunDir), 0.25);',
'  vec2 sp = vec2(dot(dir, sr), dot(dir, su)) / mu;',
'  float rr = length(sp) + 1e-4;',
'  vec2 ud = sp / rr;',
'  float ray = hsNoise(ud * 4.0 + vec2(uTime * 0.01, 1.3)) * 0.65 + hsNoise(ud * 9.0 + 7.7) * 0.35;',
'  ray = smoothstep(0.50, 0.92, ray);',
'  col += uSunGlow * ray * exp(-rr * 2.4) * smoothstep(0.03, 0.14, rr) * smoothstep(0.0, 0.05, dir.y) * uRays * act;',
'  col = envGrain(col, dir);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <colorspace_fragment>',
'}'
].join('\n');
var SEA_VERT = [
G.common,
'varying vec3 vWorldPos;',
'void main(){',
'  vec4 wp = modelMatrix * vec4(position, 1.0);',
'  vWorldPos = wp.xyz;',
'  gl_Position = projectionMatrix * viewMatrix * wp;',
'}'
].join('\n');
var SEA_FRAG = [
G.common,
GLSL_ENV,
'uniform vec3 uSeaNear; uniform vec3 uSeaMid; uniform vec3 uSeaFar; uniform vec3 uGlint;',
'uniform float uSeaR; uniform float uStroke; uniform float uSpark; uniform float uColumn;',
'varying vec3 vWorldPos;',
'void main(){',
'  vec3 toP = vWorldPos - cameraPosition;',
'  float D = max(length(toP.xz), 1.0);',
'  float L3 = length(toP);',
'  vec3 dir = toP / L3;',
'  float hgt = max(-toP.y, 0.5);',
'  float v = hgt / D;                                   // ~tan(angle below the horizon): the screen-row coordinate',
'  float tx = dir.x / max(-dir.z, 0.05);',
'  float tSun = uSunDir.x / max(-uSunDir.z, 0.05);',
'  float daz = tx - tSun;                               // lateral offset from the sun azimuth (tan space)',
'  float xw = vWorldPos.x;',
'  float far = clamp(D / uSeaR, 0.0, 1.0);',
'  // 1. colour by distance: rich seaNear -> seaMid -> hazy seaFar',
'  float tN = smoothstep(80.0, 560.0, D);',
'  float tF = smoothstep(500.0, 1300.0, D);',
'  vec3 col = mix(mix(uSeaNear, uSeaMid, tN), uSeaFar, tF);',
'  float ld = hsLightDrift(vWorldPos.xz * 0.11);',
'  col *= mix(0.90, 1.08, (ld - 0.78) / 0.22);',
'  // 2. paper-strip wave bands: rows compress toward the horizon, scalloped edges, alternating tone, drifting slowly',
'  float r = 60.0 * pow(v, 0.4);',
'  float sc = (hsNoise(vec2(xw * 0.22 - uTime * 0.20, r * 0.45)) - 0.5) * 0.70 + 0.14 * abs(sin(xw * 0.72 + r * 0.9));',
'  float q = r + sc + uTime * 0.04;',
'  float fq = fwidth(q);                                // rows per pixel: fade strips that fall below ~3 px',
'  float lod = (1.0 - smoothstep(0.22, 0.50, fq)) * (1.0 - smoothstep(0.72, 0.96, far));',
'  float bi = floor(q);',
'  float fr = q - bi;',
'  float par = mod(bi, 2.0);',
'  col *= 1.0 + ((par - 0.5) * 0.085 + (0.5 - fr) * 0.05) * lod;',
'  float we = max(0.12, 1.5 * fq);',
'  float edge = (1.0 - smoothstep(0.0, we, fr)) * lod;',
'  float under = smoothstep(1.0 - we * 1.6, 1.0, fr) * lod;',
'  float vis = 0.45 + 0.55 * smoothstep(0.25, 0.70, hsNoise(vec2(xw * 0.05 + 5.0 - uTime * 0.02, r * 0.8)));',
'  col = mix(col, col * 1.24 + uGlint * 0.035, edge * vis * uStroke);',
'  col *= 1.0 - 0.06 * under;',
'  // 3. soft haze: lighter on the mid-distance so the band under the bridge keeps its colour; the glare only builds near the rim',
'  float fD = (1.0 - exp(-max(D - 30.0, 0.0) * uFogDensity)) * uFogMax;',
'  float fK = mix(0.32, 1.0, smoothstep(250.0, 1100.0, D));',
'  vec3 fcol = mix(uSkyHorizon, hsSky(normalize(vec3(dir.x, 0.02, dir.z))), smoothstep(450.0, 1300.0, D));',
'  float fRow = pow(1.0 - smoothstep(0.0, 0.046, v), 3.0);       // soft melt over the last ~40 px above the horizon',
'  col = mix(col, fcol, max(fRow, fD * fK));',
'  float cosT = hgt / L3;',
'  col = mix(col, hsSky(normalize(vec3(dir.x, 0.04, dir.z))), pow(1.0 - cosT, 5.0) * 0.07 * smoothstep(150.0, 900.0, D));',
'  // 4. sun glitter: small flat slivers in a column under the sun, widening toward the viewer, re-rolled every 2..6 stepped frames',
'  float w = 0.020 + 0.50 * v;',
'  float envc = exp(-(daz * daz) / (w * w));',
'  float gv = 17.0 * log(7.0 + 88.0 * v);',
'  float row = floor(gv);',
'  float cw = 0.0176 + 0.222 * v;',
'  float gx = tx / cw + hsHash(vec2(row, 3.0)) * 23.0 + uTime * 0.30;',
'  vec2 gi = vec2(floor(gx), row);',
'  vec2 gf = vec2(fract(gx), fract(gv)) - 0.5;',
'  float per = 2.0 + floor(hsHash(gi + 21.7) * 3.0);',
'  float kk = floor((uFrame + hsHash(gi + 9.1) * per) / per);',
'  float hB = hsHash(gi + vec2(7.9, kk * 2.11));',
'  float hC = hsHash(gi + vec2(kk * 3.7, 17.9));',
'  float on = step(hC, envc * 0.90);',
'  float lvl = 0.40 + 0.30 * step(0.34, hB) + 0.30 * step(0.70, hB);   // three paper brightness levels',
'  lvl *= 1.0 - 0.32 * step(0.62, hsHash(gi + vec2(uFrame * 1.91, 3.3)));   // a third of the slivers dim by one step every frame',
'  float sliver = 1.0 - smoothstep(0.78, 1.0, length(gf * vec2(2.1, 4.0)));',
'  float edgeK = 1.0 - smoothstep(0.80, 0.99, far);',
'  vec3 glint = uGlint * uSunColor;',
'  float broad = envc * (0.35 + 0.65 * exp(-v * 14.0));',
'  col += glint * (on * sliver * lvl * uSpark + broad * uColumn + edge * vis * broad * 0.20) * edgeK;',
'  col += uSunGlow * 0.03 * exp(-(daz * daz) / (16.0 * w * w)) * edgeK;',
'  // 5. melt into the sky at the rim of the disc (same function as the dome: no seam)',
'  float rim = smoothstep(0.74, 0.985, far);',
'  vec3 skyHere = envGrain(hsSky(dir) + envSunAdd(dir), dir);',
'  col = mix(envGrain(col, dir), skyHere, rim);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <colorspace_fragment>',
'}'
].join('\n');
var LAND_VERT = [
G.common,
'attribute float aTop;',
'varying vec3 vWorldPos; varying float vTop;',
'void main(){',
'  vec4 wp = modelMatrix * vec4(position, 1.0);',
'  vWorldPos = wp.xyz; vTop = aTop;',
'  gl_Position = projectionMatrix * viewMatrix * wp;',
'}'
].join('\n');
var LAND_FRAG = [
G.common,
'uniform vec3 uColor; uniform vec3 uMist; uniform float uSeed; uniform float uRimW; uniform float uMistH; uniform float uSeaY; uniform float uHaze; uniform float uFogK;',
'varying vec3 vWorldPos; varying float vTop;',
'void main(){',
'  // faint vertical fibre streaks (paper grain running down the cut-out)',
'  float fx = vWorldPos.x * 0.55 + uSeed * 7.0;',
'  float st = hsNoise(vec2(fx, uSeed)) * 0.55 + hsNoise(vec2(fx * 3.1, uSeed + 4.0)) * 0.30 + hsNoise(vec2(fx * 11.0, 1.0)) * 0.15;',
'  vec3 col = uColor * (0.93 + 0.14 * st);',
'  col *= 0.92 + 0.10 * hsNoise(vWorldPos.xy * vec2(0.020, 0.06) + uSeed * 5.0);',
'  // camera-facing paper face lifted by the soft bounce card',
'  col += uColor * uFillColor * 0.40;',
'  // lighter paper edge along the ridge',
'  float rim = 1.0 - smoothstep(0.0, uRimW, vTop);',
'  col = mix(col, col * 1.18 + vec3(0.025, 0.022, 0.0), rim * 0.55);',
'  // pale mist hugging the waterline',
'  float above = max(vWorldPos.y - uSeaY, 0.0);',
'  col = mix(col, uMist, exp(-above / uMistH) * 0.85);',
'  col = mix(col, uMist, uHaze);',
'  col = mix(col, hsFog(col, vWorldPos), uFogK);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <colorspace_fragment>',
'}'
].join('\n');
HS.register('env', function (ctx) {
var P = ctx.palette, L = ctx.layout, scene = ctx.scene;
var isDay = ctx.paletteName === 'day';
var root = new THREE.Group(); root.name = 'hs-env'; scene.add(root);
var rig = new THREE.Group(); rig.name = 'hs-env-far'; root.add(rig);
var geos = [], mats = [], objs = [];
function track(o, parent) { objs.push(o); (parent || root).add(o); return o; }
function trackGeo(g) { geos.push(g); return g; }
function trackMat(m) { mats.push(m); return m; }
var skyMat = trackMat(new THREE.ShaderMaterial({
uniforms: HS.shared({
uCalm: { value: new THREE.Vector2(-0.1, 0.05) }, uDay: { value: isDay ? 1 : 0 }, uLow: { value: ctx.quality && ctx.quality.tier === 'low' ? 1 : 0 },
uCloud: { value: new THREE.Color(P.cloud) },
uCloudA: { value: new THREE.Vector3().fromArray(isDay ? TUNE.cloudAlphaDay : TUNE.cloudAlphaGolden) },
uCalmAmt: { value: TUNE.calmAmount }, uRays: { value: TUNE.rays }, uGrainAmt: { value: TUNE.grain }, uSunAddK: { value: isDay ? 0.5 : 1.0 }
}),
vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide
}));
skyMat.extensions = { derivatives: true };
var sky = track(new THREE.Mesh(trackGeo(new THREE.SphereGeometry(TUNE.skyRadius, 48, 32)), skyMat));
sky.frustumCulled = false; sky.name = 'sky'; sky.renderOrder = 11;
var seaMat = trackMat(new THREE.ShaderMaterial({
uniforms: HS.shared({
uSeaNear: { value: new THREE.Color(P.seaNear) }, uSeaMid: { value: new THREE.Color(P.seaMid) },
uSeaFar: { value: new THREE.Color(P.seaFar) }, uGlint: { value: new THREE.Color(P.seaGlint) },
uSeaR: { value: L.farRadius }, uStroke: { value: TUNE.seaStroke }, uSpark: { value: TUNE.seaGlint },
uColumn: { value: TUNE.seaColumn }, uGrainAmt: { value: TUNE.grain }, uSunAddK: { value: isDay ? 0.5 : 1.0 }
}),
vertexShader: SEA_VERT, fragmentShader: SEA_FRAG
}));
seaMat.extensions = { derivatives: true };
var seaGeo = trackGeo(new THREE.CircleGeometry(L.farRadius, 128)); seaGeo.rotateX(-Math.PI / 2);
var sea = track(new THREE.Mesh(seaGeo, seaMat));
sea.position.set(0, L.seaY, 0); sea.frustumCulled = false; sea.name = 'sea'; sea.renderOrder = 10;
var T = 227 * L.bridge.scale;
var TANW = 0.5036;
function sx(f, z) { return (2 * f - 1) * TANW * (L.camZ - z) * 0.9976; }
function envelope(pts) {
var n = pts.length, m = [], i;
for (i = 0; i < n; i++) {
var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
m.push(b[0] === a[0] ? 0 : (b[1] - a[1]) / (b[0] - a[0]));
}
return function (x) {
if (x <= pts[0][0]) { return pts[0][1]; }
if (x >= pts[n - 1][0]) { return pts[n - 1][1]; }
var k = 1; while (x > pts[k][0]) { k++; }
var p0 = pts[k - 1], p1 = pts[k], dx = p1[0] - p0[0], t = (x - p0[0]) / dx, t2 = t * t, t3 = t2 * t;
return (2 * t3 - 3 * t2 + 1) * p0[1] + (t3 - 2 * t2 + t) * dx * m[k - 1] + (-2 * t3 + 3 * t2) * p1[1] + (t3 - t2) * dx * m[k];
};
}
function ridge(env, seed, detail, wave) {
return function (x) {
var h = env(x);
if (h <= 0.001) { return 0; }
var n = (HS.fbm2(x * wave + seed * 13.1, seed * 3.7, 4) - 0.5) * 2;
return Math.max(0, h * (1 + detail * n) + 0.25 * n * Math.min(1, h / 3));
};
}
var mistCol = new THREE.Color(P.skyHorizon);
function makeLayer(o) {
var xs = [], hs = [], i;
if (o.pts) { for (i = 0; i < o.pts.length; i++) { xs.push(o.pts[i][0]); hs.push(o.pts[i][1]); } }
else {
var n = Math.max(8, Math.ceil((o.x1 - o.x0) / o.step));
for (i = 0; i <= n; i++) { var x = o.x0 + (o.x1 - o.x0) * i / n; xs.push(x); hs.push(o.profile(x)); }
}
var nc = xs.length, pos = new Float32Array(nc * 6), top = new Float32Array(nc * 2), idx = [], yBot = L.seaY - 4;
for (i = 0; i < nc; i++) {
pos.set([xs[i], L.seaY + hs[i], o.z, xs[i], yBot, o.z], i * 6);
top[i * 2] = 0; top[i * 2 + 1] = hs[i] + 4;
if (i < nc - 1) { var a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
}
var g = trackGeo(new THREE.BufferGeometry());
g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
g.setAttribute('aTop', new THREE.BufferAttribute(top, 1));
g.setIndex(idx);
var mat = trackMat(new THREE.ShaderMaterial({
uniforms: HS.shared({
uColor: { value: new THREE.Color(o.color) }, uMist: { value: mistCol }, uSeed: { value: o.seed || 1 },
uRimW: { value: o.rim || 1.2 }, uMistH: { value: o.mistH || 4.0 }, uSeaY: { value: L.seaY }, uHaze: { value: o.haze || 0 }, uFogK: { value: o.fogK == null ? 0.6 : o.fogK }
}),
vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, side: THREE.DoubleSide
}));
var mesh = track(new THREE.Mesh(g, mat), o.slide ? rig : root); mesh.frustumCulled = false; mesh.name = o.name; mesh.renderOrder = 9;
return mesh;
}
function screenLayer(o) {
var xp = o.pts.map(function (p) { return [sx(p[0], o.z), p[1] * T]; });
o.profile = ridge(envelope(xp), o.seed || 1, o.detail == null ? 0.10 : o.detail, o.wave || 0.03);
o.pts = null;
o.x0 = sx(o.f0, o.z); o.x1 = sx(o.f1, o.z); o.step = o.step || 2.0;
return makeLayer(o);
}
screenLayer({ name: 'marin-far', z: -860, color: P.landA, haze: 0.0, fogK: 0.66, rim: 1.4, seed: 3, f0: 0.50, f1: 1.55, step: 2.4, wave: 0.020,
pts: [[0.50, 0], [0.575, 0.12], [0.61, 0.55], [0.635, 1.20], [0.655, 1.10], [0.68, 0.80], [0.71, 0.62], [0.76, 0.52], [0.84, 0.40], [0.95, 0.30], [1.1, 0.2], [1.55, 0.1]] });
screenLayer({ name: 'marin-near', slide: true, z: -742, color: P.landB, haze: 0.0, fogK: 0.55, rim: 1.2, seed: 5, f0: 0.425, f1: 1.55, step: 2.0, wave: 0.025,
pts: [[0.425, 0], [0.442, 0.12], [0.458, 0.32], [0.478, 0.41], [0.505, 0.42], [0.53, 0.34], [0.555, 0.20], [0.585, 0.09], [0.605, 0.22], [0.64, 0.50], [0.675, 0.56], [0.72, 0.46], [0.80, 0.38], [0.90, 0.30], [1.1, 0.2], [1.55, 0.1]] });
screenLayer({ name: 'sf-shore', slide: true, z: -600, color: P.landC, haze: 0, fogK: 0.46, rim: 1.0, seed: 7, f0: -1.70, f1: 0.17, step: 1.6, wave: 0.04, detail: 0.12,
pts: [[-1.70, 0.24], [-0.80, 0.24], [-0.40, 0.20], [-0.10, 0.25], [0.02, 0.27], [0.06, 0.31], [0.095, 0.27], [0.12, 0.17], [0.145, 0.06], [0.17, 0]] });
screenLayer({ name: 'angel', z: -440, color: P.landB, haze: 0.0, fogK: 0.60, rim: 1.0, seed: 11, f0: 0.86, f1: 1.60, step: 1.2, wave: 0.05,
pts: [[0.86, 0], [0.90, 0.30], [0.935, 0.66], [0.97, 0.92], [1.01, 1.0], [1.07, 0.86], [1.15, 0.5], [1.3, 0.2], [1.6, 0.05]] });
(function () {
var out = [[0, -2], [0, 0.4], [2.5, 1.5], [6, 2.6], [10, 3.5], [12, 3.9], [12, 6.0], [14.5, 6.2], [15, 6.9], [21, 6.9], [21.4, 6.2], [25.5, 6.0],
[25.5, 4.4], [28.4, 4.5], [28.5, 9.3], [28.1, 9.5], [28.1, 9.9], [29.6, 9.9], [29.6, 9.5], [29.2, 9.3], [29.3, 4.5], [31, 3.8], [32, 1.6], [32.6, 0], [32.6, -2]];
var kk = 0.8, z = -390, x0 = sx(0.80, z), pts = [];
for (var i = 0; i < out.length; i++) { pts.push([x0 + out[i][0] * kk, Math.max(out[i][1] * kk, 0)]); }
makeLayer({ name: 'alcatraz', z: z, color: P.landC, haze: 0.0, fogK: 0.40, rim: 0.5, seed: 13, mistH: 2.2, pts: pts });
})();
var bridgeEnds = { l: [], r: [] };
var bridgeGroup = (function () {
var S = { span: 1280, side: 343, tower: 227, deck: 75, deckD: 7, deckW: 27.4, cable: 5.5, susp: 3.0, step: 44.5 };
var XT = S.span / 2, XA = XT + S.side, ZL = 13.7, yTop = 229, yMid = S.deck + 4.5, yEnd = 68;
function vcross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function vnorm(a) { var l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function Buf() { this.p = []; this.n = []; this.i = []; }
Buf.prototype.quad = function (a, b, c, d, out) {
var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
var l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= l; ny /= l; nz /= l;
if (out && nx * out[0] + ny * out[1] + nz * out[2] < 0) { nx = -nx; ny = -ny; nz = -nz; var t = b; b = d; d = t; }
var base = this.p.length / 3;
this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
for (var k = 0; k < 4; k++) { this.n.push(nx, ny, nz); }
this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
};
Buf.prototype.box = function (cx, cy, cz, sx, sy, sz) {
var x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
var A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y1, z0], D = [x0, y1, z0], E = [x0, y0, z1], F = [x1, y0, z1], G = [x1, y1, z1], H = [x0, y1, z1];
this.quad(A, B, C, D, [0, 0, -1]); this.quad(E, F, G, H, [0, 0, 1]); this.quad(A, E, H, D, [-1, 0, 0]);
this.quad(B, F, G, C, [1, 0, 0]); this.quad(A, B, F, E, [0, -1, 0]); this.quad(D, C, G, H, [0, 1, 0]);
};
Buf.prototype.frustum = function (cx, cz, y0, y1, hxb, hzb, hxt, hzt) {
var b0 = [cx - hxb, y0, cz - hzb], b1 = [cx + hxb, y0, cz - hzb], b2 = [cx + hxb, y0, cz + hzb], b3 = [cx - hxb, y0, cz + hzb];
var t0 = [cx - hxt, y1, cz - hzt], t1 = [cx + hxt, y1, cz - hzt], t2 = [cx + hxt, y1, cz + hzt], t3 = [cx - hxt, y1, cz + hzt];
this.quad(b0, b1, t1, t0, [0, 0, -1]); this.quad(b1, b2, t2, t1, [1, 0, 0]); this.quad(b2, b3, t3, t2, [0, 0, 1]);
this.quad(b3, b0, t0, t3, [-1, 0, 0]); this.quad(t0, t1, t2, t3, [0, 1, 0]);
};
Buf.prototype.tube = function (pts, w, h, up) {
var rings = [], n = pts.length, i, k;
for (i = 0; i < n; i++) {
var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
var t = vnorm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), r = vnorm(vcross(t, up)), u = vcross(r, t), p = pts[i], hw = w / 2, hh = h / 2;
rings.push([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (s) {
return [p[0] + r[0] * hw * s[0] + u[0] * hh * s[1], p[1] + r[1] * hw * s[0] + u[1] * hh * s[1], p[2] + r[2] * hw * s[0] + u[2] * hh * s[1]];
}));
}
for (i = 0; i < n - 1; i++) {
for (k = 0; k < 4; k++) {
var k2 = (k + 1) % 4, A = rings[i][k], Bq = rings[i][k2], C = rings[i + 1][k2], D = rings[i + 1][k];
this.quad(A, Bq, C, D, [(A[0] + Bq[0] + C[0] + D[0]) / 4 - (pts[i][0] + pts[i + 1][0]) / 2, (A[1] + Bq[1] + C[1] + D[1]) / 4 - (pts[i][1] + pts[i + 1][1]) / 2, (A[2] + Bq[2] + C[2] + D[2]) / 4 - (pts[i][2] + pts[i + 1][2]) / 2]);
}
}
};
Buf.prototype.geometry = function () {
var g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
g.setIndex(this.i);
return g;
};
var steel = new Buf(), dark = new Buf(), conc = new Buf();
function cableY(X) {
var ax = Math.abs(X);
if (ax <= XT) { var q = ax / XT; return yMid + (yTop - yMid) * q * q; }
var s = (ax - XT) / S.side;
return yTop + (yEnd - yTop) * s - 18 * 4 * s * (1 - s);
}
[-ZL, ZL].forEach(function (z) {
var pts = [], i, X;
for (i = 0; i <= 16; i++) { X = -XA + S.side * i / 16; pts.push([X, cableY(X), z]); }
for (i = 1; i <= 64; i++) { X = -XT + S.span * i / 64; pts.push([X, cableY(X), z]); }
for (i = 1; i <= 16; i++) { X = XT + S.side * i / 16; pts.push([X, cableY(X), z]); }
steel.tube(pts, S.cable, S.cable, [0, 1, 0]);
var xs = [], k;
for (k = 1; -XT + k * S.step < XT - 25; k++) { xs.push(-XT + k * S.step); }
for (k = 1; k <= 7; k++) { xs.push(XT + k * S.step, -XT - k * S.step); }
xs.forEach(function (x) {
if (Math.abs(Math.abs(x) - XT) < 22) { return; }
steel.tube([[x, cableY(x) - 1, z], [x, S.deck + 1, z]], S.susp, S.susp, [1, 0, 0]);
});
});
steel.box(0, S.deck - S.deckD / 2, 0, 2 * XA, S.deckD, S.deckW);
steel.box((-XA - 1330) / 2, S.deck - 3, 0, 1330 - XA, 6, S.deckW - 4);
steel.box((XA + 1130) / 2, S.deck - 3, 0, 1130 - XA, 6, S.deckW - 4);
steel.box(0, S.deck + 0.9, ZL - 0.4, 2 * XA, 1.8, 0.9);
steel.box(0, S.deck + 0.9, -ZL + 0.4, 2 * XA, 1.8, 0.9);
var legSegs = [[0, 75, 7.4, 6.0, 7.0, 5.7], [75, 120, 6.5, 5.3, 6.1, 5.1], [120, 165, 5.7, 4.8, 5.3, 4.5], [165, 205, 4.9, 4.2, 4.5, 3.9], [205, 227, 4.1, 3.6, 3.8, 3.4]];
[-XT, XT].forEach(function (X) {
[-ZL, ZL].forEach(function (Z) {
legSegs.forEach(function (s) { steel.frustum(X, Z, s[0], s[1], s[2], s[3], s[4], s[5]); });
steel.box(X, 229, Z, 8.8, 4.2, 8.2);
});
[[98, 12], [134, 11], [170, 11], [211, 14]].forEach(function (s) {
var hx = 7.4 - (s[0] / 227) * 3.4;
dark.box(X, s[0], 0, hx * 1.6, s[1], 2 * ZL - 2);
});
var zi = ZL - 5;
[[10, 40], [40, 68]].forEach(function (p) {
dark.tube([[X, p[0], -zi], [X, p[1], zi]], 3.4, 3.4, [1, 0, 0]);
dark.tube([[X, p[0], zi], [X, p[1], -zi]], 3.4, 3.4, [1, 0, 0]);
dark.box(X, p[1], 0, 6, 3.4, 2 * zi);
});
conc.box(X, 7, 0, 32, 16, 46);
});
[-1, 1].forEach(function (sg) { conc.box(sg * (XA + 12), 33, 0, 46, 66, 38); });
[-1272, -1098, 1040, 1100].forEach(function (X) { conc.box(X, X < 0 ? 12 : 34, 0, 5, X < 0 ? 24 : 68, 14); });
[-1330, -1050].forEach(function (X) { conc.box(X, 34, 0, 5, 68, 14); });
var archPts = [], ax;
for (ax = -1272; ax <= -1098; ax += 9.67) { var q = (ax + 1185) / 87; archPts.push([ax, 62 - 42 * q * q, 0]); }
[-9, 9].forEach(function (z) {
steel.tube(archPts.map(function (p) { return [p[0], p[1], z]; }), 4.5, 4.5, [0, 1, 0]);
for (var px = -1243; px <= -1127; px += 29) { var qq = (px + 1185) / 87; steel.tube([[px, 62 - 42 * qq * qq, z], [px, S.deck - 6, z]], 3.2, 3.2, [1, 0, 0]); }
});
var grp = new THREE.Group(); grp.name = 'golden-gate';
grp.position.set(L.bridge.x, L.seaY, L.bridge.z); grp.rotation.y = L.bridge.yaw; grp.scale.setScalar(L.bridge.scale);
var base = new THREE.Color(P.bridge);
var common = { translucency: 0.17, crumple: 0.12, crumpleScale: 0.05, fiber: 0, rim: 0.5, boil: 0, fog: TUNE.land.bridgeFog, side: THREE.DoubleSide };
function pm(color, extra) { var o = {}, k; for (k in common) { o[k] = common[k]; } for (k in extra) { o[k] = extra[k]; } o.color = color; return trackMat(HS.makePaperMaterial(o)); }
var mSteel = pm(base, { transColor: base });
var mDark = pm(base.clone().multiplyScalar(0.62), { transColor: base.clone().multiplyScalar(0.8), translucency: 0.16 });
var mConc = pm(new THREE.Color(P.landA).lerp(new THREE.Color(P.skyHorizon), 0.55), { translucency: 0.25, fog: Math.min(1, TUNE.land.bridgeFog + 0.2) });
[[steel, mSteel, 'steel'], [dark, mDark, 'struts'], [conc, mConc, 'concrete']].forEach(function (s) {
var m = new THREE.Mesh(trackGeo(s[0].geometry()), s[1]); m.frustumCulled = false; m.name = 'bridge-' + s[2]; m.renderOrder = 8; grp.add(m);
});
var minX = 1e9, maxX = -1e9, bufs = [steel, dark, conc], bi2, vi, yc = Math.cos(L.bridge.yaw), ys = Math.sin(L.bridge.yaw), ks = L.bridge.scale;
for (bi2 = 0; bi2 < bufs.length; bi2++) { for (vi = 0; vi < bufs[bi2].p.length; vi += 3) { minX = Math.min(minX, bufs[bi2].p[vi]); maxX = Math.max(maxX, bufs[bi2].p[vi]); } }
for (bi2 = 0; bi2 < bufs.length; bi2++) {
for (vi = 0; vi < bufs[bi2].p.length; vi += 3) {
var vx = bufs[bi2].p[vi], vz = bufs[bi2].p[vi + 2];
if (vx < minX + 3 || vx > maxX - 3) { (vx < 0 ? bridgeEnds.l : bridgeEnds.r).push({ ox: (vx * yc + vz * ys) * ks, oy: bufs[bi2].p[vi + 1] * ks, oz: (-vx * ys + vz * yc) * ks }); }
}
}
track(grp, rig);
return grp;
})();
var TANH = 0.28675, PITCH = 0.0687, CAMY = 0.94;
function sy(frac, z) { return CAMY + (L.camZ - z) * Math.tan(Math.atan((1 - 2 * frac) * TANH) + PITCH); }
function dynMesh(name, nVerts, index, color, extra) {
var g = trackGeo(new THREE.BufferGeometry()), pos = new Float32Array(nVerts * 3), nor = new Float32Array(nVerts * 3), i;
for (i = 0; i < nVerts; i++) { nor[i * 3 + 2] = 1; }
g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(index);
var o = { color: color, fog: 0.35, translucency: 0.35, crumple: 0, fiber: 0, rim: 0.5, boil: 0, side: THREE.DoubleSide }, k;
for (k in extra) { o[k] = extra[k]; }
var m = new THREE.Mesh(g, trackMat(HS.makePaperMaterial(o))); m.frustumCulled = false; m.name = name; m.renderOrder = 8; track(m);
return { pos: pos, attr: g.attributes.position };
}
var boatDefs = [
{ f: 0.53, z: -250, s: 1.5, amp: 12, per: 230, ph: 0.4 },
{ f: 0.62, z: -400, s: 1.7, amp: 16, per: 300, ph: 2.1 },
{ f: 0.90, z: -300, s: 1.5, amp: 10, per: 260, ph: 4.0 }
].slice(0, TUNE.boats);
var gullDefs = [
{ f: 0.60, y: 0.30, z: -190, span: 3.2, rx: 12, ry: 2.2, ph: 0.3, w: 0.020 },
{ f: 0.72, y: 0.24, z: -240, span: 3.6, rx: 16, ry: 2.6, ph: 2.0, w: 0.016 },
{ f: 0.86, y: 0.36, z: -170, span: 3.0, rx: 10, ry: 2.0, ph: 3.7, w: 0.024 },
{ f: 0.66, y: 0.40, z: -300, span: 4.0, rx: 18, ry: 3.0, ph: 5.1, w: 0.014 }
].slice(0, TUNE.gulls);
var NBt = boatDefs.length, NGu = gullDefs.length, bi = [], si = [], gi = [], q;
for (q = 0; q < NBt; q++) { bi.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3); si.push(q * 6, q * 6 + 1, q * 6 + 2, q * 6 + 3, q * 6 + 4, q * 6 + 5); }
for (q = 0; q < NGu; q++) { var gb = q * 11; gi.push(gb, gb + 1, gb + 3, gb + 1, gb + 2, gb + 3, gb, gb + 5, gb + 7, gb + 5, gb + 6, gb + 7, gb + 8, gb + 9, gb + 10); }
var hullMesh = NBt ? dynMesh('boat-hulls', NBt * 4, bi, new THREE.Color('#8a5a34'), { translucency: 0.20 }) : null;
var sailMesh = NBt ? dynMesh('boat-sails', NBt * 6, si, new THREE.Color('#fff6e0'), { translucency: 0.55, fog: 0.30 }) : null;
var gullMesh = NGu ? dynMesh('gulls', NGu * 11, gi, new THREE.Color(P.landC).multiplyScalar(0.55), { translucency: 0.15, fog: 0.30, rim: 0.2 }) : null;
var HULL = [[-1.3, 0], [1.4, 0], [0.9, -0.45], [-0.9, -0.45]], SAIL = [[0.05, 0.1], [0.05, 3.4], [-1.15, 0.1], [0.2, 0.1], [0.2, 2.6], [1.25, 0.1]];
boatDefs.forEach(function (b) { b.x0 = sx(b.f, b.z); });
gullDefs.forEach(function (g) { g.x0 = sx(g.f, g.z); g.y0 = sy(g.y, g.z); });
function smoothStep(a, b, x) { return HS.smoothstep(a, b, x); }
function animateLife(t) {
var i, k;
for (i = 0; i < NBt; i++) {
var b = boatDefs[i], ang = 6.2832 * t / b.per + b.ph, flip = Math.cos(ang) >= 0 ? 1 : -1;
var bx = b.x0 + b.amp * Math.sin(ang), bob = Math.sin(t * 1.6 + b.ph * 3) * 0.10 * b.s, roll = Math.sin(t * 1.1 + b.ph) * 0.05, yaw = 0.30 * flip;
var cr = Math.cos(roll), sr = Math.sin(roll), cy = Math.cos(yaw), sn = Math.sin(yaw);
var put = function (arr, o, lx, ly) {
var X = lx * flip * b.s, Y = ly * b.s, Xr = X * cr - Y * sr, Yr = X * sr + Y * cr;
arr[o] = bx + Xr * cy; arr[o + 1] = L.seaY + bob + Yr; arr[o + 2] = b.z - Xr * sn;
};
for (k = 0; k < 4; k++) { put(hullMesh.pos, (i * 4 + k) * 3, HULL[k][0], HULL[k][1]); }
for (k = 0; k < 6; k++) { put(sailMesh.pos, (i * 6 + k) * 3, SAIL[k][0], SAIL[k][1]); }
}
if (NBt) { hullMesh.attr.needsUpdate = true; sailMesh.attr.needsUpdate = true; }
for (i = 0; i < NGu; i++) {
var g = gullDefs[i], a = 6.2832 * g.w * t + g.ph;
var gx = g.x0 + g.rx * Math.sin(a), gy = g.y0 + g.ry * Math.sin(2 * a + 1.0), gz = g.z + 0.5 * g.rx * Math.cos(a);
var burst = smoothStep(0.55, 0.9, 0.5 + 0.5 * Math.sin(t * 0.35 + g.ph * 2)), fl = (0.06 + 0.30 * burst * Math.sin(t * 6.0 + g.ph)) ;
var bank = -0.30 * Math.cos(a), cb = Math.cos(bank), sb = Math.sin(bank), hs = g.span / 2;
var shape = [
[0, 0.02], [-0.48, 0.30 + fl], [-1.0, 0.12 + 1.5 * fl], [-0.40, 0.14 + 0.8 * fl], [0, 0],
[0, 0.02], [0.48, 0.30 + fl], [1.0, 0.12 + 1.5 * fl], [0.40, 0.14 + 0.8 * fl],
[-0.07, 0.0], [0.07, 0.0]
];
shape.push([0, -0.14]);
for (k = 0; k < 11; k++) {
var lx = shape[k][0] * hs, ly = shape[k][1] * hs, o = (i * 11 + k) * 3;
gullMesh.pos[o] = gx + lx * cb - ly * sb; gullMesh.pos[o + 1] = gy + lx * sb + ly * cb; gullMesh.pos[o + 2] = gz;
}
}
if (NGu) { gullMesh.attr.needsUpdate = true; }
}
animateLife(0);
function fitBridge(view, tanW) {
var B = L.bridge, cp = Math.cos(view.pitch), sp = Math.sin(view.pitch), camY = ctx.camera.position.y, m = TUNE.bridgeMargin, xl = -1e9, xr = 1e9, i;
function xAt(pt, f) {
var depth = cp * (L.camZ - (B.z + pt.oz)) + sp * (L.seaY + pt.oy - camY);
return (2 * f - 1) * tanW * depth - pt.ox;
}
for (i = 0; i < bridgeEnds.l.length; i++) { xl = Math.max(xl, xAt(bridgeEnds.l[i], m)); }
for (i = 0; i < bridgeEnds.r.length; i++) { xr = Math.min(xr, xAt(bridgeEnds.r[i], 1 - m)); }
var x = Math.max(B.x, xl);
if (x > xr) { x = Math.max(B.x, 0.5 * (xl + xr)); }
rig.position.x = x - B.x;
B.lookX = x;
}
L.bridge.lookX = L.bridge.x;
return {
update: function (dt, t, frame) { animateLife(t); },
layout: function (view) {
var tanW = Math.tan(THREE.MathUtils.degToRad(view.vfov / 2)) * view.aspect;
skyMat.uniforms.uCalm.value.set((TUNE.calmFrom * 2 - 1) * tanW, (TUNE.calmTo * 2 - 1) * tanW);
fitBridge(view, tanW);
},
dispose: function () {
for (var i = 0; i < objs.length; i++) { if (objs[i].parent) { objs[i].parent.remove(objs[i]); } }
root.remove(rig);
scene.remove(root);
for (var g = 0; g < geos.length; g++) { geos[g].dispose(); }
for (var m = 0; m < mats.length; m++) { mats[m].dispose(); }
}
};
});
})();
;
(function () {
'use strict';
var THREE = window.THREE, HS = window.HS;
if (!THREE || !HS) { return; }
var CFG = {
fanNear: 2.2, fanFar: 15.5,
fanMaxDeg: 42,
nearTaper: [2.2, 4.8, 0.22],
tuftBlades: [10, 28],
tuftSigma: [0.050, 0.100],
lenMin: 0.25, lenMax: 0.52, lenSkew: 1.10,
widthMin: 0.024, widthMax: 0.050,
farWidth: [0.82, 0.060, 0.92, 1.45],
yawSpread: 1.05, edgeOnShare: 0.12,
strawShare: 0.005, strawLen: [0.36, 0.55], strawWidth: [0.013, 0.020],
lip: { width: 0.9, density: 0.40, longer: 1.25, thinner: 0.70 },
hero: { count: 84, len: [0.55, 0.88], width: [0.065, 0.135], dist: [1.2, 4.3], cornerShare: 0.42,
fracCorner: [0.06, 0.26], fracMid: [0.02, 0.10] },
keepKnee: 0.27,
seeds: 48, flowers: 40,
leanBase: 0.76, leanClump: 0.12, leanRand: 0.26, gustLean: 0.36, trailLean: 0.14, fountain: 0.22,
rootLean: 0.42, tipBend: 0.86, maxAngle: 1.85,
flutter: 0.05, boil: 0.03,
lipDroop: 0.55,
pushRadius: [0.10, 0.55], pushAmount: 1.5,
shadowLen: 3.4, shadowOpacity: 0.46,
heightClump: [0.70, 1.30],
foldTilt: 0.70, cup: 0.20,
aoRoot: 0.025, ambGain: 1.0, transGain: 0.55, directGain: 0.18, fillGain: 1.0, transCap: 0.70, rimGain: 0.70,
groups: [0.40, 0.65, 1.0],
widenPow: 0.6
};
function F(x) { var s = String(+x); return (s.indexOf('.') < 0 && s.indexOf('e') < 0) ? s + '.0' : s; }
var TAU = Math.PI * 2;
var grassScale = HS.grassScaleAt || function () { return 1; };
var GLSL_FIELDS = [
'float gClump(vec2 p){',
'  float v = hsNoise(p * 1.85 + vec2(11.3, 4.7)) * 0.40 + hsNoise(p * 0.85 + vec2(3.1, 19.2)) * 0.34 + hsNoise(p * 0.33 + vec2(7.7, 1.3)) * 0.26;',
'  return smoothstep(0.24, 0.76, v);',
'}',
'float gCrestZ(float x){ return -2.3 + 0.55 * sin(x * 0.31 + 0.8) + 0.25 * sin(x * 0.83 - 1.1) - 0.05 * x; }'
].join('\n');
var GLSL_HAZE = [
'vec3 gHaze(vec3 col, vec3 wp){',
'  float d = length(wp - cameraPosition);',
'  col *= mix(vec3(1.0), vec3(0.84, 1.0, 1.08), smoothstep(4.5, 9.0, d) * 0.70) * (1.0 + 0.30 * smoothstep(7.0, 10.5, d));',
'  vec3 mc = mix(uSkyHorizon, uAmbSky, 0.35) * 0.55;',
'  return mix(col, mc, smoothstep(7.5, 12.5, d) * 0.46);',
'}'
].join('\n');
var GLSL_SHADOW = [
'float gPrinceShadow(vec2 xz){',
'  vec2 away = normalize(-uSunDir.xz);',
'  vec2 q = xz - uPrincePos.xz;',
'  float along = dot(q, away);',
'  float across = dot(q, vec2(-away.y, away.x));',
'  float len = ' + F(CFG.shadowLen) + ';',
'  float w = 0.24 + 0.20 * clamp(along / len, 0.0, 1.0);',
'  float a = smoothstep(-0.30, 0.10, along) * (1.0 - smoothstep(0.15 * len, len, along));',
'  return a * exp(-(across * across) / (w * w)) * ' + F(CFG.shadowOpacity) + ';',
'}'
].join('\n');
var GLSL_RIBBON = [
'void gRibbon(float t, float L, float a0, float a1, vec2 b, float yaw, out vec3 P, out vec3 r, out vec3 n){',
'  vec3 kax = vec3(b.y, 0.0, -b.x);',
'  float dt = t / 6.0;',
'  P = vec3(0.0);',
'  for (int i = 0; i < 6; i++) {',
'    float s = (float(i) + 0.5) * dt;',
'    float th = a0 + a1 * s * s;',
'    P += vec3(sin(th) * b.x, cos(th), sin(th) * b.y);',
'  }',
'  P *= dt * L;',
'  float thT = a0 + a1 * t * t;',
'  float cT = cos(thT), sT = sin(thT);',
'  vec3 r0 = vec3(cos(yaw), 0.0, -sin(yaw));',
'  vec3 n0 = vec3(sin(yaw), 0.0, cos(yaw));',
'  r = r0 * cT + cross(kax, r0) * sT + kax * (dot(kax, r0) * (1.0 - cT));',
'  n = n0 * cT + cross(kax, n0) * sT + kax * (dot(kax, n0) * (1.0 - cT));',
'}'
].join('\n');
var GLSL_BLADE_STATIC = [
'  float clump = gClump(xz);',
'  const float E = 0.2;',
'  vec2 gc = vec2(gClump(xz + vec2(E, 0.0)) - gClump(xz - vec2(E, 0.0)), gClump(xz + vec2(0.0, E)) - gClump(xz - vec2(0.0, E))) / (2.0 * E);',
'  vec2 sunXZ = normalize(uSunDir.xz);',
'  float mound = clamp(0.5 + (clump - 0.5) * 0.9 - dot(gc, sunXZ) * 0.22, 0.0, 1.0);',
'  float swath = (hsNoise(xz * 0.27 + vec2(5.5, 1.7)) - 0.5) * 1.22;',
'  float swirl = (hsNoise(xz * 0.85 + vec2(2.2, 8.4)) - 0.5) * 0.45;'
].join('\n');
var BLADE_VERT = [
HS.GLSL.common,
GLSL_FIELDS,
GLSL_RIBBON,
'attribute vec4 aRoot;',
'attribute vec4 aShape;',
'attribute vec4 aRand;',
'attribute vec4 aTuft;',
'#ifdef HS_BAKED',
'attribute vec4 aBake;',
'#endif',
'uniform vec3 uKnee;',
'uniform float uWiden;',
'varying vec3 vWorldPos; varying vec3 vN; varying vec3 vR; varying vec2 vUvb;',
'varying vec4 vRand; varying vec4 vInfo; varying vec4 vInfo2; varying vec4 vInfo3;',
'float gSmin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }',
'void main(){',
'  float side = position.x;',
'  float t = position.y;',
'  vec3 root = aRoot.xyz;',
'  float yaw = aRoot.w;',
'  float trail = aShape.z;',
'  float kind = aShape.w;',
'  float isHero = step(0.5, kind) * step(kind, 1.5);',
'  float isStraw = step(1.5, kind);',
'  vec2 xz = root.xz;',
'  vec4 rr = aRand;',
'  // ---- tussock / mound field, wind swath + swirl (static per blade: baked, see GLSL_BLADE_STATIC) ----',
'#ifdef HS_BAKED',
'  float clump = aBake.x, mound = aBake.y, swath = aBake.z, swirl = aBake.w;',
'#else',
GLSL_BLADE_STATIC,
'#endif',
'  // ---- height ----',
'  float hm = mix(' + F(CFG.heightClump[0]) + ', ' + F(CFG.heightClump[1]) + ', clump) * aTuft.z;',
'  hm = mix(hm, aTuft.z, isHero);',
'  hm = mix(hm, 0.92 + 0.16 * clump, isStraw);',
'  float lipD0 = xz.y - gCrestZ(xz.x);',
'  float edgeBand = 1.0 - smoothstep(0.0, 1.7, lipD0);',
'  float edgeTuft = smoothstep(0.25, 0.75, hsNoise(vec2(xz.x * 1.25 + 3.3, xz.y * 0.5 + 8.8)));',
'  float cdx = (xz.x - uKnee.z) / 1.7;',
'  float calm = exp(-cdx * cdx);',
'  hm *= mix(1.0, mix(0.62, 1.45, edgeTuft), edgeBand * (1.0 - isHero) * (1.0 - 0.75 * calm));',
'  float L = aShape.x * hm;',
'  L = mix(L, gSmin(L, 0.74, 0.10), 1.0 - isHero);',
'  // keep the sight-line to the prince\'s knees clear: in the screen band x 55..90 %, blades in front of him stay low',
'  vec4 rc = projectionMatrix * viewMatrix * vec4(root, 1.0);',
'  float ndcX = rc.x / rc.w;',
'  float dCam = length(root.xz - cameraPosition.xz);',
'  float band = smoothstep(0.02, 0.14, ndcX) * (1.0 - smoothstep(0.74, 0.92, ndcX));',
'  float front = 1.0 - smoothstep(uKnee.y - 1.0, uKnee.y + 0.15, dCam);',
'  float tipMax = cameraPosition.y + (uKnee.x - cameraPosition.y) * dCam / uKnee.y;',
'  float Lcap = max(tipMax - root.y, 0.06) / 0.80;',
'  L = mix(L, gSmin(L, Lcap, 0.05), band * front * (1.0 - isHero));',
'  // ---- wind: combed toward +X, swaths of rotating lean, gusts roll across ----',
'  float gust = hsGust(xz);',
'  float wa = atan(uWindDir.y, uWindDir.x) + swath + swirl + (rr.z - 0.5) * 0.55;',
'  vec2 wd = vec2(cos(wa), sin(wa));',
'  float lean = ' + F(CFG.leanBase) + ' + ' + F(CFG.leanClump) + ' * clump + (rr.w - 0.5) * ' + F(CFG.leanRand) + ' + gust * ' + F(CFG.gustLean) + ' + trail * ' + F(CFG.trailLean) + ';',
'  vec2 bend2 = wd * lean + aTuft.xy * ' + F(CFG.fountain) + ';',
'  // the hill edge: lip blades droop outward (toward the sea)',
'  float lipD = xz.y - gCrestZ(xz.x);',
'  float lip = 1.0 - smoothstep(0.0, ' + F(CFG.lip.width) + ', lipD);',
'  bend2 += vec2(0.0, -1.0) * lip * ' + F(CFG.lipDroop) + ';',
'  // the prince pushes blades away and flattens them',
'  vec2 pq = xz - uPrincePos.xz;',
'  float pd = length(pq);',
'  float push = 1.0 - smoothstep(' + F(CFG.pushRadius[0]) + ', ' + F(CFG.pushRadius[1]) + ', pd);',
'  bend2 += (pq / max(pd, 0.02)) * push * ' + F(CFG.pushAmount) + ';',
'  float stiff = mix(mix(1.0, 1.25, isHero), 0.55, isStraw);',
'  float m = length(bend2) * stiff;',
'  vec2 b = length(bend2) > 1e-4 ? normalize(bend2) : wd;',
'  // tip flutter (rotates the bend direction a little and breathes the curl)',
'  float ph = rr.x * 6.2831 + xz.x * 1.3 + xz.y * 0.9;',
'  float fl = sin(uTime * (4.2 + 2.5 * rr.y) + ph);',
'  float fl2 = sin(uTime * (3.1 + 2.0 * rr.z) + ph * 1.7);',
'  float ca = cos(fl2 * ' + F(CFG.flutter) + ' * (0.4 + gust)), sa = sin(fl2 * ' + F(CFG.flutter) + ' * (0.4 + gust));',
'  b = vec2(b.x * ca - b.y * sa, b.x * sa + b.y * ca);',
'  float a0 = m * ' + F(CFG.rootLean) + ';',
'  float a1 = min(m * ' + F(CFG.tipBend) + ' + fl * ' + F(CFG.flutter) + ' * (0.5 + gust) + push * 0.35, ' + F(CFG.maxAngle) + ' - a0);',
'  vec3 P, r, n;',
'  gRibbon(t, L, a0, a1, b, yaw, P, r, n);',
'  // twist (+-25 deg at the tip) so tips turn toward the light / the camera',
'  float psi = (rr.x - 0.5) * 0.88 * (0.4 * t + 0.6 * t * t);',
'  vec3 r2 = r * cos(psi) - n * sin(psi);',
'  vec3 n2 = n * cos(psi) + r * sin(psi);',
'  // ---- cut-paper outline: constant width, then a pointed taper over the last third ----',
'  float ts = 0.52 + 0.20 * fract(rr.w * 43.17 + rr.x * 7.7);',
'  float u = clamp((t - ts) / (1.0 - ts), 0.0, 1.0);',
'  float taper = 1.0 - pow(u, 1.5);',
'  float dryV = clamp(step(0.945 - 0.14 * trail, rr.z) + isStraw, 0.0, 1.0);',
'  float hw = 0.5 * aShape.y * mix(uWiden, 1.0, isHero) * taper * (0.72 + 0.28 * smoothstep(0.0, 0.25, t)) * (1.0 - 0.28 * dryV);',
'  float cupSign = fract(rr.x * 13.7) > 0.5 ? 1.0 : -1.0;',
'  vec3 pos = root + P + r2 * (side * hw) + n2 * (side * side * hw * ' + F(CFG.cup) + ' * cupSign);',
'  float isTip = 1.0 - abs(side);',
'  pos += r2 * (isTip * (rr.y - 0.5) * 0.7 * aShape.y);',
'  // stop-motion paper boil: tiny per-frame jitter (+-1.5 % of the blade length at the tip)',
'  vec3 bj = vec3(hsHash3(vec3(xz * 17.3, uFrame * 1.31)), hsHash3(vec3(xz.yx * 11.7 + 3.0, uFrame * 2.17)), hsHash3(vec3(xz * 7.9 + 8.0, uFrame * 0.73))) - 0.5;',
'  pos += bj * (' + F(CFG.boil) + ' * uBoil * L * t * t);',
'  vWorldPos = pos;',
'  vN = n2; vR = r2;',
'  vUvb = vec2(side, t);',
'  vRand = rr;',
'  vInfo = vec4(clump, mound, aTuft.w, kind);',
'  vInfo2 = vec4(gust, push, P.y, lip);',
'  vInfo3 = vec4(trail, swath, L, 0.0);',
'  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);',
'}'
].join('\n');
var BLADE_FRAG = [
HS.GLSL.common,
GLSL_SHADOW,
GLSL_HAZE,
'uniform vec3 uCRoot; uniform vec3 uCMid; uniform vec3 uCLight; uniform vec3 uCTip; uniform vec3 uCDry;',
'varying vec3 vWorldPos; varying vec3 vN; varying vec3 vR; varying vec2 vUvb;',
'varying vec4 vRand; varying vec4 vInfo; varying vec4 vInfo2; varying vec4 vInfo3;',
'void main(){',
'  float side = vUvb.x, t = vUvb.y;',
'  float clump = vInfo.x, mound = vInfo.y, tseed = vInfo.z, kind = vInfo.w;',
'  float gust = vInfo2.x, hAbove = vInfo2.z, lip = vInfo2.w;',
'  float trail = vInfo3.x, swath = vInfo3.y;',
'  vec4 rr = vRand;',
'  float isHero = step(0.5, kind) * step(kind, 1.5);',
'  vec3 V = normalize(cameraPosition - vWorldPos);',
'  vec3 N = normalize(vN);',
'  if (dot(N, V) < 0.0) { N = -N; }',
'  vec3 R = normalize(vR);',
'  vec3 L = uSunDir;',
'  // V-fold along the mid-rib: the two halves are tilted apart (+-35 deg), plus a faint crease line',
'  float fs = smoothstep(-0.10, 0.10, side) * 2.0 - 1.0;',
'  float foldSign = fract(rr.x * 13.7) > 0.5 ? 1.0 : -1.0;',
'  vec3 Nf = normalize(N + R * fs * ' + F(CFG.foldTilt) + ' * foldSign);',
'  float crease = 1.0 - smoothstep(0.0, 0.11, abs(side));',
'  // ---- albedo: dark olive-teal root -> mid green -> light green upper third -> cream tip (last ~12 %) ----',
'  float val = mix(0.58, 1.42, pow(rr.x, 1.15));',
'  float hue = fract(rr.y * 9.37 + rr.w * 3.1);',
'  float cool = step(rr.y, 0.10);',
'  vec3 cMid = uCMid * mix(vec3(0.92, 1.0, 1.05), vec3(1.08, 1.02, 0.84), hue);',
'  cMid = mix(cMid, uCMid * vec3(0.70, 1.05, 1.32), cool);',
'  cMid *= mix(vec3(1.0), vec3(1.08, 1.0, 0.85), tseed * 0.5);',
'  cMid *= mix(vec3(1.0), vec3(1.10, 1.0, 0.80), trail * 0.55);',
'  vec3 cLight = mix(uCMid, uCLight, 0.85 + 0.15 * hue);',
'  cLight = mix(cLight, uCLight * vec3(0.78, 1.0, 1.16), cool);',
'  vec3 cTip = mix(uCLight, uCTip, 0.80);',
'  vec3 albedo = mix(uCRoot, cMid, smoothstep(0.0, 0.38, t));',
'  albedo = mix(albedo, cLight, smoothstep(0.52, 0.86, t));',
'  albedo = mix(albedo, cTip, smoothstep(0.86, 1.0, t) * (1.0 - 0.7 * cool));',
'  float dry = clamp(step(0.945 - 0.14 * trail, rr.z) + step(1.5, kind), 0.0, 1.0);',
'  vec3 cDry = uCDry * mix(vec3(0.80, 0.80, 0.86), vec3(1.12, 1.0, 0.78), fract(rr.x * 7.9 + rr.w * 2.3));',
'  albedo = mix(albedo, mix(cDry * 0.34, cDry * 1.25, smoothstep(0.0, 0.85, t)), dry);',
'  albedo *= mix(val, 0.62 * val, isHero);',
'  float fib = hsNoise(vec2(side * 5.0 + rr.x * 40.0, t * 70.0 + rr.y * 40.0));',
'  albedo *= 0.93 + 0.14 * fib;',
'  albedo *= 1.0 - 0.20 * crease * smoothstep(0.0, 0.5, t);',
'  // ---- occlusion: dark roots, hollows, depth in the canopy ----',
'  float hh = clamp(hAbove / 0.30, 0.0, 1.3);',
'  float depthRamp = 0.55 * t + 0.50 * hh;',
'  float shP = gPrinceShadow(vWorldPos.xz);',
'  float aoR = smoothstep(0.0, 0.85, depthRamp);',
'  float ao = mix(' + F(CFG.aoRoot) + ', 1.0, aoR * aoR);',
'  ao *= mix(0.52, 1.0, mound);',
'  ao *= 1.0 - 0.35 * shP;',
'  ao = mix(ao, mix(0.22, 0.85, smoothstep(0.0, 0.7, t)), isHero);',
'  // ---- ambient: green bounce low, a cooler sky fill on the upper / bent parts; deep shade leans teal-green ----',
'  float skyW = clamp(0.08 + 0.42 * smoothstep(0.2, 1.0, depthRamp) + 0.8 * max(Nf.y, 0.0), 0.0, 1.0);',
'  vec3 amb = mix(uAmbGround, uAmbSky * vec3(0.80, 0.93, 1.05), skyW * 0.8);',
'  amb *= mix(vec3(0.70, 1.0, 1.08), vec3(1.0), ao);',
'  vec3 col = albedo * amb * ao * ' + F(CFG.ambGain) + ';',
'  vec3 teal = uCRoot * vec3(0.55, 1.35, 1.25);',
'  col += teal * (1.0 - ao) * 0.55;',
'  // soft bounce card from the camera side lifts camera-facing faces',
'  col += albedo * uFillColor * max(dot(Nf, uFillDir), 0.0) * mix(0.35, 1.0, ao) * ' + F(CFG.fillGain) + ';',
'  // ---- direct light + back-light translucency: brightens and warms the blade\'s own green, never replaces it ----',
'  float drift = hsLightDrift(vWorldPos.xz);',
'  float band = smoothstep(0.25, 0.75, hsNoise(vWorldPos.xz * 0.21 + vec2(1.7, 9.1)));',
'  albedo *= mix(vec3(0.90, 0.99, 1.05), vec3(1.07, 1.02, 0.88), band);',
'  float expo = smoothstep(0.30, 1.0, depthRamp) * mix(0.45, 1.0, mound) * drift * (1.0 - 1.6 * shP);',
'  expo *= (0.82 + 0.30 * gust) * (1.0 + 0.30 * clamp(-swath / 0.6, -1.0, 1.0)) * (0.70 + 0.60 * band);',
'  expo = mix(expo, max(expo, 0.80 * drift), lip);',
'  float ndl = dot(Nf, L);',
'  vec3 sunC = mix(vec3(dot(uSunColor, vec3(0.3333))), uSunColor, 0.26);',
'  col += albedo * sunC * max(ndl, 0.0) * expo * ' + F(CFG.directGain) + ';',
'  float cosIn = max(abs(ndl), 0.24);',
'  float fwd = pow(clamp(dot(-V, L) * 0.5 + 0.5, 0.0, 1.0), 2.5);',
'  float thin = 0.40 + 0.60 * smoothstep(0.30, 1.0, t) + 0.30 * smoothstep(0.6, 1.0, abs(side)) + 0.55 * smoothstep(0.80, 1.0, t);',
'  float gGain = 0.40 + 1.25 * pow(fract(rr.z * 5.71 + rr.w * 3.37), 2.0);',
'  float tr = min(' + F(CFG.transGain) + ' * gGain * cosIn * (0.30 + 0.70 * fwd) * thin * expo * (1.0 + 0.75 * dry), ' + F(CFG.transCap) + ' * (1.0 + 0.30 * dry));',
'  vec3 transAlb = pow(albedo, vec3(0.85)) * vec3(1.03, 1.0, 0.90);',
'  col += transAlb * sunC * tr;',
'  // paper edges catch the warm back-light (strong on the big foreground blades)',
'  float rimE = smoothstep(0.72, 1.0, abs(side)) * (0.30 + 0.70 * fwd) * smoothstep(0.12, 0.7, t);',
'  col += mix(albedo, uCTip, 0.45) * uSunColor * rimE * mix(0.30 + 0.70 * expo, 0.55, isHero) * ' + F(CFG.rimGain) + ' * 0.35 * (1.0 + 1.2 * (1.0 - smoothstep(2.5, 6.5, length(vWorldPos - cameraPosition))));',
'  // the near field sits in the camera-side shade',
'  float dC = length(vWorldPos - cameraPosition);',
'  float heroRim = isHero * smoothstep(0.30, 1.0, abs(side)) * (0.40 + 0.60 * fwd) * smoothstep(0.05, 0.6, t);',
'  col *= mix(0.26, 1.0, smoothstep(3.2, 6.8, dC)) * (1.0 + 0.34 * smoothstep(5.8, 8.4, dC)) * (0.86 + 0.28 * band);',
'  col += mix(uCLight, uCTip, 0.55) * sunC * heroRim * 0.30;',
'  col *= mix(vec3(1.0), vec3(0.62, 0.86, 0.92), clamp(shP * 1.6, 0.0, 1.0));',
'  col = gHaze(col, vWorldPos);',
'  col = hsFog(col, vWorldPos);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <colorspace_fragment>',
'}'
].join('\n');
var BAKE_VERT = [
HS.GLSL.common,
GLSL_FIELDS,
'uniform vec2 uBakeSize;',
'varying vec4 vBake;',
'void main(){',
'  vec2 xz = position.xz;',
GLSL_BLADE_STATIC,
'  vBake = vec4(clump, mound, swath, swirl);',
'  float id = float(gl_VertexID), row = floor(id / uBakeSize.x), col = id - row * uBakeSize.x;',
'  gl_Position = vec4((col + 0.5) / uBakeSize.x * 2.0 - 1.0, (row + 0.5) / uBakeSize.y * 2.0 - 1.0, 0.0, 1.0);',
'  gl_PointSize = 1.0;',
'}'
].join('\n');
var BAKE_FRAG = 'varying vec4 vBake; void main(){ gl_FragColor = vBake; }';
function bakeStatic(renderer, root, N, cache) {
var rt = null, geo = null, prev = null;
try {
if (!renderer.capabilities.isWebGL2 || !renderer.extensions.has('EXT_color_buffer_float')) { return null; }
var W = 512, H = Math.max(1, Math.ceil(N / W));
rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false });
geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(root, 4));
var mat = cache.mat || (cache.mat = new THREE.ShaderMaterial({ uniforms: HS.shared({ uBakeSize: { value: new THREE.Vector2(W, H) } }), vertexShader: BAKE_VERT, fragmentShader: BAKE_FRAG,
blending: THREE.NoBlending, depthTest: false, depthWrite: false }));
mat.uniforms.uBakeSize.value.set(W, H);
var pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
var scn = new THREE.Scene(); scn.add(pts);
prev = renderer.getRenderTarget();
renderer.setRenderTarget(rt); renderer.render(scn, new THREE.Camera()); renderer.setRenderTarget(prev); prev = null;
var out = new Float32Array(W * H * 4);
renderer.readRenderTargetPixels(rt, 0, 0, W, H, out);
var ok = true, i;
for (i = 0; i < N * 4 && ok; i += 509) { ok = isFinite(out[i]); }
return ok && (out[1] !== 0 || out[N * 4 - 3] !== 0 || out[2] !== 0) ? new Float32Array(out.buffer, 0, N * 4) : null;
} catch (e) {
if (prev !== null) { try { renderer.setRenderTarget(prev); } catch (e2) {} }
return null;
} finally {
if (geo) { geo.dispose(); } if (rt) { rt.dispose(); }
}
}
var TERRAIN_VERT = [
HS.GLSL.common,
'varying vec3 vWorldPos; varying vec3 vNormalW;',
'void main(){',
'  vWorldPos = position;',
'  vNormalW = normal;',
'  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);',
'}'
].join('\n');
var TERRAIN_FRAG = [
HS.GLSL.common,
GLSL_FIELDS,
GLSL_SHADOW,
GLSL_HAZE,
'uniform vec3 uCRoot; uniform vec3 uCMid; uniform vec3 uCDry; uniform vec3 uCSoil;',
'varying vec3 vWorldPos; varying vec3 vNormalW;',
'void main(){',
'  vec3 N = normalize(vNormalW);',
'  vec2 p = vWorldPos.xz;',
'  float steep = smoothstep(0.30, 0.75, 1.0 - N.y);',
'  float n1 = hsFbm(p * 1.7);',
'  vec3 soilC = mix(uCSoil, uCRoot, 0.30 + 0.55 * n1);',
'  vec2 wd = normalize(uWindDir);',
'  vec2 pw = vec2(dot(p, wd), dot(p, vec2(-wd.y, wd.x)));',
'  float s1 = hsNoise(vec2(pw.x * 2.4, pw.y * 26.0));',
'  float s2 = hsNoise(vec2(pw.x * 5.0 + 3.1, pw.y * 48.0 + 1.7));',
'  float st = smoothstep(0.50, 0.88, s1 * 0.6 + s2 * 0.4);',
'  float clump = gClump(p);',
'  vec3 topC = mix(soilC, mix(uCRoot, uCMid, 0.5), st * 0.55 + clump * 0.14);',
'  vec3 earth = mix(uCSoil * vec3(1.9, 1.5, 1.1), uCDry * 0.20, 0.45 + 0.45 * hsFbm(p * 3.0 + vec2(vWorldPos.y * 2.0)));',
'  float strata = hsNoise(vec2(vWorldPos.y * 14.0 + hsNoise(p * 1.3) * 3.0, p.x * 0.7));',
'  earth *= 0.80 + 0.40 * strata;',
'  vec3 base = mix(topC, earth, steep);',
'  float ndl = dot(N, uSunDir);',
'  vec3 amb = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5);',
'  float wrap = clamp((ndl + 0.3) / 1.3, 0.0, 1.0);',
'  vec3 col = base * (amb * 0.9 + uSunColor * wrap * wrap * 0.8 * hsLightDrift(p));',
'  col *= mix(0.45, 1.0, steep);',
'  col *= 1.0 - gPrinceShadow(p);',
'  col = gHaze(col, vWorldPos);',
'  col = hsFog(col, vWorldPos);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <colorspace_fragment>',
'}'
].join('\n');
var STALK_VERT = [
HS.GLSL.common,
GLSL_RIBBON,
'attribute vec4 aRoot; attribute vec4 aShape; attribute vec4 aRand;',
'varying vec3 vWorldPos; varying vec3 vN; varying vec2 vUvb; varying vec4 vRand; varying float vH;',
'void main(){',
'  float side = position.x, t = position.y, wf = position.z;',
'  vec3 root = aRoot.xyz;',
'  vec2 xz = root.xz;',
'  float gust = hsGust(xz);',
'  float sway = sin(uTime * 1.25 + aShape.z * 6.2831 + xz.x * 0.4) * 0.10 + sin(uTime * 2.3 + aRand.x * 6.2831) * 0.035;',
'  float wa = atan(uWindDir.y, uWindDir.x) + (aRand.z - 0.5) * 0.9;',
'  vec2 wd = vec2(cos(wa), sin(wa));',
'  vec2 pq = xz - uPrincePos.xz; float pd = length(pq);',
'  float push = 1.0 - smoothstep(0.1, 0.6, pd);',
'  float lean = 0.18 + 0.20 * aRand.y + gust * 0.34 + sway;',
'  vec2 bend2 = wd * lean + (pq / max(pd, 0.02)) * push * 1.2;',
'  float m = length(bend2);',
'  vec2 b = m > 1e-4 ? bend2 / m : wd;',
'  float a0 = m * 0.35;',
'  float a1 = m * 1.00 + 0.18;',
'  vec3 P, r, n;',
'  gRibbon(t, aShape.x, a0, a1, b, aRoot.w, P, r, n);',
'  float hw = 0.5 * aShape.y * wf;',
'  vec3 pos = root + P + r * (side * hw);',
'  vec3 bj = vec3(hsHash3(vec3(xz * 13.1, uFrame * 1.31)), hsHash3(vec3(xz.yx * 9.7 + 3.0, uFrame * 2.17)), 0.5) - 0.5;',
'  pos.xz += bj.xy * (0.012 * aShape.x * uBoil * t);',
'  vWorldPos = pos; vN = n; vUvb = vec2(side, t); vRand = aRand; vH = P.y;',
'  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);',
'}'
].join('\n');
var STALK_FRAG = [
HS.GLSL.common,
GLSL_SHADOW,
GLSL_HAZE,
'uniform vec3 uCLight; uniform vec3 uCTip; uniform vec3 uCDry; uniform vec3 uCMid;',
'varying vec3 vWorldPos; varying vec3 vN; varying vec2 vUvb; varying vec4 vRand; varying float vH;',
'void main(){',
'  float side = vUvb.x, t = vUvb.y;',
'  vec3 V = normalize(cameraPosition - vWorldPos);',
'  vec3 N = normalize(vN); if (dot(N, V) < 0.0) { N = -N; }',
'  vec3 L = uSunDir;',
'  float ear = smoothstep(0.80, 0.83, t);',
'  vec3 stem = mix(uCLight, uCDry, 0.55 + 0.3 * vRand.w) * 1.05;',
'  vec3 head = mix(uCDry, vec3(dot(uCDry, vec3(0.3333))), 0.35) * (1.05 + 0.15 * vRand.y);',
'  vec3 albedo = mix(stem, head, ear) * (0.88 + 0.24 * vRand.x);',
'  float ao = mix(0.30, 1.0, smoothstep(0.0, 0.45, vH / 0.40));',
'  float shP = gPrinceShadow(vWorldPos.xz);',
'  vec3 amb = mix(uAmbGround, uAmbSky, 0.55);',
'  float drift = hsLightDrift(vWorldPos.xz);',
'  vec3 col = albedo * amb * ao;',
'  col += albedo * uFillColor * max(dot(N, uFillDir), 0.0) * 0.6;',
'  float fwd = pow(clamp(dot(-V, L) * 0.5 + 0.5, 0.0, 1.0), 2.5);',
'  vec3 sunC = mix(vec3(dot(uSunColor, vec3(0.3333))), uSunColor, 0.55);',
'  float tr = min(0.62 * (0.25 + 0.75 * fwd) * drift * (1.0 - 1.6 * shP) * (0.45 + 0.55 * ear) * smoothstep(0.1, 0.6, vH / 0.4), 0.75);',
'  col += albedo * sunC * tr;',
'  col = gHaze(col, vWorldPos);',
'  col = hsFog(col, vWorldPos);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <colorspace_fragment>',
'}'
].join('\n');
var FLOWER_VERT = [
HS.GLSL.common,
GLSL_RIBBON,
'attribute vec4 aRoot; attribute vec4 aShape; attribute vec4 aRand;',
'varying vec3 vWorldPos; varying vec3 vN; varying vec3 vLocal; varying vec4 vRand; varying float vH;',
'void main(){',
'  float part = position.z;',
'  vec3 root = aRoot.xyz;',
'  vec2 xz = root.xz;',
'  float gust = hsGust(xz);',
'  float sway = sin(uTime * 1.7 + aRand.x * 6.2831 + xz.x * 0.5) * 0.08;',
'  float wa = atan(uWindDir.y, uWindDir.x) + (aRand.z - 0.5) * 0.9;',
'  vec2 wd = vec2(cos(wa), sin(wa));',
'  vec2 pq = xz - uPrincePos.xz; float pd = length(pq);',
'  float push = 1.0 - smoothstep(0.1, 0.6, pd);',
'  float lean = 0.20 + 0.25 * aRand.y + gust * 0.40 + sway;',
'  vec2 bend2 = wd * lean + (pq / max(pd, 0.02)) * push * 1.2;',
'  float m = length(bend2);',
'  vec2 b = m > 1e-4 ? bend2 / m : wd;',
'  float a0 = m * 0.35, a1 = m * 0.90;',
'  float t = part < 0.5 ? position.y : 1.0;',
'  vec3 P, r, n;',
'  gRibbon(t, aShape.x, a0, a1, b, aRoot.w, P, r, n);',
'  vec3 pos;',
'  if (part < 0.5) {',
'    pos = root + P + r * (position.x * 0.0035);',
'    vN = n;',
'  } else {',
'    vec3 nh = normalize(vec3(sin(aRoot.w) * 0.5, 0.42, cos(aRoot.w)) + vec3(b.x, 0.0, b.y) * 0.25);',
'    vec3 Rh = normalize(vec3(nh.z, 0.0, -nh.x));',
'    vec3 Uh = cross(nh, Rh);',
'    float ca = cos(aRand.w * 6.2831), sa = sin(aRand.w * 6.2831);',
'    vec2 q = vec2(position.x * ca - position.y * sa, position.x * sa + position.y * ca) * aShape.y;',
'    pos = root + P + Rh * q.x + Uh * q.y + nh * (part > 1.5 ? 0.003 : 0.0);',
'    vN = nh;',
'  }',
'  vec3 bj = vec3(hsHash3(vec3(xz * 13.1, uFrame * 1.31)), hsHash3(vec3(xz.yx * 9.7 + 3.0, uFrame * 2.17)), 0.5) - 0.5;',
'  pos.xz += bj.xy * (0.006 * uBoil);',
'  vWorldPos = pos; vLocal = vec3(position.xy, part); vRand = aRand; vH = P.y;',
'  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);',
'}'
].join('\n');
var FLOWER_FRAG = [
HS.GLSL.common,
GLSL_SHADOW,
GLSL_HAZE,
'uniform vec3 uCMid; uniform vec3 uCLight; uniform vec3 uFlA; uniform vec3 uFlB; uniform vec3 uFlC;',
'varying vec3 vWorldPos; varying vec3 vN; varying vec3 vLocal; varying vec4 vRand; varying float vH;',
'void main(){',
'  float part = vLocal.z;',
'  vec3 V = normalize(cameraPosition - vWorldPos);',
'  vec3 N = normalize(vN); if (dot(N, V) < 0.0) { N = -N; }',
'  vec3 L = uSunDir;',
'  vec3 petal = vRand.y > 0.5 ? uFlA : uFlB;',
'  vec3 albedo = part < 0.5 ? mix(uCMid, uCLight, 0.4) * 0.8 : (part > 1.5 ? uFlC : petal);',
'  float rad = length(vLocal.xy);',
'  if (part > 0.5 && part < 1.5) { albedo *= 0.88 + 0.16 * smoothstep(0.2, 1.0, rad); }',
'  float shP = gPrinceShadow(vWorldPos.xz);',
'  float ao = part < 0.5 ? mix(0.12, 0.9, smoothstep(0.0, 0.3, vH)) : 1.0;',
'  vec3 amb = mix(uAmbGround, uAmbSky, 0.6);',
'  vec3 col = albedo * amb * ao * (1.0 - shP);',
'  float fwd = pow(clamp(dot(-V, L) * 0.5 + 0.5, 0.0, 1.0), 2.5);',
'  vec3 sunC = mix(vec3(dot(uSunColor, vec3(0.3333))), uSunColor, 0.55);',
'  float glow = part < 0.5 ? 0.20 : 0.55;',
'  col += albedo * sunC * (0.25 + 0.75 * fwd) * hsLightDrift(vWorldPos.xz) * (1.0 - 1.6 * shP) * glow;',
'  col = gHaze(col, vWorldPos);',
'  col = hsFog(col, vWorldPos);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <colorspace_fragment>',
'}'
].join('\n');
function makeBladeBase() {
var rows = [0.0, 0.24, 0.48, 0.68, 0.84];
var pos = [], idx = [], i;
for (i = 0; i < rows.length; i++) { pos.push(-1, rows[i], 0, 1, rows[i], 0); }
pos.push(0, 1, 0);
for (i = 0; i < rows.length - 1; i++) {
var a = 2 * i, b = a + 1, c = a + 2, d = a + 3;
idx.push(a, b, c, b, d, c);
}
var l = 2 * (rows.length - 1);
idx.push(l, l + 1, l + 2);
var g = new THREE.InstancedBufferGeometry();
g.setIndex(idx);
g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
return g;
}
function makeStalkBase() {
var rows = [
[0.00, 1.0], [0.22, 1.0], [0.44, 0.92], [0.66, 0.86], [0.82, 0.8],
[0.845, 1.5], [0.875, 2.3], [0.905, 2.7], [0.935, 2.5], [0.962, 1.9], [0.985, 1.2]
];
var pos = [], idx = [], i;
for (i = 0; i < rows.length; i++) { pos.push(-1, rows[i][0], rows[i][1], 1, rows[i][0], rows[i][1]); }
pos.push(0, 1, 0);
for (i = 0; i < rows.length - 1; i++) {
var a = 2 * i, b = a + 1, c = a + 2, d = a + 3;
idx.push(a, b, c, b, d, c);
}
var l = 2 * (rows.length - 1);
idx.push(l, l + 1, l + 2);
var g = new THREE.InstancedBufferGeometry();
g.setIndex(idx);
g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
return g;
}
function makeFlowerBase() {
var pos = [], idx = [], i, k;
var stemT = [0, 0.33, 0.66, 1.0];
for (i = 0; i < stemT.length; i++) { pos.push(-1, stemT[i], 0, 1, stemT[i], 0); }
for (i = 0; i < stemT.length - 1; i++) { var a = 2 * i; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
var base = pos.length / 3;
pos.push(0, 0, 1);
for (k = 0; k < 6; k++) {
var ta = TAU * k / 6, va = TAU * (k + 0.5) / 6;
pos.push(Math.cos(ta), Math.sin(ta), 1);
pos.push(Math.cos(va) * 0.40, Math.sin(va) * 0.40, 1);
}
for (k = 0; k < 6; k++) {
var tip = base + 1 + 2 * k, val = tip + 1, nxt = base + 1 + 2 * ((k + 1) % 6);
idx.push(base, tip, val, base, val, nxt);
}
var cb = pos.length / 3;
pos.push(0, 0, 2);
for (k = 0; k < 6; k++) { pos.push(Math.cos(TAU * k / 6) * 0.27, Math.sin(TAU * k / 6) * 0.27, 2); }
for (k = 0; k < 6; k++) { idx.push(cb, cb + 1 + k, cb + 1 + ((k + 1) % 6)); }
var g = new THREE.InstancedBufferGeometry();
g.setIndex(idx);
g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
return g;
}
function instAttr(arr) { return new THREE.InstancedBufferAttribute(arr, 4); }
function smooth01(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function buildField(N, halfDeg, view, camY) {
var camZ = HS.LAYOUT.camZ;
var rnd = HS.rng(20241);
var root = new Float32Array(N * 4), shape = new Float32Array(N * 4), rand = new Float32Array(N * 4), tuft = new Float32Array(N * 4);
var halfA = halfDeg * Math.PI / 180;
var tanVis = Math.tan(view.vfov * Math.PI / 360) * view.aspect;
var i = 0, k;
function put(x, z, yaw, len, wid, kind, hmul, ox, oz, seed) {
var sc = grassScale(x, z);
var trail = Math.min(1, Math.max(0, (1 - sc) / 0.52));
var o = i * 4;
root[o] = x; root[o + 1] = HS.heightAt(x, z) - 0.025; root[o + 2] = z; root[o + 3] = yaw;
shape[o] = len * sc; shape[o + 1] = wid; shape[o + 2] = trail; shape[o + 3] = kind;
rand[o] = rnd(); rand[o + 1] = rnd(); rand[o + 2] = rnd(); rand[o + 3] = rnd();
tuft[o] = ox; tuft[o + 1] = oz; tuft[o + 2] = hmul; tuft[o + 3] = seed;
i++;
}
var H = CFG.hero;
var heroN = Math.min(N >> 2, Math.max(16, Math.round(H.count * N / 72000)));
var bottomAng = view.vfov / 2 - view.pitch * 180 / Math.PI;
for (k = 0; k < heroN; k++) {
var corner = rnd() < H.cornerShare, sgn = rnd() < 0.5 ? -1 : 1;
var xn, fr;
if (corner) {
xn = sgn > 0 ? 0.80 + 0.17 * rnd() : -(0.70 + 0.32 * rnd());
fr = H.fracCorner[0] + (H.fracCorner[1] - H.fracCorner[0]) * rnd();
} else {
xn = (rnd() * 2 - 1) * 0.85;
fr = H.fracMid[0] + (H.fracMid[1] - H.fracMid[0]) * Math.pow(rnd(), 0.8);
}
var hlen = H.len[0] + (H.len[1] - H.len[0]) * rnd();
var alpha = (bottomAng - fr * view.vfov) * Math.PI / 180;
var dd = 2.5, hx = 0, hz = 0, hy = 0, it;
for (it = 0; it < 3; it++) {
hx = xn * tanVis * dd; hz = camZ - dd; hy = HS.heightAt(hx, hz);
dd = Math.min(H.dist[1], Math.max(H.dist[0], (camY - (hy + 0.62 * hlen)) / Math.tan(alpha)));
}
hx = xn * tanVis * dd; hz = camZ - dd;
put(hx, hz, (rnd() * 2 - 1) * 0.6, hlen, H.width[0] + (H.width[1] - H.width[0]) * rnd(), 1, 1.0, 0, 0, rnd());
}
var nearA = CFG.nearTaper[0], nearB = CFG.nearTaper[1], nearMin = CFG.nearTaper[2];
var LP = CFG.lip;
while (i < N) {
var cx = 0, cz = 0, ok = false, tries;
for (tries = 0; tries < 30 && !ok; tries++) {
var dc = CFG.fanNear + (CFG.fanFar - CFG.fanNear) * rnd();
if (rnd() > nearMin + (1 - nearMin) * smooth01(nearA, nearB, dc)) { continue; }
var aa = (rnd() * 2 - 1) * halfA;
cx = dc * Math.sin(aa); cz = camZ - dc * Math.cos(aa);
ok = cz > HS.crestZ(cx) - 0.10;
}
if (!ok) { continue; }
var dist = Math.sqrt(cx * cx + (camZ - cz) * (camZ - cz));
var nB = CFG.tuftBlades[0] + Math.floor(rnd() * (CFG.tuftBlades[1] - CFG.tuftBlades[0] + 1));
var sg = CFG.tuftSigma[0] + (CFG.tuftSigma[1] - CFG.tuftSigma[0]) * rnd();
var tuftH = 0.85 + 0.33 * rnd();
var seed = rnd();
var wMul = Math.min(CFG.farWidth[3], Math.max(CFG.farWidth[2], CFG.farWidth[0] + CFG.farWidth[1] * dist));
for (k = 0; k < nB && i < N; k++) {
var ang = rnd() * TAU;
var rr = sg * Math.sqrt(-2 * Math.log(1 - rnd() * 0.97));
rr = Math.min(rr, sg * 2.6);
var ox = Math.cos(ang) * rr, oz = Math.sin(ang) * rr;
var bx = cx + ox, bz = cz + oz;
var lipD = bz - HS.crestZ(bx);
if (lipD < -0.22) { continue; }
var lipK = 1 - smooth01(0, LP.width, lipD);
if (rnd() > LP.density + (1 - LP.density) * (1 - lipK)) { continue; }
var nx = ox / sg, nz = oz / sg;
var dome = Math.exp(-0.5 * (nx * nx + nz * nz) / 1.2);
var hmul = tuftH * (0.78 + 0.34 * dome);
var yaw = rnd() < CFG.edgeOnShare ? (rnd() * 2 - 1) * 1.55 : (rnd() * 2 - 1) * CFG.yawSpread;
var lenMul = 1 + (LP.longer - 1) * lipK, widMul = 1 - (1 - LP.thinner) * lipK;
if (rnd() < CFG.strawShare) {
put(bx, bz, yaw * 0.7, (CFG.strawLen[0] + (CFG.strawLen[1] - CFG.strawLen[0]) * rnd()) * lenMul,
(CFG.strawWidth[0] + (CFG.strawWidth[1] - CFG.strawWidth[0]) * rnd()) * wMul * widMul, 2, 1.0, nx * 0.4, nz * 0.4, seed);
} else {
var len = (CFG.lenMin + (CFG.lenMax - CFG.lenMin) * Math.pow(rnd(), CFG.lenSkew)) * lenMul;
var wid = (CFG.widthMin + (CFG.widthMax - CFG.widthMin) * rnd()) * wMul * widMul;
put(bx, bz, yaw, len, wid, 0, hmul, nx * 0.7, nz * 0.7, seed);
}
}
}
return orderField({ root: root, shape: shape, rand: rand, tuft: tuft }, N, heroN, camZ);
}
function orderField(f, N, heroN, camZ) {
var G = CFG.groups, nT = N - heroN, B = 1024, scale = B / 16, PHI = 0.6180339887498949;
var root = f.root, grp = new Uint8Array(N), key = new Uint16Array(N), cnt = [], size = [0, 0, 0], g, i, j, a, o;
for (g = 0; g < 3; g++) { cnt.push(new Uint32Array(B + 1)); }
for (j = 0; j < nT; j++) {
i = heroN + j; var u = (j + 0.5) * PHI; u -= Math.floor(u);
g = u < G[0] ? 0 : (u < G[1] ? 1 : 2);
var dx = root[i * 4], dz = root[i * 4 + 2] - camZ, k = Math.sqrt(dx * dx + dz * dz) * scale | 0;
grp[i] = g; key[i] = k < B ? k : B - 1; cnt[g][key[i] + 1]++; size[g]++;
}
var start = [heroN, heroN + size[0], heroN + size[0] + size[1]];
for (g = 0; g < 3; g++) { for (j = 0; j < B; j++) { cnt[g][j + 1] += cnt[g][j]; } }
var dst = new Uint32Array(N);
for (i = 0; i < heroN; i++) { dst[i] = i; }
for (i = heroN; i < N; i++) { g = grp[i]; dst[i] = start[g] + cnt[g][key[i]]++; }
var names = ['root', 'shape', 'rand', 'tuft'];
for (a = 0; a < 4; a++) {
var src = f[names[a]], out = new Float32Array(N * 4);
for (i = 0; i < N; i++) { o = dst[i] * 4; out[o] = src[i * 4]; out[o + 1] = src[i * 4 + 1]; out[o + 2] = src[i * 4 + 2]; out[o + 3] = src[i * 4 + 3]; }
f[names[a]] = out;
}
f.heroN = heroN; f.ends = [start[1], start[2], N];
return f;
}
function buildAccents(n, kind, halfDeg, view) {
var camZ = HS.LAYOUT.camZ;
var rnd = HS.rng(kind === 'stalk' ? 777 : 4242);
var root = new Float32Array(n * 4), shape = new Float32Array(n * 4), rand = new Float32Array(n * 4);
var halfA = halfDeg * Math.PI / 180;
var tanVis = Math.tan(view.vfov * Math.PI / 360) * view.aspect;
var i = 0, guard = 0;
while (i < n && guard++ < n * 120) {
var d = (kind === 'stalk' ? 6.4 : 4.2) + (kind === 'stalk' ? 6.6 : 6.0) * rnd();
var a = (rnd() * 2 - 1) * halfA;
var x = d * Math.sin(a), z = camZ - d * Math.cos(a);
if (z < HS.crestZ(x) + (kind === 'stalk' ? 0.15 : 0.25)) { continue; }
var xn = Math.tan(a) / tanVis;
var sc = grassScale(x, z);
var wgt;
if (kind === 'stalk') {
wgt = 1 - 0.75 * smooth01(-0.40, 0.05, xn);
wgt *= 1 - smooth01(0.02, 0.12, xn) * (1 - smooth01(0.80, 0.92, xn) * 0.75);
wgt *= smooth01(0.55, 0.95, sc);
wgt *= 0.5 + 0.5 * smooth01(5.0, 9.0, d);
} else {
wgt = 1 - 0.70 * smooth01(0.05, 0.50, xn);
if (sc < 0.9) { continue; }
}
if (rnd() > wgt) { continue; }
var o = i * 4;
root[o] = x; root[o + 1] = HS.heightAt(x, z) - 0.02; root[o + 2] = z;
root[o + 3] = (rnd() * 2 - 1) * 0.9;
if (kind === 'stalk') {
shape[o] = (0.55 + 0.25 * rnd()) * sc; shape[o + 1] = 0.0150 + 0.0050 * rnd(); shape[o + 2] = rnd(); shape[o + 3] = 0;
} else {
shape[o] = (0.20 + 0.13 * rnd()) * sc; shape[o + 1] = 0.017 + 0.011 * rnd(); shape[o + 2] = rnd(); shape[o + 3] = 0;
}
rand[o] = rnd(); rand[o + 1] = rnd(); rand[o + 2] = rnd(); rand[o + 3] = rnd();
i++;
}
return { root: root, shape: shape, rand: rand, count: i };
}
function buildTerrain() {
var x0 = -13, x1 = 13, z0 = -14, z1 = 9.5, step = 0.25;
var nx = Math.round((x1 - x0) / step) + 1, nz = Math.round((z1 - z0) / step) + 1;
var pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3);
var ix, iz, o;
for (iz = 0; iz < nz; iz++) {
for (ix = 0; ix < nx; ix++) {
var x = x0 + ix * step, z = z0 + iz * step;
o = (iz * nx + ix) * 3;
pos[o] = x; pos[o + 1] = HS.heightAt(x, z); pos[o + 2] = z;
var e = 0.1;
var hx = HS.heightAt(x + e, z) - HS.heightAt(x - e, z), hz = HS.heightAt(x, z + e) - HS.heightAt(x, z - e);
var nxv = -hx / (2 * e), nzv = -hz / (2 * e), l = Math.sqrt(nxv * nxv + 1 + nzv * nzv);
nor[o] = nxv / l; nor[o + 1] = 1 / l; nor[o + 2] = nzv / l;
}
}
var idx = new Uint16Array((nx - 1) * (nz - 1) * 6), p = 0;
for (iz = 0; iz < nz - 1; iz++) {
for (ix = 0; ix < nx - 1; ix++) {
var a = iz * nx + ix, b = a + 1, c = a + nx, d = c + 1;
idx[p++] = a; idx[p++] = c; idx[p++] = b; idx[p++] = b; idx[p++] = c; idx[p++] = d;
}
}
var g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
g.setIndex(new THREE.BufferAttribute(idx, 1));
return g;
}
HS.register('hill', function (ctx) {
var pal = ctx.palette, quality = ctx.quality, dbg = ctx.debug || {};
var group = new THREE.Group();
ctx.scene.add(group);
function col(h) { return new THREE.Color(h); }
var uKnee = { value: new THREE.Vector3(0.6, 8.2, 1.9) };
var palU = {
uCRoot: { value: col(pal.grassRoot) }, uCMid: { value: col(pal.grassMid) }, uCLight: { value: col(pal.grassLight) },
uCTip: { value: col(pal.grassTip) }, uCDry: { value: col(pal.grassDry) }, uCSoil: { value: col(pal.soil) },
uFlA: { value: col(pal.cloud).lerp(col(pal.grassTip), 0.30) },
uFlB: { value: col(HS.PRINCE_COLORS.scarf) },
uFlC: { value: col(HS.PRINCE_COLORS.scarfDeep) },
uKnee: uKnee, uWiden: { value: 1 }
};
var terrainGeo = buildTerrain();
var terrainMat = new THREE.ShaderMaterial({ uniforms: HS.shared(palU), vertexShader: TERRAIN_VERT, fragmentShader: TERRAIN_FRAG });
var terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.frustumCulled = false; terrain.renderOrder = 3;
group.add(terrain);
var bladeBase = makeBladeBase(), stalkBase = makeStalkBase(), flowerBase = makeFlowerBase();
var bladeFrag = BLADE_FRAG;
if (dbg.herodbg) {
bladeFrag = bladeFrag.replace('col = gHaze(col, vWorldPos);', 'col = gHaze(col, vWorldPos); if (isHero > 0.5) { col = vec3(1.0, 0.0, 1.0) * (0.4 + 0.6 * t); }');
}
var bladeMat = new THREE.ShaderMaterial({ uniforms: HS.shared(palU), vertexShader: BLADE_VERT, fragmentShader: bladeFrag, side: THREE.DoubleSide });
var stalkMat = new THREE.ShaderMaterial({ uniforms: HS.shared(palU), vertexShader: STALK_VERT, fragmentShader: STALK_FRAG, side: THREE.DoubleSide });
var flowerMat = new THREE.ShaderMaterial({ uniforms: HS.shared(palU), vertexShader: FLOWER_VERT, fragmentShader: FLOWER_FRAG, side: THREE.DoubleSide });
var bladeMesh = null, stalkMesh = null, flowerMesh = null, builtKey = '', dummy = null, seaMesh = null;
var bakeCache = { mat: null };
var field = null, groupsOn = 3;
function setInstanced(base, data, count, names) {
var g = new THREE.InstancedBufferGeometry();
g.index = base.index;
g.setAttribute('position', base.getAttribute('position'));
for (var k = 0; k < names.length; k++) { g.setAttribute(names[k][0], instAttr(data[names[k][1]])); }
g.instanceCount = count;
return g;
}
if (dbg.sea) {
seaMesh = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.seaMid) }));
seaMesh.rotation.x = -Math.PI / 2; seaMesh.position.y = HS.LAYOUT.seaY; group.add(seaMesh);
}
function rebuild(view) {
var tanH = Math.tan(view.vfov * Math.PI / 360) * view.aspect;
var vis = Math.atan(tanH) * 180 / Math.PI;
var half = Math.min(CFG.fanMaxDeg, Math.max(14, Math.ceil((vis + 3.5) / 2) * 2));
if (dbg.fan != null) { half = Math.max(5, Math.min(60, parseFloat(dbg.fan) || half)); }
if (dbg.cam || dbg.cx != null) { half = CFG.fanMaxDeg; }
var key = [half, Math.round(view.vfov), Math.round(view.pitch * 400), Math.round(view.aspect * 10)].join('|');
if (key === builtKey) { return; }
builtKey = key;
var camY = HS.heightAt(0, HS.LAYOUT.camZ) + (dbg.eye != null ? parseFloat(dbg.eye) : HS.LAYOUT.eyeHeight);
var scale = quality.blades / 72000;
var N = quality.blades;
var f = buildField(N, half, view, camY);
field = { heroN: f.heroN, ends: f.ends };
var names = [['aRoot', 'root'], ['aShape', 'shape'], ['aRand', 'rand'], ['aTuft', 'tuft']];
f.bake = dbg.nobake ? null : bakeStatic(ctx.renderer, f.root, N, bakeCache);
if (f.bake) { names.push(['aBake', 'bake']); }
if (!!bladeMat.defines.HS_BAKED !== !!f.bake) { if (f.bake) { bladeMat.defines.HS_BAKED = 1; } else { delete bladeMat.defines.HS_BAKED; } bladeMat.needsUpdate = true; }
var nGeo = setInstanced(bladeBase, f, N, names);
if (bladeMesh) { bladeMesh.geometry.dispose(); bladeMesh.geometry = nGeo; }
else { bladeMesh = new THREE.Mesh(nGeo, bladeMat); bladeMesh.frustumCulled = false; bladeMesh.renderOrder = 1; group.add(bladeMesh); }
applyDensity();
var ns = Math.max(14, Math.round(CFG.seeds * scale));
var s = buildAccents(ns, 'stalk', half, view);
var sGeo = setInstanced(stalkBase, s, s.count, [['aRoot', 'root'], ['aShape', 'shape'], ['aRand', 'rand']]);
if (stalkMesh) { stalkMesh.geometry.dispose(); stalkMesh.geometry = sGeo; }
else { stalkMesh = new THREE.Mesh(sGeo, stalkMat); stalkMesh.frustumCulled = false; stalkMesh.renderOrder = 2; group.add(stalkMesh); }
var nf = Math.max(14, Math.round(CFG.flowers * scale));
var fl = buildAccents(nf, 'flower', half, view);
var fGeo = setInstanced(flowerBase, fl, fl.count, [['aRoot', 'root'], ['aShape', 'shape'], ['aRand', 'rand']]);
if (flowerMesh) { flowerMesh.geometry.dispose(); flowerMesh.geometry = fGeo; }
else { flowerMesh = new THREE.Mesh(fGeo, flowerMat); flowerMesh.frustumCulled = false; flowerMesh.renderOrder = 2; group.add(flowerMesh); }
}
function applyDensity() {
if (!bladeMesh || !field) { return 1; }
var frac = CFG.groups[groupsOn - 1];
bladeMesh.geometry.instanceCount = field.ends[groupsOn - 1];
palU.uWiden.value = Math.pow(1 / frac, CFG.widenPow);
return frac;
}
function setDensity(f) {
f = +f; if (!isFinite(f)) { f = 1; }
var G = CFG.groups;
groupsOn = f >= (G[1] + 1) / 2 ? 3 : (f >= (G[0] + G[1]) / 2 ? 2 : 1);
return applyDensity();
}
function placePrince(view) {
var sx = view.stopX, pz = HS.LAYOUT.princeZ, gy = HS.heightAt(sx, pz);
var dz = HS.LAYOUT.camZ - pz;
uKnee.value.set(gy + CFG.keepKnee, Math.sqrt(sx * sx + dz * dz), sx);
if (dbg.pdummy || dbg.pp) {
HS.U.uPrincePos.value.set(sx, gy, pz);
if (dbg.pdummy && !dummy) {
dummy = new THREE.Group();
var green = new THREE.MeshBasicMaterial({ color: new THREE.Color('#5f9d36') });
var dark = new THREE.MeshBasicMaterial({ color: new THREE.Color('#2f5a22') });
var skin = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ecd0a8') });
var gold = new THREE.MeshBasicMaterial({ color: new THREE.Color('#e3b53a') });
function box(w, h, d, x, y, z, m) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); dummy.add(b); }
box(0.11, 0.265, 0.11, -0.07, 0.1325, 0, dark); box(0.11, 0.265, 0.11, 0.07, 0.1325, 0, dark);
box(0.13, 0.195, 0.13, -0.07, 0.3625, 0, green); box(0.13, 0.195, 0.13, 0.07, 0.3625, 0, green);
box(0.34, 0.45, 0.2, 0, 0.685, 0, green);
box(0.22, 0.2, 0.2, 0, 1.0, 0, skin); box(0.3, 0.12, 0.26, 0, 1.12, 0, gold);
group.add(dummy);
}
if (dummy) { dummy.position.set(sx, gy, pz); }
}
}
return {
update: function (dt, t, frame) {  },
layout: function (view) { view = view || ctx.view; placePrince(view); rebuild(view); },
setDensity: setDensity,
density: function () { return CFG.groups[groupsOn - 1]; },
drawnBlades: function () { return bladeMesh ? bladeMesh.geometry.instanceCount : 0; },
dispose: function () {
ctx.scene.remove(group);
[terrainGeo, bladeBase, stalkBase, flowerBase].forEach(function (g) { g.dispose(); });
[bladeMesh, stalkMesh, flowerMesh].forEach(function (m) { if (m) { m.geometry.dispose(); } });
[terrainMat, bladeMat, stalkMat, flowerMat].forEach(function (m) { m.dispose(); });
if (bakeCache.mat) { bakeCache.mat.dispose(); bakeCache.mat = null; }
[dummy, seaMesh].forEach(function (o) { if (o) { o.traverse(function (c) { if (c.geometry) { c.geometry.dispose(); } if (c.material) { c.material.dispose(); } }); } });
}
};
});
})();
;
(function (global) {
'use strict';
var THREE = global.THREE, HS = global.HS;
if (!THREE || !HS) { return; }
var TAU = Math.PI * 2, V3 = THREE.Vector3;
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function sstep(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
function mix(a, b, t) { return a + (b - a) * t; }
function sgnPow(v, e) { return v < 0 ? -Math.pow(-v, e) : Math.pow(v, e); }
function curve(tbl) {
var n = tbl.length, m = [], i;
for (i = 0; i < n; i++) {
var a = tbl[Math.max(0, i - 1)], b = tbl[Math.min(n - 1, i + 1)];
m.push(b[0] === a[0] ? 0 : (b[1] - a[1]) / (b[0] - a[0]));
}
return function (x) {
if (x <= tbl[0][0]) { return tbl[0][1]; }
if (x >= tbl[n - 1][0]) { return tbl[n - 1][1]; }
var k = 0; while (x > tbl[k + 1][0]) { k++; }
var x0 = tbl[k][0], h = tbl[k + 1][0] - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
return (2 * t3 - 3 * t2 + 1) * tbl[k][1] + (t3 - 2 * t2 + t) * h * m[k] + (-2 * t3 + 3 * t2) * tbl[k + 1][1] + (t3 - t2) * h * m[k + 1];
};
}
function Acc() { this.P = []; this.T = []; this.I = []; this.tf = null; this.flip = false; }
Acc.prototype.v = function (x, y, z, tint) {
var m = this.tf;
if (m) {
var e = m.elements, X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
x = X; y = Y; z = Z;
}
this.P.push(x, y, z);
if (tint == null) { this.T.push(1, 1, 1); } else if (typeof tint === 'number') { this.T.push(tint, tint, tint); } else { this.T.push(tint.r, tint.g, tint.b); }
return this.P.length / 3 - 1;
};
Acc.prototype.tri = function (a, b, c) {
if (a === b || b === c || a === c) { return; }
if (this.flip) { this.I.push(a, c, b); } else { this.I.push(a, b, c); }
};
Acc.prototype.quad = function (a, b, c, d) { this.tri(a, b, c); this.tri(a, c, d); };
Acc.prototype.grid = function (nu, nv, fn, flip) {
var rows = [], i, j, r, k;
for (i = 0; i <= nu; i++) {
r = [];
for (j = 0; j <= nv; j++) { k = fn(i / nu, j / nv, i, j); r.push(this.v(k[0], k[1], k[2], k[3])); }
rows.push(r);
}
var f0 = this.flip; if (flip) { this.flip = !f0; }
for (i = 0; i < nu; i++) { for (j = 0; j < nv; j++) { this.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]); } }
this.flip = f0;
return rows;
};
Acc.prototype.build = function () {
var g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
g.setAttribute('aTint', new THREE.Float32BufferAttribute(this.T, 3));
g.setIndex(this.I);
g.computeVertexNormals();
fixNormals(g, this.P);
g.computeBoundingSphere();
return g;
};
function fixNormals(g, P) {
var n = g.attributes.normal.array, cnt = n.length / 3, map = {}, i, key;
function kk(i) { return Math.round(P[i * 3] * 1e5) + ',' + Math.round(P[i * 3 + 1] * 1e5) + ',' + Math.round(P[i * 3 + 2] * 1e5); }
for (i = 0; i < cnt; i++) { if (n[i * 3] * n[i * 3] + n[i * 3 + 1] * n[i * 3 + 1] + n[i * 3 + 2] * n[i * 3 + 2] > 1e-8) { map[kk(i)] = [n[i * 3], n[i * 3 + 1], n[i * 3 + 2]]; } }
for (i = 0; i < cnt; i++) {
if (n[i * 3] * n[i * 3] + n[i * 3 + 1] * n[i * 3 + 1] + n[i * 3 + 2] * n[i * 3 + 2] > 1e-8) { continue; }
key = map[kk(i)] || [0, 1, 0]; n[i * 3] = key[0]; n[i * 3 + 1] = key[1]; n[i * 3 + 2] = key[2];
}
g.attributes.normal.needsUpdate = true;
}
function loft(acc, rings, segs) {
var rows = [], k, j;
for (k = 0; k < rings.length; k++) {
var R = rings[k], row = [], e = 2 / (R.n || 2), rx = R.rx != null ? R.rx : R.r, rz = R.rz != null ? R.rz : R.r;
if (R.pole) {
var pv = acc.v(R.cx || 0, R.y, R.cz || 0, typeof R.tint === 'function' ? R.tint(0, k) : R.tint);
for (j = 0; j < segs; j++) { row.push(pv); }
} else {
for (j = 0; j < segs; j++) {
var a = TAU * j / segs, mm = R.mod ? R.mod(a, k) : 1;
row.push(acc.v((R.cx || 0) + rx * mm * sgnPow(Math.sin(a), e), R.y + (R.dy ? R.dy(a, k) : 0), (R.cz || 0) + rz * mm * sgnPow(Math.cos(a), e),
typeof R.tint === 'function' ? R.tint(a, k) : R.tint));
}
}
rows.push(row);
}
for (k = 0; k < rings.length - 1; k++) {
for (j = 0; j < segs; j++) {
var j1 = (j + 1) % segs;
acc.quad(rows[k][j], rows[k][j1], rows[k + 1][j1], rows[k + 1][j]);
}
}
return rows;
}
function blob(acc, c, rad, segs, rings, tint) {
var rs = [], i;
for (i = 0; i <= rings; i++) {
var p = -Math.PI / 2 + Math.PI * i / rings, s = Math.sin(p), co = Math.cos(p);
rs.push(i === 0 || i === rings ? { y: c[1] + rad[1] * s, cx: c[0], cz: c[2], pole: true, tint: tint } : { y: c[1] + rad[1] * s, cx: c[0], cz: c[2], rx: rad[0] * co, rz: rad[2] * co, tint: tint });
}
return loft(acc, rs, segs);
}
function paper(opts, pinned) {
var m = HS.makePaperMaterial(opts), vs = m.vertexShader, fs = m.fragmentShader;
if (vs.indexOf('void main(){') < 0 || fs.indexOf('vec3 base = uColor;') < 0) { if (global.console) { console.warn('[prince] paper shader patch did not apply'); } }
vs = 'attribute vec3 aTint; varying vec3 vTint;\n' + (pinned ? 'attribute vec3 aRest;\n' : '') + vs.replace('void main(){', 'void main(){ vTint = aTint;');
if (pinned) { vs = vs.replace('vObjPos = position;', 'vObjPos = aRest;'); }
fs = 'varying vec3 vTint;\n' + fs.replace('vec3 base = uColor;', 'vec3 base = uColor * vTint;').replace('col += uTransColor * uSunColor', 'col += uTransColor * vTint * uSunColor');
m.vertexShader = vs; m.fragmentShader = fs;
return m;
}
function ratio(c, base, out) { return (out || new THREE.Color()).setRGB(c.r / base.r, c.g / base.g, c.b / base.b); }
var _tc = new THREE.Color();
function tmix(a, b, t) { return _tc.setRGB(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t); }
var SUITT = new THREE.Color(1, 1, 1), SLEEVET = new THREE.Color(1, 1, 1);
function makeMaterials(C) {
var DS = THREE.DoubleSide, kd = ratio(new THREE.Color(C.suitDark), new THREE.Color(C.suit));
SUITT.setRGB(1, 1, 1).lerp(kd, 0.5); SLEEVET.setRGB(1, 1, 1).lerp(kd, 0.28);
return {
skin:  paper({ color: C.skin, crumple: 0.12, crumpleScale: 6, translucency: 0.1, rim: 0.7 }),
face:  paper({ color: C.face, crumple: 0.10, crumpleScale: 6, translucency: 0.1, rim: 0.7 }),
ear:   paper({ color: C.ear, transColor: C.skin, crumple: 0.15, crumpleScale: 9, translucency: 0.45, rim: 0.6, side: DS }),
eye:   paper({ color: C.eye, crumple: 0, fiber: 0, rim: 0 }),
mouth: paper({ color: C.mouth, crumple: 0, fiber: 0, rim: 0 }),
hair:  paper({ color: C.hair, transColor: C.hair, crumple: 0.55, crumpleScale: 20, translucency: 0.55, rim: 0.7, side: DS }),
suit:  paper({ color: C.suit, transColor: C.suitGlow, crumple: 0.65, crumpleScale: 17, translucency: 0.14, rim: 0.6, side: DS }),
sleeve: paper({ color: C.suit, transColor: C.suitGlow, crumple: 0.7, crumpleScale: 16, translucency: 0.3, rim: 0.6, side: DS }),
sash:  paper({ color: C.sash, transColor: C.scarfGlow, crumple: 0.5, crumpleScale: 28, translucency: 0.35, rim: 0.5 }),
button: paper({ color: C.button, crumple: 0.1, crumpleScale: 40, translucency: 0, rim: 0.4 }),
scarf: paper({ color: C.scarf, transColor: C.scarfGlow, crumple: 0.85, crumpleScale: 14, translucency: 0.9, rim: 0.5, side: DS }),
tail:  paper({ color: C.scarf, transColor: C.scarfGlow, crumple: 0.85, crumpleScale: 14, translucency: 0.9, rim: 0.5, side: DS }, true),
shoe:  paper({ color: C.shoe, crumple: 0.6, crumpleScale: 24, translucency: 0.1, rim: 0.5 })
};
}
var HEAD = { top: 0.25, c: 0.125, rx: 0.1075, rz: 0.1125 };
function headR(y) {
if (y <= 0) { return 0; }
var t = y - HEAD.c;
if (t < 0) { t = -t / HEAD.c; return Math.pow(Math.max(0, 1 - Math.pow(t, 1.75)), 1 / 1.75) * (0.93 + 0.07 * sstep(0, 0.1, y)); }
t = Math.min(1, t / (HEAD.top - HEAD.c));
return Math.pow(Math.max(0, 1 - Math.pow(t, 2.1)), 1 / 2.1);
}
function headN(y) { return 2.0 + 0.5 * sstep(0.03, 0.11, y) * (1 - sstep(0.16, 0.25, y)); }
function headZc(y) { return -0.006 * sstep(0.08, 0.24, y) + 0.003 * (1 - sstep(0, 0.06, y)); }
function headPt(az, y, grow) {
var f = headR(y), e = 2 / headN(y);
return new V3((HEAD.rx * f + grow) * sgnPow(Math.sin(az), e), y, headZc(y) + (HEAD.rz * f + grow) * sgnPow(Math.cos(az), e));
}
function headNormal(p) {
return new V3(p.x / (HEAD.rx * HEAD.rx), (p.y - HEAD.c) * 0.55 / (HEAD.c * HEAD.c), (p.z - headZc(p.y)) / (HEAD.rz * HEAD.rz)).normalize();
}
function frontZ(x, y) {
var f = headR(y), n = headN(y), q = Math.min(1, Math.abs(x) / Math.max(HEAD.rx * f, 1e-4));
return headZc(y) + HEAD.rz * f * Math.pow(Math.max(0, 1 - Math.pow(q, n)), 1 / n);
}
function facePt(x, y, lift) {
var h = 0.0015, fx = (frontZ(x + h, y) - frontZ(x - h, y)) / (2 * h), fy = (frontZ(x, y + h) - frontZ(x, y - h)) / (2 * h);
var il = 1 / Math.sqrt(fx * fx + fy * fy + 1);
return [x - fx * il * lift, y - fy * il * lift, frontZ(x, y) + il * lift];
}
var PLATE = { cx: 0.044, cy: 0.125, ax: 0.0525, ay: 0.0575, h: 0.0042 };
function plateH(x, y) {
var u = (Math.abs(x) - PLATE.cx) / PLATE.ax, v = (y - PLATE.cy) / PLATE.ay, r2 = u * u + v * v;
return r2 >= 1 ? 0 : PLATE.h * Math.pow(1 - r2, 0.45) * (1 + 0.5 * sstep(0.1, -0.9, u));
}
function ovalOnFace(acc, cx, cy, ax, ay, lift, sgn, rings, spokes, xmin) {
acc.flip = sgn < 0;
acc.grid(rings, spokes, function (u, v) {
var ph = v * TAU, x = Math.max(xmin || 0, cx + ax * u * Math.cos(ph)), y = cy + ay * u * Math.sin(ph), p = facePt(x, y, lift(x, y));
return [sgn * p[0], p[1], p[2]];
});
acc.flip = false;
}
var noseH = curve([[0.052, 0], [0.063, 0.008], [0.075, 0.0185], [0.086, 0.0125], [0.098, 0.0065], [0.117, 0.0030], [0.145, 0.0010]]);
var noseW = curve([[0.050, 0.003], [0.063, 0.010], [0.075, 0.0125], [0.088, 0.0105], [0.107, 0.0078], [0.125, 0.0068], [0.145, 0.0058]]);
function earMesh(acc, sgn) {
var ew = [0.5 * sgn, 0, -0.87], ne = [0.87 * sgn, 0, 0.5];
acc.flip = sgn < 0;
acc.grid(8, 6, function (s, t) {
var u = mix(-0.024, 0.031, s), top = u > 0.002, q = (u - 0.002) / (top ? 0.029 : 0.026);
var wm = 0.027 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(q), top ? 1.25 : 2)), 0.8), w = t * wm, dish = 0.0055 * Math.sin(Math.PI * t) * (wm / 0.027);
return [sgn * 0.1035 + ew[0] * w + ne[0] * dish, 0.110 + u, 0.004 + ew[2] * w + ne[2] * dish];
});
acc.flip = false;
}
function headParts() {
var skin = new Acc(), face = new Acc(), eye = new Acc(), ear = new Acc(), mouth = new Acc(), k, K = 32, rings = [];
for (k = 0; k <= K; k++) {
var y = HEAD.top * (1 - Math.cos(Math.PI * k / K)) / 2, f = headR(y);
rings.push(k === 0 || k === K ? { y: y, cz: headZc(y), pole: true } : { y: y, rx: HEAD.rx * f, rz: HEAD.rz * f, cz: headZc(y), n: headN(y) });
}
loft(skin, rings, 48);
[1, -1].forEach(function (s) {
ovalOnFace(face, PLATE.cx, PLATE.cy, PLATE.ax, PLATE.ay, function (x, y) { return 0.0004 + plateH(x, y); }, s, 6, 30, 0.0004);
ovalOnFace(eye, 0.066, 0.112, 0.0150, 0.0200, function (x, y) { return 0.0004 + plateH(x, y) + 0.0006; }, s, 3, 20, 0);
earMesh(ear, s);
});
face.grid(14, 8, function (u, v) {
var y = mix(0.050, 0.145, u), w = noseW(y), x = (v * 2 - 1) * w, q = 1 - (x / w) * (x / w);
return facePt(x, y, 0.0004 + noseH(y) * Math.pow(Math.max(0, q), 0.7) + plateH(x, y));
}, true);
ovalOnFace(mouth, 0, 0.045, 0.011, 0.0028, function () { return 0.0007; }, 1, 2, 12, -1);
return { skin: skin, face: face, eye: eye, ear: ear, mouth: mouth };
}
var SWEEP = new V3(0.36, 0, -0.93).normalize();
var HAIR_PIVOTS = { hairCrown: [0, 0.24, -0.008], hairFront: [0, 0.20, 0.085], hairBack: [0, 0.17, -0.10], hairL: [0.098, 0.17, 0], hairR: [-0.098, 0.17, 0] };
function petal(acc, B, D, S, L, W, bend, crease, rnd, c0, c1) {
var O = new V3().crossVectors(D, S).normalize(), NU = 5, i, rows = [[], [], [], []], wob = 0.92 + rnd() * 0.16;
S = new V3().crossVectors(O, D).normalize();
function at(u, side, w, lift) {
var p = B.clone().addScaledVector(D, L * u).addScaledVector(O, bend * L * u * u + lift).addScaledVector(S, side * w);
return acc.v(p.x, p.y, p.z, tmix(c0, c1, Math.pow(u, 1.3)));
}
for (i = 0; i <= NU; i++) {
var u = i / NU, w = i === NU ? 0 : W * wob * Math.pow(Math.sin(Math.PI * Math.min(1, 0.22 + 0.78 * Math.pow(u, 0.8))), 0.6);
var jl = (rnd() - 0.5) * 0.26, jr = (rnd() - 0.5) * 0.26, ju = i > 0 && i < NU ? (rnd() - 0.5) * 0.05 : 0, cr = crease * w;
rows[0].push(at(Math.max(0, u + ju), -1, w * (1 + jl), 0));
rows[1].push(at(u, -0.001, 0, cr)); rows[2].push(at(u, 0.001, 0, cr));
rows[3].push(at(Math.min(1, u - ju), 1, w * (1 + jr), 0));
}
for (i = 0; i < NU; i++) {
acc.quad(rows[0][i], rows[0][i + 1], rows[1][i + 1], rows[1][i]);
acc.quad(rows[2][i], rows[2][i + 1], rows[3][i + 1], rows[3][i]);
}
}
var capLo = curve([[0, 0.20], [40, 0.20], [80, 0.152], [110, 0.152], [150, 0.07], [180, 0.055]]);
function hairCap(acc, C) {
var deep = ratio(new THREE.Color(C.hairDeep), new THREE.Color(C.hair)).multiplyScalar(0.92);
acc.grid(8, 48, function (u, v) {
var az = v * TAU, d = v < 0.5 ? v * 360 : (1 - v) * 360, p = headPt(az, mix(capLo(d), 0.2495, u), 0.0016);
return [p.x, p.y, p.z, deep];
}, true);
}
function hairParts(C) {
var rnd = HS.rng(7311), base = new THREE.Color(C.hair), deep = ratio(new THREE.Color(C.hairDeep), base), lite = ratio(new THREE.Color(C.hairLight), base);
var cl = {}, name, rad = Math.PI / 180;
for (name in HAIR_PIVOTS) {
var a = new Acc(), p = HAIR_PIVOTS[name]; a.tf = new THREE.Matrix4().makeTranslation(-p[0], -p[1], -p[2]); cl[name] = a;
}
function pick(ring, az) {
if (ring === 'crown' || ring === 'r9') { return cl.hairCrown; }
if (ring === 'ribbon') { return cl.hairFront; }
var d = ((az / rad) % 360 + 540) % 360 - 180;
return Math.abs(d) < 55 ? cl.hairFront : Math.abs(d) >= 125 ? cl.hairBack : d > 0 ? cl.hairL : cl.hairR;
}
function add(ring, azDeg, y, leanDeg, L, W, bend, k, dark) {
var az = azDeg * rad, ln = leanDeg * rad, B = headPt(az, y, -0.004), Nn = headNormal(B), up = new V3(0, 1, 0);
var Tup = up.clone().addScaledVector(Nn, -up.dot(Nn));
if (Tup.lengthSq() < 1e-4) { Tup.set(-Math.sin(az), 0.3, -Math.cos(az)); }
Tup.normalize();
var D = Tup.clone().multiplyScalar(Math.cos(ln)).addScaledVector(Nn, Math.sin(ln)).addScaledVector(SWEEP, k).normalize();
var S = new V3().crossVectors(Nn, Tup).normalize(), O = new V3().crossVectors(D, S).normalize(), tw = (rnd() - 0.5) * 0.3;
S.multiplyScalar(Math.cos(tw)).addScaledVector(O, Math.sin(tw));
var c0 = deep.clone().lerp(lite, dark), c1 = lite.clone().multiplyScalar(0.94 + rnd() * 0.08);
petal(pick(ring, az), B, D, S, L * (0.94 + rnd() * 0.12), W, bend, 0.22, rnd, c0, c1);
}
var i, fr;
for (i = 0; i < 6; i++) { add('crown', i * 60 + 10 + (rnd() - 0.5) * 12, 0.238, 24 + rnd() * 12, 0.084, 0.027, 0.10, 0.62, 0.5); }
for (i = 0; i < 8; i++) { add('r9', i * 45 + 5, 0.214, 30 + rnd() * 8, 0.096, 0.047, 0.14, 0.52, 0.4); }
for (i = 0; i < 10; i++) {
var az = i * 36 + 14; fr = Math.max(0, Math.cos(az * rad)); fr *= fr;
add('r11', az, 0.166 + 0.032 * fr, 26 + rnd() * 8, 0.104, 0.047, 0.16, 0.44, 0.25);
}
for (i = 0; i < 7; i++) {
var az2 = 80 + i * 33, bk = Math.max(0, -Math.cos(az2 * rad));
add('fringe', az2, 0.140 - 0.03 * bk, 16 + rnd() * 8, 0.080, 0.040, 0.12, 0.40, 0.1);
}
for (i = 0; i < 8; i++) { add('nape', 108 + i * 20.5, 0.060 + 0.036 * (i % 2), 22 + rnd() * 8, 0.080, 0.034, 0.10, 0.34, 0.05); }
[[-50, 0.196, 0.140, 0.027], [-42, 0.214, 0.132, 0.025], [-32, 0.232, 0.124, 0.023]].forEach(function (r, ix) {
var az = r[0] * rad, B = headPt(az, r[1], 0.001 + ix * 0.004), out = new V3(Math.sin(az), 0, Math.cos(az)), T = new V3(Math.cos(az), 0, -Math.sin(az));
var D = T.clone().multiplyScalar(0.95).addScaledVector(new V3(0, 1, 0), 0.38).addScaledVector(out, 0.12).normalize();
var S = new V3().crossVectors(out, D).normalize();
petal(cl.hairFront, B, D, S, r[2], r[3], -0.55, 0.2, rnd, deep.clone().lerp(lite, 0.3), lite.clone().multiplyScalar(1.02));
});
return cl;
}
var JY = { hips: 0.47, spine: 0.58, chest: 0.71, neck: 0.83, head: 0.90 };
var bodyRx = curve([[0.385, 0.040], [0.405, 0.066], [0.43, 0.088], [0.47, 0.106], [0.50, 0.110], [0.54, 0.103], [0.58, 0.096], [0.62, 0.097], [0.66, 0.101], [0.70, 0.104], [0.75, 0.105], [0.79, 0.106], [0.812, 0.101], [0.826, 0.082], [0.834, 0.052], [0.840, 0.034]]);
var bodyRz = curve([[0.385, 0.034], [0.405, 0.044], [0.43, 0.053], [0.47, 0.062], [0.50, 0.068], [0.54, 0.071], [0.58, 0.071], [0.62, 0.070], [0.66, 0.070], [0.70, 0.071], [0.75, 0.071], [0.79, 0.070], [0.812, 0.066], [0.826, 0.056], [0.834, 0.042], [0.840, 0.030]]);
function bodyPiece(acc, y0, y1, jy, shrinkTo, poleBelow, poleAbove) {
var rings = [], N = Math.max(3, Math.round((y1 - y0) / 0.013)), k;
if (poleBelow) { rings.push({ y: poleBelow - jy, pole: true }); }
for (k = 0; k <= N; k++) {
var y = mix(y0, y1, k / N), s = y < shrinkTo ? 0.985 : 1;
rings.push({ y: y - jy, rx: bodyRx(y) * s, rz: bodyRz(y) * s, n: 2.7, tint: SUITT });
}
if (poleAbove) { rings.push({ y: poleAbove - jy, pole: true }); }
loft(acc, rings, 40);
}
function sashMesh(acc) {
var rings = [], N = 10, k;
for (k = 0; k <= N; k++) {
var v = k / N, edge = 1 - Math.pow(Math.abs(v * 2 - 1), 3), th = (k % 2 ? 0.93 : 1.05) * (0.9 + 0.1 * edge);
rings.push({ y: 0.581 + (v - 0.5) * 0.046 - JY.spine, rx: 0.1045 + 0.0035 * edge, rz: 0.0775 + 0.003 * edge, n: 2.6, tint: th });
}
loft(acc, rings, 44);
}
function buttonMeshes(accChest, accSpine) {
[[0.796, accChest, JY.chest], [0.720, accChest, JY.chest], [0.644, accSpine, JY.spine]].forEach(function (b) {
blob(b[1], [0, b[0] - b[2], bodyRz(b[0]) + 0.0012], [0.009, 0.009, 0.0036], 14, 6);
});
}
function neckMesh(acc) { loft(acc, [{ y: -0.035, r: 0.0315 }, { y: 0.0, r: 0.0315 }, { y: 0.052, r: 0.029 }], 20); }
function wrapBand(acc, o) {
var N = o.N, M = 10, k, m, rows = [], K = o.closed ? N : N + 1;
for (k = 0; k < K; k++) {
var s = k / N, az = o.az0 + o.turns * TAU * s, er = new V3(Math.sin(az), 0, Math.cos(az)), row = [];
var tp = o.closed ? 1 : sstep(0, 0.08, s) * (0.6 + 0.4 * (1 - sstep(0.92, 1, s)));
var R = mix(o.r0, o.r1, s) + 0.002 * Math.sin(az * 3 + o.seed), yc = mix(o.y0, o.y1, s) + 0.0035 * Math.sin(az * 2 + o.seed * 0.7);
for (m = 0; m < M; m++) {
var th = TAU * m / M, nz = HS.noise2(k * 0.42 + o.seed, m * 0.83 + 7.7 + o.seed), pk = 1 + 0.2 * Math.sin(az * 5.3 + m * 1.9 + o.seed) + (nz - 0.5) * 0.5;
var rr = o.th * pk * tp, hh = o.hh * (0.86 + 0.28 * nz) * tp, tint = o.tint * (0.78 + 0.26 * (0.5 + 0.5 * Math.cos(th - 0.9)) + (nz - 0.5) * 0.12);
row.push(acc.v(er.x * (R + rr * Math.cos(th)), yc + hh * Math.sin(th), er.z * (R + rr * Math.cos(th)), tint));
}
rows.push(row);
}
for (k = 0; k < N; k++) { for (m = 0; m < M; m++) { var m1 = (m + 1) % M; acc.quad(rows[k][m], rows[(k + 1) % K][m], rows[(k + 1) % K][m1], rows[k][m1]); } }
}
function scarfWrap(acc) {
wrapBand(acc, { N: 56, closed: true, turns: 1, az0: 0.4, r0: 0.0765, r1: 0.0765, y0: 0.0275, y1: 0.0275, th: 0.0170, hh: 0.0275, seed: 3.1, tint: 0.92 });
wrapBand(acc, { N: 84, closed: false, turns: 1.5, az0: 160 * Math.PI / 180 - 1.5 * TAU, r0: 0.0775, r1: 0.0785, y0: 0.0345, y1: 0.0545, th: 0.0155, hh: 0.0265, seed: 7.7, tint: 1.0 });
}
function angDist(a, b) { var d = (a - b) % TAU; if (d > Math.PI) { d -= TAU; } if (d < -Math.PI) { d += TAU; } return d; }
function sleeveUpper(acc) {
loft(acc, [{ y: 0.012, pole: true }, { y: 0.009, r: 0.0230 }, { y: 0.004, r: 0.0325 }, { y: 0.0, r: 0.0352 }, { y: -0.04, r: 0.0375 }, { y: -0.085, r: 0.0405 },
{ y: -0.13, r: 0.0435 }, { y: -0.168, r: 0.0455 }].map(function (r) { r.tint = SLEEVET; r.mod = function (a) { return 1 + 0.025 * Math.sin(3 * a + 1.1) + 0.012 * Math.sin(7 * a); }; return r; }), 24);
}
var bellR = curve([[-0.170, 0.0745], [-0.140, 0.0685], [-0.100, 0.0605], [-0.060, 0.0530], [-0.030, 0.0480], [0.0, 0.0437], [0.010, 0.0425]]);
function sleeveBell(acc, seed) {
var ys = [-0.170, -0.158, -0.140, -0.120, -0.100, -0.080, -0.060, -0.040, -0.020, 0.0, 0.010], ph = seed * 1.7;
[false, true].forEach(function (inner) {
var rings = ys.map(function (y) {
var fl = sstep(-0.005, -0.17, y), edge = sstep(-0.12, -0.17, y);
return {
y: y, r: bellR(y) - (inner ? 0.0016 : 0), tint: inner ? 0.7 : SLEEVET,
mod: function (a) { return 1 + 0.115 * fl * (0.5 - Math.abs(Math.sin(3.5 * a + ph + 0.35 * Math.sin(2 * a)))); },
dy: function (a) { return edge * edge * (0.010 * Math.sin(4 * a + ph) + 0.005 * Math.sin(7 * a + 2.1 + ph)); }
};
});
acc.flip = inner; loft(acc, rings, 42); acc.flip = false;
});
}
function handMesh(acc, sgn) {
loft(acc, [{ y: -0.0525, cz: 0.0045, pole: true }, { y: -0.050, cz: 0.0042, rx: 0.0052, rz: 0.0042 }, { y: -0.043, cz: 0.0036, rx: 0.0118, rz: 0.0070 },
{ y: -0.030, cz: 0.0026, rx: 0.0152, rz: 0.0085 }, { y: -0.015, cz: 0.0012, rx: 0.0145, rz: 0.0088 }, { y: 0.0, rx: 0.0125, rz: 0.0082 },
{ y: 0.013, rx: 0.0105, rz: 0.0075 }, { y: 0.033, rx: 0.0095, rz: 0.0070 }], 16);
blob(acc, [-sgn * 0.0125, -0.0165, 0.0035], [0.0058, 0.0145, 0.0058], 10, 6);
}
var thighR = curve([[-0.185, 0.052], [-0.14, 0.0565], [-0.09, 0.0600], [-0.04, 0.0590], [0.0, 0.0565], [0.03, 0.055], [0.07, 0.052]]);
var shinR = curve([[-0.17, 0.030], [-0.15, 0.036], [-0.12, 0.0425], [-0.08, 0.046], [-0.04, 0.049], [0.0, 0.052], [0.05, 0.0505]]);
function foldMod(folds, amp, win) {
return function (a, y) {
var f = 1 + 0.018 * Math.sin(3 * a + 0.7), w = win(y), i;
for (i = 0; i < folds.length; i++) { var d = angDist(a, folds[i]) / 0.17; f -= amp * w * Math.exp(-d * d); }
return f;
};
}
function thighMesh(acc, sgn) {
var rings = [], ys = [-0.185, -0.162, -0.138, -0.114, -0.09, -0.066, -0.042, -0.018, 0.006, 0.03, 0.05, 0.07], i;
var fm = foldMod([0.15 * sgn, 1.75 * sgn, -1.9 * sgn], 0.085, function (y) { return sstep(-0.19, -0.13, y) * (1 - sstep(0.0, 0.07, y)); });
var cap = [0.4, 0.8, 1.15, 1.42];
for (i = ys.length - 1; i >= 0; i--) { (function (y) { rings.push({ y: y, rx: thighR(y), rz: thighR(y) * 1.16, tint: SUITT, mod: function (a) { return fm(a, y); } }); })(ys[i]); }
rings.reverse();
var capRings = cap.map(function (p) { return { y: -0.185 - 0.04 * Math.sin(p), rx: 0.052 * Math.cos(p), rz: 0.052 * 1.16 * Math.cos(p), tint: SUITT }; }).reverse();
rings = [{ y: -0.2255, pole: true }].concat(capRings, rings);
loft(acc, rings, 36);
}
function shinMesh(acc, sgn) {
var ys = [-0.18, -0.17, -0.15, -0.13, -0.11, -0.09, -0.07, -0.05, -0.03, -0.01, 0.01, 0.03, 0.05];
var fm = foldMod([-0.1 * sgn, 1.55 * sgn, -2.0 * sgn], 0.06, function (y) { return sstep(-0.16, -0.1, y) * (1 - sstep(-0.01, 0.04, y)); });
var rings = ys.map(function (y) { var rr = y < -0.172 ? 0.0345 + (y + 0.18) * 0.3 : shinR(y); return { y: y, rx: rr, rz: rr * (1 + 0.16 * sstep(-0.16, -0.07, y)), tint: SUITT, mod: function (a) { return fm(a, y); } }; });
loft(acc, rings.concat([{ y: 0.058, pole: true }]), 32);
}
function ankleMesh(acc) { loft(acc, [{ y: -0.052, r: 0.0100 }, { y: -0.03, r: 0.0105 }, { y: 0.03, r: 0.0100 }], 12); }
function shoeMesh(acc) {
var t = [[-0.036, 0, 0, 0.016], [-0.034, 0.012, 0.0135, 0.0165], [-0.026, 0.0195, 0.0185, 0.0185], [-0.010, 0.0215, 0.0195, 0.0195], [0.010, 0.0225, 0.0165, 0.0165],
[0.030, 0.0195, 0.0120, 0.0125], [0.048, 0.0120, 0.0085, 0.0105], [0.060, 0.0050, 0.0050, 0.0110], [0.066, 0, 0, 0.0125]];
acc.tf = new THREE.Matrix4().makeTranslation(0, -0.075, 0).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
loft(acc, t.map(function (r, i) {
return i === 0 || i === t.length - 1 ? { y: r[0], cz: -r[3], pole: true, tint: 1 }
: { y: r[0], rx: r[1], rz: r[2], cz: -r[3], n: 2.5, tint: function (a) { return 1 - 0.38 * sstep(0.35, 0.62, Math.cos(a)); } };
}), 20);
acc.tf = null;
}
var TAIL = { len: 0.55, segments: 8, NU: 28, NV: 10, roll: 0.30, forkStart: 0.78, tipHi: 1.0, tipLo: 0.935, apexV: -0.15 };
var tailW = curve([[0, 0.085], [0.25, 0.109], [0.6, 0.150], [0.8, 0.146], [1.0, 0.116]]);
function tailEnd(v) {
var a = TAIL.apexV;
return v >= a ? mix(TAIL.forkStart, TAIL.tipHi, Math.pow((v - a) / (1 - a), 0.85)) : mix(TAIL.forkStart, TAIL.tipLo, Math.pow((a - v) / (1 + a), 0.85));
}
function buildTail(scene, mat, C) {
var NU = TAIL.NU, NV = TAIL.NV, cnt = (NU + 1) * (NV + 1), i, j, k;
var pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3), rest = new Float32Array(cnt * 3), tint = new Float32Array(cnt * 3), idx = [];
var base = new THREE.Color(C.scarf), deep = ratio(new THREE.Color(C.scarfDeep), base), S_ = [], V_ = [], W_ = [];
for (i = 0; i <= NU; i++) {
for (j = 0; j <= NV; j++) {
k = i * (NV + 1) + j;
var v = j / NV * 2 - 1, s = i / NU * tailEnd(v), sv = clamp01((s * (TAIL.segments + 1) - 1) / TAIL.segments), hw = tailW(sv) * 0.5, e = Math.abs(v);
var t = Math.max(0, 0.7 * sstep(0.45, 1, sv) + 0.28 * sstep(0.55, 1, e) * sstep(0.2, 0.7, sv));
S_.push(s); V_.push(v); W_.push(sv);
rest[k * 3] = sv * TAIL.len; rest[k * 3 + 1] = v * hw; rest[k * 3 + 2] = 0;
tint[k * 3] = 1 + (deep.r - 1) * t; tint[k * 3 + 1] = 1 + (deep.g - 1) * t; tint[k * 3 + 2] = 1 + (deep.b - 1) * t;
if (i < NU && j < NV) { idx.push(k, k + NV + 1, k + NV + 2, k, k + NV + 2, k + 1); }
}
}
var g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
g.setAttribute('aRest', new THREE.BufferAttribute(rest, 3)); g.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));
g.setIndex(idx);
var mesh = new THREE.Mesh(g, mat); mesh.name = 'scarfTail'; mesh.frustumCulled = false; scene.add(mesh);
var P = [], pre = new V3(), c = new V3(), T = new V3(), q = new V3(), ref = new V3(), S0 = new V3(), N0 = new V3(), tmp = new V3();
function cr(f, a, b, cc, d, out, deriv) {
var f2 = f * f, f3 = f2 * f;
var w0, w1, w2, w3;
if (deriv) { w0 = -0.5 + 2 * f - 1.5 * f2; w1 = -5 * f + 4.5 * f2; w2 = 0.5 + 4 * f - 4.5 * f2; w3 = -f + 1.5 * f2; }
else { w0 = 0.5 * (-f3 + 2 * f2 - f); w1 = 0.5 * (3 * f3 - 5 * f2 + 2); w2 = 0.5 * (-3 * f3 + 4 * f2 + f); w3 = 0.5 * (f3 - f2); }
return out.set(a.x * w0 + b.x * w1 + cc.x * w2 + d.x * w3, a.y * w0 + b.y * w1 + cc.y * w2 + d.y * w3, a.z * w0 + b.z * w1 + cc.z * w2 + d.z * w3);
}
function sample(s, outP, outT) {
var n = P.length - 1, x = clamp01(s) * n, seg = Math.min(n - 1, Math.floor(x)), f = x - seg;
var p0 = P[Math.max(0, seg - 1)], p1 = P[seg], p2 = P[seg + 1], p3 = P[Math.min(n, seg + 2)];
cr(f, p0, p1, p2, p3, outP, false); cr(f, p0, p1, p2, p3, outT, true);
}
function update(points, opt, origin) {
opt = opt || {};
var roll0 = opt.roll != null ? opt.roll : TAIL.roll, twist = opt.twist != null ? opt.twist : 0.85, ruf = opt.ruffle != null ? opt.ruffle : 1;
pre.copy(origin ? tmp.subVectors(origin, points[0]).multiplyScalar(0.5) : tmp.subVectors(points[1], points[0]).multiplyScalar(-0.5)).add(points[0]);
P.length = 0; P.push(pre); for (k = 0; k < points.length; k++) { P.push(points[k]); }
for (i = 0; i <= NU; i++) {
for (j = 0; j <= NV; j++) {
k = i * (NV + 1) + j;
var s = S_[k], v = V_[k], hw = tailW(W_[k]) * 0.5;
sample(s, c, T);
if (T.lengthSq() < 1e-10) { T.set(1, 0, 0); }
T.normalize();
ref.set(0, 1, 0);
S0.copy(ref).addScaledVector(T, -ref.dot(T));
if (S0.lengthSq() < 1e-4) { S0.set(0, 0, 1); S0.addScaledVector(T, -S0.dot(T)); }
S0.normalize(); N0.crossVectors(T, S0);
var r = roll0 + twist * s * Math.sin(2.3 * s + 0.6), cs = Math.cos(r), sn = Math.sin(r);
var wob = ruf * (0.006 * Math.sin(s * 19 + v * 3.1) * s + 0.004 * Math.sin(s * 41 + v * 7.0) * Math.abs(v) * s);
q.set(0, 0, 0).addScaledVector(S0, cs * v * hw).addScaledVector(N0, -sn * v * hw);
tmp.set(0, 0, 0).addScaledVector(N0, cs * wob).addScaledVector(S0, sn * wob);
pos[k * 3] = c.x + q.x + tmp.x; pos[k * 3 + 1] = c.y + q.y + tmp.y; pos[k * 3 + 2] = c.z + q.z + tmp.z;
}
}
for (i = 0; i <= NU; i++) {
for (j = 0; j <= NV; j++) {
var i0 = Math.max(0, i - 1), i1 = Math.min(NU, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(NV, j + 1);
var a = (i1 * (NV + 1) + j) * 3, b = (i0 * (NV + 1) + j) * 3, cc2 = (i * (NV + 1) + j1) * 3, d = (i * (NV + 1) + j0) * 3;
var ux = pos[a] - pos[b], uy = pos[a + 1] - pos[b + 1], uz = pos[a + 2] - pos[b + 2], wx = pos[cc2] - pos[d], wy = pos[cc2 + 1] - pos[d + 1], wz = pos[cc2 + 2] - pos[d + 2];
var nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx, l = Math.sqrt(nx * nx + ny * ny + nz * nz);
k = (i * (NV + 1) + j) * 3; if (l < 1e-12) { nx = 0; ny = 0; nz = 1; l = 1; } nor[k] = nx / l; nor[k + 1] = ny / l; nor[k + 2] = nz / l;
}
}
g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
}
return { mesh: mesh, update: update };
}
function windTailPoints(anchor, wind, phase, reach) {
var pts = [], n = TAIL.segments, w = new V3(wind.x, 0, wind.y).normalize(), side = new V3(-w.z, 0, w.x), i;
for (i = 0; i <= n; i++) {
var s = i / n, e = Math.pow(s, 0.9);
pts.push(anchor.clone().addScaledVector(w, reach * e).addScaledVector(side, 0.04 * Math.sin(s * 5.2 + phase) * s)
.add(new V3(0, 0.035 * Math.sin(s * 4.4 + phase + 0.8) * s + 0.045 * s - 0.095 * s * s, 0)));
}
return pts;
}
function buildPrince(ctx) {
var C = HS.PRINCE_COLORS, M = makeMaterials(C), root = new THREE.Group(), joints = { root: root }, geos = [];
root.name = 'prince';
function joint(name, parent, x, y, z, rx, ry, rz) {
var g = new THREE.Group(); g.name = name; g.position.set(x, y, z);
g.userData.rest = { x: rx || 0, y: ry || 0, z: rz || 0 };
g.rotation.set(g.userData.rest.x, g.userData.rest.y, g.userData.rest.z);
parent.add(g); joints[name] = g; return g;
}
function put(parent, acc, mat, name) { var m = new THREE.Mesh(acc.build(), mat); m.name = name; geos.push(m.geometry); parent.add(m); return m; }
var hips = joint('hips', root, 0, 0.47, 0), spine = joint('spine', hips, 0, 0.11, 0), chest = joint('chest', spine, 0, 0.13, 0);
var neck = joint('neck', chest, 0, 0.12, 0), head = joint('head', neck, 0, 0.07, 0);
var scarfAnchor = joint('scarfAnchor', chest, 0.03, 0.16, -0.085);
var shL = joint('shoulderL', chest, 0.105, 0.105, 0, 0, 0, 0.17), elL = joint('elbowL', shL, 0, -0.165, 0), wrL = joint('wristL', elL, 0, -0.165, 0);
var shR = joint('shoulderR', chest, -0.105, 0.105, 0, 0, 0, -0.17), elR = joint('elbowR', shR, 0, -0.165, 0), wrR = joint('wristR', elR, 0, -0.165, 0);
var hpL = joint('hipL', hips, 0.055, -0.02, 0), knL = joint('kneeL', hpL, 0, -0.185, 0), anL = joint('ankleL', knL, 0, -0.19, 0, 0, 0.2, 0);
var hpR = joint('hipR', hips, -0.055, -0.02, 0), knR = joint('kneeR', hpR, 0, -0.185, 0), anR = joint('ankleR', knR, 0, -0.19, 0, 0, -0.2, 0);
var a = new Acc(); bodyPiece(a, 0.385, 0.590, JY.hips, 0, 0.376, 0); put(hips, a, M.suit, 'pelvis');
a = new Acc(); bodyPiece(a, 0.572, 0.705, JY.spine, 0.590, 0, 0); put(spine, a, M.suit, 'waist');
a = new Acc(); sashMesh(a); put(spine, a, M.sash, 'sash');
a = new Acc(); bodyPiece(a, 0.695, 0.836, JY.chest, 0.705, 0, 0.843); put(chest, a, M.suit, 'chest');
var bc = new Acc(), bs = new Acc(); buttonMeshes(bc, bs); put(chest, bc, M.button, 'buttonsChest'); put(spine, bs, M.button, 'buttonsWaist');
a = new Acc(); neckMesh(a); put(neck, a, M.skin, 'neck');
a = new Acc(); scarfWrap(a, C); put(neck, a, M.scarf, 'scarfWrap');
var hp = headParts();
a = new Acc(); hairCap(a, C); put(head, a, M.hair, 'hairCap');
put(head, hp.skin, M.skin, 'skull'); put(head, hp.face, M.face, 'facePlates'); put(head, hp.eye, M.eye, 'eyes'); put(head, hp.ear, M.ear, 'ears'); put(head, hp.mouth, M.mouth, 'mouth');
var hc = hairParts(C), hair = [];
['hairCrown', 'hairFront', 'hairBack', 'hairL', 'hairR'].forEach(function (n) {
var p = HAIR_PIVOTS[n], g = joint(n, head, p[0], p[1], p[2]); put(g, hc[n], M.hair, n + 'Mesh'); hair.push(g);
});
[[shL, elL, wrL, 1], [shR, elR, wrR, -1]].forEach(function (arm) {
var s = arm[3], q = new Acc(); sleeveUpper(q); put(arm[0], q, M.sleeve, 'sleeveUpper' + (s > 0 ? 'L' : 'R'));
q = new Acc(); sleeveBell(q, s > 0 ? 1.3 : 3.1); put(arm[1], q, M.sleeve, 'sleeveBell' + (s > 0 ? 'L' : 'R'));
q = new Acc(); handMesh(q, s); put(arm[2], q, M.skin, 'hand' + (s > 0 ? 'L' : 'R'));
});
[[hpL, knL, anL, 1], [hpR, knR, anR, -1]].forEach(function (leg) {
var s = leg[3], q = new Acc(), n = s > 0 ? 'L' : 'R'; thighMesh(q, s); put(leg[0], q, M.suit, 'thigh' + n);
q = new Acc(); shinMesh(q, s); put(leg[1], q, M.suit, 'shin' + n);
q = new Acc(); ankleMesh(q); put(leg[2], q, M.skin, 'ankle' + n);
q = new Acc(); shoeMesh(q); put(leg[2], q, M.shoe, 'shoe' + n);
});
var tail = buildTail(ctx.scene, M.tail, C), _o = new V3();
var model = {
root: root, joints: joints, hair: hair,
dims: {
height: 1.15, hairTop: 1.21, chinY: 0.90, neckY: 0.83, shoulderY: 0.815, sashY: 0.581, hipJointY: 0.45, kneeY: 0.265, ankleY: 0.075, soleY: 0,
headWidth: 0.215, headDepth: 0.225, headHeight: 0.25, shoulderHalfWidth: 0.105, hipHalfWidth: 0.055,
upperArm: 0.165, foreArm: 0.165, thigh: 0.185, shin: 0.19, handLength: 0.085, footLength: 0.10, scarfLength: TAIL.len, scarfWidth0: 0.085, scarfWidthMax: 0.15
},
scarf: { mesh: tail.mesh, segments: TAIL.segments, length: TAIL.len, anchor: scarfAnchor },
setScarfTail: function (pointsWorld, opt) { neck.getWorldPosition(_o); _o.y += 0.04; tail.update(pointsWorld, opt, _o); },
materials: M,
dispose: function () {
geos.forEach(function (g) { g.dispose(); }); tail.mesh.geometry.dispose();
for (var k in M) { M[k].dispose(); }
if (tail.mesh.parent) { tail.mesh.parent.remove(tail.mesh); }
}
};
return model;
}
var DEG = Math.PI / 180, NO_OPTS = {}, ZERO3 = [0, 0, 0];
var RIG = {
ik: {
reach: 0.98,
maxBend: 2.35,
poleFoot: 0.5,
alignNear: 0.012, alignFar: 0.10,
alignMax: 0.47
},
look: {
yaw: 65 * DEG, pitch: 25 * DEG,
neck: 0.35, head: 0.65,
fadeFrom: 105 * DEG, fadeTo: 175 * DEG,
eye: [0, 0.115, 0.07]
},
scarf: {
sub: 4, iter: 5, warm: 4,
wind: 2.5,
gustGain: 0.6, updraft: 0.10,
carry: 1.0, carryTime: 0.25, vAnchor: 6,
dragN: 5.0, gravity: 1.75,
maxDroop: 55 * DEG,
waveDeg: 20, waveSide: 0.45,
wavePeriod: 0.95, waveSpeed: 0.55, waveRoot: 0.12, wander: 0.7,
turbDeg: 4, turbRate: 0.8,
follow: 2.3, tipSoft: 0.7, zeta: 0.5,
bend: 350,
vmax: 10,
groundClear: 0.04,
headC: [0, 0.128, -0.004], headR: 0.128,
neckC: 0.035, neckR: 0.105,
torsoY0: -0.26, torsoY1: 0.10, torsoCap: 0.07, torsoRx: 0.118, torsoRz: 0.085,
roll: 0.5, twist: 0.85, ruffle0: 0.6, ruffle1: 0.8
},
sec: {
scale: 1,
sub: 4, lagFrames: 2, vRef: 3.0,
windBase: 0.30, windGust: 0.90,
table: [
['hairCrown', 'hair', 1, 7.0, 2.6, 0.28, 1.0, 1.0, 0.55, 1.0],
['hairFront', 'hair', 1, 6.0, 2.9, 0.30, 1.0, 1.0, 0.50, 1.0],
['hairBack',  'hair', 1, 7.0, 2.3, 0.28, 1.0, 1.0, 0.55, 1.0],
['hairL',     'hair', 1, 6.0, 2.7, 0.30, 1.0, 1.0, 0.50, 1.0],
['hairR',     'hair', 1, 6.0, 2.7, 0.30, 1.0, 1.0, 0.50, 1.0],
['elbowL',    'sway', -1, 3.5, 1.7, 0.40, 1.0, 1.0, 0.60, 0],
['elbowR',    'sway', -1, 3.5, 1.6, 0.40, 1.0, 1.0, 0.60, 0],
['kneeL',     'sway', -1, 1.5, 2.0, 0.45, 0.8, 1.0, 0.50, 0],
['kneeR',     'sway', -1, 1.5, 1.9, 0.45, 0.8, 1.0, 0.50, 0]
],
swayMesh: { elbowL: 'sleeveBellL', elbowR: 'sleeveBellR', kneeL: 'shinL', kneeR: 'shinR' }
}
};
function softLimit(x, lim) {
var a = x < 0 ? -x : x, k = lim * 0.7;
if (a <= k) { return x; }
var r = k + (lim - k) * (1 - Math.exp(-(a - k) / (lim - k)));
return x < 0 ? -r : r;
}
function nz(x, y) { return (HS.noise2(x, y) - 0.5) * 2; }
function createScarfSim(model, J, S) {
var N = model.scarf.segments + 1, SEG = model.scarf.length / model.scarf.segments, SUB = S.sub, IT = S.iter, TWO_PI = Math.PI * 2, U = HS.U;
var px = new Float64Array(N), py = new Float64Array(N), pz = new Float64Array(N);
var vx = new Float64Array(N), vy = new Float64Array(N), vz = new Float64Array(N);
var qx = new Float64Array(N), qy = new Float64Array(N), qz = new Float64Array(N);
var gx = new Float64Array(N), gy = new Float64Array(N), gz = new Float64Array(N);
var tbE = new Float64Array(N), tbA = new Float64Array(N);
var out = [], i;
for (i = 0; i < N; i++) { out.push(new V3()); }
var opt = { roll: S.roll, twist: S.twist, ruffle: 1 };
var aP = new V3(), aN = new V3(), hP = new V3(), hN = new V3(), nP = new V3(), nN = new V3(), cP = new V3(), cN = new V3();
var ex = new V3(), ey = new V3(), ez = new V3();
var wd = new V3(), va = new V3();
var env = { gust: 0, air: 0, spd: 0, ratio: 1, calm: 1, hx: 1, hz: 0, del0: 0, amp: 0, period: 0.9, kappa: 0, phase: 0, wander: 0 };
var chx = 0, chy = 0, chz = 0, cnx = 0, cny = 0, cnz = 0, ccx = 0, ccy = 0, ccz = 0;
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
var anchorLocal = new V3().subVectors(J.scarfAnchor.position, J.neck.position);
function read() {
aN.copy(anchorLocal).applyMatrix4(J.neck.matrixWorld);
var e = J.head.matrixWorld.elements;
hN.set(e[12] + e[4] * S.headC[1] + e[8] * S.headC[2], e[13] + e[5] * S.headC[1] + e[9] * S.headC[2], e[14] + e[6] * S.headC[1] + e[10] * S.headC[2]);
e = J.neck.matrixWorld.elements; nN.set(e[12] + e[4] * S.neckC, e[13] + e[5] * S.neckC, e[14] + e[6] * S.neckC);
e = J.chest.matrixWorld.elements; cN.set(e[12], e[13], e[14]); ex.set(e[0], e[1], e[2]); ey.set(e[4], e[5], e[6]); ez.set(e[8], e[9], e[10]);
}
function environment(t, dt, advance) {
var w = U.uWindDir.value, l = Math.sqrt(w.x * w.x + w.y * w.y), str = U.uWindStrength.value, j;
if (l < 1e-6) { wd.set(1, 0, 0); } else { wd.set(w.x / l, 0, w.y / l); }
env.gust = HS.gustAt(px[N - 1], pz[N - 1], t);
env.air = S.wind * (str + S.gustGain * env.gust);
var ux = wd.x * env.air - va.x * S.carry, uz = wd.z * env.air - va.z * S.carry, uy = S.updraft * env.air * env.gust - va.y * 0.3 * S.carry;
var hs = Math.sqrt(ux * ux + uz * uz), wg = sstep(0.15, 0.7, hs), hx = wd.x, hz = wd.z;
if (hs > 1e-6) { hx = (ux / hs) * wg + wd.x * (1 - wg); hz = (uz / hs) * wg + wd.z * (1 - wg); l = Math.sqrt(hx * hx + hz * hz) || 1; hx /= l; hz /= l; }
env.hx = hx; env.hz = hz;
env.spd = Math.sqrt(hs * hs + uy * uy); env.ratio = env.spd / S.wind;
var del = Math.atan2(uy - S.gravity / S.dragN, Math.max(hs, 1e-3));
env.del0 = del < 0 ? -softLimit(-del, S.maxDroop) : del;
env.calm = sstep(0.05, 0.5, env.ratio);
env.amp = S.waveDeg * DEG * clamp(0.6 + 0.4 * env.ratio, 0.7, 1.2) * env.calm * (0.88 + 0.24 * HS.noise2(t * 0.45 + 2.3, 8.1));
env.period = S.wavePeriod * clamp(Math.pow(Math.max(env.ratio, 0.05), -0.4), 0.75, 1.4);
env.kappa = TWO_PI / (S.waveSpeed * env.period);
env.wander = S.wander * nz(t * 0.33, 5.5);
if (advance) { env.phase += TWO_PI * dt / env.period; }
for (j = 1; j < N; j++) { tbE[j] = nz(t * S.turbRate + j * 0.43, 3.7); tbA[j] = nz(t * S.turbRate * 0.8 + j * 0.37 + 9.1, 17.3); }
}
function buildGoal(ph, ax, ay, az) {
var j, gxx = ax, gyy = ay, gzz = az, tr = S.turbDeg * DEG * env.calm, hx = env.hx, hz = env.hz;
gx[0] = ax; gy[0] = ay; gz[0] = az;
for (j = 1; j < N; j++) {
var s = j / (N - 1), prof = S.waveRoot + (1 - S.waveRoot) * Math.pow(s, 1.1), arg = ph - env.kappa * j * SEG + env.wander;
var el = env.del0 + env.amp * prof * Math.sin(arg) + tr * prof * tbE[j];
var az2 = env.amp * S.waveSide * prof * Math.sin(arg + 1.3) + tr * prof * tbA[j] * 0.8;
var ce = Math.cos(az2), se = Math.sin(az2), hxr = hx * ce - hz * se, hzr = hx * se + hz * ce, cd = Math.cos(el);
gxx += SEG * cd * hxr; gyy += SEG * Math.sin(el); gzz += SEG * cd * hzr;
gx[j] = gxx; gy[j] = gyy; gz[j] = gzz;
}
}
function pushOut(X, Y, Z, j) {
var dx = X[j] - chx, dy = Y[j] - chy, dz = Z[j] - chz, d2 = dx * dx + dy * dy + dz * dz, r = S.headR, k, d;
if (d2 < r * r) { d = Math.sqrt(d2) || 1e-6; k = r / d; X[j] = chx + dx * k; Y[j] = chy + dy * k; Z[j] = chz + dz * k; }
dx = X[j] - cnx; dy = Y[j] - cny; dz = Z[j] - cnz; d2 = dx * dx + dy * dy + dz * dz; r = S.neckR;
if (d2 < r * r) { d = Math.sqrt(d2) || 1e-6; k = r / d; X[j] = cnx + dx * k; Y[j] = cny + dy * k; Z[j] = cnz + dz * k; }
dx = X[j] - ccx; dy = Y[j] - ccy; dz = Z[j] - ccz;
var lx = dx * ex.x + dy * ex.y + dz * ex.z, ly = dx * ey.x + dy * ey.y + dz * ey.z, lz = dx * ez.x + dy * ez.y + dz * ez.z;
var ya = ly < S.torsoY0 ? S.torsoY0 : ly > S.torsoY1 ? S.torsoY1 : ly, capY = ya === ly ? S.torsoRx : S.torsoCap;
var sx = lx / S.torsoRx, sy = (ly - ya) / capY, sz = lz / S.torsoRz;
d2 = sx * sx + sy * sy + sz * sz;
if (d2 < 1) {
d = Math.sqrt(d2);
if (d < 1e-6) { sx = 0; sy = 0; sz = -1; d = 1; }
k = 1 / d;
lx = sx * k * S.torsoRx; ly = ya + sy * k * capY; lz = sz * k * S.torsoRz;
X[j] = ccx + ex.x * lx + ey.x * ly + ez.x * lz; Y[j] = ccy + ex.y * lx + ey.y * ly + ez.y * lz; Z[j] = ccz + ex.z * lx + ey.z * ly + ez.z * lz;
}
}
function ground(X, Y, Z, j) { var g = HS.heightAt(X[j], Z[j]) + S.groundClear; if (Y[j] < g) { Y[j] = g; } }
function distances() {
for (var j = 1; j < N; j++) {
var dx = px[j] - px[j - 1], dy = py[j] - py[j - 1], dz = pz[j] - pz[j - 1], l = Math.sqrt(dx * dx + dy * dy + dz * dz);
if (l < 1e-9) { continue; }
var f = (l - SEG) / l, w0 = j === 1 ? 0 : 0.5, w1 = 1 - w0;
px[j - 1] += dx * f * w0; py[j - 1] += dy * f * w0; pz[j - 1] += dz * f * w0; px[j] -= dx * f * w1; py[j] -= dy * f * w1; pz[j] -= dz * f * w1;
}
}
function bending(kb) {
for (var j = 1; j < N - 1; j++) {
var cx = 2 * px[j] - px[j - 1], cy = 2 * py[j] - py[j - 1], cz = 2 * pz[j] - pz[j - 1];
px[j + 1] += (cx - px[j + 1]) * kb; py[j + 1] += (cy - py[j + 1]) * kb; pz[j + 1] += (cz - pz[j + 1]) * kb;
}
}
function leader(X, Y, Z) {
for (var j = 1; j < N; j++) {
var dx = X[j] - X[j - 1], dy = Y[j] - Y[j - 1], dz = Z[j] - Z[j - 1], l = Math.sqrt(dx * dx + dy * dy + dz * dz);
if (l < 1e-9) { dx = env.hx; dy = 0; dz = env.hz; l = 1; }
var k = SEG / l; X[j] = X[j - 1] + dx * k; Y[j] = Y[j - 1] + dy * k; Z[j] = Z[j - 1] + dz * k;
var g = HS.heightAt(X[j], Z[j]) + S.groundClear;
if (Y[j] < g) {
var up = g - Y[j - 1], hl = Math.sqrt(dx * dx + dz * dz);
if (up < SEG && up > -SEG && hl > 1e-9) { var hs = Math.sqrt(SEG * SEG - up * up) / hl; X[j] = X[j - 1] + dx * hs; Z[j] = Z[j - 1] + dz * hs; g = HS.heightAt(X[j], Z[j]) + S.groundClear; }
Y[j] = g;
}
}
}
function step(dt, t) {
var h = dt / SUB, n, f, j, it, vm2 = S.vmax * S.vmax, wn0 = TWO_PI * S.follow, ph0, kv = 1 - Math.exp(-dt / S.carryTime), kb = S.bend * h * h / IT;
var rx = (aN.x - aP.x) / dt, ry = (aN.y - aP.y) / dt, rz = (aN.z - aP.z) / dt, rl = Math.sqrt(rx * rx + ry * ry + rz * rz), rc = rl > S.vAnchor ? S.vAnchor / rl : 1;
va.x += (rx * rc - va.x) * kv; va.y += (ry * rc - va.y) * kv; va.z += (rz * rc - va.z) * kv;
ph0 = env.phase;
environment(t, dt, true);
for (n = 1; n <= SUB; n++) {
f = n / SUB;
var ax = aP.x + (aN.x - aP.x) * f, ay = aP.y + (aN.y - aP.y) * f, az = aP.z + (aN.z - aP.z) * f;
px[0] = ax; py[0] = ay; pz[0] = az; vx[0] = (aN.x - aP.x) / dt; vy[0] = (aN.y - aP.y) / dt; vz[0] = (aN.z - aP.z) / dt;
chx = hP.x + (hN.x - hP.x) * f; chy = hP.y + (hN.y - hP.y) * f; chz = hP.z + (hN.z - hP.z) * f;
cnx = nP.x + (nN.x - nP.x) * f; cny = nP.y + (nN.y - nP.y) * f; cnz = nP.z + (nN.z - nP.z) * f;
ccx = cP.x + (cN.x - cP.x) * f; ccy = cP.y + (cN.y - cP.y) * f; ccz = cP.z + (cN.z - cP.z) * f;
buildGoal(ph0 + TWO_PI * n * h / env.period, ax, ay, az);
for (it = 0; it < 2; it++) {
for (j = 1; j < N; j++) { pushOut(gx, gy, gz, j); ground(gx, gy, gz, j); }
leader(gx, gy, gz);
}
for (j = 1; j < N; j++) {
var wn = wn0 * (1 - (1 - S.tipSoft) * (j / (N - 1))), k = wn * wn, c = 2 * S.zeta * wn;
vx[j] += (k * (gx[j] - px[j]) - c * vx[j]) * h; vy[j] += (k * (gy[j] - py[j]) - c * vy[j]) * h; vz[j] += (k * (gz[j] - pz[j]) - c * vz[j]) * h;
qx[j] = px[j]; qy[j] = py[j]; qz[j] = pz[j];
px[j] += vx[j] * h; py[j] += vy[j] * h; pz[j] += vz[j] * h;
}
for (it = 0; it < IT; it++) {
distances(); bending(kb);
for (j = 1; j < N; j++) { pushOut(px, py, pz, j); ground(px, py, pz, j); }
}
leader(px, py, pz);
for (j = 1; j < N; j++) {
vx[j] = (px[j] - qx[j]) / h; vy[j] = (py[j] - qy[j]) / h; vz[j] = (pz[j] - qz[j]) / h;
var sp2 = vx[j] * vx[j] + vy[j] * vy[j] + vz[j] * vz[j];
if (sp2 > vm2) { var sc = S.vmax / Math.sqrt(sp2); vx[j] *= sc; vy[j] *= sc; vz[j] *= sc; }
}
}
aP.copy(aN); hP.copy(hN); nP.copy(nN); cP.copy(cN);
}
function finite() { for (var j = 0; j < N; j++) { if (!(isFinite(px[j]) && isFinite(py[j]) && isFinite(pz[j]))) { return false; } } return true; }
function reset(t) {
var j, k;
read(); aP.copy(aN); hP.copy(hN); nP.copy(nN); cP.copy(cN); va.set(0, 0, 0);
for (j = 0; j < N; j++) { px[j] = aN.x; py[j] = aN.y; pz[j] = aN.z; vx[j] = 0; vy[j] = 0; vz[j] = 0; }
environment(t, 0, false);
buildGoal(env.phase, aN.x, aN.y, aN.z);
chx = hN.x; chy = hN.y; chz = hN.z; cnx = nN.x; cny = nN.y; cnz = nN.z; ccx = cN.x; ccy = cN.y; ccz = cN.z;
for (k = 0; k < 3; k++) { for (j = 1; j < N; j++) { pushOut(gx, gy, gz, j); ground(gx, gy, gz, j); } leader(gx, gy, gz); }
for (j = 1; j < N; j++) { px[j] = gx[j]; py[j] = gy[j]; pz[j] = gz[j]; }
for (k = 0; k < S.warm; k++) { step(1 / 12, t - (S.warm - 1 - k) / 12); }
}
function update(dt, t, advance) {
read();
if (advance) { step(dt, t); if (!finite()) { reset(t); } } else { aP.copy(aN); hP.copy(hN); nP.copy(nN); cP.copy(cN); px[0] = aN.x; py[0] = aN.y; pz[0] = aN.z; }
for (var j = 0; j < N; j++) { out[j].set(px[j], py[j], pz[j]); }
opt.ruffle = S.ruffle0 + S.ruffle1 * Math.min(1.2, env.gust);
model.setScarfTail(out, opt);
}
return { update: update, reset: reset, points: out, env: env, goal: { x: gx, y: gy, z: gz } };
}
function createRig(model, ctx) {
var J = model.joints, root = J.root, hips = J.hips, U = HS.U, CI = RIG.ik, CL = RIG.look, CE = RIG.sec, k, i;
var names = [], rest = {}, restPos = {}, pose = {}, sec = {}, look = { neck: null, head: null }, lookQ = { neck: new THREE.Quaternion(), head: new THREE.Quaternion() };
for (k in J) {
if (k === 'root' || !J[k].userData || !J[k].userData.rest) { continue; }
names.push(k); rest[k] = J[k].userData.rest; restPos[k] = J[k].position.clone(); pose[k] = [0, 0, 0];
}
var st = { x: root.position.x, y: root.position.y, z: root.position.z, yaw: root.rotation.y };
var hipsOff = [0, 0, 0], X1 = new V3(1, 0, 0), Y1 = new V3(0, 1, 0);
var a1 = new V3(), a2 = new V3(), a3 = new V3(), a4 = new V3(), a5 = new V3(), a6 = new V3(), a7 = new V3();
var Q1 = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), Q3 = new THREE.Quaternion(), Q4 = new THREE.Quaternion(), Q5 = new THREE.Quaternion();
var M1 = new THREE.Matrix4(), EU = new THREE.Euler();
var rig = { model: model, joints: J, cfg: RIG };
function commit(name) {
var j = J[name], r = rest[name], p = pose[name], s = sec[name];
if (s) { j.rotation.set(r.x + p[0] + s[0], r.y + p[1] + s[1], r.z + p[2] + s[2]); } else { j.rotation.set(r.x + p[0], r.y + p[1], r.z + p[2]); }
if (look[name]) { j.quaternion.premultiply(look[name]); }
}
function setPose(name, x, y, z) { var p = pose[name]; if (!p) { return; } p[0] = x; p[1] = y; p[2] = z; commit(name); }
function zeroPose() { for (var n = 0; n < names.length; n++) { var p = pose[names[n]]; p[0] = 0; p[1] = 0; p[2] = 0; } }
function commitAll() { for (var n = 0; n < names.length; n++) { commit(names[n]); } }
rig.reset = function () {
zeroPose(); look.neck = null; look.head = null; hipsOff[0] = 0; hipsOff[1] = 0; hipsOff[2] = 0; hips.position.copy(restPos.hips); commitAll(); return rig;
};
rig.rot = function (name, x, y, z) { setPose(name, x || 0, y || 0, z || 0); return rig; };
rig.setRoot = function (x, y, z, yaw) { st.x = x; st.y = y; st.z = z; st.yaw = yaw || 0; root.position.set(x, y, z); root.rotation.set(0, st.yaw, 0); return rig; };
rig.setHips = function (dx, dy, dz, rx, ry, rz) {
hipsOff[0] = dx || 0; hipsOff[1] = dy || 0; hipsOff[2] = dz || 0;
hips.position.set(restPos.hips.x + hipsOff[0], restPos.hips.y + hipsOff[1], restPos.hips.z + hipsOff[2]);
setPose('hips', rx || 0, ry || 0, rz || 0); return rig;
};
rig.applyPose = function (p, keep) {
var jn = (p && p.joints) || NO_OPTS, h = p && p.hips, n, v;
if (!keep) { zeroPose(); commitAll(); }
for (n in jn) { v = jn[n]; setPose(n, v[0] || 0, v[1] || 0, v[2] || 0); }
if (h) { rig.setHips(h[0], h[1], h[2], h[3], h[4], h[5]); } else if (!keep) { rig.setHips(0, 0, 0, 0, 0, 0); }
return rig;
};
rig.blendPose = function (a, b, t, out) {
out = out || { joints: {}, hips: [0, 0, 0, 0, 0, 0] };
var ja = (a && a.joints) || NO_OPTS, jb = (b && b.joints) || NO_OPTS, n, A, B, o, ha = (a && a.hips) || ZERO3.concat(ZERO3), hb = (b && b.hips) || ZERO3.concat(ZERO3);
for (n in out.joints) { if (!ja[n] && !jb[n]) { o = out.joints[n]; o[0] = 0; o[1] = 0; o[2] = 0; } }
for (n in ja) { A = ja[n]; B = jb[n] || ZERO3; o = out.joints[n] || (out.joints[n] = [0, 0, 0]); o[0] = A[0] + (B[0] - A[0]) * t; o[1] = A[1] + (B[1] - A[1]) * t; o[2] = A[2] + (B[2] - A[2]) * t; }
for (n in jb) { if (ja[n]) { continue; } B = jb[n]; o = out.joints[n] || (out.joints[n] = [0, 0, 0]); o[0] = B[0] * t; o[1] = B[1] * t; o[2] = B[2] * t; }
for (n = 0; n < 6; n++) { out.hips[n] = (ha[n] || 0) + ((hb[n] || 0) - (ha[n] || 0)) * t; }
return out;
};
rig.getPose = function (out) {
out = out || { joints: {}, hips: [0, 0, 0, 0, 0, 0] };
for (var n = 0; n < names.length; n++) { var p = pose[names[n]], o = out.joints[names[n]] || (out.joints[names[n]] = [0, 0, 0]); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }
out.hips[0] = hipsOff[0]; out.hips[1] = hipsOff[1]; out.hips[2] = hipsOff[2]; out.hips[3] = pose.hips[0]; out.hips[4] = pose.hips[1]; out.hips[5] = pose.hips[2];
return out;
};
rig.groundY = function (x, z) { return HS.heightAt(x, z); };
var legs = {
L: { sign: 1, hip: J.hipL, knee: J.kneeL, ankle: J.ankleL, hn: 'hipL', kn: 'kneeL', an: 'ankleL' },
R: { sign: -1, hip: J.hipR, knee: J.kneeR, ankle: J.ankleR, hn: 'hipR', kn: 'kneeR', an: 'ankleR' }
};
var legInfo = { L: { reach: 0, clamped: false, bend: 0 }, R: { reach: 0, clamped: false, bend: 0 } };
var ankleH = model.dims.ankleY, restAnkle = { L: new V3(), R: new V3() };
legs.L.l1 = J.kneeL.position.length(); legs.L.l2 = J.ankleL.position.length(); legs.R.l1 = J.kneeR.position.length(); legs.R.l2 = J.ankleR.position.length();
(function () {
['L', 'R'].forEach(function (s) {
var M = new THREE.Matrix4(), T = new THREE.Matrix4(), chain = ['hips', legs[s].hn, legs[s].kn, legs[s].an], c;
for (c = 0; c < chain.length; c++) {
var r = rest[chain[c]], p = restPos[chain[c]];
T.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(r.x, r.y, r.z)), new V3(1, 1, 1)); M.multiply(T);
}
restAnkle[s].setFromMatrixPosition(M);
});
})();
function sideOf(side) { return (side === 'R' || side === 'r' || side === -1) ? 'R' : 'L'; }
rig.footRestWorld = function (side, out) {
out = out || new V3();
return out.copy(restAnkle[sideOf(side)]).applyAxisAngle(Y1, st.yaw).add(a1.set(st.x, st.y, st.z));
};
rig.ankleWorld = function (side, out) { out = out || new V3(); J['ankle' + sideOf(side)].updateWorldMatrix(true, false); return out.setFromMatrixPosition(J['ankle' + sideOf(side)].matrixWorld); };
rig.solveLeg = function (side, target, o) {
var s = sideOf(side), leg = legs[s], inf = legInfo[s], L1 = leg.l1, L2 = leg.l2;
var dmax = (L1 + L2) * CI.reach, dmin = Math.sqrt(L1 * L1 + L2 * L2 + 2 * L1 * L2 * Math.cos(CI.maxBend));
o = o || NO_OPTS;
hips.updateWorldMatrix(true, false);
Q1.setFromRotationMatrix(hips.matrixWorld);
a1.copy(leg.hip.position).applyMatrix4(hips.matrixWorld);
a2.set(target.x - a1.x, target.y - a1.y, target.z - a1.z);
var D = a2.length();
inf.reach = D / (L1 + L2); inf.clamped = D > dmax || D < dmin;
if (D < 1e-6) { a2.set(0, -1, 0); } else { a2.multiplyScalar(1 / D); }
D = D < dmin ? dmin : D > dmax ? dmax : D;
var yawF = st.yaw + (o.footYaw || 0) + rest[leg.an].y, fx = Math.sin(yawF), fz = Math.cos(yawF), pb = CI.poleFoot;
a3.set(0, 0, 1).applyQuaternion(Q1);
a3.set(a3.x * (1 - pb) + fx * pb, a3.y * (1 - pb), a3.z * (1 - pb) + fz * pb);
a3.addScaledVector(a2, -a3.dot(a2));
var pl = a3.length();
if (pl < 0.35) {
a4.copy(Y1).addScaledVector(a2, -a2.y);
var al4 = a4.length(); if (al4 > 1e-6) { a4.multiplyScalar(1 / al4); }
var wu = 1 - sstep(0.12, 0.35, pl);
a3.multiplyScalar(1 - wu).addScaledVector(a4, wu); pl = a3.length();
}
if (pl < 1e-6) { a3.set(0, 0, 1).addScaledVector(a2, -a2.z); pl = a3.length() || 1; }
a3.multiplyScalar(1 / pl);
var aa = (L1 * L1 - L2 * L2 + D * D) / (2 * D), hh = Math.sqrt(Math.max(0, L1 * L1 - aa * aa));
a5.copy(a2).multiplyScalar(aa).addScaledVector(a3, hh).multiplyScalar(1 / L1);
a4.crossVectors(a3, a2).normalize();
a6.copy(a5).multiplyScalar(-1);
a7.crossVectors(a4, a6);
M1.makeBasis(a4, a6, a7); Q2.setFromRotationMatrix(M1);
Q3.copy(Q1).invert().multiply(Q2); EU.setFromQuaternion(Q3, 'XYZ');
var r = rest[leg.hn]; setPose(leg.hn, EU.x - r.x, EU.y - r.y, EU.z - r.z);
var bend = Math.PI - Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2))));
inf.bend = bend; r = rest[leg.kn]; setPose(leg.kn, bend - r.x, -r.y, -r.z);
var al = o.align != null ? o.align : 1 - sstep(CI.alignNear, CI.alignFar, target.y - HS.heightAt(target.x, target.z) - ankleH);
a6.set(0, 1, 0);
if (al > 0.001) {
var e = 0.07, gx = (HS.heightAt(target.x + e, target.z) - HS.heightAt(target.x - e, target.z)) / (2 * e), gz = (HS.heightAt(target.x, target.z + e) - HS.heightAt(target.x, target.z - e)) / (2 * e);
var gl = Math.sqrt(gx * gx + gz * gz); if (gl > CI.alignMax) { gx *= CI.alignMax / gl; gz *= CI.alignMax / gl; }
a6.set(-gx * al, 1, -gz * al).normalize();
}
a7.set(fx, 0, fz); a7.addScaledVector(a6, -a7.dot(a6)).normalize();
a5.crossVectors(a6, a7);
M1.makeBasis(a5, a6, a7); Q4.setFromRotationMatrix(M1);
if (o.footPitch) { Q5.setFromAxisAngle(X1, -o.footPitch); Q4.multiply(Q5); }
Q5.setFromAxisAngle(X1, bend); Q3.copy(Q2).multiply(Q5).invert().multiply(Q4);
EU.setFromQuaternion(Q3, 'XYZ'); r = rest[leg.an]; setPose(leg.an, EU.x - r.x, EU.y - r.y, EU.z - r.z);
return inf;
};
var eyeC = new V3().copy(restPos.neck).add(restPos.head).add(a7.set(CL.eye[0], CL.eye[1], CL.eye[2]));
rig.lookAngles = { yaw: 0, pitch: 0 };
rig.lookAt = function (target, weight) {
var w = weight == null ? 1 : weight; w = w < 0 ? 0 : w > 1 ? 1 : w;
J.chest.updateWorldMatrix(true, false);
M1.copy(J.chest.matrixWorld).invert();
a1.set(target.x, target.y, target.z).applyMatrix4(M1).sub(eyeC);
var hz = Math.sqrt(a1.x * a1.x + a1.z * a1.z), yaw = 0, pit = 0, fade = 1;
if (hz > 1e-4 || Math.abs(a1.y) > 1e-4) {
yaw = Math.atan2(a1.x, a1.z) * sstep(0.01, 0.08, hz); pit = Math.atan2(a1.y, hz);
fade = 1 - sstep(CL.fadeFrom, CL.fadeTo, Math.abs(yaw));
}
yaw = softLimit(yaw, CL.yaw) * fade * w; pit = softLimit(pit, CL.pitch) * fade * w;
rig.lookAngles.yaw = yaw; rig.lookAngles.pitch = pit;
Q1.setFromAxisAngle(Y1, yaw); Q2.setFromAxisAngle(X1, -pit); Q1.multiply(Q2);
Q3.setFromAxisAngle(Y1, yaw * CL.neck); Q2.setFromAxisAngle(X1, -pit * CL.neck); Q3.multiply(Q2);
lookQ.neck.copy(Q3); lookQ.head.copy(Q3).invert().multiply(Q1);
look.neck = lookQ.neck; look.head = lookQ.head; commit('neck'); commit('head');
return rig;
};
var swayGroup = {};
for (k in CE.swayMesh) {
var jn = J[k], mesh = jn.getObjectByName(CE.swayMesh[k]), g = new THREE.Group();
g.name = k + 'Sway'; jn.add(g); if (mesh) { g.add(mesh); } swayGroup[k] = g;
}
var trackers = [], springs = [];
function trackerFor(node) {
for (var q = 0; q < trackers.length; q++) { if (trackers[q].node === node) { return trackers[q]; } }
var tr = { node: node, r: [new V3(), new V3(), new V3(), new V3()], i: 0, v: new V3() }; trackers.push(tr); return tr;
}
CE.table.forEach(function (row, idx) {
var hair = row[1] === 'hair', sp = {
name: row[0], hair: hair, node: hair ? J[row[0]] : swayGroup[row[0]], tr: trackerFor(J[row[0]]), sign: row[2], amp: row[3] * DEG, freq: row[4], zeta: row[5],
gw: row[6], gm: row[7], gf: row[8], boil: row[9] * DEG, seed: 3.7 + idx * 5.31, ax: 0, az: 0, wx: 0, wz: 0, tx: 0, tz: 0
};
if (hair) { sec[row[0]] = [0, 0, 0]; }
springs.push(sp);
});
var scarfSim = model.scarf ? createScarfSim(model, J, ctx && ctx.display && ctx.display.scarf ? Object.assign({}, RIG.scarf, ctx.display.scarf) : RIG.scarf) : null;
var wl = { x: 0, z: 0 }, lastT = 0, ready = false;
function readTrackers(fill) {
for (var q = 0; q < trackers.length; q++) {
var tr = trackers[q], e = tr.node.matrixWorld.elements;
if (fill) { for (var m = 0; m < 4; m++) { tr.r[m].set(e[12], e[13], e[14]); } tr.i = 0; } else { tr.i = (tr.i + 1) & 3; tr.r[tr.i].set(e[12], e[13], e[14]); }
}
}
function computeTargets(t) {
var q, sp, c = Math.cos(st.yaw), s = Math.sin(st.yaw), gust = HS.gustAt(st.x, st.z, t), wp = CE.windBase + CE.windGust * gust;
var wdx = U.uWindDir.value.x, wdz = U.uWindDir.value.y, wlen = Math.sqrt(wdx * wdx + wdz * wdz) || 1;
wdx /= wlen; wdz /= wlen;
wl.x = wdx * c - wdz * s; wl.z = wdx * s + wdz * c;
for (q = 0; q < springs.length; q++) {
sp = springs[q];
var fl = sp.gf * (0.4 + 0.6 * gust);
var Px = wl.x * wp * sp.gw - sp.tr.v.x * sp.gm / CE.vRef + fl * nz(t * 1.15 + sp.seed, sp.seed * 1.7);
var Pz = wl.z * wp * sp.gw - sp.tr.v.z * sp.gm / CE.vRef + fl * nz(t * 0.95 + sp.seed * 1.3, sp.seed * 2.3 + 4.1);
var mag = Math.sqrt(Px * Px + Pz * Pz), lim = mag > 1e-6 ? Math.tanh(mag) / mag : 1;
sp.tx = sp.sign * Pz * lim * sp.amp; sp.tz = -sp.sign * Px * lim * sp.amp;
}
}
function driveSecondary(dt, t) {
var q, n, sp, h = dt / CE.sub, c = Math.cos(st.yaw), s = Math.sin(st.yaw), lag = CE.lagFrames < 1 ? 1 : CE.lagFrames > 2 ? 2 : Math.round(CE.lagFrames);
readTrackers(false);
for (q = 0; q < trackers.length; q++) {
var tr = trackers[q], pa = tr.r[(tr.i + 4 - (lag - 1)) & 3], pb = tr.r[(tr.i + 4 - (lag + 1)) & 3], vxw = (pa.x - pb.x) / (2 * dt), vzw = (pa.z - pb.z) / (2 * dt);
tr.v.set(vxw * c - vzw * s, 0, vxw * s + vzw * c);
}
computeTargets(t);
for (q = 0; q < springs.length; q++) {
sp = springs[q];
var w2 = Math.pow(2 * Math.PI * sp.freq, 2), cd = 2 * sp.zeta * 2 * Math.PI * sp.freq;
for (n = 0; n < CE.sub; n++) {
sp.wx += (w2 * (sp.tx - sp.ax) - cd * sp.wx) * h; sp.ax += sp.wx * h;
sp.wz += (w2 * (sp.tz - sp.az) - cd * sp.wz) * h; sp.az += sp.wz * h;
}
var cl = sp.amp * 1.15; sp.ax = softLimit(sp.ax, cl); sp.az = softLimit(sp.az, cl);
}
}
function applySecondary(frame) {
var boil = U.uBoil.value > 0.5, scale = CE.scale;
for (var q = 0; q < springs.length; q++) {
var sp = springs[q], bx = 0, bz = 0;
if (boil && sp.boil) { bx = (HS.hash2(frame * 1.731 + sp.seed, sp.seed * 0.77 + 2.1) - 0.5) * 2 * sp.boil; bz = (HS.hash2(frame * 2.173 + sp.seed * 1.3, sp.seed * 1.9 + 5.7) - 0.5) * 2 * sp.boil; }
if (sp.hair) { var sc = sec[sp.name]; sc[0] = sp.ax * scale + bx * scale; sc[2] = sp.az * scale + bz * scale; commit(sp.name); }
else { sp.node.rotation.set(sp.ax * scale, 0, sp.az * scale); }
}
}
rig.update = function (dt, t, frame) {
dt = dt > 0 ? dt : 0; t = t || 0; frame = frame || 0;
root.updateMatrixWorld(true);
if (!ready) { rig.teleport(); }
var real = dt >= 0.002;
if (real) { driveSecondary(dt, t); lastT = t; }
applySecondary(frame);
if (scarfSim) { scarfSim.update(real ? dt : 1 / 12, t, real); }
return rig;
};
rig.teleport = function () {
var q;
ready = true;
root.updateMatrixWorld(true);
readTrackers(true);
for (q = 0; q < trackers.length; q++) { trackers[q].v.set(0, 0, 0); }
computeTargets(lastT);
for (q = 0; q < springs.length; q++) { var sp = springs[q]; sp.ax = sp.tx; sp.az = sp.tz; sp.wx = 0; sp.wz = 0; }
if (scarfSim) { scarfSim.reset(lastT); }
return rig;
};
rig.legInfo = legInfo;
rig.scarfSim = scarfSim;
rig.dispose = function () {};
commitAll();
return rig;
}
var PS = 1 / 12;
var AN = {
wait: 0.7,
firstLen: 0.30, stepLen: 0.30, endLen: [0.24, 0.15, 0.06],
firstPoses: 6, stepPoses: 6, endPoses: [7, 8, 9],
asym: 0.025, footW: 0.05, swing: 1.0,
lift: 0.045, heelUp: 10 * DEG, toeDown: 25 * DEG, arc: 0.008,
rollIn: 2 * PS, rollOut: 3 * PS, floatSteps: [3, 6, 10],
rootSurge: 0.10,
kneeMargin: 0.001, bobLo: 0.011, bobPeak: 0.06, floatRise: 0.004,
envSlope: 0.25, envDt: PS / 2, envN: 4,
sway: 0.008, pelvisYaw: 0.29, pelvisRoll: 1.5 * DEG, shoulderYaw: 0.23,
arm: 1.33, armOut: 0.07, elbow: 0.14, elbowSwing: 0.45,
lean: 4 * DEG, leanStand: 1.5 * DEG, chinUp: 5 * DEG, nod: 2.2 * DEG, rock: 1.2 * DEG,
glance: { step: 4, at: 0.25, deg: 28 * DEG, up: 4 * DEG }, bridgeTurn: [8 * DEG, 20 * DEG],
settle: 4 * PS, sink: 0.012, settleNod: 3 * DEG, hold: 0.5,
turn: { head: [0, 0.6], chest: [0.2, 1.2], root: [0.4, 1.75], A: 0.6, B: 1.15, poses: 5, end: 2.3 },
finalYaw: Math.atan2(-Math.sin(14 * DEG), -Math.cos(14 * DEG)),
idle: {
breath: 0.003, breathT: 4.0,
shift: { first: 4.5, period: 8.0, jitter: 0.5, dx: 0.018, roll: 0.06, ease: 1.4 },
gust: 0.8,
bridgeEl: 3 * DEG,
beats: [
{ T: 31.7, w: [0.40, 0.58, 0.74, 0.92], yaw: 36, pit: -1 },
{ T: 47.3, w: [0.52, 0.60, 0.68, 0.78], yaw: -14, pit: 0 },
{ T: 23.9, w: [0.28, 0.32, 0.40, 0.45], yaw: -2, pit: 11 }
]
}
};
var FOOT = { heel: 0.036, toe: 0.066 };
function wrapPi(a) { a = (a + Math.PI) % TAU; if (a < 0) { a += TAU; } return a - Math.PI; }
function bump(x, a, b, c, d) { return sstep(a, b, x) * (1 - sstep(c, d, x)); }
function pathZ(x) { return HS.LAYOUT.princeZ + 0.10 * Math.sin(x * 0.6 + 0.4); }
function pathYaw(x) { return Math.atan2(-1, -0.06 * Math.cos(x * 0.6 + 0.4)); }
function footPlace(startX, sgn, p) {
var x = startX - p, yaw = pathYaw(x), c = Math.cos(yaw), s = Math.sin(yaw);
return { x: x + c * sgn * AN.footW, z: pathZ(x) - s * sgn * AN.footW, yaw: yaw };
}
function footFinal(x, z, yaw, sgn) {
var c = Math.cos(yaw), s = Math.sin(yaw), side = sgn * AN.footW, fw = sgn > 0 ? 0.012 : -0.006;
return { x: x + c * side + s * fw, z: z - s * side + c * fw, yaw: yaw };
}
function mv(t0, n, a, b, lift, up, down, roll, arc, sw) { return { t0: t0, dur: n * PS, sw: sw, a: a, b: b, lift: lift, up: up, down: down, roll: roll, arc: arc }; }
function makePlan(startX, stopX, dsp) {
var D = Math.max(0.25, startX - stopX), endSum = AN.endLen[0] + AN.endLen[1] + AN.endLen[2] * 0.5, h0 = AN.firstLen / 2;
var mid = D - h0 - AN.firstLen - endSum, M = Math.max(0, Math.round(mid / AN.stepLen)), sc = M === 0 ? D / (h0 + AN.firstLen + endSum) : 1, h = h0 * sc;
var lens = [AN.firstLen * sc], poses = [AN.firstPoses], raw = [], sum = 0, k, N, t = 0, P = [], steps = [], keys = [{ t: 0, s: 0 }], T = AN.turn;
var feet = [{ sgn: 1, start: footPlace(startX, 1, -h), moves: [] }, { sgn: -1, start: footPlace(startX, -1, h), moves: [] }];
for (k = 0; k < M; k++) { raw.push(1 + AN.asym * (k % 2 ? -1 : 1)); sum += raw[k]; }
for (k = 0; k < M; k++) { lens.push(raw[k] / sum * mid); poses.push(AN.stepPoses); }
for (k = 0; k < 3; k++) { lens.push(AN.endLen[k] * sc); poses.push(AN.endPoses[k]); }
N = lens.length;
for (k = 0; k < N; k++) {
var fi = k % 2, sg = fi ? -1 : 1, n = poses[k], p1 = k > 0 ? P[k - 1] : h, p2 = k > 1 ? P[k - 2] : k === 1 ? h : -h, fl = AN.floatSteps.indexOf(k) >= 0 && k < N - 3 ? 1 : 0;
P[k] = p1 + lens[k];
feet[fi].moves.push(mv(t, n, footPlace(startX, sg, p2), footPlace(startX, sg, P[k]), AN.lift * (1 + 0.3 * fl) * (1 + 0.06 * sg), AN.heelUp, AN.toeDown * (1 + 0.2 * fl), AN.rollOut * (1 + 0.35 * fl), AN.arc, AN.swing));
steps.push({ t0: t, dur: n * PS, n: n, len: lens[k], fl: fl });
keys.push({ t: t + n * PS * AN.swing, s: (p1 + P[k]) / 2 });
t += n * PS;
}
var last = steps[N - 1], Tland = last.t0 + last.dur * AN.swing, Tt0 = Tland + AN.settle + AN.hold;
var stop = { x: startX - D, z: 0 }; stop.z = pathZ(stop.x);
var psi0 = pathYaw(stop.x), psi1 = dsp ? dsp.yaw : AN.finalYaw, fin = [footFinal(stop.x, stop.z, psi1, 1), footFinal(stop.x, stop.z, psi1, -1)];
var f1 = (N - 2) % 2, f2 = (N - 1) % 2, m1 = feet[f1].moves, m2 = feet[f2].moves;
m1.push(mv(Tt0 + T.A, T.poses, m1[m1.length - 1].b, fin[f1], 0.03, 5 * DEG, 12 * DEG, 2 * PS, 0.004, 0.8));
m2.push(mv(Tt0 + T.B, T.poses, m2[m2.length - 1].b, fin[f2], 0.03, 5 * DEG, 12 * DEG, 2 * PS, 0.004, 0.8));
var B = HS.LAYOUT.bridge, bx = (B.lookX != null ? B.lookX : B.x) - stop.x, bz = B.z - stop.z, gi = Math.min(AN.glance.step, Math.max(0, N - 5));
return {
startX: startX, stopX: stop.x, D: D, N: N, steps: steps, keys: keys, feet: feet, stop: stop, fin: fin, psi0: psi0, psi1: psi1, delta: wrapPi(psi1 - psi0),
psiB: psi1 + (dsp ? (dsp.headYaw || 0) : wrapPi(Math.atan2(bx, bz) - psi1)),
Tw: t, Tland: Tland, Tt0: Tt0, Tt1: Tt0 + T.end, Tb0: steps[N - 4].t0, Tn3: steps[N - 3].t0, tGl: steps[gi].t0 + AN.glance.at
};
}
var _ho = { f: 0, u: 0 }, _to = { f: 0, u: 0 };
function heelOff(th, ah, o) { var c = Math.cos(th), s = Math.sin(th); o.f = FOOT.heel * (c - 1) - ah * s; o.u = FOOT.heel * s + ah * (c - 1); }
function toeOff(ph, ah, o) { var c = Math.cos(ph), s = Math.sin(ph); o.f = FOOT.toe * (1 - c) + ah * s; o.u = FOOT.toe * s + ah * (c - 1); }
function footAt(tr, u, ah, toe, o) {
var m = tr.moves, n = m.length, i = -1, pv, nx, a, b, r, g, x, z, yw, lift = 0, pitch, f, up, sw = 0, arc = 0, since, until, wT, wH, p, fyaw, fx, fz, gy, k, sl;
while (i + 1 < n && m[i + 1].t0 <= u) { i++; }
pv = i >= 0 ? m[i] : null; nx = i + 1 < n ? m[i + 1] : null;
if (pv && u < pv.t0 + pv.dur * pv.sw) {
r = (u - pv.t0) / (pv.dur * pv.sw); g = r * r * (3 - 2 * r); a = pv.a; b = pv.b;
x = a.x + (b.x - a.x) * g; z = a.z + (b.z - a.z) * g; yw = a.yaw + (b.yaw - a.yaw) * sstep(0.1, 0.9, r);
lift = pv.lift * Math.sin(Math.PI * Math.pow(g, 0.9)); arc = pv.arc * Math.sin(Math.PI * g) * tr.sgn;
pitch = -pv.down + (pv.up + pv.down) * g;
wT = 1 - sstep(0, 0.35, r); wH = sstep(0.65, 1, r);
toeOff(Math.max(0, -pitch), ah, _to); heelOff(Math.max(0, pitch), ah, _ho);
f = wT * _to.f + wH * _ho.f; up = wT * _to.u + wH * _ho.u;
sw = sstep(0, 0.3, r) * (1 - sstep(0.7, 1, r));
} else {
p = pv ? pv.b : tr.start; x = p.x; z = p.z; yw = p.yaw;
since = pv ? u - (pv.t0 + pv.dur * pv.sw) : 1e3; until = nx ? nx.t0 - u : 1e3;
pitch = pv ? pv.up * (1 - sstep(0, AN.rollIn, since)) : 0;
if (nx) { pitch -= nx.down * (1 - sstep(0, nx.roll, until)); }
if (pitch >= 0) { heelOff(pitch, ah, _ho); f = _ho.f; up = _ho.u; } else { toeOff(-pitch, ah, _to); f = _to.f; up = _to.u; }
}
fyaw = yw + toe; fx = Math.sin(fyaw); fz = Math.cos(fyaw);
gy = HS.heightAt(x, z);
sl = (HS.heightAt(x + fx * 0.05, z + fz * 0.05) - HS.heightAt(x - fx * 0.05, z - fz * 0.05)) / 0.1;
sl *= 1 - sstep(0.012, 0.1, lift + up); k = 1 / Math.sqrt(1 + sl * sl);
o.x = x + fx * (f * k - up * sl * k) + Math.cos(yw) * arc; o.z = z + fz * (f * k - up * sl * k) - Math.sin(yw) * arc; o.y = gy + ah + lift + f * sl * k + up * k;
o.pitch = pitch; o.yaw = yw; o.swing = sw;
return o;
}
function rootAt(P, u, o) {
var st = P.steps, ks = P.keys, nk = ks.length, k = 0, j = 0, s, q = 1, q2, h, x, yw, T = AN.turn, tau = u - P.Tt0;
if (u <= 0) { s = 0; q = 0; }
else {
if (u < P.Tw) { while (k < st.length - 1 && st[k + 1].t0 <= u) { k++; } q = (u - st[k].t0) / st[k].dur; } else { k = st.length - 1; }
if (u >= ks[nk - 1].t) { s = P.D; }
else {
while (ks[j + 1].t <= u) { j++; }
q2 = (u - ks[j].t) / (ks[j + 1].t - ks[j].t);
h = j === nk - 2 ? q2 * (2 - q2) : q2 + AN.rootSurge * Math.sin(TAU * q2) / TAU;
s = ks[j].s + (ks[j + 1].s - ks[j].s) * h;
}
}
x = P.startX - s; yw = tau > 0 ? P.psi0 + P.delta * sstep(T.root[0], T.root[1], tau) : pathYaw(x);
o.x = x; o.z = pathZ(x); o.yaw = yw; o.k = k; o.q = q; o.s = s;
return o;
}
function createAnimator(model, rig, ctx) {
var J = model.joints, U = HS.U, ah = model.dims.ankleY, IK = rig.cfg.ik, I = AN.idle, T = AN.turn;
var plan = null, skipped = false, arrived = false, turned = false, baseT = Math.ceil(AN.wait / PS - 1e-6) * PS, idleT0 = null, lastT = 0, curX = 0;
var fS = [{}, {}], rS = { x: 0, y: 0, z: 0, yaw: 0, k: 0, q: 0, s: 0 }, tg = new V3(), hp = new V3(), aim = new V3(), bs = { yaw: 0, pit: 0 };
var oL = { footPitch: 0, footYaw: 0 }, oR = { footPitch: 0, footYaw: 0 }, nR = { x: 0, y: 0, z: 0, yaw: 0, k: 0, q: 0, s: 0 }, nF = [{}, {}];
var dbgv = { env: 0, need: 0, na: 0 }, hipW = J.hipL.position.x, hipH = J.hips.position.y + J.hipL.position.y;
var toe = [J.ankleL.userData.rest.y, J.ankleR.userData.rest.y];
var reach = [(J.kneeL.position.length() + J.ankleL.position.length()) * IK.reach, (J.kneeR.position.length() + J.ankleR.position.length()) * IK.reach];
function evtT(i) { return I.shift.first + i * I.shift.period + I.shift.jitter * (2 * HS.hash2(i, 3.7) - 1); }
function evtV(i) { return (i % 2 === 0 ? 1 : -1) * (0.65 + 0.35 * HS.hash2(i, 9.1)); }
function shiftAt(ti) {
var i = Math.floor((ti - I.shift.first) / I.shift.period) + 1, vp;
while (i >= 0 && evtT(i) > ti) { i--; }
if (i < 0) { return 0; }
vp = i > 0 ? evtV(i - 1) : 0;
return vp + (evtV(i) - vp) * sstep(0, I.shift.ease, ti - evtT(i));
}
function beats(ti, o) {
var y = 0, p = 0, i, B, w;
for (i = 0; i < I.beats.length; i++) { B = I.beats[i]; w = bump((ti / B.T) % 1, B.w[0], B.w[1], B.w[2], B.w[3]); y += B.yaw * DEG * w; p += B.pit * DEG * w; }
if (ctx.display) { y *= ctx.display.look; p *= ctx.display.look; }
o.yaw = y; o.pit = p;
}
function needAt(u) {
var i, c, s, hx, hz, d, nd = -1, sg;
rootAt(plan, u, nR); c = Math.cos(nR.yaw); s = Math.sin(nR.yaw);
for (i = 0; i < 2; i++) {
footAt(plan.feet[i], u, ah, toe[i], nF[i]); sg = i ? -hipW : hipW;
hx = nR.x + c * sg - nF[i].x; hz = nR.z - s * sg - nF[i].z;
d = HS.heightAt(nR.x, nR.z) + hipH - nF[i].y - Math.sqrt(Math.max(0, reach[i] * reach[i] - hx * hx - hz * hz));
if (d > nd) { nd = d; }
}
return nd;
}
function dropEnvelope(u) {
var j, v, e = needAt(u), m = AN.envN * AN.envDt;
if (u < -m || u > plan.Tt1 + m) { return e; }
for (j = -AN.envN; j <= AN.envN; j++) { if (j !== 0) { v = needAt(u + j * AN.envDt) - AN.envSlope * Math.abs(j) * AN.envDt; if (v > e) { e = v; } } }
return e;
}
function prepare(pl) {
var ks = pl.keys, j, v; pl.hi = [AN.bobLo];
for (j = 1; j < ks.length; j++) {
v = Math.max(needAt(ks[j].t), needAt(ks[j].t + PS * 0.5), needAt(ks[j].t + PS), needAt(ks[j].t + PS * 1.5));
pl.hi.push(Math.max(AN.bobLo, v + AN.kneeMargin + 0.002));
}
pl.hi[0] = pl.hi[1];
return pl;
}
function newPlan(a, b, view) { plan = makePlan(a, b, ctx.display); prepare(plan); plan.reqStart = view ? view.startX : a; plan.reqStop = view ? view.stopX : b; return plan; }
function authored(u) {
var ks = plan.keys, hi = plan.hi, j = 0, q, h;
if (u <= 0 || u >= ks[ks.length - 1].t) { return AN.bobLo; }
while (ks[j + 1].t <= u) { j++; }
q = (u - ks[j].t) / (ks[j + 1].t - ks[j].t); h = hi[j] + (hi[j + 1] - hi[j]) * q;
var sh = 0.5 + 0.5 * Math.cos(TAU * (q - AN.bobPeak));
return AN.bobLo + (h - AN.bobLo) * sh - AN.floatRise * plan.steps[Math.min(j, plan.N - 1)].fl * (1 - sh);
}
function pose(t, dt, frame) {
var P = plan, sp = ctx.walkSpeed || 1, u = skipped ? P.Tt1 + 1000 : (t - baseT) * sp, hidden = !skipped && u < 0, i;
if (skipped && idleT0 === null) { idleT0 = t; }
var tIdle = skipped ? idleT0 : baseT + P.Tt1 / sp, ti = Math.max(0, t - tIdle), iw = skipped ? 1 : sstep(0, 1.5, t - tIdle);
var tau = u - P.Tt0, eH = sstep(T.head[0], T.head[1], tau), eC = sstep(T.chest[0], T.chest[1], tau), eR = sstep(T.root[0], T.root[1], tau);
var tp = (u - P.Tland) / PS, stand = sstep(P.Tland, P.Tland + 1.0, u), wlk = 1 - sstep(P.Tn3, P.Tland + 0.4, u);
rootAt(P, u, rS); rS.y = HS.heightAt(rS.x, rS.z); curX = rS.x;
footAt(P.feet[0], u, ah, toe[0], fS[0]); footAt(P.feet[1], u, ah, toe[1], fS[1]);
var fwx = Math.sin(rS.yaw), fwz = Math.cos(rS.yaw);
var dL = (fS[0].x - rS.x) * fwx + (fS[0].z - rS.z) * fwz, dR = (fS[1].x - rS.x) * fwx + (fS[1].z - rS.z) * fwz;
var gs = iw * sstep(I.gust - 0.1, I.gust + 0.1, HS.gustAt(rS.x, rS.z, t));
var br = stand * Math.sin(TAU * t / I.breathT + 0.6), sh = iw * shiftAt(ti);
var dx = (AN.sway + 0.005 * bump(tau, 0.3, 0.5, 1.35, 1.6)) * (fS[1].swing - fS[0].swing) + sh * I.shift.dx;
var hry = -AN.pelvisYaw * (dL - dR), hrz = AN.pelvisRoll * (fS[0].swing - fS[1].swing) + sh * I.shift.roll;
rig.reset(); rig.setRoot(rS.x, rS.y, rS.z, rS.yaw); rig.setHips(dx, 0, 0, 0, hry, hrz);
var need = -1;
for (i = 0; i < 2; i++) {
(i ? J.hipR : J.hipL).getWorldPosition(hp);
var ex = hp.x - fS[i].x, ez = hp.z - fS[i].z;
need = Math.max(need, hp.y - fS[i].y - Math.sqrt(Math.max(0, reach[i] * reach[i] - ex * ex - ez * ez)));
}
var env = dropEnvelope(u), na = needAt(u); dbgv.env = env; dbgv.need = need; dbgv.na = na;
var drop = Math.max(authored(u), Math.max(0, env + need - na) + AN.kneeMargin) + AN.sink * bump(tp, 0, 2, 2, 4.5) + I.breath * stand * (1 - Math.sin(TAU * t / I.breathT + 0.6));
rig.setHips(dx, -drop, 0, 0, hry, hrz);
var gl0 = -AN.glance.deg * bump(u, P.tGl, P.tGl + 0.17, P.tGl + 0.42, P.tGl + 0.67);
var lean = AN.lean * sstep(0, 0.6, u) * wlk + AN.leanStand * (1 - wlk) + gs * 1.5 * DEG;
var tw = (AN.shoulderYaw + AN.pelvisYaw) * (dL - dR) + P.delta * (eC - eR);
var rock = AN.rock * wlk * sstep(0, 0.6, u) * Math.cos(TAU * (rS.q - 0.05));
rig.rot('spine', lean * 0.6 + 0.004 * br + rock * 0.6, 0.4 * tw, -0.5 * hrz);
rig.rot('chest', lean * 0.4 + 0.006 * br + rock * 0.4, 0.6 * tw, -0.4 * hrz);
var aL = AN.arm * dL, aR = AN.arm * dR;
rig.rot('shoulderL', aL, 0, AN.armOut + 0.012 * br); rig.rot('shoulderR', aR, 0, -AN.armOut - 0.012 * br);
rig.rot('elbowL', -(AN.elbow + AN.elbowSwing * Math.max(0, -aL)), 0, 0); rig.rot('elbowR', -(AN.elbow + AN.elbowSwing * Math.max(0, -aR)), 0, 0);
rig.rot('head', AN.nod * wlk * Math.cos(TAU * (rS.q - 0.27)) + AN.settleNod * bump(tp, 0, 2.5, 3, 6), 0, -0.09 * (gl0 / AN.glance.deg));
oL.footPitch = fS[0].pitch; oL.footYaw = fS[0].yaw - rS.yaw; oR.footPitch = fS[1].pitch; oR.footYaw = fS[1].yaw - rS.yaw;
rig.solveLeg('L', tg.set(fS[0].x, fS[0].y, fS[0].z), oL); rig.solveLeg('R', tg.set(fS[1].x, fS[1].y, fS[1].z), oR);
var bt = -(AN.bridgeTurn[0] + (AN.bridgeTurn[1] - AN.bridgeTurn[0]) * sstep(P.Tb0, P.Tland, u)) * sstep(P.Tb0 - 0.25, P.Tb0 + 0.25, u);
var lh = (tau > 0 ? P.psi0 : rS.yaw) + gl0 + bt, le = AN.chinUp + AN.glance.up * (gl0 / -AN.glance.deg);
lh += (P.psiB - lh) * eH; le += (I.bridgeEl - le) * eH;
beats(ti, bs);
lh += iw * (bs.yaw + 0.012 * nz(t * 0.31, 1.7)); le += iw * (bs.pit + 0.008 * nz(t * 0.27 + 5, 3.3)) + gs * 4 * DEG;
var ce = Math.cos(le);
rig.lookAt(aim.set(rS.x + 30 * Math.sin(lh) * ce, rS.y + 1.0 + 30 * Math.sin(le), rS.z + 30 * Math.cos(lh) * ce), 1);
model.root.visible = !hidden; model.scarf.mesh.visible = !hidden;
if (hidden) { U.uPrincePos.value.set(999, 0, 999); } else { U.uPrincePos.value.set(rS.x, rS.y, rS.z); }
rig.update(dt, t, frame);
if (!arrived && !hidden && u >= P.Tland - 1e-6) { arrived = true; ctx.events.arrive(); }
if (!turned && !hidden && tau >= T.root[1] - 1e-6) { turned = true; ctx.events.turn(); }
}
function place() { pose(lastT, 0, 0); rig.teleport(); rig.update(0, lastT, 0); }
function layout(view) {
var sp = ctx.walkSpeed || 1, u, tIdle, idleNow;
if (!plan) { newPlan(view.startX, view.stopX, view); return; }
if (Math.abs(view.stopX - plan.reqStop) < 0.002 && (skipped || arrived || Math.abs(view.startX - plan.reqStart) < 0.002)) { return; }
u = (lastT - baseT) * sp; idleNow = skipped || u >= plan.Tt1;
tIdle = skipped ? idleT0 : baseT + plan.Tt1 / sp;
if (skipped || arrived || (u > 0 && curX - view.stopX < 0.35)) {
newPlan(view.startX, view.stopX, view); skipped = true; idleT0 = idleNow && tIdle !== null ? tIdle : null;
if (!arrived) { arrived = true; ctx.events.arrive(); }
place();
} else if (u > 0) { newPlan(curX, view.stopX, view); baseT = lastT; place(); }
else { newPlan(view.startX, view.stopX, view); }
}
function skip() { skipped = true; idleT0 = null; if (!arrived) { arrived = true; ctx.events.arrive(); } if (!plan) { newPlan(ctx.view.startX, ctx.view.stopX); } place(); }
function update(dt, t, frame) { lastT = t; if (!plan) { newPlan(ctx.view.startX, ctx.view.stopX); } pose(t, dt, frame); }
return { update: update, layout: layout, skip: skip, pose: pose, plan: function () { return plan; }, root: rS, feet: fS, dbg: dbgv };
}
var POSES = {
rest: { joints: {} },
stride: { joints: {
hipL: [-0.436, 0, 0], kneeL: [0.12, 0, 0], ankleL: [-0.16, 0, 0],
hipR: [0.35, 0, 0], kneeR: [0.70, 0, 0], ankleR: [0.30, 0, 0],
shoulderR: [-0.26, 0, 0], elbowR: [-0.30, 0, 0], shoulderL: [0.26, 0, 0], elbowL: [-0.18, 0, 0],
spine: [0, 0.05, 0], chest: [0, -0.06, 0]
} },
flex: { joints: {
hipL: [-0.8, 0, 0], kneeL: [1.22, 0, 0], ankleL: [-0.3, 0, 0], hipR: [0.2, 0, 0.15], kneeR: [0.5, 0, 0],
shoulderR: [-0.9, 0, 0], elbowR: [-1.4, 0, 0], wristR: [-0.4, 0, 0], shoulderL: [0.3, 0, 0.5], elbowL: [-0.6, 0, 0],
spine: [-0.2, 0, 0.1], chest: [-0.1, 0, 0], neck: [0.1, 0, 0], head: [-0.25, 0.3, 0]
} }
};
HS.register('prince', function (ctx) {
var model = buildPrince(ctx), rig = createRig(model, ctx), dbg = ctx.debug || {}, staged = !!dbg.pose;
var anim = staged ? null : createAnimator(model, rig, ctx);
var stage = new V3(), yaw = (parseFloat(dbg.yaw) || 0) * Math.PI / 180, tgt = new V3(), rest = new V3(), cur = new V3(), curYaw = yaw;
var modes = String(dbg.pose || 'rest').split(/[+,\s]+/), SIDES = ['L', 'R'];
function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
function has(m) { return modes.indexOf(m) >= 0; }
ctx.scene.add(model.root);
function stagePose(t) {
var m, fx, fy, fz, sg, sd, c, s, ph = 2 * Math.PI * (t || 0) / num(dbg.period, 4);
curYaw = has('turn') ? yaw + num(dbg.turnamp, 100) * Math.PI / 180 * Math.sin(ph) : yaw;
cur.set(has('pace') ? stage.x + 0.6 * Math.sin(ph) : stage.x, 0, stage.z); cur.y = HS.heightAt(cur.x, cur.z);
rig.setRoot(cur.x, cur.y, cur.z, curYaw);
c = Math.cos(curYaw); s = Math.sin(curYaw);
rig.reset();
for (m = 0; m < modes.length; m++) { if (POSES[modes[m]]) { rig.applyPose(POSES[modes[m]], true); } }
if (has('ik')) {
fx = num(dbg.fx, 0); fy = num(dbg.fy, 0); fz = num(dbg.fz, 0);
rig.setHips(0, num(dbg.hy, 0), 0, 0, 0, 0);
for (m = 0; m < 2; m++) {
sd = SIDES[m]; sg = m === 0 ? 1 : -1; rig.footRestWorld(sd, rest);
tgt.set(rest.x + sg * (fx * s + fz * c), 0, rest.z + sg * (fx * c - fz * s));
tgt.y = Math.max(rest.y + sg * fy, rig.groundY(tgt.x, tgt.z) + model.dims.ankleY);
rig.solveLeg(sd, tgt);
}
}
if (has('look')) { rig.lookAt(tgt.set(num(dbg.lookx, 0), num(dbg.looky, 1.1), num(dbg.lookz, 8)), 1); }
}
function place(t) { stagePose(t); rig.update(0, t, 0); rig.teleport(); rig.update(0, t, 0); HS.U.uPrincePos.value.copy(cur); }
function layout(view) {
stage.set(view.stopX, HS.heightAt(view.stopX, HS.LAYOUT.princeZ), HS.LAYOUT.princeZ);
place(0);
}
return {
model: model, rig: rig, anim: anim,
update: function (dt, t, frame) {
if (anim) { anim.update(dt, t, frame); return; }
stagePose(t); rig.update(dt, t, frame);
HS.U.uPrincePos.value.copy(cur);
},
layout: function (view) { if (anim) { anim.layout(view); } else { layout(view); } },
skip: function () { if (anim) { anim.skip(); } else { place(0); } },
dispose: function () { rig.dispose(); if (model.root.parent) { model.root.parent.remove(model.root); } model.dispose(); }
};
});
})(window);
;
(function (global) {
'use strict';
var THREE = global.THREE, HS = global.HS;
if (!THREE || !HS) { return; }
var TAG = {
text: 'Denis',
fontM: 0.0165,
gapM: 0.09,
minPx: 2,
holdN: 0.12,
holdPos: 0.75,
renderOrder: 100
};
var LOOK = { lum: 0.26, boost: 1.2, clear: 0.15, hdr: 1.0, knee: 0.62, range: 0.38, paperMax: 0.995 };
var PAD = 1;
function lum(c) { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }
function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
function unshoulder(v) {
v = Math.min(v, LOOK.paperMax);
return v <= LOOK.knee ? v : LOOK.knee - LOOK.range * Math.log(1 - (v - LOOK.knee) / LOOK.range);
}
function paperWhite(P) {
var best = new THREE.Color(1, 1, 1), bl = -1;
['sunDisc', 'cloud', 'fill'].forEach(function (k) {
if (!P[k]) { return; }
var c = new THREE.Color(P[k]), l = lum(c);
if (l > bl) { bl = l; best = c; }
});
return best;
}
function derive(ctx) {
var P = ctx.palette, dbg = ctx.debug || {};
var lumT = num(dbg.taglum, LOOK.lum), clear = num(dbg.tagclear, LOOK.clear), boost = num(dbg.tagboost, LOOK.boost);
var sky = new THREE.Color(P.skyHorizon).lerp(new THREE.Color(P.skyMid), 0.5);
var ls = Math.max(lum(sky), 1e-4);
var box = [sky.r, sky.g, sky.b].map(function (c) { return Math.max(0, (ls + (c - ls) * boost) / ls * lumT); });
var paper = paperWhite(P);
return {
box: new THREE.Color(box[0], box[1], box[2]),
lin: { clear: clear, ink: new THREE.Color(unshoulder(paper.r), unshoulder(paper.g), unshoulder(paper.b)) },
dir: { clear: Math.pow(clear, 1 / 2.4), ink: new THREE.Color(Math.min(1, paper.r), Math.min(1, paper.g), Math.min(1, paper.b)) }
};
}
var VERT = [
'varying vec2 vUv; varying vec3 vWorldPos;',
'void main(){',
'  vUv = uv;',
'  vec4 wp = modelMatrix * vec4(position, 1.0);',
'  vWorldPos = wp.xyz;',
'  gl_Position = projectionMatrix * viewMatrix * wp;',
'}'
].join('\n');
var FRAG = [
HS.GLSL.uniforms,
HS.GLSL.sky,
'uniform sampler2D uMap; uniform vec2 uTexSize; uniform vec3 uBox; uniform float uClear; uniform float uHdr; uniform float uSunAddK; uniform float uDirect; uniform vec3 uInk;',
'varying vec2 vUv; varying vec3 vWorldPos;',
'// the sun disc and glow the sky shader adds on top of hsSky (same terms as envSunAdd in hs-env.js)',
'vec3 tagSunAdd(vec3 dir){',
'  vec3 dv = dir - uSunDir; float a2 = dot(dv, dv);',
'  float core = exp(-a2 / (2.0 * 0.0155 * 0.0155));',
'  float mid = exp(-a2 / (2.0 * 0.045 * 0.045));',
'  float halo = exp(-a2 / (2.0 * 0.16 * 0.16));',
'  return (uSunDisc * core * 1.25 + uSunGlow * (mid * 0.42 + halo * 0.14)) * uSunAddK;',
'}',
'vec3 tagEnc(vec3 c){ c = max(c, vec3(0.0)); return mix(1.055 * pow(c, vec3(0.41666)) - 0.055, 12.92 * c, vec3(lessThanEqual(c, vec3(0.0031308)))); }',
'vec3 tagDec(vec3 c){ c = max(c, vec3(0.0)); return mix(pow((c + 0.055) / 1.055, vec3(2.4)), c / 12.92, vec3(lessThanEqual(c, vec3(0.04045)))); }',
'void main(){',
'  // lettering: "sharp bilinear" lookup, every font pixel is flat and only a one screen pixel wide ramp joins neighbours (a no-op while the tag sits on the pixel grid)',
'  vec2 tc = vUv * uTexSize;',
'  vec2 sc = max(vec2(1.0), 1.0 / max(fwidth(tc), vec2(1e-4)));      // screen pixels per font pixel',
'  vec2 d = fract(tc) - 0.5;',
'  vec2 f = (d - clamp(d, -(0.5 - 0.5 / sc), 0.5 - 0.5 / sc)) * sc + 0.5;',
'  float ink = texture2D(uMap, (floor(tc) + f) / uTexSize).r;',
'  // veil: the sky expected behind this pixel, and the box colour we want over it. `ce` is the share of the real backdrop that may show through: at most uClear,',
'  // less where the sky is so bright that the box colour would be overshot (then the veil is a plain darker tint of the target colour).',
'  vec3 dir = normalize(vWorldPos - cameraPosition);',
'  vec3 back = (hsSky(dir) + tagSunAdd(dir)) * uHdr;',
'  vec3 box = uBox;',
'  if (uDirect > 0.5) { box = tagEnc(box); back = tagEnc(min(back, vec3(1.0))); }          // no post pass: the blend runs on encoded values',
'  vec3 q = box / max(back, vec3(1e-3));',
'  float ce = min(uClear, min(q.r, min(q.g, q.b)));',
'  vec3 veil = box - ce * back;                                                              // premultiplied; never negative because ce <= box / back',
'  if (uDirect > 0.5) { veil = tagDec(veil); }                                               // the colour-space chunk below encodes it again',
'  // premultiplied "over": veil + backdrop * (1 - alpha), lettering opaque on top',
'  gl_FragColor = vec4(mix(veil, uInk, ink), mix(1.0 - ce, 1.0, ink));',
'  #include <colorspace_fragment>',
'}'
].join('\n');
HS.register('tag', function (ctx) {
var prince = ctx.mods && ctx.mods.prince, model = prince && prince.model;
var head = model && model.joints && (model.joints.head || model.joints.neck);
if (!head || !HS.FONT) { return { update: function () {}, layout: function () {}, dispose: function () {} }; }
var scene = ctx.scene, dims = model.dims || {};
var lift = (dims.hairTop != null && dims.chinY != null ? dims.hairTop - dims.chinY : 0.31) + TAG.gapM;
var fontM = num((ctx.debug || {}).tagfont, TAG.fontM);
var bm = HS.FONT.bitmap(TAG.text, PAD), TW = bm.w, TH = bm.h;
var data = new Uint8Array(TW * TH * 4), x, y, o;
for (y = 0; y < TH; y++) {
for (x = 0; x < TW; x++) {
o = ((TH - 1 - y) * TW + x) * 4;
data[o] = data[o + 1] = data[o + 2] = bm.ink[y * TW + x]; data[o + 3] = 255;
}
}
var tex = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat, THREE.UnsignedByteType);
tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
var look = derive(ctx), mode = '';
var uniforms = HS.shared({
uMap: { value: tex }, uTexSize: { value: new THREE.Vector2(TW, TH) },
uBox: { value: look.box }, uClear: { value: look.lin.clear }, uHdr: { value: num((ctx.debug || {}).taghdr, LOOK.hdr) },
uSunAddK: { value: ctx.paletteName === 'day' ? 0.5 : 1.0 },
uDirect: { value: 0 }, uInk: { value: new THREE.Color() }
});
var mat = new THREE.ShaderMaterial({
uniforms: uniforms, vertexShader: VERT, fragmentShader: FRAG,
transparent: true, depthWrite: true, depthTest: true, side: THREE.FrontSide,
blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor
});
mat.extensions = { derivatives: true };
var geo = new THREE.PlaneGeometry(1, 1);
var mesh = new THREE.Mesh(geo, mat);
mesh.name = 'nameTag'; mesh.frustumCulled = false; mesh.renderOrder = TAG.renderOrder;
scene.add(mesh);
function setMode(direct) {
var m = direct ? 'direct' : 'linear';
if (m === mode) { return; }
mode = m;
var c = direct ? look.dir : look.lin;
uniforms.uClear.value = c.clear; uniforms.uInk.value.copy(c.ink); uniforms.uDirect.value = direct ? 1 : 0;
mat.uniformsNeedUpdate = true;
}
var V = new THREE.Vector3(), Q = new THREE.Quaternion(), SZ = new THREE.Vector2();
var st = { ok: false, W: 0, H: 0, N: 0, L: 0, B: 0, shown: false };
function collapse() { st.shown = false; mesh.scale.set(0, 0, 0); mesh.updateMatrix(); mesh.matrixWorld.copy(mesh.matrix); }
function place(renderer, camera) {
if (!model.root.visible) { collapse(); return; }
var rt = renderer.getRenderTarget(), W, H;
if (rt) { W = rt.width; H = rt.height; } else { renderer.getDrawingBufferSize(SZ); W = SZ.x; H = SZ.y; }
setMode(!rt);
head.getWorldPosition(V); V.y += lift;
V.applyMatrix4(camera.matrixWorldInverse);
var d = -V.z;
if (!(d > 0.05) || !(W > 0) || !(H > 0)) { collapse(); return; }
var pe = camera.projectionMatrix.elements, e0 = pe[0], e5 = pe[5];
var ax = (V.x * e0 / d * 0.5 + 0.5) * W, ay = (V.y * e5 / d * 0.5 + 0.5) * H;
var ideal = fontM * H * e5 / (2 * d);
var fresh = !st.ok || st.W !== W || st.H !== H;
if (fresh || Math.abs(ideal - st.N) > 0.5 + TAG.holdN) { st.N = Math.max(TAG.minPx, Math.round(ideal)); fresh = true; }
var N = st.N, il = ax - TW * 0.5 * N;
if (fresh || Math.abs(il - st.L) > TAG.holdPos) { st.L = Math.round(il); }
if (fresh || Math.abs(ay - st.B) > TAG.holdPos) { st.B = Math.round(ay); }
st.W = W; st.H = H; st.ok = true; st.shown = true;
var cx = st.L + TW * 0.5 * N, cy = st.B + TH * 0.5 * N;
V.set((cx / W * 2 - 1) * d / e0, (cy / H * 2 - 1) * d / e5, -d).applyMatrix4(camera.matrixWorld);
camera.getWorldQuaternion(Q);
mesh.position.copy(V); mesh.quaternion.copy(Q);
mesh.scale.set(TW * N * 2 * d / (e0 * W), TH * N * 2 * d / (e5 * H), 1);
mesh.updateMatrix(); mesh.matrixWorld.copy(mesh.matrix);
}
mesh.onBeforeRender = function (renderer, sc, camera) { try { place(renderer, camera); } catch (e) { collapse(); } };
return {
mesh: mesh,
update: function () {  },
layout: function () { st.ok = false; },
info: function () { return { w: TW, h: TH, N: st.N, left: st.L, bottom: st.B, target: [st.W, st.H], mode: mode, lift: lift, shown: st.shown }; },
dispose: function () {
mesh.onBeforeRender = function () {};
if (mesh.parent) { mesh.parent.remove(mesh); }
geo.dispose(); mat.dispose(); tex.dispose();
}
};
});
})(window);
;
(function (global) {
'use strict';
var THREE = global.THREE, HS = global.HS;
if (!THREE || !HS) { return; }
var MODULE_ORDER = ['env', 'hill', 'prince', 'tag'];
var LEVELS = [
{ density: 1,    dpr: 1,    taps: 1,   dof: true  },
{ density: 0.65, dpr: 1,    taps: 1,   dof: true  },
{ density: 0.65, dpr: 0.8,  taps: 1,   dof: true  },
{ density: 0.65, dpr: 0.8,  taps: 0.5, dof: true  },
{ density: 0.4,  dpr: 0.8,  taps: 0.5, dof: true  },
{ density: 0.4,  dpr: 0.8,  taps: 0.5, dof: false },
{ density: 0.4,  dpr: 0.64, taps: 0.5, dof: false }
];
var GOV = {
stepMs: 45, smoothMs: 24, alphaStep: 0.30, alphaSmooth: 0.08,
sustainMs: 1000, settleMs: 1500, coolMs: 1500, minSamples: 4,
probeMs: 52, probeTicks: 12, probeFastAt: 8, probeFastMs: 20, probeEveryMs: 8000, probeMaxMs: 60000,
dprFloor: 0.5
};
function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
function rendererName(gl) {
try {
var dbg = gl.getExtension('WEBGL_debug_renderer_info');
return String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
} catch (e) { return ''; }
}
function classifyGPU(name) {
var s = String(name || '').toLowerCase();
if (!s) { return 'ok'; }
if (/swiftshader|llvmpipe|softpipe|lavapipe|software|basic render|gdi generic|mesa offscreen/.test(s)) { return 'software'; }
if (/mali-?4\d\d|mali-?t\d|powervr|videocore|vivante|\bgma\b|adreno[^0-9]{0,8}[234]\d\d\b/.test(s)) { return 'weak'; }
var m = /intel[^,]*hd graphics\s*(\d{3,4})?/.exec(s);
if (m && !/uhd|iris/.test(s) && (!m[1] || (m[1].length === 4 && +m[1] <= 5500))) { return 'weak'; }
return 'ok';
}
function pickQuality(opts, gpuClass) {
var coarse = false, small = false;
try { coarse = global.matchMedia && global.matchMedia('(pointer: coarse)').matches; } catch (e) {}
try { small = Math.min(global.screen.width, global.screen.height) < 700; } catch (e) {}
var auto = !(opts.quality && opts.quality !== 'auto');
var tier = auto ? ((coarse || small || gpuClass !== 'ok') ? 'low' : 'high') : opts.quality;
var Q = tier === 'low'
? { tier: 'low', dprCap: 1.25, msaa: 2, dofTaps: 18, baseBlades: 32000, blades: 32000, pixelBudget: 1.1e6, post: true }
: { tier: 'high', dprCap: 1.5, msaa: 4, dofTaps: 36, baseBlades: 96000, blades: 96000, pixelBudget: 2.6e6, post: true };
if (auto && gpuClass === 'software') {
Q.post = false; Q.soft = true; Q.msaa = 0; Q.dprCap = 1; Q.baseBlades = Q.blades = 12000; Q.pixelBudget = 0.5e6;
}
Q.gpuClass = gpuClass;
return Q;
}
var POST_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
var COC_GLSL = [
'uniform float uNear; uniform float uFar; uniform float uFocus; uniform float uNearScale; uniform float uFarScale; uniform float uNearMax; uniform float uFarMax;',
'float linDepth(float d){ float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }',
'float blurSize(float dist){ float c = (dist - uFocus) / max(dist, 0.001); return c < 0.0 ? min(-c * uNearScale, uNearMax) : min(c * uFarScale, uFarMax); }'
].join('\n');
function tapTable(n) {
var v = [], i, a;
for (i = 1; i <= n; i++) { a = i * 2.39996323; v.push('vec2(' + Math.cos(a).toFixed(7) + ',' + Math.sin(a).toFixed(7) + ')'); }
return 'const vec2 TAPDIR[' + n + '] = vec2[' + n + '](' + v.join(',') + ');';
}
function tapRun(a, b) {
return [
'  for (int i = ' + a + '; i <= ' + b + '; i++) {',
'    float fi = float(i);',
'    float r = sqrt(fi * invT) * maxR;',
'    vec2 tc2 = uv + TAPDIR[i - 1] * px * r;',
'    vec3 sc = textureLod(tColor, tc2, 0.0).rgb;',
'    float sd = linDepth(textureLod(tDepth, tc2, 0.0).x);',
'    float ss = blurSize(sd);',
'    if (sd > cd) ss = clamp(ss, 0.0, cs * 2.0);',
'    float m = smoothstep(r - 0.5, r + 0.5, ss) * step(fi, uTaps);',
'    col += mix(col / tot, sc, m); tot += 1.0;',
'  }'
].join('\n');
}
function postFrag(taps) {
return [
'uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tTile; uniform vec2 uRes; uniform float uDofOn; uniform float uTaps; uniform vec2 uTileRes;',
COC_GLSL,
'uniform float uDebugP;',
'uniform float uFrameP; uniform float uGrain; uniform float uVignette; uniform float uPaper; uniform float uExposure; uniform float uSat; uniform vec3 uTint;',
'varying vec2 vUv;',
tapTable(taps),
'float pHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
'float pNoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
'  return mix(mix(pHash(i), pHash(i + vec2(1.0, 0.0)), u.x), mix(pHash(i + vec2(0.0, 1.0)), pHash(i + vec2(1.0, 1.0)), u.x), u.y); }',
'vec3 dof(vec2 uv){',
'  vec3 col = textureLod(tColor, uv, 0.0).rgb;',
'  if (uDofOn < 0.5) return col;',
'  float maxR = max(uNearMax, uFarMax);',
'  // tile pre-pass: B = the largest blur (px) anywhere within reach of this pixel. A tap at radius r only contributes when its own blur exceeds',
'  // r - 0.5 (smoothstep below), and the running average is unchanged by a rejected tap, so taps with r >= B + 0.5 are skipped: same image.',
'  ivec2 tc = min(ivec2(floor(uv * uRes)) / 16, ivec2(uTileRes) - 1);',
'  float B = texelFetch(tTile, tc, 0).r * (255.0 / 8.0);',
'  float q = (B + 0.5) / maxR;',
'  float nT = min(uTaps, ceil(uTaps * q * q));',
'  float cd = linDepth(textureLod(tDepth, uv, 0.0).x);',
'  float cs = blurSize(cd);',
'  float tot = 1.0; vec2 px = 1.0 / uRes; float invT = 1.0 / uTaps;',
tapRun(1, Math.min(4, taps)),
taps > 4 ? '  if (nT > 4.0) {\n' + tapRun(5, Math.min(12, taps)) + '\n  }' : '',
taps > 12 ? '  if (nT > 12.0) {\n' + tapRun(13, taps) + '\n  }' : '',
'  return col / tot;',
'}',
'void main(){',
'  vec3 c = dof(vUv);',
'  if (uDebugP > 0.5) { float dd = linDepth(texture2D(tDepth, vUv).x); gl_FragColor = vec4(vec3(fract(dd * 0.25), clamp(dd / 30.0, 0.0, 1.0), blurSize(dd) / max(uNearMax, 1.0)), 1.0); return; }',
'  c *= uExposure * uTint;',
'  vec3 hi = max(c - 0.62, 0.0);',
'  c = min(c, 0.62) + 0.38 * (1.0 - exp(-hi / 0.38));',
'  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
'  c = mix(vec3(l), c, uSat);',
'  float vg = smoothstep(1.30, 0.35, length((vUv - 0.5) * vec2(1.0, 0.82)) * 1.65);',
'  c *= mix(1.0 - uVignette, 1.0, vg);',
'  gl_FragColor = vec4(c, 1.0);',
'  #include <colorspace_fragment>',
'  vec2 fp = vUv * uRes;',
'  float g = pHash(fp + vec2(uFrameP * 17.0, uFrameP * 29.0)) - 0.5;',
'  float fibre = pNoise(fp * vec2(0.09, 0.75)) * 0.6 + pNoise(fp * 0.42) * 0.4 - 0.5;',
'  gl_FragColor.rgb += g * uGrain;',
'  gl_FragColor.rgb *= 1.0 + fibre * uPaper;',
'}'
].join('\n');
}
var TILE_H_FRAG = [
'uniform sampler2D tDepth; uniform vec2 uRes;',
COC_GLSL,
'void main(){',
'  ivec2 p = ivec2(floor(gl_FragCoord.xy)); int x0 = p.x * 16, lim = int(uRes.x) - 1; float dmin = 1.0, dmax = 0.0;',
'  for (int i = 0; i < 16; i++) { float d = texelFetch(tDepth, ivec2(min(x0 + i, lim), p.y), 0).x; dmin = min(dmin, d); dmax = max(dmax, d); }',
'  float b = max(blurSize(linDepth(dmin)), blurSize(linDepth(dmax)));',
'  gl_FragColor = vec4(min(ceil(b * 8.0), 255.0) / 255.0, 0.0, 0.0, 1.0);',
'}'
].join('\n');
var TILE_V_FRAG = [
'uniform sampler2D tTileH; uniform vec2 uRes;',
'void main(){',
'  ivec2 p = ivec2(floor(gl_FragCoord.xy)); int y0 = p.y * 16, lim = int(uRes.y) - 1; float m = 0.0;',
'  for (int j = 0; j < 16; j++) { m = max(m, texelFetch(tTileH, ivec2(p.x, min(y0 + j, lim)), 0).r); }',
'  gl_FragColor = vec4(m, 0.0, 0.0, 1.0);',
'}'
].join('\n');
var DILATE_FRAG = [
'uniform sampler2D tTileV; uniform vec2 uTileRes; uniform float uDil;',
'void main(){',
'  ivec2 c = ivec2(floor(gl_FragCoord.xy)), lim = ivec2(uTileRes) - 1; int R = int(uDil); float m = 0.0;',
'  for (int j = -3; j <= 3; j++) { if (abs(j) > R) { continue; }',
'    for (int i = -3; i <= 3; i++) { if (abs(i) > R) { continue; } m = max(m, texelFetch(tTileV, clamp(c + ivec2(i, j), ivec2(0), lim), 0).r); } }',
'  gl_FragColor = vec4(m, 0.0, 0.0, 1.0);',
'}'
].join('\n');
function create(canvas, host, userOpts) {
var opts = {};
for (var k0 in (userOpts || {})) { if (Object.prototype.hasOwnProperty.call(userOpts, k0)) { opts[k0] = userOpts[k0]; } }
var debug = opts.debug || {};
var reduce = !!opts.reduceMotion;
var noPost = debug.post === '0' || debug.post === 0;
var renderer = new THREE.WebGLRenderer({
canvas: canvas, antialias: noPost, alpha: false, powerPreference: 'high-performance',
preserveDrawingBuffer: !!opts.preserve
});
var gpuName = debug.gpu != null ? String(debug.gpu) : rendererName(renderer.getContext());
var gpuClass = classifyGPU(gpuName);
var Q = pickQuality(opts, gpuClass);
if (!renderer.capabilities.isWebGL2 || noPost) { Q.post = false; }
Q.msaa = clamp(Math.round(num(debug.msaa, Q.msaa)), 0, 4);
var level = 0, levelForced = false, dprScale = 1, dofWanted = !(opts.dof === false || debug.dof === '0');
var disposed = false, ctxLost = false, dpr = 1;
function fitDpr(w, h) {
var d = Math.max(0.75, Math.min(Math.min(global.devicePixelRatio || 1, Q.dprCap), Math.sqrt(Q.pixelBudget / Math.max(1, w * h))));
return dprScale === 1 ? d : Math.max(GOV.dprFloor, d * dprScale);
}
if (debug.level != null && debug.level !== '') {
level = clamp(Math.round(num(debug.level, 0)), 0, LEVELS.length - 1); levelForced = true; dprScale = LEVELS[level].dpr;
}
dpr = Math.min(global.devicePixelRatio || 1, Q.dprCap) * dprScale;
renderer.setPixelRatio(dpr);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.info.autoReset = false;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.25, 2600);
camera.rotation.order = 'YXZ';
var restCam = new THREE.PerspectiveCamera();
var camBase = new THREE.Vector3();
var L = HS.LAYOUT;
var view = { aspect: 16 / 9, vfov: 32, pitch: 0, halfW: 4, stopX: 1.9, startX: 5, focus: 8, width: 1, height: 1, dpr: dpr, horizon: 0.62 };
var events = {
arrived: false, turned: false,
arrive: function () { if (events.arrived) { return; } events.arrived = true; if (opts.onArrive) { try { opts.onArrive(); } catch (e) {} } },
turn: function () { events.arrive(); if (events.turned) { return; } events.turned = true; if (opts.onTurned) { try { opts.onTurned(); } catch (e) {} } }
};
var ctx = {
THREE: THREE, HS: HS, scene: scene, camera: camera, renderer: renderer, U: HS.U,
palette: null, paletteName: 'golden', layout: L, quality: Q, opts: opts, debug: debug,
view: view, events: events, heightAt: HS.heightAt, reduceMotion: reduce, walkSpeed: 1, mods: {}
};
var rt = null, tileH = null, tileA = null, tileB = null, postScene = null, tileHScene = null, tileVScene = null, dilScene = null, postCam = null;
var postMat = null, tileHMat = null, tileVMat = null, dilMat = null, postGeo = null;
var pu = null;
var errors = [];
if (Q.post) {
try {
var hf = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
rt = new THREE.WebGLRenderTarget(2, 2, {
samples: Q.msaa, type: hf ? THREE.HalfFloatType : THREE.UnsignedByteType,
minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true
});
rt.depthTexture = new THREE.DepthTexture(2, 2);
rt.depthTexture.type = THREE.UnsignedIntType;
rt.depthTexture.minFilter = THREE.NearestFilter; rt.depthTexture.magFilter = THREE.NearestFilter;
function tileTarget() {
return new THREE.WebGLRenderTarget(2, 2, { type: THREE.UnsignedByteType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
}
tileH = tileTarget(); tileA = tileTarget(); tileB = tileTarget();
pu = {
tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, tTile: { value: tileB.texture }, uRes: { value: new THREE.Vector2(2, 2) },
uTileRes: { value: new THREE.Vector2(1, 1) }, uDil: { value: 1 }, uTaps: { value: Q.dofTaps },
uNear: { value: camera.near }, uFar: { value: camera.far },
uFocus: { value: 8 }, uNearScale: { value: 7.0 }, uFarScale: { value: 4.2 }, uNearMax: { value: 14 }, uFarMax: { value: 3.2 },
uDofOn: { value: 1 }, uDebugP: { value: debug.depthview === '1' ? 1 : 0 },
uFrameP: { value: 0 }, uGrain: { value: 0.035 }, uVignette: { value: 0.22 }, uPaper: { value: 0.05 },
uExposure: { value: 1.0 }, uSat: { value: 1.04 }, uTint: { value: new THREE.Vector3(1, 1, 1) }
};
function post(frag, uniforms, defines) {
return new THREE.ShaderMaterial({ defines: defines || {}, uniforms: uniforms, vertexShader: POST_VERT, fragmentShader: frag, depthTest: false, depthWrite: false });
}
postMat = post(postFrag(Q.dofTaps), pu, { TAPS: Q.dofTaps });
tileHMat = post(TILE_H_FRAG, pu);
tileVMat = post(TILE_V_FRAG, { tTileH: { value: tileH.texture }, uRes: pu.uRes });
dilMat = post(DILATE_FRAG, { tTileV: { value: tileA.texture }, uTileRes: pu.uTileRes, uDil: pu.uDil });
postGeo = new THREE.PlaneGeometry(2, 2);
postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
postScene = new THREE.Scene(); tileHScene = new THREE.Scene(); tileVScene = new THREE.Scene(); dilScene = new THREE.Scene();
[[postScene, postMat], [tileHScene, tileHMat], [tileVScene, tileVMat], [dilScene, dilMat]].forEach(function (p) {
var quad = new THREE.Mesh(postGeo, p[1]); quad.frustumCulled = false; p[0].add(quad);
});
} catch (e) {
[rt, tileH, tileA, tileB].forEach(function (t) { if (t) { t.dispose(); } });
[postMat, tileHMat, tileVMat, dilMat].forEach(function (m) { if (m) { m.dispose(); } }); if (postGeo) { postGeo.dispose(); }
rt = tileH = tileA = tileB = postScene = tileHScene = tileVScene = dilScene = postMat = tileHMat = tileVMat = dilMat = postGeo = pu = null;
errors.push('post: ' + (e && e.message));
}
}
var mods = {}, modList = [];
var fps = 12, stepped = true;
function disposeObject(o) {
if (o.geometry && o.geometry.dispose) { o.geometry.dispose(); }
if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m && m.dispose) { m.dispose(); } }); }
}
function teardownModules() {
for (var i = 0; i < modList.length; i++) { if (modList[i].dispose) { try { modList[i].dispose(); } catch (e) {} } }
mods = {}; modList = []; ctx.mods = mods;
var kids = scene.children.slice();
for (var j = 0; j < kids.length; j++) { scene.remove(kids[j]); kids[j].traverse(disposeObject); }
}
function buildModules() {
var palette = HS.applyPalette(opts.palette || 'golden');
ctx.palette = palette; ctx.paletteName = HS.paletteName; ctx.opts = opts;
ctx.walkSpeed = opts.walkSpeed == null ? 1 : Math.max(0.3, +opts.walkSpeed);
var density = (opts.density == null ? 1 : Math.max(0.3, Math.min(2, +opts.density))) * num(debug.bladesx, 1);
Q.blades = Math.round(Q.baseBlades * density);
fps = Math.max(4, num(opts.fps, 12));
stepped = opts.stopMotion !== false && !reduce;
HS.U.uBoil.value = stepped ? 1 : 0;
HS.U.uPrincePos.value.set(999, 0, 999);
HS.U.uTime.value = 0; HS.U.uFrame.value = 0;
scene.background = new THREE.Color(palette.skyHorizon);
events.arrived = false; events.turned = false;
var only = debug.mods ? String(debug.mods).split(',') : null;
ctx.mods = mods;
MODULE_ORDER.forEach(function (name) {
if (only && only.indexOf(name) < 0) { return; }
var f = HS.modules[name];
if (!f) { return; }
try { var m = f(ctx) || {}; mods[name] = m; modList.push(m); }
catch (e) { errors.push(name + ': ' + (e && e.message)); if (global.console) { console.error('[HillScene] module "' + name + '" failed', e); } }
});
ctx.mods = mods;
if (!mods.hill) {
var gg = new THREE.PlaneGeometry(40, 24, 80, 48); gg.rotateX(-Math.PI / 2);
var gp = gg.attributes.position;
for (var i = 0; i < gp.count; i++) { gp.setY(i, HS.heightAt(gp.getX(i), gp.getZ(i) + 2)); }
gg.computeVertexNormals();
var ground = new THREE.Mesh(gg, HS.makePaperMaterial({ color: palette.grassMid, crumple: 0.2, rim: 0.1, fiber: 0.3, boil: 0 }));
ground.position.z = 2; scene.add(ground);
}
if (!mods.prince) { events.turn(); }
if (postMat) { pu.uSat.value = HS.paletteName === 'golden' ? 1.04 : 1.06; }
applyLevelState();
}
function applyLevelState() {
var spec = LEVELS[level];
if (mods.hill && mods.hill.setDensity) { mods.hill.setDensity(spec.density); }
if (postMat) {
pu.uTaps.value = Math.max(4, Math.round(Q.dofTaps * spec.taps));
pu.uDofOn.value = (dofWanted && spec.dof) ? 1 : 0;
}
dirty = true;
}
function setLevelInternal(n) {
n = clamp(Math.round(n), 0, LEVELS.length - 1);
var oldScale = dprScale;
level = n; dprScale = LEVELS[n].dpr;
applyLevelState();
if (dprScale !== oldScale && lastW) { layoutSize(); }
govReset(GOV.settleMs);
}
var lookTarget = null;
var trackOff = new THREE.Vector3();
var dirty = true, lastW = 0, lastH = 0, appliedW = 0, appliedH = 0, appliedDpr = 0, layoutPending = false, lastLayoutAt = 0;
function layoutSize() {
var w = lastW, h = lastH;
dpr = fitDpr(w, h);
view.dpr = dpr;
if (w !== appliedW || h !== appliedH || dpr !== appliedDpr) { renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); appliedW = w; appliedH = h; appliedDpr = dpr; }
if (rt) {
var rw = Math.max(2, Math.floor(w * dpr)), rh = Math.max(2, Math.floor(h * dpr));
rt.setSize(rw, rh);
pu.uRes.value.set(rw, rh);
var s = rh / 820;
pu.uNearMax.value = num(debug.nearmax, 10) * s; pu.uFarMax.value = num(debug.farblur, 3.0) * s;
pu.uNearScale.value = num(debug.nearscale, 3.6) * s; pu.uFarScale.value = 4.2 * s;
pu.uFocus.value = view.focus;
var tw = Math.ceil(rw / 16), th = Math.ceil(rh / 16);
tileH.setSize(tw, rh); tileA.setSize(tw, th); tileB.setSize(tw, th);
pu.uTileRes.value.set(tw, th); pu.uDil.value = Math.min(3, Math.ceil((Math.max(pu.uNearMax.value, pu.uFarMax.value) + 1.5) / 16));
}
dirty = true;
}
function layout() {
lastW = Math.max(1, host.clientWidth || canvas.clientWidth || 1); lastH = Math.max(1, host.clientHeight || canvas.clientHeight || 1);
var w = lastW, h = lastH;
var aspect = w / h;
dpr = fitDpr(w, h);
var vfov = aspect >= 1.45 ? 32 : aspect >= 0.95 ? 38 : 46;
var horizon = aspect >= 0.95 ? 0.62 : 0.72;
var fx = aspect >= 1.45 ? 0.735 : aspect >= 0.95 ? 0.72 : 0.66;
vfov = num(debug.fov, vfov); horizon = num(debug.horizon, horizon); fx = num(debug.fx, fx);
var tanH = Math.tan(THREE.MathUtils.degToRad(vfov / 2));
var pitch = Math.atan((horizon - 0.5) * 2 * tanH);
var eye = HS.heightAt(0, L.camZ) + num(debug.eye, L.eyeHeight);
camBase.set(0, eye, L.camZ);
var depth = L.camZ - L.princeZ;
var halfW = tanH * aspect * depth;
view.aspect = aspect; view.vfov = vfov; view.pitch = pitch; view.halfW = halfW; view.horizon = horizon;
view.stopX = (fx * 2 - 1) * halfW; view.startX = halfW + 0.55;
view.focus = Math.sqrt(depth * depth + view.stopX * view.stopX);
view.width = w; view.height = h; view.dpr = dpr;
camera.fov = vfov; camera.aspect = aspect;
camera.position.copy(camBase); camera.rotation.set(pitch, 0, 0);
lookTarget = null;
var py = HS.heightAt(view.stopX, L.princeZ);
if (debug.cam) {
var c = String(debug.cam), t = new THREE.Vector3(view.stopX, py + 0.62, L.princeZ), d = num(debug.dist, 2.6);
if (c === 'front') { camera.position.set(t.x, t.y + 0.1, t.z + d); }
else if (c === 'back') { camera.position.set(t.x, t.y + 0.1, t.z - d); }
else if (c === 'side') { camera.position.set(t.x - d, t.y + 0.1, t.z); }
else if (c === 'side2') { camera.position.set(t.x + d, t.y + 0.1, t.z); }
else if (c === 'top') { camera.position.set(t.x, t.y + d, t.z + 0.01); }
else if (c === 'q') { camera.position.set(t.x - d * 0.6, t.y + 0.35, t.z + d * 0.8); }
else { camera.position.set(t.x + 0.4, t.y + 0.15, t.z + d); }
lookTarget = t; camera.fov = num(debug.fov, 30);
}
if (debug.cx != null || debug.lx != null) {
camera.position.set(num(debug.cx, camera.position.x), num(debug.cy, camera.position.y), num(debug.cz, camera.position.z));
lookTarget = new THREE.Vector3(num(debug.lx, view.stopX), num(debug.ly, py + 0.6), num(debug.lz, 0));
}
if (lookTarget) { camera.lookAt(lookTarget); view.focus = camera.position.distanceTo(lookTarget); trackOff.copy(camera.position).sub(lookTarget); }
camera.updateProjectionMatrix();
restCam.copy(camera); restCam.updateMatrixWorld(true);
layoutSize();
for (var i = 0; i < modList.length; i++) { if (modList[i].layout) { try { modList[i].layout(view); } catch (e) { errors.push('layout: ' + e.message); } } }
layoutPending = false; lastLayoutAt = now();
govReset(GOV.settleMs);
dirty = true;
}
var pins = [], pinV = new THREE.Vector3(), pinD = new THREE.Vector3();
function updatePins() {
if (!pins.length || !lastW || !lastH) { return; }
var r = global.devicePixelRatio || 1, i, p, el, cx, cy, x, y;
for (i = 0; i < pins.length; i++) {
p = pins[i]; el = p.el;
if (!el.offsetParent) { continue; }
cx = el.offsetLeft + el.offsetWidth / 2; cy = el.offsetTop + el.offsetHeight / 2;
pinV.set(cx / lastW * 2 - 1, 1 - cy / lastH * 2, 0.5).unproject(restCam);
pinD.copy(pinV).sub(restCam.position).normalize();
pinV.copy(restCam.position).addScaledVector(pinD, p.depth).project(camera);
x = Math.round(((pinV.x * 0.5 + 0.5) * lastW - cx) * r) / r; y = Math.round(((0.5 - pinV.y * 0.5) * lastH - cy) * r) / r;
if (x !== p.x || y !== p.y) { p.x = x; p.y = y; el.style.transform = x || y ? 'translate3d(' + x + 'px,' + y + 'px,0)' : ''; }
}
}
function unpin(el) { for (var i = pins.length - 1; i >= 0; i--) { if (pins[i].el === el) { if (pins[i].x || pins[i].y) { el.style.transform = ''; } pins.splice(i, 1); } } }
function pin(el, o) {
if (!el || !el.style) { return; }
unpin(el);
pins.push({ el: el, depth: Math.max(1, num(o && o.depth, L.camZ - L.bridge.z)), x: 0, y: 0 });
if (ready && !ctxLost) { camera.updateMatrixWorld(); updatePins(); }
}
var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
function onPointer(ev) {
if (reduce || lookTarget) { return; }
var r = host.getBoundingClientRect();
target.x = ((ev.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
target.y = ((ev.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
}
host.addEventListener('pointermove', onPointer);
var govOn = !opts.static && !reduce && !levelForced;
var gov = { ema: 0, n: 0, over: 0, settleUntil: 0, prevNow: 0, prevRendered: false, steps: 0, probe: null, nextProbe: 0, hits: 0, probeMs: 0, backoff: GOV.probeEveryMs };
function govReset(ms) {
gov.ema = 0; gov.n = 0; gov.over = 0; gov.prevRendered = false; gov.probe = null; gov.hits = 0; gov.backoff = GOV.probeEveryMs; gov.settleUntil = now() + (ms || 0); gov.nextProbe = gov.settleUntil;
}
function effective(n) { var sp = LEVELS[n], dofLevels = postMat && dofWanted; return [sp.density, sp.dpr, dofLevels ? sp.taps : 0, dofLevels ? sp.dof : 0].join(); }
function govStep() {
var n = level + 1;
while (n < LEVELS.length - 1 && effective(n) === effective(level)) { n++; }
if (n > LEVELS.length - 1 || effective(n) === effective(level)) { govOn = false; return; }
gov.steps++; setLevelInternal(n); govReset(GOV.settleMs + GOV.coolMs);
}
function govSample(t) {
var pr = gov.probe;
if (pr) {
var d = t - pr.last; pr.last = t; pr.i++;
if (d > GOV.probeFastMs) { pr.slow = true; }
if (pr.i >= GOV.probeFastAt) { pr.sum += d; pr.cnt++; }
if ((pr.i === GOV.probeFastAt && !pr.slow) || pr.i >= GOV.probeTicks) {
gov.probe = null; gov.probeMs = pr.sum / Math.max(1, pr.cnt);
if (gov.probeMs > GOV.probeMs) { gov.hits++; gov.nextProbe = t + 600; if (gov.hits >= 2) { govStep(); } }
else { gov.hits = 0; gov.nextProbe = t + gov.backoff; gov.backoff = Math.min(GOV.probeMaxMs, gov.backoff * 2); }
}
return;
}
if (t < gov.settleUntil) { return; }
if (gov.prevRendered) {
var delay = t - gov.prevNow;
gov.ema = gov.n === 0 ? delay : gov.ema + (delay - gov.ema) * (stepped ? GOV.alphaStep : GOV.alphaSmooth);
gov.n++;
}
if (gov.n >= GOV.minSamples && gov.ema > (stepped ? GOV.stepMs : GOV.smoothMs)) {
if (!gov.over) { gov.over = t; }
if (t - gov.over >= GOV.sustainMs) { govStep(); }
} else { gov.over = 0; }
if (stepped && govOn && t >= gov.nextProbe && !gov.over) { gov.probe = { i: 0, last: t, sum: 0, cnt: 0 }; }
}
var tReal = 0, tScene = 0, frame = -1, running = false, paused = false, raf = 0, last = 0, visible = true, ready = false;
var warm = false, warmStart = 0, warmMats = [];
function updateAll(dt, t, f) {
HS.U.uTime.value = t; HS.U.uFrame.value = f;
if (!lookTarget) {
var k = 1 - Math.exp(-3.2 * dt);
cur.x += (target.x - cur.x) * k; cur.y += (target.y - cur.y) * k;
camera.position.set(camBase.x + cur.x * 0.26, camBase.y - cur.y * 0.06, camBase.z);
camera.rotation.set(view.pitch - cur.y * 0.006, -cur.x * 0.010, 0);
}
for (var i = 0; i < modList.length; i++) {
if (modList[i].update) { try { modList[i].update(dt, t, f); } catch (e) { if (errors.length < 8) { errors.push('update: ' + e.message); console.error('[HillScene] update failed', e); } } }
}
if (lookTarget && debug.track === '1' && HS.U.uPrincePos.value.x < 900) {
var pp = HS.U.uPrincePos.value;
lookTarget.set(pp.x, pp.y + 0.62, pp.z);
camera.position.copy(lookTarget).add(trackOff); camera.lookAt(lookTarget);
}
if (postMat) { pu.uFrameP.value = f % 64; }
}
function advanceTo(tNew) {
if (stepped) {
var fNew = Math.floor(tNew * fps), guard = 0;
while (frame < fNew && guard < 4) { frame++; guard++; tScene = frame / fps; updateAll(1 / fps, tScene, frame); dirty = true; }
if (frame < fNew) { frame = fNew; }
} else {
var dt = Math.max(0, Math.min(0.05, tNew - tScene)); tScene = tNew; frame = Math.floor(tNew * 60);
updateAll(dt, tScene, frame); dirty = true;
}
}
function renderFrame() {
if (ctxLost || disposed) { return; }
renderer.info.reset();
if (rt && postMat) {
renderer.setRenderTarget(rt); renderer.render(scene, camera);
if (pu.uDofOn.value > 0.5) {
renderer.setRenderTarget(tileH); renderer.render(tileHScene, postCam);
renderer.setRenderTarget(tileA); renderer.render(tileVScene, postCam);
renderer.setRenderTarget(tileB); renderer.render(dilScene, postCam);
}
renderer.setRenderTarget(null); renderer.render(postScene, postCam);
} else { renderer.render(scene, camera); }
updatePins();
dirty = false;
if (!ready) { ready = true; if (opts.onReady) { try { opts.onReady(); } catch (e) {} } }
}
function tick(t) {
raf = 0;
if (!running || ctxLost || disposed) { return; }
if (!warm) {
if (warmReady() || t - warmStart > 5000) { warm = true; warmMats = []; } else { last = t; raf = global.requestAnimationFrame(tick); return; }
}
var dt = Math.min(0.1, Math.max(0, (t - last) / 1000)); last = t;
if (govOn) { govSample(t); }
if (layoutPending && t - lastLayoutAt > 100) { layout(); }
tReal += dt; advanceTo(tReal);
var probing = !!gov.probe, rendered = dirty;
if (dirty || probing) { renderFrame(); }
if (govOn) { gov.prevNow = t; gov.prevRendered = rendered && !probing; }
raf = global.requestAnimationFrame(tick);
}
function warmup() {
warmMats = [];
if (!renderer.compile) { warm = true; return; }
try {
var prev = renderer.getRenderTarget();
var add = function (sc, cam, target) {
renderer.setRenderTarget(target);
renderer.compile(sc, cam).forEach(function (m) { warmMats.push(m); });
};
add(scene, camera, rt || null);
if (rt) { add(tileHScene, postCam, tileH); add(tileVScene, postCam, tileA); add(dilScene, postCam, tileB); add(postScene, postCam, null); }
renderer.setRenderTarget(prev);
} catch (e) { warm = true; warmMats = []; }
}
function warmReady() {
try {
for (var i = 0; i < warmMats.length; i++) {
var pr = renderer.properties.get(warmMats[i]), prog = pr && pr.currentProgram;
if (prog && prog.isReady && !prog.isReady()) { return false; }
}
} catch (e) {}
return true;
}
function start() {
if (opts.static || disposed || ctxLost) { return; }
if (reduce) { renderStill(); return; }
if (paused || !visible || (global.document && document.hidden)) { return; }
if (!running) {
running = true; last = now(); warmStart = last; govReset(GOV.settleMs);
if (!warm) { warmup(); }
if (!raf) { raf = global.requestAnimationFrame(tick); }
}
}
function stop() { running = false; if (raf) { global.cancelAnimationFrame(raf); raf = 0; } }
function renderAt(T) {
var step = stepped ? 1 / fps : 1 / 60, n = Math.floor(T / step + 2e-3);
for (var i = (stepped ? frame + 1 : 0); i <= n; i++) { tScene = i * step; frame = stepped ? i : Math.floor(tScene * 60); updateAll(step, tScene, frame); }
tReal = T; renderFrame();
}
function renderStill() {
if (mods.prince && mods.prince.skip) { mods.prince.skip(); }
var step = 1 / 30;
for (var i = 0; i < 45; i++) { updateAll(step, i * step, i); }
renderFrame();
events.turn();
}
function skip() { if (mods.prince && mods.prince.skip) { mods.prince.skip(); } events.turn(); dirty = true; if (!running) { updateAll(0.0001, tScene, frame); renderFrame(); } }
function setPaused(b) { paused = !!b; if (paused) { stop(); } else { start(); } }
function setOptions(o) {
var was = running;
stop();
for (var k in (o || {})) { if (Object.prototype.hasOwnProperty.call(o, k)) { opts[k] = o[k]; } }
dofWanted = !(opts.dof === false || debug.dof === '0');
teardownModules(); buildModules();
tReal = 0; tScene = 0; frame = -1; ready = false; warm = false; warmMats = [];
layout();
if (reduce) { renderStill(); } else if (was && !paused) { start(); } else { updateAll(1 / fps, 0, 0); renderFrame(); }
}
function setLevel(n) { levelForced = true; govOn = false; setLevelInternal(n); }
var io = null, ro = null;
function onVis() { govReset(GOV.settleMs); if (document.hidden) { stop(); } else { start(); } }
if (global.document) { document.addEventListener('visibilitychange', onVis); }
if (global.IntersectionObserver) {
io = new IntersectionObserver(function (entries) {
visible = entries.some(function (e) { return e.isIntersecting; });
if (visible) { if (layoutPending && !running) { applyPendingLayout(); } start(); } else { stop(); }
}, { threshold: 0.02 });
io.observe(host);
}
function applyPendingLayout() {
layout();
if (!running && !ctxLost) { updateAll(0.0001, tScene, frame); renderFrame(); }
}
if (global.ResizeObserver && !opts.static) {
ro = new ResizeObserver(function () {
var w = Math.max(1, host.clientWidth || canvas.clientWidth || 1), h = Math.max(1, host.clientHeight || canvas.clientHeight || 1);
if (w === lastW && h === lastH) { return; }
layoutPending = true;
if (!running && visible) { applyPendingLayout(); }
});
ro.observe(host);
}
function onCtxLost(ev) { if (ev && ev.preventDefault) { ev.preventDefault(); } ctxLost = true; wasRunning = running || wasRunning; stop(); }
var wasRunning = false;
function onCtxRestored() {
if (disposed) { return; }
ctxLost = false; warm = false; warmMats = [];
try {
teardownModules(); buildModules();
tReal = 0; tScene = 0; frame = -1; ready = false;
layout();
} catch (e) { errors.push('restore: ' + (e && e.message)); }
if (wasRunning && !paused) { wasRunning = false; start(); } else { updateAll(1 / fps, 0, 0); renderFrame(); }
}
canvas.addEventListener('webglcontextlost', onCtxLost, false);
canvas.addEventListener('webglcontextrestored', onCtxRestored, false);
buildModules();
layout();
lastLayoutAt = 0;
function dispose() {
if (disposed) { return; }
stop(); warmMats = [];
disposed = true;
host.removeEventListener('pointermove', onPointer);
while (pins.length) { unpin(pins[0].el); }
if (global.document) { document.removeEventListener('visibilitychange', onVis); }
canvas.removeEventListener('webglcontextlost', onCtxLost, false); canvas.removeEventListener('webglcontextrestored', onCtxRestored, false);
if (io) { io.disconnect(); } if (ro) { ro.disconnect(); }
teardownModules();
[rt, tileH, tileA, tileB].forEach(function (t) { if (t) { if (t.depthTexture) { t.depthTexture.dispose(); } t.dispose(); } });
[postMat, tileHMat, tileVMat, dilMat].forEach(function (m) { if (m) { m.dispose(); } });
if (postGeo) { postGeo.dispose(); }
try { renderer.dispose(); } catch (e) {}
}
function densityNow() { return mods.hill && mods.hill.density ? mods.hill.density() : 1; }
return {
start: start, stop: stop, setPaused: setPaused, skip: skip, resize: layout, setOptions: setOptions, setLevel: setLevel, pin: pin, unpin: unpin,
renderAt: renderAt, renderOnce: renderFrame, dispose: dispose,
errors: errors, ctx: ctx,
stats: function () {
var r = renderer.info.render;
return {
calls: r.calls, triangles: r.triangles, tier: Q.tier, post: !!rt, blades: Q.blades, dpr: dpr,
level: level, density: densityNow(), bladesDrawn: mods.hill && mods.hill.drawnBlades ? mods.hill.drawnBlades() : 0,
taps: postMat ? pu.uTaps.value : 0, dof: !!postMat && pu.uDofOn.value > 0.5, gpu: gpuName, gpuClass: gpuClass,
govMs: Math.round(gov.ema * 10) / 10, govProbeMs: Math.round(gov.probeMs * 10) / 10, govSteps: gov.steps, governor: govOn, lost: ctxLost
};
},
get level() { return level; },
get arrived() { return events.arrived; },
get turned() { return events.turned; }
};
}
global.HillScene = { create: create, version: HS.version, LEVELS: LEVELS, GOV: GOV };
})(window);
;
(function (global) {
'use strict';
var THREE = global.THREE, HS = global.HS;
if (!THREE || !HS) { return; }
var TAU = Math.PI * 2, DEG = Math.PI / 180;
var STAGE = {
fov: 24,
elev: 11,
margin: { x: 0.05, top: 0.05, bottom: 0.06 },
hull: [[0.51, 0.46], [0.51, 0.62], [0.38, 0.74], [0.28, 0.40], [0.23, 1.08], [0.14, 1.22], [0.14, 0.0]]
};
var STAND = {
r: 0.42,
thick: 0.06,
plateau: 0.20,
dip: 0.020,
bevel: 0.030,
segments: 96
};
var LIGHT = {
key: [-0.60, 0.58, 0.55],
fill: [0.66, 0.10, 0.74],
kick: [0.50, 0.52, -0.69],
kickGain: 0.85,
gain: {
golden: { key: 0.62, fill: 1.9, amb: 1.00 },
day: { key: 0.42, fill: 1.35, amb: 0.78 }
},
sat: { golden: 1.04, day: 1.06 },
stand: {
golden: { top: 0.50, rim: 0.12, wall: 0.62, desat: 0.00, dark: 1.00 },
day: { top: 0.10, rim: 0.00, wall: 0.45, desat: 0.28, dark: 0.90 }
}
};
var WIND = { strength: 1.0, dir: null };
var DISPLAY = {
yaw: 0,
headYaw: 0,
look: 0.3,
scarf: { wind: 1.1, gravity: 5.5, waveDeg: 22, gustGain: 0.15, updraft: 0, bend: 200 }
};
var INPUT = {
turnPerWidth: Math.PI,
inertiaTau: 0.22,
inertiaMax: 2.2,
inertiaMin: 0.5,
restMs: 80,
ramp: 0.6
};
var STILL = { frames: 36 };
var STOP_X = -0.6667;
function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
function wrap(a) { a = a % TAU; if (a < 0) { a += TAU; } return a >= TAU ? 0 : a; }
function flatGround() { return 0; }
function privateCopy(u) { var v = u.value; return { value: (v && typeof v.clone === 'function') ? v.clone() : v }; }
function makeGuard() {
var mine = {}, names = [], saved = [], had = [], depth = 0, height = null, palette, paletteName, hadPalette, hadName;
function adopt() {
var k;
for (k in HS.U) { if (Object.prototype.hasOwnProperty.call(HS.U, k) && !Object.prototype.hasOwnProperty.call(mine, k)) { mine[k] = privateCopy(HS.U[k]); names.push(k); } }
}
adopt();
return {
uniforms: mine,
enter: function () {
if (depth++) { return; }
var U = HS.U, i;
adopt();
for (i = 0; i < names.length; i++) { had[i] = Object.prototype.hasOwnProperty.call(U, names[i]); saved[i] = U[names[i]]; U[names[i]] = mine[names[i]]; }
height = HS.heightAt; HS.heightAt = flatGround;
hadPalette = 'palette' in HS; palette = HS.palette; hadName = 'paletteName' in HS; paletteName = HS.paletteName;
},
leave: function () {
if (--depth) { return; }
var U = HS.U, i;
for (i = 0; i < names.length; i++) { if (had[i]) { U[names[i]] = saved[i]; } else { delete U[names[i]]; } saved[i] = null; }
HS.heightAt = height; height = null;
if (hadPalette) { HS.palette = palette; } else { delete HS.palette; }
if (hadName) { HS.paletteName = paletteName; } else { delete HS.paletteName; }
}
};
}
var GRADE = [
'  vec3 gHi = max(col - 0.62, 0.0);',
'  col = min(col, 0.62) + 0.38 * (1.0 - exp(-gHi / 0.38));',
'  col = mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), col, uSat);'
].join('\n') + '\n';
function patch(mat, from, to) {
if (mat.fragmentShader.indexOf(from) < 0) { if (global.console) { console.warn('[turntable] shader patch did not apply: ' + from); } return false; }
mat.fragmentShader = mat.fragmentShader.replace(from, to);
return true;
}
function kickerGlsl(tinted) {
return [
'  // kicker: a back light that only shines through the paper',
'  float kBack = clamp(-dot(N, uKickDir), 0.0, 1.0);',
'  float kToward = pow(clamp(dot(V, -uKickDir) * 0.5 + 0.5, 0.0, 1.0), 3.0);',
'  col += uTransColor * ' + (tinted ? 'vTint * ' : '') + 'uKickColor * uTranslucency * thick * (0.26 * kBack + 0.62 * kToward * (0.35 + 0.65 * kBack));',
''
].join('\n');
}
function addGrade(mat, sat, kick) {
patch(mat, 'gl_FragColor = vec4(col, 1.0);', GRADE + '  gl_FragColor = vec4(col, 1.0);');
var head = 'uniform float uSat;\n';
if (kick) {
head += 'uniform vec3 uKickDir; uniform vec3 uKickColor;\n';
patch(mat, '  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);', kickerGlsl(mat.fragmentShader.indexOf('vTint') >= 0) + '  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);');
mat.uniforms.uKickDir = kick.uKickDir; mat.uniforms.uKickColor = kick.uKickColor;
}
mat.fragmentShader = head + mat.fragmentShader;
mat.uniforms.uSat = sat;
if (mat.uniforms.uFogAmt) { mat.uniforms.uFogAmt.value = 0; }
}
var STAND_GLSL = [
'uniform vec3 uColorEdge; uniform vec3 uColorSide; uniform float uStandR; uniform vec2 uFootL; uniform vec2 uFootR; uniform float uShadowK;',
'vec3 standBase(vec3 p, vec3 n){',
'  float rr = length(p.xz) / uStandR;',
'  vec3 top = mix(uColor, uColorEdge, smoothstep(0.30, 1.0, rr));',
'  vec3 wall = mix(uColorSide, uColorEdge, smoothstep(-0.03, 0.0, p.y));',
'  return mix(wall, top, smoothstep(0.35, 0.8, n.y));',
'}',
'// soft pools under both feet + a faint cast shadow thrown away from the key light (the key turns with the camera, so does this)',
'float standShadow(vec2 p){',
'  vec2 away = -uSunDir.xz; float la = length(away); away = la > 1e-4 ? away / la : vec2(0.0, -1.0);',
'  vec2 c = 0.5 * (uFootL + uFootR);',
'  vec2 q = p - c;',
'  float along = dot(q, away), across = dot(q, vec2(-away.y, away.x));',
'  float contact = exp(-(along * along) / (0.085 * 0.085) - (across * across) / (0.15 * 0.15));',
'  vec2 ql = p - uFootL, qr = p - uFootR;',
'  float pools = max(exp(-dot(ql, ql) / (0.07 * 0.07)), exp(-dot(qr, qr) / (0.07 * 0.07)));',
'  float a = smoothstep(-0.12, 0.10, along) * (1.0 - smoothstep(0.12, 0.55, along));',
'  float w = 0.12 + 0.10 * clamp(along / 0.55, 0.0, 1.0);',
'  float thrown = a * exp(-(across * across) / (w * w));',
'  return clamp(0.34 * contact + 0.30 * pools + 0.24 * thrown, 0.0, 0.75);',
'}'
].join('\n');
function standGeometry() {
var r = STAND.r, th = STAND.thick, b = STAND.bevel, pts = [], i, t, rho;
function turf(x) { var k = clamp((x - STAND.plateau) / Math.max(1e-4, r - b - STAND.plateau), 0, 1); return -STAND.dip * Math.pow(k * k * (3 - 2 * k), 1.3); }
var y0 = turf(r - b);
pts.push(new THREE.Vector2(0, -th), new THREE.Vector2(r - 0.012, -th), new THREE.Vector2(r, -th + 0.012));
for (i = 0; i <= 5; i++) { t = i / 5 * Math.PI / 2; pts.push(new THREE.Vector2(r - b + b * Math.cos(t), y0 - b + b * Math.sin(t))); }
for (i = 11; i >= 0; i--) { rho = (r - b) * i / 12; pts.push(new THREE.Vector2(rho, turf(rho))); }
var g = new THREE.LatheGeometry(pts, STAND.segments);
g.computeBoundingSphere();
return g;
}
function fitStage(aspect, hull) {
var th = Math.tan(STAGE.fov * DEG / 2), se = Math.sin(STAGE.elev * DEG), ce = Math.cos(STAGE.elev * DEG), m = STAGE.margin;
var pts = [], i, j, k, a, y0 = Infinity, y1 = -Infinity;
for (i = 0; i < hull.length; i++) {
y0 = Math.min(y0, hull[i][1]); y1 = Math.max(y1, hull[i][1]);
for (j = 0; j < 24; j++) { a = TAU * j / 24; pts.push(hull[i][0] * Math.sin(a), hull[i][1], hull[i][0] * Math.cos(a)); }
}
var ty = 0.5 * (y0 + y1), dist = 6, want = 0.5 * (m.bottom - m.top);
for (k = 0; k < 48; k++) {
var cy = ty + se * dist, cz = ce * dist, xm = 0, lo = Infinity, hi = -Infinity;
for (i = 0; i < pts.length; i += 3) {
var vy = pts[i + 1] - cy, vz = pts[i + 2] - cz, zc = -vy * se - vz * ce, yc = vy * ce - vz * se;
var nx = Math.abs(pts[i]) / (zc * th * aspect), ny = yc / (zc * th);
if (nx > xm) { xm = nx; } if (ny < lo) { lo = ny; } if (ny > hi) { hi = ny; }
}
var s = Math.max(xm / (1 - m.x), (hi - lo) / (2 - m.top - m.bottom));
dist *= 1 + (s - 1) * 0.8;
ty += (0.5 * (hi + lo) - want) * dist * th * 0.8;
}
return { dist: dist, ty: ty };
}
function createTurntable(canvas, host, userOpts) {
var uo = userOpts || {};
var opts = {
palette: HS.PALETTES[uo.palette] ? uo.palette : 'golden',
stopMotion: uo.stopMotion !== false,
period: num(uo.period, 24) > 0 ? num(uo.period, 24) : 24,
reduce: !!uo.reduceMotion,
drag: uo.drag !== false,
stand: uo.stand !== false,
inertia: uo.inertia !== false && !uo.reduceMotion,
onReady: uo.onReady, onSpinChange: uo.onSpinChange, onAngle: uo.onAngle
};
if (!HS.modules || !HS.modules.prince) { throw new Error('HillScene.createTurntable needs hs-prince.js'); }
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!uo.preserve });
var software = false, gl = renderer.getContext();
try {
var dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
software = /swiftshader|llvmpipe|softpipe|lavapipe|software|basic render|gdi generic|mesa offscreen/i.test(String(gl.getParameter(dbgInfo ? dbgInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || ''));
} catch (e) {}
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.info.autoReset = false;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(STAGE.fov, 0.68, 0.5, 40);
var guard = makeGuard(), mine = guard.uniforms, sat = { value: 1.04 };
var kick = { uKickDir: { value: new THREE.Vector3(0, 0, -1) }, uKickColor: { value: new THREE.Color() } };
var axis = new THREE.Vector3(STOP_X, 0, 0);
var puppet = null, stand = null, standMat = null, standGeo = null, hull = [];
var view = { aspect: 0.68, vfov: STAGE.fov, pitch: 0, halfW: 1, stopX: STOP_X, startX: STOP_X + 1, focus: 5, width: 1, height: 1, dpr: 1, horizon: 0.5 };
var events = { arrived: false, turned: false, arrive: function () { events.arrived = true; }, turn: function () { events.arrived = true; events.turned = true; } };
var ctx = {
THREE: THREE, HS: HS, scene: scene, camera: camera, renderer: renderer, U: HS.U, palette: null, paletteName: opts.palette, layout: HS.LAYOUT,
quality: { tier: 'turntable' }, opts: opts, debug: {}, view: view, events: events, heightAt: flatGround, reduceMotion: opts.reduce, walkSpeed: 1, mods: {},
display: { yaw: DISPLAY.yaw, headYaw: DISPLAY.headYaw, look: DISPLAY.look, scarf: DISPLAY.scarf }
};
var fps = 12, stepped = opts.stopMotion && !opts.reduce;
var spinOn = uo.spin !== false && !opts.reduce, paused = false, omega = TAU / opts.period;
var ang = wrap(num(uo.angle, 0)), vel = 0, gain = 1;
var frame = 0, tPose = 0, acc = 0;
var disposed = false, lost = false, errors = [];
var running = false, visible = true, ready = false, warm = true, warmStart = 0, warmMats = [], raf = 0, lastTs = -1, dirty = true, sized = false;
var w = 0, h = 0, dpr = 1, fitted = null, io = null, ro = null;
var stamps = [], poseMs = 0, msEma = 0, drawn = 0;
var cbTimer = 0, lastCb = -1e9;
function look() {
var p = HS.applyPalette(opts.palette), g = LIGHT.gain[opts.palette] || LIGHT.gain.golden;
mine.uSunColor.value.multiplyScalar(g.key);
mine.uFillColor.value.multiplyScalar(g.fill);
mine.uAmbSky.value.multiplyScalar(g.amb); mine.uAmbGround.value.multiplyScalar(g.amb);
mine.uFogStart.value = 1e4; mine.uFogMax.value = 0;
mine.uBoil.value = stepped ? 1 : 0;
mine.uWindDir.value.set(WIND.dir ? WIND.dir[0] : HS.LAYOUT.wind.dirX, WIND.dir ? WIND.dir[1] : HS.LAYOUT.wind.dirZ).normalize();
mine.uWindSpeed.value = HS.LAYOUT.wind.speed; mine.uWindStrength.value = WIND.strength;
sat.value = LIGHT.sat[opts.palette] || 1.04;
kick.uKickColor.value.set(p.sunLight).multiplyScalar(p.sunIntensity * LIGHT.kickGain);
ctx.palette = p; ctx.paletteName = opts.palette;
return p;
}
function standColors(p) {
var u = standMat.uniforms, k = LIGHT.stand[opts.palette] || LIGHT.stand.golden;
function tone(c) { var l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; c.r += (l - c.r) * k.desat; c.g += (l - c.g) * k.desat; c.b += (l - c.b) * k.desat; return c.multiplyScalar(k.dark); }
tone(u.uColor.value.set(p.grassMid).lerp(new THREE.Color(p.grassLight), k.top));
tone(u.uColorEdge.value.set(p.grassMid).lerp(new THREE.Color(p.grassLight), k.rim));
tone(u.uColorSide.value.set(p.grassRoot).lerp(new THREE.Color(p.grassMid), k.wall));
}
function makeStand(plan) {
standGeo = standGeometry();
standMat = HS.makePaperMaterial({ color: '#ffffff', crumple: 0.34, crumpleScale: 8, fiber: 0.8, rim: 0.25, translucency: 0, boil: 0.0012 });
standMat.uniforms.uColorEdge = { value: new THREE.Color() };
standMat.uniforms.uColorSide = { value: new THREE.Color() };
standMat.uniforms.uStandR = { value: STAND.r };
standMat.uniforms.uFootL = { value: new THREE.Vector2(plan.fin[0].x - axis.x, plan.fin[0].z - axis.z) };
standMat.uniforms.uFootR = { value: new THREE.Vector2(plan.fin[1].x - axis.x, plan.fin[1].z - axis.z) };
standMat.uniforms.uShadowK = { value: 1 };
patch(standMat, 'void main(){', STAND_GLSL + '\nvoid main(){');
patch(standMat, 'vec3 base = uColor;', 'vec3 base = standBase(vObjPos, normalize(vWorldNormal));');
patch(standMat, 'col = mix(col, hsFog(col, vWorldPos), uFogAmt);', 'col *= 1.0 - uShadowK * standShadow(vObjPos.xz);\n  col = mix(col, hsFog(col, vWorldPos), uFogAmt);');
addGrade(standMat, sat, null);
standColors(ctx.palette);
stand = new THREE.Mesh(standGeo, standMat); stand.name = 'stand';
stand.position.set(axis.x, 0, axis.z);
scene.add(stand);
hull = STAGE.hull.concat([[STAND.r, 0], [STAND.r, -STAND.thick], [STAND.r - STAND.bevel, -STAND.dip]]);
}
function makePuppet() {
puppet = HS.modules.prince(ctx);
puppet.layout(view); puppet.skip();
var plan = puppet.anim && puppet.anim.plan(), M = puppet.model.materials, k;
if (plan) { axis.set(plan.stop.x, 0, plan.stop.z); }
for (k in M) { if (Object.prototype.hasOwnProperty.call(M, k)) { addGrade(M[k], sat, kick); } }
return plan;
}
function build() {
guard.enter();
try { look(); var plan = makePuppet(); if (opts.stand) { makeStand(plan); } else { hull = STAGE.hull.slice(); } } finally { guard.leave(); }
warmUp();
}
function disposeObject(o) {
if (o.geometry && o.geometry.dispose) { o.geometry.dispose(); }
if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m && m.dispose) { m.dispose(); } }); }
}
function teardownPuppet() {
if (!puppet) { return; }
guard.enter();
try { if (puppet.dispose) { puppet.dispose(); } } catch (e) {} finally { guard.leave(); }
puppet = null;
}
function rebuildPuppet() {
teardownPuppet();
guard.enter();
try { look(); makePuppet(); } finally { guard.leave(); }
frame = 0; tPose = 0; acc = 0;
stepPose(0, 1 / fps, 0);
}
function stepPose(f, dt, t) {
var t0 = now();
guard.enter();
try { mine.uTime.value = t; mine.uFrame.value = f; puppet.update(dt, t, f); }
catch (e) { if (errors.length < 8) { errors.push('update: ' + e.message); if (global.console) { console.error('[turntable] update failed', e); } } }
finally { guard.leave(); }
poseMs += now() - t0;
}
function settle() {
var n = opts.reduce ? STILL.frames : 0, i;
for (i = 0; i <= n; i++) { stepPose(i, 1 / fps, i / fps); }
tPose = n / fps; frame = stepped ? n : Math.floor(tPose * 60);
}
var _up = new THREE.Vector3(0, 1, 0);
function turned(out, v, phi) { return out.set(v[0], v[1], v[2]).applyAxisAngle(_up, phi).normalize(); }
function applyView() {
var phi = -ang, el = STAGE.elev * DEG, f = fitted;
camera.position.set(axis.x + Math.sin(phi) * Math.cos(el) * f.dist, f.ty + Math.sin(el) * f.dist, axis.z + Math.cos(phi) * Math.cos(el) * f.dist);
camera.lookAt(axis.x, f.ty, axis.z);
turned(mine.uSunDir.value, LIGHT.key, phi);
turned(mine.uFillDir.value, LIGHT.fill, phi);
turned(kick.uKickDir.value, LIGHT.kick, phi);
}
function pixelRatio() { return Math.min(global.devicePixelRatio || 1, software ? 1 : 2); }
function layout() {
var nw = Math.max(0, host.clientWidth || canvas.clientWidth || 0), nh = Math.max(0, host.clientHeight || canvas.clientHeight || 0), nd = pixelRatio();
if (nw < 2 || nh < 2) { sized = false; w = nw; h = nh; return; }
if (nw !== w || nh !== h || nd !== dpr || !sized) {
w = nw; h = nh; dpr = nd;
renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
camera.aspect = w / h; camera.fov = STAGE.fov;
fitted = fitStage(camera.aspect, hull);
camera.updateProjectionMatrix();
view.aspect = camera.aspect; view.width = w; view.height = h; view.dpr = dpr;
dirty = true;
}
sized = true;
}
function draw() {
if (lost || disposed || !sized || !puppet) { return; }
var t0 = now();
if (pixelRatio() !== dpr) { layout(); }
applyView();
renderer.info.reset();
renderer.render(scene, camera);
dirty = false;
var t1 = now(), cost = poseMs + (t1 - t0); poseMs = 0;
if (++drawn > 3) { msEma = msEma ? msEma + (cost - msEma) * 0.1 : cost; }
stamps.push(t1);
while (t1 - stamps[0] > 1000) { stamps.shift(); }
if (!ready) { ready = true; if (opts.onReady) { try { opts.onReady(); } catch (e) {} } }
}
function warmUp() {
warmMats = []; warm = true;
if (!renderer.compile) { return; }
try {
var set = renderer.compile(scene, camera);
if (set && set.forEach) { set.forEach(function (m) { warmMats.push(m); }); }
warm = false; warmStart = now();
} catch (e) { warm = true; warmMats = []; }
}
function warmReady() {
try {
for (var i = 0; i < warmMats.length; i++) {
var pr = renderer.properties.get(warmMats[i]), prog = pr && pr.currentProgram;
if (prog && prog.isReady && !prog.isReady()) { return false; }
}
} catch (e) {}
return true;
}
function active() { return running && visible && !lost && !disposed && sized && !(global.document && document.hidden); }
function animating() { return !paused && (stepped || !opts.reduce || spinOn); }
function needsLoop() { return dirty || vel !== 0 || animating() || !warm; }
function schedule() { if (!raf && active() && needsLoop()) { raf = global.requestAnimationFrame(tick); } }
function rotate(d) {
if (!d) { return; }
ang = wrap(ang + d); dirty = true; noteAngle();
}
function tick(ts) {
raf = 0;
if (!active()) { lastTs = -1; return; }
if (!warm) {
if (warmReady() || now() - warmStart > 5000) { warm = true; warmMats = []; } else { lastTs = -1; raf = global.requestAnimationFrame(tick); return; }
}
var dt = lastTs < 0 ? 0 : clamp((ts - lastTs) / 1000, 0, 0.1); lastTs = ts;
if (!paused) {
var spinning = spinOn && !dragging;
if (gain < 1 && !dragging) { gain = Math.min(1, gain + dt / INPUT.ramp); }
var turn = spinning ? omega * (gain * gain * (3 - 2 * gain)) : 0;
if (stepped) {
var step = 1 / fps, n = 0; acc += dt;
while (acc >= step && n < 4) { acc -= step; n++; frame++; tPose = frame * step; stepPose(frame, step, tPose); rotate(turn * step); dirty = true; }
if (acc >= step) { acc = 0; }
} else {
if (!opts.reduce && dt > 0) { var hh = Math.min(dt, 0.05); tPose += hh; frame = Math.floor(tPose * 60); stepPose(frame, hh, tPose); dirty = true; }
rotate(turn * dt);
}
}
if (vel !== 0) {
rotate(vel * dt); vel *= Math.exp(-dt / INPUT.inertiaTau);
if (Math.abs(vel) < 0.05) { vel = 0; }
}
if (dirty) { draw(); }
if (needsLoop()) { schedule(); } else { lastTs = -1; }
}
function start() {
if (disposed || lost) { return; }
running = true; lastTs = -1;
if (!sized) { layout(); }
schedule();
}
function stop() { running = false; if (raf) { global.cancelAnimationFrame(raf); raf = 0; } lastTs = -1; }
function sync() { if (raf && !active()) { global.cancelAnimationFrame(raf); raf = 0; } lastTs = -1; schedule(); }
function renderAt(T) {
var step = stepped ? 1 / fps : 1 / 60, n = Math.floor(T / step + 2e-3), i;
if (!sized) { layout(); }
if (n < frame || (n === 0 && frame > 0)) { rebuildPuppet(); }
for (i = frame + 1; i <= n; i++) { frame = i; tPose = i * step; stepPose(i, step, tPose); }
warmMats = []; warm = true;
dirty = true; draw();
}
var ANGLE_GAP = 101;
function fireAngle() { cbTimer = 0; lastCb = now(); if (opts.onAngle) { try { opts.onAngle(ang); } catch (e) {} } }
function angleTimer() { cbTimer = 0; var wait = ANGLE_GAP - (now() - lastCb); if (wait > 0) { cbTimer = setTimeout(angleTimer, wait); } else { fireAngle(); } }
function noteAngle() {
if (!opts.onAngle || disposed) { return; }
var t = now();
if (t - lastCb >= ANGLE_GAP) { if (cbTimer) { clearTimeout(cbTimer); cbTimer = 0; } fireAngle(); }
else if (!cbTimer) { cbTimer = setTimeout(angleTimer, ANGLE_GAP - (t - lastCb)); }
}
var dragging = 0, dragLast = 0, dragT = 0, dragV = 0, dragN = 0, dragId = -1;
function turnPerPx() { return INPUT.turnPerWidth / Math.max(1, w || host.clientWidth || 1); }
function manual(d) { rotate(d); schedule(); }
function onDown(ev) {
if (!opts.drag || disposed || dragging) { return; }
if (ev.pointerType === 'mouse' && ev.button !== 0) { return; }
dragging = 1; dragId = ev.pointerId; dragLast = ev.clientX; dragT = ev.timeStamp || now(); dragV = 0; dragN = 0; vel = 0; gain = 0;
try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
host.setAttribute('data-dragging', '1');
}
function onMove(ev) {
if (!dragging || ev.pointerId !== dragId) { return; }
var dx = ev.clientX - dragLast, t = ev.timeStamp || now();
if (!dx) { return; }
var d = dx * turnPerPx();
var v = d / (Math.max(1, t - dragT) / 1000);
dragV = dragN++ ? dragV * 0.5 + v * 0.5 : v; dragT = t; dragLast = ev.clientX;
manual(d);
}
function endDrag(ev) {
if (!dragging || (ev && ev.pointerId !== dragId)) { return; }
dragging = 0;
host.removeAttribute('data-dragging');
try { if (ev && canvas.hasPointerCapture && canvas.hasPointerCapture(ev.pointerId)) { canvas.releasePointerCapture(ev.pointerId); } } catch (e) {}
var rested = ((ev && ev.timeStamp) || now()) - dragT > INPUT.restMs;
if (opts.inertia && !paused && !rested && ev && ev.type === 'pointerup' && Math.abs(dragV) >= INPUT.inertiaMin) { vel = clamp(dragV, -INPUT.inertiaMax, INPUT.inertiaMax); }
schedule();
}
function onWheel(ev) {
if (!opts.drag || disposed) { return; }
if (Math.abs(ev.deltaX) <= Math.abs(ev.deltaY)) { return; }
ev.preventDefault();
var unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? Math.max(1, w) : 1;
manual(-ev.deltaX * unit * turnPerPx());
}
function onVis() { sync(); }
if (global.document) { document.addEventListener('visibilitychange', onVis); }
if (global.IntersectionObserver) {
io = new IntersectionObserver(function (entries) { visible = entries.some(function (e) { return e.isIntersecting; }); sync(); }, { threshold: 0.02 });
io.observe(host);
}
if (global.ResizeObserver) {
ro = new ResizeObserver(function () { layout(); sync(); });
ro.observe(host);
}
function onLost(ev) { if (ev && ev.preventDefault) { ev.preventDefault(); } lost = true; if (raf) { global.cancelAnimationFrame(raf); raf = 0; } }
function onRestored() {
if (disposed) { return; }
lost = false; warmUp(); dirty = true; lastTs = -1; schedule();
}
canvas.addEventListener('webglcontextlost', onLost, false);
canvas.addEventListener('webglcontextrestored', onRestored, false);
var oldTouch = canvas.style.touchAction, oldSelect = canvas.style.userSelect;
if (opts.drag) {
canvas.style.touchAction = 'pan-y';
canvas.style.userSelect = 'none'; canvas.style.webkitUserSelect = 'none';
canvas.addEventListener('pointerdown', onDown);
canvas.addEventListener('pointermove', onMove);
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('lostpointercapture', endDrag);
canvas.addEventListener('wheel', onWheel, { passive: false });
}
try {
build();
settle();
layout();
} catch (e) {
try { teardownPuppet(); } catch (e2) {}
try { renderer.dispose(); } catch (e3) {}
if (global.document) { document.removeEventListener('visibilitychange', onVis); }
if (io) { io.disconnect(); } if (ro) { ro.disconnect(); }
canvas.removeEventListener('webglcontextlost', onLost, false); canvas.removeEventListener('webglcontextrestored', onRestored, false);
canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', endDrag);
canvas.removeEventListener('pointercancel', endDrag); canvas.removeEventListener('lostpointercapture', endDrag); canvas.removeEventListener('wheel', onWheel, { passive: false });
canvas.style.touchAction = oldTouch; canvas.style.userSelect = oldSelect; canvas.style.webkitUserSelect = '';
throw e;
}
function dispose(o) {
if (disposed) { return; }
stop(); disposed = true;
if (cbTimer) { clearTimeout(cbTimer); cbTimer = 0; }
if (global.document) { document.removeEventListener('visibilitychange', onVis); }
if (io) { io.disconnect(); } if (ro) { ro.disconnect(); }
canvas.removeEventListener('webglcontextlost', onLost, false); canvas.removeEventListener('webglcontextrestored', onRestored, false);
canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', endDrag);
canvas.removeEventListener('pointercancel', endDrag); canvas.removeEventListener('lostpointercapture', endDrag); canvas.removeEventListener('wheel', onWheel, { passive: false });
host.removeAttribute('data-dragging');
canvas.style.touchAction = oldTouch; canvas.style.userSelect = oldSelect; canvas.style.webkitUserSelect = '';
teardownPuppet();
if (stand) { scene.remove(stand); }
scene.traverse(disposeObject);
if (standGeo) { standGeo.dispose(); } if (standMat) { standMat.dispose(); }
try { renderer.dispose(); } catch (e) {}
if (o && o.loseContext) { try { renderer.forceContextLoss(); } catch (e) {} }
try { canvas.width = 1; canvas.height = 1; } catch (e) {}
}
function setSpin(on) {
on = !!on; if (on === spinOn) { return; }
spinOn = on; gain = 1; if (!on) { vel = 0; }
lastTs = -1; schedule();
if (opts.onSpinChange) { try { opts.onSpinChange(on); } catch (e) {} }
}
function setPaused(p) {
p = !!p; if (p === paused) { return; }
paused = p; if (p) { vel = 0; }
lastTs = -1; schedule();
}
function setOptions(o) {
o = o || {};
if (o.period != null && num(o.period, 0) > 0) { opts.period = num(o.period, opts.period); omega = TAU / opts.period; }
if (o.stopMotion != null) {
opts.stopMotion = !!o.stopMotion; stepped = opts.stopMotion && !opts.reduce; acc = 0;
if (stepped) { frame = Math.ceil(tPose * fps - 1e-9); tPose = frame / fps; } else { frame = Math.floor(tPose * 60); }
mine.uBoil.value = stepped ? 1 : 0;
}
if (o.palette != null && HS.PALETTES[o.palette] && o.palette !== opts.palette) {
opts.palette = o.palette;
guard.enter();
try { var p = look(); if (standMat) { standColors(p); } } finally { guard.leave(); }
}
dirty = true; lastTs = -1; schedule();
}
function setAngle(a) { var n = wrap(num(a, ang)); if (n !== ang) { ang = n; dirty = true; noteAngle(); schedule(); } }
function stats() {
var r = renderer.info.render, t = now();
while (stamps.length && t - stamps[0] > 1000) { stamps.shift(); }
return { fps: stamps.length, frameMs: Math.round(msEma * 100) / 100, triangles: r.triangles, calls: r.calls, dpr: dpr, width: w, height: h, rendering: active(), paused: paused };
}
return {
start: start, stop: stop, setSpin: setSpin, setPaused: setPaused, rotateBy: function (d) { manual(num(d, 0)); }, setAngle: setAngle, setOptions: setOptions,
stats: stats, dispose: dispose, renderAt: renderAt, errors: errors,
get angle() { return ang; },
get spinning() { return spinOn; },
get paused() { return paused; },
debug: { scene: scene, camera: camera, renderer: renderer, mine: mine, guard: guard, ctx: ctx, axis: function () { return axis; }, fit: function () { return fitted; }, puppet: function () { return puppet; }, hull: function () { return hull; } }
};
}
global.HillScene = global.HillScene || {};
global.HillScene.createTurntable = createTurntable;
global.HillScene.TURNTABLE = { STAGE: STAGE, STAND: STAND, LIGHT: LIGHT, WIND: WIND, DISPLAY: DISPLAY, INPUT: INPUT, STILL: STILL };
})(window);
;
