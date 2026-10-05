// cast.js: the adult cast of the five Midsummer panels and the parts that draw them (prefix md).
// Figures are built from filleted organic spines (rounded elbows, knees and wrists), almond eyes, layered lips and folded
// cloth, painted with opaque washes, transparent shade bands and lit glazes, then fine open 'inkfine' contours.

const CAST = {
  titania: { id: 'titania', skin: MD.olive, skinSh: MD.oliveSh, skinLt: MD.oliveLt, blush: '#D9746A',
    hair: MD.auburn, hairLt: MD.auburnLt, hairDk: MD.auburnDk, brow: '#4E1A14', iris: '#7D6A2C', lip: '#B04656', lipDk: '#7A2A38',
    style: 'long', hairLen: 2.3, hairW: .62, part: -1, faceW: .33, jaw: .9, chin: .1, nose: 1.1, browW: 1,
    gown: MD.magenta, gownDk: MD.magentaDk, gownLt: MD.magentaLt, trim: MD.gold, sash: MD.gold,
    wrap: true, vine: true, crown: true, earrings: true, shoe: 'sandal', shoeCol: MD.gold },
  helena: { id: 'helena', skin: MD.pale, skinSh: MD.paleSh, skinLt: MD.paleLt, blush: '#EE9A8E',
    hair: MD.honey, hairLt: MD.honeyLt, hairDk: MD.honeyDk, brow: '#8C6430', iris: '#6E8EAE', lip: '#C9606A', lipDk: '#8E3A44',
    style: 'braid', hairLen: 2.0, hairW: .56, part: 1, faceW: .32, jaw: .86, chin: .09, nose: 1.05, browW: 1, freckles: true, braid: true,
    gown: MD.sapphire, gownDk: MD.sapphireDk, gownLt: MD.sapphireLt, over: MD.turq, overDk: MD.turqDk, overLt: MD.turqLt,
    trim: MD.gold, sash: MD.gold, shoe: 'slipper', shoeCol: '#2E62C8' },
  hermia: { id: 'hermia', skin: MD.brown, skinSh: MD.brownSh, skinLt: MD.brownLt, blush: '#A2493E',
    hair: MD.chestnut, hairLt: MD.chestnutLt, hairDk: MD.curl, brow: '#21120E', iris: '#3B2014', lip: '#7E3238', lipDk: '#4E1C22',
    style: 'curls', hairLen: .95, hairW: .6, part: -1, faceW: .34, jaw: .92, chin: .11, nose: 1, browW: 1.3, pin: true,
    gown: MD.emerald, gownDk: MD.emeraldDk, gownLt: MD.emeraldLt, trim: MD.gold, sash: MD.ruby,
    sleeve: { col: '#25A774', dk: MD.emeraldDk, len: .72, w: 1.4, trim: MD.gold }, shoe: 'slipper', shoeCol: MD.rubyDk },
  puck: { id: 'puck', skin: MD.tan, skinSh: MD.tanSh, skinLt: MD.tanLt, blush: '#B8664E',
    hair: MD.curl, hairLt: '#5A3A2C', hairDk: '#160E10', brow: '#1E120E', iris: '#4A5A2A', lip: '#94504A', lipDk: '#5E2E2A',
    style: 'short', part: 1, faceW: .36, jaw: 1.0, chin: .15, nose: 1.15, browW: 1.45, male: true, ears: true, stubble: true, tunic: true,
    gown: MD.violet, gownDk: MD.violetDk, gownLt: MD.violetLt, leafCol: MD.turq, trouser: MD.turqDk, sash: '#6B4128',
    sleeve: { col: MD.violet, dk: MD.violetDk, len: 1.0, w: 1.2, trim: MD.turq }, shoe: 'boot', shoeCol: '#6B4128' }
};

const mdLW = s => Math.min(.5, .14 + s * .0011);
const mdV = {
  add: (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  nrm: a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
  mid: (a, b, k = .5) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)],
  perp: a => [-a[1], a[0]]
};
// a rounded joint: replaces the corner b of a-b-c with three points so the limb bends on an arc, not a crease
function mdBend(a, b, c, r = .2) {
  const p = mdV.mid(b, a, r), q = mdV.mid(b, c, r);
  return [p, mdV.mid(mdV.mid(p, q), b, .5), q];
}
// joints given in head units relative to (x, y): mdPose(x, y, s, { head: [0, -6.2], sL: [-.75, -5.3], ... })
function mdPose(x, y, s, rel) {
  const P = { hs: s };
  for (const k in rel) P[k] = Array.isArray(rel[k]) ? [x + rel[k][0] * s, y + rel[k][1] * s] : rel[k];
  return P;
}
// scalloped outline for curls
function mdBumpy(P, r, seed = 1) {
  let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= P.length; cy /= P.length;
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], m = mdV.mid(a, b), d = mdV.nrm([m[0] - cx, m[1] - cy]), k = r * (.6 + .8 * mdH(seed, i));
    out.push(a, [m[0] + d[0] * k, m[1] + d[1] * k]);
  }
  return out;
}
const mdShadow = (x, y, rx, ry, op = 70, col = '#2A1840') => mdWash(mdBlob(x, y, rx, ry, 2, 16, .1), col, op, .5);

