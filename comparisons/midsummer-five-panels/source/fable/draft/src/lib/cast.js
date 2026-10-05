// src/lib/cast.js — original cast sheet and the hand-built figure rig: heads, hair, hands, feet and bodies.
// Poses are joint lists in head-height units (pelvis at 0,0; y down); msFigure maps them to the canvas at scale s.
const MS_CAST = {
  titania: { skin: '#C9906B', skinSh: '#9A6243', hair: '#7A2C1C', hairLt: '#BE5A3C', hairDk: '#4A170E', brow: '#4E1C10', eye: '#7E6B2A', lip: '#A8403F',
    gown: '#B5176E', gownLt: '#E24FA3', gownDk: '#6C0B45', trim: '#E2B344', jewel: '#2FB9B5', shoe: '#D9A93C', foot: 'sandal', style: 'waves', circlet: true },
  helena: { skin: '#EFCBAE', skinSh: '#C98F6E', hair: '#D9A648', hairLt: '#F2D27A', hairDk: '#8E621C', brow: '#8A5A26', eye: '#5F7E9C', lip: '#C2606A',
    gown: '#1E3FA8', gownLt: '#4D6FD6', gownDk: '#0F2066', over: '#2FB7B2', overDk: '#157A78', trim: '#E2B344', sash: '#E2B344', jewel: '#1F3FA0', shoe: '#2A4BB0', foot: 'slipper', style: 'braid', freckles: true },
  hermia: { skin: '#8A5A3A', skinSh: '#5C3721', hair: '#3B2416', hairLt: '#6E4529', hairDk: '#1E100A', brow: '#241409', eye: '#4A2A18', lip: '#9E4448',
    gown: '#118A5B', gownLt: '#3CB37E', gownDk: '#075238', trim: '#E2B344', sash: '#B8183A', jewel: '#C81E3A', shoe: '#3A7A54', foot: 'slipper', style: 'curls' },
  puck: { skin: '#C8926A', skinSh: '#92603F', hair: '#2E1E16', hairLt: '#5A3E2E', hairDk: '#160C08', brow: '#241409', eye: '#4F6A2E', lip: '#8E5346',
    gown: '#6A3FA8', gownLt: '#9A6ED6', gownDk: '#3C1F6E', trim: '#1E8C86', leg: '#3F2A5C', legDk: '#261640', shoe: '#5A3A22', foot: 'boot', style: 'crop', ears: 'leaf', sleeve: '#6A3FA8' }
};
const MS_INK = '#2A1A2E', MS_EYEW = '#F7EFE4';
// Expression presets for msHead: brow raise (-1..1), browAsym (near-side brow extra), lids (0 open .. 1 closed), mouth, look.
const MS_EXPR = {
  calm: { brow: 0, lids: .15, mouth: { open: 0, smile: .15 } },
  regal: { brow: .15, lids: .3, mouth: { open: 0, smile: .3 } },
  attentive: { brow: .5, browAsym: .5, lids: 0, mouth: { open: .4, smile: .05 } },
  firm: { brow: -.45, lids: .1, mouth: { open: 0, smile: -.35 } },
  speak: { brow: .3, browAsym: .2, lids: .05, mouth: { open: .55, smile: 0 } },
  amused: { brow: .2, lids: .3, mouth: { open: .1, smile: .65 } }
};
const MS_ORDER = ['hairBack', 'armB', 'legB', 'legF', 'skirt', 'over', 'torso', 'drape', 'armF', 'head', 'hairFront'];

// ---------- small geometry ----------
const msT = (x, y, s) => j => [x + j[0] * s, y + j[1] * s];
const msMid = (a, b, k = .5) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const msAng = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const msOff = (p, a, d) => [p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d];
const msDist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const msDark = (c, k = .45) => mixCol(c, MS_INK, k);
const msK = s => clamp(s / 160, .6, 1.4);          // stroke weight scale for a head s px tall
// A tube along P with a width per control point (thigh → knee → calf → ankle), as one closed outline.
function msTube(P, Ws) {
  const C = through(P, 6), n = C.length, m = P.length - 1, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const u = Math.min(m, i / 6), k = Math.floor(u), w = lerp(Ws[k], Ws[Math.min(m, k + 1)], u - k) / 2;
    L.push([C[i][0] - dy / d * w, C[i][1] + dx / d * w]); R.push([C[i][0] + dy / d * w, C[i][1] - dx / d * w]);
  }
  return L.concat(R.reverse());
}
// A wavy hair strand line from (u0,v0) to (u1,v1) in head units through F.
function msStrand(F, u0, v0, u1, v1, amp, ph, col, sw) {
  const P = []; for (let i = 0; i <= 6; i++) { const q = i / 6; P.push(F(lerp(u0, u1, q) + Math.sin(q * 7 + ph) * amp * q, lerp(v0, v1, q))); }
  inkLine(P, sw, col, 'inkfine', .6);
}

