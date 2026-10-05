// cel.js: the anime look's crisp layer: hard-edged cel paint, clean lineart, gradients, anime effects and post FX.
//
// Anime is two layers: painted backgrounds and crisp cels on top. Backgrounds can still be painted with p5.brush
// (paint(), inkLine(), glow()); characters, props, effects and title cards are drawn crisp with the cel*() functions
// here, on a Canvas2D layer that is composited into the frame IN DRAW ORDER: the layer is flushed into the frame before
// the next brush call, glow or letter, so a brush shape drawn after a cel covers it, exactly as you'd expect.
// Every cel call obeys the camera (camBegin) and any p5 push/translate/rotate/scale in force, like paint().
// The painted look never needs this file; it costs nothing unless a scene calls it.
//
//   cel(pts, o)                 one crisp shape: flat or gradient fill, hard cel shadow, highlight, screentone, outline
//   celLine(pts, w, col, o)     tapered lineart (thin-thick-thin), hair strands, lashes, folds, motion arcs
//   celEll / celRect / celPoly  shape helpers; celSpline(pts, closed) is a smooth Path2D through points
//   celClip(pts, fn)            clip everything drawn inside fn to a shape
//   celText(txt, x, y, size, o) title cards, name cards, SFX: crisp type with outline, gradient, skew, pop
//   effects: speedLines, streaks, sparkle(s), particles (petals, snow, rain, embers, confetti, dust), bokeh, godRays,
//            lensFlare, skyGrad, slashWipe, shapeWipe, screen tints
//   post(kind, amt, opt)        frame-wide post FX applied after the frame: invert (impact frames), mono, tint,
//                               aberration, bloom, letterbox, shake-free (screen space)
//   onThrees(t)                 hold each drawing for 3 frames (8 drawings a second): anime's limited animation

let CEL = null, CX = null, CEL_DIRTY = false, CEL_FLUSHES = 0;
const _celTmp = {};
function celInit() {
  CEL = createGraphics(W, H); CEL.pixelDensity(1); CX = CEL.drawingContext;
  CX.lineJoin = 'round'; CX.lineCap = 'round';
}

// Put the cel layer into the frame now (it's done for you before every brush call; call it yourself only if you draw
// with raw p5 between cel calls).
function celFlush() {
  if (!CEL_DIRTY) return; CEL_DIRTY = false; CEL_FLUSHES++;
  flushBrush();
  push(); resetMatrix(); translate(-W / 2, -H / 2); image(CEL, 0, 0); pop();
  CX.setTransform(1, 0, 0, 1, 0, 0); CX.clearRect(0, 0, W, H);
}
// Keep draw order: anything the brush paints flushes the cels drawn before it.
(() => {
  for (const name of ['paint', 'inkLine', 'glow', 'flushLetters', '_scLine', '_scGlows']) {
    const f = window[name]; if (typeof f !== 'function') continue;
    window[name] = function (...a) { celFlush(); return f.apply(this, a); };
  }
})();

// The current p5 transform (camera, push/translate/rotate/scale) as a Canvas2D transform.
function _celSync() {
  const m = _scMat(); CX.setTransform(m.a, m.b, m.c, m.d, m.x, m.y); return m;
}
const _celScale = () => _scScale(_scMat());
// Draw with the current p5 transform: fn(ctx, matrix). Use it for anything Canvas2D can do that the helpers don't.
// A throw inside fn still restores the context, so the rest of the frame keeps drawing.
function celDraw(fn) {
  if (!CX) return;
  CX.save(); try { const m = _celSync(); fn(CX, m); } finally { CX.restore(); CEL_DIRTY = true; }
}
// Screen space, whatever camera is active (overlays, title cards, effects).
function celScreen(fn) {
  if (!CX) return;
  CX.save(); try { CX.setTransform(1, 0, 0, 1, 0, 0); fn(CX); } finally { CX.restore(); CEL_DIRTY = true; }
}
// Clip every cel call inside fn to a shape (pts or Path2D, in world space under the current transform): a bust
// cropped by a window frame, a model-sheet cell, a character seen through a doorway. Only cel drawing is clipped;
// brush calls inside fn draw unclipped but keep their draw order (the layer is flushed first).
function celClip(pts, fn, smooth = false) {
  if (!CX) return fn();
  celFlush(); const path = _celPath(pts, smooth); CX.save();
  try { _celSync(); CX.clip(path); fn(); } finally { CX.restore(); CEL_DIRTY = true; }
}