// ---------- face ----------
function mdEye(C, x, y, w, h, e, k, look, sw, lid) {
  const X = u => x + e * u * w;
  mdWash([[X(-.5), y + h * .05], [X(-.22), y - h * .85], [X(.2), y - h * .95], [X(.5), y - h * .2], [X(.22), y + h * .5], [X(-.2), y + h * .52]], '#F3EBE4', 255, .5);
  const ix = x + look[0] * w * .22, iy = y - h * .2 + look[1] * h * .22, ir = h * .72;
  mdWash(ellPts(ix, iy, ir * k, ir, 14), C.iris);
  mdWash(ellPts(ix, iy + ir * .25, ir * .8 * k, ir * .55, 10), mixCol(C.iris, '#FFFFFF', .25), 120);
  mdWash(ellPts(ix, iy, ir * .46 * k, ir * .46, 10), MD.ink);
  mdWash(ellPts(ix - ir * .3 * k, iy - ir * .35, ir * .17, ir * .17, 8), MD.cream);
  const ly = lid * h * .6;
  mdWash([[X(-.62), y + h * .08], [X(-.22), y - h * .85 + ly], [X(.2), y - h * .95 + ly], [X(.6), y - h * .18], [X(.66), y - h * 1.5], [X(-.62), y - h * 1.55]], mixCol(C.skin, C.skinSh, .22), 255, .5);
  mdWash([[X(-.5), y - h * .1], [X(-.2), y - h * .95 + ly], [X(.2), y - h * 1.05 + ly], [X(.55), y - h * .3], [X(.2), y - h * .7 + ly], [X(-.2), y - h * .62 + ly]], mixCol(C.iris, MD.ink, .6), 60, .5);
  inkLine([[X(-.5), y + h * .05], [X(-.22), y - h * .85 + ly], [X(.2), y - h * .95 + ly], [X(.52), y - h * .22], [X(.64), y - h * .12]], sw * 1.5, MD.ink, 'inkfine', .5);
  inkLine([[X(.48), y - h * .1], [X(.22), y + h * .5], [X(-.2), y + h * .52], [X(-.46), y + h * .12]], sw * .55, C.skinSh, 'inkfine', .5);
  inkLine([[X(-.36), y - h * 1.15], [X(.02), y - h * 1.42], [X(.42), y - h * 1.0]], sw * .55, C.skinSh, 'inkfine', .5);
  inkLine([[X(-.3), y + h * .9], [X(.05), y + h * 1.05], [X(.35), y + h * .85]], sw * .4, mixCol(C.skin, C.skinSh, .5), 'inkfine', .5);
}
function mdEar(C, x, y, s, g) {
  const sw = mdLW(s);
  paint(mdBlob(x + g * .02 * s, y, .05 * s, .1 * s, 3, 12, .06), { wash: C.skin, ink: MD.ink, sw, br: 'inkfine', curv: .5 });
  mdLine([[x + g * .03 * s, y - .05 * s], [x + g * .05 * s, y], [x + g * .025 * s, y + .05 * s]], sw * .6, C.skinSh);
}
// Puck's pointed leaf-shaped ear, drawn over the curls so it reads clearly
function mdLeafEar(C, x, y, s, g) {
  const sw = mdLW(s), a = g > 0 ? -.62 : -Math.PI + .62, L = .46 * s;
  mdShape(mdBlob(x + g * .01 * s, y + .07 * s, .04 * s, .055 * s, 5, 10, .08), C.skin, { sw, curv: .5 });
  paint(mdLeafPts(x - g * .02 * s, y + .02 * s, L, a, .5), { wash: C.skin, ink: MD.ink, sw: sw * 1.1, br: 'inkfine', curv: .5 });
  mdWash(mdLeafPts(x, y + .025 * s, L * .7, a + g * .1, .3), C.skinSh, 130, .5);
  const tip = [x + Math.cos(a) * L * .92, y + .02 * s + Math.sin(a) * L * .92];
  mdLine([[x, y + .03 * s], mdV.mid([x, y + .03 * s], tip, .5), tip], sw * .7, mixCol(C.skinSh, MD.ink, .3), .5);
  mdLine([[x - g * .015 * s, y - .02 * s], [x + Math.cos(a - g * .25) * L * .55, y + Math.sin(a - g * .25) * L * .55]], sw * 1.4, C.skinLt, .5);
}
// o: turn -1..1 (+ faces screen right), tilt, look [x, y], brow, browL, browR, worry, knit, lid, mouth 0..1, smile -1..1, wind
function mdHead(C, x, y, s, o = {}) {
  const t = clamp(o.turn || 0, -.85, .85), d = t < 0 ? -1 : 1, at = Math.abs(t), th = t * .8;
  const sw = mdLW(s), sn = Math.sin(th), r = .36 * s, fx = r * sn, hw = s * C.faceW, look = o.look || [t * .6, 0];
  push(); translate(x, y); rotate(o.tilt || 0);
  const kF = 1 - .12 * at, kN = 1 + .03 * at, kR = t > 0 ? kF : kN, kL = t > 0 ? kN : kF, fb = .035 * s * at;
  const side = (k, g, bump) => [[g * hw * .72 * k, -.46 * s], [g * hw * .97 * k, -.24 * s], [g * (hw * k + bump), -.02 * s],
    [g * hw * .9 * k * C.jaw, .2 * s], [g * hw * .62 * k * C.jaw + fx * .2, .38 * s], [fx * .55 + g * C.chin * s, .48 * s]];
  const R = side(kR, 1, t > 0 ? fb : 0), L = side(kL, -1, t < 0 ? fb : 0), chin = [fx * .55, .505 * s];
  const F = [[0, -.53 * s], ...R, chin, ...L.slice().reverse()];
  const earX = g => g * hw * (g > 0 ? kR : kL) * .97, earG = at < .2 ? [-1, 1] : [-d];
  if (!C.ears) for (const g of earG) mdEar(C, earX(g), .05 * s, s, g);
  paint(F, { wash: C.skin, ink: MD.ink, sw, br: 'inkfine', curv: .5 });
  // modelling: far side shade, temple and socket shade, forehead/cheekbone/chin light, blush
  const far = t >= 0 ? R : L, g0 = t >= 0 ? 1 : -1;
  mdWash([...far, ...far.slice().reverse().map(([px, py]) => [lerp(px, fx, .32), py])], C.skinSh, 60 + 50 * at, .5);
  mdWash(mdBlob(g0 * hw * .72, -.2 * s, .07 * s, .12 * s, 4, 12, .1), C.skinSh, 50, .5);
  mdWash(mdBlob(-g0 * hw * .6 + fx * .3, .17 * s, .07 * s, .03 * s, 5, 12, .1, -g0 * .4), C.skinSh, 40, .5);
  mdWash(mdBlob(fx * .45 - g0 * hw * .12, -.22 * s, hw * .5, .07 * s, 21, 14, .12), C.skinLt, 100, .5);
  mdWash(mdBlob(fx - g0 * .19 * s * (1 - .3 * at), .07 * s, .08 * s, .028 * s, 22, 12, .1, -g0 * .25), C.skinLt, 110, .5);
  mdWash(mdBlob(fx * .55, .43 * s, .045 * s, .025 * s, 23, 10, .1), C.skinLt, 90, .5);
  mdWash(ellPts(fx - g0 * .17 * s * (1 - .3 * at), .13 * s, .075 * s, .04 * s, 12), C.blush, 40);
  // mature jaw shadow and stubble
  if (C.male) {
    const jaw = [...R.slice(3), chin, ...L.slice(3).reverse(), [L[3][0] * .8, .2 * s], [R[3][0] * .8, .2 * s]];
    mdWash(jaw, mixCol(C.skinSh, '#3A3550', .3), 85, .5);
    const mx0 = sn * r * 1.02;
    mdWash([[mx0 - .1 * s, .27 * s], [mx0, .245 * s], [mx0 + .1 * s, .27 * s], [mx0 + .09 * s, .29 * s], [mx0 - .09 * s, .29 * s]], mixCol(C.skinSh, '#3A3550', .3), 70, .5);
    if (C.stubble) {
      const sc = mixCol(C.skinSh, MD.ink, .45);
      for (let i = 0; i < 46; i++) {
        const yy = lerp(.22, .48, mdH(61, i)) * s, ky = (yy / s - .2) / .3, xr = hw * C.jaw * lerp(.9, .25, clamp(ky));
        const xx = fx * lerp(.2, .55, clamp(ky)) + (mdH(62, i) * 2 - 1) * xr * .92;
        if (Math.abs(yy - .315 * s) < .035 * s && Math.abs(xx - mx0) < .1 * s) continue;
        mdLine([[xx, yy], [xx + .006 * s, yy + .012 * s]], sw * .5, sc, 0);
      }
    }
  }
  // eyes and brows
  const ey = -.02 * s, ew = .135 * s, eh = .042 * s, kn = o.knit || 0, wy = o.worry || 0;
  for (const e of [-1, 1]) {
    const an = th + e * .42, k = Math.max(.25, Math.cos(an)), ex = r * Math.sin(an);
    mdWash(mdBlob(ex - e * ew * k * .2, ey - .045 * s, ew * k * .55, .03 * s, 30 + e, 10, .1), C.skinSh, 45, .5);
    mdEye(C, ex, ey, ew * k, eh, e, k, look, sw, o.lid || 0);
    const rs = (e < 0 ? o.browL : o.browR) ?? o.brow ?? 0, by = ey - .088 * s - rs * .03 * s, bw = C.browW || 1;
    const B = [[ex - e * ew * k * .5 + e * kn * .012 * s, by + .006 * s + kn * .024 * s - rs * .006 * s - wy * .03 * s], [ex - e * ew * k * .05, by - .016 * s - rs * .012 * s - wy * .012 * s],
      [ex + e * ew * k * .38, by - .018 * s + wy * .006 * s], [ex + e * ew * k * .66, by + .012 * s + wy * .012 * s]];
    mdWash(mdTube(B, [.02 * s * bw, .026 * s * bw, .009 * s * bw], 4), C.brow, 235, .4);
    mdLine([[ex - e * ew * k * .35, ey + .045 * s], [ex + e * ew * k * .3, ey + .048 * s]], sw * .4, mixCol(C.skin, C.skinSh, .6));
  }
  const bmax = Math.max(o.brow || 0, o.browL || 0, o.browR || 0, wy);
  if (bmax > .4) for (const k of [0, 1]) mdLine([[fx * .5 - hw * .38, (-.2 - k * .045) * s], [fx * .5, (-.215 - k * .045) * s], [fx * .5 + hw * .38, (-.2 - k * .045) * s]], sw * .45, C.skinSh, .5);
  if (kn > .35) for (const g of [-1, 1]) mdLine([[fx * .92 + g * .024 * s, ey - .12 * s], [fx * .92 + g * .018 * s, ey - .07 * s]], sw * .55, C.skinSh, .5);
  // nose with a lit bridge
  const nl = C.nose || 1, tipX = sn * (r + .1 * s * nl), nw = .045 * s * (1 - .25 * at);
  inkLine([[sn * r * .9 - d * .012 * s, ey - .03 * s], [lerp(sn * r * .9, tipX, .6) - d * .012 * s, .1 * s]], sw * 2.2, C.skinLt, 'ink', .5);
  if (at > .12) {
    mdWash(mdBlob(tipX + d * .02 * s, .13 * s, .018 * s, .055 * s, 6, 10, .1), C.skinSh, 70);
    mdLine([[sn * r * .95 + d * .012 * s, ey - .05 * s], [sn * (r + .05 * s * nl) + d * .01 * s, .09 * s], [tipX + d * .012 * s, .185 * s]], sw * .8, MD.inkSoft, .5);
  } else mdLine([[fx - .02 * s, ey - .04 * s], [fx - .028 * s, .1 * s]], sw * .45, C.skinSh, .5);
  mdWash(mdBlob(tipX, .21 * s, nw * 1.1, .02 * s, 7, 10, .1), C.skinSh, 70, .5);
  mdLine([[tipX - nw, .2 * s], [tipX - nw * .4, .228 * s], [tipX + nw * .3, .226 * s], [tipX + nw, .2 * s]], sw * .8, MD.inkSoft, .5);
  mdLine([[tipX - d * nw * 1.2, .165 * s], [tipX - d * nw * 1.35, .2 * s], [tipX - d * nw * .9, .215 * s]], sw * .6, C.skinSh, .5);
  // mouth
  const mx = sn * r * 1.02, my = .315 * s, mw = .085 * s * (C.male ? .95 : 1), fz = 1 - .4 * at, nz = 1 - .05 * at;
  const hR = mw * (t > 0 ? fz : nz), hL = mw * (t > 0 ? nz : fz), sm = o.smile || 0, op = o.mouth || 0;
  const cy = my - sm * .028 * s, gap = op * .045 * s, ut = .022 * s * (C.male ? .7 : 1), lt = .03 * s * (C.male ? .75 : 1), ly = my + gap;
  const Lc = [mx - hL, cy], Rc = [mx + hR, cy], nearC = d > 0 ? Lc : Rc;
  mdLine([[tipX - d * nw * 1.4, .225 * s], [tipX - d * nw * 1.9, .29 * s], [nearC[0] - d * .014 * s, cy + .03 * s]], sw * .45, mixCol(C.skin, C.skinSh, .7), .5);
  if (gap > .5) {
    mdWash([Lc, [mx - hL * .5, my + .003 * s], [mx + hR * .5, my + .003 * s], Rc, [mx + hR * .5, ly], [mx - hL * .5, ly]], '#4A1E2A', 255, .5);
    if (op > .3) mdWash([[mx - hL * .5, my + .002 * s], [mx + hR * .5, my + .002 * s], [mx + hR * .4, my + gap * .4], [mx - hL * .4, my + gap * .4]], '#EFE4D6', 255, .4);
  }
  mdWash([Lc, [mx - hL * .5, ly + .003 * s], [mx + hR * .5, ly + .003 * s], Rc, [mx + hR * .45, ly + lt * .85], [mx, ly + lt], [mx - hL * .45, ly + lt * .85]], mixCol(C.lip, C.skinLt, .18), 255, .5);
  mdWash(mdBlob(mx - d * hL * .1, ly + lt * .45, hL * .3, lt * .2, 12, 8, .1), mixCol(C.lip, '#FFF2E8', .45), 150, .5);
  mdWash([Lc, [mx - hL * .55, my - ut * .8], [mx - hL * .12, my - ut], [mx, my - ut * .7], [mx + hR * .12, my - ut], [mx + hR * .55, my - ut * .8], Rc, [mx + hR * .5, my + .003 * s], [mx - hL * .5, my + .003 * s]], C.lip, 255, .5);
  mdLine([Lc, [mx - hL * .5, my + .004 * s], [mx, my + .007 * s], [mx + hR * .5, my + .004 * s], Rc], sw * .9, MD.ink, .5);
  if (sm < -.2) for (const c of [Lc, Rc]) mdLine([c, [c[0] + (c === Lc ? -1 : 1) * .012 * s, c[1] + .022 * s]], sw * .5, C.skinSh, .5);
  if (gap > .5) mdLine([[mx - hL * .5, ly], [mx, ly + .003 * s], [mx + hR * .5, ly]], sw * .5, C.lipDk, .5);
  mdLine([[mx - hL * .4, ly + lt + .02 * s], [mx, ly + lt + .026 * s], [mx + hR * .4, ly + lt + .02 * s]], sw * .45, C.skinSh, .5);
  if (C.freckles) for (let i = 0; i < 16; i++) mdWash(ellPts(fx * 1.1 + (mdH(31, i) - .5) * .46 * s, .05 * s + mdH(37, i) * .11 * s, .0065 * s, .0065 * s, 6), MD.freckle, 150);
  mdHairFront(C, s, { fx, hw, d, t, at, wind: o.wind });
  if (C.ears) for (const g of earG) mdLeafEar(C, earX(g), .02 * s, s, g);
  // circlet and earrings
  if (C.crown) {
    const Q = [[-hw * 1.0, -.2 * s], [-hw * .5 + fx * .3, -.33 * s], [fx * .4, -.37 * s], [hw * .5 + fx * .3, -.33 * s], [hw * 1.0, -.2 * s]];
    paint(mdTube(Q, .024 * s, 5, 3), { wash: MD.gold, ink: MD.goldDk, sw: sw * .8, br: 'inkfine', curv: .5 });
    for (let i = 0; i <= 6; i++) { const k = i / 6, lx = lerp(-hw * .9, hw * .9, k) + fx * .35 * (1 - Math.abs(2 * k - 1)), lyy = -.21 * s - .15 * s * Math.sin(k * Math.PI);
      paint(mdLeafPts(lx, lyy, .055 * s, -Math.PI / 2 + (k - .5) * 1.4, .45), { wash: MD.goldLt, ink: MD.goldDk, sw: sw * .6, br: 'inkfine', curv: .5 }); }
    paint(ellPts(fx * .4, -.4 * s, .018 * s, .024 * s, 10), { wash: MD.turq, ink: MD.ink, sw: sw * .6, br: 'inkfine' });
  }
  if (C.earrings) for (const g of at < .3 ? [-1, 1] : [-d]) {
    const ex = g * hw * (g > 0 ? kR : kL) * 1.0, e2 = .15 * s;
    mdWash(ellPts(ex, e2, .012 * s, .012 * s, 8), MD.gold);
    paint([[ex, e2 + .01 * s], [ex + .022 * s, e2 + .055 * s], [ex, e2 + .09 * s], [ex - .022 * s, e2 + .055 * s]], { wash: MD.turq, ink: MD.ink, sw: sw * .6, br: 'inkfine', curv: .6 });
    mdWash(ellPts(ex - .006 * s, e2 + .05 * s, .006 * s, .009 * s, 6), MD.turqLt);
  }
  pop();
}

