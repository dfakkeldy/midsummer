// src/lib/cast.js — original cast sheet and the hand-built figure rig: heads, hair, hands, feet, limbs and bodies.
// Poses are joint lists in head-height units (pelvis at 0,0; y down); msFigure maps them to the canvas at scale s.
// Shared geometry (MS_INK, msMid, msAng, msOff, msDist, msDark, msTube, msRib, msEll, msPetalPts) comes from palette.js.
const MS_CAST = {
  titania: { skin: '#C9906B', skinSh: '#9A6243', hair: '#7A2C1C', hairLt: '#BE5A3C', hairDk: '#4A170E', brow: '#4E1C10', eye: '#7E6B2A', lip: '#A8403F',
    gown: '#B5176E', gownLt: '#E24FA3', gownDk: '#6C0B45', trim: '#E2B344', jewel: '#2FB9B5', shoe: '#D9A93C', foot: 'sandal', style: 'waves', circlet: true, face: 'oval' },
  helena: { skin: '#EFCBAE', skinSh: '#C98F6E', hair: '#D9A648', hairLt: '#F2D27A', hairDk: '#8E621C', brow: '#8A5A26', eye: '#5F7E9C', lip: '#C2606A',
    gown: '#1E3FA8', gownLt: '#4D6FD6', gownDk: '#0F2066', over: '#2FB7B2', overDk: '#157A78', trim: '#E2B344', sash: '#E2B344', jewel: '#1F3FA0', shoe: '#2A4BB0', foot: 'slipper', style: 'braid', freckles: true, face: 'long' },
  hermia: { skin: '#8A5A3A', skinSh: '#5C3721', hair: '#3B2416', hairLt: '#6E4529', hairDk: '#1E100A', brow: '#241409', eye: '#4A2A18', lip: '#9E4448',
    gown: '#118A5B', gownLt: '#3CB37E', gownDk: '#075238', trim: '#E2B344', sash: '#B8183A', jewel: '#C81E3A', shoe: '#3A7A54', foot: 'slipper', style: 'curls', face: 'angular' },
  puck: { skin: '#C8926A', skinSh: '#92603F', hair: '#2E1E16', hairLt: '#5A3E2E', hairDk: '#160C08', brow: '#241409', eye: '#4F6A2E', lip: '#8E5346',
    gown: '#6A3FA8', gownLt: '#9A6ED6', gownDk: '#3C1F6E', trim: '#1E8C86', leg: '#3F2A5C', legDk: '#261640', shoe: '#5A3A22', foot: 'boot', style: 'crop', ears: 'leaf', sleeve: '#6A3FA8', stubble: true, pattern: 'leaf', face: 'square' }
};
const MS_EYEW = '#F7EFE4';
// jaw width, chin width and face-height factor per face type
const MS_FACES = { oval: { jw: .33, cw: .14, fh: 1 }, long: { jw: .3, cw: .12, fh: 1.06 }, angular: { jw: .37, cw: .1, fh: 1 }, square: { jw: .37, cw: .19, fh: 1.02 } };
// Expression presets: brow (raise -1..1), browAsym (near-side brow extra), browIn (inner ends: + pleading, - knit), lids (0 open .. 1 closed),
// mouth { open, smile, press }, look [dx, dy] (-1..1 toward the eye corners).
const MS_EXPR = {
  calm: { brow: 0, lids: .15, mouth: { smile: .15 } },
  regal: { brow: .15, lids: .3, mouth: { smile: .3 } },
  attentive: { brow: .45, browAsym: .4, browIn: .2, lids: 0, mouth: { open: .4, smile: .05 } },
  firm: { brow: -.5, browIn: -.45, lids: .2, mouth: { smile: -.35, press: .8 } },
  plead: { brow: .35, browIn: .6, lids: .05, mouth: { open: .6, smile: -.1 } },
  amused: { brow: .2, browAsym: .3, lids: .3, mouth: { open: .1, smile: .65 } }
};
MS_EXPR.speak = MS_EXPR.plead;
const MS_ORDER = ['hairBack', 'armB', 'legB', 'legF', 'skirt', 'over', 'torso', 'drape', 'armF', 'head', 'hairFront', 'ears'];
const msK = s => clamp(s / 160, .6, 1.4);          // stroke weight scale for a head s px tall
const msT = (x, y, s) => j => [x + j[0] * s, y + j[1] * s];
const msPerp = (p, a, d) => msOff(p, a + Math.PI / 2, d);
const msInk = (kk, sw, col = MS_INK) => ({ ink: col, sw: sw * kk, br: 'inkfine' });
// A wavy hair strand line from (u0,v0) to (u1,v1) in head units through F.
function msStrand(F, u0, v0, u1, v1, amp, ph, col, sw) {
  const P = []; for (let i = 0; i <= 6; i++) { const q = i / 6; P.push(F(lerp(u0, u1, q) + Math.sin(q * 7 + ph) * amp * q, lerp(v0, v1, q))); }
  inkLine(P, sw, col, 'inkfine', .6);
}

