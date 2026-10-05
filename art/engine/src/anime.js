// anime.js: the anime character rig. Crisp cel characters drawn on the cel layer (cel.js). Read ANIME_RIG.md first.
// (Built on the "illustrator" arena rig, with grafts from the "keyviews" and "live2d" rigs.)
//
// PUBLIC
//   animeChar(x, y, u, design, pose)   full figure; (x, y) = ground point between the feet; u = HEAD HEIGHT in px
//   animeBust(x, y, u, design, pose)   head + shoulders + upper chest; (x, y) = base of the neck
//   animeHead(x, y, u, design, pose)   head (and neck stub) only; (x, y) = centre of the head
//   ANIME_DESIGNS                      sample designs: heroine, rival, elder, youth, sage, diva, judge
//   ANIME_EXPR                         expressions (numbers, so faces can blend): see the table
//   animeAct(t, keys, over)            acted expression changes -> pose fields
//   animeTurn(t, t0, t1, a0, a1)       a turn through the views, head leading, hair following through -> pose fields
//   animeTalk(t, words)                lip flaps from word times -> pose.talk (0, 1/3, 2/3, 1)
//   animeArm(t, t0, t1, a, b)          blend two arm poses -> pose.armL / armR
//   animeAnchors(x, y, u, design, pose, mode)   head, eyes, mouth, neck, hands... in the call's coordinates
//   ANIME_ARMS                         the named arm poses (add your own)
// Every call is one celDraw: re-entrant (a prop may draw another character), and a throw inside the rig is caught and
// logged once, so it can't blank the rest of the frame. Non-finite pose numbers are ignored; headings wrap.
//
// UNITS. Everything inside a character is in HEAD HEIGHTS (top of skull to chin = 1). Head-local origin = head centre,
// y down. Headings ("yaw") are in quarter turns: 0 front, .5 three-quarter, 1 profile, 1.5 three-quarter back, 2 back;
// positive = facing screen-right, negative (or flip: true) = facing screen-left. Any value wraps (4 = a full turn).
//
// DESIGN fields (all optional; see ANIME_DESIGNS for full examples and ANIME_RIG.md section 3). Designs are resolved
// once per OBJECT (cached by identity): make a new character as a new object, never mutate one after drawing it.
//   name, seed
//   build  { sex 'f'|'m', heads 7..8.2, shoulders, waist, hips (multipliers, clamped .88..1.12), neck (length .85..1.15) }
//   age    'adult' | 'mature' | 'elder'  (eye height, iris size, crow's feet, nasolabial lines)
//   skin   '#hex' (shadow, line, blush derive from it)
//   face   { jaw 0..1 (soft V -> square), chin 0..1 (length), cheek 0..1 (lean -> full; above .5 rounder), nose 0..1,
//            brows 0..1 (thickness), lips '#hex', liner true (winged liner), shadow '#hex' (eyeshadow), mole [x, y]
//            (head units), lines 0..1 (age lines, fading in from .1; default 1 elder, .5 mature) }
//   eyes   { col '#hex' (iris), col2 '#hex' (lower iris glow), shape 'almond'|'round'|'sharp'|'droopy'|'narrow',
//            size ~1, lash '#hex' }
//   hair   { style 'long'|'straight'|'bob'|'tousled'|'swept'|'ponytail'|'bun' ('slick' = 'swept'), col, hi (sheen),
//            len (head heights below the chin), wave 0..1, part -1..1 (+ = parting on the character's left), volume
//            .8..1.25, bangs 'swept'|'side'|'parted'|'full'|'none', ahoge true, flyaways 0..6, grey 0..1 (silver
//            temples), bunAt .7..1.8 (bun height) }
//   outfit { type 'gown'|'dress'|'coat'|'suit'|'shirt'|'robe', col, col2 (accent/lining/trim), shirt (under-layer,
//            collar), pants, shoes, tie, trim (lapels, a robe's crossed front), open, belt, long (long open coat over
//            a waistcoat), collar 'bands'|'jabot'|'wing'|'mandarin'|'none' (robe), sash colour|false (robe) }
//   acc    { earrings 'drop'|'stud'|'hoop', necklace 'pendant'|'choker'|'pearls', gem '#hex', bracelet true,
//            glasses { kind 'rect'|'round'|'half', col, tint ('#hex' or false) }, hat { kind 'fedora', col, band },
//            beard 'short'|'full'|'goatee'|'stubble' }
//   line   optional '#hex' override for all hair lineart (default: each part's fill, darker and more saturated)
//
// POSE fields (all optional; ANIME_RIG.md section 4):
//   view 'front'|'q'|'side'|'qback'|'back' or yaw (quarter turns, continuous), flip (face left), headYaw (head
//   heading if it leads the body), hairYaw (lagging heading for follow-through, held within .3 of the head), bodyYaw
//   (animeBust turns the body less than the head by default), tilt (head roll, rad), nod (-1 up .. 1 down; the
//   expression's headNod adds to it), lean (body lean, rad), lookX / lookY (-1..1; lookY + = down), blink (0..1,
//   max-merged with automatic blinks), autoBlink: false, saccade: false (no eye darts), expr (ANIME_EXPR name), face
//   (numeric face from animeAct; wins over expr), eyes / brows / mouth (expression names or numeric overrides), talk
//   (0..1), blush, tears, sweat, shadowEyes, sparkleEyes, winkSide 'far' (a wink otherwise lands on the near eye in
//   3/4), armL / armR (the character's OWN left / right arm: a name from ANIME_ARMS, a spec { T | dir | aim | up+fore,
//   h, hand, hd, th } written for the right arm, or a blend [a, b, k] from animeArm), handL / handR (open fist point
//   relaxed hold), holdL / holdR (fn(u, side) drawing a prop in hand space: origin at the grip, +x along the hand,
//   1 unit = 1 head height; cel*() and even animeHead() work there), walk (phase in strides), stance (contrapposto,
//   default 1), sit (0..1: seated, the feet stay on the ground), seat (hip height in heads), wind [dx, dy] (clamped to
//   2), t (time: breathing, sway, blinks, saccades), seed, light [lx, ly] (direction TO the key light, screen space),
//   rim ('#hex' rim light on the hair mass's silhouette and the face edge), cut (animeBust: head units below the neck
//   base, default 1.1), neck (animeHead: false = no neck stub), scale (sx), noShadow. From the helpers: lookLead,
//   turnBlink, turnNod, hairLift, pop.

// ======================================================================================================== colour
// Colours are '#rgb' or '#rrggbb' strings (anything else reads as mid grey, never NaN).
const _anRGB = h => {
  if (typeof h !== 'string' || h[0] !== '#') return [128, 128, 128];
  let s = h.slice(1); if (s.length === 3 || s.length === 4) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const n = parseInt(s.slice(0, 6), 16); if (!(n >= 0)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const _anHex = (r, g, b) => '#' + ((1 << 24) + (Math.round(clamp(r, 0, 255)) << 16) + (Math.round(clamp(g, 0, 255)) << 8) + Math.round(clamp(b, 0, 255))).toString(16).slice(1);
const _anC = (h, def) => typeof h === 'string' && h[0] === '#' ? _anHex(..._anRGB(h)) : def;   // normalise a design colour
function _anHSL(h) {
  const [r, g, b] = _anRGB(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, s, l];
}
function _anFromHSL(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s = clamp(s); l = clamp(l);
  if (!s) return _anHex(l * 255, l * 255, l * 255);
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return _anHex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
}
const _anMix = (a, b, k) => { const A = _anRGB(a), B = _anRGB(b), q = clamp(k); return _anHex(lerp(A[0], B[0], q), lerp(A[1], B[1], q), lerp(A[2], B[2], q)); };
const _anMul = (a, b) => { const A = _anRGB(a), B = _anRGB(b); return _anHex(A[0] * B[0] / 255, A[1] * B[1] / 255, A[2] * B[2] / 255); };
const _anA = (h, a) => { const [r, g, b] = _anRGB(h); return `rgba(${r},${g},${b},${clamp(a)})`; };
function _anHSV(h) {
  const [r, g, b] = _anRGB(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const hh = !d ? 0 : mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, mx ? d / mx : 0, mx];
}
function _anFromHSV(h, s, v) {
  h = ((h % 360) + 360) % 360; s = clamp(s); v = clamp(v);
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return _anHex(f(5) * 255, f(3) * 255, f(1) * 255);
}
const _anHue = (h, to, k) => h + (((to - h + 540) % 360) - 180) * k;
// Lineart: a darker, more saturated version of the fill, nudged toward red-violet (the "coloured trace line" look).
function _anLine(c, k = 1) {
  let [h, s, v] = _anHSV(c);
  if (s < .06) { h = 250; s = .1 + .06 * k; } else { h = _anHue(h, 345, .2 * k); s = s + (1 - s) * .36 * k; }
  return _anFromHSV(h, s, v * (1 - k * (.36 + .16 * (1 - v))));
}
// Cel shadow tones: darker, a little more saturated, hue pulled toward magenta (skin: dv small, warm).
function _anShade(c, dv = .16, ds = .14, dh = .1) {
  let [h, s, v] = _anHSV(c);
  if (s < .06) { h = 252; s = s + ds * .7; } else { h = _anHue(h, 300, dh); s = s + (1 - s) * ds; }
  return _anFromHSV(h, s, v * (1 - dv));
}
const _anLight = (c, k = .5) => { let [h, s, v] = _anHSV(c); return _anFromHSV(_anHue(h, 50, .08 * k), s * (1 - .55 * k), v + (1 - v) * k); };

// ======================================================================================================== drawing core
// All character drawing happens inside one celDraw() callback per character, with the canvas transform in head units.
// _AN holds the context of that one call (it never survives a frame).
let _AN = null;
// Line weight of k px at u = 120 head height, growing like u^.5 (readable small figures, light close-ups).
const _anLW = k => k * Math.pow(Math.max(_AN.sc, 8) / 120, .5) / _AN.sc;
// One rig drawing = one celDraw. _anRun keeps it RE-ENTRANT (a prop may draw another character: the context is saved
// and restored), and SAFE: a throw inside the rig is caught and logged once, every canvas save() it opened is unwound,
// so nothing drawn after it in the frame is lost.
const _AN_ERR = new Set();
function _anRun(body) {
  const prev = _AN;
  celDraw((c, m) => {
    const S = CanvasRenderingContext2D.prototype.save, Rs = CanvasRenderingContext2D.prototype.restore, own = Object.prototype.hasOwnProperty;
    const ps = own.call(c, 'save') ? c.save : null, pr = own.call(c, 'restore') ? c.restore : null; let d = 0;
    c.save = function () { d++; S.call(this); }; c.restore = function () { if (d > 0) { d--; Rs.call(this); } };
    try { _AN = { c, sc: Math.hypot(m.a, m.b) || 1 }; body(c, m); }
    catch (e) { const k = String(e && e.stack || e).slice(0, 300); if (!_AN_ERR.has(k)) { _AN_ERR.add(k); console.error('anime rig: ' + k); } }
    finally {
      while (d > 0) { d--; Rs.call(c); }
      if (ps) c.save = ps; else delete c.save; if (pr) c.restore = pr; else delete c.restore;
      _AN = prev;
    }
  });
}
// Pose sanitising: non-finite numbers are dropped (defaults apply), so bad input can't produce NaN geometry.
const _AN_NUMF = ['yaw', 'headYaw', 'hairYaw', 'tilt', 'nod', 'lean', 'lookX', 'lookY', 'lookLead', 'blink', 'turnBlink', 'talk', 'walk', 't', 'seed',
  'blush', 'tears', 'sweat', 'shadowEyes', 'sparkleEyes', 'scale', 'pop', 'cut', 'stance', 'hairLift', 'bodyYaw', 'sit', 'seat'];
function _anSan(P) {
  if (!P || typeof P !== 'object') return {};
  let Q = null;
  for (const k of _AN_NUMF) if (P[k] != null && (typeof P[k] !== 'number' || !isFinite(P[k]))) { Q = Q || { ...P }; delete Q[k]; }
  for (const k of ['wind', 'light', 'hairSwing']) if (P[k] != null && !(Array.isArray(P[k]) && P[k].length >= 2 && isFinite(P[k][0]) && isFinite(P[k][1]))) { Q = Q || { ...P }; delete Q[k]; }
  if (Array.isArray((Q || P).wind) && Math.hypot(...(Q || P).wind.slice(0, 2)) > 2) { Q = Q || { ...P }; const w = Q.wind, k = 2 / Math.hypot(w[0], w[1]); Q.wind = [w[0] * k, w[1] * k]; }   // wind is clamped to a gale (2)
  return Q || P;
}
function _anDense(P, closed = false, n = 6) {
  if (P.length < 3) return P.slice();
  if (!closed) return through(P, n);
  const m = P.length, ext = [P[m - 1], ...P, P[0], P[1]], d = through(ext, n);
  return d.slice(n, n * (m + 1) + 1).slice(0, n * m);
}
const _anPoly = (P, closed = true) => celPoly(P, closed);
function _anFill(P, style, closed = true) { const c = _AN.c; c.fillStyle = style; c.fill(P instanceof Path2D ? P : celPoly(P, closed)); }
function _anStroke(P, w, col, closed = false) {
  const c = _AN.c; c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round';
  c.stroke(P instanceof Path2D ? P : celPoly(P, closed));
}
// Tapered stroke along a polyline (already dense or smoothed with smooth=true): width profile w(u) for u in 0..1.
function _anTaper(P, wf, col, smooth = true) {
  if (P.length === 2) { const [a, b] = P; P = []; for (let i = 0; i <= 8; i++) P.push([lerp(a[0], b[0], i / 8), lerp(a[1], b[1], i / 8)]); smooth = false; }   // a straight stroke still tapers
  const C = smooth ? _anDense(P, false, 5) : P, n = C.length; if (n < 2) return;
  let L = 0; const d = [0]; for (let i = 1; i < n; i++) { L += Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]); d.push(L); }
  if (L < 1e-6) return;
  const A = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], dd = Math.hypot(dx, dy) || 1;
    const hw = Math.max(0, wf(d[i] / L)) / 2;
    A.push([C[i][0] - dy / dd * hw, C[i][1] + dx / dd * hw]); B.push([C[i][0] + dy / dd * hw, C[i][1] - dx / dd * hw]);
  }
  _AN.c.fillStyle = col; _AN.c.fill(celPoly(A.concat(B.reverse())));
}
const _anTp = (a, b, w0, wm, w1) => u => u < a ? lerp(w0, wm, easeOut(u / a)) : u > 1 - b ? lerp(wm, w1, ease((u - (1 - b)) / b)) : wm;
function _anClip(path, fn) { const c = _AN.c; c.save(); c.clip(path instanceof Path2D ? path : celPoly(path)); fn(); c.restore(); }
// The classic cel crescent: the part of `path` NOT covered by `path` moved by (dx, dy) (offset toward the light gives
// the shadow on the far side).
function _anCrescent(path, dx, dy, style) {
  const c = _AN.c, p = path instanceof Path2D ? path : celPoly(path);
  c.save(); c.clip(p); const q = new Path2D(); q.rect(-1e3, -1e3, 2e3, 2e3); q.addPath(p, new DOMMatrix([1, 0, 0, 1, dx, dy]));
  c.fillStyle = style; c.fill(q, 'evenodd'); c.restore();
}
// The crescent of a shape that CONTINUES below (a coat panel whose tails go on, a torso tucked into a skirt): its
// bottom edge is not a real edge, so it gets no shadow band. Clips one shifted copy at a time (a union filled
// even-odd would checkerboard).
function _anCrescentOpen(path, dx, dy, style, down = .4) {
  const c = _AN.c, p = path instanceof Path2D ? path : celPoly(path);
  c.save(); c.clip(p);
  for (const off of [0, down]) { const q = new Path2D(); q.rect(-1e3, -1e3, 2e3, 2e3); q.addPath(p, new DOMMatrix([1, 0, 0, 1, dx, dy + off])); c.clip(q, 'evenodd'); }
  c.fillStyle = style; c.fillRect(-1e3, -1e3, 2e3, 2e3); c.restore();
}
const _anMove = (path, dx, dy) => { const q = new Path2D(); q.addPath(path, new DOMMatrix([1, 0, 0, 1, dx, dy])); return q; };
const _anEllP = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, Math.max(1e-5, Math.abs(rx)), Math.max(1e-5, Math.abs(ry)), rot, 0, TAU); return p; };
function _anGlow(x, y, rx, ry, col, a) {   // soft radial blob (blush, glows)
  const c = _AN.c; c.save(); c.translate(x, y); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, _anA(col, a)); g.addColorStop(.55, _anA(col, a * .55)); g.addColorStop(1, _anA(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
const _anLerpDeep = (a, b, k) => {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k);
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => _anLerpDeep(v, b[i] ?? v, k));
  if (a && b && typeof a === 'object' && typeof b === 'object') { const o = {}; for (const key in a) o[key] = key in b ? _anLerpDeep(a[key], b[key], k) : a[key]; return o; }
  return k < .5 ? a : b;
};
const _anMirror = o => {
  if (Array.isArray(o)) return o.length === 2 && typeof o[0] === 'number' ? [-o[0], o[1]] : o.map(_anMirror);
  if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = (k === 'x' || k === 't' || k === 'tx' || k === 'f') ? -o[k] : _anMirror(o[k]); return r; }
  return o;
};

// ======================================================================================================== designs
// A new character is a new design object. Colours you leave out derive from the ones you give.
const ANIME_DESIGNS = {
  heroine: {
    name: 'Heroine', seed: 3,
    build: { sex: 'f', heads: 7.6, shoulders: 1, waist: 1, hips: 1 },
    age: 'adult', skin: '#FCE7DC',
    face: { jaw: .08, chin: .5, cheek: .45, nose: .4, brows: .3, lips: '#D9707E', liner: true, shadow: '#C88AA6', mole: [-.1, .31] },
    eyes: { col: '#3D63C9', col2: '#8EE2F2', shape: 'almond', size: 1, lash: '#2A1824' },
    hair: { style: 'long', col: '#A94A3A', hi: '#FFC09A', len: 2.3, wave: .75, part: .32, volume: 1.05, bangs: 'swept', flyaways: 3 },
    outfit: { type: 'gown', col: '#A01D3A', col2: '#E5BC5E' },
    acc: { earrings: 'drop', necklace: 'pendant', bracelet: true, gem: '#7FE3F2' },
  },
  rival: {
    name: 'Rival', seed: 7,
    build: { sex: 'f', heads: 7.8, shoulders: 1.03, waist: .98, hips: .97 },
    age: 'adult', skin: '#F9E5DC',
    face: { jaw: .18, chin: .58, cheek: .7, nose: .48, brows: .38, lips: '#B4223F', liner: true, shadow: '#7B6596' },
    eyes: { col: '#C9871B', col2: '#FFE38E', shape: 'sharp', size: .94, lash: '#13111D' },
    hair: { style: 'bob', col: '#1E2236', hi: '#7C93D2', len: .42, wave: 0, part: -.55, volume: 1, bangs: 'side' },
    outfit: { type: 'coat', col: '#EEEDF2', col2: '#23212E', trim: '#23212E', shirt: '#7A2140', pants: '#23212E', shoes: '#17151D', belt: true },
    acc: { earrings: 'drop', gem: '#E3405A' },
  },
  elder: {
    name: 'Elder', seed: 11,
    build: { sex: 'm', heads: 7.9, shoulders: 1, waist: 1.04, hips: 1 },
    age: 'elder', skin: '#F4DECF',
    face: { jaw: .6, chin: .6, cheek: .3, nose: .7, brows: .9, lines: 1 },
    eyes: { col: '#4F6E92', col2: '#A9D2EE', shape: 'sharp', size: .92, lash: '#26222E' },
    hair: { style: 'swept', col: '#C9CDD8', hi: '#FFFFFF', part: .25, volume: 1, flyaways: 1 },
    outfit: { type: 'coat', col: '#2B2A35', col2: '#6E2836', shirt: '#E8E5EE', pants: '#4A4855', shoes: '#151319', tie: '#6E2836', long: true },
    acc: { beard: 'short' },
  },
  youth: {
    name: 'Youth', seed: 5,
    build: { sex: 'm', heads: 7.6, shoulders: .97, waist: 1, hips: 1 },
    age: 'adult', skin: '#FBE3D5',
    face: { jaw: .72, chin: .58, cheek: .2, nose: .55, brows: .62 },
    eyes: { col: '#2C9470', col2: '#A2F2C8', shape: 'almond', size: .92, lash: '#1E1A22' },
    hair: { style: 'tousled', col: '#4A3328', hi: '#C49A7A', part: .15, volume: 1.05, bangs: 'full', ahoge: true, flyaways: 3 },
    outfit: { type: 'shirt', col: '#F5F4F9', col2: '#2D3652', pants: '#2D3652', shoes: '#3B2C25', open: true },
    acc: {},
  },
  sage: {
    name: 'Sage', seed: 13,
    build: { sex: 'f', heads: 7.7, shoulders: .98, waist: 1, hips: 1 },
    age: 'mature', skin: '#F6E0D3',
    face: { jaw: .15, chin: .55, cheek: .6, nose: .45, brows: .35, lips: '#B85A6E', liner: true, shadow: '#6E8AA6' },
    eyes: { col: '#2E8C8C', col2: '#9FF0E0', shape: 'droopy', size: .95, lash: '#2A2236' },
    hair: { style: 'straight', col: '#B8B2D6', hi: '#F4F0FF', len: 2.6, wave: .1, part: 0, volume: 1, bangs: 'parted' },
    outfit: { type: 'robe', col: '#1F5E63', col2: '#D9B45A' },
    acc: { earrings: 'hoop', necklace: 'pendant', gem: '#E2C35A', glasses: { kind: 'half', col: '#7A5A36' } },
  },
  diva: {
    name: 'Diva', seed: 17,
    build: { sex: 'f', heads: 7.5, shoulders: 1, waist: .97, hips: 1.02 },
    age: 'adult', skin: '#FBE6DA',
    face: { jaw: .05, chin: .45, cheek: .45, nose: .38, brows: .3, lips: '#E05A78', liner: true, shadow: '#E39AB8' },
    eyes: { col: '#D4487A', col2: '#FFC2D8', shape: 'round', size: 1.02, lash: '#2B1424' },
    hair: { style: 'ponytail', col: '#F2CF7A', hi: '#FFF6D2', len: 2, wave: .5, part: -.2, volume: 1.05, bangs: 'swept' },
    outfit: { type: 'dress', col: '#2F3D8F', col2: '#F2D27A', shoes: '#2A2440' },
    acc: { earrings: 'stud', necklace: 'pearls', bracelet: true, gem: '#FFE38A' },
  },
  judge: {
    name: 'Judge', seed: 31,
    build: { sex: 'f', heads: 7.6, shoulders: 1.02, waist: 1, hips: 1 },
    age: 'mature', skin: '#F2D9C8',
    face: { jaw: .3, chin: .5, cheek: .35, nose: .5, brows: .55, lips: '#9E4A55', liner: true, shadow: '#6A5A70', lines: .55 },
    eyes: { col: '#4A5A6E', col2: '#A8BCD0', shape: 'sharp', size: .9, lash: '#16121A' },
    hair: { style: 'bun', col: '#3E3A46', hi: '#B8B4C4', grey: .55, bunAt: .78, part: .35, volume: 1, bangs: 'side', flyaways: 1 },
    outfit: { type: 'robe', col: '#1A1820', shirt: '#F4F2F6', collar: 'bands', sash: false },
    acc: { earrings: 'stud', gem: '#C8CCD8', glasses: { kind: 'rect', col: '#2A2630' } },
  },
};

const _AN_CACHE = new WeakMap();
// Resolve a design: defaults, natural-range clamps and every derived colour. Pure (cached per design object).
function _anD(d) {
  if (!d || typeof d !== 'object') d = _AN_EMPTY;
  if (_AN_CACHE.has(d)) return _AN_CACHE.get(d);
  const ob = v => v && typeof v === 'object' ? v : {};
  const b = ob(d.build), f = ob(d.face), e = ob(d.eyes), h = ob(d.hair), o = ob(d.outfit), a = ob(d.acc);
  const m = b.sex === 'm', age = ['adult', 'mature', 'elder'].includes(d.age) ? d.age : 'adult', elder = age === 'elder', mature = age === 'mature' || elder;
  const skin = _anC(d.skin, '#FCE7DC'), hc = _anC(h.col, elder ? '#C9CDD8' : '#3A2A30'), num = (v, def) => typeof v === 'number' && isFinite(v) ? v : def;
  const eyeC = _anC(e.col, '#5A6FA0');
  const styles = ['long', 'bob', 'tousled', 'swept', 'ponytail', 'straight', 'bun'];
  let style = h.style === 'slick' ? 'swept' : h.style; if (!styles.includes(style)) style = m ? (elder ? 'swept' : 'tousled') : 'long';
  const R = {
    src: d, name: d.name || '', seed: num(d.seed, 1), m, age, elder, mature,
    heads: clamp(num(b.heads, m ? 7.8 : 7.6), 7, 8.2), shoulders: clamp(num(b.shoulders, 1), .88, 1.12), waist: clamp(num(b.waist, 1), .9, 1.12), hips: clamp(num(b.hips, 1), .9, 1.1),
    neckL: clamp(num(b.neck, 1), .85, 1.15),
    jaw: clamp(num(f.jaw, m ? .6 : .1)), chin: clamp(num(f.chin, .5)), cheek: clamp(num(f.cheek, .5)), nose: clamp(num(f.nose, m ? .6 : .4)), browW: clamp(num(f.brows, m ? .65 : .3)),
    lines: clamp(num(f.lines, elder ? 1 : mature ? .5 : 0)),
    skin, skinSh: _anShade(skin, .05, .17, .14), skinLn: _anLine(skin), blushC: '#FF7F92',
    lips: _anC(f.lips, null), liner: !!f.liner, eyeshadow: _anC(f.shadow, null), mole: Array.isArray(f.mole) ? f.mole : null,
    eyeC, eyeC2: _anC(e.col2, _anLight(eyeC, .6)), eyeShape: _AN_EYES[e.shape] ? e.shape : (elder ? 'narrow' : 'almond'),
    eyeSize: clamp(num(e.size, 1), .75, 1.15) * (m ? .93 : 1) * (elder ? .94 : 1), lash: _anC(e.lash, _anLine(_anLine(hc))),
    hair: { style, col: hc, len: Math.max(0, num(h.len, m ? 0 : 2)), wave: clamp(num(h.wave, .3)), part: clamp(num(h.part, .2), -1, 1), volume: clamp(num(h.volume, 1), .8, 1.25),
            bangs: ['swept', 'side', 'full', 'parted', 'none'].includes(h.bangs) ? h.bangs : style === 'swept' ? 'none' : 'swept', ahoge: !!h.ahoge, flyaways: clamp(num(h.flyaways, 2), 0, 6),
            grey: clamp(num(h.grey, 0)), bunAt: clamp(num(h.bunAt, 1.1), .7, 1.8) },
    hairC: hc, hairSh: _anShade(hc, .26, .14, .16), hairSh2: _anShade(_anShade(hc, .26, .14, .16), .24, .1, .1), hairHi: _anC(h.hi, _anLight(hc, .45)), hairLn: _anC(d.line, _anLine(hc)),
    outfit: { type: ['gown', 'dress', 'coat', 'suit', 'shirt', 'robe'].includes(o.type) ? o.type : (m ? 'shirt' : 'dress'), col: _anC(o.col, '#3B4A7A'), col2: _anC(o.col2, '#D9B45A'),
              shirt: _anC(o.shirt, '#F2F0F6'), pants: _anC(o.pants, '#2A2C3A'), shoes: _anC(o.shoes, '#1C1A22'), tie: _anC(o.tie, null), open: o.open ?? false, belt: !!o.belt, long: !!o.long,
              trim: _anC(o.trim, null), hasShirt: !!o.shirt,
              collar: ['bands', 'jabot', 'wing', 'mandarin', 'none'].includes(o.collar) ? o.collar : 'none', sash: o.sash === false || o.sash === 'none' ? false : _anC(o.sash, null) },
    acc: { earrings: a.earrings || null, necklace: a.necklace || null, beard: ['short', 'full', 'goatee', 'stubble'].includes(a.beard) ? a.beard : a.beard ? 'short' : null, bracelet: !!a.bracelet, gem: _anC(a.gem, '#7FE3F2'),
           glasses: a.glasses ? { kind: ['round', 'rect', 'half'].includes(a.glasses.kind || a.glasses) ? (a.glasses.kind || a.glasses) : 'rect', col: _anC(a.glasses.col, '#3A3240'), tint: a.glasses.tint === false || a.glasses.tint === 'none' ? null : _anC(a.glasses.tint, '#BFD8F0') } : null,
           hat: a.hat ? { kind: 'fedora', col: _anC(a.hat.col, '#2E2A33'), band: _anC(a.hat.band, '#7A2836') } : null },
    lineOverride: _anC(d.line, null),
  };
  // brows: in the hair colour's darker tones (silver hair keeps silver-grey brows, never painted-on dark ones)
  R.lightBrow = elder || _anHSV(hc)[2] > .7;
  R.browC = R.lightBrow ? _anMix(R.hairSh2, R.hairLn, .45) : _anMix(R.hairLn, R.lash, .35);
  R.eyeDk = _anLine(R.eyeC, 1.15); R.eyeMid = R.eyeC; R.eyeLt = R.eyeC2;
  R.mouthIn = _anMix('#4A1426', R.skinLn, .25); R.tongue = '#E8737E';
  R.lipLn = R.lips ? _anMix(_anLine(R.lips, .8), R.skinLn, .35) : _anMix(R.skinLn, '#8A3A3A', .2);
  R.keys = _anFaceKeys(R);
  _AN_CACHE.set(d, R);
  return R;
}
const _AN_EMPTY = {};

