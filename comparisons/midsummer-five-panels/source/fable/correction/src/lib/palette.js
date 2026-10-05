// src/lib/palette.js — original jewel palette, shared small geometry and the organic environment brushes for the
// Midsummer panels (prefix MS_/ms). Everything draws through the frozen engine's paint()/inkLine()/glow()/glows() only.
// Loads first: cast.js relies on MS_INK, msMid, msAng, msOff, msDist, msDark, msRib, msTube, msEll and msPetalPts from here.
const MS_PAL = {
  ink: '#2A1A2E', inkSoft: '#4B3560', cream: '#FFF6E3', paper: '#FFF8E8',
  mag: '#D4178A', magDk: '#7B0F4E', magLt: '#EC72B8',
  sap: '#2446C6', sapDk: '#15286F', sapLt: '#5C7BE0',
  turq: '#2FC6C2', turqDk: '#167A74', turqLt: '#93E6DC',
  emer: '#149C62', emerDk: '#0B5A3C', emerLt: '#6BD39A',
  ruby: '#C91F3C', rubyDk: '#7E0E26', gold: '#F3C34E', goldDk: '#B88322', goldLt: '#F7DC86',
  vio: '#7A3DC4', vioDk: '#3E1E73', vioLt: '#B48AE0',
  leafLt: '#9BE26A', leafMd: '#4FB657', moss: '#63B34B', mossDk: '#2C6B35',
  bark: '#6E4B3A', barkLt: '#A97F5E', barkDk: '#3A2217', barkNt: '#4A3550', barkNtDk: '#241A30',
  water: '#2A8FD2', waterDk: '#163F86', waterLt: '#CFF6F0',
  skyDay: '#8FDDE8', sun: '#FFF1B8', sunHot: '#FFF6D8',
  night: '#1B2566', nightLt: '#4D5FC8', moon: '#FFF2C9', moonTeal: '#9BE9E0',
  lily: '#FFF6F2', lilyPk: '#F49BC8', lilyDk: '#D9608F', path: '#D9B36A', pathDk: '#A77A3A'
};
const MS_INK = MS_PAL.ink;

// ---------- seeds, shortcuts ----------
const msSeed = () => { randomSeed(424242); noiseSeed(424242); };
const msRnd = (a, b) => a + random() * (b - a);
const msH = (i, j = 0) => hash(i * 3.17 + j * 11.3 + 2.5);
const msMid = (a, b, k = .5) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const msAng = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const msOff = (p, a, d) => [p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d];
const msDist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const msDark = (c, k = .45) => mixCol(c, MS_INK, k);
// opaque wash + optional fine ink contour (ink null = no outline)
const msP = (pts, wash, ink = null, sw = .3, o = {}) => paint(pts, { wash, ink, sw, br: 'inkfine', curv: .35, ...o });
// transparent watercolour, no outline
const msF = (pts, fill, fillOp = 90, bleed = .15, tex = .5, o = {}) => paint(pts, { fill, fillOp, bleed, tex, ink: null, curv: .4, ...o });
const msL = (pts, sw = .3, col = MS_INK, curv = .5) => inkLine(pts, sw, col, 'inkfine', curv);
const msFine = (col = MS_INK, sw = .3) => ({ ink: col, sw, br: 'inkfine' });

