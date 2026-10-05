// src/scenes/panels.js — the five Midsummer stills: luminous Rackham-style forest stagings painted around the cast rig.
// Each LOOPS.P0n paints one 1920×1080 frame at t = 0 and reseeds itself, so every panel is independent of the others.
const PNL = {
  mag: '#D4178A', vio: '#7A3DC4', vioDk: '#3E1E73', sap: '#2446C6', turq: '#2FC6C2', emer: '#149C62', emerDk: '#0B5A3C',
  leafLt: '#9BE26A', leafMd: '#4FB657', gold: '#F3C34E', goldDk: '#B88322', ruby: '#C91F3C', lily: '#FFF6F2', lilyPk: '#F49BC8',
  bark: '#6E4B3A', barkLt: '#A97F5E', barkDk: '#3A2217', moss: '#63B34B', mossDk: '#2C6B35', water: '#2A8FD2', waterDk: '#163F86',
  skyDay: '#8FDDE8', night: '#1B2566', nightLt: '#4D5FC8', moon: '#FFF2C9', cream: '#FFF6E3'
};
const pnlSeed = () => { randomSeed(424242); noiseSeed(424242); };
const pnlRnd = (a, b) => a + random() * (b - a);
const pnlFine = (col, sw = .3) => ({ ink: col, sw, br: 'inkfine' });