// ---------- paths ----------
// Smooth Path2D through the points (Catmull-Rom as cubic Béziers; exact and crisp). closed joins the ends smoothly.
function celSpline(P, closed = true, tension = 1) {
  const p = new Path2D(), n = P.length; if (n < 2) return p;
  const at = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
  p.moveTo(P[0][0], P[0][1]);
  const segs = closed ? n : n - 1, k = tension / 6;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  if (closed) p.closePath();
  return p;
}
function celPoly(P, closed = true) {
  const p = new Path2D(); if (!P.length) return p;
  p.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) p.lineTo(P[i][0], P[i][1]); if (closed) p.closePath(); return p;
}
// pts may be a point list or a Path2D. smooth: true -> spline through the points.
const _celPath = (pts, smooth, closed = true) => pts instanceof Path2D ? pts : smooth ? celSpline(pts, closed, smooth === true ? 1 : smooth) : celPoly(pts, closed);

// Fill style from a colour or a gradient spec, built in the current (world) space:
//   '#hex' | { lin: [x0, y0, x1, y1], stops: [[0, '#..'], [1, '#..']] } | { rad: [x, y, r] or [x0, y0, r0, x1, y1, r1], stops }
function celStyle(s) {
  if (!s || typeof s === 'string') return s;
  let g;
  if (s.lin) g = CX.createLinearGradient(...s.lin);
  else if (s.rad) { const r = s.rad; g = r.length === 3 ? CX.createRadialGradient(r[0], r[1], 0, r[0], r[1], r[2]) : CX.createRadialGradient(...r); }
  else return s;
  for (const [o, c] of s.stops) g.addColorStop(clamp(o), c);
  return g;
}
// Screentone pattern (manga dots), cached per colour and size.
function _celTone(col, size = 6, r = .32) {
  const key = col + size + r; if (_celTmp[key]) return _celTmp[key];
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  x.fillStyle = col; x.beginPath(); x.arc(size / 2, size / 2, size * r, 0, TAU); x.fill();
  return (_celTmp[key] = CX.createPattern(c, 'repeat'));
}

