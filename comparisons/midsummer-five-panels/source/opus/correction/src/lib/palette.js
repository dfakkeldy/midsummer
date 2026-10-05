// palette.js: Midsummer jewel palette and original painting helpers (prefix md / MD).
// Everything is deterministic: shapes use mdH() hashes, never Math.random, so each loop repaints identically.
// Limbs, fingers, roots and branches share one spine model: rounded caps, a transparent shade band on the side away
// from the light, a lit glaze and open side contours, so forks and joints merge organically instead of meeting as
// squared slabs.

const MD = {
  magenta: '#C0267A', magentaDk: '#7A1450', magentaLt: '#EC6FB2',
  sapphire: '#2453B8', sapphireDk: '#15306F', sapphireLt: '#62A0F0',
  emerald: '#169A63', emeraldDk: '#0B5A3C', emeraldLt: '#52CC8F',
  turq: '#1FB8B0', turqDk: '#0D777D', turqLt: '#86E6D9',
  violet: '#7240B8', violetDk: '#43217A', violetLt: '#AE8DE6',
  gold: '#E8B22E', goldDk: '#A5721A', goldLt: '#F8DD7E',
  ruby: '#C81F3C', rubyDk: '#7C1024', coral: '#F2775E', rose: '#F49AC1',
  ink: '#2A1E33', inkSoft: '#4B3557', cream: '#FFF6E4', white: '#FBF4EA',
  // skin
  olive: '#C99A6E', oliveSh: '#9C6A47', oliveLt: '#E2B98C',
  pale: '#F2CDB0', paleSh: '#D49A80', paleLt: '#FBE2CC', freckle: '#C8846A',
  brown: '#8A5536', brownSh: '#5C3421', brownLt: '#A9704C',
  tan: '#C98B5D', tanSh: '#94603C', tanLt: '#E0A878',
  lip: '#B64A55', lipDk: '#83303D',
  // hair
  auburn: '#8C2C1B', auburnLt: '#C25A34', auburnDk: '#561811',
  honey: '#D8A74C', honeyLt: '#F2D388', honeyDk: '#9E7230',
  chestnut: '#3F2117', chestnutLt: '#6E3B25', curl: '#2C1A16',
  // forest
  moss: '#4E9E3A', mossLt: '#94D05A', mossDk: '#2C6430',
  leaf: '#2F8F50', leafLt: '#7CCB6A', leafDk: '#1C5A3E',
  bark: '#5C3B30', barkLt: '#8E6148', barkDk: '#341F2C',
  plum: '#6B3E4E', plumLt: '#C08A78', dusk: '#5A3A62', duskLt: '#B08FC8',
  sky: '#A3DCF2', mist: '#D3EEF2', pool: '#2A8FB8', poolLt: '#93DCEF', poolDk: '#17577E',
  night: '#1D2468', nightLt: '#3B44A8', moon: '#ECF2FF', moonGlow: '#9FB8FF'
};
const MD_SAFE = { x0: 96, y0: 54, x1: 1824, y1: 1026 };
const MD_LIGHT = [.5, -.86];   // default light direction: from the upper right

// seed every loop entry
const mdSeed = () => { randomSeed(424242); noiseSeed(424242); };
const mdH = (a, b = 0) => hash(a * 12.9898 + b * 78.233 + .517);
const mdR = (seed, lo, hi) => lerp(lo, hi, mdH(seed));

// colour along a list of stops
function mdGrad(cols, k) {
  if (cols.length < 2) return cols[0];
  const f = clamp(k) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(f));
  return mixCol(cols[i], cols[i + 1], f - i);
}
// number, or a profile array sampled at k
function mdAt(v, k) {
  if (!Array.isArray(v)) return v;
  if (v.length < 2) return v[0];
  const f = clamp(k) * (v.length - 1), i = Math.min(v.length - 2, Math.floor(f));
  return lerp(v[i], v[i + 1], f - i);
}