// ---------- environment helpers ----------
function pnlSky(top, bot, o = {}) {
  paint(rectPts(-40, -40, W + 80, H + 80), { wash: top, ink: null });
  const n = o.bands ?? 4;
  for (let i = 0; i < n; i++) { const q = (i + 1) / n; paint(ellPts(W / 2 + (hash(i + 2) - .5) * 500, H * (o.y0 ?? .4) + q * H * .7, W * .85, H * .42, 26, 40), { fill: mixCol(top, bot, q), fillOp: 160, bleed: .3, tex: .5, ink: null, curv: .5 }); }
}
function pnlLeaves(list, col, sw) {
  for (const [x, y, r, a] of list) paint([[x, y], [x + Math.cos(a - .55) * r * .62, y + Math.sin(a - .55) * r * .62], [x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a + .55) * r * .62, y + Math.sin(a + .55) * r * .62]], { wash: col, ink: sw ? MS_INK : null, sw, br: 'inkfine', curv: .45 });
  if (sw) for (const [x, y, r, a] of list) inkLine([[x, y], [x + Math.cos(a) * r * .85, y + Math.sin(a) * r * .85]], sw * .7, MS_INK, 'inkfine', 0);
}
// A massed canopy: two watercolour blobs, then grouped leaf washes with a few fine contours.
function pnlFoliage(x, y, rx, ry, cols, o = {}) {
  const m = Math.min(rx, ry);
  paint(ellPts(x, y, rx, ry, 26, m * .22), { fill: cols[0], fillOp: 190, bleed: .25, tex: .6, ink: null, curv: .5 });
  paint(ellPts(x - rx * .2, y - ry * .25, rx * .65, ry * .6, 20, m * .18), { fill: cols[1], fillOp: 140, bleed: .3, tex: .5, ink: null, curv: .5 });
  const n = o.n ?? 26, L = [[], [], []];
  for (let i = 0; i < n; i++) { const a = pnlRnd(0, TAU), d = Math.sqrt(random()); L[i % 3].push([x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, pnlRnd(.08, .16) * m, pnlRnd(0, TAU)]); }
  pnlLeaves(L[0], cols[1], 0); pnlLeaves(L[1], cols[2] || cols[1], .22); pnlLeaves(L[2], cols[0], .2);
}
// Twisting branch: a noisy ribbon with a bark line, forking twice, leaf tufts at the ends.
function pnlBranch(x, y, ang, len, w, col, depth, leafCols, o = {}) {
  const P = [[x, y]]; let a = ang, cx = x, cy = y; const n = 6;
  for (let i = 1; i <= n; i++) { a += (noise(cx * .003 + 7, cy * .003) - .5) * (o.twist ?? 1.1) + (o.bend || 0) / n; cx += Math.cos(a) * len / n; cy += Math.sin(a) * len / n; P.push([cx, cy]); }
  paint(ribbon(P, w, w * .3), { wash: col, ...pnlFine(MS_INK, .3 + w * .003), curv: .3 });
  const R = ribbon(P, w * .5, w * .15);
  inkLine(R.slice(0, R.length >> 1).filter((_, i) => i % 2 === 0), .25, PNL.barkDk, 'inkfine', .4);
  if (depth > 0) for (const k of [.4, .72]) { const j = Math.min(n, Math.round(k * n)), b = P[j], da = (hash(j * 13 + x) - .5) * 1.6 + (k > .5 ? .5 : -.5); pnlBranch(b[0], b[1], a + da * (o.spread ?? 1), len * .55, w * .5, col, depth - 1, leafCols, o); }
  else if (leafCols) { const L = []; for (let i = 0; i < 7; i++) { const p = P[Math.floor(pnlRnd(1, P.length))]; L.push([p[0] + pnlRnd(-w, w), p[1] + pnlRnd(-w, w), pnlRnd(18, 34) * (o.leafK ?? 1), pnlRnd(0, TAU)]); } pnlLeaves(L, leafCols[Math.floor(pnlRnd(0, leafCols.length))], .22); }
  return P;
}
function pnlTrunk(x, yBase, h, w, lean, col, o = {}) {
  const P = []; for (let i = 0; i <= 6; i++) { const q = i / 6; P.push([x + lean * q * h + Math.sin(q * 5 + (o.ph || 0)) * w * .35 * q, yBase - q * h]); }
  const top = o.top ?? .5;
  paint(ribbon(P, w, w * top), { wash: col, fill: PNL.barkDk, fillOp: 90, bleed: .1, tex: .6, ...pnlFine(MS_INK, .4), curv: .25 });
  for (let k = 0; k < 3; k++) { const R = ribbon(P, w * (.25 + k * .25), w * top * (.25 + k * .25)); inkLine(R.slice(0, R.length >> 1).filter((_, i) => i % 2 === 0), .22 + k * .04, k % 2 ? PNL.barkLt : PNL.barkDk, 'inkfine', .4); }
  return P;
}
function pnlRoot(P, w0, w1, col = PNL.bark, o = {}) {
  const R = ribbon(P, w0, w1), n = R.length >> 1;
  paint(R, { wash: col, fill: PNL.barkDk, fillOp: o.shade ?? 85, bleed: .12, tex: .6, ...pnlFine(MS_INK, .36), curv: .3 });
  const I = ribbon(P, w0 * .55, w1 * .55);
  inkLine(I.slice(0, n).filter((_, i) => i % 2 === 0), .26, PNL.barkDk, 'inkfine', .4);
  inkLine(I.slice(n).filter((_, i) => i % 2 === 0), .22, mixCol(col, PNL.cream, .35), 'inkfine', .4);
  if (o.moss !== false) paint(ribbon(P.map(p => [p[0], p[1] - w0 * .28]), w0 * .34, w1 * .34), { wash: PNL.moss, ink: null, curv: .4 });
  for (let i = 3; i < n - 2; i += 6) inkLine([I[i], [I[i][0] + 4, I[i][1] - w0 * .22]], .2, PNL.barkDk, 'inkfine', .3);
}
function pnlFlowers(list, col, centre = PNL.gold) {
  const dk = mixCol(col, MS_INK, .45);
  for (const [x, y, r, n] of list) paint(starPts(x, y, r, .5, n || 5, hash(x + y) * TAU), { wash: col, ink: dk, sw: .2, br: 'inkfine', curv: .55 });
  for (const [x, y, r] of list) paint(ellPts(x, y, r * .28, r * .28, 8), { wash: centre, ink: null });
}
function pnlGrass(x, y, rx, ry, col, n) {
  for (let i = 0; i < n; i++) { const bx = x + pnlRnd(-rx, rx), by = y + pnlRnd(-ry, ry) * .6, h = pnlRnd(25, 60), lean = pnlRnd(-.4, .4); inkLine([[bx, by], [bx + lean * h * .4, by - h * .6], [bx + lean * h, by - h]], .35, col, 'inkfine', .5); }
}
// A jewel flower bed: a shadow pool, grass, then flowers grouped by colour.
function pnlBed(x, y, rx, ry, cols, n = 14, r0 = 12, r1 = 22) {
  paint(ellPts(x, y + ry * .3, rx, ry * .8, 20, ry * .2), { fill: PNL.emerDk, fillOp: 90, bleed: .3, tex: .5, ink: null, curv: .5 });
  pnlGrass(x, y, rx, ry, PNL.mossDk, 10);
  const L = cols.map(() => []);
  for (let i = 0; i < n; i++) { const a = pnlRnd(0, TAU), d = Math.sqrt(random()); L[i % cols.length].push([x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, pnlRnd(r0, r1), 5 + (i % 3)]); }
  cols.forEach((c, i) => pnlFlowers(L[i], c));
}
function pnlFern(x, y, ang, len, col) {
  const P = []; for (let i = 0; i <= 5; i++) { const q = i / 5; P.push([x + Math.cos(ang - q * .5) * len * q, y + Math.sin(ang - q * .5) * len * q]); }
  inkLine(P, .35, col, 'inkfine', .5);
  const C = through(P, 2);
  for (let i = 2; i < C.length - 1; i += 2) { const a = msAng(C[i - 1], C[i + 1]), l = len * .18 * (1 - i / C.length); for (const sd of [-1, 1]) inkLine([C[i], msOff(C[i], a + sd * 1.2, l)], .25, col, 'inkfine', 0); }
}
// Parallel pencil-like lines in a tilted rectangle: Rackham crosshatch for ground shadow.
function pnlHatch(x, y, w, h, ang, d, col, sw = .2) {
  const c = Math.cos(ang), s = Math.sin(ang), n = Math.floor(w / d);
  for (let i = 0; i <= n; i++) { const u = -w / 2 + i * d, j = jit(2); inkLine([[x + u * c + (h / 2) * s + j, y + u * s - (h / 2) * c], [x + u * c - (h / 2) * s, y + u * s + (h / 2) * c + j]], sw, col, 'inkfine', 0); }
}
function pnlRipples(cx, cy, rx, ry, n, col) {
  for (let i = 0; i < n; i++) { const x = cx + pnlRnd(-rx, rx), y = cy + pnlRnd(-ry, ry), l = pnlRnd(40, 140); inkLine([[x - l / 2, y], [x - l / 4, y - 3], [x, y + 2], [x + l / 4, y - 2], [x + l / 2, y + 1]], .35, col, 'inkfine', .6); }
}
function pnlPads(list, col) {
  for (const [x, y, r] of list) { paint(ellPts(x, y, r, r * .5, 20, r * .04), { wash: col, ...pnlFine(PNL.emerDk, .3), curv: .5 }); inkLine([[x, y], [x + r * .95, y - r * .12]], .3, PNL.emerDk, 'inkfine', 0); }
}
function pnlLilies(list, col, pk) {
  for (const [x, y, r] of list) paint(starPts(x, y, r, .42, 9, -1.3), { wash: col, ...pnlFine(pk, .25), curv: .55 });
  for (const [x, y, r] of list) paint(starPts(x, y - r * .1, r * .55, .4, 7, -.9), { wash: pk, washOp: 160, ink: null, curv: .55 });
  for (const [x, y, r] of list) paint(ellPts(x, y, r * .18, r * .14, 8), { wash: PNL.gold, ink: null });
}
function pnlGlade(x, y, rx, ry, col = '#FFE9A8') {
  paint(ellPts(x, y, rx, ry, 28, 60), { fill: PNL.cream, fillOp: 170, bleed: .45, tex: .3, ink: null, curv: .5 });
  glow(x, y - 30, rx, col, .9); glow(x, y, rx * .5, '#FFF6D8', .7);
}