// ---------- hair ----------
function mdHairBack(C, x, y, s, o = {}) {
  if (C.style === 'short') return;
  const t = o.turn || 0, d = t < 0 ? -1 : 1, wind = o.wind || [0, 0], sw = mdLW(s);
  push(); translate(x, y); rotate((o.tilt || 0) * .7);
  const len = C.hairLen, W0 = C.hairW * s, wave = C.style === 'long' ? 1 : C.style === 'curls' ? .6 : .55, n = 14, Lp = [], Rp = [], bws = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n, yy = lerp(-.15, len, k) * s, f = Math.max(0, yy / s);
    const bw = W0 * (k < .2 ? lerp(.86, 1, k / .2) : lerp(1, .74, (k - .2) / .8)), wv = Math.sin(k * 11 + 1.3) * .045 * s * wave;
    const dx = wind[0] * s * Math.pow(f, 1.25) * .45 - t * .1 * s, dy = wind[1] * s * f * .2;
    Rp.push([bw + wv + dx, yy + dy]); Lp.push([-bw + wv * .8 + dx * .9, yy + dy]); bws.push([bw, wv, dx, yy + dy]);
  }
  const top = [];
  for (let i = 1; i < 8; i++) { const a = Math.PI + i / 8 * Math.PI; top.push([Math.cos(a) * W0 * .86 - t * .1 * s, -.15 * s + Math.sin(a) * .45 * s]); }
  const tips = [];
  for (let j = 1; j < 6; j++) tips.push([lerp(Rp[n][0], Lp[n][0], j / 6), lerp(Rp[n][1], Lp[n][1], j / 6) + (j % 2 ? .14 : -.03) * s]);
  let M = [Lp[0], ...top, ...Rp, ...tips, ...Lp.slice(1).reverse()];
  if (C.style === 'curls') M = mdBumpy(M, .05 * s, 7);
  paint(M, { wash: C.hair, ink: MD.ink, sw, br: 'inkfine', curv: .45 });
  // shadowed inner mass under the head, lit outer waves
  mdWash([Lp[2], Rp[2], Rp[Math.round(n * .55)], Lp[Math.round(n * .55)]].map(([px, py]) => [px * .7, py]), C.hairDk, 90, .5);
  for (let j = 0; j < 8; j++) {
    const u = lerp(-.8, .8, j / 7), Q = [];
    for (const k of [.06, .3, .55, .8, .96]) { const b = bws[Math.round(k * n)]; Q.push([u * b[0] + b[1] + b[2], b[3]]); }
    if (C.style === 'curls') Q.length = 3;
    inkLine(Q, j % 2 ? sw * .6 : sw * 1.5, j % 2 ? C.hairDk : C.hairLt, j % 2 ? 'inkfine' : 'ink', .5);
  }
  if (C.style === 'curls') {
    const kx = -d * .42 * s - t * .05 * s;
    paint(mdBumpy(mdBlob(kx, -.34 * s, .17 * s, .14 * s, 4, 10, .1), .04 * s, 3), { wash: C.hair, ink: MD.ink, sw, br: 'inkfine', curv: .5 });
    mdLine([[kx - .08 * s, -.36 * s], [kx, -.42 * s], [kx + .07 * s, -.33 * s]], sw * 1.3, C.hairLt, .5);
  }
  pop();
}
function mdHairFront(C, s, g) {
  const { fx, hw, d, t } = g, sw = mdLW(s), st = C.style, wind = g.wind || [0, 0];
  const top = st === 'short' ? .57 : .6, sy = (st === 'short' ? -.1 : .08) * s, wF = st === 'curls' ? 1.2 : st === 'short' ? 1.1 : 1.13, sh = -t * .05 * s;
  const hy = (st === 'short' ? -.32 : -.28) * s, xp = fx * .5 + (C.part || -1) * .1 * s;
  let cap = [[-hw * wF * .97 + sh, sy]];
  for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; cap.push([Math.cos(a) * hw * wF + sh, -.06 * s + Math.sin(a) * top * s]); }
  cap.push([hw * wF * .97 + sh, sy], [hw * .97, sy - .02 * s], [hw * .9, -.14 * s], [hw * .62 + fx * .3, hy + .02 * s], [xp + .07 * s, hy - .045 * s], [xp, hy],
    [xp - .08 * s, hy - .05 * s], [-hw * .62 + fx * .3, hy + .03 * s], [-hw * .9, -.14 * s], [-hw * .97, sy - .02 * s]);
  if (st === 'curls' || st === 'short') cap = mdBumpy(cap, (st === 'short' ? .035 : .03) * s, 11);
  paint(cap, { wash: C.hair, ink: MD.ink, sw, br: 'inkfine', curv: .45 });
  mdWash(mdBlob(-d * hw * .7 + sh, -.25 * s, hw * .3, .2 * s, 15, 12, .15), C.hairDk, 80, .5);
  inkLine([[-hw * .55 + sh, -.5 * s], [-hw * .1 + sh, -.6 * s], [hw * .35 + sh, -.56 * s]], sw * 3, C.hairLt, 'ink', .5);
  for (let j = 0; j < 6; j++) {
    const g2 = j < 3 ? -1 : 1, k = (j % 3 + 1) / 4;
    mdLine([[xp + g2 * .03 * s, hy - .05 * s], [lerp(xp, g2 * hw, .5), (-.47 + .08 * k) * s], [g2 * hw * (.85 + .1 * k), (-.2 + .25 * k) * s]], sw * .7, j % 2 ? C.hairLt : C.hairDk, .5);
  }
  if (st === 'long' || st === 'braid') {
    const lock = (x0, len, w0, g2) => {
      const Q = [[x0, -.16 * s], [x0 + g2 * .07 * s + wind[0] * .1 * s, .3 * s], [x0 + g2 * .1 * s + wind[0] * .3 * s, .75 * s], [x0 + g2 * .05 * s + wind[0] * .5 * s, len * s + wind[1] * .2 * s]];
      paint(mdTube(Q, [w0 * s, w0 * .8 * s, w0 * .3 * s], 5, 2), { wash: C.hair, ink: MD.ink, sw, br: 'inkfine', curv: .5 });
      mdLine(Q.map(p => [p[0] + g2 * .015 * s, p[1]]), sw * 1.6, C.hairLt, .5);
      mdLine(Q.slice(1).map(p => [p[0] - g2 * .03 * s, p[1] + .05 * s]), sw * .5, C.hairDk, .5);
    };
    if (g.at < .55) lock(d * hw * .9, .75, .1, d);
    lock(-d * hw * .92, st === 'long' ? 1.3 : 1.1, .15, -d);
  }
  if (C.braid) {
    const n = -d, Q = through([[n * hw * .55 + fx * .3, hy + .02 * s], [n * hw * .88, -.12 * s], [n * hw * 1.02, .12 * s], [n * hw * .98, .34 * s]], 4);
    for (let i = 0; i < Q.length - 1; i++) {
      const a = Math.atan2(Q[i + 1][1] - Q[i][1], Q[i + 1][0] - Q[i][0]) + (i % 2 ? .5 : -.5);
      paint(mdLeafPts(Q[i][0], Q[i][1], .085 * s, a, .55), { wash: C.hairLt, ink: C.hairDk, sw: sw * .8, br: 'inkfine', curv: .5 });
    }
    paint(ellPts(Q[0][0], Q[0][1], .038 * s, .026 * s, 12, 0, .4), { wash: MD.sapphire, ink: MD.ink, sw: sw * .7, br: 'inkfine' });
    mdWash(ellPts(Q[0][0] - .01 * s, Q[0][1] - .006 * s, .01 * s, .007 * s, 6), MD.sapphireLt);
  }
  if (st === 'curls') {
    for (const [cx, cy, rr] of [[-d * hw * .98, .03 * s, .06 * s], [-d * hw * 1.03, .16 * s, .05 * s], [d * hw * 1.04, .17 * s, .045 * s]]) {
      paint(mdBlob(cx, cy, rr, rr * 1.2, cx, 9, .25), { wash: C.hair, ink: MD.ink, sw, br: 'inkfine', curv: .5 });
      const Q = []; for (let a = 0; a < 7.5; a += .75) Q.push([cx + Math.cos(a) * rr * .6 * (1 - a / 10), cy + Math.sin(a) * rr * .7 * (1 - a / 10)]);
      mdLine(Q, sw * .8, C.hairLt, .5);
    }
    if (C.pin) { mdFlowers([[-d * hw * .82, hy + .05 * s, .075 * s, 5, .4]], MD.ruby, MD.goldLt); mdLeaves([[-d * hw * .82, hy + .05 * s, .07 * s, Math.PI * .75, .4]], MD.emerald, MD.ink, sw * .6); }
  }
  if (st === 'short') for (let i = 0; i < 5; i++) {
    const cx = fx * .4 + (i - 2) * .11 * s, cy = hy + .02 * s - Math.abs(i - 2) * .03 * s;
    mdLine([[cx - .03 * s, cy - .03 * s], [cx + .02 * s, cy - .04 * s], [cx + .03 * s, cy], [cx, cy + .02 * s]], sw * .8, C.hairLt, .6);
  }
}