// ---------- limbs ----------
// Painted limb: a tube along P, a shadow band on the `side` edge, a pale highlight on the other, a fine contour.
function msLimb(P, Ws, col, sh, side = 1, sw = .3, hi) {
  const tube = msTube(P, Ws), n = P.length, dir = i => msAng(P[Math.max(0, i - 1)], P[Math.min(n - 1, i + 1)]);
  paint(tube, { wash: col, ink: null, curv: .25 });
  if (sh) paint(msTube(P.map((p, i) => msOff(p, dir(i) + side * Math.PI / 2, Ws[i] * .3)), Ws.map(w => w * .36)), { wash: sh, washOp: 100, ink: null, curv: .25 });
  if (hi) inkLine(P.slice(0, n - 1).map((p, i) => msOff(p, dir(i) - side * Math.PI / 2, Ws[i] * .3)), .3, hi, 'inkfine', .5);
  paint(tube, { ink: MS_INK, sw, br: 'inkfine', curv: .25 });
}
// Direction of the outside of the bend at E (between A and B); a straight limb uses the side normal.
function msOut(A, E, B, side) { const a1 = msAng(E, A), a2 = msAng(E, B), vx = Math.cos(a1) + Math.cos(a2), vy = Math.sin(a1) + Math.sin(a2); return Math.hypot(vx, vy) < .3 ? msAng(A, B) - side * Math.PI / 2 : Math.atan2(-vy, -vx); }
// Crease on the outer side of a bent joint E between A and B.
function msJoint(E, A, B, s) {
  const a1 = msAng(E, A), a2 = msAng(E, B), vx = Math.cos(a1) + Math.cos(a2), vy = Math.sin(a1) + Math.sin(a2);
  if (Math.hypot(vx, vy) < .35) return;
  const a = Math.atan2(-vy, -vx);
  inkLine([msOff(E, a - .7, s * .09), msOff(E, a, s * .11), msOff(E, a + .7, s * .09)], .22 * msK(s), MS_INK, 'inkfine', .6);
}
// Hand at wrist w pointing along ang, as ONE silhouette (palm, four fingers, thumb) so the finger roots belong to the
// palm; separations, knuckles and the thumb crease are interior lines. h: { spread, curl, side (+1: thumb on the
// clockwise side of ang), len }.
function msHand(w, ang, s, c, h = {}) {
  const L = s * .2 * (h.len ?? 1), pw = s * .13, side = h.side ?? 1, spread = h.spread ?? .3, curl = h.curl ?? .15, kk = msK(s), n = ang + Math.PI / 2, shade = msDark(c.skinSh, .2);
  const A = (p, a, d) => msOff(p, a - side * Math.PI / 2, d), B = (p, a, d) => msOff(p, a + side * Math.PI / 2, d);
  const wA = msOff(w, n, -side * pw * .72), wB = msOff(w, n, side * pw * .72), P = [wA, msOff(msOff(w, ang, L * .4), n, -side * pw * .98), msOff(msOff(w, ang, L * .78), n, -side * pw * .92)];
  const seps = [], knu = [];
  for (let i = 0; i < 4; i++) {
    const q = (i - 1.5) / 1.5, fl = L * [.78, .93, 1, .95][i], fa = ang + side * q * spread * .5, fa2 = fa + curl * 1.2 * side;
    const b = msOff(msOff(w, ang, L * (.86 - .05 * Math.abs(q))), n, side * q * pw * .74), m = msOff(b, fa, fl * .52), e = msOff(m, fa2, fl * .48), wb = s * .058, wm = s * .052, wt = s * .04;
    const bA = A(b, fa, wb), mA = A(m, fa, wm);
    P.push(bA, mA, A(e, fa2, wt), msOff(e, fa2, wt * .8), B(e, fa2, wt), B(m, fa, wm), B(b, fa, wb));
    if (i > 0) seps.push([msOff(bA, ang, -s * .03), msMid(bA, mA, .55)]);
    knu.push([A(m, fa, wm * .6), B(m, fa, wm * .6)]);
  }
  const tb = msOff(msOff(w, ang, L * .22), n, side * pw * .92), ta = ang + side * (.95 - curl * .5), tm = msOff(tb, ta, L * .3), td = ang + side * (.4 - curl * .8), te = msOff(tm, td, L * .28), wT = s * .065, wT2 = s * .048;
  P.push(msOff(msOff(w, ang, L * .5), n, side * pw * .9), A(tm, ta, wT * .9), A(te, td, wT2), msOff(te, td, wT2 * .8), B(te, td, wT2), B(tm, ta, wT), B(tb, ta, wT * .9), wB);
  paint(P, { wash: c.skin, ...msInk(kk, .22), curv: .15 });
  paint([msOff(msOff(w, ang, L * .55), n, -side * pw * .8), msOff(msOff(w, ang, L * .85), n, -side * pw * .7), msOff(msOff(w, ang, L * .85), n, side * pw * .6), msOff(msOff(w, ang, L * .6), n, side * pw * .2)], { wash: c.skinSh, washOp: 70, ink: null, curv: .4 });
  for (const l of seps) inkLine(l, .16 * kk, shade, 'inkfine', .3);
  for (const l of knu) inkLine(l, .12 * kk, shade, 'inkfine', .3);
  inkLine([msOff(msOff(w, ang, L * .12), n, side * pw * .35), msOff(msOff(w, ang, L * .35), n, side * pw * .65), msOff(msOff(w, ang, L * .52), n, side * pw * .85)], .16 * kk, shade, 'inkfine', .5);
}
// Foot at ankle A, toes pointing along ang. f: { kind, sole (+1/-1 flips which side is the sole) }. K = the knee, for boot shafts.
function msFoot(A, ang, s, c, f = {}, K) {
  const kk = msK(s), kind = f.kind || c.foot, ua = [Math.cos(ang), Math.sin(ang)];
  let ud = [-ua[1], ua[0]]; const sg = f.sole ?? (ud[1] < -1e-6 ? -1 : 1); ud = [ud[0] * sg, ud[1] * sg];
  const L = (a, d) => [A[0] + (ua[0] * a + ud[0] * d) * s, A[1] + (ua[1] * a + ud[1] * d) * s];
  const foot = through([L(-.08, -.1), L(.1, -.07), L(.32, .01), L(.54, .07), L(.68, .13), L(.67, .21), L(.42, .23), L(.12, .22), L(-.1, .2), L(-.17, .07)], 3);
  const dk = msDark(c.shoe, .45), lt = mixCol(c.shoe, MS_PAL.cream, .35);
  if (kind === 'boot') {
    const ka = K ? msAng(A, K) : ang - sg * Math.PI / 2, top = msOff(A, ka, s * .5);
    paint(msTube([msOff(A, ka, -s * .04), msOff(A, ka, s * .25), top], [s * .27, s * .24, s * .28]), { wash: c.shoe, fill: dk, fillOp: 80, bleed: .06, tex: .5, ...msInk(kk, .3), curv: .25 });
    paint(through([L(-.16, -.14), L(.14, -.12), L(.24, -.02), L(.4, .04), L(.6, .08), L(.74, .14), L(.72, .23), L(.42, .25), L(-.08, .24), L(-.22, .12)], 3), { wash: c.shoe, ...msInk(kk, .3), curv: .3 });
    inkLine([L(-.2, .2), L(.2, .24), L(.72, .21)], .5 * kk, dk, 'inkfine', .3);
    inkLine([msPerp(top, ka, s * .14), msPerp(top, ka, -s * .14)], .32 * kk, lt, 'inkfine', .3);
    inkLine([L(-.1, -.1), L(.12, -.04), L(.3, 0)], .18 * kk, dk, 'inkfine', .5);
    return;
  }
  if (kind === 'slipper') {
    paint(foot, { wash: c.shoe, fill: dk, fillOp: 60, bleed: .05, tex: .4, ...msInk(kk, .26), curv: .3 });
    paint(through([L(-.07, -.1), L(.1, -.07), L(.3, .01), L(.2, .09), L(-.02, .07), L(-.13, 0)], 3), { wash: c.skin, ...msInk(kk, .18, msDark(c.skinSh, .3)), curv: .3 });
    inkLine([L(-.12, .2), L(.3, .23), L(.66, .2)], .4 * kk, dk, 'inkfine', .3);
    return;
  }
  paint(foot, { wash: c.skin, ...msInk(kk, .26), curv: .3 });
  paint([L(-.17, .12), L(.7, .14), L(.69, .23), L(-.12, .23)], { wash: c.shoe, ...msInk(kk, .22) });
  inkLine([L(.3, 0), L(.4, .18)], .3 * kk, c.shoe, 'inkfine', 0); inkLine([L(-.04, -.1), L(.04, .18)], .3 * kk, c.shoe, 'inkfine', 0); inkLine([L(.12, -.06), L(.3, 0)], .25 * kk, c.shoe, 'inkfine', .3);
  for (const u of [.5, .58, .64]) inkLine([L(u, .1), L(u + .03, .2)], .14 * kk, MS_INK, 'inkfine', 0);
  paint([L(.1, .1), L(.6, .12), L(.62, .2), L(.1, .2)], { wash: c.skinSh, washOp: 45, ink: null });
}
function msArm(S, E, Wr, h = {}, c, s, side = 1) {
  const kk = msK(s), oa = msOut(S, E, Wr, side), um = msOff(msMid(S, E), oa, s * .03), fm = msOff(msMid(E, Wr, .45), oa, -s * .02), aw = msAng(E, Wr);
  msLimb([S, um, E, fm, Wr], [s * .27, s * .25, s * .2, s * .2, s * .14], c.skin, c.skinSh, side, .3 * kk, mixCol(c.skin, MS_PAL.cream, .5));
  if (c.sleeve) { const a = msAng(S, E), cu = msMid(S, E, .9); paint(msTube([msOff(S, a, -s * .1), msMid(S, E, .4), cu], [s * .34, s * .31, s * .26]), { wash: c.sleeve, ...msInk(kk, .28), curv: .25 }); inkLine([msPerp(cu, a, s * .12), msPerp(cu, a, -s * .12)], .3 * kk, c.trim, 'inkfine', .3); }
  msJoint(E, S, Wr, s);
  msHand(Wr, h.ang ?? aw, s, c, h);
  inkLine([msPerp(Wr, aw, s * .05), msPerp(Wr, aw, -s * .05)], .14 * kk, msDark(c.skinSh, .2), 'inkfine', .4);
}
function msLeg(Hp, K, A, f = {}, c, s, side = 1) {
  const kk = msK(s), oa = msOut(Hp, K, A, side), tm = msOff(msMid(Hp, K), oa, s * .02), cm = msOff(msMid(K, A, .4), oa, -s * .035);
  msLimb([Hp, tm, K, cm, A], [s * .46, s * .42, s * .3, s * .3, s * .17], c.leg || c.skin, c.legDk || c.skinSh, side, .3 * kk, c.leg ? null : mixCol(c.skin, MS_PAL.cream, .5));
  msJoint(K, Hp, A, s);
  if (c.leg) inkLine([msMid(Hp, K, .1), msMid(Hp, K, .6), K, msMid(K, A, .5)], .18 * kk, c.legDk, 'inkfine', .5);
  msFoot(A, f.ang ?? (side > 0 ? .12 : Math.PI - .12), s, c, f, K);
}