// ---------- P01 — Root throne ----------
LOOPS.P01 = t => {
  pnlSeed();
  pnlSky('#AEEAEA', '#1C7F55', { y0: .3 });
  pnlGlade(960, 430, 560, 380);
  pnlTrunk(150, 1000, 1150, 140, .05, PNL.barkLt, { ph: 1 });
  pnlTrunk(1790, 1000, 1150, 120, -.04, PNL.barkLt, { ph: 2.5 });
  pnlFoliage(260, 110, 440, 240, [PNL.emerDk, PNL.emer, PNL.leafLt], { n: 30 });
  pnlFoliage(1660, 90, 470, 250, [PNL.vioDk, PNL.vio, PNL.leafMd], { n: 30 });
  pnlFoliage(1230, 120, 360, 130, [PNL.emer, PNL.leafMd, PNL.leafLt], { n: 20 });
  pnlBranch(300, 40, .7, 520, 38, PNL.bark, 2, [PNL.leafLt, PNL.emer]);
  pnlBranch(1640, 20, 2.45, 520, 36, PNL.bark, 2, [PNL.leafMd, PNL.leafLt]);
  paint([[-40, 905], [500, 895], [1100, 902], [1960, 888], [1960, 1120], [-40, 1120]], { wash: PNL.mossDk, fill: PNL.emerDk, fillOp: 120, bleed: .2, tex: .6, ink: null, curv: .3 });
  pnlHatch(960, 985, 1500, 80, .05, 14, PNL.emerDk, .2);
  // the throne: two rising back roots, root legs, then the mossy seat
  pnlRoot([[330, 990], [360, 760], [470, 520], [640, 360], [760, 300]], 110, 60, PNL.bark);
  pnlRoot([[1560, 990], [1520, 740], [1400, 520], [1230, 400], [1120, 360]], 100, 55, PNL.bark);
  pnlRoot([[700, 650], [660, 790], [640, 930]], 64, 48, PNL.bark, { moss: false });
  pnlRoot([[1280, 660], [1330, 800], [1350, 930]], 64, 48, PNL.bark, { moss: false });
  pnlRoot([[540, 780], [700, 690], [950, 652], [1200, 660], [1440, 740]], 100, 86, PNL.bark);
  pnlFlowers([[590, 720, 20, 6], [1400, 715, 18, 5], [1460, 760, 16, 6], [560, 770, 15, 5], [1200, 640, 14, 6]], PNL.vio);
  // Titania, seated, right knee crossed over the left; the braced hand on the seat, the other on the raised knee
  const TI = MS_CAST.titania, s = 145, p = msStand({ lean: .06, turn: .25 });
  Object.assign(p, {
    head: [.12, -2.8], neck: [.1, -2.3], shL: [-.44, -2.02], shR: [.6, -2.0],
    elL: [-.78, -1.0], wrL: [-.5, .08], handL: { ang: 1.35, spread: .35, curl: .3, side: 1 },
    elR: [.9, -.95], wrR: [1.0, .12], handR: { ang: .35, spread: .4, curl: .05, side: -1 },
    hipL: [-.33, 0], hipR: [.33, 0], knL: [-.15, .62], anL: [-.38, 2.0], footL: { ang: .2 },
    knR: [-.6, .42], anR: [-1.0, 1.65], footR: { ang: .8 },
    front: 'R', face: { ...MS_EXPR.regal, look: [.4, .1] },
    skirt: [[.62, .22], [.72, .9], [.45, 1.25], [.1, .85], [-.2, .55], [-.5, .42], [-.78, .4], [-.95, .28]],
    order: ['hairBack', 'legB', 'legF', 'skirt', 'torso']
  });
  const J = msFigure(900, 580, s, TI, p, { light: 1, skirt: { trim: TI.trim, folds: 5 } });
  // the crossed thigh lies over the lap in gown cloth, so the crossed knees read at once
  const thigh = msTube([msMid(J.hipR, J.knR, .18), msMid(J.hipR, J.knR, .55), J.knR], [s * .52, s * .47, s * .4]);
  paint(thigh, { wash: TI.gown, ...pnlFine(MS_INK, .3), curv: .25 });
  paint(msTube([msMid(J.hipR, J.knR, .3), msMid(J.hipR, J.knR, .65), msMid(J.hipR, J.knR, .96)].map(q => [q[0], q[1] + s * .12]), [s * .18, s * .16, s * .1]), { wash: TI.gownDk, washOp: 110, ink: null, curv: .3 });
  paint(msTube([msMid(J.hipR, J.knR, .35), msMid(J.hipR, J.knR, .7), msMid(J.hipR, J.knR, .95)].map(q => [q[0], q[1] - s * .1]), [s * .1, s * .09, s * .06]), { wash: TI.gownLt, washOp: 80, ink: null, curv: .3 });
  for (let i = 0; i < 3; i++) { const a = msMid(J.hipR, J.knR, .2 + i * .18), b = msMid(J.hipR, J.knR, .45 + i * .18); inkLine([a, [b[0] - s * .04, b[1] + s * .14]], .22, TI.gownDk, 'inkfine', .5); }
  const V = []; for (let i = 0; i <= 6; i++) { const q = msMid(J.hipR, J.knR, .2 + i * .13); V.push([q[0] + Math.sin(i * 1.6) * s * .05, q[1] - s * .05]); }
  inkLine(V, .3, TI.trim, 'inkfine', .6);
  msArm(J.shL, J.elL, J.wrL, p.handL, TI, s, 1); msArm(J.shR, J.elR, J.wrR, p.handR, TI, s, 1);
  msHead(J.head[0], J.head[1], s, TI, { turn: p.turn, tilt: p.tilt, light: 1, ...p.face });
  msHairFront(J.head[0], J.head[1], s, TI, { turn: p.turn, tilt: p.tilt, wind: 0, len: 1 });
  // foreground flowers and ferns
  pnlBed(290, 955, 250, 55, [PNL.mag, PNL.vio, PNL.gold], 16, 14, 24);
  pnlBed(1600, 950, 280, 60, [PNL.turq, PNL.mag, PNL.ruby], 16, 14, 24);
  pnlBed(1000, 1018, 420, 32, [PNL.vio, PNL.gold, PNL.mag], 14, 12, 20);
  pnlFern(420, 900, -1.3, 180, PNL.emer); pnlFern(1480, 890, -1.8, 170, PNL.emer); pnlFern(600, 915, -1.0, 150, PNL.leafMd); pnlFern(1300, 905, -2.1, 150, PNL.leafMd);
  glows([[960, 400, 220, .5], [600, 300, 60, .5], [1350, 330, 50, .5], [450, 600, 40, .4], [1500, 560, 40, .4]], '#FFF1B8', true);
};
LOOPS.P01.len = 1;