// ---------- limbs ----------
const MD_HANDS = {
  rest: { sp: .07, c: [.3, .35], th: .55, tc: .25 },
  brace: { sp: .13, c: [.08, -.06], th: .75, tc: .05 },
  open: { sp: .2, c: [.02, .12], th: 1.0, tc: -.05 },
  touch: { sp: .09, c: [.5, .42], th: .45, tc: .35 },
  grip: { sp: .05, c: [1.2, 1.05], th: .9, tc: .7 },
  point: { sp: .1, c: [.05, .05], th: .7, tc: .2, curlOthers: true }
};
// hand at wrist w, pointing along angle a; side = which local side the thumb is on; cd = curl direction.
// Rounded finger tubes grow from under a soft palm that also overlaps the forearm, so wrist and finger roots join smoothly.
function mdHand(C, w, a, hs, kind = 'rest', side = 1, cd = 1) {
  const K = MD_HANDS[kind] || MD_HANDS.rest, sw = mdLW(hs * 1.4), X = P => mdXf(P, w[0], w[1], 1, a, 0, 0), pl = .44 * hs;
  const ky = [.12, .042, -.038, -.112], fl = [.33, .38, .36, .28], tip = (p, an, l) => [p[0] + Math.cos(an) * l, p[1] + Math.sin(an) * l];
  const fo = { n: 3, cap: 2, edge: 2, sh: C.skinSh, shOp: 75, shOff: .55, shW: .45, lt: null, sw };
  for (let i = 3; i >= 0; i--) {
    const k0 = [pl * (i === 3 ? .8 : i === 0 ? .86 : .88), side * ky[i] * hs], L = fl[i] * hs;
    let an = side * K.sp * (1.5 - i), c1 = K.c[0], c2 = K.c[1];
    if (K.curlOthers && i > 0) { c1 = 1.3; c2 = 1.2; }
    const p1 = tip(k0, an, L * .48 + .06 * hs); an += cd * c1; const p2 = tip(p1, an, L * .3); an += cd * c2; const p3 = tip(p2, an, L * .25);
    const fw = .095 * hs * (i === 3 ? .88 : 1);
    mdLimb(X([k0, p1, p2, p3]), [fw * 1.08, fw * .9, fw * .78, fw * .62], C.skin, fo);
    if (hs > 60) { const q = X([p2])[0], n = [-Math.sin(a + an), Math.cos(a + an)]; mdLine([mdV.add(q, n, fw * .3), mdV.add(q, n, -fw * .3)], sw * .4, C.skinSh, 0); }
  }
  const palm = X([[-.13 * hs, side * .1 * hs], [.1 * hs, side * .16 * hs], [pl * .92, side * .16 * hs], [pl + .02 * hs, side * .06 * hs], [pl + .02 * hs, -side * .05 * hs],
    [pl * .92, -side * .155 * hs], [.2 * hs, -side * .15 * hs], [-.13 * hs, -side * .1 * hs]]);
  mdWash(palm, C.skin, 255, .5);
  mdWash(X([[.05 * hs, -side * .02 * hs], [pl * .85, -side * .02 * hs], [pl * .88, -side * .15 * hs], [.2 * hs, -side * .14 * hs], [.02 * hs, -side * .1 * hs]]), C.skinSh, 70, .5);
  mdLine(X([[pl * .25, side * .05 * hs], [pl * .7, side * .06 * hs], [pl * .9, side * .02 * hs]]), sw * 1.6, C.skinLt, .5);
  mdLine([mdV.mid(palm[7], palm[6], .3), palm[6], palm[5], mdV.mid(palm[5], palm[4], .4)], sw, MD.ink, .5);
  const t0 = [.08 * hs, side * .12 * hs]; let an = side * K.th;
  const q1 = tip(t0, an, .2 * hs); an += cd * K.tc; const q2 = tip(q1, an, .13 * hs), q3 = tip(q2, an, .05 * hs);
  mdLimb(X([t0, q1, q2, q3]), [.14 * hs, .1 * hs, .085 * hs, .065 * hs], C.skin, { ...fo, n: 4 });
  mdLine(X([[-.1 * hs, side * .1 * hs], [.02 * hs, side * .15 * hs], [t0[0] + .05 * hs, t0[1] + side * .05 * hs]]), sw, MD.ink, .5);
}
// o: s (head size), w (upper-arm width in head units), hand kind, ang, hs, side, cd, shade (+1/-1)
function mdArm(C, s0, e, w, o = {}) {
  const S = o.s || 100, ws = (o.w || .33) * S * (C.male ? 1.15 : 1), sw = mdLW(S) * 1.1, V = mdV;
  const Bd = mdBend(s0, e, w, .22), P = [s0, V.mid(s0, e, .45), ...Bd, V.mid(e, w, .6), w];
  mdLimb(P, [ws, ws * .9, ws * .7, ws * .64, ws * .68, ws * .58, ws * .44], C.skin, { n: 5, cap: 3, edge: 2, skip: 1, side: o.shade, sh: C.skinSh, shOp: 85, lt: C.skinLt, ltOp: 95, sw });
  const inn = V.nrm(V.sub(V.mid(s0, w), e));
  if (Math.hypot(...V.sub(V.mid(s0, w), e)) > ws * .3) {
    mdLine([V.add(Bd[1], inn, ws * .3), V.add(V.mid(Bd[1], Bd[2]), inn, ws * .12)], sw * .5, C.skinSh, .5);
    mdLine([V.add(Bd[0], inn, -ws * .3), V.add(Bd[1], inn, -ws * .36), V.add(Bd[2], inn, -ws * .3)], sw * .5, C.skinSh, .5);
  }
  if (C.sleeve && o.sleeve !== false) {
    const Sl = C.sleeve, k = Sl.len, a = V.add(s0, V.sub(s0, e), .1), b = V.mid(s0, e, k * .5), c = V.mid(s0, e, k);
    const SS = mdLimb([a, b, c], [ws * Sl.w * .95, ws * Sl.w, ws * Sl.w * 1.08], Sl.col, { n: 4, cap: 1, edge: 0, sh: Sl.dk, shOp: 110, sw });
    mdLine([V.mid(a, b, .3), V.mid(b, c, .7)], sw * .7, Sl.dk, .5);
    const ce = SS.m - 1;
    inkLine([mdOff(SS, ce, 1), V.add(c, V.nrm(V.sub(c, b)), ws * .08), mdOff(SS, ce, -1)], Math.max(.6, sw * 2.4), Sl.trim, 'ink', .5);
  }
  if (o.hand !== false) mdHand(C, w, o.ang ?? Math.atan2(w[1] - e[1], w[0] - e[0]), o.hs || S * .72, o.hand || 'rest', o.side ?? 1, o.cd ?? 1);
}
function mdFoot(C, a, tp, sole = 1, S = 100) {
  const L = Math.hypot(tp[0] - a[0], tp[1] - a[1]) || 1, ang = Math.atan2(tp[1] - a[1], tp[0] - a[0]), sw = mdLW(S);
  const X = Q => mdXf(Q.map(([x, y]) => [x * L, y * L * sole]), a[0], a[1], 1, ang, 0, 0);
  const F = X([[-.12, -.22], [.12, -.18], [.45, -.1], [.82, -.04], [1.0, .05], [.97, .13], [.62, .17], [.3, .14], [.02, .2], [-.18, .17], [-.24, .04], [-.2, -.12]]);
  if (C.shoe === 'boot') {
    mdShape(F, C.shoeCol, { sw, curv: .5 });
    mdWash(X([[.1, .02], [.6, .05], [.95, .11], [.6, .15], [.1, .14]]), mixCol(C.shoeCol, MD.ink, .4), 110, .5);
    mdLine(X([[-.2, .17], [.3, .16], [.97, .14]]), sw * 1.4, MD.ink); mdLine(X([[.2, -.12], [.5, -.06], [.8, 0]]), sw * 1.2, MD.barkLt); return;
  }
  mdShape(F, C.skin, { sw, curv: .5 });
  mdLine(X([[.1, -.14], [.45, -.07], [.75, -.02]]), sw * 1.4, C.skinLt);
  if (C.shoe === 'slipper') {
    mdShape(X([[-.24, -.02], [-.12, -.1], [.3, -.07], [.55, -.06], [.84, -.03], [1.0, .05], [.97, .13], [.62, .17], [.3, .14], [.02, .2], [-.18, .17]]), C.shoeCol, { sw, curv: .5 });
    mdWash(X([[.0, .06], [.6, .08], [.95, .1], [.6, .15], [.0, .16]]), mixCol(C.shoeCol, MD.ink, .4), 100, .5);
    mdLine(X([[.1, -.06], [.5, -.03], [.85, .0]]), sw * 1.2, mixCol(C.shoeCol, '#FFFFFF', .4));
    const b = X([[.52, -.04]])[0]; mdWash(ellPts(b[0], b[1], L * .05, L * .04, 8), MD.gold);
  } else {
    const gs = Math.max(.35, sw * 1.5);
    inkLine(X([[-.2, .18], [.3, .16], [.97, .14]]), gs * 1.4, MD.goldDk, 'ink', .5);
    inkLine(X([[.4, -.11], [.48, .03], [.55, .16]]), gs, MD.gold, 'ink', .5);
    inkLine(X([[.66, -.07], [.72, .04], [.76, .16]]), gs, MD.gold, 'ink', .5);
    inkLine(X([[-.16, -.2], [-.02, -.1], [.12, -.18]]), gs, MD.gold, 'ink', .5);
    mdLine(X([[.86, -.02], [.9, .06]]), sw * .5, C.skinSh, .5);
  }
}
// o: s, w (thigh width in head units), start (0..1 along the thigh: draw from there, e.g. a calf through a slit), sole, calf, shade
function mdLeg(C, hip, knee, ankle, toe, o = {}) {
  const S = o.s || 100, w = (o.w || .62) * S * (C.male ? 1.05 : 1), sw = mdLW(S) * 1.1, st = o.start || 0, V = mdV;
  const col = C.trouser && !o.bare ? C.trouser : C.skin, skin = col === C.skin, start = V.mid(hip, knee, st), kd = V.nrm(V.sub(ankle, knee));
  const Bd = mdBend(start, knee, ankle, .16), calf = V.add(V.mid(knee, ankle, .4), V.perp(kd), (o.calf ?? 1) * w * .06);
  const P = [start, V.mid(start, knee, .5), ...Bd, calf, V.mid(knee, ankle, .76), ankle];
  mdLimb(P, [lerp(w, w * .66, st), w * .8, w * .6, w * .55, w * .57, w * .6, w * .42, w * .33], col, { n: 5, cap: 3, edge: st > 0 ? 3 : 2, skip: 1, side: o.shade,
    sh: skin ? C.skinSh : mixCol(col, MD.ink, .4), shOp: 90, lt: skin ? C.skinLt : mixCol(col, '#FFFFFF', .3), ltOp: 90, sw });
  if (skin) {
    const n = V.perp(kd);
    mdWash(mdBlob(...V.add(Bd[1], kd, w * .02), w * .14, w * .1, 9, 10, .1), C.skinLt, 110, .5);
    mdLine([V.add(Bd[2], n, -w * .18), V.add(V.add(Bd[2], kd, w * .06), n, -w * .02), V.add(Bd[2], n, w * .14)], sw * .5, C.skinSh, .5);
  } else mdFolds([[V.mid(start, knee, .3), Bd[0], Bd[1]], [Bd[2], V.mid(knee, ankle, .45)]], sw * .6, mixCol(col, MD.ink, .45));
  if (C.shoe === 'boot') {
    const b0 = V.mid(knee, ankle, .42);
    mdLimb([b0, V.mid(b0, ankle, .5), ankle], [w * .66, w * .56, w * .46], C.shoeCol, { n: 4, cap: 2, edge: 2, sh: mixCol(C.shoeCol, MD.ink, .45), shOp: 110, lt: MD.barkLt, ltOp: 90, sw });
    const pc = V.perp(kd); inkLine([V.add(b0, pc, w * .34), V.add(b0, kd, w * .06), V.add(b0, pc, -w * .34)], Math.max(.6, sw * 2.5), MD.barkLt, 'ink', .5);
  }
  if (o.foot !== false) mdFoot(C, ankle, toe, o.sole ?? 1, S);
}