// ======================================================================================================== head views
// Drawn key views (front, q, side, qback, back), facing screen-right, blended by heading. R = the contour on the heading
// side (temple -> chin point, 13 points), L = the other side (chin -> temple, 5 points). Features: eyeN / eyeF (near / far
// eye: x, y, w width scale, t turn, v visible), nose (bridge x,y; tip tx,ty; k 0 front .. 1 profile), mouth, ears,
// cheeks (blush), neck (edges [top, mid, base]).
function _anFaceKeys(D) {
  const j = D.jaw, ch = (D.chin - .5) * .03, nz = (D.nose - .5) * .02, m = D.m;
  const mix = (A, B) => A.map((p, i) => [lerp(p[0], B[i][0], j), lerp(p[1], B[i][1], j) + (i >= 9 ? ch * (i - 8) / 4 : 0)]);
  // jaw 0: the adult V-line (lean below the cheekbone, a narrow rounded chin); face.cheek above .5 eases back toward a
  // rounder, fuller lower face
  const kRound = clamp((D.cheek - .5) * 2), fV = [[.388, -.04], [.388, .03], [.382, .09], [.37, .15], [.351, .205], [.318, .255], [.282, .298], [.244, .338], [.205, .376], [.165, .412], [.118, .446], [.064, .48], [0, .503]];
  const fRound = [[.388, -.04], [.388, .03], [.382, .09], [.37, .15], [.351, .205], [.326, .255], [.297, .298], [.263, .338], [.226, .376], [.186, .412], [.138, .446], [.078, .48], [0, .503]];
  const frontR = mix(
    fV.map((p, i) => [lerp(p[0], fRound[i][0], kRound), p[1]]),
    [[.4, -.04], [.403, .03], [.402, .09], [.397, .15], [.388, .205], [.376, .255], [.362, .3], [.346, .342], [.325, .384], [.29, .43], [.218, .468], [.12, .494], [0, .504]]);   // jaw 1: square, a defined angle
  const front = {
    R: frontR, L: [frontR[11], frontR[9], frontR[8], frontR[6], frontR[3]].map(([x, y]) => [-x, y]),
    eyeN: { x: -.18, y: .07, w: 1, t: 0, v: 1 }, eyeF: { x: .18, y: .07, w: 1, t: 0, v: 1 },
    nose: { x: 0, y: .16, tx: 0, ty: .232 + nz * .5, k: 0, v: 1 }, mouth: { x: 0, y: .345 + ch * .4, w: 1, t: 0, v: 1 },
    earN: { x: -.385, y: .1, f: .24, v: 1 }, earF: { x: .385, y: .1, f: -.24, v: 1 },
    cheekN: { x: -.2, y: .215 }, cheekF: { x: .2, y: .215 },
    neck: { L: [[-.122, .3], [-.112, .6], [-.138, .86]], R: [[.122, .3], [.112, .6], [.138, .86]] },
  };
  // 3/4: the far cheek dips into the eye socket (the notch), swells at the cheekbone, then runs CONVEX down to a chin
  // that is one rounded point swung toward the heading; the near jaw is a single soft curve (a defined angle for jaw 1)
  const q = {
    R: mix(
      [[.35, -.04], [.322, .025], [.343, .075], [.372, .13], [.37, .18], [.356, .23], [.334, .278], [.306, .325], [.275, .37], [.248, .41], [.228, .445], [.214, .475], [.203, .502]],
      [[.356, -.04], [.33, .025], [.35, .075], [.38, .13], [.38, .185], [.37, .235], [.352, .285], [.33, .33], [.305, .375], [.28, .415], [.258, .45], [.24, .48], [.225, .505]]),
    L: mix([[.185, .507], [.09, .482], [-.03, .432], [-.14, .36], [-.22, .262]], [[.205, .512], [.1, .497], [-.04, .455], [-.19, .38], [-.27, .262]]),
    eyeN: { x: .075, y: .072, w: .94, t: .18, v: 1 }, eyeF: { x: .28, y: .068, w: .58, t: .62, v: 1 },
    nose: { x: .21, y: .16, tx: .255 + nz, ty: .226 + nz * .5, k: .5, v: 1 }, mouth: { x: .19, y: .338 + ch * .4, w: .74, t: .36, v: 1 },
    earN: { x: -.255, y: .1, f: .78, v: 1 }, earF: { x: .37, y: .1, f: -.1, v: 0 },
    cheekN: { x: .02, y: .215 }, cheekF: { x: .312, y: .2 },
    neck: { L: [[-.2, .26], [-.158, .6], [-.178, .86]], R: [[.122, .38], [.108, .6], [.128, .86]] },
  };
  const side = {
    R: mix(
      [[.383, -.06], [.389, 0], [.372, .066], [.384, .12], [.405 + nz, .175], [.426 + nz * 1.5, .222], [.395, .254], [.396, .289], [.382, .317], [.39, .342], [.362, .384], [.373, .438], [.343, .494]],
      [[.385, -.06], [.392, 0], [.373, .066], [.386, .12], [.41 + nz, .175], [.434 + nz * 1.5, .224], [.398, .258], [.399, .293], [.386, .322], [.393, .348], [.366, .39], [.382, .446], [.352, .507]]),
    L: mix([[.25, .482], [.12, .44], [.02, .375], [-.04, .28], [-.06, .18]], [[.24, .5], [.1, .462], [-.005, .395], [-.055, .29], [-.07, .18]]),
    eyeN: { x: .283, y: .072, w: .48, t: .85, v: 1 }, eyeF: { x: .395, y: .07, w: .2, t: 1, v: 0 },
    nose: { x: .39, y: .14, tx: .426 + nz * 1.5, ty: .222, k: 1, v: 1 }, mouth: { x: .35, y: .33 + ch * .4, w: .42, t: .9, v: 1 },
    earN: { x: -.04, y: .1, f: 1, v: 1 }, earF: { x: .3, y: .1, f: -.1, v: 0 },
    cheekN: { x: .235, y: .21 }, cheekF: { x: .4, y: .2 },
    neck: { L: [[-.2, .27], [-.19, .6], [-.22, .86]], R: [[.17, .42], [.125, .6], [.1, .86]] },   // the throat slants back to the chest
  };
  const qback = {
    R: [[.33, -.04], [.345, .03], [.35, .085], [.352, .14], [.347, .195], [.338, .245], [.325, .29], [.308, .333], [.288, .372], [.265, .405], [.24, .432], [.215, .452], [.19, .465]],
    L: [[.14, .455], [.08, .42], [.03, .36], [0, .28], [-.01, .2]],
    eyeN: { x: .352, y: .07, w: .16, t: 1, v: .3 }, eyeF: { x: .4, y: .07, w: .1, t: 1, v: 0 },
    nose: { x: .4, y: .14, tx: .43, ty: .222, k: 1, v: 0 }, mouth: { x: .36, y: .33, w: .2, t: 1, v: 0 },
    earN: { x: .2, y: .1, f: .8, v: 1 }, earF: { x: .2, y: .1, f: -.1, v: 0 },
    cheekN: { x: .33, y: .21 }, cheekF: { x: .4, y: .2 },
    neck: { L: [[-.2, .22], [-.13, .6], [-.15, .86]], R: [[.15, .38], [.11, .6], [.12, .86]] },
  };
  // from behind, the head narrows into the neck (the jaw corners are hidden behind it)
  const backR = [[.4, -.04], [.398, .03], [.39, .09], [.375, .15], [.35, .2], [.315, .245], [.27, .28], [.225, .31], [.19, .33], [.165, .35], [.15, .37], [.14, .39], [0, .4]];
  const back = {
    R: backR, L: [backR[11], backR[9], backR[7], backR[5], backR[3]].map(([x, y]) => [-x, y]),
    eyeN: { x: .4, y: .07, w: .05, t: 1, v: 0 }, eyeF: { x: -.4, y: .07, w: .05, t: 1, v: 0 },
    nose: { x: 0, y: .14, tx: 0, ty: .222, k: 1, v: 0 }, mouth: { x: 0, y: .33, w: .2, t: 1, v: 0 },
    earN: { x: .4, y: .1, f: -.3, v: 1 }, earF: { x: -.4, y: .1, f: .3, v: 1 },
    cheekN: { x: .38, y: .21 }, cheekF: { x: -.38, y: .2 },
    neck: { L: [[-.13, .25], [-.117, .6], [-.142, .86]], R: [[.13, .25], [.117, .6], [.142, .86]] },
  };
  const keys = [front, q, side, qback, back];
  // face.cheek: fuller (1) or leaner (0) cheeks, in the front and 3/4 contours below the eyes
  const ck = lerp(.955, 1.035, D.cheek);
  for (const k of [front, q]) { const cx = k === q ? .1 : 0, f = ([x, y]) => [y > .1 && y < .46 ? cx + (x - cx) * lerp(1, ck, Math.sin(Math.PI * (y - .1) / .36)) : x, y]; k.R = k.R.map(f); k.L = k.L.map(f); }
  if (m) for (const k of keys) {
    for (const s of ['L', 'R']) k.neck[s] = k.neck[s].map(([x, y], i) => [x * (1.55 + .06 * i), y]);   // a man's neck: thicker
    const ly = y => y > .1 ? .1 + (y - .1) * 1.1 : y, lx = (x, y) => x * (y < .2 ? .975 : 1);   // men: a longer lower face, flatter temples
    k.R = k.R.map(([x, y]) => [lx(x, y), ly(y)]); k.L = k.L.map(([x, y]) => [lx(x, y), ly(y)]);
    k.mouth.y = ly(k.mouth.y); k.nose.ty = ly(k.nose.ty) + .005; k.nose.y = ly(k.nose.y);
  }
  return keys;
}
// Heading (quarter turns) -> blended head geometry, mirrored when facing left.
function _anHeadGeo(D, yaw) {
  let y = ((yaw % 4) + 4) % 4, mir = false;
  if (y > 2) { y = 4 - y; mir = true; }
  const i = Math.min(3, Math.floor(y / .5)), k0 = (y - i * .5) / .5, k = lerp(k0, ease(k0), .35);
  const G = _anLerpDeep(D.keys[i], D.keys[i + 1], k);
  G.yaw = y; G.mir = mir; G.psi = y * Math.PI / 2 * (mir ? -1 : 1);
  return mir ? Object.assign(_anMirror(G), { yaw: y, mir, psi: G.psi }) : G;
}
// The skull (an ellipsoid the hair sits on): centre (0, -.08, -.045), radii .415 x .42 x .445 (head heights).
const _AN_SK = { y: -.08, z: -.045, rx: .415, ry: .42, rz: .445 };

// ======================================================================================================== expressions
// Every expression is a set of NUMBERS, so any two blend smoothly (animeAct) and nothing ever pops.
//   eyes:  open (0 shut .. 1 .. 1.25 wide), winkL / winkR (close that eye, character's side), happy (closed shape:
//          0 relaxed ‿ .. 1 smiling ∩), lid (+ sharp/angry .. - worried/sad), squint (lower lid up), iris, pupil
//          (scales), hi (catchlights 0..1), lookX / lookY
//   brows: browY (raise), browA (+ angry: inner ends down .. - worried), browK (knit), browAs (+ raises the left brow)
//   mouth: mOpen, mSmile (-1 frown .. 1), mWide (width), mTeeth, mTongue, mAsym (+ lifts the left corner: smirk), mPout
//   extras: blush, hatch (blush lines), tears, sweat, shadowEyes, sparkleEyes, gloom (blue forehead), vein (anger mark),
//          chill (a cold blue-grey tone under the eyes)
//   head bias: headNod (+ down), headTilt (rad)
const _AN_F0 = { open: 1, winkL: 0, winkR: 0, happy: 0, lid: 0, squint: 0, iris: 1, pupil: 1, hi: 1, lookX: 0, lookY: 0,
  browY: 0, browA: 0, browK: 0, browAs: 0, mOpen: 0, mSmile: .04, mWide: 1, mTeeth: 0, mTongue: 0, mAsym: 0, mPout: 0,
  blush: 0, hatch: 0, tears: 0, sweat: 0, shadowEyes: 0, sparkleEyes: 0, gloom: 0, vein: 0, chill: 0, headNod: 0, headTilt: 0 };
const ANIME_EXPR = {
  neutral:    {},
  smile:      { open: .9, squint: .32, mSmile: .75, browY: .08, browA: -.08, blush: .15 },
  grin:       { open: .82, squint: .45, mOpen: .38, mSmile: 1, mTeeth: 1, mWide: 1.3, browY: .14, blush: .12 },
  laugh:      { open: 0, happy: 1, mOpen: .7, mSmile: .95, mTongue: .7, mWide: 1.18, mTeeth: .7, browY: .18, browA: -.15, blush: .28, headNod: -.25, headTilt: .06 },
  smug:       { open: .58, squint: .25, lid: .2, mSmile: .45, mAsym: .85, browAs: .6, browA: .15, lookX: .25, headNod: -.18, headTilt: -.07 },
  confident:  { open: .86, squint: .2, lid: .28, mSmile: .62, mAsym: .35, mOpen: .04, browA: .3, browY: .04, headNod: -.2, sparkleEyes: .4 },
  wink:       { winkL: 1, happy: 1, open: .96, squint: .15, mSmile: .62, mAsym: .22, mOpen: .05, browAs: -.2, sparkleEyes: .35, blush: .15, headTilt: .1 },
  blush:      { open: .95, blush: 1, hatch: 1, mSmile: .1, mOpen: .1, mWide: .7, browA: -.35, browY: .1, lookX: -.35, lookY: .25, sweat: .3, headNod: .12 },
  shy:        { open: .78, squint: .1, blush: .75, hatch: .4, mSmile: .22, mWide: .7, browA: -.4, browY: .06, lookX: -.55, lookY: .45, headNod: .22, headTilt: .12 },
  sad:        { open: .7, lid: -.8, browA: -.9, browY: .15, browK: .35, mSmile: -.6, lookY: .4, hi: .7, headNod: .2 },
  cry:        { open: .5, squint: .35, lid: -.8, tears: 1, browA: -.85, browK: .45, mOpen: .35, mSmile: -.65, mWide: .95, blush: .45, headNod: .15 },
  angry:      { open: .85, lid: .75, browA: .85, browK: .6, browY: -.08, mSmile: -.4, mOpen: .14, mTeeth: .7, vein: .7, headNod: .12 },
  furious:    { open: 1.06, lid: .95, iris: .72, pupil: .55, browA: 1.05, browK: 1, browY: -.12, mOpen: .62, mTeeth: 1, mWide: 1.32, mSmile: -.55, vein: 1, headNod: .1 },
  shocked:    { open: 1.22, iris: .52, pupil: .5, hi: .15, browY: .38, browA: -.2, mOpen: .5, mWide: .58, mSmile: -.15, sweat: .7, gloom: .55 },
  surprised:  { open: 1.15, iris: .82, browY: .42, mOpen: .42, mWide: .68, mSmile: 0, headNod: -.12 },
  scared:     { open: 1.12, iris: .6, pupil: .55, lid: -.5, browA: -.75, browK: .55, browY: .25, mOpen: .3, mWide: 1, mSmile: -.55, sweat: 1, gloom: .7, headNod: .1 },
  determined: { open: .95, lid: .62, squint: .15, browA: .9, browK: .55, browY: -.1, mSmile: -.3, mWide: .82, iris: .94, sparkleEyes: .3, headNod: .14 },
  cold:       { open: .72, lid: .38, squint: 0, iris: .66, pupil: .6, hi: .15, browY: -.05, browA: .1, mSmile: -.12, mWide: .7, chill: 1, headNod: -.2 },
  menacing:   { open: .7, lid: .45, iris: .7, pupil: .45, hi: .5, shadowEyes: 1, mSmile: .5, mAsym: .45, mWide: 1.1, mOpen: .08, mTeeth: .5, browA: .6, browK: .3, headNod: .25 },
  pained:     { open: .4, squint: .6, lid: -.4, browA: -.65, browK: .9, mOpen: .2, mTeeth: 1, mWide: 1.1, mSmile: -.45, sweat: .7, headNod: .1, headTilt: .08 },
  tender:     { open: .72, squint: .38, mSmile: .45, browA: -.35, browY: .05, blush: .4, headNod: .12, headTilt: .14 },
  sly:        { open: .6, squint: .15, lid: .1, lookX: .65, mSmile: .36, mAsym: .85, browAs: .5, browA: .2, headTilt: -.06 },
  pout:       { open: .9, mPout: 1, mWide: .7, browA: -.3, browY: .05, blush: .4, lookX: -.4 },
  thinking:   { open: .82, lookX: .55, lookY: -.7, mAsym: -.4, mSmile: -.1, mWide: .8, browAs: .5, browK: .2, headTilt: -.07 },
  sleepy:     { open: .32, lid: -.1, mOpen: .05, browY: -.05, headNod: .15 },
};
const _AN_EYEF = ['open', 'winkL', 'winkR', 'happy', 'lid', 'squint', 'iris', 'pupil', 'hi', 'sparkleEyes'];
const _AN_BROWF = ['browY', 'browA', 'browK', 'browAs'];
const _AN_MOUTHF = ['mOpen', 'mSmile', 'mWide', 'mTeeth', 'mTongue', 'mAsym', 'mPout'];
// Automatic blinks at irregular seeded times (2-5 s apart), now and then a double blink. A blink closes fast (.055 s),
// holds a frame and opens slower. Pure function of t.
const _anBlinkAt = a => a < 0 || a > .2 ? 0 : a < .055 ? easeOut(a / .055) : a < .085 ? 1 : 1 - ease((a - .085) / .115);
function _anAutoBlink(t, seed = 0) {
  const per = 3.3, i0 = Math.floor((t + seed * 1.37) / per); let k = 0;
  for (let i = i0 - 1; i <= i0 + 1; i++) {
    const tb = i * per - seed * 1.37 + .4 + hash(i * 7.31 + seed * 13.7) * 2.3;
    k = Math.max(k, _anBlinkAt(t - tb));
    if (hash(i * 3.91 + seed * 5.3) > .74) k = Math.max(k, _anBlinkAt(t - tb - .3));
  }
  return k;
}
// Eye darts: small held glances that change every ~1.7 s (eyes are never perfectly still). Pure function of t.
function _anSaccade(t, seed = 0) {
  const per = 1.7, i = Math.floor((t + seed) / per), f = (t + seed) - i * per;
  const at = j => [(hash(j * 4.1 + seed) - .5) * .28, (hash(j * 6.7 + seed + 2) - .5) * .14];
  const a = at(i - 1), b = at(i), k = ease(f / .07);
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
}
// The numeric face for a pose: pose.face (from animeAct) or pose.expr (+ its idle motion), then eyes / brows / mouth
// overrides (an expression name borrows that part, or numbers), then the direct fields.
function _anFaceOf(p) {
  const base = p.face && typeof p.face === 'object' ? p.face : ANIME_EXPR[p.expr] || {};
  const F = { ..._AN_F0, ...base };
  for (const k in _AN_F0) if (typeof F[k] !== 'number' || !isFinite(F[k])) F[k] = _AN_F0[k];
  if (!p.face && p.expr && p.t != null) { const id = _anIdle(p.expr, p.t); if (id) for (const f in id) F[f] += id[f]; }
  const part = (v, fields) => { if (!v) return; const src = typeof v === 'string' ? (ANIME_EXPR[v] ? { ..._AN_F0, ...ANIME_EXPR[v] } : null) : v; if (src) for (const f of fields) if (typeof src[f] === 'number') F[f] = src[f]; };
  part(p.eyes, _AN_EYEF); part(p.brows, _AN_BROWF); part(p.mouth, _AN_MOUTHF);
  for (const f of ['lookX', 'lookY', 'blush', 'tears', 'sweat', 'shadowEyes', 'sparkleEyes']) if (p[f] != null) F[f] = p[f];
  if (p.lookLead) F.lookX = F.lookX + p.lookLead;
  if (p.t != null && p.saccade !== false) { const s = _anSaccade(p.t, p.seed ?? 0); F.lookX += s[0]; F.lookY += s[1]; }
  F.lookX = clamp(F.lookX, -1.1, 1.1); F.lookY = clamp(F.lookY, -1.1, 1.1);
  F.blink = clamp(Math.max(p.blink || 0, p.turnBlink || 0, p.t != null && p.autoBlink !== false ? _anAutoBlink(p.t, p.seed ?? 0) : 0));
  F.talk = clamp(p.talk || 0);
  return F;
}

// ======================================================================================================== eyes
// Eye templates in eye widths, outer corner at +x: U upper lid (inner -> outer), Lo lower lid (outer -> inner),
// fl the lash flick beyond the outer corner, h a height scale.
const _AN_EYES = {
  almond: { U: [[-.5, .07], [-.37, -.12], [-.15, -.255], [.1, -.29], [.33, -.235], [.5, -.06]], Lo: [[.5, -.06], [.42, .09], [.2, .19], [-.1, .2], [-.36, .16], [-.5, .07]], fl: [[.6, -.12], [.7, -.19]] },
  round:  { U: [[-.5, .08], [-.38, -.16], [-.15, -.3], [.1, -.32], [.33, -.25], [.5, -.05]], Lo: [[.5, -.05], [.43, .12], [.2, .22], [-.1, .23], [-.36, .18], [-.5, .08]], fl: [[.59, -.1], [.68, -.16]] },
  sharp:  { U: [[-.5, .08], [-.35, -.1], [-.1, -.22], [.15, -.26], [.37, -.235], [.52, -.13]], Lo: [[.52, -.13], [.44, .04], [.22, .15], [-.08, .18], [-.35, .15], [-.5, .08]], fl: [[.64, -.21], [.75, -.29]] },
  droopy: { U: [[-.5, .04], [-.37, -.15], [-.14, -.27], [.12, -.28], [.34, -.2], [.5, .01]], Lo: [[.5, .01], [.42, .12], [.2, .2], [-.1, .2], [-.36, .14], [-.5, .04]], fl: [[.6, -.03], [.7, -.07]] },
  narrow: { U: [[-.5, .05], [-.36, -.08], [-.12, -.18], [.12, -.2], [.34, -.16], [.5, -.04]], Lo: [[.5, -.04], [.42, .07], [.2, .14], [-.1, .15], [-.36, .12], [-.5, .05]], fl: [[.57, -.08], [.64, -.11]] },
};
const _anLoAt = (Lo, x) => { for (let i = 0; i < Lo.length - 1; i++) { const a = Lo[i], b = Lo[i + 1]; if ((x <= a[0] && x >= b[0])) return lerp(a[1], b[1], (x - a[0]) / ((b[0] - a[0]) || 1)); } return Lo[Lo.length - 1][1]; };
// The profile eye: a '<' wedge (the lids meet at the outer corner and open toward the nose, the cornea front left open).
const _AN_EYE_SIDE = { U: [[-.5, -.2], [-.37, -.25], [-.15, -.27], [.1, -.235], [.33, -.15], [.5, -.035]], Lo: [[.5, -.035], [.42, .02], [.2, .1], [-.1, .155], [-.36, .175], [-.5, .165]] };
const _anEyeT = (T, k) => k <= 0 ? T : { ...T, U: T.U.map((p, i) => [lerp(p[0], _AN_EYE_SIDE.U[i][0], k), lerp(p[1], _AN_EYE_SIDE.U[i][1], k)]), Lo: T.Lo.map((p, i) => [lerp(p[0], _AN_EYE_SIDE.Lo[i][0], k), lerp(p[1], _AN_EYE_SIDE.Lo[i][1], k)]) };
// One eye. g = { x, y, w, t } placement (head units), s = +1/-1 (which way the outer corner points), side 'L'|'R'.
// mode: 'over' (drawn again through the bangs: lash line and iris only), 'lash' (the upper lash line only, drawn again
// over glasses so the lens edge never replaces it).
function _anEye(D, F, g, s, side, L, mode) {
  const over = mode === 'over', lashOnly = mode === 'lash', full = !over && !lashOnly;
  const pk = clamp((Math.abs(g.t) - .62) / .2);   // 0 front .. 1 profile
  const c = _AN.c, T = _anEyeT(_AN_EYES[D.eyeShape] || _AN_EYES.almond, pk), E = .185 * D.eyeSize;
  const hgt = (D.m ? 1.0 : 1.16) * (D.elder ? .86 : D.mature ? .95 : 1);
  const wink = side === 'L' ? F.winkL : F.winkR;
  let o = F.open * (1 - F.blink) * (1 - wink) * (1 - .22 * F.squint);
  const happy = Math.max(F.happy * (F.open < .5 ? 1 : 0), wink > .5 ? 1 : 0, F.happy * wink), lid = F.lid;
  const closedY = x => lerp(.07 + .07 * (1 - 4 * x * x) - .03 * (x + .5), .1 - .19 * (1 - 4 * x * x) + .02 * (x + .5), happy);
  const M = (x, y) => { const X = s * x, Xc = X - g.t * .45 * (X * X - .25); return [g.w * Xc, y * hgt]; };
  const sq = F.squint + .4 * wink;   // a wink pushes the cheek and the lower lid up
  const Lo = T.Lo.map(([x, y]) => [x, y - sq * .15 * (1 - 4 * x * x) * (x < .45 ? 1 : .5)]);
  const U = T.U.map(([x, y]) => {
    let yy = o >= 1 ? y * (1 + (o - 1) * 1.6) : lerp(closedY(x), y, o);
    yy += lid > 0 ? lid * .17 * (.5 - x) * Math.min(1, o * 2) : lid * .14 * (.5 - x) * Math.min(1, o * 2) - lid * .07 * (x + .5);
    return [x, Math.min(yy, _anLoAt(Lo, x) - .012)];
  });
  const lashC = D.lash, lnC = D.skinLn, Lx = L[0] < 0 ? -1 : 1, sc = c.getTransform();
  c.save(); c.translate(g.x, g.y); c.scale(E, E);
  const P = pts => pts.map(([x, y]) => M(x, y));
  const shut = o < .1;
  // eyeshadow (adult women): a soft band on the lid that closes to points at both corners, strongest toward the outer
  // corner, fading as the eye closes (never a slab over a closed eye)
  if (D.eyeshadow && !D.m && full) {
    const a = .42 * (.3 + .7 * clamp(o)) * (1 - clamp((happy - .5) * 4));
    if (a > .01) {
      const thk = x => Math.pow(Math.max(0, 1 - 4 * x * x), .6);
      const top = P(U.map(([x, y]) => [x * 1.03 + .01, y - (.13 + .06 * (1 - 4 * x * x)) * thk(x)])), bot = P(U.map(([x, y]) => [x, y - .01]));
      const gr = c.createLinearGradient(M(-.5, 0)[0], 0, M(.5, 0)[0], 0);
      gr.addColorStop(0, _anA(D.eyeshadow, 0)); gr.addColorStop(.3, _anA(D.eyeshadow, a * .8)); gr.addColorStop(.72, _anA(D.eyeshadow, a)); gr.addColorStop(1, _anA(D.eyeshadow, a * .15));
      c.fillStyle = gr; c.fill(celSpline(top.concat(bot.reverse()), true));
    }
  }
  // cold: a faint blue-grey tone under the eye
  if (F.chill > .02 && full) { c.save(); c.scale(1, .3); const gx = M(0, 0)[0]; const gg = c.createRadialGradient(gx, .95, 0, gx, .95, .5 * g.w + .1); gg.addColorStop(0, _anA('#7C8DB4', .17 * F.chill)); gg.addColorStop(1, _anA('#7C8DB4', 0)); c.fillStyle = gg; c.fillRect(gx - 1, 0, 2, 2); c.restore(); }
  if (!shut && !lashOnly) {
    const white = celSpline(P(U.concat(Lo.slice(1, -1))), true);
    if (!over) { c.fillStyle = '#FFFFFF'; c.fill(white); }
    c.save(); c.clip(white);
    // iris: tall ellipse, dark top -> light bottom, darker rim, pupil, lid shadow band, lower glow, reflections, catchlights;
    // in profile a narrow upright oval at the front of the eye
    const ix = F.lookX * .19 * s * s + g.t * .06 + .1 * g.t * pk, iy = -.03 + F.lookY * .07, isz = F.iris * (D.elder ? .86 : D.m ? .93 : 1);
    const [cx, cy] = M(ix * s, iy), Xc = ix, sx = Math.max(lerp(.56, .32, pk), g.w * (1 - .9 * g.t * Xc)), rx = .27 * isz * sx, ry = .36 * isz * (hgt / 1.16);
    const ip = _anEllP(cx, cy, rx, ry);
    const gr = c.createLinearGradient(0, cy - ry, 0, cy + ry);
    gr.addColorStop(0, D.eyeDk); gr.addColorStop(.38, _anMix(D.eyeDk, D.eyeC, .7)); gr.addColorStop(.62, D.eyeC); gr.addColorStop(1, D.eyeLt);
    c.fillStyle = gr; c.fill(ip);
    c.save(); c.clip(ip);
    { const q = new Path2D(); q.rect(-1e3, -1e3, 2e3, 2e3); q.addPath(ip, new DOMMatrix([1, 0, 0, 1, 0, -.11])); c.fillStyle = _anA(_anMix(D.eyeLt, '#FFFFFF', .25), .85); c.fill(q, 'evenodd'); }
    const pr = F.pupil * (F.shadowEyes > .5 ? .7 : 1);
    c.fillStyle = _anMix(D.eyeDk, '#0A0610', .55); c.fill(_anEllP(cx, cy + .015, .095 * pr * sx * isz, .155 * pr * isz));
    // coloured reflections in the lower iris
    c.fillStyle = _anA(_anMix(D.eyeLt, '#FFFFFF', .45), .75);
    c.fill(_anEllP(cx - Lx * rx * .42, cy + ry * .45, rx * .16, ry * .1, -.5 * Lx)); c.fill(_anEllP(cx + Lx * rx * .3, cy + ry * .55, rx * .22, ry * .07, .4 * Lx));
    c.restore();
    c.strokeStyle = _anA(D.eyeDk, .95); c.lineWidth = .035; c.stroke(ip);
    // the upper lid's shadow across the white and the iris
    const band = P(U.map(([x, y]) => [x, y - .02])).concat(P(U.map(([x, y]) => [x, y + .12 + .04 * (1 - 4 * x * x)])).reverse());
    if (!over) { c.fillStyle = _anA('#6E5E9A', .32); c.fill(celSpline(band, true)); }
    // catchlights: one big on the light side, one small opposite (stars when sparkling)
    const ha = F.hi * (1 - .85 * F.shadowEyes);
    if (ha > .02) {
      const ga0 = c.globalAlpha; c.globalAlpha = ga0 * ha;
      if (F.sparkleEyes > .3) {
        _anStar(c, cx + Lx * rx * .3, cy - ry * .32, .16 * isz, '#FFFFFF');
        _anStar(c, cx - Lx * rx * .38, cy + ry * .38, .07 * isz, '#FFFFFF');
      } else {
        c.fillStyle = '#FFFFFF';
        c.fill(_anEllP(cx + Lx * rx * .36, cy - ry * .36, .085 * isz * Math.max(.7, sx), .105 * isz, -.35 * Lx));
        c.fill(_anEllP(cx - Lx * rx * .42, cy + ry * .38, .038 * isz, .038 * isz));
        c.fill(_anEllP(cx + Lx * rx * .05, cy - ry * .05, .018 * isz, .018 * isz));
      }
      c.globalAlpha = ga0;
    }
    c.restore();
  }
  // lower lid: thin, partial (outer part; a man's runs the full width, lighter), a tiny inner-corner tick
  if ((!shut || o > .02) && !lashOnly) {
    if (D.m) _anTaper(P(Lo), _anTp(.12, .3, .006, .024, .004), _anA(_anMix(lashC, lnC, .55), .6));
    else _anTaper(P(Lo.slice(0, 4)), _anTp(.15, .5, .01, .028, .004), _anA(_anMix(lashC, lnC, .55), .9));
  }
  if (full && pk < .5) _anTaper(P([[-.5, .07], [-.46, .12]]), () => .018, _anA(lnC, .7));
  // upper lash line: thick, tapered, dark, with the outer flick and a lash cluster; crease above. A closed eye keeps
  // the full lash weight (a bold curve) and a short flick bent down.
  const curve = shut ? T.U.map(([x]) => [x, closedY(x)]) : U;
  const cy5 = closedY(.5), last = T.U[T.U.length - 1];
  const wing = D.m ? [] : shut ? [[.57, cy5 + .035], [.64, cy5 + .08]]
    : (D.liner ? T.fl.map(([x, y], i) => [x + .04 * (i + 1), y - .025 * (i + 1)]) : T.fl).map(([x, y]) => [x, y + (curve[curve.length - 1][1] - last[1])]);
  const lashPts = curve.concat(wing);
  const th = D.m ? .1 : .15, kw = th / .15;
  const lashW = u => shut
    ? lerp(.075, .135, u) * kw * (1 - .9 * ease(seg(u, D.m ? .9 : .85, 1)))
    : lerp(.022, th, ease(Math.min(1, u / .72))) * (D.m ? (u > .9 ? 1 - ease((u - .9) / .1) * .55 : 1) : (u > .78 ? 1 - ease((u - .78) / .22) * .92 : 1));
  const dense = _anDense(lashPts, false, 5).map(p => p.slice()), n = dense.length;
  for (let i = 0; i < n; i++) dense[i][1] -= lashW(i / (n - 1)) * .42;
  const lg = c.createLinearGradient(M(-.5, 0)[0], 0, M(.5, 0)[0], 0);
  lg.addColorStop(0, _anMix(lashC, lnC, .55)); lg.addColorStop(.45, lashC); lg.addColorStop(1, lashC);
  _anTaper(P(dense), lashW, lg, false);
  if (!shut && o > .35) {
    // lash cluster at the outer corner (women)
    if (!D.m) for (const [u, ang, len] of [[.8, .45, .1], [.91, .7, .12]]) {
      const i = Math.round(u * (n - 1)), p = dense[i], q = dense[Math.min(n - 1, i + 1)];
      const a = Math.atan2(q[1] - p[1], q[0] - p[0]) - ang, b = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len - .02];
      _anTaper(P([[p[0] - .05, p[1] + .02], [lerp(p[0], b[0], .55), lerp(p[1], b[1], .5) - .01], b]), _anTp(.1, .9, .08, .08, 0), lashC);
    }
    // the double-eyelid crease
    if (full) _anTaper(P(U.slice(2).map(([x, y], i) => [x * 1.02, y - .15 - .02 * i])), _anTp(.3, .4, 0, .022, 0), _anA(lnC, .55));
  } else if (shut && !D.m) {
    for (const u of [.55, .72, .88]) { const i = Math.round(u * (n - 1)), p = dense[i]; _anTaper(P([[p[0], p[1] + .03], [p[0] + .06, p[1] + .11 * (1 - happy * 1.6)]]), _anTp(.1, .8, .035, .035, 0), lashC); }
  }
  // age: crow's feet and the lower bag line
  if ((D.elder || D.mature) && full) {
    const a = D.elder ? .7 : .35;
    _anTaper(P([[.6, -.02], [.7, -.06], [.78, -.07]]), _anTp(.3, .5, 0, .02, 0), _anA(lnC, a));
    _anTaper(P([[.6, .07], [.7, .1], [.77, .13]]), _anTp(.3, .5, 0, .018, 0), _anA(lnC, a));
    _anTaper(P([[-.25, .33], [0, .37], [.3, .33]]), _anTp(.3, .5, 0, .016, 0), _anA(lnC, a * .7));
  }
  c.setTransform(sc); c.restore();
}
function _anStar(c, x, y, r, col) {
  c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, q = i % 2 ? r * .2 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  c.closePath(); c.fill(); c.restore();
}