// ---------- geometry ----------
const msEll = (cx, cy, rx, ry, rot = 0, n = 16) => { const p = [], c = Math.cos(rot), s = Math.sin(rot); for (let i = 0; i < n; i++) { const a = i / n * TAU, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; p.push([cx + ex * c - ey * s, cy + ex * s + ey * c]); } return p; };
const msBlob = (cx, cy, rx, ry, amp, seed, n = 24) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + amp * (msH(i, seed) - .5) * 2; p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return p; };
// pointed leaf along ang (one flank a little fuller than the other)
const msLeafPts = (x, y, len, w, ang, n = 8) => { const p = [], c = Math.cos(ang), s = Math.sin(ang), P = (t, h) => [x + c * t * len - s * h, y + s * t * len + c * h]; for (let i = 0; i <= n; i++) p.push(P(i / n, Math.sin(i / n * Math.PI) * w)); for (let i = n - 1; i > 0; i--) p.push(P(i / n, -Math.sin(i / n * Math.PI) * w * .8)); return p; };
// petal from its base (x, y) along ang: round < 1 fattens the tip, sq squashes it vertically (a whorl seen from above)
const msPetalPts = (x, y, len, w, ang, round = .6, sq = 1, n = 7) => {
  const c = Math.cos(ang), s = Math.sin(ang), p = [], P = (q, h) => [x + c * q * len - s * h, y + (s * q * len + c * h) * sq];
  for (let i = 0; i <= n; i++) { const q = i / n; p.push(P(q, Math.pow(Math.sin(q * Math.PI), round) * w)); }
  for (let i = n - 1; i > 0; i--) { const q = i / n; p.push(P(q, -Math.pow(Math.sin(q * Math.PI), round) * w * .92)); }
  return p;
};
// outline around a sampled curve C with half-width wAt(q, i): one closed polygon
function msRib(C, wAt) {
  const n = C.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = wAt(i / Math.max(1, n - 1), i);
    L.push([C[i][0] - dy / d * w, C[i][1] + dx / d * w]); R.push([C[i][0] + dy / d * w, C[i][1] - dx / d * w]);
  }
  return L.concat(R.reverse());
}
// tube along P with a width per control point (thigh → knee → calf → ankle)
function msTube(P, Ws) {
  const C = through(P, 6), m = P.length - 1;
  return msRib(C, (q, i) => { const u = Math.min(m, i / 6), k = Math.floor(u); return lerp(Ws[k], Ws[Math.min(m, k + 1)], u - k) / 2; });
}

// ---------- sky, light, ground ----------
function msSky(top, bot, o = {}) {
  paint(rectPts(-40, -40, W + 80, H + 80), { wash: top, ink: null });
  const n = o.bands ?? 4;
  for (let i = 0; i < n; i++) { const q = (i + 1) / n; paint(ellPts(W / 2 + (hash(i + 2) - .5) * 500, H * (o.y0 ?? .4) + q * H * .7, W * .85, H * .42, 26, 40), { fill: mixCol(top, bot, q), fillOp: 160, bleed: .3, tex: .5, ink: null, curv: .5 }); }
}
// soft light dapples through the leaves
function msDapple(x0, y0, x1, y1, n, cols, op = 70) { for (let i = 0; i < n; i++) paint(ellPts(msRnd(x0, x1), msRnd(y0, y1), msRnd(60, 160), msRnd(50, 120), 18, 12), { fill: cols[i % cols.length], fillOp: op, bleed: .5, tex: .2, ink: null, curv: .5 }); }
function msGlade(x, y, rx, ry, col = MS_PAL.sun) { paint(ellPts(x, y, rx, ry, 28, 60), { fill: MS_PAL.cream, fillOp: 170, bleed: .45, tex: .3, ink: null, curv: .5 }); glow(x, y - 30, rx, col, .9); glow(x, y, rx * .5, MS_PAL.sunHot, .7); }
function msGround(P, col, dk, op = 120) { paint(P, { wash: col, fill: dk, fillOp: op, bleed: .2, tex: .6, ink: null, curv: .3 }); }
// parallel pencil lines in a tilted band: Rackham crosshatch for ground shadow
function msHatch(x, y, w, h, ang, d, col, sw = .2) {
  const c = Math.cos(ang), s = Math.sin(ang), n = Math.floor(w / d);
  for (let i = 0; i <= n; i++) { const u = -w / 2 + i * d, j = jit(2); msL([[x + u * c + (h / 2) * s + j, y + u * s - (h / 2) * c], [x + u * c - (h / 2) * s, y + u * s + (h / 2) * c + j]], sw, col, 0); }
}
function msRipples(cx, cy, rx, ry, n, col) { for (let i = 0; i < n; i++) { const x = cx + msRnd(-rx, rx), y = cy + msRnd(-ry, ry), l = msRnd(40, 140); msL([[x - l / 2, y], [x - l / 4, y - 3], [x, y + 2], [x + l / 4, y - 2], [x + l / 2, y + 1]], .35, col, .6); } }