// ---------- spines and tubes ----------
// sampled centre line with unit normals and half widths
function mdSpine(P, ws, n = 6) {
  const C = through(P, Math.max(1, n)), m = C.length, N = [], Wd = [];
  for (let i = 0; i < m; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(m - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    N.push([-dy / d, dx / d]); Wd.push(Math.max(.01, mdAt(ws, i / Math.max(1, m - 1)) / 2));
  }
  return { C, N, Wd, m };
}
const mdOff = (S, i, k) => [S.C[i][0] + S.N[i][0] * S.Wd[i] * k, S.C[i][1] + S.N[i][1] * S.Wd[i] * k];
// rounded cap points at sample i (end = 1: the far end, 0: the start), endpoints excluded
function mdCap(S, i, end, seg = 6) {
  const c = S.C[i], n = S.N[i], f = [n[1], -n[0]], w = S.Wd[i], g = end ? 1 : -1, out = [];
  for (let k = 1; k < seg; k++) {
    const a = k / seg * Math.PI, cs = Math.cos(a), sn = Math.sin(a);
    out.push([c[0] + g * w * (n[0] * cs + f[0] * sn), c[1] + g * w * (n[1] * cs + f[1] * sn)]);
  }
  return out;
}
// closed outline; cap bits: 1 rounds the start, 2 rounds the end
function mdTubeS(S, cap = 0) {
  const L = [], R = [];
  for (let i = 0; i < S.m; i++) { L.push(mdOff(S, i, 1)); R.push(mdOff(S, i, -1)); }
  const out = L;
  if (cap & 2) out.push(...mdCap(S, S.m - 1, 1));
  out.push(...R.reverse());
  if (cap & 1) out.push(...mdCap(S, 0, 0));
  return out;
}
// a tube along a joint path with a width profile: limbs, fingers, roots, vines, ribbons of cloth
const mdTube = (P, ws, n = 6, cap = 0) => mdTubeS(mdSpine(P, ws, n), cap);
// open contour lines: only inked caps close; s0 skips samples at an uncapped start (a fork that grows out of its parent)
function mdEdges(S, cap = 0, s0 = 0) {
  const L = [], R = [], a = cap & 1 ? 0 : Math.max(0, Math.min(s0, S.m - 2));
  for (let i = a; i < S.m; i++) { L.push(mdOff(S, i, 1)); R.push(mdOff(S, i, -1)); }
  R.reverse();
  if (cap === 3) { const P = [...L, ...mdCap(S, S.m - 1, 1), ...R, ...mdCap(S, 0, 0)]; P.push(P[0]); return [P]; }
  if (cap === 2) return [[...L, ...mdCap(S, S.m - 1, 1), ...R]];
  if (cap === 1) return [[...R, ...mdCap(S, 0, 0), ...L]];
  return [L, R.reverse()];
}
// a narrower tube running along one side of a spine (off in half widths, + = normal side): shade and light bands
function mdBand(S, off, frac = .5, cap = 3) {
  const Q = S.C.map((_, i) => mdOff(S, i, off));
  return mdTube(Q, S.Wd.map(w => w * 2 * frac), 1, cap);
}
// which side of the spine turns away from the light (-1 or 1, in normal units)
function mdShadeSign(S, Lv = MD_LIGHT) {
  let s = 0; for (const n of S.N) s += n[0] * Lv[0] + n[1] * Lv[1];
  return s > 0 ? -1 : 1;
}
// a polyline along the spine at offset k, between fractions a0..a1 of its length
function mdOffset(S, k, a0 = 0, a1 = 1) {
  const i0 = Math.round(clamp(a0) * (S.m - 1)), i1 = Math.round(clamp(a1) * (S.m - 1)), out = [];
  for (let i = i0; i <= i1; i++) out.push(mdOff(S, i, k));
  return out;
}
// a modelled tube: opaque base, shade band away from the light, a lit glaze, then open fine contours.
// o: n, cap (wash caps), edge (inked caps), skip, side, light, sh, shOp, shOff, shW, fill (watercolour shade),
//    lt (null = none), ltOp, ltW, ink (null = none), sw. Returns the spine.
function mdLimb(P, ws, col, o = {}) {
  const S = mdSpine(P, ws, o.n ?? 6), cap = o.cap ?? 3, g = o.side ?? mdShadeSign(S, o.light);
  mdWash(mdTubeS(S, cap), col, o.op ?? 255, .3);
  const sh = mdBand(S, g * (o.shOff ?? .5), o.shW ?? .5, cap), shc = o.sh || mixCol(col, MD.ink, .4);
  if (o.fill) mdFill(sh, shc, o.shOp ?? 120, .08, .55); else mdWash(sh, shc, o.shOp ?? 90, .4);
  if (o.lt !== null) mdWash(mdBand(S, -g * .45, o.ltW ?? .26, cap), o.lt || mixCol(col, '#FFF4E0', .45), o.ltOp ?? 110, .4);
  if (o.ink !== null) for (const E of mdEdges(S, o.edge ?? cap, o.skip || 0)) inkLine(E, o.sw ?? .3, o.ink || MD.ink, 'inkfine', .5);
  return S;
}

// ---------- geometry ----------
// rotate a (about ox, oy), scale s, then move by dx, dy
function mdXf(P, dx = 0, dy = 0, s = 1, a = 0, ox = 0, oy = 0) {
  const c = Math.cos(a), si = Math.sin(a);
  return P.map(([x, y]) => { const u = x - ox, v = y - oy; return [ox + (u * c - v * si) * s + dx, oy + (u * si + v * c) * s + dy]; });
}
const mdFlipX = (P, cx) => P.map(([x, y]) => [2 * cx - x, y]);
// organic wobbly ellipse
function mdBlob(cx, cy, rx, ry, seed = 1, n = 20, amt = .14, rot = 0) {
  const p = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, k = 1 + amt * ((mdH(seed, i) - .5) * 1.2 + .4 * Math.sin(a * 3 + seed));
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    p.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return p;
}
// a pointed leaf / petal from its base (x, y), length s, along angle a
function mdLeafPts(x, y, s, a, wd = .36) {
  const w = s * wd;
  return mdXf([[0, 0], [.28 * s, -.62 * w], [.66 * s, -.55 * w], [s, 0], [.66 * s, .55 * w], [.28 * s, .62 * w]], x, y, 1, a, 0, 0);
}
// a lobed flower head
function mdFlowerPts(x, y, r, n = 5, rot = 0) {
  const p = [], m = n * 6;
  for (let i = 0; i < m; i++) {
    const b = i / m * TAU, k = .4 + .6 * Math.pow(Math.abs(Math.cos(b * n / 2)), .7), a = b + rot;
    p.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]);
  }
  return p;
}