// ======================================================================================================== face
// The head outline: the skull ellipse over the top, the face contour round the chin. Returns the closed polygon and
// the visible face contour (temple -> chin -> jaw) for the line.
function _anHeadShape(G) {
  const psi = G.psi, cx = _AN_SK.z * Math.sin(psi), cy = _AN_SK.y, rx = Math.hypot(_AN_SK.rx * Math.cos(psi), _AN_SK.rz * Math.sin(psi)), ry = _AN_SK.ry;
  const L5 = G.L[4], R0 = G.R[0];
  let aL = Math.atan2(L5[1] - cy, L5[0] - cx), aR = Math.atan2(R0[1] - cy, R0[0] - cx);
  if (!G.mir) { while (aR < aL) aR += TAU; } else { while (aR > aL) aR -= TAU; }
  const arc = []; for (let i = 1; i < 12; i++) { const a = lerp(aL, aR, i / 12); arc.push([cx + rx * Math.cos(a), Math.min(cy + ry * Math.sin(a), .2)]); }
  const ctrl = [L5, ...arc, ...G.R, ...G.L.slice(0, 4)], N = 5, dense = _anDense(ctrl, true, N), iR0 = (1 + arc.length) * N;
  const nk = G.neck, nx = [nk.L[0][0], nk.L[1][0], nk.R[0][0], nk.R[1][0]];
  return { path: celPoly(dense), dense, face: dense.slice(iR0).concat([dense[0]]), skull: { cx, cy, rx, ry }, neckX: [Math.min(...nx), Math.max(...nx)] };
}
function _anLocalLight(m, light, rot = 0) {
  let [lx, ly] = light || [-.55, -.83]; const det = m.a * m.d - m.b * m.c || 1;
  let x = (m.d * lx - m.c * ly) / det, y = (-m.b * lx + m.a * ly) / det; const d = Math.hypot(x, y) || 1; x /= d; y /= d;
  const c = Math.cos(-rot), s = Math.sin(-rot); return [x * c - y * s, x * s + y * c];
}
function _anEar(D, e, L) {
  if (e.v < .5 || Math.abs(e.f) < .04) return;
  const c = _AN.c; c.save(); c.translate(e.x, e.y); c.scale(e.f, 1);
  const out = [[.012, -.085], [-.03, -.108], [-.075, -.085], [-.092, -.02], [-.08, .045], [-.055, .09], [-.03, .118], [-.005, .112], [.012, .09]];
  const p = celSpline(out, true);
  c.fillStyle = D.skin; c.fill(p);
  _anCrescent(p, L[0] * .02 * Math.sign(e.f), L[1] * .02, D.skinSh);
  c.fillStyle = _anA(D.skinSh, 1); c.fill(celSpline([[-.012, -.05], [-.05, -.045], [-.058, .01], [-.04, .055], [-.018, .04], [-.008, 0]], true));
  c.restore();
  c.save(); c.translate(e.x, e.y); c.scale(e.f, 1);
  const w = _anLW(1.5) / Math.max(.3, Math.abs(e.f));
  _anTaper(_anDense(out.slice(0, 8), false, 5), _anTp(.15, .15, w * .3, w, w * .4), D.skinLn, false);
  _anTaper([[-.015, -.055], [-.052, -.05], [-.06, .005], [-.042, .052]], _anTp(.2, .3, 0, w * .7, 0), _anA(D.skinLn, .8));
  c.restore();
}
function _anNose(D, G, F, L, dy) {
  const n = G.nose; if (n.v < .5) return;
  const hd = G.mir ? -1 : 1, sh = L[0] < 0 ? 1 : -1, tx = n.tx, ty = n.ty + dy, w = _anLW(1.2);
  if (D.m && n.k < .75) _anTaper([[n.x + sh * .012 + (tx - n.x) * .2, n.y - .07 + dy], [lerp(n.x, tx, .7) + sh * .016, ty - .03], [tx + sh * .01, ty - .008]], _anTp(.3, .3, 0, w * .9, w * .3), _anA(D.skinLn, .55));
  if (n.k < .25) {
    _anFill([[tx + sh * .003, ty - .055], [tx + sh * .022, ty - .003], [tx + sh * .003, ty + .006]], D.skinSh);
    _anTaper([[tx - .011, ty + .005], [tx, ty + .008], [tx + .009, ty + .004]], _anTp(.3, .3, 0, w, 0), _anA(D.skinLn, .75));
  } else if (n.k < .75) {
    _anFill([[tx + hd * .004, ty - .04], [tx + hd * .008, ty - .006], [tx - hd * .008, ty + .007]], D.skinSh);
    _anTaper([[tx + hd * .002, ty - .03], [tx + hd * .004, ty - .004], [tx - hd * .014, ty + .01]], _anTp(.3, .3, 0, w * 1.1, w * .3), D.skinLn);
  } else {
    _anTaper([[tx - hd * .052, ty + .002], [tx - hd * .044, ty + .013], [tx - hd * .03, ty + .016]], _anTp(.3, .3, 0, w, 0), _anA(D.skinLn, .7));
  }
}
function _anMouth(D, G, F, L, dy) {
  const g = G.mouth; if (g.v < .5) return;
  const c = _AN.c, Mw = (D.m ? .132 : .12) * g.w * clamp(F.mWide, .45, 1.5) * (1 - .32 * F.mPout) * (1 + .25 * clamp(F.mOpen * 1.5));
  const open = clamp(Math.max(F.mOpen, F.talk * .5)), sm = F.mSmile, asy = F.mAsym, t = g.t;
  const yL = -(sm - asy * .55) * .2, yR = -(sm + asy * .55) * .2;
  const M = ([x, y]) => [x - t * .45 * (x * x - .25), y];
  c.save(); c.translate(g.x, g.y + dy); c.scale(Mw * 1, Mw);
  const lw = _anLW(1.35) / Mw;
  if (open < .07) {
    const ym = .04 * sm + .02, pts = [[-.5, yL], [-.25, lerp(yL, ym, .7)], [0, ym], [.25, lerp(yR, ym, .7)], [.5, yR]].map(M);
    if (D.lips) {   // a soft lower lip in the lip colour, a gloss dot
      c.fillStyle = _anA(D.lips, .5); c.fill(celSpline([[-.24, ym + .14], [0, ym + .1], [.24, ym + .14], [.12, ym + .3], [-.12, ym + .3]].map(M), true));
      c.fillStyle = _anA('#FFFFFF', .7); c.fill(_anEllP(M([.06, ym + .2])[0], ym + .2, .05, .025));
    }
    _anTaper(pts, _anTp(.25, .25, lw * .15, lw * (1.1 + .4 * F.mPout), lw * .15), D.lipLn);
    if (F.mPout > .3) _anTaper([[-.18, ym + .24], [0, ym + .3], [.18, ym + .24]].map(M), _anTp(.3, .3, 0, lw * .8, 0), _anA(D.lipLn, .7));
    else if (!D.lips) _anTaper([[-.14, ym + .26], [0, ym + .28], [.14, ym + .26]].map(M), _anTp(.3, .3, 0, lw * .6, 0), _anA(D.skinLn, .45));
    if (Math.abs(asy) > .3) { const s = asy > 0 ? 1 : -1; _anTaper([[s * .5, s > 0 ? yR : yL], [s * .56, (s > 0 ? yR : yL) - .1]].map(M), _anTp(.2, .5, lw * .5, lw * .5, 0), _anA(D.lipLn, .6)); }
  } else {
    const yU = -.02 - open * .08 + sm * .04, yB = .06 + open * (.95 - .2 * Math.max(0, sm));
    const up = [[-.5, yL], [-.3, yU + .02], [0, yU - .01], [.3, yU + .02], [.5, yR]], lo = [[.5, yR], [.32, yB * .78], [0, yB], [-.32, yB * .78], [-.5, yL]];
    const shape = celSpline(up.concat(lo.slice(1, -1)).map(M), true);
    const gr = c.createLinearGradient(0, yU, 0, yB); gr.addColorStop(0, _anMix(D.mouthIn, '#000000', .25)); gr.addColorStop(1, D.mouthIn);
    c.fillStyle = gr; c.fill(shape);
    c.save(); c.clip(shape);
    if (F.mTongue > .05 || open > .3) { c.fillStyle = D.tongue; c.fill(_anEllP(M([0, yB])[0], yB - .02, .34, .2 + .15 * F.mTongue)); }
    if (F.mTeeth > .05) {
      const ga1 = c.globalAlpha; c.globalAlpha = ga1 * clamp(F.mTeeth * 1.5);
      c.fillStyle = '#FFFFFF'; c.fill(celPoly(up.map(M).concat([M([.5, yR + .2]), M([-.5, yL + .2])])));
      if (open < .35) c.fill(celPoly(lo.map(M).concat([M([-.5, yB - .16]), M([.5, yB - .16])])));
      c.globalAlpha = ga1;
    }
    c.restore();
    _anTaper(up.map(M), _anTp(.15, .15, lw * .3, lw * 1.25, lw * .3), D.lipLn);
    _anTaper(lo.map(M), _anTp(.2, .2, lw * .2, lw * .7, lw * .2), _anA(D.lipLn, .8));
    if (D.lips) {   // the lower lip hugs the mouth's lower edge (never a second blob below it), and fades on a wide shout
      const la = .45 * (1 - clamp((open - .3) * 2));
      if (la > .01) { c.fillStyle = _anA(D.lips, la); c.fill(celSpline([[-.24, yB * .86 + .01], [0, yB - .005], [.24, yB * .86 + .01], [0, yB + .12]].map(M), true)); }
    }
    else _anTaper([[-.13, yB + .17], [0, yB + .2], [.13, yB + .17]].map(M), _anTp(.3, .3, 0, lw * .55, 0), _anA(D.skinLn, .45));
  }
  c.restore();
}
function _anBrow(D, F, g, s, side, dy) {
  const E = .185 * D.eyeSize, P0 = [[-.42, -.6], [-.1, -.74], [.28, -.77], [.6, -.66]];
  const as = (side === 'L' ? 1 : -1) * F.browAs, wink = side === 'L' ? F.winkL : F.winkR;
  const P1 = P0.map(([x, y], i) => {
    const inner = 1 - i / 3;
    return [x - F.browK * .07 * inner, y - (F.browY + as * .55) * .28 + F.browA * (inner * (D.m ? .26 : .34) - (1 - inner) * .1) + F.browK * .06 * inner + (D.m ? .1 - .04 * i / 3 : 0)
      + wink * (.1 + .05 * (1 - inner))];   // the winking side's brow comes down
  });
  const M = ([x, y]) => { const X = s * x, Xc = X - g.t * .45 * (X * X - .25); return [g.x + E * g.w * Xc, g.y + dy + E * y]; };
  const wd = E * (D.m ? .13 + .09 * D.browW : .03 + .03 * D.browW);
  // men: a heavier, squarer inner end; women: a fine tapered stroke
  _anTaper(P1.map(M), D.m ? _anTp(.1, .5, wd * .95, wd, wd * .18) : _anTp(.2, .55, wd * .55, wd, wd * .12), _anA(D.browC, .93));
  if (D.lightBrow) {   // silver brows: a darker underside so they still read, and a few hair ticks at the inner end
    _anTaper(P1.map(([x, y]) => [x, y + (D.m ? .055 : .03)]).map(M), _anTp(.2, .5, 0, wd * .28, 0), _anA(_anLine(D.hairSh2), .6));
    if (D.elder) for (let i = 0; i < 4; i++) { const x = lerp(P1[0][0], P1[1][0], .1 + i * .2), y = lerp(P1[0][1], P1[1][1], .1 + i * .2); _anTaper([M([x, y + .04]), M([x + .07, y - .06])], _anTp(.2, .5, 0, wd * .3, 0), _anA(_anLine(D.hairSh2), .55)); }
  }
}
function _anTeardrop(x, y, r, col) {
  const c = _AN.c; const p = celSpline([[x, y - r * 1.6], [x + r * .75, y + r * .1], [x, y + r], [x - r * .75, y + r * .1]], true);
  c.fillStyle = _anA(col, .9); c.fill(p); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(_anEllP(x - r * .25, y, r * .18, r * .3));
  c.strokeStyle = _anLine(col); c.lineWidth = _anLW(1); c.stroke(p);
}
// Face features over the skin (eyes, nose, mouth, blush, tears...). dy = nod shift of the features.
function _anFeatures(D, G, F, L, head, dy) {
  const c = _AN.c, hd = G.mir ? -1 : 1;
  const eR = G.mir ? G.eyeF : G.eyeN, eL = G.mir ? G.eyeN : G.eyeF;
  // 3/4: a small cheekbone shadow on the far cheek, under the notch (it sells the turn of the face)
  const kq = clamp(Math.min((G.yaw - .3) / .12, (.85 - G.yaw) / .12));
  if (kq > .01) {
    const R = G.R, ins = p => [p[0] - hd * .028, p[1]];
    c.save(); c.clip(head.path); c.fillStyle = _anA(D.skinSh, .7 * kq);
    c.fill(celSpline([[R[3][0], R[3][1] + dy * .5], R[4], R[5], [R[6][0], R[6][1] + .01], ins(R[5]), ins(R[4])], true)); c.restore();
  }
  // blush: soft ellipses, plus hatch lines when strong (a wink pushes its cheek up)
  const bl = F.blush;
  if (bl > .02) for (const ch of [G.cheekN, G.cheekF]) {
    if (Math.abs(ch.x) > .37 && G.yaw > .3 && ch === G.cheekF) continue;
    const wk = ((ch === G.cheekN) !== G.mir ? F.winkR : F.winkL) * .02, cy = ch.y + dy - wk;
    _anGlow(ch.x, cy, .085, .042, D.blushC, .42 * bl);
    if (F.hatch > .2) for (let i = 0; i < 4; i++) _anTaper([[ch.x - .045 + i * .025, cy + .016], [ch.x - .03 + i * .025, cy - .016]], _anTp(.3, .3, 0, _anLW(1.1), 0), _anA('#E0506A', .7 * F.hatch));
  }
  if (D.mole) { const [mx, my] = D.mole; c.fillStyle = _anA(D.skinLn, .8); c.fill(_anEllP(mx * (G.mir ? -1 : 1) + G.mouth.x * .8, my + dy, .007, .007)); }
  // eyes: the character's right eye is the near one facing right, the far one facing left
  for (const [g, s, side] of [[eR, -1, 'R'], [eL, 1, 'L']]) {
    if (g.v < .2) continue;
    _anEye(D, F, { x: g.x, y: g.y + dy, w: g.w, t: g.t }, s, side, L);
  }
  _anNose(D, G, F, L, dy);
  // age lines (nasolabial) for older faces
  if (D.elder || (D.mature && D.m)) {
    const n = G.nose, m = G.mouth;
    if (n.v > .5) for (const sd of G.yaw < .25 ? [-1, 1] : [-hd]) {
      const x0 = n.tx + sd * (.065 - .03 * n.k), x1 = m.x + sd * (.075 - .03 * n.k) * m.w;
      const bd = D.acc.beard && D.acc.beard !== 'stubble', P = [[x0, n.ty + dy + .015], [lerp(x0, x1, .5) + sd * .012, n.ty + dy + .07], [x1, m.y + dy + .02]];
      _anTaper(bd ? P.slice(0, 2) : P, _anTp(.3, .4, 0, _anLW(1.1), 0), _anA(D.skinLn, .5 * D.lines + .1));
    }
  }
  // mature and elder men: a hollow under the cheekbone, running down toward the mouth corner
  if (D.m && (D.mature || D.elder) && G.mouth.v > .5) for (const ch of G.yaw < .25 ? [G.cheekN, G.cheekF] : [G.cheekN]) {
    const sd = Math.sign(ch.x - G.mouth.x) || -hd, mx = G.mouth.x + sd * .1 * G.mouth.w, my = G.mouth.y + dy - .02;
    const P = [[ch.x + sd * .01, ch.y + dy - .015], [lerp(ch.x, mx, .45) + sd * .02, lerp(ch.y + dy, my, .45)], [mx + sd * .01, my]];
    _anTaper(P, _anTp(.25, .55, 0, .016, 0), _anA(D.skinSh, .75));
    _anTaper(P.slice(0, 2), _anTp(.3, .4, 0, _anLW(1), 0), _anA(D.skinLn, .35));
  }
  // age lines (face.lines 0..1, fading in from .1): a faint crease between the brows and two across the forehead
  if (D.lines > .1 && G.yaw < 1.1 && G.eyeN.v > .5) {
    const xa = G.eyeN.x, xb = G.eyeF.v > .2 ? G.eyeF.x : G.eyeN.x + (G.mir ? -.25 : .25), xm = lerp(xa, xb, .5), a = .45 * ease(seg(D.lines, .1, .7));
    for (const [y, k] of [[-.2, .8], [-.155, .6]]) _anTaper([[lerp(xa, xm, .25), y + dy + .006], [xm, y + dy - .004], [lerp(xb, xm, .25), y + dy + .006]], _anTp(.3, .3, 0, _anLW(1) * k, 0), _anA(D.skinLn, a * k));
    _anTaper([[xm - .008, -.06 + dy], [xm - .004, -.02 + dy]], _anTp(.3, .3, 0, _anLW(1), 0), _anA(D.skinLn, a));
  }
  if (D.acc.beard) _anBeard(D, G, F, L, head, dy);
  _anMouth(D, G, F, L, dy);
  // tears: a shining pool on the lower lid and streams down the cheeks
  if (F.tears > .05) for (const g of [eR, eL]) {
    if (g.v < .5) continue;
    const E = .185 * D.eyeSize * g.w, x0 = g.x, y0 = g.y + dy + .035;
    _anTaper([[x0 - E * .4, y0], [x0, y0 + .008], [x0 + E * .4, y0]], _anTp(.2, .2, 0, .012 * F.tears, 0), _anA('#BDE8FF', .95));
    const run = [[x0 + E * .15, y0 + .01], [x0 + E * .2, y0 + .08], [x0 + E * .12, y0 + .18 * F.tears], [x0 + E * .18, y0 + .27 * F.tears]];
    _anTaper(run, _anTp(.1, .4, .006, .02 * F.tears, .008), _anA('#A8DCFF', .85));
    _anTaper(run.map(([x, y]) => [x - .004, y]), _anTp(.1, .4, 0, .006, 0), 'rgba(255,255,255,.9)');
  }
  // the menacing shadow: a hard-edged dark band from the hairline down to just below the eyes (multiplied, so the skin
  // hue survives), with a hatched fringe on its edge. The bangs, drawn later, sit on top; the glowing glints in the
  // eyes are drawn after the hair (_anGlints).
  if (F.shadowEyes > .02) {
    const k = F.shadowEyes, ey = Math.max(eR.v > .2 ? eR.y : -9, eL.v > .2 ? eL.y : -9), yE = (ey > -9 ? ey : .07) + dy + .055;
    _anClip(head.path, () => {
      // the edge dips a little in the middle of the face (the brow ridge's shadow), with short slanted hatching
      const cx = G.nose.tx, edge = x => yE + .025 * Math.exp(-Math.pow((x - cx) / .22, 2)), P = [[-.9, -.8 + dy]];
      for (let i = 0; i <= 24; i++) { const x = -.6 + i * .05; P.push([x, edge(x)]); }
      P.push([.9, -.8 + dy]);
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = _anA('#2A1A4A', .58 * k); c.fill(celPoly(P));
      for (let i = 0; i < 14; i++) { const x = -.42 + i * .06 + (i % 2) * .012, e = edge(x); _anTaper([[x, e - .025], [x + .022, e + .022 + .012 * (i % 3)]], _anTp(.1, .6, _anLW(1.3), _anLW(1.3), 0), _anA('#2A1A4A', .5 * k)); }
      c.restore();
    });
  }
  // gloom: blue forehead and hanging lines (shock, dread)
  if (F.gloom > .02) _anClip(head.path, () => {
    const gr = c.createLinearGradient(0, -.4, 0, .05); gr.addColorStop(0, _anA('#3A3F9A', .55 * F.gloom)); gr.addColorStop(1, _anA('#3A3F9A', 0));
    c.fillStyle = gr; c.fillRect(-.6, -.45, 1.2, .5);
    for (let i = 0; i < 6; i++) { const x = -.2 + i * .08 + G.mouth.x * .7; _anTaper([[x, -.3], [x, -.3 + .2 * F.gloom * (.6 + .4 * hash(i))]], _anTp(.1, .5, _anLW(1.2), _anLW(1.2), 0), _anA('#2A2C70', .75 * F.gloom)); }
  });
}
// The menacing look's cold glints: drawn after the hair, so a bang never covers them.
function _anGlints(D, G, F, dy) {
  const k = F.shadowEyes, c = _AN.c; if (k <= .4) return;
  for (const g of [G.eyeN, G.eyeF]) if (g.v > .5) {
    const gx = g.x + g.t * .012, gy = g.y + dy - .004;
    c.fillStyle = _anA(D.eyeLt, .85 * k); c.fill(_anEllP(gx, gy, .05 * Math.max(.4, g.w) / 2, .02 / 2 + .002));
    c.fillStyle = _anA('#FFFFFF', k); c.fill(_anEllP(gx, gy, .014 * Math.max(.4, g.w), .006));
  }
}
// Push a closed polygon outward by f(point) (head units), using the outward side of each edge.
function _anOffsetPoly(P, f) {
  const n = P.length; let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  return P.map((p, i) => {
    const a = P[(i - 1 + n) % n], b = P[(i + 1) % n]; let nx = b[1] - a[1], ny = a[0] - b[0]; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
    if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
    const e = f(p, i); return [p[0] + nx * e, p[1] + ny * e];
  });
}
// Resample a polyline at a fixed arc-length step (for even tufts and zigzags).
function _anResample(P, step) {
  const out = [P[0].slice()]; let acc = 0;
  for (let i = 1; i < P.length; i++) {
    let a = P[i - 1], b = P[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (acc + d >= step) { const k = (step - acc) / d; a = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; out.push(a); d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc = 0; }
    acc += d;
  }
  out.push(P[P.length - 1].slice()); return out;
}
// Beards (acc.beard): 'short' (a trimmed boxed beard: jaw, chin and lower cheeks, with moustache), 'full' (higher up the
// cheeks, fuller), 'goatee' (moustache and chin), 'stubble' (a tone along the jaw). The beard is a mass in a lighter
// mix of the hair colour: its top edge runs down the cheekbone diagonal in small tufts and fades into the skin, its
// outer edge along the jaw is tufted, and only its lower part carries a line. Its moustache joins it at the mouth
// corners, and the lower lip shows through.
function _anBeard(D, G, F, L, head, dy) {
  const kind = D.acc.beard; if (G.mouth.v < .5 || G.yaw > 1.15) return;
  const c = _AN.c, m = G.mouth, my = m.y + dy, cx = m.x, mw = .062 * Math.max(.35, m.w) + .012;
  const nx = G.earN.x, sN = Math.sign(nx - cx) || -1, sF = -sN, fx = lerp(G.R[2][0], cx + sF * .12, clamp(G.yaw));
  const fill = _anMix(D.hairC, '#FFFFFF', .15), sh = _anMix(D.hairSh, D.hairC, .2), ln = D.hairLn, lw = _anLW(1.3);
  // stubble: a soft tone along the jaw and chin
  const st = [[nx + sN * .3, .2], [nx - sN * .01, .2], [lerp(nx, cx, .3), .33 + dy], [cx, .41 + dy], [lerp(fx, cx, .3), .33 + dy], [fx + sF * .01, .2], [fx + sF * .3, .2], [fx + sF * .3, 1.2], [nx + sN * .3, 1.2]];
  c.save(); c.clip(head.path); c.fillStyle = _anA(_anMix(D.hairSh, D.skinSh, .45), kind === 'stubble' ? .4 : .18); c.fill(celSpline(st, true)); c.restore();
  if (kind === 'stubble') return;
  const goat = kind === 'goatee', full = kind === 'full';
  const must = [[cx + sN * mw * 1.18, my + .012], [cx + sN * mw * .72, my - .03], [cx, my - .043], [cx + sF * mw * .72, my - .03], [cx + sF * mw * 1.18, my + .012]];
  // one side's top edge: the sideburn at the ear, then down the cheekbone diagonal to the mouth corner
  const yA = full ? .13 : .19, yB = full ? .25 : .3;
  const side = (x0, sd) => [[x0 + sd * .3, yA - .03], [x0 - sd * .015, yA], [lerp(x0, cx, .35), lerp(yA, yB, .6) + dy], [lerp(x0, cx, .62), yB + dy], [cx + sd * mw * 1.5, my + .035]];
  const zig = P => _anResample(_anDense(P, false, 4), .0125).map(([x, y], i) => [x, y + (i % 2 ? .008 : -.004)]);   // tufts
  const sideN = side(nx, sN), sideF = side(fx, sF).reverse();
  const top = goat ? [[cx + sN * mw * 1.6, .7], [cx + sN * mw * 1.5, my + .07], ...must, [cx + sF * mw * 1.5, my + .07], [cx + sF * mw * 1.6, .7]]
    : [sideN[0], ...zig(sideN.slice(1)), ...must.slice(1, -1), ...zig(sideF.slice(0, -1)), sideF[sideF.length - 1]];
  const regAt = off => celPoly(top.map(([x, y], i) => [x, y + (i > 0 && i < top.length - 1 ? off : 0)]).concat([[top[top.length - 1][0], 1.3], [top[0][0], 1.3]]));
  // the outer edge: the face contour pushed out at the jaw and chin, tufted
  const thick = full ? .03 : goat ? .022 : .014;
  const out = _anOffsetPoly(head.dense, (p, i) => p[1] > .16 ? (thick + (i % 2 ? .004 + .006 * hash(i * 1.37 + D.seed) : 0)) * clamp((p[1] - .16) / .2) * (goat ? clamp(1 - Math.abs(p[0] - cx) / (mw * 2.2)) : 1) : 0), outP = celPoly(out);
  const reg = regAt(.02);
  c.save(); c.clip(outP);
  for (const [off, a] of [[0, .35], [.01, .6], [.02, 1]]) { c.fillStyle = _anA(fill, a); c.fill(regAt(off)); }   // the top edge fades into the skin
  c.save(); c.clip(reg);
  _anCrescent(outP, L[0] * .05, L[1] * .05, sh);
  c.fillStyle = _anA(sh, .35); c.fill(_anMove(reg, 0, .12));   // deeper under the chin
  // hatched texture, combed down
  for (let i = 0; i < 20; i++) {
    const u = hash(i * 3.17 + D.seed), v = hash(i * 7.31 + D.seed + 2), x = lerp(nx, fx, u), y = .33 + .2 * v + dy, a = (u - .5) * .5;
    _anTaper([[x, y], [x + Math.sin(a) * .03, y + .035]], _anTp(.2, .5, 0, _anLW(.9), 0), _anA(ln, .3));
  }
  c.restore();
  // tuft ticks along the top edge
  const edge = top.slice(1, -1);
  for (let i = 1; i < edge.length - 1; i += 2) { const [x, y] = edge[i]; _anTaper([[x, y], [x + (x - cx) * .05, y + .02]], _anTp(.3, .3, 0, _anLW(.9), 0), _anA(ln, .4)); }
  c.restore();
  // the outer line only round the lower part of the jaw and chin
  c.save(); c.clip(reg); c.beginPath(); c.rect(-2, .34 + dy, 4, 2); c.clip(); c.strokeStyle = ln; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(outP); c.restore();
  // the moustache over the upper lip, running into the beard at the mouth corners, and the lower lip showing through
  for (const sd of [sN, sF]) {
    const P = [[cx + sd * .004, my - .04], [cx + sd * mw * .6, my - .03], [cx + sd * mw * 1.25, my + .008], [cx + sd * mw * 1.42, my + .04]];
    _anTaper(P, _anTp(.1, .5, .03 * m.w + .006, .026 * m.w + .006, .01), _anA(ln, .9));
    _anTaper(P, _anTp(.1, .5, .022 * m.w + .004, .018 * m.w + .004, .004), fill);
  }
  c.fillStyle = _anMix(D.skin, D.lips || '#C98B86', .25); c.fill(_anEllP(cx, my + .026 + .012 * F.mOpen, mw * .42, .011 + .02 * F.mOpen));
}
// Neck (and its shading) in head-local space, before the head.
function _anNeck(D, G, L, head, o = {}) {
  const c = _AN.c, N = G.neck, pts = [[N.L[0][0], .1], N.L[0], N.L[1], N.L[2], [N.L[2][0] * 1.4, N.L[2][1] + .25], [N.R[2][0] * 1.4, N.R[2][1] + .25], N.R[2], N.R[1], N.R[0], [N.R[0][0], .1]];
  const p = celSpline(pts, true);
  c.fillStyle = D.skin; c.fill(p);
  _anCrescent(p, L[0] * .05, L[1] * .02, D.skinSh);
  // the head's cast shadow under the jaw
  c.save(); c.clip(p); c.fillStyle = D.skinSh; c.fill(_anMove(head.path, -L[0] * .025, .075)); c.restore();
  const w = _anLW(1.6);
  _anTaper(_anDense([N.L[0], N.L[1], N.L[2]], false, 6), _anTp(.2, .2, w * .3, w, w * .6), D.skinLn, false);
  _anTaper(_anDense([N.R[0], N.R[1], N.R[2]], false, 6), _anTp(.2, .2, w * .3, w, w * .6), D.skinLn, false);
  if (D.acc.necklace === 'choker') {   // a velvet band round the neck, a gem at the front
    const y0 = .6, hgt = .05, xl = N.L[1][0] * 1.03, xr = N.R[1][0] * 1.03, sag = .02, col = '#24182C';
    const band = [[xl, y0 - hgt / 2], [(xl + xr) / 2, y0 - hgt / 2 + sag], [xr, y0 - hgt / 2], [xr, y0 + hgt / 2], [(xl + xr) / 2, y0 + hgt / 2 + sag], [xl, y0 + hgt / 2]];
    c.save(); c.clip(p); _anPaint(band, col, _anShade(col), _anLine(col), L, { lw: _anLW(1), off: .02 }); c.restore();
    if (G.yaw < 1.15) { const gx = lerp(xl, xr, .5 + .5 * clamp(G.yaw) * (G.mir ? -1 : 1) * .6); _anPaint(_anGemPts(gx, y0 + sag + .03, .025), D.acc.gem, _anShade(D.acc.gem), _anLine(D.acc.gem), L, { lw: _anLW(1), off: .01 }); }
  }
}
// Glasses (acc.glasses: { kind: 'rect'|'round'|'half', col, tint (false: clear) }): lenses over the eyes (compressed
// in 3/4), a bridge, and the temple arm running back to the ear. Drawn on the face, under the bangs. The lens tops sit
// above the lash line, and the lash line is drawn again over the lens, so the frame never replaces the eye's lash
// line (a half-rim's bar runs along the lens top, above the eye).
function _anGlasses(D, G, F, L, dy) {
  const gl = D.acc.glasses, c = _AN.c, eR = G.mir ? G.eyeF : G.eyeN, eL = G.mir ? G.eyeN : G.eyeF, lw = _anLW(1.6), lens = [];
  for (const [g, s, side] of [[eR, -1, 'R'], [eL, 1, 'L']]) {
    if (g.v < .2) continue;
    const w = .115 * Math.max(.12, g.w), h = .086, x = g.x + g.t * .012 * (G.mir ? -1 : 1), y = g.y + dy - .006;
    const P = gl.kind === 'round' ? ellPts(x, y + .01, w, h * 1.02, 24) : rrPts(x - w, y - h, w * 2, h * 1.9, Math.min(w, h) * .45);
    lens.push({ g, s, side, x, y, w, h, P });
  }
  if (!lens.length) return;
  for (const l of lens) {
    if (gl.tint) { c.fillStyle = _anA(gl.tint, .1); c.fill(celPoly(l.P)); }
    if (l.g.v > .5) _anEye(D, F, { x: l.g.x, y: l.g.y + dy, w: l.g.w, t: l.g.t }, l.s, l.side, L, 'lash');
    c.fillStyle = _anA('#FFFFFF', .32); c.fill(celPoly([[l.x - l.w * .75, l.y - l.h * .3], [l.x - l.w * .45, l.y - l.h * .7], [l.x - l.w * .25, l.y - l.h * .7], [l.x - l.w * .6, l.y + l.h * .05]]));
    if (gl.kind === 'half') _anTaper(l.P.filter(q => q[1] < l.y - l.h * .35), _anTp(.15, .15, lw * .5, lw * 1.15, lw * .5), gl.col);
    else { c.strokeStyle = gl.col; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(celPoly(l.P)); }
  }
  if (lens.length === 2) { const [a, b] = lens[0].x < lens[1].x ? lens : [lens[1], lens[0]]; _anTaper([[a.x + a.w, a.y - a.h * .45], [(a.x + b.x) / 2, a.y - a.h * .7], [b.x - b.w, b.y - b.h * .45]], () => lw, gl.col); }
  const eN = G.mir ? G.earF : G.earN;
  if (G.yaw > .2 && eN.v > .5) {   // the near temple arm back to the ear
    const l = lens.reduce((a, b) => (G.mir ? b.x > a.x : b.x < a.x) ? b : a), ex = l.x + (G.mir ? l.w : -l.w);
    _anTaper([[ex, l.y - l.h * .55], [lerp(ex, eN.x, .5), l.y - l.h * .6], [eN.x + (G.mir ? -.01 : .01), eN.y - .03]], () => lw, gl.col);
  }
}
// A hat (acc.hat: { kind: 'fedora', col, band }): a 3D brim tilted down at the front and a dented crown, over the hair.
function _anHat(D, H, L, mode, head) {
  const hat = D.acc.hat, c = _AN.c, pitch = .2, N = 40, cp = Math.cos(pitch), sp = Math.sin(pitch), Y0 = -.15;
  const P = (x, y, z) => { const yy = y - Y0, y1 = Y0 + yy * cp + z * sp, z1 = -yy * sp + z * cp; return _anProj([x, y1, z1 - .04], H.psi, H.nu); };
  const ring = (y, rx, rz) => { const out = []; for (let i = 0; i < N; i++) { const a = i / N * TAU; out.push(P(rx * Math.sin(a), y, rz * Math.cos(a))); } return out; };
  const brim = ring(Y0, .68, .72), base = ring(Y0, .49, .52), col = hat.col, sh = _anShade(col, .3, .15, .1), ln = _anLine(col);
  if (mode === 'shadow') {   // the brim's cast shadow over the brow and the eyes
    c.save(); c.clip(head.path); c.fillStyle = _anA(D.skinSh, .8); c.fill(_anMove(celPoly(brim.map(q => [q[0], q[1]])), -L[0] * .02, .085)); c.restore();
    return;
  }
  const xy = R => R.map(q => [q[0], q[1]]);
  _anPaint(xy(brim), col, sh, ln, L, { lw: _anLW(2.2), poly: true, off: .06 });
  // the crown: rings tapering up, a dent along the top; its silhouette is the hull of the rings
  const rings = [];
  for (const [y, k] of [[Y0, 1], [-.33, .98], [-.48, .93], [-.56, .82], [-.6, .6]]) rings.push(...ring(y, .49 * k, .52 * k));
  const hull = _anHull(rings.map(q => [q[0], q[1]]));
  _anPaint(hull, col, sh, ln, L, { lw: _anLW(2.2), poly: true, off: .07 });
  // the band and the crease
  // the contiguous run of ring indices facing us (depth > thr), in order
  const frontRun = (R, thr) => { const ok = i => R[(i + N) % N][2] > thr; let st = -1; for (let i = 0; i < N; i++) if (ok(i) && !ok(i - 1)) { st = i; break; } if (st < 0) return ok(0) ? [...Array(N).keys()] : []; const run = []; for (let k = 0; k < N && ok(st + k); k++) run.push((st + k) % N); return run; };
  const bTop = ring(-.25, .495, .525), bBot = base, run = frontRun(bTop, -.02);
  if (run.length > 1) {
    const band = run.map(i => [bTop[i][0], bTop[i][1]]).concat(run.slice().reverse().map(i => [bBot[i][0], bBot[i][1]]));
    c.save(); c.clip(celPoly(hull)); _anPaint(band, hat.band, _anShade(hat.band), _anLine(hat.band), L, { lw: _anLW(1.2), poly: true, off: .03 }); c.restore();
  }
  const dent = [P(0, -.58, -.32), P(0, -.54, 0), P(0, -.56, .3)].filter(q => q[2] > -.2).map(q => [q[0], q[1]]);
  if (dent.length > 1) _anTaper(dent, _anTp(.2, .3, 0, _anLW(1.4), 0), _anA(ln, .7));
  // the front of the brim comes over the crown's base
  const idx = frontRun(brim, 0);
  if (idx.length > 2) {
    const band = idx.map(i => [brim[i][0], brim[i][1]]).concat(idx.slice().reverse().map(i => [base[i][0], base[i][1]]));
    _anPaint(band, col, null, ln, L, { lw: _anLW(2), poly: true });
    _anTaper(idx.map(i => [lerp(brim[i][0], base[i][0], .15), lerp(brim[i][1], base[i][1], .15) + .006]), () => _anLW(1.2), _anA(_anLight(col, .3), .6));
  }
}
// The head in head-local space, in stages so a body can slot in between:
//   'back' hair behind everything -> 'neck' -> (body) -> 'head': mid hair, skin, ears, face, front hair, brows.
function _anHeadDraw(D, P, F, G, L, o = {}) {
  const c = _AN.c, head = o.head || _anHeadShape(G), nod = clamp((P.nod || 0) + (P.turnNod || 0) + F.headNod, -1, 1), dy = nod * .03;
  const H = o.hair || null, st = o.stage || 'all', backV = G.yaw >= 1.25;
  if ((st === 'all' || st === 'back') && H) _anHairLayer(D, H, 'back', L, head, P.rim);
  if ((st === 'all' || st === 'neck') && !backV) _anNeck(D, G, L, head);
  if (st === 'back' || st === 'neck') return head;
  // a wink lands on the NEAR eye in a 3/4 or profile view (the far eye is foreshortened and often under hair), unless
  // pose.winkSide === 'far'; the expression's asymmetry is mirrored with it
  if (G.yaw > .2 && G.yaw < 1.3 && P.winkSide !== 'far') {
    const nearR = !G.mir, far = nearR ? F.winkL : F.winkR, near = nearR ? F.winkR : F.winkL;
    if (far > near + .01) F = { ...F, winkL: F.winkR, winkR: F.winkL, browAs: -F.browAs, mAsym: -F.mAsym };
  }
  if (o.tilt || P.pop) { c.translate(0, .32); c.rotate(o.tilt || 0); c.scale(1 + (P.pop || 0), 1 + (P.pop || 0)); c.translate(0, -.32); }
  c.fillStyle = D.skin; c.fill(head.path);
  _anCrescent(head.path, L[0] * .055, L[1] * .055, D.skinSh);
  if (P.rim) _anCrescent(head.path, L[0] * .016, L[1] * .016, P.rim);
  if (backV) {   // seen from behind the neck is in front of the head; it stops at the collar (o.neckClip), which sits on it
    c.save(); if (o.neckClip != null) { c.beginPath(); c.rect(-3, -3, 6, 3 + o.neckClip); c.clip(); }
    _anNeck(D, G, L, head); c.restore();
    if (o.afterNeck) o.afterNeck();
  }
  const w = _anLW(2.8);   // the face contour: the outer silhouette weight, heaviest round the jaw and chin
  if (!backV) _anTaper(head.face, u => w * (.3 + .7 * Math.sin(Math.PI * clamp(u * 1.05))), D.skinLn, false);
  if (H) _anHairLayer(D, H, 'mid', L, head, P.rim);
  const eR = G.mir ? G.earF : G.earN, eL = G.mir ? G.earN : G.earF, earLate = G.yaw > .7 && G.yaw < 1.3;   // profile: the ear over the hair
  if (!earLate) { _anEar(D, eR, L); _anEar(D, eL, L); }
  const earrings = () => { if (D.acc.earrings) for (const e of [eR, eL]) if (e.v > .5 && Math.abs(e.f) > .1 && !(G.yaw > 1.2 && H && _anUnderHair(H, e.x, e.y + .1))) _anEarring(D, e, L, P); };
  if (!earLate) earrings();
  if (H) _anHairShadow(D, H, L, head);
  _anFeatures(D, G, F, L, head, dy);
  if (D.acc.glasses && !backV) _anGlasses(D, G, F, L, dy);
  if (D.acc.hat && H && !backV) _anHat(D, H, L, 'shadow', head);
  if (H) _anHairLayer(D, H, 'front', L, head, P.rim);
  if (earLate) { for (const e of [eR, eL]) if (e.v > .5 && Math.abs(e.f) > .04) { c.save(); c.translate(e.x - .014 * Math.sign(e.f), e.y + .012); c.scale(e.f, 1); c.fillStyle = _anA(D.hairSh2, .55); c.fill(celSpline([[.012, -.085], [-.03, -.108], [-.075, -.085], [-.092, -.02], [-.08, .045], [-.055, .09], [-.03, .118], [-.005, .112], [.012, .09]], true)); c.restore(); } _anEar(D, eR, L); _anEar(D, eL, L); earrings(); }
  // modern anime draws the eyes THROUGH the hair: the lash line and iris show at half strength where any front hair
  // covers them (bangs, side locks, temple clumps)
  if (H && G.yaw < 1.2 && F.shadowEyes < .5) {
    const cov = new Path2D();
    for (const k of H.K) if (_anHairPass(k) === 'front') { const q = k.rib.poly; let a = 0; for (let i = 0; i < q.length; i++) { const u = q[i], v = q[(i + 1) % q.length]; a += u[0] * v[1] - v[0] * u[1]; } cov.addPath(celPoly(a < 0 ? q.slice().reverse() : q)); }
    c.save(); c.clip(cov); c.globalAlpha = .5;
    const eR3 = G.mir ? G.eyeF : G.eyeN, eL3 = G.mir ? G.eyeN : G.eyeF;
    for (const [g, s, side] of [[eR3, -1, 'R'], [eL3, 1, 'L']]) if (g.v >= .2) _anEye(D, F, { x: g.x, y: g.y + dy, w: g.w, t: g.t }, s, side, L, 'over');
    c.restore();
  }
  if (G.yaw < 1.2) {
    const eR2 = G.mir ? G.eyeF : G.eyeN, eL2 = G.mir ? G.eyeN : G.eyeF;
    for (const [g, s, side] of [[eR2, -1, 'R'], [eL2, 1, 'L']]) if (g.v > .5) _anBrow(D, F, g, s, side, dy);
  }
  _anGlints(D, G, F, dy);
  if (D.acc.hat && H) _anHat(D, H, L);
  const hd = G.mir ? -1 : 1;
  if (F.sweat > .05 && G.yaw < 1.3) _anTeardrop(G.R[1][0] - hd * .04, -.07 + dy, .035 * (.6 + .4 * F.sweat), '#A9DEFF');
  if (F.vein > .05 && G.yaw < 1.3) {
    const vx = G.R[0][0] - hd * .1, vy = -.27, r = .045 * (.7 + .3 * F.vein);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
      const P0 = [vx + ca * r * 1.25 - sa * r * .5, vy + sa * r * 1.25 + ca * r * .5], P2 = [vx + ca * r * 1.25 + sa * r * .5, vy + sa * r * 1.25 - ca * r * .5], P1 = [vx + ca * r * .55, vy + sa * r * .55];
      _anTaper([P0, P1, P2], _anTp(.3, .3, _anLW(1), _anLW(3.2), _anLW(1)), _anA('#E02844', F.vein));
    }
  }
  return head;
}
// Is head-local point (x, y) under a front-pass hair clump? (an earring on a hidden ear would float)
function _anUnderHair(H, x, y) {
  const c = _AN.c, q = c.getTransform().transformPoint(new DOMPoint(x, y));
  for (const k of H.K) if (_anHairPass(k) === 'front' && c.isPointInPath(celPoly(k.rib.poly), q.x, q.y)) return true;
  return false;
}
function _anEarring(D, e, L, P) {
  const c = _AN.c, x = e.x + (e.f > 0 ? -.03 : .03) * Math.abs(e.f), y = e.y + .12, sw = Math.sin(TAU * (.5 * (P.t || 0))) * .06, k = D.acc.earrings;
  c.save(); c.translate(x, y); c.rotate(sw);
  if (k === 'drop') {
    _anTaper([[0, 0], [0, .06]], () => _anLW(1.2), '#B8913A');
    _anPaint(_anGemPts(0, .1, .028), D.acc.gem, _anShade(D.acc.gem), _anLine(D.acc.gem), L, { lw: _anLW(1), off: .012 });
    c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(_anEllP(-.008, .085, .006, .01));
  } else if (k === 'hoop') { c.strokeStyle = '#D8B45A'; c.lineWidth = _anLW(2); c.beginPath(); c.arc(0, .04, .04, 0, TAU); c.stroke(); }
  else { c.fillStyle = D.acc.gem; c.fill(_anEllP(0, .005, .012, .012)); }
  c.restore();
}