// ---------- cloth ----------
function mdWaistLR(C, P, o = {}) {
  const u = mdV.nrm(mdV.sub(P.sR, P.sL)), ww = (o.waistW || (C.male ? .48 : .38)) * P.hs;
  return [mdV.add(P.waist, u, -ww), mdV.add(P.waist, u, ww)];
}
// a hanging or flowing skirt polygon from the waist corners to the hem corners; o: folds, wave, sway, hip, bow, seed
function mdSkirt(wL, wR, hemL, hemR, o = {}) {
  const V = mdV, n = o.folds ?? 5, wave = o.wave ?? 14, sway = o.sway || 0, out = o.hip ?? 20, seed = o.seed || 1, bow = o.bow || 0;
  const sideR = [V.add(V.mid(wR, hemR, .16), [out, 0]), V.add(V.mid(wR, hemR, .55), [sway * .45 + out * .4, 0])];
  const sideL = [V.add(V.mid(wL, hemL, .16), [-out, 0]), V.add(V.mid(wL, hemL, .55), [sway * .45 - out * .4, 0])];
  const hem = [], m = 2 * n;
  for (let j = 1; j < m; j++) {
    const k = j / m, p = V.mid(hemR, hemL, k);
    hem.push([p[0] + sway * .15 * Math.sin(k * Math.PI), p[1] + (j % 2 ? wave : -wave * .35) + bow * Math.sin(k * Math.PI) + (mdH(seed, j) - .5) * wave * .5]);
  }
  const folds = [];
  for (let j = 0; j < n; j++) {
    const k = (j + .5) / n, top = V.add(V.mid(wR, wL, k), [0, 6]), bot = hem[Math.min(hem.length - 1, 2 * j)];
    const st = V.mid(top, bot, .06 + .12 * mdH(seed, j + 20)), en = V.mid(top, bot, .96);
    folds.push([st, V.add(V.mid(st, en, .55), [sway * .25 * (1 - Math.abs(k - .5)), 0]), en]);
  }
  const sh = [V.mid(wL, wR, .66), wR, ...sideR, hemR, ...hem.slice(0, Math.max(2, Math.round(m * .3))), V.mid(V.mid(wL, wR, .66), hem[Math.round(m * .3)] || hemR, .6)];
  return { P: [wL, wR, ...sideR, hemR, ...hem, hemL, ...sideL.reverse()], folds, hem: [hemR, ...hem, hemL], sh };
}
// base wash, transparent watercolour shadow, rounded fold shadows with lit edges, then one fine outline over everything
function mdCloth(P, col, dk, lt, folds = [], o = {}) {
  const fw = o.fw || 24, sw = o.sw ?? .32;
  mdWash(P, col, 255, o.curv ?? .35);
  if (o.shadeP) mdFill(o.shadeP, dk, o.shadeOp ?? 120, .08, .55);
  for (const f of folds) mdWash(mdTube(f, [fw * .15, fw * .6, fw * .75], 4, 3), dk, o.op ?? 110, .4);
  if (lt) for (const f of folds) inkLine(f.map(p => [p[0] - fw * .55, p[1]]), o.lw ?? 1, lt, 'ink', .6);
  for (const f of folds) mdLine(f, sw * .7, mixCol(dk, MD.ink, .35), .6);
  paint(P, { ink: o.ink || MD.ink, sw, br: 'inkfine', curv: o.curv ?? .35 });
}
function mdGownSkirt(C, wL, wR, hemL, hemR, o = {}) {
  const k = mdSkirt(wL, wR, hemL, hemR, o), s = o.s || 100;
  mdCloth(k.P, o.col || C.gown, o.dk || C.gownDk, o.lt || C.gownLt, k.folds, { fw: o.fw || s * .22, sw: mdLW(s) * 1.1, lw: o.lw ?? 1.2, shadeP: o.shadeP || k.sh, shadeOp: o.shadeOp ?? 90 });
  const hem = k.hem.map(p => [p[0], p[1] - s * .05]);
  if (o.trim !== false) { if (C.vine) mdVine(hem, MD.gold, mdLW(s), s * .05, 3); else inkLine(hem, Math.max(.8, s * .008), o.trimCol || C.trim, 'ink', .5); }
  return k;
}