// ---------- leaves and canopy ----------
function msLeaves(list, col, sw = 0) {
  for (const [x, y, r, a] of list) paint(msLeafPts(x, y, r, r * .32, a), { wash: col, ink: sw ? MS_INK : null, sw, br: 'inkfine', curv: .45 });
  if (sw) for (const [x, y, r, a] of list) msL([[x, y], [x + Math.cos(a) * r * .85, y + Math.sin(a) * r * .85]], sw * .7, MS_PAL.inkSoft, 0);
}
// massed canopy: two watercolour clouds, then grouped leaf washes with a few fine contours
function msFoliage(x, y, rx, ry, cols, o = {}) {
  const m = Math.min(rx, ry);
  paint(ellPts(x, y, rx, ry, 26, m * .22), { fill: cols[0], fillOp: 190, bleed: .25, tex: .6, ink: null, curv: .5 });
  paint(ellPts(x - rx * .2, y - ry * .25, rx * .65, ry * .6, 20, m * .18), { fill: cols[1], fillOp: 140, bleed: .3, tex: .5, ink: null, curv: .5 });
  const n = o.n ?? 26, L = [[], [], []];
  for (let i = 0; i < n; i++) { const a = msRnd(0, TAU), d = Math.sqrt(random()); L[i % 3].push([x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, msRnd(.08, .16) * m, msRnd(0, TAU)]); }
  msLeaves(L[0], cols[1], 0); msLeaves(L[1], cols[2] || cols[1], .22); msLeaves(L[2], cols[0], .2);
}
function msGrass(x, y, rx, ry, col, n) { for (let i = 0; i < n; i++) { const bx = x + msRnd(-rx, rx), by = y + msRnd(-ry, ry) * .6, h = msRnd(25, 60), lean = msRnd(-.4, .4); msL([[bx, by], [bx + lean * h * .4, by - h * .6], [bx + lean * h, by - h]], .35, col, .5); } }
function msFern(x, y, ang, len, col) {
  const P = []; for (let i = 0; i <= 5; i++) { const q = i / 5; P.push([x + Math.cos(ang - q * .5) * len * q, y + Math.sin(ang - q * .5) * len * q]); }
  msL(P, .35, col, .5);
  const C = through(P, 2);
  for (let i = 2; i < C.length - 1; i += 2) { const a = msAng(C[i - 1], C[i + 1]), l = len * .18 * (1 - i / C.length); for (const sd of [-1, 1]) msL([C[i], msOff(C[i], a + sd * 1.2, l * .6), msOff(C[i], a + sd * 1.0, l)], .25, col, .4); }
}
// a thin creeper along P with alternating leaves
function msVine(P, w, col, leafCol, nLeaves = 6) {
  const C = through(P, 4), n = C.length;
  paint(ribbon(P, w, w * .5), { wash: col, ...msFine(msDark(col, .4), .2), curv: .4 });
  const L = []; for (let i = 0; i < nLeaves; i++) { const j = Math.min(n - 1, Math.round((i + .5) / nLeaves * (n - 1))), p = C[j], a = msAng(C[Math.max(0, j - 1)], C[Math.min(n - 1, j + 1)]) + (i % 2 ? 1.3 : -1.3); L.push([p[0], p[1], w * 3.5 + i, a]); }
  msLeaves(L, leafCol, .2);
}