// ---------- the cel shape ----------
// cel(pts, o): one crisp shape.
//   fill         colour or gradient spec (celStyle). Default none.
//   shade        hard-edged cel shadow colour, placed by ONE of:
//                  shadePts  a polygon (or Path2D) clipped to the shape (a shadow shape you design)
//                  shadeOff  [dx, dy]: everything NOT covered by the shape moved by (dx, dy): the classic crescent on
//                            the side away from the light (light from upper left -> shadeOff [-.12 w, -.1 h] or so)
//   shade2, shade2Pts / shade2Off   a second, deeper shadow tier (occlusion under hair, chin, sleeves)
//   hi, hiPts / hiOff   a hard highlight, the same way (hair sheen, lip gloss, metal)
//   tone         { col, size, r }: screentone dots inside the shape (or inside tonePts)
//   line, lw     outline colour and width in world units (it scales with the camera, like real lineart);
//                lwPx: width in screen pixels, whatever the zoom
//   smooth       true (or a tension): a smooth closed curve through the points
//   alpha        0..1;  blend: a canvas composite op ('screen', 'multiply', 'lighter'...)
//   open         true: don't close the outline (fills still close)
function cel(pts, o = {}) {
  if (!CX || (Array.isArray(pts) && pts.length < 2)) return;
  const path = _celPath(pts, o.smooth);
  CX.save(); const m = _celSync(), sc = Math.hypot(m.a, m.b) || 1;
  if (o.alpha != null) CX.globalAlpha = clamp(o.alpha);
  if (o.blend) CX.globalCompositeOperation = o.blend;
  if (o.fill) { CX.fillStyle = celStyle(o.fill); CX.fill(path); }
  const tier = (col, sp, off) => {
    if (!col || (!sp && !off)) return;
    CX.save(); CX.clip(path); CX.fillStyle = celStyle(col);
    if (sp) CX.fill(_celPath(sp, o.smooth));
    else {
      const q = new Path2D(); q.rect(-1e5, -1e5, 2e5, 2e5);
      q.addPath(path, new DOMMatrix([1, 0, 0, 1, off[0], off[1]])); CX.fill(q, 'evenodd');
    }
    CX.restore();
  };
  tier(o.shade, o.shadePts, o.shadeOff);
  tier(o.shade2, o.shade2Pts, o.shade2Off);
  tier(o.hi, o.hiPts, o.hiOff);
  if (o.tone) { CX.save(); CX.clip(path); CX.setTransform(1, 0, 0, 1, 0, 0); CX.fillStyle = _celTone(o.tone.col || '#000', o.tone.size || 6, o.tone.r || .32); CX.globalAlpha *= o.tone.a ?? .5; if (o.tonePts) { CX.setTransform(m.a, m.b, m.c, m.d, m.x, m.y); CX.clip(_celPath(o.tonePts, o.smooth)); CX.setTransform(1, 0, 0, 1, 0, 0); } CX.fillRect(0, 0, W, H); CX.restore(); }
  if (o.line) {
    CX.strokeStyle = celStyle(o.line); CX.lineWidth = o.lwPx != null ? o.lwPx / sc : (o.lw ?? 3);
    CX.lineJoin = 'round'; CX.lineCap = 'round';
    CX.stroke(o.open && !(pts instanceof Path2D) ? _celPath(pts, o.smooth, false) : path);
  }
  CX.restore(); CEL_DIRTY = true;
}
const celEll = (cx, cy, rx, ry, o = {}, rot = 0) => cel(_celEllPath(cx, cy, rx, ry, rot), o);
const celRect = (x, y, w, h, o = {}, r = 0) => { const p = new Path2D(); if (r) p.roundRect(x, y, w, h, r); else p.rect(x, y, w, h); cel(p, o); };
function _celEllPath(cx, cy, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot, 0, TAU); return p; }