// ---------- paint shorthands ----------
const mdWash = (P, col, op = 255, curv = 0) => paint(P, { wash: col, washOp: op, ink: null, curv });
const mdFill = (P, col, op = 150, bleed = .12, tex = .5) => paint(P, { fill: col, fillOp: op, bleed, tex, border: .4, ink: null });
// opaque base colour with a fine native ink contour
function mdShape(P, col, o = {}) {
  paint(P, { wash: col, washOp: o.op ?? 255, ink: o.ink === undefined ? MD.ink : o.ink, sw: o.sw ?? .32, br: o.br || 'inkfine', curv: o.curv ?? 0 });
}
const mdLine = (P, sw = .3, col = MD.ink, curv = .5) => { if (P && P.length > 1) inkLine(P, sw, col, 'inkfine', curv); };
const mdFolds = (list, sw = .25, col = MD.inkSoft) => { for (const P of list) mdLine(P, sw, col, .6); };
const mdLights = (list, col) => glows(list, col, true);

// horizontal colour bands with soft wavy seams (skies, distant forest)
function mdBands(cols, y0, y1, n = 6, seed = 3) {
  for (let i = 0; i < n; i++) {
    const ya = lerp(y0, y1, i / n) - 10, yb = lerp(y0, y1, (i + 1) / n) + 14, P = [];
    for (let k = 0; k <= 8; k++) P.push([lerp(-60, W + 60, k / 8), ya + 9 * Math.sin(k * 1.3 + i + seed)]);
    for (let k = 8; k >= 0; k--) P.push([lerp(-60, W + 60, k / 8), yb + 9 * Math.sin(k * 1.1 + i * 2 + seed)]);
    mdWash(P, mdGrad(cols, (i + .5) / n));
  }
}
const mdPool = (cx, cy, rx, ry, col, op = 120, seed = 5) => mdFill(mdBlob(cx, cy, rx, ry, seed, 22, .12), col, op, .18, .6);