// ---------- P02 — Forest stride ----------
LOOPS.P02 = t => {
  pnlSeed();
  pnlSky(PNL.skyDay, '#2E9E6A', { y0: .3 });
  pnlGlade(1250, 300, 520, 330, '#FFEDB0');
  pnlTrunk(120, 1000, 1150, 150, .04, PNL.barkLt, { ph: 2 });
  pnlTrunk(520, 980, 1100, 70, -.03, PNL.barkLt, { ph: 4 });
  pnlTrunk(1820, 1000, 1150, 110, -.05, PNL.barkLt, { ph: 1 });
  pnlFoliage(380, 100, 520, 250, [PNL.emerDk, PNL.emer, PNL.leafLt], { n: 32 });
  pnlFoliage(1700, 110, 380, 200, [PNL.vioDk, PNL.vio, PNL.leafMd], { n: 24 });
  pnlFoliage(1150, 50, 300, 110, [PNL.emer, PNL.leafLt, PNL.gold], { n: 16 });
  pnlBranch(1880, 160, 3.3, 600, 40, PNL.bark, 2, [PNL.leafMd, PNL.leafLt]);
  pnlBranch(560, 120, .4, 400, 26, PNL.bark, 1, [PNL.leafLt, PNL.emer]);
  // sunlit path between mossy banks
  paint([[-40, 940], [500, 915], [1100, 925], [1960, 900], [1960, 1120], [-40, 1120]], { wash: PNL.mossDk, fill: PNL.emerDk, fillOp: 110, bleed: .2, tex: .6, ink: null, curv: .3 });
  paint([[300, 1120], [520, 960], [900, 940], [1300, 950], [1600, 1120]], { wash: '#D9B36A', fill: '#A77A3A', fillOp: 90, bleed: .25, tex: .6, ink: null, curv: .4 });
  pnlHatch(400, 990, 500, 70, .08, 14, PNL.emerDk, .2); pnlHatch(1550, 985, 500, 70, -.06, 14, PNL.emerDk, .2);
  // the root she steps over
  pnlRoot([[880, 1010], [1000, 950], [1150, 925], [1350, 935], [1600, 975], [1900, 1020]], 64, 56, PNL.bark);
  pnlRoot([[1180, 930], [1260, 885], [1380, 865], [1520, 895]], 34, 24, PNL.bark, { moss: false });
  // leaves streaming left on the breeze, behind her
  const bl = []; for (let i = 0; i < 14; i++) bl.push([pnlRnd(150, 760), pnlRnd(220, 720), pnlRnd(14, 26), Math.PI + pnlRnd(-.3, .3)]);
  pnlLeaves(bl, PNL.leafLt, .2);
  for (const [x, y] of bl) inkLine([[x + 30, y + 4], [x + 90, y + 10]], .25, PNL.cream, 'inkfine', 0);
  // Helena mid-stride: left foot planted, right foot lifted over the root, skirts and hair blown left
  const HE = MS_CAST.helena, s = 125, p = msStand({ lean: .18, turn: .55 });
  Object.assign(p, {
    head: [.3, -2.8], neck: [.25, -2.3], shL: [-.3, -2.05], shR: [.55, -2.0],
    elL: [.15, -1.15], wrL: [.7, -.5], handL: { ang: -.4, spread: .45, curl: .1, side: 1 },
    elR: [.3, -1.0], wrR: [-.25, -.2], handR: { ang: 1.9, spread: .3, curl: .5, side: -1 },
    hipL: [-.22, 0], hipR: [.28, 0], knL: [-.5, 1.75], anL: [-.72, 3.5], footL: { ang: .15 },
    knR: [.9, 1.15], anR: [1.05, 2.3], footR: { ang: .8 },
    wind: -.75, hairLen: .9, front: 'R', face: { brow: .3, lids: .1, mouth: { open: .15, smile: .4 }, look: [.7, -.1] },
    skirt: [[.8, .9], [.55, 2.3], [.05, 2.75], [-.6, 2.95], [-1.25, 2.75], [-1.5, 2.25], [-1.05, 1.65], [-.5, 1.25]],
    over: [[.5, .8], [.3, 1.5], [-.35, 2.1], [-1.3, 2.5], [-2.1, 2.2], [-1.95, 1.6], [-1.3, 1.25], [-.6, .95]]
  });
  msFigure(900, 520, s, HE, p, { light: 1, skirt: { folds: 4 }, over: { trim: HE.trim, folds: 3 } });
  // a few leaves cross in front, flowers along the banks
  pnlLeaves([[700, 300, 18, 3.3], [640, 560, 16, 3.0], [1180, 420, 15, 3.2], [1250, 700, 17, 2.9]], PNL.leafLt, .2);
  pnlBed(250, 985, 220, 45, [PNL.mag, PNL.gold, PNL.vio], 14, 12, 22);
  pnlBed(1650, 1000, 260, 45, [PNL.turq, PNL.mag, PNL.ruby], 14, 12, 22);
  pnlFlowers([[1120, 905, 16, 6], [1300, 912, 14, 5], [1480, 940, 15, 6]], PNL.vio);
  pnlFern(1700, 950, -1.9, 160, PNL.emer); pnlFern(380, 925, -1.2, 150, PNL.leafMd);
  glows([[1300, 250, 240, .5], [700, 200, 60, .4], [1500, 500, 40, .4]], '#FFF1B8', true);
};
LOOPS.P02.len = 1;