// ---------- lineart ----------
// celLine(pts, w, col, o): a tapered stroke along a smooth path, filled as one shape (crisp at any zoom).
//   o.taper [a, b]: fraction of the length that tapers in at the start and out at the end (default [.25, .35]);
//   o.w1: width at the end if it differs (a hair strand: thick root, fine tip); o.smooth: false for straight segments;
//   o.lwPx: w in screen pixels; o.alpha; o.cap: round ends.
function celLine(P, w, col, o = {}) {
  if (!CX || P.length < 2) return;
  const C = o.smooth === false ? P : through(P, 8), n = C.length; if (n < 2) return;
  CX.save(); const m = _celSync(), sc = Math.hypot(m.a, m.b) || 1;
  const W0 = o.lwPx != null ? o.lwPx / sc : w, W1 = o.w1 != null ? (o.lwPx != null ? o.w1 / sc : o.w1) : W0;
  const [ta, tb] = o.taper || [.25, .35];
  let L = 0; const d = [0]; for (let i = 1; i < n; i++) { L += Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]); d.push(L); }
  const Lp = [], Rp = [];
  for (let i = 0; i < n; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], dd = Math.hypot(dx, dy) || 1;
    const u = L ? d[i] / L : 0, prof = Math.min(ta > 0 ? easeOut(u / ta) : 1, tb > 0 ? easeOut((1 - u) / tb) : 1);
    const hw = Math.max(.05, lerp(W0, W1, u) * (o.min != null ? lerp(o.min, 1, prof) : lerp(.12, 1, prof))) / 2;
    Lp.push([C[i][0] - dy / dd * hw, C[i][1] + dx / dd * hw]); Rp.push([C[i][0] + dy / dd * hw, C[i][1] - dx / dd * hw]);
  }
  if (o.alpha != null) CX.globalAlpha = clamp(o.alpha);
  if (o.blend) CX.globalCompositeOperation = o.blend;
  CX.fillStyle = celStyle(col); CX.fill(celPoly(Lp.concat(Rp.reverse())));
  if (o.cap) { const r0 = Math.hypot(Lp[0][0] - C[0][0], Lp[0][1] - C[0][1]); CX.beginPath(); CX.arc(C[0][0], C[0][1], r0, 0, TAU); CX.fill(); }
  CX.restore(); CEL_DIRTY = true;
}
// A plain uniform stroke (wires, rigging, ruled lines). lwPx for screen-pixel width.
function celStroke(P, lw, col, o = {}) {
  if (!CX || P.length < 2) return;
  CX.save(); const m = _celSync(), sc = Math.hypot(m.a, m.b) || 1;
  CX.strokeStyle = celStyle(col); CX.lineWidth = o.lwPx != null ? o.lwPx / sc : lw; CX.lineCap = o.cap || 'round'; CX.lineJoin = 'round';
  if (o.alpha != null) CX.globalAlpha = clamp(o.alpha);
  if (o.dash) CX.setLineDash(o.dash);
  CX.stroke(_celPath(P, o.smooth, false));
  CX.restore(); CEL_DIRTY = true;
}

// ---------- type: title cards, name cards, SFX ----------
// celText(txt, x, y, size, o): crisp lettering in the cel layer (so it sits in draw order; wipes drawn after cover it).
//   font (CSS family, default the title font), weight, fill (colour or gradient spec in text-local space: the text is
//   centred on 0,0), line + lw (outline, drawn under the fill), shadow [dx, dy, col], skew (radians, like italic SFX),
//   rot, pop (0..1 scale-in with overshoot), alpha, align ('center'|'left'|'right'), track (letter spacing px),
//   screen: true for screen space. Japanese SFX (ドン, ゴゴゴ) need a font with kana: ANIME_FONTS.sfx.
const ANIME_FONTS = { title: '"Dela Gothic One"', serif: '"Shippori Mincho B1"', sfx: '"Dela Gothic One"', sub: '"M PLUS Rounded 1c"', clean: '"Zen Kaku Gothic New"' };
function celText(txt, x, y, size, o = {}) {
  if (!CX) return;
  const k = o.pop != null ? backOut(o.pop) : 1; if (k <= .01) return;
  CX.save();
  if (o.screen) CX.setTransform(1, 0, 0, 1, 0, 0); else _celSync();
  CX.translate(x, y); CX.rotate(o.rot || 0); if (o.skew) CX.transform(1, 0, Math.tan(o.skew), 1, 0, 0); CX.scale(k, k);
  CX.globalAlpha = clamp(o.alpha ?? 1);
  CX.font = `${o.weight || 400} ${size}px ${o.font || ANIME_FONTS.title}, sans-serif`;
  if (o.track) CX.letterSpacing = o.track + 'px';
  CX.textAlign = o.align || 'center'; CX.textBaseline = 'middle'; CX.lineJoin = 'round';
  if (o.shadow) { CX.save(); CX.fillStyle = o.shadow[2] || '#000'; if (o.line) { CX.lineWidth = o.lw ?? size * .14; CX.strokeStyle = o.shadow[2] || '#000'; CX.strokeText(txt, o.shadow[0], o.shadow[1]); } CX.fillText(txt, o.shadow[0], o.shadow[1]); CX.restore(); }
  if (o.line) { CX.lineWidth = o.lw ?? size * .14; CX.strokeStyle = celStyle(o.line); CX.strokeText(txt, 0, 0); }
  CX.fillStyle = celStyle(o.fill || '#FFFFFF'); CX.fillText(txt, 0, 0);
  CX.restore(); CEL_DIRTY = true;
}