// ---------- limbs ----------
// Painted limb: a tube along P, a shadow band on one edge (side = +1 puts it on the clockwise side), a fine contour.
function msLimb(P, Ws, col, sh, side = 1, sw = .3) {
  const tube = msTube(P, Ws);
  paint(tube, { wash: col, ink: null, curv: .25 });
  if (sh) {
    const n = P.length, S = P.map((p, i) => msOff(p, msAng(P[Math.max(0, i - 1)], P[Math.min(n - 1, i + 1)]) + side * Math.PI / 2, Ws[i] * .3));
    paint(msTube(S, Ws.map(w => w * .38)), { wash: sh, washOp: 110, ink: null, curv: .25 });
  }
  paint(tube, { ink: MS_INK, sw, br: 'inkfine', curv: .25 });
}
// Crease on the outer side of a bent joint E between A and B.
function msJoint(E, A, B, s) {
  const a1 = msAng(E, A), a2 = msAng(E, B), vx = Math.cos(a1) + Math.cos(a2), vy = Math.sin(a1) + Math.sin(a2);
  if (Math.hypot(vx, vy) < .35) return;
  const a = Math.atan2(-vy, -vx);
  inkLine([msOff(E, a - .7, s * .09), msOff(E, a, s * .11), msOff(E, a + .7, s * .09)], .22 * msK(s), MS_INK, 'inkfine', .6);
}
// Hand at wrist w pointing along ang. h: { spread, curl, side (+1: thumb on the clockwise side of ang), len }.
function msHand(w, ang, s, c, h = {}) {
  const L = s * .2 * (h.len ?? 1), pw = s * .135, side = h.side ?? 1, spread = h.spread ?? .3, curl = h.curl ?? .15, kk = msK(s);
  const n = ang + Math.PI / 2, base = msOff(w, ang, L * .9), mid = msOff(w, ang, L * .45);
  const palm = through([msOff(w, n, pw * .8), msOff(mid, n, pw * 1.02), msOff(base, n, pw * .92), msOff(base, n, -pw * .92), msOff(mid, n, -pw * 1.02), msOff(w, n, -pw * .8)], 3);
  paint(palm, { wash: c.skin, ink: null, curv: .3 });
  paint([msOff(mid, n, -side * pw * .45), msOff(base, n, -side * pw * .85), msOff(base, n, -side * pw * .25)], { wash: c.skinSh, washOp: 90, ink: null });
  for (let i = 0; i < 4; i++) {
    const q = (i - 1.5) / 1.5, b = msOff(base, n, q * pw * .7), fa = ang + q * spread * .55, fl = L * (1 - .14 * Math.abs(q) - (i === 0 ? .05 : 0));
    const m = msOff(b, fa, fl * .5), e = msOff(m, fa + curl * 1.3 * side, fl * .5);
    paint(msTube([b, m, e], [s * .06, s * .055, s * .042]), { wash: c.skin, ink: MS_INK, sw: .17 * kk, br: 'inkfine', curv: .3 });
  }
  const tb = msOff(msOff(w, ang, L * .3), n, side * pw * .9), tm = msOff(tb, ang + side * (1 - curl * .6), L * .32), te = msOff(tm, ang + side * (.45 - curl * .9), L * .3);
  paint(msTube([tb, tm, te], [s * .075, s * .06, s * .045]), { wash: c.skin, ink: MS_INK, sw: .17 * kk, br: 'inkfine', curv: .3 });
  const hn = palm.length >> 1;
  inkLine(palm.slice(0, hn), .22 * kk, MS_INK, 'inkfine', .3); inkLine(palm.slice(hn), .22 * kk, MS_INK, 'inkfine', .3);
}
// Foot at ankle A, toes pointing along ang. f: { kind, sole (+1/-1 flips which side is the sole) }.
function msFoot(A, ang, s, c, f = {}) {
  const kk = msK(s), kind = f.kind || c.foot, ua = [Math.cos(ang), Math.sin(ang)];
  let ud = [-ua[1], ua[0]]; const sg = f.sole ?? (ud[1] < -1e-6 ? -1 : 1); ud = [ud[0] * sg, ud[1] * sg];
  const L = (a, d) => [A[0] + (ua[0] * a + ud[0] * d) * s, A[1] + (ua[1] * a + ud[1] * d) * s];
  const foot = through([L(-.08, -.1), L(.08, -.08), L(.3, 0), L(.52, .06), L(.68, .12), L(.68, .2), L(.45, .22), L(.15, .22), L(-.1, .2), L(-.17, .08)], 3);
  if (kind === 'boot') {
    const boot = through([L(-.2, -.75), L(.16, -.75), L(.2, -.1), L(.34, 0), L(.56, .06), L(.72, .13), L(.7, .22), L(.4, .24), L(-.1, .23), L(-.22, .1)], 3);
    paint(boot, { wash: c.shoe, fill: msDark(c.shoe, .4), fillOp: 90, bleed: .08, tex: .5, ink: MS_INK, sw: .3 * kk, br: 'inkfine', curv: .3 });
    inkLine([L(-.17, -.08), L(.18, -.1)], .22 * kk, msDark(c.shoe, .5), 'inkfine', .3);
    return;
  }
  if (kind === 'slipper') {
    paint(foot, { wash: c.shoe, ink: MS_INK, sw: .28 * kk, br: 'inkfine', curv: .3 });
    paint(through([L(-.08, -.1), L(.08, -.08), L(.3, 0), L(.22, .08), L(-.02, .06), L(-.13, .0)], 3), { wash: c.skin, ink: msDark(c.skinSh, .3), sw: .2 * kk, br: 'inkfine', curv: .3 });
    return;
  }
  paint(foot, { wash: c.skin, ink: MS_INK, sw: .28 * kk, br: 'inkfine', curv: .3 });
  paint([L(-.17, .12), L(.7, .14), L(.69, .22), L(-.12, .22)], { wash: c.shoe, ink: MS_INK, sw: .22 * kk, br: 'inkfine' });
  inkLine([L(.3, 0), L(.4, .18)], .3 * kk, c.shoe, 'inkfine', 0); inkLine([L(-.02, -.1), L(.04, .18)], .3 * kk, c.shoe, 'inkfine', 0);
  inkLine([L(.52, .1), L(.56, .2)], .15 * kk, MS_INK, 'inkfine', 0); inkLine([L(.6, .11), L(.62, .2)], .15 * kk, MS_INK, 'inkfine', 0);
}
function msArm(S, E, Wr, h = {}, c, s, side = 1) {
  const kk = msK(s);
  msLimb([S, msMid(S, E), E, msMid(E, Wr, .45), Wr], [s * .27, s * .24, s * .2, s * .19, s * .15], c.skin, c.skinSh, side, .3 * kk);
  if (c.sleeve) paint(msTube([S, msMid(S, E, .5), msMid(S, E, .97)], [s * .32, s * .28, s * .24]), { wash: c.sleeve, ink: MS_INK, sw: .28 * kk, br: 'inkfine', curv: .25 });
  msJoint(E, S, Wr, s);
  msHand(Wr, h.ang ?? msAng(E, Wr), s, c, h);
}
function msLeg(Hp, K, A, f = {}, c, s, side = 1) {
  msLimb([Hp, msMid(Hp, K), K, msMid(K, A, .4), A], [s * .46, s * .4, s * .3, s * .28, s * .17], c.leg || c.skin, c.legDk || c.skinSh, side, .3 * msK(s));
  msJoint(K, Hp, A, s);
  msFoot(A, f.ang ?? (side > 0 ? .12 : Math.PI - .12), s, c, f);
}