// ---------- head ----------
// s = head height in px. o: turn (-1 left .. 1 right), tilt (rad), light (±1), brow, browAsym, browIn, lids, mouth {open, smile, press}, look [dx, dy].
function msHead(cx, cy, s, c, o = {}) {
  const t = clamp(o.turn || 0, -1, 1), at = Math.abs(t), sg = t >= 0 ? 1 : -1, tl = o.tilt || 0, co = Math.cos(tl), si = Math.sin(tl), kk = msK(s);
  const { jw, cw, fh } = MS_FACES[c.face] || MS_FACES.oval;
  const F = (u, v) => [cx + s * (u * co - v * fh * si), cy + s * (u * si + v * fh * co)];
  const fx = t * .13, m = o.mouth || {}, br = o.brow || 0, ba = o.browAsym || 0, bi = o.browIn || 0, lids = o.lids || 0, lk = o.look || [0, 0];
  const ls = o.light ?? (t === 0 ? 1 : sg), shade = msDark(c.skinSh, .25);
  if (c.ears !== 'leaf') {
    const ear = side => { const u = -side * .4 + fx * .35, e = F(u, -.02); paint(ellPts(e[0], e[1], s * .07, s * .115, 12, 0, tl), { wash: c.skin, ...msInk(kk, .26), curv: .5 }); inkLine([F(u, -.1), F(u - side * .03, -.02), F(u, .06)], .16 * kk, shade, 'inkfine', .6);
      if (c.circlet) { const d = F(u, .17); inkLine([F(u, .08), d], .2 * kk, c.trim, 'inkfine', 0); paint(ellPts(d[0], d[1] + s * .04, s * .035, s * .05, 10, 0, tl), { wash: c.jewel, ...msInk(kk, .15) }); } };
    if (at > .12) ear(sg); else { ear(1); ear(-1); }
  }
  const face = through([F(-.03 + fx * .4, -.5), F(.26 + fx * .5, -.46), F(.4 + fx * .45, -.24), F(.4 + fx * .5, .02), F(jw + fx * .55, .3), F(cw + fx * .9, .47), F(-.02 + fx * .9, .5), F(-cw - .03 + fx * .8, .47), F(-jw + .02 + fx * .45, .3), F(-.39 + fx * .3, .02), F(-.4 + fx * .2, -.24), F(-.28 + fx * .1, -.46)], 4);
  paint(face, { wash: c.skin, ...msInk(kk, .32), curv: .2 });
  // transparent volume: a watercolour shadow flank, the cheekbone, forehead light, colour in the cheeks
  paint(through([F(-ls * .38 + fx * .3, -.22), F(-ls * .38 + fx * .3, .04), F(-ls * .32 + fx * .45, .3), F(-ls * .1 + fx * .85, .47), F(-ls * .09 + fx * .7, .4), F(-ls * .2 + fx * .5, .18), F(-ls * .25 + fx * .35, -.06), F(-ls * .28 + fx * .3, -.22)], 3), { fill: c.skinSh, fillOp: 95, bleed: .06, tex: .35, ink: null, curv: .4 });
  inkLine([F(-ls * .36 + fx * .3, .1), F(-ls * .29 + fx * .4, .16), F(-ls * .19 + fx * .5, .19)], .16 * kk, shade, 'inkfine', .6);
  paint(ellPts(...F(ls * .08 + fx, -.32), s * .15, s * .08, 12, 0, tl), { wash: MS_PAL.cream, washOp: 35, ink: null });
  paint(ellPts(...F(ls * .21 + fx, .14), s * .1, s * .06, 12, 0, tl), { wash: c.lip, washOp: 40, ink: null });
  paint(ellPts(...F(-ls * .21 + fx, .14), s * .08, s * .05, 12, 0, tl), { wash: c.lip, washOp: 40, ink: null });
  if (c.freckles) for (let i = 0; i < 9; i++) paint(ellPts(...F(fx * 1.1 + (hash(i + 3) - .5) * .5, .12 + (hash(i + 11) - .5) * .14), s * .012, s * .012, 6), { wash: c.skinSh, washOp: 110, ink: null });
  if (c.stubble) paint(through([F(-.38 + fx * .3, .04), F(-jw + .02 + fx * .45, .3), F(-cw - .02 + fx * .8, .46), F(fx * .9, .49), F(cw + fx * .9, .46), F(jw + fx * .55, .3), F(.39 + fx * .5, .04), F(.3 + fx * .55, .18), F(.2 + fx * .75, .37), F(fx * 1.25, .41), F(-.2 + fx * .75, .37), F(-.3 + fx * .4, .18)], 2), { wash: msDark(c.skin, .3), washOp: 50, hatch: { d: s * .025, a: 1.1, o: { rand: .5 }, b: 'HB', c: c.hairDk, w: .35 }, ink: null, curv: .3 });
  const eye = side => {
    const far = (side !== sg && at > .05) ? at : 0, ew = .1 * (1 - .4 * far), eh = .05 * (1 - lids * .85);
    const ex = fx * 1.15 + side * .18 * (1 - .08 * far), ey = -.05, ir = .042, iry = Math.min(ir, eh * .95);
    const ix = ex + clamp(lk[0], -1, 1) * (ew - ir) * .95 + side * far * .012, iy = ey + lk[1] * .018 + .004;
    const clip = pts => pts.map(([u, v]) => { const dx = clamp((u - ex) / ew, -1, 1), hh = Math.sqrt(1 - dx * dx); return F(u, clamp(v, ey - eh * hh * 1.08, ey + eh * hh * .8)); });
    const ul = [[ex - side * ew, ey + .005], [ex - side * ew * .45, ey - eh], [ex + side * ew * .25, ey - eh * 1.05], [ex + side * ew, ey - .004]], ll = [[ex + side * ew * .5, ey + eh * .75], [ex - side * ew * .45, ey + eh * .65]];
    paint(through(ul.concat(ll).map(p => F(p[0], p[1])), 3), { wash: MS_EYEW, ink: null, curv: .4 });
    const circ = (r, ry) => { const p = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; p.push([ix + Math.cos(a) * r, iy + Math.sin(a) * ry]); } return clip(p); };
    paint(circ(ir, iry), { wash: c.eye, ink: null, curv: .3 });
    paint(circ(ir * .5, iry * .55), { wash: MS_INK, ink: null, curv: .3 });
    paint(ellPts(...F(ix - ls * .015, iy - .013), s * .01, s * .008, 8), { wash: MS_EYEW, ink: null });
    paint(through([F(ex - side * ew * 1.05, ey), F(ex - side * ew * .4, ey - eh * 1.5), F(ex + side * ew * .5, ey - eh * 1.5), F(ex + side * ew * 1.05, ey - .01), F(ex + side * ew * .3, ey - eh * 1.05), F(ex - side * ew * .45, ey - eh)], 2), { wash: c.skinSh, washOp: 50, ink: null, curv: .4 });
    inkLine(ul.map(p => F(p[0], p[1])).concat([F(ex + side * ew * 1.14, ey - .03)]), .34 * kk, MS_INK, 'inkfine', .5);
    inkLine(ll.map(p => F(p[0], p[1])), .13 * kk, shade, 'inkfine', .5);
    inkLine([F(ex - side * ew * .5, ey - eh * 1.7), F(ex + side * ew * .3, ey - eh * 1.9), F(ex + side * ew * .9, ey - eh * 1.4)], .12 * kk, shade, 'inkfine', .5);
    const raise = br + (side === sg ? ba : -ba * .25);
    const bw = [[ex - side * ew * 1.15, ey - .13 - raise * .03 - bi * .05], [ex - side * ew * .35, ey - .19 - raise * .05 - bi * .03], [ex + side * ew * .75, ey - .185 - raise * .06 + bi * .015], [ex + side * ew * 1.3, ey - .135 - raise * .045 + bi * .025]].map(p => F(p[0], p[1]));
    paint(msTube(bw, [s * .012, s * .028, s * .026, s * .008]), { wash: c.brow, ink: null, curv: .4 });
  };
  eye(-1); eye(1);
  if (bi < -.2) for (const d of [-1, 1]) inkLine([F(fx * 1.3 + d * .03, -.14), F(fx * 1.3 + d * .025, -.2)], .16 * kk, shade, 'inkfine', .3);
  const nx = fx * 1.4;
  paint(through([F(nx - ls * .03, -.03), F(nx - ls * .075, .13), F(nx - ls * .03, .19), F(nx + ls * .005, .06)], 3), { wash: c.skinSh, washOp: 60, ink: null, curv: .4 });
  inkLine(through([F(nx - sg * .04, -.05), F(nx + sg * .055, .09), F(nx + sg * .095, .165), F(nx + sg * .035, .2), F(nx - sg * .02, .17)], 3), .25 * kk, shade, 'inkfine', .5);
  inkLine([F(nx - sg * .06, .15), F(nx - sg * .09, .18), F(nx - sg * .05, .2)], .18 * kk, shade, 'inkfine', .5);
  const mx = fx * 1.25, my = .3, op = m.open || 0, sm = m.smile || 0, pr = m.press || 0, mw = .16 * (1 - .12 * at) * (1 + .1 * Math.max(0, sm)), gap = op * .06, th = 1 - pr * .5;
  const cyc = my - sm * .035 + pr * .02, Lc = F(mx - mw, cyc), Rc = F(mx + mw, cyc);
  if (op > .05) { paint(through([Lc, F(mx, my + .004), Rc, F(mx, my + .006 + gap)], 3), { wash: '#4A1E2A', ink: null, curv: .3 }); if (op > .3) paint([F(mx - mw * .5, my + .006), F(mx + mw * .5, my + .006), F(mx, my + .01 + gap * .35)], { wash: '#F3E7DC', washOp: 200, ink: null, curv: .3 }); }
  paint(through([Lc, F(mx - mw * .5, my + .006 + gap), F(mx, my + .008 + gap), F(mx + mw * .5, my + .006 + gap), Rc, F(mx + mw * .5, my + .06 * th + gap * .6), F(mx, my + .075 * th + gap * .7), F(mx - mw * .5, my + .06 * th + gap * .6)], 3), { wash: c.lip, ink: null, curv: .3 });
  paint(through([Lc, F(mx - mw * .5, my - .026 * th), F(mx - .025, my - .038 * th), F(mx, my - .028 * th), F(mx + .025, my - .038 * th), F(mx + mw * .5, my - .026 * th), Rc, F(mx + mw * .45, my + .005), F(mx, my + .008), F(mx - mw * .45, my + .005)], 3), { wash: msDark(c.lip, .25), ink: null, curv: .3 });
  inkLine([Lc, F(mx - mw * .5, my + .003), F(mx, my + .008), F(mx + mw * .5, my + .003), Rc], .24 * kk, msDark(c.lip, .6), 'inkfine', .5);
  inkLine([F(mx - mw * .55, my + .08 * th + gap * .6), F(mx, my + .1 * th + gap * .7), F(mx + mw * .55, my + .08 * th + gap * .6)], .16 * kk, c.skinSh, 'inkfine', .5);
  inkLine([F(mx - .07, my + .16), F(mx, my + .18), F(mx + .07, my + .16)], .16 * kk, shade, 'inkfine', .5);
  if (pr > .2) for (const d of [-1, 1]) inkLine([F(mx + d * mw, cyc), F(mx + d * (mw + .025), cyc + .035)], .16 * kk, shade, 'inkfine', .3);
  if (sm > .3 || op > .3) inkLine([F(nx + sg * .1, .2), F(mx + sg * (mw + .04), .27), F(mx + sg * (mw + .025), .34)], .14 * kk, shade, 'inkfine', .5);
}
// Puck's pointed leaf ears, drawn after the hair so they read past the curls.
function msEars(cx, cy, s, c, o = {}) {
  const t = clamp(o.turn || 0, -1, 1), at = Math.abs(t), sg = t >= 0 ? 1 : -1, tl = o.tilt || 0, co = Math.cos(tl), si = Math.sin(tl), kk = msK(s), fx = t * .13;
  const F = (u, v) => [cx + s * (u * co - v * si), cy + s * (u * si + v * co)];
  const ear = side => {
    const u = -side * .42 + fx * .35;
    paint(through([F(u + side * .06, .1), F(u - side * .04, -.04), F(u - side * .2, -.22), F(u - side * .44, -.44), F(u - side * .24, -.3), F(u - side * .1, -.16), F(u + side * .04, -.1)], 3), { wash: c.skin, fill: c.skinSh, fillOp: 60, bleed: .05, tex: .4, ...msInk(kk, .26), curv: .3 });
    inkLine([F(u + side * .02, .02), F(u - side * .14, -.16), F(u - side * .36, -.38)], .16 * kk, msDark(c.skinSh, .3), 'inkfine', .5);
    paint(through([F(u + side * .02, .06), F(u - side * .05, -.04), F(u - side * .12, -.14), F(u - side * .02, -.1)], 2), { wash: c.skinSh, washOp: 80, ink: null, curv: .4 });
  };
  if (at > .12) ear(sg); else { ear(1); ear(-1); }
}

