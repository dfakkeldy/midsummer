// screen.js: drawing helpers for small camera zooms and huge shapes, plus batched glows.
//
// p5.brush looks its flow field up with a stroke's LOCAL coordinates plus the matrix translation (not its scale), so a
// stroke whose local extent runs well past the canvas collapses to a dot at its first vertex: under a camera zoomed out
// to 0.03, an ink line of 2,400 world px is already gone. These helpers map the points through the current model
// matrix, clip them to the frame and draw in screen space, where the extent is at most the canvas. Weights stay in
// world units, as everywhere else. glows() draws many glow() dabs with one flush (glow() flushes every call, ~1 ms).
//
// Public:  screenLine(P, sw, col, br)   an ink line that never collapses (use under zooms below ~0.6)
//          screenPaint(P, o)            a painted polygon the same way (o as paint())
//          longLine(P, sw, col, br)     a line of any length: chunked, or drawn in screen space when it's huge
//          glows([[x, y, r, a], ...], col, steady)   many glow dabs, one flush
//          viewRect(margin)             the world rect the frame currently shows, for culling
// (Extracted from the "Put It in Writing" project's digits.js, where the props builder wrote them.)

const _scLen = P => { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; };
function _scCut(P, b, a = 0) {
  if (P.length < 2 || b <= a) return [];
  const out = []; let s = 0;
  for (let i = 1; i < P.length; i++) {
    const p = P[i - 1], q = P[i], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d === 0) continue;
    const s0 = s, s1 = s + d;
    if (s1 >= a && s0 <= b) {
      const k0 = clamp((a - s0) / d), k1 = clamp((b - s0) / d);
      const A = [lerp(p[0], q[0], k0), lerp(p[1], q[1], k0)], B = [lerp(p[0], q[0], k1), lerp(p[1], q[1], k1)];
      if (!out.length) out.push(A);
      out.push(B);
    }
    s = s1; if (s > b) break;
  }
  return out.length > 1 ? out : [];
}
function _scMat() {
  const r = window.p5 && p5.instance && p5.instance._renderer, m = r && r.uModelMatrix && r.uModelMatrix.mat4;
  return m ? { a: m[0], b: m[1], c: m[4], d: m[5], x: m[12] + W / 2, y: m[13] + H / 2 } : { a: 1, b: 0, c: 0, d: 1, x: 0, y: 0 };
}
const _scScale = (m = _scMat()) => Math.hypot(m.a, m.b) || 1;
const _scToS = (P, m = _scMat()) => P.map(([x, y]) => [m.a * x + m.c * y + m.x, m.b * x + m.d * y + m.y]);
function _scViewRect(margin = 80) {
  const m = _scMat(), det = m.a * m.d - m.b * m.c; if (!det) return null;
  const inv = ([X, Y]) => { const x = X - m.x, y = Y - m.y; return [(m.d * x - m.c * y) / det, (-m.b * x + m.a * y) / det]; };
  const C = [[-margin, -margin], [W + margin, -margin], [W + margin, H + margin], [-margin, H + margin]].map(inv);
  return [Math.min(...C.map(p => p[0])), Math.min(...C.map(p => p[1])), Math.max(...C.map(p => p[0])), Math.max(...C.map(p => p[1]))];
}
function _scInScreen(fn) { push(); resetMatrix(); translate(-W / 2, -H / 2); fn(); pop(); }
function _scClipRuns(P, R) {
  const [x0, y0, x1, y1] = R, runs = []; let cur = null;
  for (let i = 1; i < P.length; i++) {
    let [ax, ay] = P[i - 1], [bx, by] = P[i], t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay; let ok = true;
    for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dy, ay - y0], [dy, y1 - ay]]) {
      if (p === 0) { if (q < 0) { ok = false; break; } continue; }
      const r = q / p; if (p < 0) { if (r > t1) { ok = false; break; } if (r > t0) t0 = r; } else { if (r < t0) { ok = false; break; } if (r < t1) t1 = r; }
    }
    if (!ok) { cur = null; continue; }
    const A = [ax + dx * t0, ay + dy * t0], B = [ax + dx * t1, ay + dy * t1];
    if (!cur || t0 > 0) { cur = [A]; runs.push(cur); }
    cur.push(B); if (t1 < 1) cur = null;
  }
  return runs.filter(r => r.length > 1);
}
function _scLine(P, sw, col, br = 'ink', maxLen = 1400, screen = false) {
  if (P.length < 2) return;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const ext = Math.max(x1 - x0, y1 - y0);
  // a stroke this big in its own coordinates would collapse (see _scSLine): draw it in screen space instead
  if (!screen && ext > 1000) { _scSLine(P, sw, col, br); return; }
  // split only when the stroke spans more than about a canvas: each chunk's pressure taper would show as a seam
  const lim = maxLen * 1.3;
  if (ext <= lim) { inkLine(P, sw, col, br, 0); return; }
  const L = _scLen(P), n = Math.ceil(ext / lim);
  for (let i = 0; i < n; i++) { const c = _scCut(P, (i + 1) * L / n + sw * 2, i * L / n); if (c.length > 1) inkLine(c, sw, col, br, 0); }
}
function _scSLine(P, sw, col, br = 'ink') {
  if (P.length < 2) return;
  const m = _scMat(), sc = _scScale(m), S = _scToS(P, m);
  _scInScreen(() => { for (const run of _scClipRuns(S, [-60, -60, W + 60, H + 60])) _scLine(run, sw * sc, col, br, 1200, true); });
}
function _scSPaint(P, o = {}) {
  const m = _scMat(), sc = _scScale(m), S = _scToS(P, m);
  const Q = _scClipPoly(S, [-80, -80, W + 80, H + 80]); if (Q.length < 3) return;
  _scInScreen(() => paint(Q, { ...o, sw: (o.sw ?? 1) * sc }));
}
function _scClipPoly(P, R) {
  const [x0, y0, x1, y1] = R;
  const edge = (poly, inside, cut) => { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) out.push(cut(a, b)); } return out; };
  const lx = (a, b, x) => [x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])], ly = (a, b, y) => [a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y];
  let Q = P;
  Q = edge(Q, p => p[0] >= x0, (a, b) => lx(a, b, x0)); if (!Q.length) return Q;
  Q = edge(Q, p => p[0] <= x1, (a, b) => lx(a, b, x1)); if (!Q.length) return Q;
  Q = edge(Q, p => p[1] >= y0, (a, b) => ly(a, b, y0)); if (!Q.length) return Q;
  return edge(Q, p => p[1] <= y1, (a, b) => ly(a, b, y1));
}
function _scGlows(list, col, steady = false) {
  const L = list.filter(g => g[2] >= .5 && g[3] > .004); if (!L.length) return;
  flushBrush();
  const c = color(col), R = red(c), G = green(c), B = blue(c);
  push(); blendMode(ADD);
  for (const [x, y, r, a] of L) { const rr = r * (steady ? 1 : 1 + jit(.03)); tint(R, G, B, 150 * clamp(a)); image(glowTex, x - rr, y - rr, 2 * rr, 2 * rr); }
  noTint(); blendMode(BLEND); pop();
}

const screenLine = (P, sw, col, br = 'ink') => _scSLine(P, sw, col, br);
const screenPaint = (P, o = {}) => _scSPaint(P, o);
const longLine = (P, sw, col, br = 'ink') => _scLine(P, sw, col, br);
const glows = (list, col, steady = false) => _scGlows(list, col, steady);
const viewRect = (margin = 80) => _scViewRect(margin);