// ---------- effects ----------
// Drawings that change at 12 fps (anime effects animate on twos), as pure functions of t.
const _fx12 = t => Math.floor(t * 12 + 1e-6);
const onThrees = t => Math.floor(t * 8 + 1e-6) / 8;

// Focus lines (shūchūsen): radial wedges converging on (cx, cy), leaving a clear ellipse rx × ry. Screen space.
//   n count, col, a alpha, w max wedge half-width in degrees (default .9), seed
function speedLines(t, o = {}) {
  const cx = o.x ?? W / 2, cy = o.y ?? H / 2, rx = o.rx ?? 380, ry = o.ry ?? 260, n = o.n ?? 90, f = _fx12(t) + (o.seed || 0) * 97, R = Math.hypot(W, H);
  celScreen(c => {
    c.globalAlpha = clamp(o.a ?? .85); c.fillStyle = o.col || '#FFFFFF';
    for (let i = 0; i < n; i++) {
      const a = (i + hash(i * 3.1 + f * .37)) / n * TAU, w = (o.w ?? .9) * (.25 + hash(i * 7.7 + f)) * Math.PI / 180;
      const r0 = Math.hypot(Math.cos(a) * rx, Math.sin(a) * ry) * (1 + .35 * hash(i * 1.3 + f * .91));
      c.beginPath(); c.moveTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); c.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); c.fill();
    }
  });
}
// Parallel speed streaks (a dash, a fall, a background rushing past): angle in radians, screen space.
function streaks(t, ang = 0, o = {}) {
  const n = o.n ?? 60, f = _fx12(t) + (o.seed || 0) * 31, ca = Math.cos(ang), sa = Math.sin(ang);
  celScreen(c => {
    c.translate(W / 2, H / 2); c.rotate(ang); c.globalAlpha = clamp(o.a ?? .7); c.fillStyle = o.col || '#FFFFFF';
    for (let i = 0; i < n; i++) {
      const y = (hash(i * 5.3 + f * .13) - .5) * H * 1.6, len = (o.len ?? 500) * (.3 + hash(i * 2.9 + f)), x = (hash(i * 8.1 + f * .71) - .5) * W * 1.6, th = (o.w ?? 5) * (.4 + hash(i * 3.7));
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y - th / 2); c.lineTo(x + len, y + th / 2); c.closePath(); c.fill();
    }
  });
}
// Kira-kira sparkle: a four-point star with a soft core, at world (x, y), size r, k 0..1 (pop/twinkle). Uses the camera.
function sparkle(x, y, r, col = '#FFFFFF', k = 1, rot = 0) {
  if (k <= .01) return;
  celDraw(c => {
    c.translate(x, y); c.rotate(rot); const s = r * k;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, s * .9); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * .9, 0, TAU); c.fill();
    c.globalCompositeOperation = 'source-over'; c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? s * .12 : (i % 4 ? s * .55 : s); c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
    c.closePath(); c.fill();
  });
}
// Many sparkles twinkling around a point or over a region (beauty shots, magic, a reveal). Screen-stable per seed.
function sparkles(t, x, y, rx, ry, o = {}) {
  const n = o.n ?? 14;
  for (let i = 0; i < n; i++) {
    const ph = hash(i * 9.1 + (o.seed || 0)), k = Math.max(0, Math.sin((t * (o.speed ?? 1.4) + ph) * TAU)) ** 3;
    sparkle(x + (hash(i * 3.3 + 1) - .5) * 2 * rx, y + (hash(i * 4.7 + 2) - .5) * 2 * ry, (o.r ?? 26) * (.5 + hash(i * 6.1)), o.col || '#FFFFFF', k, hash(i) * .3);
  }
}
// Falling or drifting particles as a pure function of t, in screen space (or world with o.world).
//   kind: 'petals' (sakura), 'snow', 'rain', 'embers' (rise), 'confetti', 'dust' (motes in a light beam), 'bubbles'
//   n, col, size, speed, wind (px/s), area [x, y, w, h], a, seed
function particles(t, kind = 'petals', o = {}) {
  const n = o.n ?? 40, [ax, ay, aw, ah] = o.area || [-100, -100, W + 200, H + 200], sp = o.speed ?? 1, sd = o.seed || 0;
  const dir = kind === 'embers' || kind === 'bubbles' ? -1 : 1;
  const base = { petals: 120, snow: 70, rain: 1800, embers: 90, confetti: 260, dust: 12, bubbles: 80 }[kind] || 100;
  const draw = c => {
    c.globalAlpha = clamp(o.a ?? 1);
    for (let i = 0; i < n; i++) {
      const h1 = hash(i * 1.7 + sd), h2 = hash(i * 2.9 + sd + 3), h3 = hash(i * 4.1 + sd + 7), v = base * sp * (.6 + .8 * h2);
      const span = ah + 200, yy = ay + ((h1 * span + dir * v * t) % span + span) % span - 100;
      const xx = ax + ((h3 * aw + (o.wind ?? (kind === 'petals' ? 60 : 0)) * t + Math.sin(t * (1 + h2) + i) * (kind === 'rain' ? 0 : 30)) % aw + aw) % aw;
      const s = (o.size ?? { petals: 14, snow: 6, rain: 2, embers: 4, confetti: 10, dust: 2.5, bubbles: 10 }[kind]) * (.6 + .8 * h1);
      c.save(); c.translate(xx, yy);
      if (kind === 'petals') { c.rotate(t * (1 + h2 * 2) + i); c.scale(1, .55 + .45 * Math.sin(t * 3 + i)); c.fillStyle = o.col || '#FFC4D6'; c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * .9, -s * .2, 0, s); c.quadraticCurveTo(-s * .9, -s * .2, 0, -s); c.fill(); }
      else if (kind === 'rain') { c.strokeStyle = o.col || 'rgba(200,215,255,.55)'; c.lineWidth = s; c.beginPath(); c.moveTo(0, 0); c.lineTo(-(o.wind ?? 0) * .03, -s * 22); c.stroke(); }
      else if (kind === 'confetti') { c.rotate(t * 4 * (h2 - .5) + i); c.scale(1, Math.sin(t * 6 + i)); c.fillStyle = (o.cols || ['#FF5C8A', '#FFD84A', '#5CD6FF', '#9B7BFF', '#FFFFFF'])[i % (o.cols ? o.cols.length : 5)]; c.fillRect(-s / 2, -s / 4, s, s / 2); }
      else if (kind === 'bubbles') { c.strokeStyle = o.col || 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.stroke(); }
      else { c.fillStyle = o.col || (kind === 'embers' ? '#FFB347' : '#FFFFFF'); if (kind === 'embers' || kind === 'dust') c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(o.a ?? 1) * (kind === 'dust' ? .35 + .65 * Math.max(0, Math.sin(t * 1.3 + i)) : 1); c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); }
      c.restore();
    }
  };
  if (o.world) celDraw(draw); else celScreen(draw);
}
// Soft out-of-focus discs (night city lights, a dreamy beauty shot). Screen space; cols cycle.
function bokeh(t, o = {}) {
  const n = o.n ?? 18, cols = o.cols || ['#FFD9A0', '#FF9EC4', '#9EC9FF'];
  celScreen(c => {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const x = hash(i * 3.3 + (o.seed || 0)) * W + Math.sin(t * .3 + i) * 20, y = (o.y0 ?? 0) + hash(i * 5.1 + (o.seed || 0)) * (o.h ?? H), r = (o.r ?? 60) * (.4 + hash(i * 7.9));
      const g = c.createRadialGradient(x, y, r * .55, x, y, r); g.addColorStop(0, cols[i % cols.length]); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = (o.a ?? .28) * (.6 + .4 * Math.sin(t * .8 + i * 2)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
  });
}
// Light shafts from (x, y) (a window, a skylight, the sun through a canal): n rays fanning over `spread` radians toward
// `ang`, additive. Screen space.
function godRays(t, x, y, ang, o = {}) {
  const n = o.n ?? 7, spread = o.spread ?? .7, len = o.len ?? 1600, col = o.col || '255,236,190';
  celScreen(c => {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const a = ang + (i / Math.max(1, n - 1) - .5) * spread + Math.sin(t * .4 + i * 1.7) * .02, w = (o.w ?? .05) * (.5 + hash(i * 2.3));
      const g = c.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.addColorStop(0, `rgba(${col},${(o.a ?? .22) * (.5 + .5 * Math.sin(t * .7 + i))})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - w) * len, y + Math.sin(a - w) * len); c.lineTo(x + Math.cos(a + w) * len, y + Math.sin(a + w) * len); c.fill();
    }
  });
}
// Lens flare: a bright source at screen (x, y) with ghosts along the line through the frame centre. k 0..1.
function lensFlare(x, y, k = 1, o = {}) {
  if (k <= .01) return;
  celScreen(c => {
    c.globalCompositeOperation = 'lighter';
    const disc = (px, py, r, col, a) => { const g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${col},${a * k})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill(); };
    disc(x, y, (o.r ?? 220), '255,240,210', .9);
    c.fillStyle = `rgba(255,245,230,${.55 * k})`; c.fillRect(0, y - 1.5, W, 3);
    const dx = W / 2 - x, dy = H / 2 - y;
    [[.4, 40, '255,200,150', .35], [.8, 90, '160,200,255', .2], [1.25, 26, '255,160,220', .4], [1.6, 130, '180,255,220', .12], [2, 60, '255,220,160', .25]]
      .forEach(([f, r, col, a]) => disc(x + dx * f, y + dy * f, r, col, a));
  });
}
// A vertical (or angled) gradient over the whole screen: the anime sky. stops: [[0, '#top'], [1, '#bottom']].
function skyGrad(stops, ang = Math.PI / 2) {
  celScreen(c => {
    const dx = Math.cos(ang) * H / 2, dy = Math.sin(ang) * H / 2, g = c.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
    for (const [o, col] of stops) g.addColorStop(o, col);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  });
}
// A tint over the whole frame (a red alarm wash, a cold flashback, a sepia memory): a post op, applied after the frame.
// blend: 'multiply', 'screen', 'overlay', 'soft-light', 'color'...
const screenTint = (col, a = .3, blend = 'multiply') => post('tint', a, { col, blend });

// ---------- transitions ----------
// Diagonal slash wipe (anime eyecatch style): a band of colour crosses the frame (p 0 -> .5 covers, .5 -> 1 uncovers).
// Cut under full cover at p = .5. cols: [band, edge]. ang: the slash angle.
function slashWipe(p, cols = ['#14121C', '#FF4D6D'], ang = -.35) {
  if (p <= 0 || p >= 1) return;
  celScreen(c => {
    c.translate(W / 2, H / 2); c.rotate(ang);
    const D = Math.hypot(W, H), q = p < .5 ? easeOut(p * 2) : ease((p - .5) * 2);
    const x0 = p < .5 ? -D : lerp(-D, D, q), x1 = p < .5 ? lerp(-D, D, q) : D;
    c.fillStyle = cols[0]; c.fillRect(x0, -D, x1 - x0, 2 * D);
    c.fillStyle = cols[1]; const e = 26;
    if (p < .5) c.fillRect(x1 - e, -D, e, 2 * D); else c.fillRect(x0, -D, e, 2 * D);
  });
}
// Shape wipe: a star, heart, circle or diamond grows from (x, y) to reveal (k 0 -> 1) the shot under a colour.
function shapeWipe(k, x = W / 2, y = H / 2, kind = 'star', col = '#14121C') {
  if (k >= 1) return;
  const R = Math.hypot(W, H) * 1.2 * easeIn(clamp(k));
  celScreen(c => {
    const p = new Path2D(); p.rect(0, 0, W, H);
    if (R > 1) {
      const s = kind === 'heart' ? heartPts(x, y, R * .6) : kind === 'circle' ? ellPts(x, y, R, R, 48) : kind === 'diamond' ? starPts(x, y, R, .99, 2, -Math.PI / 2) : starPts(x, y, R, .45, 5, -Math.PI / 2);
      p.addPath(celPoly(s));
    }
    c.fillStyle = col; c.fill(p, 'evenodd');
  });
}

// ---------- post FX (applied to the whole frame after it's drawn, before captions and grain) ----------
// post('invert', k): impact frame (negative), k 0..1.     post('mono', k): drain the colour (a flashback, a shock).
// post('tint', a, {col, blend}).                          post('aberration', px): RGB split by px (impacts, glitches).
// post('bloom', a, {blur, thresh}): glow on bright areas.  post('letterbox', h): cinema bars of height h px (0..1 eased).
// post('flash', k, {col}): a full-frame flash of light.   post('vignette', a): darken the corners.
// Calls queue during the frame and apply in composite(), in order. The painted look can use them too.
let POSTQ = [];
function post(kind, amt = 1, opt = {}) { if (amt > .001) POSTQ.push([kind, amt, opt]); }
function _postScratch() {
  if (_celTmp.ps) return _celTmp.ps;
  const c = document.createElement('canvas'); c.width = W; c.height = H; return (_celTmp.ps = { c, x: c.getContext('2d') });
}
function applyPost(c) {
  const q = POSTQ; POSTQ = [];
  // a project-wide default (PROJECT.post = [['bloom', .35], ...]) applies first
  for (const [kind, amt, opt] of [...(PROJECT.post || []), ...q]) {
    const o = opt || {};
    c.save();
    if (kind === 'invert') { c.globalCompositeOperation = 'difference'; c.globalAlpha = clamp(amt); c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H); }
    else if (kind === 'mono') { c.globalCompositeOperation = 'saturation'; c.globalAlpha = clamp(amt); c.fillStyle = '#808080'; c.fillRect(0, 0, W, H); }
    else if (kind === 'tint') { c.globalCompositeOperation = o.blend || 'multiply'; c.globalAlpha = clamp(amt); c.fillStyle = o.col || '#FF3050'; c.fillRect(0, 0, W, H); }
    else if (kind === 'flash') { c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(amt); c.fillStyle = o.col || '#FFFFFF'; c.fillRect(0, 0, W, H); }
    else if (kind === 'vignette') { const g = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${clamp(amt)})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    else if (kind === 'letterbox') { const h = (o.h ?? 130) * ease(clamp(amt)); c.fillStyle = o.col || '#000000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h); }
    else if (kind === 'bloom') {
      const s = _postScratch(); s.x.save(); s.x.clearRect(0, 0, W, H);
      s.x.filter = `blur(${o.blur ?? 18}px) brightness(${o.bright ?? .9}) contrast(${o.thresh ?? 2.4})`; s.x.drawImage(c.canvas, 0, 0); s.x.restore();
      c.globalCompositeOperation = 'screen'; c.globalAlpha = clamp(amt); c.drawImage(s.c, 0, 0);
    } else if (kind === 'aberration') {
      const s = _postScratch(), d = amt;
      s.x.save(); s.x.globalCompositeOperation = 'copy'; s.x.drawImage(c.canvas, 0, 0); s.x.globalCompositeOperation = 'multiply'; s.x.fillStyle = '#FF0000'; s.x.fillRect(0, 0, W, H); s.x.restore();
      c.globalCompositeOperation = 'multiply'; c.fillStyle = '#00FFFF'; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter'; c.drawImage(s.c, d, 0);
    }
    c.restore();
  }
}