// ======================================================================================================== hair
// Hair is a set of CLUMPS on the skull ellipsoid (3D), projected for the current heading, so every view is consistent.
// A clump runs over the skull from its root, then (hang > 0) leaves it and falls under gravity with waves, sway, wind
// and follow-through. Two ways to place the skull part:
//   az:  th0 -> th1 (angle round the head, 0 = front, + = the character's left), a0 -> a1 (polar angle from the crown)
//   lon: lam (left-right position), b0 -> b1 (front-to-back angle over the top: -1 front hairline, 0 top, 2.2 nape)
// kind: 'back' (hangs behind the head and body), 'cap' (covers the skull), 'side' (frames the face), 'bang'.
// w width, lift (volume above the skull), hang (length after leaving the skull), wave / wl (amplitude / wavelength),
// flare (spreads out), curl (tip turns in, + toward the face), tip 'point'|'fork', taper (where the point starts).
const _anV = (x, y, z) => [x, y, z];
function _anSkullPt(mode, A, B, lift) {
  const rx = _AN_SK.rx + lift, ry = _AN_SK.ry + lift, rz = _AN_SK.rz + lift;
  if (mode === 'lon') { const cl = Math.cos(A); return [rx * Math.sin(A), _AN_SK.y - ry * cl * Math.cos(B), _AN_SK.z - rz * cl * Math.sin(B)]; }
  return [rx * Math.sin(B) * Math.sin(A), _AN_SK.y - ry * Math.cos(B), _AN_SK.z + rz * Math.sin(B) * Math.cos(A)];
}
// 3D -> 2D: nod (pitch about the neck pivot), then heading. Returns [x', y', depth].
function _anProj(p, psi, nu) {
  let [x, y, z] = p; const py = .32, cn = Math.cos(nu), sn = Math.sin(nu), yy = y - py;
  const y1 = py + yy * cn + z * sn, z1 = -yy * sn + z * cn;
  return [x * Math.cos(psi) + z1 * Math.sin(psi), y1, -x * Math.sin(psi) + z1 * Math.cos(psi)];
}
const _AN_HAIRLINE = (th, f = 1.02, tmp = 1.38, sd = 1.78, bk = 2.18) => { const a = Math.abs(((th + Math.PI) % TAU + TAU) % TAU - Math.PI); return a < 1 ? lerp(f, tmp, ease(a)) : a < 1.6 ? lerp(tmp, sd, ease((a - 1) / .6)) : lerp(sd, bk, ease((a - 1.6) / (Math.PI - 1.6))); };
const _AN_HSPEC = new WeakMap();
// The clump list of a hairstyle (cached per design). Three layers: 'back' hangs behind the head and body, 'side' locks
// frame the face (drawn under the cap), 'cap' covers the skull, 'bang' falls over the forehead (drawn last).
// root: width at the root (0..1, pointed roots hide under their neighbours), bump: extra lift near the root (volume).
function _anHairSpecs(D) {
  if (_AN_HSPEC.has(D)) return _AN_HSPEC.get(D);
  const h = D.hair, S = [], r = i => hash(i * 12.9898 + D.seed * 78.233), vol = h.volume, part = h.part * .95, st = h.style;
  const add = o => S.push({ mode: 'az', lift: .035 * vol, hang: 0, wave: 0, wl: .7, flare: 0, curl: 0, tip: 'point', taper: .45, w: .14, ph: 0, root: .35, bump: 0, ...o, id: S.length });
  // ---- the cap: clumps radiating from the part / crown down to the hairline (all but swept-back and ponytail)
  if (st !== 'swept' && st !== 'ponytail' && st !== 'bun') {
    const n = 18, tous = st === 'tousled';
    for (let i = 0; i < n; i++) {
      const th = -Math.PI + i / n * TAU + .001, at = Math.abs(th), hl = tous ? _AN_HAIRLINE(th, 1.02, 1.3, 1.56, 2.18) : _AN_HAIRLINE(th);
      if (at < .55 && h.bangs !== 'none') continue;   // the bangs cover the front
      const backC = at > 1.75, th1 = th + (r(i) - .5) * .12;
      const longBack = (st === 'long' || st === 'straight') && at > 2.3;
      let a1 = hl + (tous ? .26 + r(i + 3) * .26 : .24 + r(i + 3) * .12);
      if (tous && at > .9 && at < 2.35) a1 = Math.min(a1, 1.6 + .1 * r(i + 4));   // short at the sides: the ears show
      if (at > .55 && at < 1.15) a1 = Math.min(a1, hl + .12);   // temple clumps end above the brow: the far eye stays clear in 3/4
      if ((st === 'long' || st === 'straight') && at > 1.3 && at < 1.95) a1 = Math.min(a1, 1.66);   // tucked over the ear
      add({ kind: 'cap', th0: backC ? th1 * (at > 2.6 ? 1 : .94) : part + (th - part) * .12, th1, a0: -.04, a1: longBack ? 2.0 : a1,
            ...(longBack ? { hang: h.len * (.9 + .2 * r(i + 9)), wave: .05 * h.wave * (st === 'straight' ? .2 : 1), wl: .68, ph: th * .9, flare: .04, tip: 'fork' } : {}),
            w: (backC ? .26 : .22) + .04 * r(i + 5), lift: (tous ? .06 : .042) * vol, curl: tous ? (r(i + 7) - .5) * .9 + (at > .9 && at < 2.35 ? Math.sign(th) * .3 : 0) : 0,
            taper: tous ? .55 : .42, root: .5, bump: tous ? .035 : 0, tip: tous && r(i + 8) > .55 ? 'fork' : longBack ? 'fork' : 'point' });
    }
  }
  // ---- styles
  if (st === 'long' || st === 'straight') {
    const L = h.len, wv = h.wave * (st === 'straight' ? .2 : 1);
    for (let i = 0; i < 13; i++) {   // the long back mass, from behind the ears round the back (the profile keeps its cheek)
      const th = 1.72 + i / 12 * (TAU - 3.44), thw = ((th + Math.PI) % TAU) - Math.PI;
      add({ kind: 'back', th0: thw, th1: thw, a0: 1.15, a1: 2.0, hang: L * (.82 + .3 * r(i + 20)), w: .25, lift: .035 * vol, wave: .05 * wv, wl: .66 + .08 * r(i + 21), ph: thw * .9 + r(i + 22) * .8, flare: .05 + .05 * r(i + 23), taper: .3, tip: r(i + 24) > .6 ? 'fork' : 'point', root: 1 });
    }
    for (const sd of [-1, 1]) {      // side locks framing the face, just in front of the ears, one long lock over each shoulder
      add({ kind: 'side', th0: sd * 1.28, th1: sd * 1.36, a0: .95, a1: 1.62, hang: .5 + .2 * r(sd + 30), w: .095, pw: .62, lift: .05 * vol, wave: .03 * wv, wl: .5, ph: sd, curl: .06, taper: .5, root: .5 });
      // the long lock that falls over the shoulder grows from just behind the ear, so the profile keeps its cheek
      add({ kind: 'side', th0: sd * 1.5, th1: sd * 1.66, a0: 1.0, a1: 1.72, hang: Math.min(L * .55, 1.25), w: .15, lift: .055 * vol, wave: .05 * wv, wl: .55, ph: sd * 2, flare: .05, curl: .1, taper: .35, fwd: .1, tip: 'fork', root: .5 });
    }
  } else if (st === 'ponytail' || st === 'bun') {
    const L = h.len, wv = h.wave, bun = st === 'bun';
    for (let i = 0; i < 14; i++) {   // the cap pulled back from the hairline to the tie at the back of the head
      const th = -Math.PI + (i + .5) / 14 * TAU, at = Math.abs(th); if (at > 2.75) continue;
      if (at < .55 && h.bangs !== 'none') continue;
      const hl = _AN_HAIRLINE(th) - .04, sg = Math.sign(th) || 1;
      add({ kind: 'cap', th0: th, th1: sg * (Math.PI - .25 * (1 - at / Math.PI)), a0: hl, a1: 1.28, w: .26, lift: .04 * vol, taper: .6, root: 1, curl: 0, zAt: .3 });
    }
    for (let i = 0; i < 5; i++) { const th = (i / 4 - .5) * 1.5; add({ kind: 'cap', mode: 'lon', th0: th, th1: th * .25, a0: -.85, a1: 1.2, w: .28, lift: .052 * vol, flat: true, taper: .5, root: 1, zAt: .35 }); }
    for (let i = 0; i < 7; i++) {   // the nape, combed UP to the tie
      const th = Math.PI + (i / 6 - .5) * 2.1;
      add({ kind: 'cap', th0: th, th1: Math.PI + (th - Math.PI) * .2, a0: 2.3, a1: 1.34, w: .24, lift: .03 * vol, taper: .6, root: 1, zAt: .3, curl: 0 });
    }
    if (!bun) for (let i = 0; i < 9; i++) {   // the tail: hangs from the tie at the back of the head
      const k = i / 8, th = Math.PI + (k - .5) * .9;
      add({ kind: 'back', th0: th, th1: th, a0: 1.2, a1: 1.3, hang: L * (.75 + .3 * Math.sin(k * Math.PI)), w: .17, lift: .06 * vol, wave: .05 * wv, wl: .7, ph: k * 2, flare: .12 + .1 * Math.abs(k - .5), curl: (k - .5) * .2, taper: .4, tip: i % 3 ? 'point' : 'fork', tail: true, root: 1 });
    }
    for (const sd of [-1, 1]) add({ kind: 'side', th0: sd * 1.1, th1: sd * 1.22, a0: .9, a1: 1.65, hang: bun ? .3 : .45, w: bun ? .065 : .09, lift: .05 * vol, wave: .03, wl: .45, curl: .08, taper: .5, root: .45 });
  } else if (st === 'bob') {
    const L = h.len;
    for (let i = 0; i < 13; i++) {
      const th = -Math.PI + (i + .5) / 13 * TAU; if (Math.abs(th) < 1.05) continue;
      const fr = 1 - (Math.abs(th) - 1.05) / (Math.PI - 1.05);   // 1 at the face, 0 at the back: a-line, longer in front
      add({ kind: 'back', th0: th, th1: th, a0: 1.15, a1: 1.92, hang: L * (.55 + .55 * fr) + .08 * (r(i + 50) - .5), w: .24, lift: .06 * vol, flare: .02, curl: -.12, taper: .32, root: 1, tip: i % 3 === 1 ? 'fork' : 'point' });   // a broken hem, never a ruled line
    }
    for (const sd of [-1, 1]) add({ kind: 'side', th0: sd * 1.05, th1: sd * 1.2, a0: .7, a1: 1.6, hang: L * 1.25, w: .15, lift: .06 * vol, curl: .1, taper: .4, fwd: .02, root: .5, tip: 'fork' });
  } else if (st === 'tousled') {
    for (let i = 0; i < 9; i++) {   // nape: short points
      const th = 2.2 + i / 8 * (TAU - 4.4), thw = ((th + Math.PI) % TAU) - Math.PI;
      add({ kind: 'back', th0: thw, th1: thw + (r(i + 40) - .5) * .3, a0: 1.35, a1: 2.3, hang: .04 + .08 * r(i + 41), w: .2, lift: .045 * vol, flare: .06, curl: (r(i + 42) - .5) * .5, taper: .55, root: 1, tip: i % 2 ? 'fork' : 'point' });
    }
    for (const sd of [-1, 1]) add({ kind: 'side', th0: sd * 1.05, th1: sd * 1.22, a0: .7, a1: 1.62, w: .12, lift: .05 * vol, curl: -sd * .12, taper: .55, root: .5 });   // sideburn lock, the ear free
  } else if (st === 'swept') {
    // swept back with volume (the cool older man): an M hairline with receding temples (drawn by the dome, _anHairBase),
    // the front lifting off the forehead in a soft pompadour, clumps flowing back over the crown and away from the
    // part, the sides brushed back tight above the ears and down behind them to the nape, and a loose forelock
    // (_anStrandSpecs). No sideburn: a beard starts at the ear lobe.
    const n = 9, away = -Math.sign(part || 1);
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), lam = (k - .5) * 1.9 + (r(i + 80) - .5) * .08;
      add({ kind: 'cap', mode: 'lon', th0: lam, th1: lam * 1.05 + away * (.22 + .22 * (1 - Math.abs(k - .5) * 2)) + (r(i + 81) - .5) * .06, a0: -1.02, a1: 1.75 + .15 * r(i + 82), w: .25 + .05 * r(i + 83), lift: .056 * vol, flat: true,
            bump: (.085 - .06 * Math.pow(Math.abs(k - .5) * 2, 2)) * vol, bumpW: .45, curl: (k - .5) * .15, taper: .32, root: 1, zAt: .35, tip: r(i + 84) > .5 ? 'fork' : 'point' });
    }
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) {   // the sides, brushed back tight above the ears
      const th = sd * (1.2 + k * .42);
      add({ kind: 'cap', th0: th - sd * .2, th1: th + sd * .5, a0: 1.0 + .05 * k, a1: k < 2 ? 1.6 + .02 * k : 2.05 + .1 * (k - 2), w: .12, lift: .008 * vol, curl: -sd * .06, taper: .5, root: .55 });
    }
    for (let i = 0; i < 6; i++) {   // the back: down to a short tapered nape
      const th = Math.PI + (i / 5 - .5) * 1.9, thw = ((th + Math.PI) % TAU) - Math.PI;
      add({ kind: 'cap', th0: thw * .6 + Math.sign(thw) * .5, th1: thw, a0: .9, a1: 2.25, w: i === 0 || i === 5 ? .13 : .18, lift: .014 * vol, taper: .5, root: .6, curl: (r(i + 90) - .5) * .2 });
    }
  }
  // ---- bangs
  const b = h.bangs, pt = part;
  if (b === 'swept') {
    const n = 8, dir = -Math.sign(part || 1);
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), th1 = pt + dir * (.05 + k * 1.3);
      add({ kind: 'bang', th0: pt + dir * k * .3, th1, a0: .3 + .05 * k, a1: 1.5 + .22 * Math.sin(Math.min(1, k * 1.15) * Math.PI * .85) + .05 * r(i + 60), w: .115 - .02 * k + .02 * r(i + 61), lift: .05 * vol, curl: dir * (.18 + .14 * k), taper: .55, tip: i === 2 || i === 5 ? 'fork' : 'point', root: .55 });
    }
    add({ kind: 'bang', th0: pt - dir * .04, th1: pt - dir * .48, a0: .34, a1: 1.34, w: .115, lift: .05 * vol, curl: -dir * .12, taper: .55, root: .55 });
    add({ kind: 'bang', th0: pt - dir * .08, th1: pt - dir * .8, a0: .38, a1: 1.22, w: .095, lift: .048 * vol, curl: -dir * .1, taper: .6, root: .55 });
  } else if (b === 'side') {
    const dir = -Math.sign(part || 1);
    add({ kind: 'bang', th0: pt, th1: pt + dir * 1.0, a0: .3, a1: 1.8, w: .2, lift: .055 * vol, curl: dir * .45, taper: .5, tip: 'fork', root: .55 });
    add({ kind: 'bang', th0: pt + dir * .1, th1: pt + dir * 1.25, a0: .35, a1: 1.7, w: .16, lift: .05 * vol, curl: dir * .4, taper: .5, root: .55 });
    add({ kind: 'bang', th0: pt - dir * .05, th1: pt - dir * .6, a0: .3, a1: 1.42, w: .15, lift: .05 * vol, curl: -dir * .2, taper: .5, root: .55 });
    add({ kind: 'bang', th0: pt - dir * .1, th1: pt - dir * .95, a0: .4, a1: 1.5, w: .13, lift: .05 * vol, curl: -dir * .15, taper: .5, root: .55 });
  } else if (b === 'full' || b === 'parted') {
    const n = 8, tous = st === 'tousled';
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), th1 = (k - .5) * 1.8 + (r(i + 70) - .5) * .12, len = (tous ? 1.5 : 1.6) + (tous ? .28 : .2) * r(i + 71) - (b === 'parted' ? .22 * (1 - Math.abs(k - .5) * 2) : 0);
      add({ kind: 'bang', th0: pt * .5 + (k - .5) * .55, th1, a0: .3, a1: len, w: .14 + .03 * r(i + 74), lift: .055 * vol, curl: (k - .5) * .45 + (r(i + 72) - .5) * (tous ? .5 : .3), taper: tous ? .65 : .6, tip: r(i + 73) > .6 ? 'fork' : 'point', root: .55 });
    }
  }
  _AN_HSPEC.set(D, S);
  return S;
}
// Loose strands: flyaways off the silhouette and the ahoge (the antenna strand at the crown). Cached per design.
const _AN_STRANDS = new WeakMap();
function _anStrandSpecs(D) {
  if (_AN_STRANDS.has(D)) return _AN_STRANDS.get(D);
  const h = D.hair, r = i => hash(i * 7.77 + D.seed * 31.3), out = [];
  for (let i = 0; i < h.flyaways; i++) out.push({ th: (r(i) - .5) * 4.4, a: .35 + .7 * r(i + 10), len: .08 + .06 * r(i + 20), bend: (r(i + 30) - .5) * .8, w: .008, ph: r(i + 40) * 6 });
  if (h.ahoge) out.push({ th: h.part * .5, a: .12, len: .17, bend: .9, w: .03, ph: 1.3, ahoge: true });
  if (h.style === 'swept') for (let i = 0; i < 2; i++) out.push({ th: h.part * .4 + .08 + i * .07, a: .84 + .04 * i, len: .19 - .04 * i, bend: (.35 + .2 * r(i + 51)) * -Math.sign(h.part || 1), w: .014 - .004 * i, ph: r(i + 52) * 6, fall: true });   // a loose lock on the forehead
  _AN_STRANDS.set(D, out);
  return out;
}
// One clump's 2D geometry for this frame: centreline, half-widths, light and depth along it.
function _anClump(sp, ctx) {
  const { psi, psiH, nu, t, wind, Lv, tilt } = ctx, Ns = 9, Nh = sp.hang > 0 ? Math.max(3, Math.ceil(sp.hang / .055)) : 0;
  const pts = [], az = [], lit = [], sArr = [], As = [], Bs = [];
  const total = 1 + (Nh ? sp.hang / .9 : 0);
  // a cap clump seen edge-on on the crown rim lies flat (no lift above the skull, no pointed root): no shark fins
  let L0 = sp.lift, R0 = sp.root ?? 1;
  if (sp.kind === 'cap' && sp.mode !== 'lon') { const eo = 1 - clamp(Math.abs(Math.cos(lerp(sp.th0, sp.th1, .6) + psi)) / .3); if (eo > 0) { L0 = lerp(sp.lift, Math.min(sp.lift, .03), eo); R0 = lerp(R0, 1, eo); } }
  for (let i = 0; i <= Ns; i++) {
    const k = i / Ns, A = lerp(sp.th0, sp.th1, k) + sp.curl * k * k * (sp.hang ? .3 : 1), B = lerp(sp.a0, sp.a1, k);
    const lift = (sp.flat ? L0 * (1 - .15 * k * k) : sp.kind === 'bang' ? L0 * (.62 + .38 * Math.min(1, k * 2)) + .004 : L0 * (1 - .35 * k * k) * (sp.kind === 'cap' ? .82 + .18 * Math.min(1, k * 4) : 1))
      + (sp.bump ? sp.bump * Math.sin(Math.PI * clamp(k / (sp.bumpW || .5))) : 0);
    const p = _anSkullPt(sp.mode, A, B, lift);
    if (sp.kind === 'bang' && k > .5) p[2] += .012 * (k - .5);
    pts.push(p); az.push(sp.mode === 'lon' ? Math.atan2(p[0], p[2] - _AN_SK.z) : A); sArr.push(k / total); As.push(A); Bs.push(B);
  }
  if (Nh) {
    const p1 = pts[Ns], a1 = az[Ns], out = [Math.sin(a1), 0, Math.cos(a1)], lat = [Math.cos(a1), 0, -Math.sin(a1)];
    for (let i = 1; i <= Nh; i++) {
      const d = i / Nh * sp.hang, k = d / sp.hang, fl = sp.flare * Math.pow(d, 1.25) * (1 - .3 * k) - sp.curl * .6 * k * k * Math.min(1, sp.hang) - .05 * Math.min(1, d * 2.5) * (sp.kind === 'back' ? 1 : 0);
      const wv = sp.wave * Math.sin(TAU * d / sp.wl + sp.ph) * Math.min(1, d * 3);
      const fwd = (sp.fwd || 0) * Math.min(1, d * 2);
      const p = [p1[0] + out[0] * (fl + wv) + lat[0] * wv * .3, p1[1] + d * .97, p1[2] + out[2] * (fl + wv) + lat[2] * wv * .3 + fwd];
      pts.push(p); az.push(a1); sArr.push((1 + d / .9) / total);
    }
  }
  // project, with follow-through (tips use the lagging heading), sway, wind and gravity kept to the screen when tilted.
  // Clumps attached to the skull only lag a little (a bang never swings across the face): the rest of the lag BENDS
  // their free ends sideways instead of re-projecting them.
  const C = [], depth = [], nz = []; let n = pts.length;
  const lagCap = sp.kind === 'bang' ? .25 : sp.kind === 'side' ? .55 : sp.kind === 'cap' ? .3 : 1, bend = (psiH - psi) * (1 - lagCap * .5);
  for (let i = 0; i < n; i++) {
    const s = sArr[i], hangK = i > Ns ? (i - Ns) / Nh : 0, ft = Math.pow(s, 1.6);
    const ps = lerp(psi, psiH, lagCap * (i > Ns ? Math.min(1, .3 + hangK) : ft * .3));
    const q = _anProj(pts[i], ps, nu);
    const dh = i > Ns ? (i - Ns) / Nh * sp.hang : (sp.kind === 'bang' ? s * .15 : 0);
    const sway = (.012 * Math.sin(TAU * (.31 * t + sp.id * .137)) + .006 * Math.sin(TAU * (.73 * t + sp.id * .41))) * Math.pow(dh, 1.25);
    let x = q[0] + sway + wind[0] * .1 * Math.pow(dh, 1.2) * (.8 + .4 * hash(sp.id)) + bend * .1 * Math.pow(dh + (sp.kind === 'bang' ? s * .25 : 0), 1.3), y = q[1] + wind[1] * .05 * dh;
    if (ctx.lift && i > Ns) { const lk = ctx.lift * Math.pow(dh, 1.1) * (.8 + .4 * hash(sp.id * 2.3)); y -= .2 * lk; x += .07 * lk * Math.sign(q[0] || 1); }
    if (i > Ns && tilt) { const p0 = C[Ns], g = -tilt * Math.min(1, hangK * 2.5), cg = Math.cos(g), sg = Math.sin(g), dx = x - p0[0], dy = y - p0[1]; x = p0[0] + dx * cg - dy * sg; y = p0[1] + dx * sg + dy * cg; }
    C.push([x, y]); depth.push(q[2]);
    // lighting: the outward normal (skull) or horizontal (hanging), in view space
    const nrm = i <= Ns ? [pts[i][0] / _AN_SK.rx, (pts[i][1] - _AN_SK.y) / _AN_SK.ry, (pts[i][2] - _AN_SK.z) / _AN_SK.rz] : [Math.sin(az[i]), .15, Math.cos(az[i])];
    const nv = _anProj([nrm[0], nrm[1] + .32, nrm[2]], ps, nu); const nl = Math.hypot(nv[0], nv[1] - .32, nv[2]) || 1;
    lit.push((nv[0] * Lv[0] + (nv[1] - .32) * Lv[1] + nv[2] * Lv[2]) / nl); nz.push(nv[2] / nl);
  }
  // layer membership uses the heading rounded to 1/16 turn, so a clump changes layer only at fixed headings (never
  // in a flicker), and animeTurn's stepped drawings hide the change
  const iz = Math.floor(Ns * (sp.zAt ?? .6)), zq = _anProj(pts[iz], Math.round(psi / (Math.PI / 8)) * (Math.PI / 8), nu)[2];
  // a clump drawn in front that runs over the top of the skull (swept-back hair) ends where it turns away from us,
  // exactly on the silhouette, instead of folding back over the face
  let cutN = n;
  if (!Nh && sp.mode === 'lon' && zq >= -.16) {
    let f0 = -1; for (let i = 0; i <= Ns; i++) { if (f0 < 0 && nz[i] > .03) f0 = i; else if (f0 >= 0 && nz[i] < 0) { cutN = i; break; } }
    if (cutN < n && cutN > 1) {
      const u = nz[cutN - 1] / ((nz[cutN - 1] - nz[cutN]) || 1), P = C[cutN - 1], Q = C[cutN];
      C[cutN] = [lerp(P[0], Q[0], u), lerp(P[1], Q[1], u)]; depth[cutN] = lerp(depth[cutN - 1], depth[cutN], u); lit[cutN] = lerp(lit[cutN - 1], lit[cutN], u);
      cutN++;
    } else cutN = n;
  }
  const W = sp.w * (1 + (sp.kind === 'back' ? .15 : 0)) * (sp.pw ? lerp(1, sp.pw, clamp((Math.abs(Math.sin(psi)) - .7) / .3)) : 1), hw = [];
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1), fs = lerp(.5, 1, Math.abs(Math.cos(az[i] + lerp(psi, psiH, s * .5)))) * (sp.kind === 'bang' ? 1.1 : 1);
    const root = lerp(R0, 1, ease(Math.min(1, s / (sp.kind === 'bang' ? .25 : .3))));
    const tip = s > 1 - sp.taper ? Math.pow((1 - s) / sp.taper, .8) : 1;
    hw.push(W / 2 * fs * root * tip * (1 + .18 * Math.sin(Math.PI * Math.min(1, s * 1.2))));
  }
  const zm = depth[iz], zlow = depth[n - 1];
  if (cutN < n) { C.length = cutN; hw.length = cutN; depth.length = cutN; lit.length = cutN; n = cutN; }
  if (sp.mode === 'lon') {   // a clump seen end-on (swept hair from the front) narrows into a flow strip, not a block
    let l2 = 0, l3 = 0; for (let i = 1; i < Math.min(n, Ns + 1); i++) { l2 += Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]); l3 += _an3.len(_an3.sub(pts[i], pts[i - 1])); }
    const f = lerp(.3, 1, clamp((l2 / (l3 || 1) - .3) * 1.8));
    for (let i = 0; i < n; i++) hw[i] *= f;
    var endOn = f;
  }
  // where the clump crosses the angel-ring latitude (a band round the skull that dips toward the silhouette and rides a
  // little higher on the side away from the light): its own highlight lens is drawn there (_anRingLens)
  let ringI = null;
  if ((sp.kind === 'cap' || sp.kind === 'bang') && sp.mode !== 'lon') {
    const sL = Lv[0] < 0 ? 1 : -1, arAt = A => .86 + .5 * (1 - Math.max(0, Math.cos(A + psi))) + .1 * (1 - Math.cos(A)) / 2 - .06 * clamp(Math.sin(A + psi) * sL) + (hash(sp.id * 4.7) - .5) * .022;
    let dP = null;
    for (let i = 0; i <= Ns; i++) { const d = Bs[i] - arAt(As[i]); if (dP != null && dP < 0 && d >= 0) { ringI = i - 1 + dP / (dP - d); break; } dP = d; }
  }
  return { sp, C, hw, depth, lit, zm, zq, zlow, Ns: Math.min(Ns, n - 1), n, endOn: endOn ?? 1, cut: cutN < pts.length, ringI };
}
// A point at arc length s (+ toward the tip) from fractional index fi along a centreline, pushed off it by `off` along
// the normal. Uses the clump's cached cumulative lengths.
function _anAlongN(K, fi, s, off) {
  const C = K.C, n = C.length;
  if (!K.cum) { K.cum = [0]; for (let i = 1; i < n; i++) K.cum.push(K.cum[i - 1] + Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1])); }
  const cum = K.cum, i0 = Math.max(0, Math.min(n - 2, Math.floor(fi))), S = clamp(lerp(cum[i0], cum[i0 + 1], fi - i0) + s, 0, cum[n - 1]);
  let j = i0; while (j < n - 2 && cum[j + 1] < S) j++; while (j > 0 && cum[j] > S) j--;
  const a = C[j], b = C[j + 1], L = (cum[j + 1] - cum[j]) || 1e-6, f = (S - cum[j]) / L, tx = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L;
  return [lerp(a[0], b[0], f) - ty * off, lerp(a[1], b[1], f) + tx * off];
}
// The angel ring, one piece per clump: a lens about .74 of the clump's width where the clump crosses the ring
// latitude, with two or three spikes running DOWN the hair flow and at most one short one up, tapered at both ends.
// Neighbouring clumps' pieces stagger and leave gaps, so the light breaks clump by clump round the curved skull.
function _anRingLens(D, k) {
  const fi = k.ringI, n = k.C.length, i0 = Math.floor(fi); if (fi == null || i0 < 0 || i0 >= n - 1) return;
  const f = fi - i0, lt = lerp(k.lit[i0], k.lit[i0 + 1], f), dp = lerp(k.depth[i0], k.depth[i0 + 1], f), al = clamp((lt + .05) * 2.2) * clamp(dp * 8);
  if (al < .03) return;
  const c = _AN.c, hw = lerp(k.hw[i0], k.hw[i0 + 1], f) * .94, h = j => hash(k.sp.id * 9.7 + j * 3.3 + D.seed * .37);
  const nd = 4 + (h(1) > .5 ? 1 : 0), downs = [];
  for (let j = 0; j < nd; j++) downs.push([lerp(-.78, .78, (j + .5) / nd) + (h(j + 2) - .5) * .12, .022 + .045 * h(j + 5) + (j === 2 ? .03 : 0), .085 + .05 * h(j + 8)]);
  const upv = (h(12) - .5) * 1.1, upL = h(13) > .75 ? .016 : 0, s0 = (h(14) - .5) * .012;
  const N = 40, top = [], bot = [], cT = [], cB = [];
  for (let j = 0; j <= N; j++) {
    const v = lerp(-1, 1, j / N), lens = Math.pow(Math.max(0, 1 - v * v), .35);
    let sd = .02 * lens, su = .018 * lens;
    for (const [vc, L, wv] of downs) sd += L * Math.max(0, 1 - Math.abs(v - vc) / wv) * lens;
    su += upL * Math.max(0, 1 - Math.abs(v - upv) / .12) * lens;
    top.push(_anAlongN(k, fi, s0 - su, v * hw)); bot.push(_anAlongN(k, fi, s0 + sd, v * hw));
    const vv = v * .55, l2 = Math.pow(Math.max(0, 1 - v * v), .5); cT.push(_anAlongN(k, fi, s0 - .012 * l2, vv * hw)); cB.push(_anAlongN(k, fi, s0 + .004 * l2, vv * hw));
  }
  c.fillStyle = _anA(D.hairHi, .85 * al); c.fill(celPoly(top.concat(bot.reverse())));
  c.fillStyle = _anA(_anMix(D.hairHi, '#FFFFFF', .55), .55 * al); c.fill(celPoly(cT.concat(cB.reverse())));
}
// Ribbon outline from a centreline and half-widths (fork tips split in two).
function _anRibbon(K) {
  // smooth the centreline and its widths (Catmull-Rom), so clump edges are clean curves, not polylines
  const sm = (arr, f) => { const out = []; for (let i = 0; i < arr.length - 1; i++) for (let k = 0; k < 3; k++) out.push(f(i, k / 3)); out.push(arr[arr.length - 1]); return out; };
  const P0 = K.C, cr = (i, u, d) => { const p0 = P0[Math.max(0, i - 1)][d], p1 = P0[i][d], p2 = P0[i + 1][d], p3 = P0[Math.min(P0.length - 1, i + 2)][d], u2 = u * u, u3 = u2 * u; return .5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (3 * p1 - p0 - 3 * p2 + p3) * u3); };
  if (P0.length > 2) { K.C = sm(P0, (i, u) => [cr(i, u, 0), cr(i, u, 1)]); const hw = K.hw; K.hw = sm(hw, (i, u) => lerp(hw[i], hw[i + 1], u)); const lt = K.lit; K.lit = sm(lt, (i, u) => lerp(lt[i], lt[i + 1], u)); const dp = K.depth; K.depth = sm(dp, (i, u) => lerp(dp[i], dp[i + 1], u)); K.Ns *= 3; K.n = K.C.length; if (K.ringI != null) K.ringI *= 3; }
  const C = K.C, n = C.length, A = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    A.push([C[i][0] - dy / d * K.hw[i], C[i][1] + dx / d * K.hw[i]]); B.push([C[i][0] + dy / d * K.hw[i], C[i][1] - dx / d * K.hw[i]]);
  }
  let tip = [C[n - 1]];
  if (K.sp.tip === 'fork' && n > 4) {
    const i = Math.max(1, n - 3), m = C[i], q = C[n - 1], e = [q[0] - m[0], q[1] - m[1]], el = Math.hypot(...e) || 1, nx = -e[1] / el, ny = e[0] / el, w = K.hw[Math.max(0, n - 5)] * .8;
    tip = [[q[0] + nx * w * .7, q[1] + ny * w * .7], [lerp(m[0], q[0], .45), lerp(m[1], q[1], .45)], [q[0] - nx * w * .5 - e[0] * .25, q[1] - ny * w * .5 - e[1] * .25]];
  }
  return { A, B, tip, poly: A.concat(tip, B.slice().reverse()) };
}
function _anHair(D, P, G, yaw, F, L2) {
  const psi = G.psi, psiH = psi + clamp(_anW4((P.hairYaw ?? yaw) - yaw), -.3, .3) * Math.PI / 2;   // the hair's lagging heading (at most .3 quarter turn behind)
  const nu = clamp((P.nod || 0) + (P.turnNod || 0) + F.headNod, -1, 1) * .2, tilt = (P.tilt || 0) + F.headTilt;
  const Lv = [L2[0] * .62, L2[1] * .62, .5];
  const ctx = { psi, psiH, nu, t: P.t || 0, wind: P.wind || [0, 0], Lv, tilt: tilt + (P.lean || 0), lift: clamp(P.hairLift || 0, -1, 1.5) };
  const K = _anHairSpecs(D).map(sp => _anClump(sp, ctx));
  for (const k of K) k.rib = _anRibbon(k);
  let bun = null;
  if (D.hair.style === 'bun') { const r = .16 * D.hair.volume, p = _anSkullPt('az', Math.PI, D.hair.bunAt, .04 * D.hair.volume + r * .7), q = _anProj(p, psi, nu); bun = { x: q[0], y: q[1], z: q[2], r }; }
  return { K, psi, nu, ctx, bun };
}
// The dark under-layer that fills gaps on the skull above the hairline (drawn before the cap clumps).
function _anHairBase(D, H) {
  const psi = H.psi, lift = (D.hair.style === 'swept' ? .05 : .04) * D.hair.volume, pts = [], N = 48, isSlick = D.hair.style === 'swept';
  const rx = _AN_SK.rx + (isSlick ? .022 * D.hair.volume : lift), rz = _AN_SK.rz + lift, ry = _AN_SK.ry + lift, cx = _AN_SK.z * Math.sin(psi), rxp = Math.hypot(rx * Math.cos(psi), rz * Math.sin(psi));
  let vis = [];
  for (let i = 0; i <= N; i++) {
    const th = -Math.PI + i / N * TAU, a = isSlick ? _anSweptLine(th) : D.hair.style === 'ponytail' || D.hair.style === 'bun' ? _AN_HAIRLINE(th, .98, 1.34, 1.74, 2.3) : D.hair.style === 'tousled' ? _AN_HAIRLINE(th, 1.02, 1.3, 1.56, 2.18) : _AN_HAIRLINE(th);
    const q = _anProj(_anSkullPt('az', th, a, isSlick ? lerp(lift, .02 * D.hair.volume, Math.pow(Math.sin(th), 2)) : lift), psi, H.nu); vis.push([q[0], q[1], q[2], th]);
  }
  // the visible run, front-most first: rotate the ring so it starts at the most hidden point
  let imin = 0; vis.forEach((v, i) => { if (v[2] < vis[imin][2]) imin = i; });
  const ring = vis.slice(imin).concat(vis.slice(1, imin + 1)), run = ring.filter(v => v[2] > -.02);
  if (run.length < 2) return null;
  const a0 = run[0], a1 = run[run.length - 1];
  let t0 = Math.atan2((a0[1] - _AN_SK.y) / ry, (a0[0] - cx) / rxp), t1 = Math.atan2((a1[1] - _AN_SK.y) / ry, (a1[0] - cx) / rxp);
  // go round over the top (-PI/2)
  const arc = [];
  let d = t0 - t1; while (d < 0) d += TAU;
  const up = (((-Math.PI / 2 - t1) % TAU) + TAU) % TAU < d;
  if (!up) d -= TAU;
  // swept-back hair: the silhouette swells where the clumps lift off the forehead (the same bump as the clumps)
  const bumpAt = a => {
    if (!isSlick) return 0;
    const ca = Math.cos(a), hx = ca * Math.cos(psi), hz = ca * Math.sin(psi), hy = Math.sin(a), lam = Math.asin(clamp(hx, -1, 1)), b = Math.atan2(-hz, -hy), k = (b + .9) / 2.7;
    return k < 0 || k > .45 ? 0 : Math.max(0, .085 - .065 * Math.pow(Math.abs(lam) / .95, 2)) * Math.sin(Math.PI * k / .45) * D.hair.volume;
  };
  // the arc runs exactly from one end of the visible hairline to the other (no notch where they meet)
  const k1 = Math.hypot((a1[0] - cx) / rxp, (a1[1] - _AN_SK.y) / ry), k0 = Math.hypot((a0[0] - cx) / rxp, (a0[1] - _AN_SK.y) / ry);
  for (let i = 1; i < 24; i++) { const a = t1 + d * i / 24, e = bumpAt(a), kk = lerp(k1, k0, i / 24); arc.push([cx + (rxp * kk + e) * Math.cos(a), _AN_SK.y + (ry * kk + e) * Math.sin(a)]); }
  return run.map(v => [v[0], v[1]]).concat(arc);
}
// The swept-back hairline: an M (a small widow's peak, receding temples), tight above the ears, down to the nape.
// (it runs round the top of the ear, then straight down behind it to the nape: no shaved band at the back of the head)
const _anSweptLine = th => {
  const a = Math.abs(((th + Math.PI) % TAU + TAU) % TAU - Math.PI);
  const base = a < 1 ? lerp(.95, 1.22, ease(a)) : a < 1.62 ? lerp(1.22, 1.62, ease((a - 1) / .62)) : a < 2 ? lerp(1.62, 2.22, ease((a - 1.62) / .38)) : 2.22 + .04 * (a - 2);
  return base - .26 * Math.exp(-Math.pow((a - .52) / .2, 2)) + .03 * Math.exp(-Math.pow(a / .1, 2));
};
function _anClumpDraw(D, k, L, o = {}) {
  const c = _AN.c, rib = k.rib, path = celPoly(rib.poly), sp = k.sp, n = k.n;
  // hair.grey: the temples and sides go silver first
  const gk = D.hair.grey > .01 ? D.hair.grey * (sp.kind === 'side' ? 1 : sp.kind === 'bang' ? .15 : sp.mode === 'lon' ? .25 : clamp(1.4 - Math.abs(Math.abs(((sp.th1 + Math.PI) % TAU + TAU) % TAU - Math.PI) - 1.5) * 1.1)) : 0;
  const dbg = window._AN_DBG && { back: '#3060FF', side: '#30C040', cap: '#F0A020', bang: '#E03030' }[sp.kind];
  const base = dbg || (gk > .01 ? _anMix(D.hairC, '#CED1DC', gk) : D.hairC), sh = dbg ? _anShade(dbg) : gk > .01 ? _anMix(D.hairSh, '#9DA1B4', gk) : D.hairSh, sh2 = D.hairSh2, hi = gk > .01 ? _anMix(D.hairHi, '#FFFFFF', gk) : D.hairHi, ln = D.hairLn;
  // fill: a gradient from the shaded root to the base colour (to a lighter tip on long hair)
  const C0 = k.C[0], C1 = k.C[n - 1], gr = c.createLinearGradient(C0[0], C0[1], C1[0], C1[1]);
  const eo = 1 - k.endOn, mass = _anMix(base, sh, .3), em = col => eo > 0 ? _anMix(col, mass, clamp(eo * 1.6)) : col;   // end-on clumps melt into the mass
  gr.addColorStop(0, em(sp.kind === 'bang' || sp.kind === 'side' ? sh : _anMix(base, sh, .35))); gr.addColorStop(sp.kind === 'bang' ? .3 : .2, em(base)); gr.addColorStop(1, sp.hang > .8 ? _anMix(base, hi, .18) : em(k.cut ? _anMix(base, sh, .2) : base));
  c.fillStyle = gr; c.fill(path);
  c.save(); c.clip(path);
  // cel shadow where the clump turns from the light: a hard terminator across the clump on the skull part; the part
  // that hangs free is shaded as one piece, fading with its light (so a turn never flips a whole lock in one frame)
  const tau = .1 + (hash(sp.id * 3.1 + D.seed) - .5) * .16 + (o.back ? .25 : 0), iHang = sp.hang > 0 ? Math.min(n - 1, k.Ns + 1) : n;
  let run = null; const runs = [];
  for (let i = 0; i < iHang; i++) { if (k.lit[i] < tau) { if (!run) runs.push(run = [i, i]); else run[1] = i; } else run = null; }
  c.fillStyle = sh;
  // the terminator ends in a point along the clump (the anime hair-shadow wedge), never a flat block
  const tipL = Math.max(2, Math.round(n * .08));
  for (const [i0, i1] of runs) {
    const A = [], B = [];
    for (let i = i0; i <= i1; i++) { const w = k.hw[i] * 1.6 + .02; A.push(_anOffN(k.C, i, w)); B.push(_anOffN(k.C, i, -w)); }
    const e = i1 < n - 1 ? [k.C[Math.min(n - 1, i1 + tipL)]] : [], s0 = i0 > 0 ? [k.C[Math.max(0, i0 - tipL)]] : [];
    c.fill(celPoly(A.concat(e, B.reverse(), s0)));
  }
  if (iHang < n - 1) {
    let lm = 0; for (let i = iHang; i < n; i++) lm += k.lit[i]; lm /= n - iHang;
    const a = clamp((tau + .12 - lm) / .24);
    if (a > .01) { c.fillStyle = _anA(sh, a); c.fill(celPoly(_anSub(k, Math.max(0, iHang - 1), n - 1, 1.7))); }
  }
  // the edge away from the light, and the deep shadow at the roots of bangs and side locks
  _anCrescent(path, L[0] * .03, L[1] * .03, sh);
  // swept-back hair: long sheen streaks along the clumps on the lit side (its angel ring)
  if (sp.mode === 'lon' || o.streak) {
    const N0 = k.cut ? n - 1 : k.Ns, i0 = Math.round(N0 * (k.cut ? .45 : .12)), i1 = Math.round(N0 * (k.cut ? .85 : .48 + .12 * hash(sp.id))), im = Math.round((i0 + i1) / 2), al = clamp((k.lit[im] + .05) * 2.5);
    if (al > .03 && i1 - i0 > 2) {
      const f = (hash(sp.id * 2.7) - .5) * .5, S = [], wk = lerp(.5, 1, k.endOn); for (let j = i0; j <= i1; j++) S.push(_anOffN(k.C, j, k.hw[j] * f));
      _anTaper(S, _anTp(.35, .45, 0, k.hw[im] * .5 * wk, 0), _anA(hi, .8 * al));
      _anTaper(S, _anTp(.4, .5, 0, k.hw[im] * .18 * wk, 0), _anA(_anMix(hi, '#FFFFFF', .6), .7 * al));
    }
  }
  if (sp.hang > .5) {   // highlights on the wave crests of long hair
    const per = (n - k.Ns) / (sp.hang / sp.wl), span = Math.max(3, Math.round(per * .35));
    for (let q = 1; q < sp.hang / sp.wl - .3; q++) {
      const i = Math.round(k.Ns + per * (q - .25 + .1 * hash(sp.id + q))); if (i + span >= n - 2) break;
      const al = clamp((k.lit[i] - .1) * 3) * (.45 + .55 * hash(sp.id * 7 + q)); if (al < .08 || hash(sp.id * 11 + q) < .35) continue;
      const f = (hash(sp.id * 3 + q) - .5) * .7, S = []; for (let j = i - span; j <= i + span; j++) S.push(_anOffN(k.C, j, k.hw[j] * f));
      _anTaper(S, _anTp(.45, .45, 0, k.hw[i] * .22, 0), _anA(hi, .55 * al));
    }
  }
  if (o.ring) _anRingLens(D, k);
  // strand lines inside
  const sw = _anLW(.8);
  for (const f of hash(sp.id * 1.3) > .5 ? [-.3] : [.25]) { if (n < 5) break; const S = []; const i1 = Math.max(2, Math.round(n * (.55 + .35 * hash(sp.id * 2.1)))); for (let i = 1; i < i1; i++) S.push(_anOffN(k.C, i, k.hw[i] * f)); _anTaper(S, _anTp(.3, .4, 0, sw, 0), _anA(ln, .35)); }
  c.restore();
  // outline: the two long edges and the tip, open at the root (a clump cut at the silhouette keeps only its edges,
  // and one seen end-on fades to a light flow line)
  const lw = _anLW(1) * lerp(.7, 1, k.endOn), lc = _anA(_anMix(ln, base, .4), lerp(.2, 1, k.endOn * k.endOn));
  if (k.cut) { _anTaper(rib.A, u => lw * Math.min(1, .15 + 6 * u), lc, false); if (k.endOn > .6) _anTaper(rib.B, u => lw * Math.min(1, .15 + 6 * u), lc, false); }
  else _anTaper(rib.A.concat(rib.tip, rib.B.slice().reverse()), u => lw * Math.min(1, .15 + 6 * Math.min(u, 1 - u)), lc, false);
}
const _anOffN = (C, i, w) => { const n = C.length, a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [C[i][0] - dy / d * w, C[i][1] + dx / d * w]; };
function _anSub(k, i0, i1, f = 1) { const A = [], B = []; for (let i = i0; i <= i1; i++) { A.push(_anOffN(k.C, i, k.hw[i] * f + .01)); B.push(_anOffN(k.C, i, -k.hw[i] * f - .01)); } return A.concat(B.reverse()); }
function _anLozenge(k, i, wf, lf) {
  const C = k.C, n = C.length, p = C[i], q = C[Math.min(n - 1, i + 1)], o = C[Math.max(0, i - 1)], seg = Math.hypot(q[0] - o[0], q[1] - o[1]) / 2 * lf;
  const dx = (q[0] - o[0]), dy = (q[1] - o[1]), d = Math.hypot(dx, dy) || 1, tx = dx / d, ty = dy / d, w = k.hw[i] * wf;
  const j = (hash(k.sp.id * 5.3 + i) - .5) * seg * .6;
  return [[p[0] - tx * seg, p[1] - ty * seg], [p[0] - ty * w + tx * j, p[1] + tx * w + ty * j], [p[0] + tx * seg * .8, p[1] + ty * seg * .8], [p[0] + ty * w * .8 - tx * j, p[1] - tx * w * .8 - ty * j]];
}
// passes: 'back' (behind the body and head), 'mid' (long hair lying over the back, facing us), 'front'. Decided on the
// quantised heading (zq), so membership is stable between the fixed headings.
function _anHairPass(k) {
  const z = k.zq;
  if (k.sp.kind === 'back') return z < .12 ? 'back' : 'mid';
  return z < -.16 ? 'back' : 'front';
}
const _AN_HRANK = { back: 0, side: 1, cap: 2, bang: 3 };
function _anHairLayer(D, H, pass, L, head, rim) {
  const c = _AN.c, swept = D.hair.style === 'swept' || D.hair.style === 'ponytail' || D.hair.style === 'bun';   // dome styles: one smooth mass with flow clumps
  const list = H.K.filter(k => _anHairPass(k) === pass).sort((a, b) => _AN_HRANK[a.sp.kind] - _AN_HRANK[b.sp.kind] || a.zm - b.zm);
  // the silhouette: every clump stroked wide first, then the fills on top, so only the union's outline shows
  // (the 'mid' layer, long hair lying over the back, gets a lighter union line: the heavy silhouette is the back layer's,
  // so the two never read as a doubled outline)
  const lwO = _anLW(pass === 'mid' ? 2.2 : 4.4), base = pass === 'front' || swept ? _anHairBase(D, H) : null, bpAll = base && celSpline(base, true), bp = pass === 'front' ? bpAll : null;
  c.strokeStyle = D.hairLn; c.lineWidth = lwO; c.lineJoin = 'round';
  // swept-back hair: the clumps over the top stay inside the hair mass (its smooth dome is the silhouette); seen
  // end-on (from the front) they fade into flow lines on the mass
  const vis = k => k.sp.mode === 'lon' ? ease(seg(k.endOn, .42, .8)) : 1;
  const clipL = (k, fn) => {
    if (bpAll && swept && (k.sp.mode === 'lon' || (k.sp.kind === 'cap' && !k.sp.free))) { const a = vis(k); if (a < .01) return; c.save(); c.clip(bpAll); c.globalAlpha *= a; fn(); c.restore(); }   // dome styles: the cap never bulges past the smooth mass
    else fn();
  };
  for (const k of list) clipL(k, () => c.stroke(celPoly(k.rib.poly)));
  if (bp && swept) {   // swept: the base is the hair mass, with its sheen band across the top
    c.stroke(bp); c.fillStyle = window._AN_DBG ? '#FF00FF' : _anMix(D.hairC, D.hairSh, .3); c.fill(bp);
    c.save(); c.clip(bp); const hiL = _anMix(D.hairHi, '#FFFFFF', .5);
    for (const [poly, core, a] of _anRingPolys(D, H, .32)) { c.fillStyle = _anA(D.hairHi, .7 * a); c.fill(celPoly(poly)); c.fillStyle = _anA(hiL, .5 * a); c.fill(celPoly(core)); }
    c.restore();
  }
  else if (bp) { c.stroke(bp); c.fillStyle = _anMix(D.hairSh, D.hairC, .25); c.fill(bp); c.save(); c.clip(bp); c.fillStyle = _anA(D.hairSh2, .6); c.fill(_anMove(bp, -L[0] * .04, .03)); c.restore(); }
  const ring = pass === 'front' && !swept;
  for (const k of list) clipL(k, () => _anClumpDraw(D, k, L, { back: pass === 'back', ring: ring && (k.sp.kind === 'cap' || k.sp.kind === 'bang') }));
  if (bp && D.hair.style === 'swept') { const lon = list.filter(k => k.sp.mode === 'lon'); _anSweptFlow(D, H, bp, lon.length ? 1 - lon.reduce((a, k) => a + vis(k), 0) / lon.length : 1); }
  else if (swept && bp) for (const k of list) {   // the flow lines of end-on swept clumps (ponytail)
    const a = 1 - vis(k); if (k.sp.mode !== 'lon' || a < .01 || k.n < 3) continue;
    c.save(); c.clip(bp);
    const S = k.C.map((p, i) => _anOffN(k.C, i, k.hw[i] * .9));
    _anTaper(S, _anTp(.1, .55, _anLW(.6), _anLW(1.3), 0), _anA(D.hairLn, .55 * a));
    c.restore();
  }
  if (H.bun && (H.bun.z < -.02) === (pass === 'back')) _anBun(D, H.bun, L);
  if (pass === 'front') _anStrands(D, H, L);
  // rim light (pose.rim): a crescent on the OUTER silhouette of the WHOLE hair mass, on the side away from the key
  // light: this layer's union minus every hair part (all layers) shifted toward the light, so stacked clumps never get
  // parallel stripes. One clip per part (an even-odd fill of a union would checkerboard). Wider at small sizes.
  if (rim && list.length) {
    const orient = q => { let a = 0; for (let i = 0; i < q.length; i++) { const u = q[i], v = q[(i + 1) % q.length]; a += u[0] * v[1] - v[0] * u[1]; } return celPoly(a < 0 ? q.slice().reverse() : q); };
    const parts = list.map(k => orient(k.rib.poly)); if (bp) parts.push(bp);
    if (!H.allParts) { H.allParts = H.K.map(k => orient(k.rib.poly)); const b0 = bpAll ? null : _anHairBase(D, H); if (bpAll || b0) H.allParts.push(bpAll || celSpline(b0, true)); }
    const U = new Path2D(); for (const p of parts) U.addPath(p);
    const off = Math.max(.018, 2.6 / _AN.sc), M = new DOMMatrix([1, 0, 0, 1, L[0] * off, L[1] * off]);
    // only against the background: never on hair edges lying over the face or the neck
    const ex = new Path2D(); ex.rect(-9, -9, 18, 18); ex.addPath(head.path); if (head.neckX) ex.rect(head.neckX[0], .25, head.neckX[1] - head.neckX[0], 2);
    c.save(); c.clip(U); c.clip(ex, 'evenodd');
    for (const p of H.allParts) { const q = new Path2D(); q.rect(-9, -9, 18, 18); q.addPath(p, M); c.clip(q, 'evenodd'); }
    c.fillStyle = _anA(rim, .85); c.fillRect(-9, -9, 18, 18); c.restore();
  }
}
// Swept-back hair seen from the front: a few long curved strokes from the hairline up over the pompadour and back,
// drifting away from the part, plus a sheen streak beside some (fade: how end-on the clumps are, 1 = front view).
function _anSweptFlow(D, H, bp, fade) {
  if (fade < .02) return;
  const c = _AN.c, away = -Math.sign(D.hair.part || 1), lift = .056 * D.hair.volume;
  c.save(); c.clip(bp);
  for (let i = 0; i < 7; i++) {
    const th0 = (i / 6 - .5) * 1.7 + (hash(i * 3.3 + D.seed) - .5) * .1, pts = [];
    for (let j = 0; j <= 12; j++) {
      const k = j / 12, th = th0 * (1 - .25 * k) + away * .5 * ease(k), a = lerp(_anSweptLine(th0) + .05, .3 + .12 * Math.abs(th0), k);
      const bump = .085 * D.hair.volume * Math.sin(Math.PI * clamp(k / .7)) * Math.max(0, 1 - .65 * Math.pow(Math.abs(th0) / .8, 2));
      const q = _anProj(_anSkullPt('az', th, a, lift + bump), H.psi, H.nu);
      if (q[2] > -.02) pts.push([q[0], q[1]]); else if (pts.length) break;
    }
    if (pts.length < 3) continue;
    _anTaper(pts, _anTp(.12, .5, _anLW(.5), _anLW(1.2), 0), _anA(D.hairLn, .5 * fade));
    if (i % 2) _anTaper(pts.slice(1, -2).map(([x, y]) => [x + .012, y + .004]), _anTp(.3, .5, 0, _anLW(2.2), 0), _anA(D.hairHi, .45 * fade));
  }
  c.restore();
}
// The bun (hair.style 'bun'): a coiled knot at the back of the head (hair.bunAt: .7 high .. 1.8 a low chignon).
function _anBun(D, b, L) {
  const c = _AN.c, r = b.r, p = _anEllP(b.x, b.y, r, r * .9);
  c.strokeStyle = D.hairLn; c.lineWidth = _anLW(4); c.stroke(p);
  c.fillStyle = D.hairC; c.fill(p);
  c.save(); c.clip(p); _anCrescent(p, L[0] * r * .35, L[1] * r * .35, D.hairSh);
  for (let i = 0; i < 4; i++) {   // the coils
    const a0 = i * 1.7 + .4, P = []; for (let j = 0; j <= 10; j++) { const a = a0 + j / 10 * 2.6, rr = r * (.95 - .55 * j / 10); P.push([b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr * .9]); }
    _anTaper(P, _anTp(.2, .5, 0, _anLW(1.1), 0), _anA(D.hairLn, .55));
  }
  _anTaper([[b.x - r * .6, b.y - r * .45], [b.x - r * .1, b.y - r * .72], [b.x + r * .4, b.y - r * .58]], _anTp(.3, .4, 0, r * .16, 0), _anA(D.hairHi, .75));
  c.restore();
}
// Flyaways and the ahoge, over the hair.
function _anStrands(D, H, L) {
  const list = _anStrandSpecs(D); if (!list.length) return;
  const t = H.ctx.t, wind = H.ctx.wind, lift = .045 * D.hair.volume, SK = _AN_SK;
  for (const st of list) {
    const p0 = _anSkullPt('az', st.th, st.a, lift), n = _an3.norm([p0[0] / SK.rx, (p0[1] - SK.y) / SK.ry, (p0[2] - SK.z) / SK.rz]);
    const tg = _an3.norm([SK.rx * Math.cos(st.a) * Math.sin(st.th), SK.ry * Math.sin(st.a), SK.rz * Math.cos(st.a) * Math.cos(st.th)]);
    const sw = (Math.sin(TAU * (.37 * t) + st.ph) * .25 + wind[0] * .6) * st.len, L0 = st.len;
    const P3 = st.fall ? [p0, _an3.add(p0, [st.bend * L0 * .18 + sw * .1, L0 * .5, L0 * .2]), _an3.add(p0, [st.bend * L0 * .45 + sw * .3, L0, L0 * .12])]
      : st.ahoge
      ? [p0, _an3.add(p0, [0, -L0 * .75, L0 * .1]), _an3.add(p0, [st.bend * L0 * .3 + sw * .5, -L0 * .95, L0 * .55])]
      : [p0, _an3.add(p0, _an3.add(_an3.mul(n, L0 * .55), _an3.mul(tg, L0 * .35))), _an3.add(p0, _an3.add(_an3.mul(n, L0 * .7), _an3.mul(tg, L0 * (.75 + st.bend * .3))))];
    const Q = P3.map(p => _anProj(p, H.psi, H.nu)); if (Q[0][2] < -.08) continue;
    const pts = Q.map(([x, y], i) => [x + (i ? sw * i * .5 : 0), y]);
    if (st.ahoge || st.fall) { const e = st.fall ? _anLW(1.6) : _anLW(2.6); _anTaper(pts, _anTp(.05, .9, st.w + e, st.w + e, _anLW(1.2)), D.hairLn); _anTaper(pts, _anTp(.05, .9, st.w, st.w, 0), D.hairC); }
    else _anTaper(pts, _anTp(.05, .85, _anLW(1.5), _anLW(1.3), 0), _anA(D.hairLn, .85));
  }
}
// The angel ring: a jagged band of highlight round the skull that dips at the silhouette (it follows the head's outline),
// brightest toward the light. Each clump paints its own piece (staggered a little), so it breaks up clump by clump.
function _anRingPolys(D, H, up0 = 0) {
  const N = 72, lift = .05 * D.hair.volume, Lv = H.ctx.Lv, runs = []; let run = null;
  for (let i = 0; i <= N; i++) {
    const th = -Math.PI + i / N * TAU, fc = Math.cos(th + H.psi), ar = .86 - up0 + .5 * (1 - Math.max(0, fc)) + .1 * (1 - Math.cos(th)) / 2;
    const h1 = hash(i * 1.7 + D.seed), h2 = hash(i * 3.1 + D.seed + 9), up = i % 2 ? .02 + .03 * h1 : .05 + .09 * h1, dn = i % 2 ? .03 + .03 * h2 : .08 + .15 * h2;
    const top = _anProj(_anSkullPt('az', th, ar - up, lift), H.psi, H.nu), bot = _anProj(_anSkullPt('az', th, ar + dn, lift), H.psi, H.nu);
    const nrm = _anProj([Math.sin(ar) * Math.sin(th), -Math.cos(ar) + .32, Math.sin(ar) * Math.cos(th)], H.psi, H.nu), l = nrm[0] * Lv[0] + (nrm[1] - .32) * Lv[1] + nrm[2] * Lv[2];
    if (top[2] > .02 && l > -.05) { if (!run) runs.push(run = []); run.push([top, bot, clamp((l + .05) * 2.2)]); } else run = null;
  }
  return runs.filter(R => R.length > 1).map(R => [
    R.map(r => [r[0][0], r[0][1]]).concat(R.slice().reverse().map(r => [r[1][0], r[1][1]])),
    R.map(r => [lerp(r[0][0], r[1][0], .4), lerp(r[0][1], r[1][1], .4)]).concat(R.slice().reverse().map(r => [lerp(r[0][0], r[1][0], .6), lerp(r[0][1], r[1][1], .6)])),
    R.reduce((s, r) => s + r[2], 0) / R.length]);
}
// Shadows the hair casts on the face: under the bangs and along the hairline.
function _anHairShadow(D, H, L, head) {
  const c = _AN.c, dx = -L[0] * .02, dy = .04;
  c.save(); c.clip(head.path); c.fillStyle = D.skinSh;
  const base = _anHairBase(D, H); if (base) c.fill(_anMove(celSpline(base, true), dx * .5, dy * .7));
  for (const k of H.K) if ((k.sp.kind === 'bang' || k.sp.kind === 'side') && _anHairPass(k, 'front') === 'front') c.fill(_anMove(celPoly(k.rib.poly), dx, dy));
  c.restore();
}