// ---------- wood ----------
// Organic wood (trunk, branch, root): one tapered ribbon whose width swells and pinches along the curve, a watercolour
// flank shadow and a pale highlight, bark grain that follows the contour, knots, and an optional moss ridge on top.
// o: dk, lt, sw, ink (null = no contour), shade (fill op), bulge, side (+1 shadow on the clockwise flank), knot, moss (colour), seed
function msWood(P, w0, w1, col = MS_PAL.bark, o = {}) {
  const dk = o.dk || MS_PAL.barkDk, lt = o.lt || mixCol(col, MS_PAL.cream, .4), sd = o.seed || 0, bulge = o.bulge ?? .2, side = o.side ?? 1;
  const C = through(P, 5), n = C.length, N = [];
  for (let i = 0; i < n; i++) { const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; N.push([-dy / d, dx / d]); }
  const wf = q => lerp(w0, w1, q) * (1 + bulge * (Math.sin(q * 9.3 + sd) * .5 + Math.sin(q * 23 + sd * 2.1) * .3 + (msH(Math.floor(q * 24), sd) - .5) * .5));
  const at = (k, i) => { const w = wf(i / Math.max(1, n - 1)) * k / 2; return [C[i][0] + N[i][0] * w, C[i][1] + N[i][1] * w]; };
  const rib = (k0, kw) => msRib(C.map((_, i) => at(k0, i)), q => wf(q) * kw / 2);
  paint(rib(0, 1), { wash: col, fill: dk, fillOp: o.shade ?? 75, bleed: .1, tex: .6, ink: o.ink === undefined ? MS_INK : o.ink, sw: o.sw ?? .34, br: 'inkfine', curv: .3 });
  paint(rib(side * .58, .42), { fill: dk, fillOp: 70, bleed: .2, tex: .55, ink: null, curv: .4 });
  paint(rib(-side * .5, .2), { wash: lt, washOp: 60, ink: null, curv: .4 });
  for (const [k, c, w] of [[-.62, lt, .2], [-.22, dk, .24], [.18, dk, .2], [.52, dk, .18]]) msL(C.map((_, i) => at(k + Math.sin(i * .6 + sd + k * 9) * .07, i)).filter((_, i) => i % 2 === 0), w, c, .5);
  if (o.knot && n > 6) for (const q of [.36, .72]) { const i = Math.round(q * (n - 1)), p = at(-.25, i), r = wf(q) * .13, a = msAng(C[i - 1], C[i + 1]); if (r > 3) { msP(msEll(p[0], p[1], r * 1.3, r * .75, a, 12), dk, null, 0, { washOp: 170 }); msP(msEll(p[0], p[1], r * .55, r * .3, a, 10), lt, null); } }
  if (o.moss) {
    let up = 0; for (const nn of N) up += nn[1];
    const us = up < 0 ? 1 : -1, M = C.map((_, i) => at(us * .58, i));
    paint(msRib(M, q => wf(q) * .19 * (1 + .5 * Math.sin(q * 17 + sd))), { wash: o.moss, ink: null, curv: .5 });
    for (let i = 2; i < n - 1; i += 4) { const p = M[i]; msL([p, [p[0] + 3, p[1] - wf(i / (n - 1)) * .2]], .2, MS_PAL.mossDk, .3); }
  }
  return C;
}
// a trunk that sways and flares into two buttress roots at its base
function msTrunk(x, yBase, h, w, lean, col, o = {}) {
  const P = []; for (let i = 0; i <= 6; i++) { const q = i / 6; P.push([x + lean * q * h + Math.sin(q * 5 + (o.ph || 0)) * w * .3 * q, yBase - q * h]); }
  const C = msWood(P, w * 1.15, w * (o.top ?? .5), col, { seed: o.ph || 0, sw: .4, knot: true, bulge: .1, shade: 90, side: o.side ?? 1, dk: o.dk, lt: o.lt });
  for (const d of [-1, 1]) msWood([[x + d * w * .35, yBase - w * .3], [x + d * w * .7, yBase - w * .1], [x + d * w * 1.25, yBase + 10]], w * .4, w * .2, col, { seed: d + 3, sw: .3, shade: 70, bulge: .3, dk: o.dk, lt: o.lt });
  return C;
}
// A twisting branch that forks: children are drawn first and start inside the parent, so junctions grow out of the wood
// instead of butting against it; the last twigs end in leaf clusters. o: twist, bend, spread, leafK, seed, dk, lt, shade
function msBranchTree(x, y, ang, len, w, col, depth, leafCols, o = {}) {
  const sd = (o.seed || 0) + depth * 7.3 + x * .011 + y * .017, P = [[x, y]], n = 6; let a = ang, cx = x, cy = y;
  for (let i = 1; i <= n; i++) { a += (msH(i, sd) - .5) * (o.twist ?? 1.1) + (o.bend || 0) / n; cx += Math.cos(a) * len / n; cy += Math.sin(a) * len / n; P.push([cx, cy]); }
  if (depth > 0) for (const [k, dir] of [[.4, -1], [.72, 1]]) {
    const j = Math.round(k * n), b = P[j], aa = msAng(P[j - 1], P[j + 1]) + dir * (.4 + msH(j, sd) * .6) * (o.spread ?? 1), wa = lerp(w, w * .3, k) * .8, bb = msOff(b, aa + Math.PI, wa * .4);
    msBranchTree(bb[0], bb[1], aa, len * .55, wa, col, depth - 1, leafCols, { ...o, seed: sd + j });
  }
  msWood(P, w, w * .3, col, { seed: sd, sw: .24 + w * .003, knot: w > 30, dk: o.dk, lt: o.lt, shade: o.shade ?? 60, bulge: .15 });
  if (depth === 0 && leafCols) {
    const e = P[n], ae = msAng(P[n - 1], P[n]);
    for (let i = -1; i <= 1; i++) msL([e, msOff(e, ae + i * .5, len * .18), msOff(e, ae + i * .8, len * .3)], .28, o.dk || MS_PAL.barkDk, .4);
    const L = []; for (let i = 0; i < 7; i++) { const p = P[Math.floor(msRnd(2, P.length))]; L.push([p[0] + msRnd(-w, w) * 1.2, p[1] + msRnd(-w, w) * 1.2, msRnd(18, 34) * (o.leafK ?? 1), msRnd(0, TAU)]); }
    msLeaves(L, leafCols[Math.floor(msRnd(0, leafCols.length))], .22);
  }
  return P;
}