// delicate hatching clipped to an ellipse (shadows under hems, inside roots, cheek turning)
function mdHatch(cx, cy, rx, ry, ang, gap = 9, sw = .2, col = MD.ink, seed = 1) {
  const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux, R = Math.max(rx, ry);
  const A = (ux / rx) ** 2 + (uy / ry) ** 2, cnt = Math.min(60, Math.floor(2 * R / gap));
  for (let i = 0; i <= cnt; i++) {
    const o = -R + i * gap + (mdH(seed, i) - .5) * gap * .3;
    const B = 2 * o * (vx * ux / (rx * rx) + vy * uy / (ry * ry)), C = (vx * o / rx) ** 2 + (vy * o / ry) ** 2 - 1, D = B * B - 4 * A * C;
    if (D <= 0) continue;
    const q = Math.sqrt(D), s1 = (-B - q) / (2 * A) * (.82 + .1 * mdH(seed, i + 40)), s2 = (-B + q) / (2 * A) * (.82 + .1 * mdH(seed, i + 80));
    if (s2 - s1 < 4) continue;
    const px = cx + vx * o, py = cy + vy * o, sm = (s1 + s2) / 2;
    inkLine([[px + ux * s1, py + uy * s1], [px + ux * sm + vx * 1.2, py + uy * sm + vy * 1.2], [px + ux * s2, py + uy * s2]], sw, col, 'inkfine', .5);
  }
}
function mdCross(cx, cy, rx, ry, ang, gap = 10, sw = .2, col = MD.ink, seed = 1) {
  mdHatch(cx, cy, rx, ry, ang, gap, sw, col, seed);
  mdHatch(cx, cy, rx * .8, ry * .8, ang + .95, gap * 1.2, sw * .9, col, seed + 17);
}