// ======================================================================================================== body
// Body space: head heights, origin at the base of the neck, y down, z toward the viewer in the front view, +x = the
// character's left. The torso is a stack of elliptical slices [y, half-width a, half-depth c, centre z]; garments are
// regions in SURFACE coordinates (th round the body from the front centre, y) projected for the heading, so a neckline,
// lapel or button lands in the right place in every view.
const _AN_BODY = new WeakMap();
function _anBody(D) {
  if (_AN_BODY.has(D)) return _AN_BODY.get(D);
  const m = D.m, S = D.shoulders, Wm = D.waist, Hm = D.hips, hn = (m ? .76 : .8) * D.neckL, ground = D.heads - .5 - hn;
  const T = m
    // the top slices flare smoothly out of the neck into the trapezius and shoulders (no step, no flat "box" top)
    ? [[-.2, .18, .16, -.02], [0, .2, .17, -.02], [.05, .27, .19, -.02], [.1, .42, .21, -.03], [.17, .66, .25, -.03], [.27, .92 * S, .29, -.03], [.5, .86 * S, .34, .03], [.85, .74 * S, .33, .04], [1.15, .63, .29, .01], [1.6, .55 * Wm, .27, 0], [2.05, .6 * Hm, .3, -.02], [2.5, .6 * Hm, .29, 0]]
    : [[-.2, .12, .12, -.02], [0, .135, .13, -.02], [.05, .19, .15, -.03], [.1, .31, .18, -.03], [.16, .47, .21, -.03], [.25, .66 * S, .23, -.03], [.47, .62 * S, .28, .01], [.8, .57 * S, .33, .05], [1.05, .5, .27, .01], [1.5, .42 * Wm, .23, 0], [2.0, .64 * Hm, .31, -.02], [2.42, .62 * Hm, .3, 0]];
  const B = {
    T, hn, ground, sx: (m ? .76 : .57) * S, sy: m ? .42 : .38, l1: m ? 1.36 : 1.27, l2: m ? 1.2 : 1.1, hl: m ? .62 : .55,
    armW: m ? [.36, .28, .27, .18] : [.27, .2, .2, .13], waistY: m ? 1.6 : 1.5, hipY: m ? 2.15 : 2.12, hx: m ? .3 : .28,
    crotch: m ? 2.55 : 2.48, legW: m ? [.46, .3, .28, .16] : [.42, .26, .25, .13], foot: m ? .88 : .8,
  };
  B.knee = lerp(B.hipY, ground - .1, .5); B.ankle = ground - .1;
  _AN_BODY.set(D, B);
  return B;
}
function _anSlice(B, y) {
  const T = B.T; if (y <= T[0][0]) return T[0]; if (y >= T[T.length - 1][0]) return T[T.length - 1];
  for (let i = 1; i < T.length; i++) if (y <= T[i][0]) { const a = T[i - 1], b = T[i], k = (y - a[0]) / (b[0] - a[0]), e = lerp(k, ease(k), .5); return [y, lerp(a[1], b[1], e), lerp(a[2], b[2], e), lerp(a[3], b[3], e)]; }
}
// A point on the body surface (slices may be overridden, e.g. for a skirt): [x', y, depth]
function _anSurf(sl, th, psi) {
  const [y, a, c, zc] = sl, x = a * Math.sin(th), z = zc + c * Math.cos(th);
  return [x * Math.cos(psi) + z * Math.sin(psi), y, -x * Math.sin(psi) + z * Math.cos(psi)];
}
// Limb angles of a slice for a heading (where the surface turns away): returns [left th, right th] around the front.
function _anLimbs(sl, psi) { const a = sl[1], c = sl[2], tl = Math.atan2(a * Math.cos(psi), c * Math.sin(psi)); return [tl - Math.PI, tl]; }
// Surface point clamped to the visible side (hidden points slide to the silhouette).
// ref: a th inside the region being drawn; hidden points before the visible span slide to one limb, after it to the
// other, so a region that wraps round the back stays a simple polygon.
function _anSurfC(sl, th, psi, ref = 0) {
  let [l0, l1] = _anLimbs(sl, psi); const mid = (l0 + l1) / 2, k = Math.round((ref - mid) / TAU);
  l0 += k * TAU; l1 += k * TAU;
  return _anSurf(sl, clamp(th, l0, l1), psi);
}
// Silhouette of a slice stack between y0 and y1: [left edge top->bottom, right edge bottom->top]
function _anSil(slAt, y0, y1, psi, n = 14) {
  const Lp = [], Rp = [];
  for (let i = 0; i <= n; i++) {
    const y = lerp(y0, y1, i / n), sl = slAt(y), e = Math.hypot(sl[1] * Math.cos(psi), sl[2] * Math.sin(psi)), x0 = sl[3] * Math.sin(psi);
    Lp.push([x0 - e, y]); Rp.push([x0 + e, y]);
  }
  return Lp.concat(Rp.reverse());
}
// A region on the surface between a top edge T(th) and a bottom edge Bt(th), th from a to b: a 2D polygon.
function _anBand(slAt, psi, a, b, Tf, Bf, n = 24) {
  const P = [];
  const ref = (a + b) / 2, wr = t => ((t + Math.PI) % TAU + TAU) % TAU - Math.PI;
  for (let i = 0; i <= n; i++) { const th = lerp(a, b, i / n), y = Tf(wr(th)); P.push(_anSurfC(slAt(y), th, psi, ref)); }
  for (let i = n; i >= 0; i--) { const th = lerp(a, b, i / n), y = Bf(wr(th)); P.push(_anSurfC(slAt(y), th, psi, ref)); }
  return P.map(p => [p[0], p[1]]);
}
// A line on the surface through (th, y) points (seams, trims, folds), visible part only.
function _anSurfLine(slAt, psi, pts, n = 6) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) {
    const th = lerp(pts[i][0], pts[i + 1][0], k / n), y = lerp(pts[i][1], pts[i + 1][1], k / n), p = _anSurf(slAt(y), th, psi);
    if (p[2] > -.01) out.push([p[0], p[1]]); else if (out.length) break;
  }
  const l = pts[pts.length - 1], p = _anSurf(slAt(l[1]), l[0], psi); if (p[2] > -.01) out.push([p[0], p[1]]);
  return out;
}
// Fill + cel shadow + outline for a 2D shape in body space.
function _anPaint(P, fill, sh, line, L, o = {}) {
  const c = _AN.c, p = P instanceof Path2D ? P : (o.poly ? celPoly(P) : celSpline(P, true));
  c.fillStyle = fill; c.fill(p);
  const cres = o.skip ? _anCrescentOpen : _anCrescent;
  if (sh) cres(p, L[0] * (o.off ?? .07), L[1] * (o.off ?? .07), sh);
  if (o.sh2) cres(p, L[0] * (o.off2 ?? .025), L[1] * (o.off2 ?? .025) - .01, o.sh2);
  if (o.rim) cres(p, L[0] * .02, L[1] * .02, o.rim);
  if (line) {
    c.strokeStyle = line; c.lineWidth = o.lw ?? _anLW(1.8); c.lineJoin = 'round';
    if (o.skip && Array.isArray(P)) {   // leave out hidden edges ([i0, i0 + 1], or a list of them): seams under the next garment
      const n = P.length, cut = new Set();
      for (const [a, b] of Array.isArray(o.skip[0]) ? o.skip : [o.skip]) for (let k = 0, m = ((b - a) % n + n) % n || 1; k < m; k++) cut.add(((a + k) % n + n) % n);   // edges a .. b-1
      const st = ([...cut][0] + 1) % n;
      c.lineCap = 'round'; let run = [P[st]];
      for (let k = 1; k <= n; k++) { const i = (st + k) % n; if (cut.has((i - 1 + n) % n)) { if (run.length > 1) c.stroke(celPoly(run, false)); run = [P[i]]; } else run.push(P[i]); }
      if (run.length > 1) c.stroke(celPoly(run, false));
    } else c.stroke(p);
  }
  return p;
}