// ---------- flowers ----------
// Layered petal blooms grouped by colour: list = [[x, y, r, petals?], ...]. An outer whorl of contoured petals, a lighter
// inner whorl turned half a step, a dark heart and gold stamens. o: lt, dk, core, sw
function msBlooms(list, col, o = {}) {
  const lt = o.lt || mixCol(col, MS_PAL.cream, .45), dk = o.dk || mixCol(col, MS_INK, .45), core = o.core || MS_PAL.gold, sw = o.sw ?? .18;
  for (const [x, y, r, n = 5] of list) for (let k = 0; k < n; k++) { const a = k / n * TAU + hash(x + y) * TAU + (msH(k, x) - .5) * .3, l = r * (.9 + .15 * msH(k, y)); paint(msPetalPts(x + Math.cos(a) * r * .1, y + Math.sin(a) * r * .1, l, r * .36, a, .55), { wash: col, ink: dk, sw, br: 'inkfine', curv: .4 }); }
  for (const [x, y, r, n = 5] of list) { if (r > 13) for (let k = 0; k < n; k++) { const a = (k + .5) / n * TAU + hash(x + y) * TAU; paint(msPetalPts(x, y, r * .55, r * .22, a, .55), { wash: lt, ink: null, curv: .4 }); } }
  for (const [x, y, r] of list) msP(ellPts(x, y, r * .17, r * .17, 8), dk, null);
  for (const [x, y, r] of list) {
    if (r > 13) { for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + .8; msP(ellPts(x + Math.cos(a) * r * .11, y + Math.sin(a) * r * .11, r * .05, r * .05, 6), core, null); } }
    else msP(ellPts(x, y, r * .08, r * .08, 6), core, null);
  }
}
// a jewel flower bed: shadow pool, grass, stems, then blooms grouped by colour
function msBed(x, y, rx, ry, cols, n = 14, r0 = 12, r1 = 22, o = {}) {
  msF(ellPts(x, y + ry * .3, rx, ry * .8, 20, ry * .2), MS_PAL.emerDk, o.shade ?? 90, .3, .5, { curv: .5 });
  msGrass(x, y, rx, ry, o.grass || MS_PAL.mossDk, 10);
  const L = cols.map(() => []);
  for (let i = 0; i < n; i++) { const a = msRnd(0, TAU), d = Math.sqrt(random()); L[i % cols.length].push([x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, msRnd(r0, r1), 5 + (i % 2)]); }
  for (const G of L) for (const [bx, by, r] of G) msL([[bx, by + r * 1.3], [bx + 3, by + r * .6], [bx, by]], .3, o.grass || MS_PAL.mossDk, .5);
  cols.forEach((c, i) => msBlooms(L[i], c));
}
// Water lilies seen from a little above: a flat pink-tinted outer whorl, a raised middle whorl, an inner cup and a gold
// heart with stamens, over a pink reflection. list = [[x, y, r], ...]
function msLilies(list, col = MS_PAL.lily, pk = MS_PAL.lilyPk, dk = MS_PAL.lilyDk) {
  const mid = mixCol(col, pk, .3);
  for (const [x, y, r] of list) msP(msEll(x, y + r * .12, r * 1.1, r * .42), pk, null, 0, { washOp: 110 });
  const whorl = (n, len, w, lift, ph, c, ink, sq) => { for (const [x, y, r] of list) for (let k = 0; k < n; k++) { const a = k / n * TAU + ph + hash(x) * .4; paint(msPetalPts(x + Math.cos(a) * r * .08, y + Math.sin(a) * r * .05 - r * lift, r * len, r * w, a, .5, sq), { wash: c, ink, sw: .2, br: 'inkfine', curv: .4 }); } };
  whorl(9, 1.05, .3, 0, -1.3, mid, dk, .55);
  whorl(7, .8, .3, .06, -.9, col, dk, .6);
  whorl(5, .5, .26, .14, -1.1, col, pk, .7);
  for (const [x, y, r] of list) msP(ellPts(x, y - r * .16, r * .17, r * .11, 10), MS_PAL.gold, null);
  for (const [x, y, r] of list) for (let k = 0; k < 5; k++) msP(ellPts(x + (k - 2) * r * .06, y - r * .2 - Math.abs(k - 2) * r * .02, r * .03, r * .03, 6), MS_PAL.goldDk, null);
}
// lily pads with a notch and radiating veins: list = [[x, y, r, notch?], ...]
function msPads(list, col = MS_PAL.emer, dk = MS_PAL.emerDk) {
  for (const [x, y, r, rot = .4] of list) { const P = [[x + r * .15, y]]; for (let i = 0; i <= 20; i++) { const t = rot + i / 20 * (TAU - 2 * rot), k = 1 + .05 * Math.sin(i * 2.3); P.push([x + Math.cos(t) * r * k, y + Math.sin(t) * r * .5 * k]); } paint(P, { wash: col, fill: dk, fillOp: 60, bleed: .1, tex: .5, ...msFine(dk, .28), curv: .2 }); }
  for (const [x, y, r, rot = .4] of list) for (let k = 0; k < 5; k++) { const t = rot + .4 + k / 4 * (TAU - 2 * rot - .8); msL([[x, y], [x + Math.cos(t) * r * .8, y + Math.sin(t) * r * .4]], .2, dk, 0); }
}