// ---------- P03 — Lily-pool portrait ----------
LOOPS.P03 = t => {
  pnlSeed();
  pnlSky('#B9F0E6', '#1F8A6A', { y0: .25 });
  for (let i = 0; i < 7; i++) paint(ellPts(pnlRnd(200, 1800), pnlRnd(60, 700), pnlRnd(60, 160), pnlRnd(50, 120), 18, 12), { fill: i % 2 ? PNL.cream : PNL.turq, fillOp: 70, bleed: .5, tex: .2, ink: null, curv: .5 });
  glow(1500, 350, 600, '#FFF0B8', .9); glow(1400, 250, 300, '#FFFFFF', .5);
  pnlFoliage(250, 120, 400, 220, [PNL.emerDk, PNL.emer, PNL.leafLt], { n: 26 });
  pnlFoliage(1750, 60, 320, 150, [PNL.vioDk, PNL.vio, PNL.leafMd], { n: 16 });
  pnlBranch(1760, -20, 2.0, 520, 30, PNL.bark, 2, [PNL.leafLt, PNL.emer], { twist: .6 });
  for (let i = 0; i < 9; i++) { const x0 = 1300 + i * 60, l = pnlRnd(250, 520); inkLine([[x0, -20], [x0 - 20 + pnlRnd(-10, 10), l * .5], [x0 - 50, l]], .4, PNL.emerDk, 'inkfine', .5); }
  // the pool behind and beside her
  paint([[-40, 1120], [-40, 990], [250, 965], [520, 975], [800, 950], [1000, 895], [1300, 785], [1700, 750], [1960, 770], [1960, 1120]], { wash: PNL.water, fill: PNL.waterDk, fillOp: 120, bleed: .2, tex: .5, ink: null, curv: .4 });
  paint([[1050, 900], [1400, 820], [1800, 800], [1900, 950], [1500, 1000], [1150, 1000]], { fill: PNL.turq, fillOp: 110, bleed: .4, tex: .3, ink: null, curv: .5 });
  pnlRipples(1450, 900, 400, 120, 10, '#CFF6F0');
  pnlPads([[1250, 880, 60], [1500, 850, 55], [1700, 900, 70], [1350, 960, 65]], PNL.emer);
  pnlLilies([[1260, 862, 30], [1510, 832, 26], [1710, 880, 34]], PNL.lily, PNL.lilyPk);
  // Hermia turns to the voice off-frame right; one hand at her collarbone
  const HM = MS_CAST.hermia, s = 220, p = msStand({ lean: .1, turn: .6 });
  Object.assign(p, {
    head: [.2, -2.85], neck: [.15, -2.32], shL: [-.55, -2.05], shR: [.6, -2.05],
    elR: [.85, -1.1], wrR: [.25, -1.7], handR: { ang: -2.2, spread: .3, curl: .3, side: -1 },
    elL: [-.95, -1.25], wrL: [-1.3, -.6], handL: { ang: 2.6, spread: .35, curl: .1, side: -1 },
    tilt: -.06, wind: .15, front: 'R', face: { ...MS_EXPR.attentive, look: [.7, -.05] },
    drape: [[-.7, -2.1], [-1.0, -1.6], [-1.15, -1.0], [-1.25, -.55]],
    order: ['hairBack', 'torso', 'drape', 'armF', 'head', 'hairFront']
  });
  const J = msFigure(760, 1100, s, HM, p, { light: 1, headScale: 1.1, drape: { w0: .35, w1: .6 } });
  glow(900, 720, 260, '#B9F2EA', .3);
  // the near bank and water in front of her, the resting hand, foreground lilies
  paint([[-40, 1120], [-40, 1005], [250, 985], [520, 995], [800, 970], [1000, 915], [1300, 805], [1960, 790], [1960, 1120]], { wash: PNL.water, fill: PNL.waterDk, fillOp: 100, bleed: .2, tex: .5, ink: null, curv: .4 });
  paint(ribbon([[-40, 985], [250, 962], [520, 972], [800, 948], [1000, 893], [1300, 783]], 44, 30), { wash: PNL.moss, fill: PNL.mossDk, fillOp: 90, bleed: .15, tex: .6, ...pnlFine(MS_INK, .3), curv: .3 });
  pnlGrass(400, 960, 350, 10, PNL.mossDk, 8);
  msArm(J.shL, J.elL, J.wrL, p.handL, HM, s, 1);
  pnlRipples(700, 1040, 600, 30, 6, '#CFF6F0');
  pnlPads([[200, 1045, 80], [700, 1055, 75], [1150, 1030, 70], [1600, 1000, 80], [1850, 1060, 70]], PNL.emer);
  pnlLilies([[215, 1020, 44], [1165, 1005, 40], [1615, 975, 46], [720, 1035, 36]], PNL.lily, PNL.lilyPk);
  pnlFlowers([[1000, 905, 14, 6], [1420, 790, 12, 5], [1860, 795, 14, 6]], PNL.vio);
  glows([[1500, 350, 260, .4], [1200, 150, 50, .4], [1650, 560, 40, .4], [1700, 880, 24, .5], [1260, 862, 20, .5]], '#FFF6DC', true);
};
LOOPS.P03.len = 1;