// ---------- wood ----------
// a knot: dark eye, growth ring and a lit lip
function mdKnot(x, y, r, an, dk, lit, seed = 1) {
  mdWash(mdBlob(x, y, r, r * .5, seed, 12, .15, an), dk, 170, .5);
  const ring = mdBlob(x, y, r * 1.8, r * .95, seed + 1, 12, .1, an); ring.push(ring[0]);
  mdLine(ring, .22, dk, .5);
  mdLine(ring.slice(7, 12), .4, lit, .5);
}
// broken bark grooves that follow the grain, crosshatch in the shadow side, and knots
function mdBark(S, g, dk, col, lit, seed, wm) {
  const m = S.m, gc = mixCol(dk, col, .35);
  let len = 0; for (let i = 1; i < m; i++) len += Math.hypot(S.C[i][0] - S.C[i - 1][0], S.C[i][1] - S.C[i - 1][1]);
  const ng = Math.min(24, 3 + Math.floor(len * Math.min(1.5, wm / 90) / 80));
  for (let j = 0; j < ng; j++) {
    const i0 = Math.floor(mdH(seed, j + 10) * Math.max(1, m - 3)), l = 2 + Math.floor(mdH(seed, j + 40) * 5), k0 = (mdH(seed, j + 70) - .5) * 1.4, Q = [];
    for (let i = i0; i < Math.min(m, i0 + l); i++) Q.push(mdOff(S, i, clamp(k0 + .14 * Math.sin(i * 1.7 + j), -.85, .85)));
    mdLine(Q, .18 + .12 * mdH(seed, j + 90), j % 3 ? gc : dk, .6);
  }
  if (wm > 24) for (let i = 1; i < m - 1; i++) {
    if (mdH(seed + 3, i) < .3) continue;
    mdLine([mdOff(S, i, g * .93), mdOff(S, i + 1, g * (.42 + .16 * mdH(seed + 5, i)))], .16, dk, 0);
  }
  const nk = wm > 50 ? 1 + (mdH(seed, 5) > .5 ? 1 : 0) : 0;
  for (let j = 0; j < nk; j++) {
    const i = Math.floor(lerp(.2, .8, mdH(seed, j + 120)) * (m - 1)), p = mdOff(S, i, (mdH(seed, j + 130) - .5) * .8);
    mdKnot(p[0], p[1], S.Wd[i] * .2, Math.atan2(-S.N[i][0], S.N[i][1]), dk, lit, seed + j);
  }
}
// a big root, trunk or bough: rounded ends, watercolour shadow side, lit glaze and edge, bark texture, fine contours.
// o: cap (rounded wash ends, default both), edge (inked ends), ws (profile), light
function mdRoot(P, w0, w1, col = MD.bark, lit = MD.barkLt, dk = MD.barkDk, seed = 1, o = {}) {
  const wm = Math.max(w0, w1), ws = o.ws || [w0, lerp(w0, w1, .5) * 1.06, w1], cap = o.cap ?? 3;
  const S = mdLimb(P, ws, col, { cap, fill: true, sh: mixCol(col, MD.ink, .5), shOp: 130, shOff: .48, shW: .52, lt: lit, ltOp: 100, ltW: .24, ink: null, light: o.light });
  const g = mdShadeSign(S, o.light);
  mdBark(S, g, dk, col, lit, seed, wm);
  inkLine(mdOffset(S, -g * .74, .04, .96), clamp(wm / 120, .45, 2), lit, 'ink', .5);
  for (const E of mdEdges(S, o.edge ?? cap)) mdLine(E, Math.min(.55, .28 + wm / 900), dk);
  return S;
}
// recursive organic branching (Rackham-like twisting limbs): forks grow out of the parent's rounded end with a flared collar
function mdBranches(x, y, a, len, w, depth, seed, out = [], tips = [], curl = .6) {
  const bend = (mdH(seed, 1) - .5) * curl, P = [[x, y]], tip = depth <= 0 || w < 2.5, base = !out.length;
  let cx = x, cy = y, ca = a;
  for (let i = 1; i <= 3; i++) { ca += bend * .6 + (mdH(seed, i + 3) - .5) * .32; cx += Math.cos(ca) * len / 3; cy += Math.sin(ca) * len / 3; P.push([cx, cy]); }
  const fl = base ? 1 : 1.12;
  out.push({ P, ws: tip ? [w * fl, w * .62, w * .26] : [w * fl, w * .84, w * .7], tip, base });
  if (tip) { tips.push([cx, cy, ca]); return { out, tips }; }
  const kids = 2 + (mdH(seed, 9) > .62 ? 1 : 0), sx = lerp(P[2][0], P[3][0], .78), sy = lerp(P[2][1], P[3][1], .78);
  for (let k = 0; k < kids; k++) {
    const spread = (k - (kids - 1) / 2) * (.5 + .35 * mdH(seed, k + 11));
    mdBranches(sx, sy, ca + spread, len * (.62 + .2 * mdH(seed, k + 20)), w * .62, depth - 1, seed * 1.37 + k * 7.1 + 1, out, tips, curl);
  }
  return { out, tips };
}
// paint a branching limb system grouped by colour; returns twig tips for leaves/flowers. o: light, sh, lt
function mdTree(x, y, a, len, w, depth, seed, col = MD.bark, dk = MD.barkDk, curl = .6, o = {}) {
  const { out, tips } = mdBranches(x, y, a, len, w, depth, seed, [], [], curl);
  const S = out.map(b => mdSpine(b.P, b.ws, 4)), G = S.map(s => mdShadeSign(s, o.light));
  const sh = o.sh || mixCol(col, MD.ink, .42), lt = o.lt || mixCol(col, '#FFF1DA', .42);
  S.forEach(s => mdWash(mdTubeS(s, 3), col, 255, .3));
  S.forEach((s, i) => mdWash(mdBand(s, G[i] * .48, .46), sh, 130, .3));
  S.forEach((s, i) => { if (s.Wd[0] > 4) mdLine(mdOffset(s, -G[i] * .5, .12, .88), Math.min(.7, .18 + s.Wd[0] / 40), lt); });
  S.forEach((s, i) => { for (const E of mdEdges(s, out[i].tip ? 2 : 0, out[i].base ? 0 : 2)) mdLine(E, Math.min(.45, .2 + s.Wd[0] / 90), dk); });
  return tips;
}
// a distant transparent trunk with a flared foot and one forking bough (replaces straight background slabs)
function mdFarTree(x, w, bend, col, op = 200, seed = 1, o = {}) {
  const y0 = o.y0 ?? H + 40, top = o.top ?? -90, h = y0 - top, j = k => (mdH(seed, k) - .5) * w;
  const P = [[x, y0], [x + bend * .1 + j(1) * .6, y0 - h * .3], [x + bend * .45 + j(2), y0 - h * .62], [x + bend, top]];
  const S = mdSpine(P, [w * 2, w * 1.15, w, w * .86, w * .72], 6), g = mdShadeSign(S, o.light), dk = mixCol(col, MD.ink, .35);
  const i = Math.floor(S.m * (.5 + .15 * mdH(seed, 3))), c = S.C[i], sd = mdH(seed, 4) > .5 ? 1 : -1;
  const B = mdSpine([c, [c[0] + sd * w * 1.2, c[1] - h * .1], [c[0] + sd * w * 2.4, c[1] - h * .24], [c[0] + sd * w * 3.4, c[1] - h * .42]], [w * .8, w * .55, w * .38, w * .3], 5);
  mdWash(mdTubeS(S, 3), col, op, .3); mdWash(mdTubeS(B, 3), col, op, .3);
  mdFill(mdBand(S, g * .5, .5), dk, 60, .1, .5);
  for (const E of mdEdges(S, 0)) mdLine(E, .22, dk);
  for (const E of mdEdges(B, 2, 2)) mdLine(E, .2, dk);
}
// mossy mound / seat with a lit crown and tufts
function mdMound(x, y, w, h, col = MD.moss, dk = MD.mossDk, seed = 2) {
  const P = [];
  for (let i = 0; i <= 14; i++) { const k = i / 14, a = Math.PI + k * Math.PI; P.push([x + Math.cos(a) * w / 2, y + Math.sin(a) * h * (1 + .12 * (mdH(seed, i) - .5))]); }
  P.push([x + w / 2, y + h * .18], [x - w / 2, y + h * .18]);
  paint(P, { wash: col, ink: dk, sw: .35, br: 'inkfine', curv: .4 });
  mdWash(mdBlob(x + w * .06, y - h * .55, w * .34, h * .32, seed, 16, .15), mixCol(col, MD.goldLt, .4), 120, .5);
  const n = Math.min(40, Math.floor(w / 22)), tc = mixCol(col, MD.goldLt, .25);
  for (let i = 0; i < n; i++) {
    const k = (i + .5) / n, a = Math.PI + k * Math.PI, px = x + Math.cos(a) * w / 2 * .96, py = y + Math.sin(a) * h * .92, l = 6 + 8 * mdH(seed + 7, i);
    mdLine([[px, py + 2], [px + (mdH(seed + 8, i) - .5) * 6, py - l * .5], [px + (k - .5) * 8, py - l]], .3, i % 3 ? tc : dk, .5);
  }
  return P;
}
// leaves; with a vein colour, larger leaves get a shaded half and a midrib
function mdLeaves(list, col, ink = null, sw = .22, vein = null) {
  for (const [x, y, s, a] of list) paint(mdLeafPts(x, y, s, a), { wash: col, ink, sw, br: 'inkfine', curv: .5 });
  if (!vein) return;
  const big = list.filter(l => l[2] >= 18);
  for (const [x, y, s, a] of big) mdWash(mdLeafPts(x, y, s, a).slice(0, 4), mixCol(col, MD.ink, .28), 110, .5);
  for (const [x, y, s, a] of big) mdLine([[x, y], [x + Math.cos(a + .06) * s * .5, y + Math.sin(a + .06) * s * .5], [x + Math.cos(a) * s * .86, y + Math.sin(a) * s * .86]], .16, vein, .5);
}
// leaf sprays at twig tips, two greens grouped by colour
function mdFoliage(tips, s, seed, c1 = MD.leaf, c2 = MD.leafLt, ink = MD.leafDk) {
  const A = [], B = [];
  tips.forEach(([x, y, a], i) => { for (let k = 0; k < 3; k++) (k % 2 ? B : A).push([x, y, s * (.7 + .5 * mdH(seed, i * 3 + k)), a + (k - 1) * .8 + (mdH(seed + 1, i + k) - .5) * .5]); });
  mdLeaves(A, c1, ink, .22, ink); mdLeaves(B, c2, ink, .22, ink);
}
// grouped flower heads: list of [x, y, r, petals, rot]; a lighter inner glaze gives each bloom a lit cup
function mdFlowers(list, col, ctr = MD.gold, ink = MD.ink) {
  for (const [x, y, r, n, rot] of list) paint(mdFlowerPts(x, y, r, n || 5, rot || 0), { wash: col, ink, sw: .2, br: 'inkfine', curv: .3 });
  const lt = mixCol(col, MD.cream, .42);
  for (const [x, y, r, n, rot] of list) if (r > 8) mdWash(mdFlowerPts(x - r * .08, y - r * .1, r * .55, n || 5, rot || 0), lt, 190, .3);
  for (const [x, y, r] of list) mdWash(ellPts(x, y, r * .24, r * .24, 10), ctr);
}
// a scatter of flower heads in a band, deterministic
function mdMeadow(x0, x1, y0, y1, n, seed, cols, rr = [10, 22]) {
  const groups = cols.map(() => []);
  for (let i = 0; i < n; i++) groups[i % cols.length].push([lerp(x0, x1, mdH(seed, i)), lerp(y0, y1, mdH(seed + 3, i)), lerp(rr[0], rr[1], mdH(seed + 7, i)), 5 + (i % 2), mdH(seed + 9, i) * TAU]);
  groups.forEach((g, i) => mdFlowers(g, cols[i], i % 2 ? MD.goldLt : MD.gold));
}
// grass blades as grouped strokes
function mdGrass(x0, x1, y, h, col, n, seed, sw = .7) {
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + mdH(seed, i)) / n), hh = h * (.45 + .55 * mdH(seed + 2, i)), lean = (mdH(seed + 4, i) - .5) * h * .7;
    inkLine([[x, y], [x + lean * .35, y - hh * .55], [x + lean, y - hh]], sw, col, 'ink', .5);
  }
}