// ---------- head ----------
// s = head height in px. o: turn (-1 left .. 1 right), tilt (rad), light (±1), brow, browAsym, lids, mouth {open, smile}, look [dx, dy].
function msHead(cx, cy, s, c, o = {}) {
  const t = clamp(o.turn || 0, -1, 1), at = Math.abs(t), sg = t >= 0 ? 1 : -1, tl = o.tilt || 0, co = Math.cos(tl), si = Math.sin(tl), kk = msK(s);
  const F = (u, v) => [cx + s * (u * co - v * si), cy + s * (u * si + v * co)];
  const fx = t * .13, m = o.mouth || { open: 0, smile: .1 }, br = o.brow || 0, ba = o.browAsym || 0, lids = o.lids || 0, lk = o.look || [0, 0];
  const ls = o.light ?? (t === 0 ? 1 : sg), shade = msDark(c.skinSh, .25);
  const ear = side => {
    const u = -side * .4 + fx * .35;
    if (c.ears === 'leaf') paint(through([F(u + side * .02, .06), F(u - side * .1, -.02), F(u - side * .27, -.3), F(u - side * .1, -.14), F(u, -.14)], 3), { wash: c.skin, ink: MS_INK, sw: .28 * kk, br: 'inkfine', curv: .3 });
    else { const e = F(u, -.03); paint(ellPts(e[0], e[1], s * .075, s * .12, 12, 0, tl), { wash: c.skin, ink: MS_INK, sw: .28 * kk, br: 'inkfine', curv: .5 }); }
    if (c.circlet) { const d = F(u, .18); inkLine([F(u, .09), d], .2 * kk, c.trim, 'inkfine', 0); paint(ellPts(d[0], d[1] + s * .04, s * .035, s * .05, 10, 0, tl), { wash: c.jewel, ink: MS_INK, sw: .15 * kk, br: 'inkfine' }); }
  };
  if (at > .12) ear(sg); else { ear(1); ear(-1); }
  const face = through([F(-.03 + fx * .4, -.5), F(.26 + fx * .5, -.46), F(.4 + fx * .45, -.24), F(.4 + fx * .5, .02), F(.33 + fx * .55, .3), F(.14 + fx * .9, .47), F(-.02 + fx * .9, .5), F(-.17 + fx * .8, .46), F(-.31 + fx * .45, .3), F(-.39 + fx * .3, .02), F(-.4 + fx * .2, -.24), F(-.28 + fx * .1, -.46)], 4);
  paint(face, { wash: c.skin, ink: MS_INK, sw: .33 * kk, br: 'inkfine', curv: .2 });
  paint(through([F(-ls * .39 + fx * .3, -.2), F(-ls * .39 + fx * .3, .05), F(-ls * .3 + fx * .45, .32), F(-ls * .1 + fx * .85, .48), F(-ls * .14 + fx * .7, .4), F(-ls * .24 + fx * .4, .14), F(-ls * .28 + fx * .3, -.14)], 3), { wash: c.skinSh, washOp: 85, ink: null, curv: .4 });
  paint(ellPts(...F(ls * .2 + fx, .12), s * .1, s * .06, 12, 0, tl), { wash: c.lip, washOp: 40, ink: null });
  paint(ellPts(...F(-ls * .2 + fx, .12), s * .08, s * .05, 12, 0, tl), { wash: c.lip, washOp: 40, ink: null });
  if (c.freckles) for (let i = 0; i < 9; i++) paint(ellPts(...F(fx * 1.1 + (hash(i + 3) - .5) * .5, .1 + (hash(i + 11) - .5) * .14), s * .012, s * .012, 6), { wash: c.skinSh, washOp: 110, ink: null });
  const eye = side => {
    const far = (side !== sg && at > .05) ? at : 0, ew = .115 * (1 - .42 * far) * (1 + .05 * (at - far)), eh = .06 * (1 - lids * .85);
    const ex = fx * 1.15 + side * .175 * (1 - .1 * far), ey = -.07, ix = ex + lk[0] * .028 + side * far * .01, iy = ey + lk[1] * .02 + .004;
    const ul = [[ex - side * ew, ey + .006], [ex - side * ew * .45, ey - eh], [ex + side * ew * .25, ey - eh * 1.05], [ex + side * ew, ey - .004]];
    const ll = [[ex + side * ew * .5, ey + eh * .8], [ex - side * ew * .45, ey + eh * .7]];
    paint(through(ul.concat(ll).map(p => F(p[0], p[1])), 3), { wash: MS_EYEW, ink: null, curv: .4 });
    const iry = Math.min(.047, eh * .95);
    paint(ellPts(...F(ix, iy), s * .047, s * iry, 14, 0, tl), { wash: c.eye, ink: null });
    paint(ellPts(...F(ix, iy), s * .022, s * Math.min(.022, iry * .6), 10, 0, tl), { wash: MS_INK, ink: null });
    paint(ellPts(...F(ix - ls * .016, iy - .014), s * .011, s * .009, 8), { wash: MS_EYEW, ink: null });
    paint(through([F(ex - side * ew * 1.05, ey), F(ex - side * ew * .4, ey - eh * 1.5), F(ex + side * ew * .5, ey - eh * 1.5), F(ex + side * ew * 1.05, ey - .01), F(ex + side * ew * .3, ey - eh * 1.05), F(ex - side * ew * .45, ey - eh)], 2), { wash: c.skinSh, washOp: 55, ink: null, curv: .4 });
    inkLine(ul.map(p => F(p[0], p[1])).concat([F(ex + side * ew * 1.12, ey - .03)]), .36 * kk, MS_INK, 'inkfine', .5);
    inkLine(ll.map(p => F(p[0], p[1])), .14 * kk, shade, 'inkfine', .5);
    const raise = br + (side === sg ? ba : -ba * .25);
    const bw = [[ex - side * ew * 1.1, ey - .14 - raise * .03], [ex - side * ew * .35, ey - .205 - raise * .05], [ex + side * ew * .8, ey - .2 - raise * .06], [ex + side * ew * 1.35, ey - .15 - raise * .045]].map(p => F(p[0], p[1]));
    paint(msTube(bw, [s * .012, s * .03, s * .03, s * .01]), { wash: c.brow, ink: null, curv: .4 });
  };
  eye(-1); eye(1);
  const nx = fx * 1.4;
  paint(through([F(nx - sg * .03, -.02), F(nx - sg * .07, .14), F(nx - sg * .02, .19), F(nx, .05)], 3), { wash: c.skinSh, washOp: 60, ink: null, curv: .4 });
  inkLine(through([F(nx - sg * .04, -.04), F(nx + sg * .055, .1), F(nx + sg * .09, .17), F(nx + sg * .03, .2), F(nx - sg * .02, .17)], 3), .25 * kk, shade, 'inkfine', .5);
  inkLine([F(nx - sg * .06, .15), F(nx - sg * .09, .18), F(nx - sg * .05, .2)], .18 * kk, shade, 'inkfine', .5);
  const mx = fx * 1.25, my = .3, mw = .17 * (1 - .12 * at), op = m.open || 0, sm = m.smile || 0, gap = op * .05;
  const Lc = F(mx - mw, my - sm * .03 + .01), Rc = F(mx + mw, my - sm * .03 + .01);
  if (op > .05) paint(through([Lc, F(mx, my + .004), Rc, F(mx, my + .006 + gap)], 3), { wash: '#4A1E2A', ink: null, curv: .3 });
  paint(through([Lc, F(mx - mw * .5, my + .006 + gap), F(mx, my + .008 + gap), F(mx + mw * .5, my + .006 + gap), Rc, F(mx + mw * .5, my + .06 + gap * .6), F(mx, my + .075 + gap * .7), F(mx - mw * .5, my + .06 + gap * .6)], 3), { wash: c.lip, ink: null, curv: .3 });
  paint(through([Lc, F(mx - mw * .5, my - .028), F(mx - .025, my - .04), F(mx, my - .03), F(mx + .025, my - .04), F(mx + mw * .5, my - .028), Rc, F(mx + mw * .45, my + .005), F(mx, my + .008), F(mx - mw * .45, my + .005)], 3), { wash: msDark(c.lip, .25), ink: null, curv: .3 });
  inkLine([Lc, F(mx - mw * .5, my + .003), F(mx, my + .008), F(mx + mw * .5, my + .003), Rc], .24 * kk, msDark(c.lip, .6), 'inkfine', .5);
  inkLine([F(mx - mw * .55, my + .08 + gap * .6), F(mx, my + .1 + gap * .7), F(mx + mw * .55, my + .08 + gap * .6)], .16 * kk, c.skinSh, 'inkfine', .5);
  inkLine([F(mx - .07, my + .16), F(mx, my + .18), F(mx + .07, my + .16)], .16 * kk, shade, 'inkfine', .5);
}