// ---------- garments: upper body
// Garment colours. A very dark fill (black robes, suits) gets a LIGHTER line and fold tone, the way anime draws black
// cloth, so its folds and edges still read.
const _anDarkLn = col => _anHSV(col)[2] < .24 ? _anMix(col, '#A8A2C0', .32) : _anLine(col);
function _anOutfitCols(D) {
  const o = D.outfit, col = o.col;
  return { col, sh: _anShade(col, .2, .16, .14), ln: _anDarkLn(col), hi: _anLight(col, .25), col2: o.col2, sh2: _anShade(o.col2, .2, .15, .12), ln2: _anDarkLn(o.col2),
           shirt: o.shirt, shirtSh: _anShade(o.shirt, .14, .16, .14), shirtLn: _anLine(o.shirt), pants: o.pants, pantsSh: _anShade(o.pants, .25, .1, .1), pantsLn: _anLine(o.pants),
           shoes: o.shoes, shoesLn: _anLine(o.shoes, 1.2) };
}
// The front opening of coats and shirts: half-angle at height y.
function _anOpening(D, y) {
  const t = D.outfit.type;
  if (t === 'shirt') return y < .42 ? .24 * (1 - y / .42) : 0;
  if (t === 'coat' && D.outfit.long) return .28 - .06 * y;
  if (t === 'coat' || t === 'suit') return y < .95 ? .34 * (1 - y / .95) : 0;
  return 0;
}
const _anGownTop = th => { const a = Math.abs(th); return a < .36 ? .56 * (1 - a / .36) - .02 * (a / .36) : a < .6 ? -.02 + .04 * (a - .36) / .24 : a < 1.65 ? lerp(.02, .55, ease((a - .6) / 1.05)) : lerp(.55, 1.15, ease((a - 1.65) / (Math.PI - 1.65))); };
// Seen from behind, a coat, suit, shirt or robe closes high round the neck: a collar band over the base of the neck
// (drawn after the neck, which _anHeadDraw clips at the collar). Gowns and dresses keep their open back.
function _anTorsoBack(D, B, psi, L) {
  const t = D.outfit.type; if (t === 'gown' || t === 'dress' || Math.cos(psi) > -.2) return;
  const C = _anOutfitCols(D), nw = D.m ? .2 : .14, slAt = y => [y, nw + (y + .16) * .32, nw * .95 + (y + .16) * .28, -.03];
  const col = t === 'shirt' ? C.shirt : C.col, sh = t === 'shirt' ? C.shirtSh : C.sh, ln = t === 'shirt' ? C.shirtLn : C.ln;
  const P = _anBand(slAt, psi, Math.PI - 1.5, Math.PI + 1.5, th => -.15 + .06 * (1 - Math.cos(th - Math.PI)), () => .05, 24);
  _anPaint(P, col, sh, ln, L, { lw: _anLW(1.4), poly: true, off: .03 });
  const seam = _anSurfLine(slAt, psi, [[Math.PI - 1.4, -.03], [Math.PI, -.05], [Math.PI + 1.4, -.03]], 8);   // the collar's fold line
  if (seam.length > 1) _anTaper(seam, _anTp(.2, .2, 0, _anLW(1), 0), _anA(ln, .6));
}
// Seen from the front or 3/4, the collar of a coat, suit, shirt or robe wraps round BEHIND the neck: its far half (the
// inside, in shade) shows on both sides of the neck, so the garment never ends in a flat box top. Drawn before the neck.
function _anCollarBehind(D, B, psi, L) {
  const t = D.outfit.type; if ((t !== 'coat' && t !== 'suit') || Math.cos(psi) <= -.2) return;
  const C = _anOutfitCols(D), nw = D.m ? .2 : .14, slAt = y => [y, nw * 1.38 + (y + .16) * .3, nw * 1.2 + (y + .16) * .25, -.03];
  const col = _anShade(C.col, .26, .12, .1), ln = C.ln;
  // the far half of the band (th round the back), projected without hiding it: we see its inside
  const P = [], N = 24, top = th => -.13 + .07 * (1 - Math.cos(th - Math.PI));
  for (let i = 0; i <= N; i++) { const th = Math.PI + lerp(-1.75, 1.75, i / N), y = top(th), q = _anSurf(slAt(y), th, psi); P.push([q[0], q[1]]); }
  for (let i = N; i >= 0; i--) { const th = Math.PI + lerp(-1.75, 1.75, i / N), q = _anSurf(slAt(.06), th, psi); P.push([q[0], q[1]]); }
  _anPaint(P, col, null, ln, L, { lw: _anLW(1.3), poly: true });
}
function _anTorso(D, B, P, psi, L, yb) {
  const c = _AN.c, t = D.outfit.type, C = _anOutfitCols(D), slAt = y => _anSlice(B, y), lw = _anLW(1.8);
  const sil = _anSil(slAt, -.05, yb, psi, 30);
  const skinT = t === 'gown' || t === 'dress';
  const base = skinT ? D.skin : t === 'shirt' ? C.shirt : t === 'robe' ? C.col : (D.outfit.long || D.outfit.hasShirt ? C.shirt : C.col2);
  const baseSh = skinT ? D.skinSh : t === 'shirt' ? C.shirtSh : t === 'robe' ? C.sh : _anShade(base, .2, .15, .12);
  const baseLn = skinT ? D.skinLn : t === 'shirt' ? C.shirtLn : t === 'robe' ? C.ln : _anLine(base);
  const body = _anPaint(sil, base, baseSh, baseLn, L, { lw, rim: P.rim, poly: true, skip: [[30, 31], [61, 0]] });   // the waist edge goes under the skirt / belt, the top edge under the neck
  const band = (a, b, Tf, Bf, n) => _anBand(slAt, psi, a, b, Tf, Bf, n);
  const line = (pts, w, col, n) => { const q = _anSurfLine(slAt, psi, pts, n); if (q.length > 1) _anTaper(q, _anTp(.2, .2, 0, w, 0), col); };
  if (skinT) {
    for (const s of [-1, 1]) line([[s * .12, .1], [s * .3, .07], [s * .52, .1]], _anLW(1.1), _anA(D.skinLn, .45));
    const bod = band(-Math.PI, Math.PI, _anGownTop, () => yb + .02, 48);
    c.save(); c.clip(body);
    _anPaint(bod, C.col, C.sh, C.ln, L, { lw, poly: true, sh2: _anShade(C.sh, .15, .1, .1) });
    // under-bust shadow and two soft folds
    c.fillStyle = _anA(C.sh, .9); c.fill(celPoly(band(-1.2, 1.2, th => .9 + .06 * Math.cos(th * 2.5), th => 1.02 + .02 * Math.cos(th * 3), 20)));
    for (const s of [-1, 1]) line([[s * .22, .62], [s * .3, .95], [s * .26, 1.4]], _anLW(1), _anA(C.ln, .45));
    // gold trim on the neckline, and the waist band with a jewel
    const top = []; for (let i = 0; i <= 30; i++) { const th = lerp(-.62, .62, i / 30); const p = _anSurf(slAt(_anGownTop(th)), th, psi); if (p[2] > 0) top.push([p[0], p[1]]); }
    if (top.length > 1) { _anTaper(top, () => _anLW(4.2), C.ln2, true); _anTaper(top, () => _anLW(2.6), C.col2, true); }
    _anPaint(band(-Math.PI, Math.PI, () => yb - .1, () => yb + .02, 36), C.col2, C.sh2, C.ln2, L, { lw: _anLW(1.2), poly: true });
    const j = _anSurf(slAt(yb - .04), 0, psi); if (j[2] > 0) { _anPaint(_anGemPts(j[0], j[1], .045), D.acc.gem, _anShade(D.acc.gem), _anLine(D.acc.gem), L, { lw: _anLW(1), off: .02 }); }
    c.restore();
  } else if (t === 'shirt') {
    const v = band(-.26, .26, () => -.06, th => _anOpening(D, 0) > 0 ? .42 * (1 - Math.abs(th) / .26) : -.06, 16);
    c.save(); c.clip(body); _anPaint(v, D.skin, D.skinSh, null, L, { poly: true, off: .04 });
    line([[-.12, .12], [0, .16], [.12, .12]], _anLW(1), _anA(D.skinLn, .35));
    // placket with buttons, collar flaps, tuck folds
    line([[.03, .42], [.03, yb]], _anLW(1.1), _anA(C.shirtLn, .7));
    for (let y = .62; y < yb - .1; y += .3) { const p = _anSurf(slAt(y), .06, psi); if (p[2] > 0) { c.fillStyle = C.shirtSh; c.fill(_anEllP(p[0], p[1], .022, .022)); } }
    for (const s of [-1, 1]) {
      const fl = band(s < 0 ? -.66 : .2, s < 0 ? -.2 : .66, th => { const a = (Math.abs(th) - .2) / .46; return -.09 + .07 * a; }, th => { const a = (Math.abs(th) - .2) / .46; return a < .25 ? lerp(.36, .16, a / .25) : lerp(.16, .02, (a - .25) / .75); }, 12);
      c.fillStyle = _anA(C.shirtSh, .9); c.fill(_anMove(celPoly(fl), -L[0] * .02, .03));
      _anPaint(fl, C.shirt, C.shirtSh, C.shirtLn, L, { lw: _anLW(1.3), poly: true, off: .03 });
    }
    for (const th of [-.9, -.45, .5, .95]) line([[th, yb - .32], [th * 1.05, yb - .05]], _anLW(1), _anA(C.shirtLn, .5));
    _anPaint(band(-Math.PI, Math.PI, () => yb - .1, () => yb + .02, 36), C.col2 === C.pants ? '#3B2C25' : C.col2, _anShade('#3B2C25'), _anLine('#3B2C25'), L, { lw: _anLW(1.2), poly: true });
    const bk = _anSurf(slAt(yb - .04), 0, psi); if (bk[2] > 0) { c.fillStyle = '#C9B27A'; c.fill(celPoly(rectPts(bk[0] - .05, bk[1] - .05, .1, .09))); c.strokeStyle = '#7A6436'; c.lineWidth = _anLW(1); c.stroke(celPoly(rectPts(bk[0] - .05, bk[1] - .05, .1, .09))); }
    c.restore();
  } else if (t === 'robe') {
    // the crossed front in trim (default col2), a sash (outfit.sash: a colour, or false), and an optional collar in the
    // shirt colour (outfit.collar: 'bands' | 'jabot' | 'wing' | 'mandarin')
    const o = D.outfit, tc = o.trim || C.col2, sc = o.sash === false ? null : o.sash || C.col2, kc = o.collar;
    c.save(); c.clip(body);
    if (kc !== 'bands' && kc !== 'jabot') _anPaint(band(-.45, .55, th => Math.max(-.06, .02 + (th + .45) * 1.25), th => .02 + (th + .45) * 1.25 + .16, 16), tc, _anShade(tc, .2, .15, .12), _anLine(tc), L, { lw: _anLW(1.3), poly: true });
    else for (const s of [-1, 1]) line([[s * .12, -.04], [s * .2, .5], [s * .22, yb]], _anLW(1.2), _anA(C.ln, .7));   // an open front (judge's robe)
    if (sc) _anPaint(band(-Math.PI, Math.PI, () => yb - .16, () => yb + .02, 36), sc, _anShade(sc, .2, .15, .12), _anLine(sc), L, { lw: _anLW(1.3), poly: true });
    for (const s of [-1, 1]) line([[s * .5, .5], [s * .45, .95], [s * .48, 1.3]], _anLW(1), _anA(C.ln, .45));
    c.restore();
    if (kc !== 'none') _anCollar(D, B, psi, L, kc, C);
  } else {   // coat / suit: inner layer, then the two panels with lapels, buttons, belt
    c.save(); c.clip(body);
    if (D.outfit.long) {   // elder: shirt, tie, waistcoat under an open coat
      _anPaint(band(-.5, .5, th => .3 + .3 * Math.max(0, 1 - Math.abs(th) / .25), () => yb + .02, 20), C.col2, _anShade(C.col2), _anLine(C.col2), L, { lw: _anLW(1.2), poly: true });
      for (let y = .72; y < yb; y += .24) { const p = _anSurf(slAt(y), 0, psi); if (p[2] > 0) { c.fillStyle = _anLine(C.col2); c.fill(_anEllP(p[0], p[1], .02, .02)); } }
      if (D.outfit.tie) {
        const k = _anSurf(slAt(.04), 0, psi), e = _anSurf(slAt(.62), 0, psi);
        if (k[2] > 0) _anPaint([[k[0] - .035, k[1] - .03], [k[0] + .035, k[1] - .03], [k[0] + .028, k[1] + .045], [e[0] + .05, e[1] - .05], [e[0], e[1] + .02], [e[0] - .05, e[1] - .05], [k[0] - .028, k[1] + .045]], D.outfit.tie, _anShade(D.outfit.tie), _anLine(D.outfit.tie), L, { lw: _anLW(1.1), poly: true, off: .03 });
      }
      // shirt collar points
      for (const s of [-1, 1]) _anPaint(band(s < 0 ? -.3 : .05, s < 0 ? -.05 : .3, () => -.06, th => .02 + .1 * (1 - Math.abs(Math.abs(th) - .18) / .13), 8), C.shirt, C.shirtSh, C.shirtLn, L, { lw: _anLW(1.1), poly: true, off: .02 });
    } else {
      line([[-.3, -.04], [0, .04], [.3, -.04]], _anLW(1.2), _anA(_anLine(base), .6));   // a high neckline (turtleneck)
    }
    const sides = [-1, 1].map(s => ({ s, d: _anSurf(slAt(.6), s * 1.2, psi)[2] })).sort((a, b) => a.d - b.d);
    for (const { s } of sides) {
      const pan = [];
      const n = 16;
      for (let i = 0; i <= n; i++) { const y = lerp(-.04, yb + .02, i / n), w = _anOpening(D, y); pan.push([s * (w - (w === 0 ? .04 : 0)), y]); }
      pan.push([s * Math.PI, yb + .02], [s * Math.PI, -.04]);
      const P2 = [];
      for (let i = 0; i < pan.length; i++) { const a = pan[i], b = pan[(i + 1) % pan.length], m = 6; for (let k = 0; k < m; k++) { const th = lerp(a[0], b[0], k / m), y = lerp(a[1], b[1], k / m), p = _anSurfC(slAt(y), th, psi, s * 1.6); P2.push([p[0], p[1]]); } }
      _anPaint(P2, C.col, C.sh, C.ln, L, { lw, poly: true, rim: P.rim, skip: [n * 6, (n + 1) * 6] });
      // lapel
      const lap = [[s * .3, -.05], [s * .56, .1], [s * .6, .3], [s * .44, .36], [s * (_anOpening(D, .7) + .1), .7], [s * _anOpening(D, .78), .78]];
      for (let y = .78; y > -.05; y -= .1) lap.push([s * _anOpening(D, y), y]);
      const LP = []; for (let i = 0; i < lap.length; i++) { const a = lap[i], b = lap[(i + 1) % lap.length]; for (let k = 0; k < 4; k++) { const th = lerp(a[0], b[0], k / 4), y = lerp(a[1], b[1], k / 4), p = _anSurfC(slAt(y), th, psi, s * .4); LP.push([p[0], p[1]]); } }
      c.fillStyle = _anA(C.sh, .8); c.fill(_anMove(celPoly(LP), -L[0] * .025, .02));
      const tc = D.outfit.trim; _anPaint(LP, tc || _anMix(C.col, C.hi, .35), tc ? _anShade(tc) : C.sh, tc ? _anLine(tc) : C.ln, L, { lw: _anLW(1.4), poly: true, off: .035 });
    }
    if (!D.outfit.long) {
      for (const [th, y] of [[.1, .98], [.1, 1.22]]) { const p = _anSurf(slAt(y), th, psi); if (p[2] > 0) { _anPaint(_anEllPts(p[0], p[1], .028), C.col2, null, _anLine(C.col2), L, { lw: _anLW(1) }); } }
      if (D.outfit.belt) {
        _anPaint(band(-Math.PI, Math.PI, () => B.waistY - .07, () => B.waistY + .06, 36), C.col2, _anShade(C.col2), _anLine(C.col2), L, { lw: _anLW(1.2), poly: true });
        const bk = _anSurf(slAt(B.waistY), .04, psi); if (bk[2] > 0) { c.strokeStyle = '#D8C38A'; c.lineWidth = _anLW(2.4); c.strokeRect(bk[0] - .06, bk[1] - .06, .12, .12); }
        for (const s of [-1, 1]) line([[s * .3, B.waistY - .32], [s * .22, B.waistY - .07]], _anLW(1), _anA(C.ln, .5));
      }
    }
    c.restore();
  }
}
// Collars at the throat (robe outfit.collar), in the shirt colour: 'mandarin' a standing band, 'wing' two pointed
// wings, 'bands' two white tabs hanging from the throat (a judge's or barrister's bands), 'jabot' a lace cascade.
function _anCollar(D, B, psi, L, kind, C) {
  const nw = D.m ? .2 : .14, col = C.shirt, sh = C.shirtSh, ln = C.shirtLn, lw = _anLW(1.2);
  const nk = y => [y, nw * 1.1 + Math.max(0, y) * .3, nw * 1.02, -.02], tb = y => _anSlice(B, y);
  if (kind === 'mandarin' || kind === 'wing') _anPaint(_anBand(nk, psi, -1.7, 1.7, th => -.1 + .02 * Math.abs(th), () => .03, 24), col, sh, ln, L, { lw, poly: true, off: .025 });
  if (kind === 'wing') for (const s of [-1, 1]) _anPaint(_anBand(nk, psi, s < 0 ? -.42 : .04, s < 0 ? -.04 : .42, () => -.02, th => .02 + .09 * Math.max(0, 1 - Math.abs(Math.abs(th) - .12) / .3), 8), col, sh, ln, L, { lw, poly: true, off: .02 });
  if (kind === 'bands') for (const s of [-1, 1]) _anPaint(_anBand(tb, psi, s < 0 ? -.1 : .015, s < 0 ? -.015 : .1, () => -.01, th => .26 + .015 * Math.abs(th), 4), col, sh, ln, L, { lw, poly: true, off: .02 });
  if (kind === 'jabot') for (let k = 0; k < 3; k++) {   // three scalloped tiers of lace
    const y0 = -.02 + k * .09, w = .1 + k * .025, P = _anBand(tb, psi, -w, w, () => y0, th => y0 + .12 + .018 * Math.cos(th / w * Math.PI * 2.5), 14);
    _anPaint(P, col, sh, ln, L, { lw: _anLW(1), poly: true, off: .02 });
  }
}
const _anEllPts = (x, y, r) => ellPts(x, y, r, r, 14);
const _anGemPts = (x, y, r) => [[x, y - r * 1.3], [x + r, y - r * .2], [x, y + r * 1.1], [x - r, y - r * .2]];