// ---------- hair ----------
function msHairBack(cx, cy, s, c, o = {}) {
  const t = clamp(o.turn || 0, -1, 1), sg = t >= 0 ? 1 : -1, fx = t * .1, wd = o.wind || 0, ln = o.len ?? 1, tl = o.tilt || 0, co = Math.cos(tl), si = Math.sin(tl), kk = msK(s);
  const F = (u, v) => [cx + s * (u * co - v * si), cy + s * (u * si + v * co)];
  const st = c.style, inkO = msInk(kk, .3);
  let P;
  if (st === 'waves') P = [F(-.46 + fx, -.3), F(-.2 + fx, -.62), F(.25 + fx, -.6), F(.5 + fx, -.3), F(.58, .15), F(.52, .7), F(.66 + wd * .3, 1.25), F(.5 + wd * .7, 1.85 * ln), F(.05 + wd, 2.15 * ln), F(-.4 + wd * .8, 1.95 * ln), F(-.62 + wd * .3, 1.35), F(-.52, .75), F(-.58, .2)];
  else if (st === 'braid') P = [F(-.45 + fx, -.32), F(-.15 + fx, -.63), F(.25 + fx, -.6), F(.48 + fx, -.3), F(.5, .2), F(.46 + wd * .3, .9), F(.5 + wd * .8, 1.6 * ln), F(.3 + wd * 1.1, 2.1 * ln), F(-.1 + wd * 1.2, 2.2 * ln), F(-.4 + wd * .9, 1.9 * ln), F(-.5 + wd * .3, 1.2), F(-.5, .4)];
  else if (st === 'curls') {
    paint(ellPts(...F(-sg * .6 + fx * .4, -.02), s * .17, s * .2, 12, 0, tl), { wash: c.hair, ...inkO, curv: .3 });
    P = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, r = 1 + (i % 2 ? .07 : -.05); P.push(F(fx * .5 + Math.cos(a) * .66 * r, Math.min(.98, .1 + Math.sin(a) * .82 * r))); }
  } else {
    P = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI, r = .56 + (i % 2 ? .07 : 0); P.push(F(fx * .4 + Math.cos(a) * r, -.08 + Math.sin(a) * r * 1.1)); }
    P.push(F(.5 + fx * .4, .12), F(-.5 + fx * .4, .12));
  }
  paint(through(P, 4), { wash: c.hair, fill: c.hairDk, fillOp: 80, bleed: .1, tex: .55, ...inkO, curv: .3 });
  if (st === 'waves') {
    for (let i = 0; i < 4; i++) msStrand(F, -.35 + i * .25, -.3, -.4 + i * .3 + wd * .8, 1.9 * ln, .12, i * 1.3, c.hairDk, .25 * kk);
    msStrand(F, .4, -.1, .45 + wd * .6, 1.6 * ln, .1, 2, c.hairLt, .25 * kk); msStrand(F, -.45, .1, -.5 + wd * .5, 1.5 * ln, .1, 4, c.hairLt, .25 * kk);
  } else if (st === 'braid') {
    for (let i = 0; i < 3; i++) msStrand(F, -.3 + i * .3, -.2, -.3 + i * .3 + wd, 1.9 * ln, .04, i, c.hairDk, .25 * kk);
    msStrand(F, -.4, 0, -.35 + wd * .9, 1.7 * ln, .03, 2, c.hairLt, .25 * kk);
  } else {
    const n = st === 'curls' ? 6 : 4;
    for (let i = 0; i < n; i++) { const a = st === 'curls' ? .25 + i / (n - 1) * 2.6 : 3.4 + i / (n - 1) * 2.5, r = st === 'curls' ? .62 : .52, u = fx * .5 + Math.cos(a) * r, v = (st === 'curls' ? .1 : -.08) + Math.sin(a) * r * .9; inkLine([F(u - .06, v - .04), F(u + .04, v - .06), F(u + .05, v + .04), F(u - .03, v + .05)], .22 * kk, i % 2 ? c.hairLt : c.hairDk, 'inkfine', .8); }
  }
}
function msHairFront(cx, cy, s, c, o = {}) {
  const t = clamp(o.turn || 0, -1, 1), sg = t >= 0 ? 1 : -1, fx = t * .13, wd = o.wind || 0, ln = o.len ?? 1, tl = o.tilt || 0, co = Math.cos(tl), si = Math.sin(tl), kk = msK(s);
  const F = (u, v) => [cx + s * (u * co - v * si), cy + s * (u * si + v * co)];
  const st = c.style, inkO = { ...msInk(kk, .28), curv: .3 };
  if (st === 'crop') {
    const P = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI, r = .52 + (i % 2 ? .06 : 0); P.push(F(fx * .5 + Math.cos(a) * r, -.06 + Math.sin(a) * r * 1.05)); }
    P.push(F(.4 + fx * .5, -.3), F(.2 + fx * .6, -.37), F(fx * .7, -.4), F(-.2 + fx * .6, -.37), F(-.4 + fx * .4, -.3));
    paint(through(P, 3), { wash: c.hair, ...inkO });
    for (let i = 0; i < 4; i++) { const u = -.3 + i * .2 + fx * .6, v = -.44; inkLine([F(u - .05, v - .02), F(u + .03, v - .08), F(u + .06, v + .02), F(u, v + .05)], .22 * kk, i % 2 ? c.hairLt : c.hairDk, 'inkfine', .8); }
    for (const d of [-1, 1]) inkLine([F(d * .48 + fx * .4, -.2), F(d * .5 + fx * .4, -.08), F(d * .44 + fx * .4, .02)], .22 * kk, c.hairDk, 'inkfine', .7);
    return;
  }
  const cap = through([F(-.44 + fx * .2, -.26), F(-.4 + fx * .2, -.5), F(-.15 + fx * .4, -.64), F(.15 + fx * .5, -.64), F(.42 + fx * .5, -.5), F(.46 + fx * .5, -.26), F(.37 + fx * .5, -.3), F(.25 + fx * .7, -.39), F(.08 + fx, -.41), F(-.1 + fx, -.41), F(-.25 + fx * .7, -.38), F(-.36 + fx * .3, -.3)], 3);
  paint(cap, { wash: c.hair, ...inkO });
  inkLine([F(.06 + fx * .9, -.41), F(.1 + fx * .7, -.52), F(.12 + fx * .6, -.62)], .22 * kk, c.hairDk, 'inkfine', .5);
  inkLine([F(-.2 + fx * .6, -.42), F(-.3 + fx * .4, -.52), F(-.3 + fx * .3, -.6)], .2 * kk, c.hairLt, 'inkfine', .5);
  if (st === 'waves') {
    paint(msTube([F(-.42 + fx * .2, -.28), F(-.5 + fx * .2, .15), F(-.46 + fx * .3, .55), F(-.56 + fx * .3 + wd * .2, .9)], [s * .12, s * .17, s * .14, s * .05]), { wash: c.hair, ...inkO });
    paint(msTube([F(.46 + fx * .5, -.28), F(.55 + fx * .5, .15), F(.5 + fx * .5, .55), F(.6 + fx * .5 + wd * .3, .95)], [s * .12, s * .17, s * .14, s * .05]), { wash: c.hair, ...inkO });
    msStrand(F, -.48 + fx * .2, -.1, -.52 + fx * .3 + wd * .2, .8, .03, 1, c.hairLt, .22 * kk); msStrand(F, .52 + fx * .5, -.1, .56 + fx * .5 + wd * .3, .85, .03, 2, c.hairDk, .22 * kk);
  } else if (st === 'braid') {
    const path = [F(.44 * sg + fx * .5, -.3), F(.53 * sg + fx * .4, .1), F(.53 * sg + wd * .2, .6), F(.5 * sg + wd * .5, 1.1), F(.44 * sg + wd * .9, 1.6 * ln)], C = through(path, 4), n = C.length;
    for (let i = 0; i < 9; i++) { const j = Math.min(n - 1, Math.round(i * (n - 1) / 8)), p = C[j], a = msAng(C[Math.max(0, j - 1)], C[Math.min(n - 1, j + 1)]), r = s * (.085 - i * .004), d = (i % 2 ? 1 : -1) * s * .02; paint(ellPts(p[0] + Math.cos(a + Math.PI / 2) * d, p[1] + Math.sin(a + Math.PI / 2) * d, r, r * .72, 10, 0, a + (i % 2 ? .6 : -.6)), { wash: c.hair, ...inkO }); }
    for (let i = 0; i < 9; i += 2) { const j = Math.min(n - 1, Math.round(i * (n - 1) / 8)), p = C[j]; inkLine([[p[0] - s * .03, p[1] - s * .02], [p[0] + s * .03, p[1] + s * .02]], .2 * kk, c.hairLt, 'inkfine', .3); }
    paint(ellPts(path[0][0], path[0][1], s * .065, s * .05, 10, 0, tl), { wash: c.jewel, ...msInk(kk, .2) });
    paint(ellPts(path[0][0], path[0][1], s * .02, s * .02, 6), { wash: c.trim, ink: null });
    msStrand(F, -.44 * sg + fx * .2, -.25, -.5 * sg + fx * .2 + wd * .3, .7, .05, 1, c.hair, .5 * kk); msStrand(F, -.46 * sg + fx * .2, -.2, -.52 * sg + fx * .2 + wd * .3, .65, .05, 1, c.hairLt, .2 * kk);
  } else if (st === 'curls') {
    for (let i = 0; i < 6; i++) { const q = i / 5, u = -.36 + q * .76 + fx * .5, v = -.33 - Math.sin(q * Math.PI) * .09; paint(ellPts(...F(u, v), s * .09, s * .08, 10, 0, tl), { wash: c.hair, ...inkO }); }
    for (let i = 0; i < 3; i++) { const u = -.25 + i * .25 + fx * .5; inkLine([F(u - .04, -.42), F(u + .02, -.47), F(u + .05, -.4)], .2 * kk, c.hairLt, 'inkfine', .8); }
    const pin = F(sg * .32 + fx * .5, -.46);
    for (let k = 0; k < 5; k++) paint(msPetalPts(pin[0], pin[1], s * .085, s * .032, k / 5 * TAU + tl, .55), { wash: c.jewel, ...msInk(kk, .16), curv: .4 });
    paint(ellPts(pin[0], pin[1], s * .022, s * .022, 6), { wash: c.trim, ink: null });
  }
  if (c.circlet) {
    inkLine([F(-.44 + fx * .2, -.3), F(-.2 + fx * .6, -.44), F(fx * 1.1, -.47), F(.2 + fx * .8, -.44), F(.45 + fx * .5, -.3)], .45 * kk, c.trim, 'inkfine', .5);
    for (let i = 0; i < 5; i++) { const [u, v] = [[-.36, -.36], [-.18, -.44], [fx * .1, -.47], [.18, -.44], [.36, -.36]][i], uu = u + fx * .6; paint([F(uu - .035, v), F(uu, v - .085), F(uu + .035, v), F(uu, v + .02)], { wash: c.trim, ...msInk(kk, .15, msDark(c.trim, .5)), curv: .3 }); }
  }
}