// ---------- torso ----------
function mdTorso(C, P, o = {}) {
  const s = P.hs, sw = mdLW(s) * 1.1, V = mdV, u = V.nrm(V.sub(P.sR, P.sL)), up = [u[1], -u[0]];
  const at = (p, a, b) => [p[0] + u[0] * a + up[0] * b, p[1] + u[1] * a + up[1] * b];
  const ws = (o.armW || .33) * s * (C.male ? 1.15 : 1), nk = P.neck, nw = (C.male ? .48 : .4) * s, tl = P.tilt || 0, tn = P.turn || 0;
  const nt = [P.head[0] - Math.sin(tl) * .3 * s, P.head[1] + Math.cos(tl) * .3 * s];
  // bare shoulders and upper chest, then a gently curved, modelled neck
  mdShape([at(P.sL, -ws * .48, -ws * .1), at(P.sL, -ws * .05, ws * .52), at(nk, -nw * .55, .1 * s), at(nk, nw * .55, .1 * s), at(P.sR, ws * .05, ws * .52),
    at(P.sR, ws * .48, -ws * .1), at(P.sR, -ws * .1, -ws * 1.1), at(nk, 0, -.7 * s), at(P.sL, ws * .1, -ws * 1.1)], C.skin, { sw, curv: .45 });
  for (const g of [-1, 1]) mdWash(mdBlob(...at(g < 0 ? P.sL : P.sR, -g * ws * .05, ws * .3), ws * .45, ws * .16, 40 + g, 12, .1, Math.atan2(u[1], u[0])), C.skinLt, 100, .5);
  mdLimb([nt, V.add(V.mid(nt, nk), u, tn * .04 * s), at(nk, 0, -.12 * s)], [nw * .84, nw * .9, nw * 1.3], C.skin,
    { n: 5, cap: 0, side: tn >= 0 ? -1 : 1, sh: C.skinSh, shOp: 85, lt: C.skinLt, ltOp: 70, sw: sw * .9 });
  mdWash(mdBlob(nt[0] + tn * .05 * s, nt[1] + .17 * s, nw * .46, .07 * s, 4, 12, .1), C.skinSh, 120, .5);
  mdLine([at(nt, -Math.sign(tn || 1) * nw * .38, -.2 * s), at(nk, Math.sign(tn || 1) * nw * .08, .14 * s)], sw * .6, C.skinSh, .5);
  if (C.male) mdLine([at(nt, tn * .05 * s, -.3 * s), at(nt, tn * .05 * s + .02 * s, -.36 * s)], sw * .6, C.skinSh, .5);
  for (const g of [-1, 1]) {
    const cb = [at(nk, g * nw * .3, .02 * s), at(nk, g * nw * .75, .06 * s), at(g < 0 ? P.sL : P.sR, -g * ws * .2, ws * .25)];
    mdLine(cb, sw * .6, C.skinSh, .5);
    mdLine(cb.map(p => [p[0] + up[0] * .02 * s, p[1] + up[1] * .02 * s]), sw * 1.2, C.skinLt, .5);
  }
  const [wL, wR] = mdWaistLR(C, P, o), ww = Math.hypot(wR[0] - wL[0], wR[1] - wL[1]) / 2;
  if (C.tunic) { mdTunic(C, P, at, ws, nk, nw, wL, wR, sw); return; }
  // halter bodice: covered neckline gathered at a gold collar, bare shoulders
  const colL = at(nk, -nw * .62, .07 * s), colR = at(nk, nw * .62, .07 * s);
  const aL = at(P.sL, ws * .3, -ws * .95), aR = at(P.sR, -ws * .3, -ws * .95);
  const bL = V.add(V.mid(aL, wL, .42), u, -.03 * s), bR = V.add(V.mid(aR, wR, .42), u, .03 * s);
  mdWash([colL, colR, aR, bR, wR, wL, bL, aL], C.gown, 255, .4);
  const sh = o.shadeL ? [aL, bL, wL, V.mid(wL, wR, .25), V.mid(bL, bR, .2), V.mid(colL, colR, .2)] : [aR, bR, wR, V.mid(wR, wL, .25), V.mid(bR, bL, .2), V.mid(colR, colL, .2)];
  mdFill(sh, C.gownDk, 130, .08, .55);
  mdWash(mdBlob(...V.mid(V.mid(colL, colR), V.mid(wL, wR), .5), ww * .35, .35 * s, 44, 12, .15), C.gownLt, 60, .5);
  for (let j = 0; j < 4; j++) {
    const a = V.mid(colL, colR, .25 + .17 * j), b = V.mid(wL, wR, .1 + .27 * j);
    mdLine([a, V.add(V.mid(a, b, .45), u, (j - 1.5) * .05 * s), b], sw * .6, mixCol(C.gownDk, MD.ink, .3), .5);
  }
  inkLine([V.add(V.mid(colL, aL, .4), u, .05 * s), V.add(V.mid(aL, bL, .6), u, .06 * s), V.add(V.mid(bL, wL, .5), u, .05 * s)], Math.max(.8, s * .008), C.gownLt, 'ink', .5);
  if (C.wrap) {
    mdLine([colR, V.mid(bR, bL, .35), V.mid(wL, wR, .22)], sw * .9, C.gownDk, .5);
    mdVine([colR, V.add(V.mid(bR, bL, .35), u, .02 * s), V.mid(wL, wR, .25)], MD.gold, sw * .9, .045 * s, 5);
  }
  paint([colL, colR, aR, bR, wR, wL, bL, aL], { ink: MD.ink, sw, br: 'inkfine', curv: .4 });
  paint(mdTube([colL, at(nk, 0, .02 * s), colR], .05 * s, 5, 3), { wash: C.trim, ink: MD.goldDk, sw: sw * .8, br: 'inkfine', curv: .5 });
  // waist sash and optional floating ends
  paint(mdTube([at(wL, -.01 * s, 0), at(P.waist, 0, -.012 * s), at(wR, .01 * s, 0)], .1 * s * (o.sashW || 1), 4, 3), { wash: C.sash, ink: MD.ink, sw, br: 'inkfine', curv: .4 });
  mdLine([at(wL, .02 * s, .015 * s), at(P.waist, 0, .0), at(wR, -.02 * s, .015 * s)], sw * 1.2, mixCol(C.sash, '#FFFFFF', .35), .5);
  if (C.vine) mdVine([at(wL, .03 * s, -.06 * s), at(P.waist, 0, -.09 * s), at(wR, -.03 * s, -.06 * s)], MD.goldLt, sw * .7, .035 * s, 9);
  if (o.sashEnds) {
    const kn = at(P.waist, ww * .55 * (o.sashSide || 1), 0), [dx, dy] = o.sashEnds;
    for (const f of [0, 1]) mdLimb([kn, [kn[0] + dx * s * (.35 + .1 * f), kn[1] + .3 * s], [kn[0] + dx * s * (1 - .2 * f), kn[1] + dy * s * (1 - .15 * f)]], [.09 * s, .065 * s, .035 * s], C.sash,
      { n: 4, cap: 2, edge: 2, sh: mixCol(C.sash, MD.ink, .35), shOp: 100, lt: null, sw });
    mdShape(mdBlob(kn[0], kn[1], .06 * s, .05 * s, 5, 10, .1), C.sash, { sw, curv: .5 });
  }
}
// Puck's leaf-hemmed tunic with a V collar and belt
function mdTunic(C, P, at, ws, nk, nw, wL, wR, sw) {
  const s = P.hs, V = mdV, hL = at(wL, -.08 * s, -.55 * s), hR = at(wR, .08 * s, -.55 * s);
  const T = [at(nk, -nw * .7, .05 * s), at(P.sL, ws * .1, ws * .5), at(P.sL, -ws * .5, 0), at(P.sL, ws * .15, -ws * 1.1), wL, hL];
  for (let i = 1; i < 6; i++) T.push(at(V.mid(hL, hR, i / 6), 0, i % 2 ? -.12 * s : 0));
  T.push(hR, wR, at(P.sR, -ws * .15, -ws * 1.1), at(P.sR, ws * .5, 0), at(P.sR, -ws * .1, ws * .5), at(nk, nw * .7, .05 * s));
  mdWash(T, C.gown, 255, .3);
  mdFill([at(P.sR, -ws * .15, -ws * 1.1), wR, hR, V.mid(hR, hL, .3), V.mid(wR, wL, .3), V.mid(P.sR, P.sL, .3)], C.gownDk, 130, .08, .55);
  const lv = [];
  for (let i = 0; i < 16; i++) { const a = .08 + .84 * mdH(51, i), b = .12 + .8 * mdH(53, i), p = V.mid(V.mid(P.sL, P.sR, a), V.mid(hL, hR, a), b); lv.push([p[0], p[1], .09 * s, mdH(57, i) * TAU]); }
  mdLeaves(lv, C.leafCol, null);
  mdFolds([[V.mid(P.sL, wL, .3), V.mid(P.sL, wL, .7), V.mid(wL, hL, .6)], [V.mid(P.sR, wR, .35), V.mid(wR, hR, .5)]], sw * .6, MD.violetDk);
  paint(T, { ink: MD.ink, sw, br: 'inkfine', curv: .3 });
  const v0 = at(nk, -nw * .45, .06 * s), v1 = at(nk, 0, -.32 * s), v2 = at(nk, nw * .45, .06 * s);
  mdShape([v0, v1, v2], C.skin, { sw, curv: .2 });
  mdWash([v1, mdV.mid(v1, v0, .6), mdV.mid(v1, v2, .6)], C.skinSh, 80, .2);
  inkLine([v0, v1, v2], Math.max(.8, s * .01), C.leafCol, 'ink', .2);
  paint(mdTube([at(wL, -.02 * s, 0), P.waist, at(wR, .02 * s, 0)], .09 * s, 4, 3), { wash: C.sash, ink: MD.ink, sw, br: 'inkfine', curv: .4 });
  paint(rrPts(P.waist[0] - .05 * s, P.waist[1] - .05 * s, .1 * s, .1 * s, .02 * s), { wash: MD.gold, ink: MD.goldDk, sw: sw * .8, br: 'inkfine' });
}