// ---------- arms and hands
const _an3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
// Named arm poses. Each is (B, ctx) => spec, written for the RIGHT arm in body space (x < 0 is outward for the right
// arm; the left arm mirrors x). A spec is one of:
//   { T: [x, y, z] }            the wrist target
//   { dir: [x, y, z], k }        a reach direction from the shoulder, k = fraction of the full arm length
//   { aim: [sx, sy, sz], k }     a reach direction in SCREEN space (sx right, sy down, sz toward the viewer), whatever
//                                the heading and side (not mirrored)
//   { up: [x, y, z], fore: [x, y, z] }   upper-arm and forearm directions
// plus h (which way the elbow points), hand (default hand), hd (hand direction), th (where the thumb points).
// ctx = { psi (body heading, rad), side ('L'|'R'), out (the arm's outward screen direction in the front view, -1 / 1) }.
const ANIME_ARMS = {
  down:  B => ({ dir: [-.07, 1, .06], k: .955, h: [-.3, 0, -1], hand: 'relaxed', hd: [.06, 1, .2], th: [1, 0, .8] }),
  hip:   B => ({ T: [-(B.T[8][1] + .1), B.waistY - .05, -.03], h: [-1, -.1, -.7], hand: 'relaxed', hd: [.35, .9, .25], th: [0, -.3, -1] }),
  cross: B => ({ T: [B.sx * .55, B.sy + .58, .42], h: [-.4, 1, .1], hand: 'relaxed', hd: [.85, .25, -.45], th: [0, -1, 0] }),
  // point: along the way the character faces (and outward in the front view, so it reads), a little up
  point: (B, x) => { const sp = Math.sin(x.psi), cp = Math.cos(x.psi); return { aim: [sp + (1 - Math.abs(sp)) * x.out * .8, -.18, .55 * cp], k: .99, h: [0, 1, 0], hand: 'point', th: [0, -1, .2] }; },
  raise: B => ({ dir: [-.24, -.97, .06], k: .99, h: [-1, 0, 0], hand: 'open', th: [1, 0, 0] }),
  wave:  B => ({ T: [-B.sx - .82, -.62, .28], h: [-1, .4, -.1], hand: 'open', hd: [.08, -1, .1], th: [1, 0, .2] }),
  reach: B => ({ dir: [-.2, .32, .93], k: .98, h: [0, 1, 0], hand: 'open', th: [.3, -1, 0] }),
  hold:  B => ({ T: [-B.sx * .82, B.sy + .8, .66], h: [0, 1, -.5], hand: 'hold', hd: [.05, .12, 1], th: [0, -1, 0] }),
  chin:  B => ({ T: [-.1, -.08, .42], h: [.15, 1, .55], hand: 'relaxed', hd: [.18, -1, .08], th: [1, 0, .3] }),
  desk:  B => ({ T: [-B.sx * .5, B.waistY - .2, .62], h: [-.6, .4, -.6], hand: 'relaxed', hd: [.2, .25, 1], th: [0, -1, 0] }),
};
// Blend between two arm poses (names or specs) from t0 to t1: armR: animeArm(t, 1, 1.3, 'down', 'point').
// The result is [a, b, k]; armL / armR accept that triple directly (the wrist target, elbow, hand and thumb blend; the
// hand shape switches half way).
function animeArm(t, t0, t1, a, b) { const k = !(t1 > t0) ? (t >= t0 ? 1 : 0) : ease(seg(t, t0, t1)); return k <= 0 ? a : k >= 1 ? b : [a, b, k]; }
function _anArmSolve(B, side, spec, t, psi = 0) {
  const s = side === 'L' ? 1 : -1, flip = v => s < 0 ? v.slice() : [-v[0], v[1], v[2]];
  const S = [s * B.sx, B.sy, -.02], l1 = B.l1, l2 = B.l2, ctx = { psi, side, out: s };
  // one spec -> { T (body space, this side), h, hd, th, hand }
  const res = sp => {
    const name = typeof sp === 'string' ? sp : null;
    let P = name ? (ANIME_ARMS[name] || ANIME_ARMS.down)(B, ctx) : sp && typeof sp === 'object' ? sp : ANIME_ARMS.down(B, ctx);
    if (!P || typeof P !== 'object') P = ANIME_ARMS.down(B, ctx);
    let T, h = flip(P.h || [0, 0, -1]);
    const ok = v => Array.isArray(v) && v.length >= 3 && v.every(isFinite);
    if (ok(P.up) && ok(P.fore)) { const E = _an3.add(S, _an3.mul(_an3.norm(flip(P.up)), l1)); T = _an3.add(E, _an3.mul(_an3.norm(flip(P.fore)), l2)); h = _an3.sub(E, _an3.mul(_an3.add(S, T), .5)); }
    else if (ok(P.aim)) { const a = P.aim, c = Math.cos(psi), sn = Math.sin(psi); T = _an3.add(S, _an3.mul(_an3.norm([a[0] * c - a[2] * sn, a[1], a[0] * sn + a[2] * c]), (l1 + l2) * (P.k ?? .98))); }
    else if (ok(P.T)) T = flip(P.T);
    else T = _an3.add(S, _an3.mul(_an3.norm(flip(ok(P.dir) ? P.dir : [-.07, 1, .06])), (l1 + l2) * (P.k ?? .98)));
    if (name === 'wave') { const w = Math.sin((t || 0) * TAU * 1.6) * .22; T = _an3.add(T, [s * -w, Math.abs(w) * .2, 0]); }
    return { T, h, hd: ok(P.hd) ? flip(P.hd) : null, th: flip(ok(P.th) ? P.th : [1, 0, .5]), hand: P.hand || 'relaxed' };
  };
  let R;
  if (Array.isArray(spec) && spec.length >= 2 && !(typeof spec[0] === 'number')) {   // [a, b, k]: a blend
    const A = res(spec[0]), Bq = res(spec[1]), k = clamp(isFinite(spec[2]) ? spec[2] : .5), lv = (u, v) => [lerp(u[0], v[0], k), lerp(u[1], v[1], k), lerp(u[2], v[2], k)];
    R = { T: lv(A.T, Bq.T), h: lv(A.h, Bq.h), hd: A.hd && Bq.hd ? lv(A.hd, Bq.hd) : k < .5 ? A.hd : Bq.hd, th: lv(A.th, Bq.th), hand: k < .5 ? A.hand : Bq.hand };
  } else R = res(spec);
  // a raised arm lifts its shoulder (the trapezius shrugs) and draws it in a little
  const up = clamp((B.sy - .15 - R.T[1]) / .7); S[1] -= .06 * up; S[0] -= s * .03 * up;
  const d = _an3.sub(R.T, S), dl = clamp(_an3.len(d), Math.abs(l1 - l2) + .02, l1 + l2 - .002), u = _an3.norm(d);
  const a = (l1 * l1 - l2 * l2 + dl * dl) / (2 * dl), b = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let h = _an3.sub(R.h, _an3.mul(u, _an3.dot(R.h, u))); if (_an3.len(h) < 1e-4) h = [0, 0, -1]; h = _an3.norm(h);
  const E = _an3.add(S, _an3.add(_an3.mul(u, a), _an3.mul(h, b))), W = _an3.add(S, _an3.mul(u, dl));
  const hd = R.hd ? _an3.norm(R.hd) : _an3.norm(_an3.sub(W, E));
  return { S, E, W, hd, th: R.th, hand: R.hand, s };
}
const _anP3 = (p, psi) => [p[0] * Math.cos(psi) + p[2] * Math.sin(psi), p[1], -p[0] * Math.sin(psi) + p[2] * Math.cos(psi)];
// A tapered capsule from a to b (2D) with radii r0 -> r1 and a slight muscle swell.
function _anCapsule(a, b, r0, r1, swell = .06) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-6, ux = dx / d, uy = dy / d, nx = -uy, ny = ux, P = [], n = 8;
  for (let i = 0; i <= n; i++) { const k = i / n, r = lerp(r0, r1, k) * (1 + swell * Math.sin(Math.PI * Math.min(1, k * 1.3))); P.push([a[0] + dx * k + nx * r, a[1] + dy * k + ny * r]); }
  for (let i = 1; i < 8; i++) { const ang = Math.PI / 2 - i / 8 * Math.PI; P.push([b[0] + (ux * Math.cos(ang) + nx * Math.sin(ang)) * r1, b[1] + (uy * Math.cos(ang) + ny * Math.sin(ang)) * r1]); }
  for (let i = n; i >= 0; i--) { const k = i / n, r = lerp(r0, r1, k) * (1 + swell * Math.sin(Math.PI * Math.min(1, k * 1.3))); P.push([a[0] + dx * k - nx * r, a[1] + dy * k - ny * r]); }
  for (let i = 1; i < 8; i++) { const ang = -Math.PI / 2 - i / 8 * Math.PI; P.push([a[0] + (ux * Math.cos(ang) + nx * Math.sin(ang)) * r0, a[1] + (uy * Math.cos(ang) + ny * Math.sin(ang)) * r0]); }
  return P;
}
// Several capsules as one shape: thick line under, fills over (only the union's outline shows), cel shadow each.
// o.hide: [x, y, r] a disc where no outline is drawn (the shoulder: the arm grows out of the torso, no ball joint).
function _anLimb(caps, fill, sh, ln, L, lw, o = {}) {
  const c = _AN.c, paths = caps.map(P => celPoly(P));
  c.strokeStyle = ln; c.lineWidth = lw * 2; c.lineJoin = 'round';
  if (o.hide) { c.save(); const q = new Path2D(); q.rect(-50, -50, 100, 100); q.ellipse(o.hide[0], o.hide[1], o.hide[2], o.hide[2], 0, 0, TAU); c.clip(q, 'evenodd'); for (const p of paths) c.stroke(p); c.restore(); }
  else for (const p of paths) c.stroke(p);
  for (const p of paths) { c.fillStyle = fill; c.fill(p); _anCrescent(p, L[0] * (o.off ?? .06), L[1] * (o.off ?? .06), sh); if (o.rim) _anCrescent(p, L[0] * .018, L[1] * .018, o.rim); }
}
// Hands, in hand space: x from the wrist (0) to the fingertips (~1), y across with the thumb on +y. The palm is a
// rounded shape, each finger two tapered segments bent at the middle knuckle, the fist a block with four knuckle
// bumps and the thumb wrapped across its front.
const _AN_PALM = [[0, -.14], [.16, -.18], [.36, -.18], [.46, -.12], [.48, .0], [.45, .12], [.32, .17], [.12, .16], [0, .12]];
const _AN_FIST = [[0, -.15], [.16, -.2], [.32, -.215], [.47, -.19], [.55, -.1], [.57, .02], [.53, .12], [.38, .17], [.12, .16], [0, .12]];
// one finger: root, direction (rad), length, curl at the middle knuckle (rad), root radius
function _anFinger(x0, y0, a, len, curl, r) {
  const l1 = len * .55, k = [x0 + Math.cos(a) * l1, y0 + Math.sin(a) * l1], b = a + curl, tip = [k[0] + Math.cos(b) * len * .45, k[1] + Math.sin(b) * len * .45];
  return [_anCapsule([x0, y0], k, r, r * .86, 0), _anCapsule(k, tip, r * .86, r * .72, 0)];
}
function _anHand(D, kind, W2, dir2, thumb2, size, L, prop, edge = 1) {
  const c = _AN.c, ang = Math.atan2(dir2[1], dir2[0]), perp = [-dir2[1], dir2[0]], fl = (thumb2[0] * perp[0] + thumb2[1] * perp[1]) < 0 ? -1 : 1;
  const sz = size * Math.max(.55, Math.min(1, Math.hypot(dir2[0], dir2[1]) * 1.2));
  c.save(); c.translate(W2[0], W2[1]); c.rotate(ang); c.scale(sz, sz * fl * (D.m ? 1.08 : .94) * edge);
  const lw = _anLW(1.4) / sz, sh = D.skinSh, ln = D.skinLn, caps = [], r = D.m ? .058 : .05, sm = P => _anDense(P, true, 4);
  // finger roots on the palm's far edge: index (next to the thumb) .. pinky; lengths index, middle, ring, pinky
  const roots = [[.44, .1], [.47, .025], [.455, -.055], [.41, -.13]], lens = [.44, .48, .45, .36];
  const fingers = (spread, curl, only) => roots.forEach(([x, y], i) => { if (!only || only.includes(i)) caps.push(..._anFinger(x, y, spread[i], lens[i], curl[i], r * (1 - .06 * i))); });
  if (kind === 'open') { caps.push(sm(_AN_PALM)); fingers([.2, .05, -.1, -.26], [.05, .03, .02, .02]); caps.push(..._anFinger(.1, .12, 1.0, .36, -.25, r * 1.1)); }
  else if (kind === 'fist' || kind === 'hold') {
    caps.push(sm(_AN_FIST));
    for (let i = 0; i < 4; i++) caps.push(_anEllPts(.5 - .02 * i, .1 - .085 * i, r * 1.1));   // the knuckles
    if (kind === 'fist') caps.push(_anCapsule([.1, .13], [.44, .02], r * 1.15, r * .95, 0));   // the thumb across the front
    else caps.push(_anCapsule([.12, .14], [.36, .17], r * 1.1, r * .9, 0));
  }
  else if (kind === 'point') {
    caps.push(sm(_AN_FIST));
    for (let i = 1; i < 4; i++) caps.push(_anEllPts(.5 - .02 * i, .1 - .085 * i, r * 1.1));
    caps.push(..._anFinger(.46, .1, -.02, .44, .1, r));        // the index finger, out, with a slight knuckle bend
    caps.push(_anCapsule([.1, .13], [.4, .06], r * 1.1, r * .9, 0));   // the thumb along the curled middle finger
  }
  else { caps.push(sm(_AN_PALM)); fingers([.12, .03, -.07, -.18], [.35, .45, .55, .6]); caps.push(..._anFinger(.1, .12, .75, .34, -.15, r * 1.08)); }   // relaxed: a gentle curl
  if (prop && kind === 'hold') { c.save(); c.scale(1 / sz, 1 / (sz * fl * (D.m ? 1.08 : .94))); prop(); c.restore(); }
  _anLimb(caps, D.skin, sh, ln, [L[0], L[1] * fl], lw, { off: .07 });
  // creases: the palm heel, the thumb web, knuckle lines on a fist
  const fl2 = (P, w = .6, a = .5) => _anTaper(P, _anTp(.3, .3, 0, lw * w, 0), _anA(ln, a));
  if (kind === 'open' || kind === 'relaxed') { fl2([[.12, .1], [.26, .02], [.4, .0]]); fl2([[.2, .14], [.3, .12]], .5, .45); }
  else { fl2([[.47, .13], [.5, -.17]], .7, .55); if (kind !== 'point') fl2([[.22, .13], [.4, .05]], .6, .4); }
  c.restore();
}
function _anArm(D, B, A, psi, L, P, o = {}) {
  const t = D.outfit.type, C = _anOutfitCols(D), pr = p => _anP3(p, psi);
  const S2 = pr(A.S), E2 = pr(A.E), W2 = pr(A.W), aw = B.armW;
  const S0 = [S2[0], S2[1] - .02];
  const upper = _anCapsule(S0, E2, aw[0] / 2, aw[1] / 2, .08), fore = _anCapsule(E2, W2, aw[2] / 2, aw[3] / 2, .1);
  const lw = _anLW(1.7), toward = clamp((_anP3(A.W, psi)[2] - _anP3(A.E, psi)[2]) / B.l2 * 1.6 - .5);   // the forearm comes at the viewer
  const sleeve = t === 'gown' || t === 'dress' ? 0 : t === 'shirt' ? .62 : 1, limb = (parts, ...r) => toward > .2 ? parts.forEach(p => _anLimb([p], ...r)) : _anLimb(parts, ...r);
  const hide = [S2[0] - Math.sign(S2[0] || 1) * .02, S2[1] - .04, aw[0] / 2 + .015];   // no ball-joint outline where the arm leaves the shoulder
  const scol = t === 'shirt' ? C.shirt : C.col, ssh = t === 'shirt' ? C.shirtSh : C.sh, sln = t === 'shirt' ? C.shirtLn : C.ln;
  if (sleeve === 0) {
    limb([upper, fore], D.skin, D.skinSh, D.skinLn, L, lw, { rim: P.rim, hide });
    if (D.acc.bracelet) { const p = [lerp(E2[0], W2[0], .88), lerp(E2[1], W2[1], .88)], d = [W2[0] - E2[0], W2[1] - E2[1]], a = Math.atan2(d[1], d[0]); _AN.c.save(); _AN.c.translate(p[0], p[1]); _AN.c.rotate(a); _anPaint(rectPts(-.025, -aw[3] * .6, .05, aw[3] * 1.2), C.col2, C.sh2, C.ln2, L, { lw: _anLW(1), poly: true, off: .02 }); _AN.c.restore(); }
  } else {
    const foreSk = _anCapsule(E2, W2, aw[2] / 2, aw[3] / 2, .1);
    if (sleeve < 1) { _anLimb([foreSk], D.skin, D.skinSh, D.skinLn, L, lw); }
    const M = [lerp(E2[0], W2[0], sleeve < 1 ? .32 : .92), lerp(E2[1], W2[1], sleeve < 1 ? .32 : .92)];
    const up2 = _anCapsule(S0, E2, aw[0] / 2 + .015, aw[1] / 2 + .025, .03), fo2 = _anCapsule(E2, M, aw[2] / 2 + .025, (sleeve < 1 ? aw[2] / 2 + .035 : aw[3] / 2 + .04), .02);
    limb([up2, fo2], scol, ssh, sln, L, lw, { rim: P.rim, hide });
    if (toward > .2) { const r = aw[2] / 2 + .03; _AN.c.fillStyle = _anA(ssh, .8 * toward); _AN.c.fill(_anEllP(E2[0], E2[1], r, r * .55, Math.atan2(W2[1] - E2[1], W2[0] - E2[0]) + Math.PI / 2)); }   // the fold where the forearm overlaps
    // cuff / rolled band
    const d = [W2[0] - E2[0], W2[1] - E2[1]], a = Math.atan2(d[1], d[0]), r = sleeve < 1 ? aw[2] / 2 + .05 : aw[3] / 2 + .05;
    _AN.c.save(); _AN.c.translate(M[0], M[1]); _AN.c.rotate(a);
    _anPaint([[-.06, -r], [.0, -r], [.0, r], [-.06, r]], sleeve < 1 ? C.shirt : _anMix(scol, C.hi, .2), ssh, sln, L, { lw: _anLW(1.2), poly: true, off: .02 });
    _AN.c.restore();
    // elbow fold
    _anTaper([[E2[0] - .03, E2[1] - .05], [E2[0] + .01, E2[1]], [E2[0] - .02, E2[1] + .05]], _anTp(.3, .3, 0, _anLW(1), 0), _anA(sln, .6));
  }
  const hd2 = pr(A.hd), th2 = pr(A.th), kind = (A.s < 0 ? P.handR : P.handL) || A.hand, prop = A.s < 0 ? P.holdR : P.holdL;
  const propFn = typeof prop === 'function' ? () => { push(); const ctx = _AN; try { _anPropSpace(_AN.c.getTransform()); prop(1, A.s < 0 ? 'R' : 'L'); } catch (e) { const k = 'prop: ' + String(e && e.stack || e).slice(0, 300); if (!_AN_ERR.has(k)) { _AN_ERR.add(k); console.error('anime rig ' + k); } } finally { _AN = ctx; pop(); } } : null;   // hand space for cel*() props
  const pn = _an3.norm([A.hd[1] * A.th[2] - A.hd[2] * A.th[1], A.hd[2] * A.th[0] - A.hd[0] * A.th[2], A.hd[0] * A.th[1] - A.hd[1] * A.th[0]]), pv = _anP3(pn, psi);
  _anHand(D, kind === 'hold' || prop ? (kind === 'open' ? 'open' : 'hold') : kind, W2, [hd2[0], hd2[1]], [th2[0], th2[1]], B.hl * (1 + .15 * toward), L, propFn, lerp(.55, 1, Math.abs(pv[2])));
}
// Put the p5 transform at the current canvas transform (grip point), so a prop drawn with cel*() lands in the hand.
function _anPropSpace(m) {
  const M0 = _scMat(), det = M0.a * M0.d - M0.b * M0.c || 1;
  // relative transform R = M0^-1 * m (both map local -> screen)
  const ia = M0.d / det, ib = -M0.b / det, ic = -M0.c / det, id = M0.a / det, ix = (M0.c * M0.y - M0.d * M0.x) / det, iy = (M0.b * M0.x - M0.a * M0.y) / det;
  const a = ia * m.a + ic * m.b, b = ib * m.a + id * m.b, c2 = ia * m.c + ic * m.d, d = ib * m.c + id * m.d, e = ia * m.e + ic * m.f + ix, f = ib * m.e + id * m.f + iy;
  applyMatrix(a, b, c2, d, e, f);
}