// ---------- body ----------
// J: mapped joints (head, neck?, shL, shR, hipL, hipR). o: light (±1), waist, sash colour, vine (gold embroidery).
// The neck, trapezius slopes, shoulders and chest are one skin silhouette, so nothing joins abruptly.
function msTorso(J, c, s, o = {}) {
  const { shL, shR, hipL, hipR, head } = J, kk = msK(s), light = o.light ?? 1, cov = !!c.sleeve, shade = msDark(c.skinSh, .25), sS = light > 0 ? -1 : 1;
  const mS = msMid(shL, shR), mH = msMid(hipL, hipR), ax = msAng(shL, shR), dn = msAng(mS, mH), up = dn + Math.PI;
  const hw = msDist(hipL, hipR) / 2, sw2 = msDist(shL, shR) / 2;
  const wst = msMid(mS, mH, .64), ww = hw * (o.waist ?? .74), wL = msOff(wst, ax, -ww), wR = msOff(wst, ax, ww);
  const bst = msMid(mS, mH, .3), bw = sw2 * .9, bL = msOff(bst, ax, -bw), bR = msOff(bst, ax, bw);
  const capL = msOff(shL, ax, -s * .1), capR = msOff(shR, ax, s * .1);
  const nb = J.neck || msOff(mS, up, s * .08), top = msMid(head, nb, .45), nw = s * .15;
  const tL = msOff(top, ax, -nw), tR = msOff(top, ax, nw), nbL = msOff(nb, ax, -nw * 1.3), nbR = msOff(nb, ax, nw * 1.3);
  const nL = cov ? msOff(capL, dn, s * .05) : msOff(msOff(shL, ax, s * .1), dn, s * .26), nR = cov ? msOff(capR, dn, s * .05) : msOff(msOff(shR, ax, -s * .1), dn, s * .26), nM = cov ? msOff(nb, dn, s * .17) : msOff(mS, dn, s * .32);
  const upper = through([msOff(capL, dn, s * .2), msOff(capL, dn, s * .02), msOff(shL, up, s * .05), msOff(msMid(shL, nb, .55), up, s * .08), nbL, tL, tR, nbR, msOff(msMid(shR, nb, .55), up, s * .08), msOff(shR, up, s * .05), msOff(capR, dn, s * .02), msOff(capR, dn, s * .2), nR, nM, nL], 3);
  paint(upper, { wash: c.skin, ...msInk(kk, .3), curv: .3 });
  paint(through([msOff(top, ax, sS * nw), msOff(nb, ax, sS * nw * 1.3), msOff(msMid(nb, top, .3), ax, sS * nw * .3), msOff(top, ax, sS * nw * .2)], 2), { fill: c.skinSh, fillOp: 90, bleed: .05, tex: .35, ink: null, curv: .4 });
  paint([tL, tR, msOff(tR, dn, s * .09), msOff(tL, dn, s * .1)], { wash: c.skinSh, washOp: 75, ink: null, curv: .3 });
  inkLine([msOff(top, ax, -sS * nw * .55), msOff(msMid(top, nb, .6), ax, -sS * nw * .45), msOff(nb, ax, -sS * nw * .1)], .18 * kk, shade, 'inkfine', .5);
  inkLine([tL, msMid(tL, nbL, .5), nbL], .22 * kk, shade, 'inkfine', .3); inkLine([tR, msMid(tR, nbR, .5), nbR], .22 * kk, shade, 'inkfine', .3);
  if (c.stubble) inkLine([msOff(msMid(top, nb, .4), ax, -sS * nw * .2), msOff(msMid(top, nb, .55), ax, -sS * nw * .08), msOff(msMid(top, nb, .7), ax, -sS * nw * .2)], .16 * kk, shade, 'inkfine', .6);
  if (!cov) {
    const cb = msDark(c.skinSh, .2), nn = msOff(nb, dn, s * .12);
    inkLine([nn, msOff(msOff(nb, dn, s * .08), ax, s * .26), msOff(msOff(nb, dn, s * .12), ax, s * .42)], .2 * kk, cb, 'inkfine', .5);
    inkLine([nn, msOff(msOff(nb, dn, s * .08), ax, -s * .26), msOff(msOff(nb, dn, s * .12), ax, -s * .42)], .2 * kk, cb, 'inkfine', .5);
    const sc = light > 0 ? capL : capR;
    paint(through([msOff(sc, dn, s * .03), msOff(msOff(sc, dn, s * .1), ax, -sS * s * .12), msOff(msOff(sc, dn, s * .2), ax, -sS * s * .06), msOff(sc, dn, s * .2)], 3), { wash: c.skinSh, washOp: 80, ink: null, curv: .3 });
  }
  const apL = msOff(msOff(shL, ax, s * .06), dn, s * .46), apR = msOff(msOff(shR, ax, -s * .06), dn, s * .46);
  paint(through([nL, nM, nR, apR, bR, wR, hipR, hipL, wL, bL, apL], 3), { wash: c.gown, ...msInk(kk, .32), curv: .3 });
  paint(light > 0 ? [nL, msMid(nL, nR, .3), msMid(bL, bR, .28), msMid(wL, wR, .25), msMid(hipL, hipR, .3), hipL, wL, bL] : [nR, msMid(nL, nR, .7), msMid(bL, bR, .72), msMid(wL, wR, .75), msMid(hipL, hipR, .7), hipR, wR, bR], { fill: c.gownDk, fillOp: 120, bleed: .1, tex: .5, ink: null, curv: .3 });
  if (!cov) paint([msMid(bL, bR, .15), msOff(msMid(bL, bR, .5), dn, s * .12), msMid(bL, bR, .85), msOff(msMid(bL, bR, .5), dn, s * .22)], { fill: c.gownDk, fillOp: 70, bleed: .08, tex: .4, ink: null, curv: .5 });
  paint(light > 0 ? [msMid(bL, bR, .6), msMid(bL, bR, .78), msMid(wL, wR, .7), msMid(wL, wR, .55)] : [msMid(bL, bR, .4), msMid(bL, bR, .22), msMid(wL, wR, .3), msMid(wL, wR, .45)], { wash: c.gownLt, washOp: 70, ink: null, curv: .5 });
  inkLine([msOff(nM, dn, s * .08), msMid(bL, bR, .5), msMid(wL, wR, .5)], .18 * kk, c.gownDk, 'inkfine', .5);
  for (let i = -1; i <= 1; i++) inkLine([msMid(wL, wR, .5 + i * .12), msOff(msMid(bL, bR, .5 + i * .3), dn, s * .1)], .16 * kk, c.gownDk, 'inkfine', .3);
  inkLine([nL, nM, nR], .45 * kk, c.trim, 'inkfine', .5);
  if (o.sash) {
    const kx = msMid(wL, wR, light > 0 ? .72 : .28);
    paint([msOff(wL, dn, -s * .09), msOff(wR, dn, -s * .09), msOff(wR, dn, s * .1), msOff(wL, dn, s * .1)], { wash: o.sash, ...msInk(kk, .26), curv: .2 });
    paint(ribbon([kx, msOff(kx, dn + .3 * light, s * .35), msOff(kx, dn + .15 * light, s * .75)], s * .12, s * .16), { wash: o.sash, fill: msDark(o.sash, .4), fillOp: 60, bleed: .06, tex: .4, ...msInk(kk, .22), curv: .3 });
    paint(ellPts(kx[0], kx[1], s * .07, s * .055, 10, 0, ax), { wash: msDark(o.sash, .3), ...msInk(kk, .2) });
    inkLine([msOff(wL, dn, -s * .02), msOff(wR, dn, -s * .02)], .18 * kk, msDark(o.sash, .4), 'inkfine', .3);
  } else if (o.vine !== false && !cov) {
    const V = []; for (let i = 0; i <= 8; i++) { const q = i / 8; V.push(msOff(msMid(msMid(nL, nR, .5), msMid(wL, wR, .5), q), ax, Math.sin(q * 9) * s * .09)); }
    inkLine(V, .3 * kk, c.trim, 'inkfine', .6);
    for (let i = 1; i < 8; i += 2) paint(msPetalPts(V[i][0], V[i][1], s * .07, s * .022, ax + (i % 4 ? .9 : -.9), .6), { wash: c.trim, ink: null, curv: .4 });
  }
  if (c.pattern === 'leaf') for (let i = 0; i < 7; i++) { const p = msMid(msMid(bL, bR, .15 + hash(i) * .7), msMid(hipL, hipR, .15 + hash(i) * .7), hash(i + 5)); paint(msPetalPts(p[0], p[1], s * .09, s * .03, hash(i + 9) * TAU, .6), { wash: c.trim, ink: null, curv: .4 }); }
}
// Skirt from the hip line down to a hem (canvas points, listed from the right hip side around to the left).
// o: col, dk, lt, light, folds, rise (how far above the hip joints the waist sits), trim (hem colour), k (stroke scale).
function msSkirt(hipL, hipR, hem, c, o = {}) {
  const col = o.col || c.gown, dk = o.dk || c.gownDk, lt = o.lt || c.gownLt, light = o.light ?? 1, kk = o.k ?? 1;
  const ax = msAng(hipL, hipR), hd = msDist(hipL, hipR), rise = o.rise ?? hd * .55;
  const tl = msOff(hipL, ax - Math.PI / 2, rise), tr = msOff(hipR, ax - Math.PI / 2, rise), Hm = through(hem, 3), n = hem.length;
  paint([tl, tr].concat(Hm), { wash: col, ...msInk(kk, .3), curv: .15 });
  const m = Math.max(1, Math.round(n * .3)), hemL = hem.slice(n - m), hemR = hem.slice(0, m + 1), t42 = msMid(tl, tr, .42), t58 = msMid(tl, tr, .58);
  paint(light > 0 ? [t42, msMid(t42, hemL[0], .5)].concat(hemL, [tl]) : [t58, msMid(t58, hemR[hemR.length - 1], .5)].concat(hemR.slice().reverse(), [tr]), { fill: dk, fillOp: 115, bleed: .12, tex: .55, ink: null, curv: .3 });
  paint(light > 0 ? [msMid(tl, tr, .6), msMid(tl, tr, .74), hem[Math.floor(n * .22)], hem[Math.floor(n * .35)]] : [msMid(tl, tr, .4), msMid(tl, tr, .26), hem[Math.floor(n * .78)], hem[Math.floor(n * .65)]], { wash: lt, washOp: 60, ink: null, curv: .3 });
  const nf = o.folds ?? 4;
  for (let i = 1; i <= nf; i++) { const q = i / (nf + 1), a = msMid(tl, tr, q), b = hem[Math.round((1 - q) * (n - 1))], md = msMid(a, b, .5); inkLine([a, [md[0] + (hash(i * 3.1) - .5) * hd * .25, md[1]], b], .22 * kk, i % 2 ? dk : lt, 'inkfine', .6); }
  for (let i = 0; i < 3; i++) { const a = msMid(tl, tr, .25 + i * .25); inkLine([a, msOff(a, ax + Math.PI / 2 + (i - 1) * .35, hd * .3)], .18 * kk, dk, 'inkfine', .3); }
  if (o.trim) inkLine(Hm, .35 * kk, o.trim, 'inkfine', .3);
}
// A draped shawl or sleeve along P (canvas points): one tapered ribbon with a fold line and a gold edge.
function msDrape(P, s, c, o = {}) {
  const col = o.col || c.gown, R = ribbon(P, (o.w0 ?? .32) * s, (o.w1 ?? .55) * s), C = through(P, 6), n = C.length;
  paint(R, { wash: col, fill: o.dk || c.gownDk, fillOp: 70, bleed: .1, tex: .5, ...msInk(msK(s), .3), curv: .3 });
  inkLine(C.slice(Math.floor(n * .2)).filter((_, j) => j % 5 === 0), .22 * msK(s), o.dk || c.gownDk, 'inkfine', .6);
  if (c.trim) inkLine(R.slice(0, n), .35 * msK(s), c.trim, 'inkfine', .3);
}

