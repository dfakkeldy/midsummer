// src/lib/palette.js — original jewel palette and small painting helpers for the Midsummer panels (prefix MS_/ms).
// Everything here draws through the frozen engine's paint()/inkLine()/glows() only.
const MS_PAL = {
  ink: '#2A1C3A', inkSoft: '#4B3560', cream: '#FFF8E8',
  magenta: '#C4207E', magentaDk: '#7B0F4E', magentaLt: '#EC72B8',
  sapphire: '#2446B6', sapphireDk: '#15286F', sapphireLt: '#5C7BE0',
  turquoise: '#2DB9AE', turquoiseDk: '#167A74', turquoiseLt: '#93E6DC',
  emerald: '#1D9B5B', emeraldDk: '#0D5A36', emeraldLt: '#6BD39A',
  ruby: '#C81E3E', rubyDk: '#7E0E26', gold: '#E4B232', goldDk: '#9D6F12', goldLt: '#F7DC86',
  violet: '#7B3FB8', violetDk: '#43206F', violetLt: '#B48AE0', teal: '#1E8C88',
  leaf: '#4FB45A', leafDk: '#1F6B3A', leafLt: '#A9E57C', moss: '#4E8B3C', mossDk: '#2E5C27', mossLt: '#8FD06A',
  bark: '#6E4B3C', barkDk: '#3C2722', barkLt: '#A97F60',
  sky: '#6FC8EA', skyLt: '#D2F3FF', skyDk: '#2A6AAE', sun: '#FFE9A8', sunHot: '#FFF6D8',
  night: '#1C2A6E', nightDk: '#0D1442', nightLt: '#3B4FA8', moon: '#FFF2C2', moonTeal: '#9BE9E0',
  water: '#2E80B4', waterDk: '#194E78', waterLt: '#9DDEF2',
  blush: '#E98A8F', petalWhite: '#FFF5EC', orchid: '#D64BC0', bluebell: '#4A62D8', poppy: '#F0533A'
};

const msReset = () => { randomSeed(424242); noiseSeed(424242); };
const msH = (i, j = 0) => hash(i * 3.17 + j * 11.3 + 2.5);
// opaque wash + optional fine ink contour (ink null = no outline)
const msP = (pts, wash, ink = null, sw = .35, o = {}) => paint(pts, { wash, ink, sw, br: 'inkfine', curv: .4, ...o });
// transparent watercolour fill, no outline
const msF = (pts, fill, fillOp = 90, bleed = .15, tex = .5, o = {}) => paint(pts, { fill, fillOp, bleed, tex, ink: null, ...o });
const msL = (pts, sw = .35, col = MS_PAL.ink, curv = .5) => inkLine(pts, sw, col, 'inkfine', curv);
// rotated ellipse, noisy blob, pointed leaf
const msEll = (cx, cy, rx, ry, rot = 0, n = 16) => { const p = [], c = Math.cos(rot), s = Math.sin(rot); for (let i = 0; i < n; i++) { const a = i / n * TAU, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; p.push([cx + ex * c - ey * s, cy + ex * s + ey * c]); } return p; };
const msBlob = (cx, cy, rx, ry, amp, seed, n = 24) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + amp * (msH(i, seed) - .5) * 2; p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return p; };
const msLeafPts = (x, y, len, w, ang, n = 8) => { const p = [], c = Math.cos(ang), s = Math.sin(ang), P = (t, h) => [x + c * t * len - s * h, y + s * t * len + c * h]; for (let i = 0; i <= n; i++) p.push(P(i / n, Math.sin(i / n * Math.PI) * w)); for (let i = n - 1; i > 0; i--) p.push(P(i / n, -Math.sin(i / n * Math.PI) * w * .8)); return p; };

// Branch or root: one tapered ribbon with bark grain and an optional shadow fill along one flank.
function msBranch(P, w0, w1, col = MS_PAL.bark, dk = MS_PAL.barkDk, sw = .4, sh = 0) {
  paint(ribbon(P, w0, w1), { wash: col, ink: dk, sw, br: 'inkfine', curv: .3 });
  const C = through(P, 4), n = C.length;
  const off = k => C.map((p, i) => { const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (n - 1)) * k; return [p[0] - dy / d * w, p[1] + dx / d * w]; });
  if (sh) msF(ribbon(off(.28), w0 * .36, w1 * .36), dk, 75, .2, .5);
  msL(off(-.2), .25, dk, .5); msL(off(.1), .22, dk, .5);
}
// Foliage mass: washed blob with pigment texture, then a few lighter leaves on top.
function msCanopy(cx, cy, rx, ry, col, dk, seed, leaves = 8, lt = MS_PAL.leafLt) {
  msP(msBlob(cx, cy, rx, ry, .22, seed), col, null, 0, { fill: dk, fillOp: 70, bleed: .2, tex: .6, curv: .5 });
  for (let i = 0; i < leaves; i++) { const a = msH(i, seed + 1) * TAU, d = .35 + .6 * msH(i, seed + 2); msP(msLeafPts(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * .28, rx * .08, a + (msH(i, seed + 3) - .5)), lt, dk, .25); }
}
// Five-petal blooms, grouped by colour: list = [[x, y, r], ...]
function msFlowers(list, col, core = MS_PAL.gold, ink = null) {
  for (const [x, y, r] of list) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + x * .01; msP(msEll(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .5, r * .28, a, 10), col, ink, .22); }
  for (const [x, y, r] of list) msP(ellPts(x, y, r * .22, r * .22, 10), core, null);
}
function msLily(x, y, r) {
  msP(msEll(x, y + r * .3, r * 1.6, r * .5, 0, 16), MS_PAL.emeraldDk, MS_PAL.ink, .3);
  for (let k = 0; k < 7; k++) msP(msLeafPts(x, y, r * 1.1, r * .22, k / 7 * TAU - Math.PI / 2), MS_PAL.petalWhite, MS_PAL.inkSoft, .22);
  msP(ellPts(x, y, r * .2, r * .14, 8), MS_PAL.gold, null);
}
function msTufts(x0, x1, y, n, col, seed, h = 40) {
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, i / (n - 1)) + (msH(i, seed) - .5) * 30, hh = h * (.6 + msH(i, seed + 1)), lean = (msH(i, seed + 2) - .5) * 40; msL([[x, y], [x + lean * .4, y - hh * .6], [x + lean, y - hh]], .4, col, .5); }
}