// ---------- P04 — Moonlit disagreement ----------
LOOPS.P04 = t => {
  pnlSeed();
  pnlSky(PNL.night, '#5A3FA8', { y0: .2 });
  paint(ellPts(960, 300, 760, 360, 28, 60), { fill: PNL.nightLt, fillOp: 110, bleed: .45, tex: .3, ink: null, curv: .5 });
  glow(420, 170, 420, '#C9D8FF', .8); glow(420, 170, 200, '#FFF3D0', .9);
  paint(ellPts(420, 170, 78, 78, 30, 2), { wash: PNL.moon, ink: null });
  glows([[420, 170, 140, .9], [1500, 130, 7, .8], [1200, 90, 6, .7], [1700, 260, 6, .7], [900, 60, 5, .6], [1650, 60, 5, .6], [300, 420, 5, .6], [1050, 200, 5, .6]], '#FFF6DC', true);
  pnlFoliage(1500, 60, 520, 230, [PNL.vioDk, '#4A2E8A', '#2A5A74'], { n: 28 });
  pnlFoliage(180, 420, 240, 260, [PNL.vioDk, '#2E6B6A', '#4A2E8A'], { n: 20 });
  pnlTrunk(1800, 1000, 1150, 130, -.05, '#4A3550', { ph: 2 });
  pnlTrunk(90, 1000, 1150, 110, .03, '#4A3550', { ph: 3 });
  pnlBranch(1760, 120, 3.0, 620, 42, '#4A3550', 2, ['#2E8A7A', '#4A2E8A']);
  pnlBranch(60, 300, -.3, 420, 30, '#4A3550', 1, ['#2E8A7A', '#6AC7B8']);
  // moonlit ground
  paint([[-40, 1000], [600, 985], [1300, 975], [1960, 960], [1960, 1120], [-40, 1120]], { wash: '#1F4A5A', fill: PNL.night, fillOp: 130, bleed: .2, tex: .6, ink: null, curv: .3 });
  paint([[300, 1000], [800, 985], [1200, 980], [1500, 1020], [1000, 1060], [400, 1050]], { fill: '#2FA6A0', fillOp: 80, bleed: .4, tex: .4, ink: null, curv: .5 });
  pnlHatch(960, 1045, 1700, 50, .03, 16, '#102A40', .22);
  // the fallen branch between them
  pnlRoot([[700, 1000], [850, 950], [1000, 928], [1150, 938], [1280, 985]], 58, 44, '#5A4058');
  pnlBranch(1000, 928, -1.3, 110, 12, '#5A4058', 0, null); pnlBranch(860, 950, -2.0, 90, 10, '#5A4058', 0, null);
  // Helena, left, open palm raised toward Hermia, speaking
  const HE = MS_CAST.helena, HM = MS_CAST.hermia;
  const a = msStand({ lean: .1, turn: .7 });
  Object.assign(a, {
    head: [.3, -2.82], neck: [.25, -2.3], shL: [-.3, -2.05], shR: [.55, -2.02],
    elL: [-.55, -1.1], wrL: [-.3, -.25], handL: { ang: 1.2, spread: .3, curl: .5, side: 1 },
    elR: [.95, -1.35], wrR: [1.55, -1.7], handR: { ang: -.35, spread: .5, curl: -.05, side: -1 },
    hipL: [-.25, 0], hipR: [.28, 0], knL: [-.35, 1.9], anL: [-.45, 3.75], footL: { ang: .3 }, knR: [.5, 1.85], anR: [.65, 3.72], footR: { ang: .1 },
    wind: -.2, front: 'R', face: { ...MS_EXPR.speak, look: [.7, .1] },
    skirt: [[.8, 3.3], [.45, 3.5], [-.15, 3.55], [-.7, 3.45], [-1.0, 3.15], [-.8, 2.2]],
    over: [[.3, .9], [.1, 2.0], [-.3, 3.0], [-.9, 3.5], [-1.5, 3.4], [-1.4, 2.6], [-.9, 1.6], [-.5, .8]]
  });
  msFigure(600, 555, 112, HE, a, { light: -1, skirt: { folds: 4 }, over: { trim: HE.trim, folds: 3 } });
  // Hermia, right, one hand lifted in a firm pointed gesture, the other at her sash
  const b = msStand({ lean: -.08, turn: -.7 });
  Object.assign(b, {
    head: [-.3, -2.82], neck: [-.25, -2.3], shR: [.3, -2.05], shL: [-.55, -2.02],
    elR: [.5, -1.1], wrR: [.4, -.15], handR: { ang: 1.6, spread: .25, curl: .4, side: 1 },
    elL: [-.9, -1.4], wrL: [-1.45, -1.85], handL: { ang: -2.9, spread: .15, curl: .55, side: 1 },
    hipL: [-.28, 0], hipR: [.25, 0], knL: [-.5, 1.85], anL: [-.65, 3.72], footL: { ang: Math.PI - .15 }, knR: [.35, 1.9], anR: [.45, 3.75], footR: { ang: Math.PI - .3 },
    wind: .15, front: 'L', face: { ...MS_EXPR.firm, look: [-.7, 0] },
    skirt: [[.9, 3.2], [.6, 3.5], [.1, 3.55], [-.45, 3.5], [-.85, 3.3], [-.75, 2.4]],
    drape: [[-.6, -2.1], [-.95, -1.5], [-1.05, -.8], [-1.2, 0]]
  });
  msFigure(1300, 572, 104, HM, b, { light: -1, skirt: { trim: HM.trim, folds: 4 }, drape: { w0: .3, w1: .5 } });
  // night flowers and fireflies
  pnlBed(220, 990, 150, 40, [PNL.vio, PNL.mag, PNL.turq], 10, 12, 20);
  pnlBed(1700, 985, 170, 40, [PNL.mag, PNL.turq, PNL.gold], 10, 12, 20);
  pnlFlowers([[960, 1030, 16, 6], [1040, 1050, 14, 5], [880, 1050, 13, 6]], PNL.vio);
  const ff = []; for (let i = 0; i < 16; i++) ff.push([pnlRnd(120, 1800), pnlRnd(380, 980), pnlRnd(8, 20), pnlRnd(.4, .9)]);
  glows(ff, '#FFE48A', true);
  glows([[960, 940, 260, .25], [700, 760, 140, .2]], '#8FD6FF', true);
};
LOOPS.P04.len = 1;