// ---------- poses and the whole figure ----------
// A standing base pose in head units (about 7.3 heads tall): override joints per scene. o: lean, turn, tilt, shoulderY.
function msStand(o = {}) {
  const lean = o.lean || 0, sh = o.shoulderY ?? -2.05;
  return { head: [lean * 1.3, -2.85], neck: [lean * 1.1, -2.32], turn: o.turn || 0, tilt: o.tilt || 0,
    shL: [-.52 + lean, sh], shR: [.52 + lean, sh], elL: [-.72 + lean * .6, -1.1], elR: [.72 + lean * .6, -1.1], wrL: [-.6, -.15], wrR: [.6, -.15],
    hipL: [-.33, 0], hipR: [.33, 0], knL: [-.35, 1.9], knR: [.35, 1.9], anL: [-.35, 3.75], anR: [.35, 3.75], front: 'L', face: MS_EXPR.calm };
}
// msFigure(x, y, s, cast, pose, o): pelvis at (x, y), s = px per head unit. Pose joints: head, neck, shL/R, elL/R, wrL/R,
// hipL/R, knL/R, anL/R; handL/R {ang, spread, curl, side}; footL/R {ang, sole}; turn, tilt, wind, hairLen, face, front ('L'|'R'),
// skirt/over (hem point lists in head units), drape (path), order (draw steps). Returns the mapped joints.
function msFigure(x, y, s, c, p, o = {}) {
  const T = msT(x, y, s), J = {};
  for (const q in p) { const v = p[q]; if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') J[q] = T(v); }
  const hs = s * (o.headScale || 1), light = o.light ?? 1, fr = p.front || 'L', bk = fr === 'L' ? 'R' : 'L';
  const hairO = { turn: p.turn, tilt: p.tilt, wind: p.wind, len: p.hairLen };
  const arm = q => msArm(J['sh' + q], J['el' + q], J['wr' + q], p['hand' + q] || {}, c, s, light);
  const leg = q => msLeg(J['hip' + q], J['kn' + q], J['an' + q], p['foot' + q] || {}, c, s, light);
  const steps = {
    hairBack: () => msHairBack(J.head[0], J.head[1], hs, c, hairO),
    armB: () => arm(bk), armF: () => arm(fr), legB: () => leg(bk), legF: () => leg(fr),
    skirt: () => p.skirt && msSkirt(J.hipL, J.hipR, p.skirt.map(T), c, { light, k: msK(s), ...o.skirt }),
    over: () => p.over && msSkirt(J.hipL, J.hipR, p.over.map(T), c, { col: c.over, dk: c.overDk, lt: c.over, light, folds: 2, k: msK(s), ...o.over }),
    torso: () => msTorso(J, c, s, { light, sash: c.sash, ...o.torso }),
    drape: () => p.drape && msDrape(p.drape.map(T), s, c, o.drape),
    head: () => msHead(J.head[0], J.head[1], hs, c, { turn: p.turn, tilt: p.tilt, light, ...(p.face || MS_EXPR.calm) }),
    hairFront: () => msHairFront(J.head[0], J.head[1], hs, c, hairO),
    ears: () => c.ears === 'leaf' && msEars(J.head[0], J.head[1], hs, c, hairO)
  };
  for (const q of p.order || MS_ORDER) if (steps[q]) steps[q]();
  return J;
}