// ---------- hair ----------
function msHairBack(cx, cy, s, c, o = {}) {
  const t = clamp(o.turn || 0, -1, 1), sg = t >= 0 ? 1 : -1, fx = t * .1, wd = o.wind || 0, ln = o.len ?? 1, tl = o.tilt || 0, co = Math.cos(tl), si = Math.sin(tl), kk = msK(s);
  const F = (u, v) => [cx + s * (u * co - v * si), cy + s * (u * si + v * co)];
  const st = c.style, inkO = { ink: MS_INK, sw: .3 * kk, br: 'inkfine', curv: .3 };
  let P;
  if (st === 'waves') P = [F(-.46 + fx, -.3), F(-.2 + fx, -.62), F(.25 + fx, -.6), F(.5 + fx, -.3), F(.58, .15), F(.52, .7), F(.66 + wd * .3, 1.25), F(.5 + wd * .7, 1.85 * ln), F(.05 + wd, 2.15 * ln), F(-.4 + wd * .8, 1.95 * ln), F(-.62 + wd * .3, 1.35), F(-.52, .75), F(-.58, .2)];
  else if (st === 'braid') P = [F(-.45 + fx, -.32), F(-.15 + fx, -.63), F(.25 + fx, -.6), F(.48 + fx, -.3), F(.5, .2), F(.46 + wd * .3, .9), F(.5 + wd * .8, 1.6 * ln), F(.3 + wd * 1.1, 2.1 * ln), F(-.1 + wd * 1.2, 2.2 * ln), F(-.4 + wd * .9, 1.9 * ln), F(-.5 + wd * .3, 1.2), F(-.5, .4)];
  else if (st === 'curls') {
    paint(ellPts(...F(-sg * .6 + fx * .4, -.02), s * .17, s * .2, 12, 0, tl), { wash: c.hair, ...inkO });
    P = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, r = 1 + (i % 2 ? .07 : -.05); P.push(F(fx * .5 + Math.cos(a) * .66 * r, Math.min(.98, .1 + Math.sin(a) * .82 * r))); }
  } else {
    P = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI, r = .56 + (i % 2 ? .07 : 0); P.push(F(fx * .4 + Math.cos(a) * r, -.08 + Math.sin(a) * r * 1.1)); }
    P.push(F(.5 + fx * .4, .12), F(-.5 + fx * .4, .12));
  }
  paint(through(P, 4), { wash: c.hair, fill: c.hairDk, fillOp: 80, bleed: .1, tex: .55, ...inkO });
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
  const st = c.style, inkO = { ink: MS_INK, sw: .28 * kk, br: 'inkfine', curv: .3 };
  if (st === 'crop') {
    const P = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI, r = .52 + (i % 2 ? .06 : 0); P.push(F(fx * .5 + Math.cos(a) * r, -.06 + Math.sin(a) * r * 1.05)); }
    P.push(F(.4 + fx * .5, -.3), F(.2 + fx * .6, -.37), F(fx * .7, -.4), F(-.2 + fx * .6, -.37), F(-.4 + fx * .4, -.3));
    paint(through(P, 3), { wash: c.hair, ...inkO });
    for (let i = 0; i < 4; i++) { const u = -.3 + i * .2 + fx * .6, v = -.44; inkLine([F(u - .05, v - .02), F(u + .03, v - .08), F(u + .06, v + .02), F(u, v + .05)], .22 * kk, i % 2 ? c.hairLt : c.hairDk, 'inkfine', .8); }
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
    for (let i = 0; i < 9; i++) { const j = Math.min(n - 1, Math.round(i * (n - 1) / 8)), p = C[j], a = msAng(C[Math.max(0, j - 1)], C[Math.min(n - 1, j + 1)]), r = s * (.085 - i * .004); paint(ellPts(p[0] + Math.cos(a + Math.PI / 2) * (i % 2 ? 1 : -1) * s * .02, p[1] + Math.sin(a + Math.PI / 2) * (i % 2 ? 1 : -1) * s * .02, r, r * .72, 10, 0, a + (i % 2 ? .6 : -.6)), { wash: c.hair, ...inkO }); }
    for (let i = 0; i < 9; i += 2) { const j = Math.min(n - 1, Math.round(i * (n - 1) / 8)), p = C[j]; inkLine([[p[0] - s * .03, p[1] - s * .02], [p[0] + s * .03, p[1] + s * .02]], .2 * kk, c.hairLt, 'inkfine', .3); }
    paint(ellPts(path[0][0], path[0][1], s * .065, s * .05, 10, 0, tl), { wash: c.jewel, ink: MS_INK, sw: .2 * kk, br: 'inkfine' });
    paint(ellPts(path[0][0], path[0][1], s * .02, s * .02, 6), { wash: c.trim, ink: null });
    msStrand(F, -.44 * sg + fx * .2, -.25, -.5 * sg + fx * .2 + wd * .3, .7, .05, 1, c.hair, .5 * kk); msStrand(F, -.46 * sg + fx * .2, -.2, -.52 * sg + fx * .2 + wd * .3, .65, .05, 1, c.hairLt, .2 * kk);
  } else if (st === 'curls') {
    for (let i = 0; i < 6; i++) { const q = i / 5, u = -.36 + q * .76 + fx * .5, v = -.33 - Math.sin(q * Math.PI) * .09; paint(ellPts(...F(u, v), s * .09, s * .08, 10, 0, tl), { wash: c.hair, ...inkO }); }
    for (let i = 0; i < 3; i++) { const u = -.25 + i * .25 + fx * .5; inkLine([F(u - .04, -.42), F(u + .02, -.47), F(u + .05, -.4)], .2 * kk, c.hairLt, 'inkfine', .8); }
    const pin = F(sg * .32 + fx * .5, -.46);
    paint(starPts(pin[0], pin[1], s * .08, .55, 5, tl - Math.PI / 2), { wash: c.jewel, ink: MS_INK, sw: .18 * kk, br: 'inkfine', curv: .4 });
    paint(ellPts(pin[0], pin[1], s * .022, s * .022, 6), { wash: c.trim, ink: null });
  }
  if (c.circlet) {
    const B = [F(-.44 + fx * .2, -.3), F(-.2 + fx * .6, -.44), F(fx * 1.1, -.47), F(.2 + fx * .8, -.44), F(.45 + fx * .5, -.3)];
    inkLine(B, .45 * kk, c.trim, 'inkfine', .5);
    for (let i = 0; i < 5; i++) { const [u, v] = [[-.36, -.36], [-.18, -.44], [fx * .1, -.47], [.18, -.44], [.36, -.36]][i], uu = u + fx * .6; paint([F(uu - .035, v), F(uu, v - .085), F(uu + .035, v), F(uu, v + .02)], { wash: c.trim, ink: msDark(c.trim, .5), sw: .15 * kk, br: 'inkfine', curv: .3 }); }
  }
}