// ---------- water ----------
function mdLilyPad(x, y, rx, ry, col = MD.emerald, dk = MD.emeraldDk, rot = 0) {
  const P = [[x, y]];
  for (let i = 0; i <= 20; i++) { const a = rot + .22 + i / 20 * (TAU - .44); P.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); }
  paint(P, { wash: col, ink: dk, sw: .3, br: 'inkfine', curv: .2 });
  mdWash(mdBlob(x - rx * .25, y - ry * .3, rx * .45, ry * .35, rot * 10 + 3, 14, .15), mixCol(col, MD.turqLt, .45), 120, .5);
  for (let k = 0; k < 4; k++) { const a = rot + .9 + k * 1.3; mdLine([[x, y], [x + Math.cos(a) * rx * .8, y + Math.sin(a) * ry * .8]], .15, dk, 0); }
}
// side-view water lily: back petals, front petals, gold heart
function mdLily(x, y, r, col = MD.magentaLt, lt = MD.rose, ctr = MD.gold) {
  const back = [-2.5, -2.0, -1.57, -1.14, -.64], front = [-2.75, -2.2, -.94, -.4];
  for (const a of back) paint(mdLeafPts(x, y, r, a, .42), { wash: mixCol(col, MD.violet, .25), ink: MD.ink, sw: .2, br: 'inkfine', curv: .5 });
  mdWash(ellPts(x, y - r * .2, r * .26, r * .2, 12), ctr);
  for (const a of front) paint(mdLeafPts(x, y + r * .05, r * .9, a, .44), { wash: lt, ink: MD.ink, sw: .2, br: 'inkfine', curv: .5 });
  for (const a of front) mdLine([[x, y + r * .05], [x + Math.cos(a) * r * .6, y + r * .05 + Math.sin(a) * r * .6]], .15, mixCol(col, MD.ink, .3), .5);
}
function mdRipples(cx, cy, rx, ry, n, col = MD.poolLt, sw = .3, seed = 4) {
  for (let i = 0; i < n; i++) {
    const k = (i + 1) / n, a0 = mdH(seed, i) * TAU, P = [];
    for (let j = 0; j <= 6; j++) { const a = a0 + j / 6 * 1.6; P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    mdLine(P, sw, col, .5);
  }
}

// ---------- light ----------
function mdMoon(x, y, r) {
  glow(x, y, r * 5, MD.moonGlow, .9); glow(x, y, r * 2.2, '#F2EEFF', .8);
  paint(ellPts(x, y, r, r, 32), { wash: MD.moon, ink: MD.sapphireLt, sw: .3, br: 'inkfine' });
  mdWash(mdBlob(x - r * .3, y - r * .15, r * .22, r * .17, 8, 12, .2), '#D5DDF6');
  mdWash(mdBlob(x + r * .28, y + r * .3, r * .16, r * .12, 9, 12, .2), '#D5DDF6');
}
// a luminous slanting shaft of forest light as steady glow dabs
function mdShaft(x0, y0, x1, y1, r, col = MD.goldLt, a = .45, n = 8) {
  const L = [];
  for (let i = 0; i < n; i++) { const k = i / (n - 1); L.push([lerp(x0, x1, k), lerp(y0, y1, k), r * lerp(.6, 1.3, k), a * (1 - .55 * k)]); }
  mdLights(L, col);
}
function mdFireflies(n, x0, y0, x1, y1, seed, col = MD.goldLt, r = 16) {
  const L = [];
  for (let i = 0; i < n; i++) L.push([lerp(x0, x1, mdH(seed, i)), lerp(y0, y1, mdH(seed + 5, i)), r * (.6 + .8 * mdH(seed + 9, i)), .5 + .5 * mdH(seed + 11, i)]);
  mdLights(L, col);
  for (const [x, y] of L) mdWash(ellPts(x, y, 2.4, 2.4, 6), MD.cream);
}
function mdSparks(list, col = MD.goldLt) {
  for (const [x, y, r, rot] of list) mdWash(starPts(x, y, r, .3, 4, rot || 0), col);
}

// ---------- cloth / ornament ----------
// gold vine embroidery along a path: a fine stem with alternating tiny leaves
function mdVine(P, col = MD.gold, sw = .3, ls = 9, seed = 1) {
  const C = through(P, 5);
  inkLine(C, sw, col, 'inkfine', .5);
  for (let i = 2; i < C.length - 1; i += 3) {
    const a = C[i - 1], b = C[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + (i % 2 ? .9 : -.9);
    mdWash(mdLeafPts(C[i][0], C[i][1], ls * (.7 + .5 * mdH(seed, i)), ang, .45), col);
  }
}
// soft transparent colour shadow inside a garment region, then a highlight streak
function mdDrape(P, shade, op = 120, hi = null, hiP = null, hiW = 1.2) {
  mdFill(P, shade, op, .08, .55);
  if (hi && hiP) inkLine(hiP, hiW, hi, 'ink', .6);
}