// ---------- P05 — Canopy court ----------
LOOPS.P05 = t => {
  pnlSeed();
  pnlSky('#8FE0E6', '#1E7D55', { y0: .35 });
  pnlGlade(900, 480, 520, 420);
  // the great left trunk, its arching branches, the canopy and Puck's branch from the right
  pnlTrunk(230, 1010, 1120, 230, .08, PNL.bark, { ph: 1.5, top: .6 });
  pnlBranch(330, 150, .25, 760, 70, PNL.bark, 2, [PNL.leafLt, PNL.emer], { bend: .5, twist: .8 });
  pnlBranch(290, 420, -.1, 420, 46, PNL.bark, 1, [PNL.leafMd, PNL.leafLt], { bend: -.5 });
  pnlBranch(1900, 140, 3.05, 560, 52, PNL.bark, 2, [PNL.leafMd, PNL.gold], { bend: -.4 });
  pnlFoliage(520, 60, 560, 200, [PNL.emerDk, PNL.emer, PNL.leafLt], { n: 34 });
  pnlFoliage(1400, 30, 520, 150, [PNL.vioDk, PNL.vio, PNL.leafMd], { n: 28 });
  pnlFoliage(1800, 440, 190, 240, [PNL.emerDk, PNL.emer, PNL.turq], { n: 18 });
  pnlRoot([[1230, 400], [1380, 352], [1530, 338], [1700, 322], [1960, 280]], 56, 70, PNL.bark);
  // layered roots at the ground, behind the queen
  paint([[-40, 960], [600, 940], [1200, 950], [1960, 935], [1960, 1120], [-40, 1120]], { wash: PNL.mossDk, fill: PNL.emerDk, fillOp: 120, bleed: .2, tex: .6, ink: null, curv: .3 });
  pnlRoot([[280, 960], [420, 870], [650, 840], [900, 860], [1150, 910], [1400, 960]], 90, 60, PNL.bark);
  pnlRoot([[1100, 960], [1300, 900], [1550, 880], [1800, 920], [1960, 980]], 80, 70, PNL.bark);
  pnlHatch(1000, 1000, 1700, 60, .02, 14, PNL.emerDk, .2);
  pnlFlowers([[300, 760, 70, 6], [1350, 790, 60, 7], [1600, 820, 48, 6]], PNL.mag);
  pnlFlowers([[470, 820, 44, 5], [1180, 830, 40, 6]], PNL.turq, PNL.goldDk);
  // Puck, a lean adult, seated on the branch and watching her, amused
  const PU = MS_CAST.puck, q = msStand({ lean: -.15, turn: -.55 });
  Object.assign(q, {
    head: [-.3, -2.75], neck: [-.22, -2.28], shL: [-.6, -2.0], shR: [.35, -2.05],
    elL: [-.85, -1.0], wrL: [-.55, .15], handL: { ang: 2.6, spread: .3, curl: .2, side: 1 },
    elR: [.75, -1.05], wrR: [.95, .15], handR: { ang: .4, spread: .3, curl: .2, side: -1 },
    hipL: [-.3, 0], hipR: [.28, 0], knL: [-1.0, .5], anL: [-.95, 1.95], footL: { ang: 1.35 }, knR: [-.75, .7], anR: [-.55, 2.1], footR: { ang: 1.25 },
    front: 'L', face: { ...MS_EXPR.amused, look: [-.8, .3] }, skirt: [[.55, .3], [.35, .6], [0, .7], [-.45, .65], [-.8, .4]]
  });
  msFigure(1500, 302, 62, PU, q, { light: -1, skirt: { trim: PU.trim, folds: 2 } });
  // Titania holding court: one hand raised toward the branch, the other lifting her gown through the slit
  const TI = MS_CAST.titania, s = 112, p = msStand({ lean: .04, turn: .2 });
  Object.assign(p, {
    head: [.08, -2.85], neck: [.06, -2.32], shL: [-.55, -2.05], shR: [.55, -2.05],
    elR: [1.15, -1.6], wrR: [1.75, -2.35], handR: { ang: -1.1, spread: .5, curl: .05, side: -1 },
    elL: [-.85, -1.1], wrL: [-.75, -.05], handL: { ang: 1.7, spread: .3, curl: .5, side: 1 },
    hipL: [-.33, 0], hipR: [.33, 0], knL: [-.4, 1.9], anL: [-.5, 3.75], footL: { ang: .1 }, knR: [.55, 1.85], anR: [.75, 3.7], footR: { ang: .5 },
    wind: .1, front: 'R', face: { ...MS_EXPR.regal, look: [.6, -.2] },
    skirt: [[.6, 1.3], [.35, 2.4], [.5, 3.5], [0, 3.65], [-.6, 3.55], [-1.05, 3.25], [-.95, 2.4]]
  });
  msFigure(760, 560, s, TI, p, { light: 1, skirt: { trim: TI.trim, folds: 5 } });
  // foreground roots, beds and ferns framing the clearing
  pnlRoot([[-40, 1060], [200, 990], [450, 1000], [600, 1060]], 70, 60, PNL.bark);
  pnlRoot([[1050, 1080], [1250, 990], [1500, 962], [1750, 990], [1960, 1060]], 76, 60, PNL.bark);
  pnlBed(330, 985, 200, 40, [PNL.vio, PNL.gold, PNL.mag], 14, 14, 24);
  pnlBed(1250, 1010, 220, 36, [PNL.turq, PNL.ruby, PNL.gold], 14, 14, 24);
  pnlBed(1750, 960, 150, 36, [PNL.mag, PNL.vio, PNL.turq], 10, 12, 22);
  pnlFern(560, 950, -1.4, 170, PNL.emer); pnlFern(1050, 960, -1.9, 160, PNL.leafMd); pnlFern(1480, 940, -1.2, 150, PNL.emer);
  glows([[900, 440, 240, .5], [1250, 300, 60, .4], [500, 600, 50, .4], [1650, 600, 40, .4], [1120, 700, 30, .4]], '#FFF1B8', true);
};
LOOPS.P05.len = 1;