// ---------- whole figure ----------
// P: hs, head, turn, tilt, neck, sL sR eL eR wL wR (shoulders, elbows, wrists), waist, hL hR kL kR aL aR tL tR (hips, knees, ankles, toes)
// o: expr (mdHead options), wind, arms {L, R}, legs {L, R}, torso, behind ['aL', 'lR', ...], over (legs drawn after the
//    skirt, usually from a slit with legs[k].start), noLegs, skirt(P) / mid(P) / after(P) callbacks
function mdFigure(C, P, o = {}) {
  const s = P.hs, hd = { turn: P.turn || 0, tilt: P.tilt || 0, wind: o.wind }, done = {};
  mdHairBack(C, P.head[0], P.head[1], s, hd);
  const part = k => {
    if (done[k]) return; done[k] = 1;
    const sd = k[1];
    if (k[0] === 'a') mdArm(C, P['s' + sd], P['e' + sd], P['w' + sd], { s, ...((o.arms || {})[sd] || {}) });
    else mdLeg(C, P['h' + sd], P['k' + sd], P['a' + sd], P['t' + sd], { s, ...((o.legs || {})[sd] || {}) });
  };
  (o.behind || []).forEach(part);
  const over = o.over || [];
  if (!o.noLegs) ['lL', 'lR'].filter(k => !over.includes(k)).forEach(part);
  if (o.skirt) o.skirt(P);
  over.forEach(part);
  if (o.mid) o.mid(P);
  mdTorso(C, P, o.torso || {});
  ['aL', 'aR'].forEach(part);
  mdHead(C, P.head[0], P.head[1], s, { ...hd, ...(o.expr || {}) });
  if (o.after) o.after(P);
}