// ---------- body ----------
// J: mapped joints (head, neck?, shL, shR, hipL, hipR). o: light (±1), waist, sash colour, vine (gold embroidery).
function msTorso(J, c, s, o = {}) {
  const { shL, shR, hipL, hipR, head } = J, kk = msK(s), light = o.light ?? 1, cov = !!c.sleeve;
  const mS = msMid(shL, shR), mH = msMid(hipL, hipR), ax = msAng(shL, shR), dn = msAng(mS, mH);
  const hw = msDist(hipL, hipR) / 2, sw2 = msDist(shL, shR) / 2;
  const wst = msMid(mS, mH, .66), ww = hw * (o.waist ?? .72), wL = msOff(wst, ax, -ww), wR = msOff(wst, ax, ww);
  const bst = msMid(mS, mH, .3), bw = sw2 * .86, bL = msOff(bst, ax, -bw), bR = msOff(bst, ax, bw);
  const capL = msOff(shL, ax, -s * .08), capR = msOff(shR, ax, s * .08);
  const nb = J.neck || msOff(mS, dn, -s * .02);
  const nL = cov ? msOff(capL, dn, s * .04) : msOff(msOff(shL, ax, s * .1), dn, s * .24), nR = cov ? msOff(capR, dn, s * .04) : msOff(msOff(shR, ax, -s * .1), dn, s * .24), nM = cov ? msOff(nb, dn, s * .14) : msOff(mS, dn, s * .3);
  const top = msMid(head, nb, .55), nw = s * .13;
  paint([msOff(top, ax, -nw), msOff(top, ax, nw), msOff(nb, ax, nw * 1.35), msOff(nb, ax, -nw * 1.35)], { wash: c.skin, ink: null });
  paint(light > 0 ? [msOff(top, ax, -nw), msOff(top, ax, -nw * .3), msOff(nb, ax, -nw * .5), msOff(nb, ax, -nw * 1.35)] : [msOff(top, ax, nw), msOff(top, ax, nw * .3), msOff(nb, ax, nw * .5), msOff(nb, ax, nw * 1.35)], { wash: c.skinSh, washOp: 90, ink: null });
  const upper = through([msOff(capL, dn, s * .18), msOff(capL, dn, s * .02), msOff(shL, dn, -s * .06), msOff(msMid(shL, mS, .55), dn, -s * .11), msOff(nb, dn, s * .02), msOff(msMid(shR, mS, .55), dn, -s * .11), msOff(shR, dn, -s * .06), msOff(capR, dn, s * .02), msOff(capR, dn, s * .18), nR, nM, nL], 3);
  paint(upper, { wash: c.skin, ink: MS_INK, sw: .3 * kk, br: 'inkfine', curv: .3 });
  inkLine([msOff(top, ax, -nw), msOff(nb, ax, -nw * 1.3)], .22 * kk, msDark(c.skinSh, .3), 'inkfine', 0); inkLine([msOff(top, ax, nw), msOff(nb, ax, nw * 1.3)], .22 * kk, msDark(c.skinSh, .3), 'inkfine', 0);
  if (!cov) {
    const cb = msDark(c.skinSh, .2);
    inkLine([msOff(nb, dn, s * .1), msOff(msOff(nb, dn, s * .07), ax, s * .26), msOff(msOff(nb, dn, s * .11), ax, s * .4)], .2 * kk, cb, 'inkfine', .5);
    inkLine([msOff(nb, dn, s * .1), msOff(msOff(nb, dn, s * .07), ax, -s * .26), msOff(msOff(nb, dn, s * .11), ax, -s * .4)], .2 * kk, cb, 'inkfine', .5);
    const sc = light > 0 ? capL : capR, sd = light > 0 ? -1 : 1;
    paint(through([msOff(sc, dn, s * .03), msOff(msOff(sc, dn, s * .1), ax, -sd * s * .12), msOff(msOff(sc, dn, s * .2), ax, -sd * s * .06), msOff(sc, dn, s * .2)], 3), { wash: c.skinSh, washOp: 80, ink: null, curv: .3 });
  }
  const apL = msOff(msOff(shL, ax, s * .06), dn, s * .45), apR = msOff(msOff(shR, ax, -s * .06), dn, s * .45);
  const bod = through([nL, nM, nR, apR, bR, wR, hipR, hipL, wL, bL, apL], 3);
  paint(bod, { wash: c.gown, ink: MS_INK, sw: .32 * kk, br: 'inkfine', curv: .3 });
  const shP = light > 0 ? [nL, msMid(nL, nR, .3), msMid(bL, bR, .28), msMid(wL, wR, .25), msMid(hipL, hipR, .3), hipL, wL, bL] : [nR, msMid(nL, nR, .7), msMid(bL, bR, .72), msMid(wL, wR, .75), msMid(hipL, hipR, .7), hipR, wR, bR];
  paint(shP, { fill: c.gownDk, fillOp: 120, bleed: .12, tex: .5, ink: null, curv: .3 });
  paint(light > 0 ? [msMid(bL, bR, .6), msMid(bL, bR, .78), msMid(wL, wR, .7), msMid(wL, wR, .55)] : [msMid(bL, bR, .4), msMid(bL, bR, .22), msMid(wL, wR, .3), msMid(wL, wR, .45)], { wash: c.gownLt, washOp: 70, ink: null, curv: .5 });
  inkLine([msOff(nM, dn, s * .1), msMid(bL, bR, .5), msMid(wL, wR, .5)], .2 * kk, c.gownDk, 'inkfine', .5);
  inkLine([nL, nM, nR], .45 * kk, c.trim, 'inkfine', .5);
  if (o.sash) paint([msOff(wL, dn, -s * .08), msOff(wR, dn, -s * .08), msOff(wR, dn, s * .1), msOff(wL, dn, s * .1)], { wash: o.sash, ink: MS_INK, sw: .28 * kk, br: 'inkfine', curv: .2 });
  else if (o.vine !== false) {
    const V = []; for (let i = 0; i <= 8; i++) { const q = i / 8; V.push(msOff(msMid(msMid(nL, nR, .5), msMid(wL, wR, .5), q), ax, Math.sin(q * 9) * s * .09)); }
    inkLine(V, .3 * kk, c.trim, 'inkfine', .6);
    for (let i = 1; i < 8; i += 2) paint(ellPts(V[i][0], V[i][1], s * .04, s * .02, 8, 0, ax + (i % 4 ? .7 : -.7)), { wash: c.trim, ink: null });
    if (cov) for (let i = 0; i < 6; i++) { const p = msMid(msMid(bL, bR, .15 + hash(i) * .7), msMid(hipL, hipR, .15 + hash(i) * .7), hash(i + 5)); paint(ellPts(p[0], p[1], s * .05, s * .025, 8, 0, hash(i + 9) * 3), { wash: c.trim, ink: null }); }
  }
}
// Skirt from the hip line down to a hem (canvas points, listed from the right hip side around to the left).
// o: col, dk, lt, light, folds, rise (how far above the hip joints the waist sits), trim (hem colour), k (stroke scale).
function msSkirt(hipL, hipR, hem, c, o = {}) {
  const col = o.col || c.gown, dk = o.dk || c.gownDk, lt = o.lt || c.gownLt, light = o.light ?? 1, kk = o.k ?? 1;
  const ax = msAng(hipL, hipR), hd = msDist(hipL, hipR), rise = o.rise ?? hd * .55;
  const tl = msOff(hipL, ax - Math.PI / 2, rise), tr = msOff(hipR, ax - Math.PI / 2, rise);
  const Hm = through(hem, 3);
  paint([tl, tr].concat(Hm), { wash: col, ink: MS_INK, sw: .3 * kk, br: 'inkfine', curv: .15 });
  const n = hem.length, m = Math.max(1, Math.round(n * .3)), hemL = hem.slice(n - m), hemR = hem.slice(0, m + 1);
  const t42 = msMid(tl, tr, .42), t58 = msMid(tl, tr, .58);
  const shP = light > 0 ? [t42, msMid(t42, hemL[0], .5)].concat(hemL, [tl]) : [t58, msMid(t58, hemR[hemR.length - 1], .5)].concat(hemR.slice().reverse(), [tr]);
  paint(shP, { fill: dk, fillOp: 115, bleed: .12, tex: .55, ink: null, curv: .3 });
  const hi = light > 0 ? [msMid(tl, tr, .6), msMid(tl, tr, .74), hem[Math.floor(n * .22)], hem[Math.floor(n * .35)]] : [msMid(tl, tr, .4), msMid(tl, tr, .26), hem[Math.floor(n * .78)], hem[Math.floor(n * .65)]];
  paint(hi, { wash: lt, washOp: 60, ink: null, curv: .3 });
  const nf = o.folds ?? 4;
  for (let i = 1; i <= nf; i++) { const q = i / (nf + 1), a = msMid(tl, tr, q), b = hem[Math.round((1 - q) * (n - 1))], md = msMid(a, b, .55); inkLine([a, [md[0] + (hash(i * 3.1) - .5) * hd * .2, md[1]], b], .22 * kk, dk, 'inkfine', .6); }
  if (o.trim) inkLine(Hm, .35 * kk, o.trim, 'inkfine', .3);
}
// A draped shawl or sleeve along P (canvas points): one tapered ribbon with a fold line and a gold edge.
function msDrape(P, s, c, o = {}) {
  const col = o.col || c.gown, R = ribbon(P, (o.w0 ?? .32) * s, (o.w1 ?? .55) * s), C = through(P, 6), n = C.length;
  paint(R, { wash: col, fill: o.dk || c.gownDk, fillOp: 70, bleed: .1, tex: .5, ink: MS_INK, sw: .3 * msK(s), br: 'inkfine', curv: .3 });
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
    hairFront: () => msHairFront(J.head[0], J.head[1], hs, c, hairO)
  };
  for (const q of p.order || MS_ORDER) if (steps[q]) steps[q]();
  return J;
}