// ---------- legs, shoes, skirts
// Slight top-down view of the ground: points lower on the body drop by their depth, so hems and feet sit on the floor.
const _anElev = (B, y) => .17 * Math.pow(clamp((y - B.hipY) / (B.ground - B.hipY)), 1.3);
const _anPG = (B, p, psi) => { const q = _anP3(p, psi); return [q[0], q[1] + q[2] * _anElev(B, p[1]), q[2]]; };
// One leg: hip -> knee -> ankle in body space. Standing: contrapposto (weight on the right leg, the left knee eased,
// its foot a little forward and out). walk: phase in steps; the legs swing in z (visible in 3/4 and profile).
// sit (0..1): the thighs come forward and the knees bend (seated, the shins hang down to the floor, or angle forward
// for a low seat: seat = hip height above the ground in heads).
function _anLegSolve(B, s, walk, stance = 1, sit = 0, seat = null) {
  const W = walk != null && !sit, ph = W ? walk * TAU + (s > 0 ? Math.PI : 0) : 0, free = s > 0 ? stance * (1 - sit) : 0;
  const H = [s * B.hx * (W ? .9 : 1), B.hipY, 0], l1 = B.knee - B.hipY + .02, l2 = B.ankle - B.knee;
  let phi = W ? .36 * Math.sin(ph) : .1 * free;
  let kn = W ? .08 + .62 * Math.pow(Math.max(0, Math.cos(ph)), 1.6) : .02 + .26 * free;
  if (sit > 0) {
    const ps = 1.42 + .06 * s, sh = seat != null && isFinite(seat) ? Math.acos(clamp((seat - .1 - l1 * Math.cos(ps)) / l2, -1, 1)) : .12;   // shin angle from vertical
    phi = lerp(phi, ps, ease(sit)); kn = lerp(kn, ps - sh, ease(sit));
  }
  const ax = W ? s * -.03 : (s < 0 ? .05 * stance : .07 * free) * (1 - sit) + s * .02 * sit;
  const K = [H[0] + ax, H[1] + l1 * Math.cos(phi), l1 * Math.sin(phi)];
  const A = [K[0] + ax * .6, K[1] + l2 * Math.cos(phi - kn), K[2] + l2 * Math.sin(phi - kn)];
  const pitch = W ? Math.max(0, -Math.sin(ph)) * .55 * Math.max(0, -Math.cos(ph) + .3) : 0;
  return { H, K, A, pitch, s, turn: s * (W ? .06 : (.16 + .1 * free) * (1 - .6 * sit)) };
}
function _anShoe(D, B, A, psi, L, C) {
  const f = B.foot, heel = !D.m, pitch = A.pitch + (heel ? .32 : 0), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cg = Math.cos(A.turn || 0), sg = Math.sin(A.turn || 0);
  const R = ([x, y, z]) => { const y1 = y * cp + z * sp, z1 = -y * sp + z * cp; return [A.A[0] + x * cg + z1 * sg, A.A[1] + y1, A.A[2] - x * sg + z1 * cg]; };   // pitch (toe down), then turn out
  const pts = [];
  const sec = heel ? [[-.07, .05, .055], [.05, .09, .07], [f * .55, .1, .075], [f * .78, .085, .055], [f * .92, .06, .03]] : [[-.08, .02, .075], [.05, .1, .085], [f * .55, .11, .09], [f * .8, .1, .085], [f * .93, .075, .065]];
  for (const [z, y, w] of sec) for (const [dx, dy] of [[-w, 0], [w, 0], [0, -.05], [-w * .7, -.03], [w * .7, -.03]]) pts.push(_anPG(B, R([dx, y + dy, z]), psi));
  pts.push(_anPG(B, R([0, -.06, -.04]), psi), _anPG(B, R([0, -.03, f * .3]), psi));
  const hull = _anHull(pts.map(p => [p[0], p[1]]));
  _anPaint(hull, C.shoes, _anShade(C.shoes, .25), C.shoesLn, L, { lw: _anLW(1.4), poly: false, off: .03 });
  if (heel) {   // the stiletto
    const h0 = _anPG(B, R([0, .07, -.05]), psi), h1 = _anPG(B, [A.A[0], B.ground, A.A[2] - .06], psi);
    _anPaint([[h0[0] - .022, h0[1]], [h0[0] + .022, h0[1]], [h1[0] + .008, h1[1]], [h1[0] - .008, h1[1]]], C.shoes, null, C.shoesLn, L, { lw: _anLW(1.1), poly: true });
  }
  // a little shine
  const s0 = _anPG(B, R([0, .0, f * .5]), psi); _AN.c.fillStyle = 'rgba(255,255,255,.35)'; _AN.c.fill(_anEllP(s0[0], s0[1] - .01, .04, .012));
}
function _anHull(P) {
  const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function _anLeg(D, B, A, psi, L, P, kind) {
  const C = _anOutfitCols(D), w = B.legW, pg = p => _anPG(B, p, psi);
  const H2 = pg(A.H), K2 = pg(A.K), A2 = pg(A.A);
  const lw = _anLW(1.7);
  if (kind === 'skin') _anLimb([_anCapsule(H2, K2, w[0] / 2, w[1] / 2, .05), _anCapsule(K2, A2, w[2] / 2, w[3] / 2, .14)], D.skin, D.skinSh, D.skinLn, L, lw);
  else {
    const pw = D.m ? [w[0] * 1.15, w[1] * 1.3, w[2] * 1.15, w[3] * 1.65] : [w[0] * 1.06, w[1] * 1.15, w[2] * 1.02, w[3] * 1.25];
    _anLimb([_anCapsule(H2, K2, pw[0] / 2, pw[1] / 2, .02), _anCapsule(K2, A2, pw[2] / 2, pw[3] / 2, 0)], C.pants, C.pantsSh, C.pantsLn, L, lw, { rim: P.rim });
    _anTaper([[lerp(H2[0], K2[0], .3), lerp(H2[1], K2[1], .3)], K2, [lerp(K2[0], A2[0], .9), lerp(K2[1], A2[1], .9)]], _anTp(.2, .2, 0, _anLW(.9), 0), _anA(C.pantsLn, .5));
  }
  _anShoe(D, B, A, psi, L, C);
}
// Lower garment slices (skirt, coat tails): from the hips to the hem, flaring.
function _anSkirtAt(D, B, hem, flare, sit = 0, lap = 0) {
  const w = _anSlice(B, B.waistY), h = _anSlice(B, B.hipY);
  return y => {
    if (y <= B.waistY) return [y, w[1] * .93, w[2] * .93, w[3]];   // a little inside the torso, so its top hides under it
    if (y <= B.hipY) { const k = ease((y - B.waistY) / (B.hipY - B.waistY)); return [y, lerp(w[1] * .93, h[1] * 1.05, k), lerp(w[2] * .93, h[2] * 1.05, k), lerp(w[3], h[3], k)]; }
    const k = clamp((y - B.hipY) / (hem - B.hipY)), e = Math.pow(k, 1.4), fw = sit * lap * ease(clamp((y - B.hipY) / .35));
    return [y, h[1] * 1.05 + flare * e, h[2] * 1.05 + flare * .8 * e + sit * .12 * (1 - k), h[3] + .02 * e + fw];
  };
}
function _anSkirt(D, B, P, psi, L, o) {
  const c = _AN.c, C = _anOutfitCols(D), { hem, flare, col, sh, ln, open, folds } = o, slAt = _anSkirtAt(D, B, hem, flare, o.sit || 0, o.lap || 0);
  const lw = _anLW(1.8), y0 = B.waistY - .02;
  const sway = P.walk != null ? Math.sin(P.walk * TAU) * .04 : 0;
  // silhouette, with the hem following the ground perspective (front of the hem lower), and the hem's back edge
  const n = 16, Lp = [], Rp = [];
  for (let i = 0; i <= n; i++) {
    const y = lerp(y0, hem, i / n), sl = slAt(y), e = Math.hypot(sl[1] * Math.cos(psi), sl[2] * Math.sin(psi)), x0 = sl[3] * Math.sin(psi) + sway * Math.pow(i / n, 2);
    Lp.push([x0 - e, y]); Rp.push([x0 + e, y]);
  }
  const hemS = slAt(hem), [l0, l1] = _anLimbs(hemS, psi), front = [], back = [];
  for (let i = 0; i <= 24; i++) {
    const th = lerp(l0, l1, i / 24), p = _anSurf(hemS, th, psi), q = _anSurf(hemS, th + Math.PI, psi), wv = .012 * Math.sin(th * 9 + 1);
    front.push([p[0] + sway, p[1] + p[2] * _anElev(B, hem) + wv]); back.push([q[0] + sway, q[1] + q[2] * _anElev(B, hem)]);
  }
  const outline = Lp.concat(front.slice(1, -1), Rp.reverse());
  // the inside of the skirt seen under the back hem
  const inner = front.concat(back.slice().reverse().slice(1, -1));
  c.fillStyle = _anShade(sh, .3, .1, .1); c.fill(celPoly(inner));
  const p = _anPaint(outline, col, sh, ln, L, { lw, rim: P.rim, off: .1 });
  c.save(); c.clip(p);
  // folds: soft cel shadow wedges fanning from the hips, and fold lines
  for (let i = 0; i < folds; i++) {
    const th = lerp(-1.35, 1.35, (i + .5) / folds) + (hash(i * 3.3 + D.seed) - .5) * .2, wdt = .08 + .06 * hash(i * 1.9);
    const top = _anSurf(slAt(B.hipY + .2), th * .45, psi), b1 = _anSurf(hemS, th, psi), b2 = _anSurf(hemS, th + wdt, psi);
    if (b1[2] < 0 && b2[2] < 0) continue;
    const pg = q => [q[0] + sway, q[1] + q[2] * _anElev(B, hem)];
    c.fillStyle = _anA(sh, .85); c.fill(celPoly([[top[0], top[1]], pg(b1), pg(b2)]));
    _anTaper([[top[0], top[1]], [lerp(top[0], pg(b1)[0], .55) + .01, lerp(top[1], pg(b1)[1], .55)], pg(b1)], _anTp(.4, .2, 0, _anLW(1.1), _anLW(.8)), _anA(ln, .45));
  }
  if (open) {   // a front opening (long coats): the gap shows what is under
    const gap = [];
    for (let i = 0; i <= 10; i++) { const y = lerp(B.waistY + .05, hem, i / 10), w = .03 + open * Math.pow(i / 10, .9), q = _anSurf(slAt(y), -w, psi); gap.push([q[0] + sway * Math.pow(i / 10, 2), q[1] + q[2] * _anElev(B, y)]); }
    for (let i = 10; i >= 0; i--) { const y = lerp(B.waistY + .05, hem, i / 10), w = .03 + open * Math.pow(i / 10, .9), q = _anSurf(slAt(y), w, psi); gap.push([q[0] + sway * Math.pow(i / 10, 2), q[1] + q[2] * _anElev(B, y)]); }
    if (o.under) { c.save(); c.clip(celPoly(gap)); o.under(); c.restore(); }
    _anTaper(gap.slice(0, 11), _anTp(.05, .05, _anLW(1.6), _anLW(1.6), _anLW(1)), ln); _anTaper(gap.slice(11), _anTp(.05, .05, _anLW(1), _anLW(1.6), _anLW(1.6)), ln);
  }
  c.restore();
  return p;
}

// ======================================================================================================== public
const _AN_VIEWQ = { front: 0, q: .5, side: 1, qback: 1.5, back: 2 };
const _anW4 = a => a - 4 * Math.round(a / 4);            // wrap a heading (quarter turns) into [-2, 2]
const _anNear = (a, ref) => ref + _anW4(a - ref);         // the equivalent of heading a nearest to ref
const _anHeadingOf = v => typeof v === 'number' && isFinite(v) ? v : (_AN_VIEWQ[v] ?? 0);
function _anPose(P) {
  let yaw = P.yaw != null ? P.yaw : _anHeadingOf(P.view);
  if (P.flip) yaw = -yaw;
  return _anW4(yaw);
}
// Everything one character needs for a frame: design, face, head geometry, hair, light (in head space).
// bust: the body turns less than the head (bodyYaw = h - 25deg sin h), unless pose.bodyYaw is given.
function _anPrep(design, P, m, bust = false) {
  const D = _anD(design), F = _anFaceOf(P, D), f = P.flip ? -1 : 1, yaw = _anPose(P);
  const hy = P.headYaw != null ? _anNear(P.headYaw * f, yaw) : yaw;
  let by = P.bodyYaw != null ? _anNear(P.bodyYaw * f, yaw) : yaw;
  if (bust && P.bodyYaw == null) by = yaw - (25 / 90) * Math.sin(yaw * Math.PI / 2);
  const G = _anHeadGeo(D, hy), tilt = (P.tilt || 0) + F.headTilt;
  const Lb = _anLocalLight(m, P.light, 0), Lh = _anLocalLight(m, P.light, tilt);
  const Pp = { ...P, hairYaw: P.hairYaw != null ? _anNear(P.hairYaw * f, hy) : hy };
  const H = _anHair(D, Pp, G, hy, F, Lh);
  return { D, F, G, H, yaw: by, hy, tilt, Lb, Lh, psi: by * Math.PI / 2, B: _anBody(D) };
}
function animeHead(x, y, u, design, pose = {}) {
  pose = _anSan(pose);
  push(); translate(x, y); scale(u);
  _anRun((c, m) => {
    const Q = _anPrep(design, pose, m);
    _anHeadDraw(Q.D, pose, Q.F, Q.G, Q.Lh, { hair: Q.H, stage: 'back' });
    if (pose.neck !== false) {
      c.save(); c.beginPath(); c.rect(-2, -2, 4, 2.75); c.clip();   // a short neck stub
      _anHeadDraw(Q.D, pose, Q.F, Q.G, Q.Lh, { hair: Q.H, stage: 'neck' });
      c.restore();
    }
    _anHeadDraw(Q.D, pose, Q.F, Q.G, Q.Lh, { hair: Q.H, stage: 'head', tilt: Q.tilt });
  });
  pop();
}
// Body + head, in body space (origin = base of the neck). full: legs and lower garments too.
function _anFigure(Q, P, full) {
  const { D, F, G, H, B, psi, Lb, Lh } = Q, c = _AN.c, t = P.t || 0, C = _anOutfitCols(D), ty = D.outfit.type;
  const breath = Math.sin(TAU * t / 3.6) * .008, hn = B.hn;
  // legs first: sitting lowers the whole figure so the feet stay on the ground; a walk or stance shifts only the legs
  const sitK = full ? clamp(P.sit || 0) : 0; let legs = null, drop = 0;
  if (full) {
    legs = [-1, 1].map(s => _anLegSolve(B, s, P.walk, P.stance ?? 1, sitK, P.seat));
    drop = Math.max(...legs.map(l => l.A[1])) - B.ankle;
    if (sitK > 0) c.translate(0, -drop);
    else for (const l of legs) for (const k of ['H', 'K', 'A']) l[k] = [l[k][0], l[k][1] - drop, l[k][2]];
    legs.sort((a, b) => _anP3(a.K, psi)[2] - _anP3(b.K, psi)[2]);
  }
  const arms = ['R', 'L'].map(s => { const A = _anArmSolve(B, s, s === 'R' ? (P.armR || 'down') : (P.armL || 'down'), t, psi); A.d = _anP3(_an3.add(A.E, A.S), psi)[2] / 2; A.face = A.W[1] < .1 && _anP3(A.W, psi)[2] > .15; A.side = s; return A; });
  const behind = arms.filter(A => A.d < -.14 && !A.face), front = arms.filter(A => A.d >= -.14 && !A.face).sort((a, b) => a.d - b.d), faceA = arms.filter(A => A.face);
  const headAt = fn => { c.save(); c.translate(0, -hn - breath * .6); fn(); c.restore(); };
  // the upper body sways over the weight leg, and half way up from a seat it leans over the feet (about the hips)
  const sway = full && P.walk == null ? (P.stance ?? 1) * (1 - sitK) : 0, rise = .32 * Math.sin(Math.PI * sitK) * Math.sin(psi), cs = Math.cos(psi);
  const upper = fn => { c.save(); if (sway || rise) { c.translate(-.045 * sway * cs, 0); c.translate(0, B.hipY); c.rotate(.025 * sway * cs + rise); c.translate(0, -B.hipY); } fn(); c.restore(); };
  // 1. arms behind the body, hair behind everything
  upper(() => { for (const A of behind) _anArm(D, B, A, psi, Lb, P); headAt(() => _anHeadDraw(D, P, F, G, Lh, { hair: H, stage: 'back' })); });
  // 2. legs and the lower garment
  const yb = ty === 'gown' || ty === 'dress' ? B.waistY + .04 : ty === 'shirt' ? B.waistY + .12 : B.waistY + .08;
  if (full) {
    const legKind = ty === 'dress' ? 'skin' : 'pants', kY = Math.max(legs[0].K[1], legs[1].K[1]), gY = B.ground + (sitK > 0 ? drop : 0);
    const hemAt = (stand, seated) => lerp(stand, seated, ease(sitK)), lap = (B.knee - B.hipY) * .85, sk = { sit: sitK, lap };
    const drawLegs = () => {
      for (const l of legs) _anLeg(D, B, l, psi, Lb, P, legKind);
      // the seat of the trousers over the tops of the legs (their round caps would show as bumps), open at the bottom
      if (legKind === 'pants') { const sl = y => { const a = _anSlice(B, y); return y > B.hipY ? [y, a[1] * (1 - .25 * (y - B.hipY) / (B.crotch - B.hipY)), a[2], a[3]] : a; }; _anPaint(_anSil(sl, B.waistY - .05, B.crotch - .02, psi, 10), C.pants, C.pantsSh, C.pantsLn, Lb, { lw: _anLW(1.7), poly: true, skip: [10, 11] }); }
    };
    if (ty === 'gown') { for (const l of legs) _anShoe(D, B, l, psi, Lb, C); _anSkirt(D, B, P, psi, Lb, { hem: hemAt(B.ground - .03, gY - .08), flare: D.m ? .4 : .5, col: C.col, sh: C.sh, ln: C.ln, folds: 7, ...sk }); }
    else if (ty === 'robe') { drawLegs(); _anSkirt(D, B, P, psi, Lb, { hem: hemAt(B.ground - .2, gY - .3), flare: .25, col: C.col, sh: C.sh, ln: C.ln, folds: 5, ...sk }); }
    else if (ty === 'dress') { drawLegs(); _anSkirt(D, B, P, psi, Lb, { hem: hemAt(B.knee + .1, kY + .35), flare: .3, col: C.col, sh: C.sh, ln: C.ln, folds: 5, ...sk }); }
    else if (ty === 'coat') { drawLegs(); _anSkirt(D, B, P, psi, Lb, { hem: D.outfit.long ? hemAt(B.ground - 1.05, kY + .8) : hemAt(B.knee + .55, kY + .3), flare: D.outfit.long ? .3 : .3, col: C.col, sh: C.sh, ln: C.ln, folds: D.outfit.long ? 4 : 3, open: D.outfit.long ? .8 : .1, under: drawLegs, ...sk }); }
    else drawLegs();
  }
  // 3. neck, torso; 4. arms in front, head (the collar's back, seen from behind, goes on after the neck), hands at the face
  upper(() => {
    c.save(); c.translate(0, breath); _anCollarBehind(D, B, psi, Lb); c.restore();
    headAt(() => _anHeadDraw(D, P, F, G, Lh, { hair: H, stage: 'neck' }));
    const bodyT = c.getTransform(), open = ty === 'gown' || ty === 'dress';
    const neckClip = hn + breath * .6 + (open ? .1 : -.1), afterNeck = () => { c.save(); c.setTransform(bodyT); c.translate(0, breath); _anTorsoBack(D, B, psi, Lb); c.restore(); };
    c.save(); c.translate(0, breath); _anTorso(D, B, P, psi, Lb, yb);
    if (D.acc.necklace) _anNecklace(D, B, psi, Lb);
    c.restore();
    for (const A of front) _anArm(D, B, A, psi, Lb, P);
    headAt(() => _anHeadDraw(D, P, F, G, Lh, { hair: H, stage: 'head', tilt: Q.tilt, neckClip, afterNeck }));
    for (const A of faceA) _anArm(D, B, A, psi, Lb, P);
  });
}
function _anNecklace(D, B, psi, L) {
  const slAt = y => _anSlice(B, y), pts = _anSurfLine(slAt, psi, [[-.42, .02], [-.2, .2], [0, .3], [.2, .2], [.42, .02]], 6);
  if (D.acc.necklace === 'choker') return;   // drawn on the neck
  if (D.acc.necklace === 'pearls') {
    const c = _AN.c, Q = _anDense(pts, false, 4); let acc = 0;
    for (let i = 1; i < Q.length; i++) { acc += Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]); if (acc < .045) continue; acc = 0; const [x, y] = Q[i];
      c.fillStyle = '#F4EEF0'; c.fill(_anEllP(x, y, .02, .02)); c.strokeStyle = '#A89AA8'; c.lineWidth = _anLW(.8); c.stroke(_anEllP(x, y, .02, .02)); c.fillStyle = '#FFFFFF'; c.fill(_anEllP(x - .006, y - .006, .006, .006)); }
    return;
  }
  if (pts.length > 1) _anTaper(pts, () => _anLW(1.3), '#C9A24A');
  const p = _anSurf(slAt(.34), 0, psi);
  if (p[2] > 0 && D.acc.necklace === 'pendant') { _anPaint(_anGemPts(p[0], p[1] + .02, .04), D.acc.gem, _anShade(D.acc.gem), _anLine(D.acc.gem), L, { lw: _anLW(1), off: .015 }); _AN.c.fillStyle = 'rgba(255,255,255,.9)'; _AN.c.fill(_anEllP(p[0] - .012, p[1] - .005, .008, .012)); }
}
function animeBust(x, y, u, design, pose = {}) {
  pose = _anSan(pose);
  push(); translate(x, y); scale(u * (pose.scale || 1), u);
  _anRun((c, m) => {
    const Q = _anPrep(design, pose, m, true), cut = pose.cut ?? 1.1;
    c.save(); c.beginPath(); c.rect(-6, -6, 12, 6 + cut); c.clip();   // a bust ends at the chest: a clean frame-like cut
    if (pose.lean) { c.translate(0, 1.2); c.rotate(pose.lean); c.translate(0, -1.2); }
    _anFigure(Q, pose, false);
    c.restore();
  });
  pop();
}
function animeChar(x, y, u, design, pose = {}) {
  pose = _anSan(pose);
  push(); translate(x, y); scale(u * (pose.scale || 1), u);
  _anRun((c, m) => {
    const Q = _anPrep(design, pose, m), B = Q.B;
    if (!pose.noShadow) { const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(40,30,60,.28)'); g.addColorStop(.7, 'rgba(40,30,60,.16)'); g.addColorStop(1, 'rgba(40,30,60,0)'); c.save(); c.scale(1.1, .2); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.restore(); }
    c.translate(0, -B.ground);
    const walkBob = pose.walk != null ? -Math.abs(Math.sin(pose.walk * TAU)) * .05 : 0;
    c.translate(0, walkBob);
    if (pose.lean) { c.translate(0, B.ground); c.rotate(pose.lean); c.translate(0, -B.ground); }
    _anFigure(Q, pose, true);
  });
  pop();
}

// Where things are on a character, in the same coordinates as the call's (x, y) (so inside the same camBegin):
//   animeAnchors(x, y, u, design, pose, 'char' | 'bust' | 'head') ->
//   { head (centre), top (crown), chin, eyeL, eyeR, eyeNear, mouth, neck (base), handL, handR (wrists), ground }
// Use them to frame a camera on the face, put a sparkle on the winking eye, a sweat drop, a speech bubble or a prop.
// They follow the heading, nod, tilt, sitting and the arms; the subtle sway, breath and lean are ignored (< 2% u).
function animeAnchors(x, y, u, design, pose = {}, mode = 'char') {
  pose = _anSan(pose);
  const D = _anD(design), F = _anFaceOf(pose), f = pose.flip ? -1 : 1, yaw = _anPose(pose), B = _anBody(D);
  const hy = pose.headYaw != null ? _anNear(pose.headYaw * f, yaw) : yaw;
  let by = pose.bodyYaw != null ? _anNear(pose.bodyYaw * f, yaw) : yaw;
  if (mode === 'bust' && pose.bodyYaw == null) by = yaw - (25 / 90) * Math.sin(yaw * Math.PI / 2);
  const G = _anHeadGeo(D, hy), psi = by * Math.PI / 2, sx = mode === 'head' ? 1 : (pose.scale || 1);
  const nod = clamp((pose.nod || 0) + (pose.turnNod || 0) + F.headNod, -1, 1), dy = nod * .03, tilt = (pose.tilt || 0) + F.headTilt;
  // the neck base (body origin) in the call's local units
  let bx = 0, byy = 0;
  if (mode === 'char') {
    const sit = clamp(pose.sit || 0); byy = -B.ground + (pose.walk != null ? -Math.abs(Math.sin(pose.walk * TAU)) * .05 : 0);
    if (sit > 0) { const legs = [-1, 1].map(s => _anLegSolve(B, s, pose.walk, pose.stance ?? 1, sit, pose.seat)); byy -= Math.max(...legs.map(l => l.A[1])) - B.ankle; }
  }
  const hx0 = bx, hy0 = mode === 'head' ? 0 : byy - B.hn;
  const H = (lx, ly) => { const c = Math.cos(tilt), s = Math.sin(tilt), yy = ly - .32; return [x + u * sx * (hx0 + lx * c - yy * s), y + u * (hy0 + .32 + lx * s + yy * c)]; };
  const Bp = (px, py) => [x + u * sx * (bx + px), y + u * (byy + py)];
  const eR = G.mir ? G.eyeF : G.eyeN, eL = G.mir ? G.eyeN : G.eyeF, hand = side => { const A = _anArmSolve(B, side, side === 'R' ? (pose.armR || 'down') : (pose.armL || 'down'), pose.t || 0, psi), w = _anP3(A.W, psi); return Bp(w[0], w[1]); };
  return { head: H(0, 0), top: H(0, -.5), chin: H(G.R[12][0], G.R[12][1] + dy), eyeR: H(eR.x, eR.y + dy), eyeL: H(eL.x, eL.y + dy), eyeNear: H(G.eyeN.x, G.eyeN.y + dy),
           mouth: H(G.mouth.x, G.mouth.y + dy), neck: mode === 'head' ? H(0, .86) : Bp(0, 0), handR: mode === 'head' ? null : hand('R'), handL: mode === 'head' ? null : hand('L'), ground: mode === 'char' ? [x, y] : null };
}

// ======================================================================================================== acting
// How big the head's reaction is when animeAct switches INTO an expression (default .15).
const _AN_TAKE = { surprised: 1, shocked: 1.25, scared: .9, furious: .8, angry: .55, laugh: .5, grin: .35, wink: .4, confident: .35, determined: .45, cry: .45, menacing: .4, sad: .2 };
// Each expression's idle motion: small head / eye offsets as pure functions of t, so a held face is never frozen.
const _AN_IDLE = {
  laugh:    t => ({ headNod: .09 * Math.abs(Math.sin(t * TAU * 2.6)) - .05, headTilt: .03 * Math.sin(t * TAU * 1.3) }),
  cry:      t => ({ headNod: .07 * Math.pow(Math.max(0, Math.sin(t * TAU * 1.6)), 3) }),
  furious:  t => ({ headTilt: .012 * Math.sin(t * TAU * 11), lookX: .02 * Math.sin(t * TAU * 17) }),
  shocked:  t => ({ lookX: .04 * Math.sin(t * TAU * 13) }),
  scared:   t => ({ headTilt: .012 * Math.sin(t * TAU * 9), lookX: .2 * Math.sign(Math.sin(t * 2.4)) }),
  pained:   t => ({ headTilt: .01 * Math.sin(t * TAU * 7) }),
  shy:      t => ({ lookX: .08 * Math.sin(t * TAU * .7) }),
  thinking: t => ({ headTilt: .02 * Math.sin(t * TAU * .4) }),
  smug:     t => ({ headTilt: .012 * Math.sin(t * TAU * .5) }),
  sad:      t => ({ headNod: .025 * Math.sin(t * TAU * .3) }),
  tender:   t => ({ headTilt: .015 * Math.sin(t * TAU * .35) }),
};
const _anIdle = (name, t) => (_AN_IDLE[name] ? _AN_IDLE[name](t) : null);
const _anBump = (t, a, b, c) => t <= a || t >= c ? 0 : t < b ? ease((t - a) / (b - a)) : 1 - ease((t - b) / (c - b));
// Acted expression changes, like clawd.js emotions(): keys = [[t0, 'expr', {overrides}], ...] (overrides are face
// numbers: open, browY, lookX...). Around each change the eyes lead (the look moves first), a blink covers the swap of
// the eye shapes (a wink closes just the one eye instead), the brows ease in with overshoot, the mouth follows a beat
// later, the head dips in anticipation and settles with a spring. Going wide-eyed (surprised, shocked, scared) is a
// TAKE instead: an anticipation squint, then the eyes pop, the head snaps back, the hair lifts and settles.
// Idle blinks (seeded by over.seed) are merged in, kept clear of the changes. Faces never snap.
// Spread the result into a pose:  animeBust(x, y, u, D, { ...animeAct(t, keys, { seed: 3 }), view: 'q', t })
// over: { take: scale of the head takes, seed } plus any pose fields to merge.
// Returns { face, blink, autoBlink: false, nod, tilt, pop, hairLift, ...over }.
function animeAct(t, keys, over = {}) {
  const { take: tkO, ...rest } = over || {}, tk = tkO ?? 1, seed = rest.seed ?? 0;
  if (!isFinite(t)) t = 0;
  if (!Array.isArray(keys) || !keys.length) return { face: { ..._AN_F0 }, blink: _anAutoBlink(t, seed), autoBlink: false, nod: 0, tilt: 0, pop: 0, hairLift: 0, ...rest };
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const face = k => ({ ..._AN_F0, ...(ANIME_EXPR[keys[k][1]] || {}), ...(keys[k][2] || {}) });
  const cur = face(i), tc = keys[i][0], age = t - tc, prev = i > 0 ? face(i - 1) : null;
  const tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity, next = i + 1 < keys.length ? face(i + 1) : null;
  const F = { ...cur }, wide = (a, b) => b.open > 1.1 && a.open <= 1.1, wink = (a, b) => Math.abs(a.winkL - b.winkL) + Math.abs(a.winkR - b.winkR) > .5;
  const T1 = (_AN_TAKE[keys[i][1]] ?? .15) * tk, Tn = next ? (_AN_TAKE[keys[i + 1][1]] ?? .15) * tk : 0;
  let blink = 0, nod = 0, sc = 0, lift = 0;
  if (prev) {
    const kEye = ease(seg(age, .02, .16)), kBrow = backOut(seg(age, 0, .34)), kMouth = easeOut(seg(age, .05, .3)), kSoft = ease(seg(age, 0, .5));
    const isWink = wink(prev, cur), isTake = wide(prev, cur);
    for (const f of _AN_EYEF) {
      if (f === 'winkL' || f === 'winkR' || f === 'happy') F[f] = isWink ? lerp(prev[f], cur[f], ease(seg(age, 0, .1))) : age < .04 ? prev[f] : cur[f];
      else F[f] = lerp(prev[f], cur[f], isWink || isTake ? ease(seg(age, 0, .2)) : kEye);
    }
    for (const f of _AN_BROWF) F[f] = lerp(prev[f], cur[f], kBrow);
    for (const f of _AN_MOUTHF) F[f] = lerp(prev[f], cur[f], kMouth);
    for (const f of ['blush', 'hatch', 'tears', 'sweat', 'shadowEyes', 'sparkleEyes', 'gloom', 'vein', 'chill', 'headNod', 'headTilt']) F[f] = lerp(prev[f], cur[f], kSoft);
    const kl = easeOut(seg(t, tc - .12, tc + .1)); F.lookX = lerp(prev.lookX, cur.lookX, kl); F.lookY = lerp(prev.lookY, cur.lookY, kl);
    if (!isWink && !isTake) blink = Math.max(blink, _anBump(t, tc - .07, tc + .02, tc + .13));   // a blink covers the swap
    if (isTake) {   // the take: eyes pop, irises shrink, brows jump, the head snaps back, the hair flies up and settles
      const d = Math.exp(-5 * age);
      F.open += .26 * d; F.iris *= 1 - .2 * d; F.pupil *= 1 - .35 * d; F.browY += .3 * d; F.mOpen += .12 * d;
      nod -= .4 * T1 * Math.exp(-6 * age) * Math.cos(10 * age);
      lift = T1 * Math.exp(-4.5 * age) * Math.max(0, Math.cos(7 * age)) * seg(age, 0, .05);
      sc = .045 * T1 * Math.exp(-7 * age) * Math.max(0, Math.cos(9 * age));
    } else {
      nod += -.3 * T1 * Math.exp(-6 * age) * Math.max(0, Math.cos(age * 11)) + .12 * T1 * spring(t, tc, 5, 14);
      sc = .03 * T1 * Math.exp(-7 * age) * Math.max(0, Math.cos(age * 9));
    }
  }
  if (next) {
    if (t > tn - .12) { const kl = easeOut(seg(t, tn - .12, tn + .1)); F.lookX = lerp(cur.lookX, next.lookX, kl); F.lookY = lerp(cur.lookY, next.lookY, kl); }
    const pre = seg(t, tn - .16, tn);
    if (wide(cur, next)) {   // anticipation of a take: the eyes squint, the brows pull down, the head dips
      F.open *= 1 - .4 * ease(pre); F.squint += .45 * ease(pre); F.browY -= .12 * ease(pre); F.browK += .2 * ease(pre);
      nod += .22 * Tn * Math.sin(Math.PI * .5 * pre);
    } else {
      if (!wink(cur, next)) blink = Math.max(blink, _anBump(t, tn - .07, tn + .02, tn + .13));
      nod += .14 * Tn * _anBump(t, tn - .2, tn - .03, tn + .03);
    }
  }
  // the expression's own idle motion, faded in with it
  const id1 = _anIdle(keys[i][1], t), id0 = prev ? _anIdle(keys[i - 1][1], t) : null, ki = prev ? ease(seg(age, 0, .4)) : 1;
  for (const [id, w] of [[id1, ki], [id0, 1 - ki]]) if (id && w > 0) for (const f in id) F[f] = (F[f] || 0) + id[f] * w;
  // idle blinks, never on top of an acted change
  let near = 9; for (const k of keys) near = Math.min(near, Math.abs(t - k[0]));
  if (near > .6 && F.open > .15 && F.winkL < .5 && F.winkR < .5) blink = Math.max(blink, _anAutoBlink(t, seed));   // (never during a wink)
  return { face: F, blink, autoBlink: false, nod, tilt: .04 * T1 * spring(t, tc + .05, 4, 9), pop: sc, hairLift: lift, ...rest };
}
// A turn from heading a0 to a1 (quarter turns: 0 front, .5 three-quarter, 1 profile, 2 back, negative = facing left;
// or view names) between t0 and t1. The eyes lead, the head turns a beat before the body, a blink lands mid-turn and
// the hair follows through (lags, overshoots, settles). Big turns (more than half a quarter turn) step on twos, the way
// a drawn turn is timed; small ones glide. The keys don't clash with animeAct's, so both spread into one pose:
//   { ...animeAct(t, keys), ...animeTurn(t, 1.5, 2.1, 'side', 'q'), t }   (lookLead adds to the look, turnBlink to the blink)
// Returns { yaw, headYaw, hairYaw, lookLead, turnBlink, turnNod }.
function animeTurn(t, t0, t1, a0, a1) {
  const A0 = _anHeadingOf(a0), A1 = _anHeadingOf(a1), dir = Math.sign(A1 - A0) || 1, big = Math.abs(A1 - A0) > .5;
  if (!isFinite(t)) t = 0;
  if (!(t1 > t0)) { const a = t >= t0 ? A1 : A0; return { yaw: a, headYaw: a, hairYaw: a, lookLead: 0, turnBlink: 0, turnNod: 0 }; }
  const d = t1 - t0, tq = big ? onTwos(t) : t;
  const headYaw = lerp(A0, A1, ease(seg(tq, t0, t1)));
  const yaw = lerp(A0, A1, ease(seg(tq, t0 + d * .12, t1 + d * .12)));
  const kH = ease(seg(t, t0 + d * .25, t1 + d * .3)), ov = (A1 - A0) * (big ? .16 : .22) * spring(t, t1 + d * .3, 5, 11);
  const hairYaw = headYaw + clamp(lerp(A0, A1, kH) + ov - headYaw, -.25, .25);   // the hair trails the head by at most .25 quarter turn
  const lookLead = dir * .75 * _anBump(t, t0 - .25, t0 + .02, t1 - d * .1);
  const turnBlink = _anBump(t, t0 + d * .28, t0 + d * .45, t0 + d * .64);
  const turnNod = (big ? .12 : .06) * Math.sin(Math.PI * seg(t, t0, t1));
  return { yaw, headYaw, hairYaw, lookLead, turnBlink, turnNod };
}
// Mouth flaps from word timings: words = [[word, start, end], ...] (like LYRICS[i].words) or [[start, end], ...].
// Opens on each syllable (vowel groups of the word, or one per ~.2 s), closes between words. Returns pose.talk in
// four steps (0, 1/3, 2/3, 1): anime lip flaps are a few held mouth drawings, not a smooth jaw.
function animeTalk(t, words) {
  if (!Array.isArray(words) || !isFinite(t)) return 0;
  for (const w of words) {
    if (!Array.isArray(w)) continue;
    const named = typeof w[0] === 'string', s0 = named ? w[1] : w[0], e0 = named ? w[2] : w[1], txt = named ? w[0] : null;
    if (!isFinite(s0) || !isFinite(e0) || t < s0 - .03 || t > e0 + .08) continue;
    if (t > e0) return Math.round(3 * .35 * (1 - (t - e0) / .08) ** 2) / 3;
    const syl = txt ? Math.max(1, (txt.toLowerCase().match(/[aeiouy]+/g) || []).length) : Math.max(1, Math.round((e0 - s0) / .2));
    const k = clamp((t - s0) / Math.max(.05, e0 - s0)), ph = k * syl, j = Math.min(syl - 1, Math.floor(ph)), f = ph - j;
    const amp = .55 + .45 * hash(j * 3.7 + s0 * 13.1);
    return Math.round(3 * amp * Math.pow(Math.sin(Math.PI * f), .7) * ease(seg(t, s0 - .03, s0 + .04))) / 3;   // 4 mouth drawings, like a lip flap
  }
  return 0;
}
