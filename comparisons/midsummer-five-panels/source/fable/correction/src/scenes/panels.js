// src/scenes/panels.js — the five Midsummer stills: luminous Rackham-style forest stagings painted around the cast rig.
// Each LOOPS.P0n paints one 1920×1080 frame at t = 0 and reseeds itself, so every panel is independent of the others.
// Environment brushes (msWood, msTrunk, msBranchTree, msBlooms, msLilies, msPads, msBed, ...) live in palette.js; the
// figure rig (msFigure, msArm, msHead, msFoot, msLimb, ...) lives in cast.js.
const PN = MS_PAL;
const pnlStreaks = (bl, col) => { for (const [x, y] of bl) inkLine([[x + 30, y + 4], [x + 60, y + 6], [x + 90, y + 10]], .25, col, 'inkfine', .3); };

// ---------- P01 — Root throne ----------
LOOPS.P01 = t => {
  msSeed();
  msSky('#AEEAEA', '#1C7F55', { y0: .3 });
  msGlade(960, 430, 560, 380);
  msDapple(300, 80, 1620, 520, 6, [PN.cream, PN.turqLt], 55);
  msTrunk(150, 1000, 1150, 140, .05, PN.barkLt, { ph: 1 });
  msTrunk(1790, 1000, 1150, 120, -.04, PN.barkLt, { ph: 2.5, side: -1 });
  msFoliage(260, 110, 440, 240, [PN.emerDk, PN.emer, PN.leafLt], { n: 30 });
  msFoliage(1660, 90, 470, 250, [PN.vioDk, PN.vio, PN.leafMd], { n: 30 });
  msFoliage(1230, 120, 360, 130, [PN.emer, PN.leafMd, PN.leafLt], { n: 20 });
  msBranchTree(300, 40, .7, 520, 38, PN.bark, 2, [PN.leafLt, PN.emer], { seed: 1 });
  msBranchTree(1640, 20, 2.45, 520, 36, PN.bark, 2, [PN.leafMd, PN.leafLt], { seed: 2 });
  msGround([[-40, 905], [500, 895], [1100, 902], [1960, 888], [1960, 1120], [-40, 1120]], PN.mossDk, PN.emerDk, 120);
  msHatch(960, 985, 1500, 80, .05, 14, PN.emerDk, .2);
  // the throne: two rising back roots, root legs, then the mossy seat
  msWood([[330, 990], [360, 760], [470, 520], [640, 360], [760, 300]], 110, 60, PN.bark, { seed: 3, knot: true, moss: PN.moss });
  msWood([[1560, 990], [1520, 740], [1400, 520], [1230, 400], [1120, 360]], 100, 55, PN.bark, { seed: 4, knot: true, moss: PN.moss, side: -1 });
  msWood([[700, 650], [660, 790], [640, 930]], 64, 48, PN.bark, { seed: 5 });
  msWood([[1280, 660], [1330, 800], [1350, 930]], 64, 48, PN.bark, { seed: 6, side: -1 });
  msWood([[540, 780], [700, 690], [950, 652], [1200, 660], [1440, 740]], 100, 86, PN.bark, { seed: 7, knot: true, moss: PN.moss, bulge: .12 });
  msVine([[560, 760], [640, 700], [760, 668], [880, 650]], 5, PN.mossDk, PN.leafLt, 5);
  msVine([[1430, 735], [1330, 690], [1220, 662]], 4, PN.mossDk, PN.leafLt, 4);
  msBlooms([[590, 720, 20, 6], [1400, 715, 18, 5], [1460, 760, 16, 6], [560, 770, 15, 5], [1200, 640, 14, 6]], PN.vio);
  // Titania, seated: right knee crossed over the left; braced left hand on the seat, right hand resting on the crossed thigh
  const TI = MS_CAST.titania, s = 145, p = msStand({ lean: .06, turn: .25 });
  Object.assign(p, {
    head: [.12, -2.8], neck: [.1, -2.3], shL: [-.44, -2.02], shR: [.6, -2.0],
    elL: [-.78, -1.0], wrL: [-.5, .08], handL: { ang: 1.35, spread: .35, curl: .3, side: 1 },
    elR: [1.0, -.85], wrR: [.5, .12], handR: { ang: 2.75, spread: .35, curl: .25, side: -1 },
    hipL: [-.33, 0], hipR: [.33, 0], knL: [-.15, .62], anL: [-.38, 2.0], footL: { ang: .2 },
    knR: [-.6, .42], anR: [-1.0, 1.65], footR: { ang: .8 },
    front: 'R', face: { ...MS_EXPR.regal, look: [.45, .1] },
    skirt: [[.62, .22], [.74, .9], [.45, 1.28], [.1, .88], [-.2, .58], [-.5, .44], [-.78, .4], [-.95, .28]],
    order: ['hairBack', 'legB', 'skirt', 'torso']
  });
  // seat contact: a shadow pooled under the hips before the figure sits on it
  msF(msEll(905, 618, 160, 30), PN.barkDk, 100, .2, .5);
  const J = msFigure(900, 580, s, TI, p, { light: 1, skirt: { trim: TI.trim, folds: 5 } });
  const hR = J.hipR, kR = J.knR, aR = J.anR, ta = msAng(hR, kR), ka = msAng(kR, aR), kk = msK(s);
  // the crossed leg: calf and sandal first, then the gowned thigh as one rounded tube over the lap, ending in the knee cap
  msLimb([kR, msOff(msMid(kR, aR, .45), ka - Math.PI / 2, s * .03), aR], [s * .3, s * .28, s * .17], TI.skin, TI.skinSh, 1, .3 * kk, mixCol(TI.skin, PN.cream, .5));
  msFoot(aR, .8, s, TI, {}, kR);
  const kc = msOff(kR, ta, s * .1), thigh = msTube([msMid(hR, kR, .1), msMid(hR, kR, .5), kR, msOff(kc, ka, s * .1)], [s * .54, s * .5, s * .42, s * .3]);
  paint(thigh, { wash: TI.gown, ...msFine(MS_INK, .3), curv: .25 });
  paint(msTube([msMid(hR, kR, .2), msMid(hR, kR, .6), kR].map(q => msOff(q, ta + Math.PI / 2, s * .14)), [s * .2, s * .18, s * .12]), { fill: TI.gownDk, fillOp: 110, bleed: .1, tex: .5, ink: null, curv: .3 });
  paint(msTube([msMid(hR, kR, .25), msMid(hR, kR, .65), kc].map(q => msOff(q, ta - Math.PI / 2, s * .1)), [s * .1, s * .1, s * .06]), { wash: TI.gownLt, washOp: 80, ink: null, curv: .3 });
  for (let i = 0; i < 4; i++) { const a = msOff(msMid(hR, kR, .05), ta + Math.PI / 2, s * (.1 - i * .06)), b = msMid(hR, kR, .45 + i * .15); inkLine([a, msOff(b, ta + Math.PI / 2, s * .12), msOff(b, ta + Math.PI / 2, s * .2)], .2, TI.gownDk, 'inkfine', .5); }
  inkLine([msOff(kc, ka + Math.PI / 2, s * .12), msOff(kc, ka, s * .04), msOff(kc, ka - Math.PI / 2, s * .12)], .22, TI.gownDk, 'inkfine', .6);
  const V = []; for (let i = 0; i <= 6; i++) { const q = msMid(hR, kR, .15 + i * .13); V.push(msOff(q, ta - Math.PI / 2, s * .03 + Math.sin(i * 1.6) * s * .05)); }
  inkLine(V, .3, TI.trim, 'inkfine', .6);
  for (let i = 1; i < 6; i += 2) paint(msPetalPts(V[i][0], V[i][1], s * .06, s * .02, ta + (i % 4 ? .9 : -.9), .6), { wash: TI.trim, ink: null, curv: .4 });
  // hip and skirt pressed into the seat: fold lines from the hip toward the root, a hem shadow
  for (let i = 0; i < 3; i++) inkLine([[J.hipL[0] - 10 + i * 30, J.hipL[1] + 20], [J.hipL[0] - 30 + i * 40, J.hipL[1] + 60 + i * 10]], .2, TI.gownDk, 'inkfine', .5);
  msArm(J.shL, J.elL, J.wrL, p.handL, TI, s, 1); msArm(J.shR, J.elR, J.wrR, p.handR, TI, s, 1);
  msHead(J.head[0], J.head[1], s, TI, { turn: p.turn, tilt: p.tilt, light: 1, ...p.face });
  msHairFront(J.head[0], J.head[1], s, TI, { turn: p.turn, tilt: p.tilt, wind: 0, len: 1 });
  // foreground flowers and ferns
  msBed(290, 955, 250, 55, [PN.mag, PN.vio, PN.gold], 16, 14, 24);
  msBed(1600, 950, 280, 60, [PN.turq, PN.mag, PN.ruby], 16, 14, 24);
  msBed(1000, 1018, 420, 32, [PN.vio, PN.gold, PN.mag], 14, 12, 20);
  msFern(420, 900, -1.3, 180, PN.emer); msFern(1480, 890, -1.8, 170, PN.emer); msFern(600, 915, -1.0, 150, PN.leafMd); msFern(1300, 905, -2.1, 150, PN.leafMd);
  glows([[960, 400, 220, .5], [600, 300, 60, .5], [1350, 330, 50, .5], [450, 600, 40, .4], [1500, 560, 40, .4]], PN.sun, true);
};
LOOPS.P01.len = 1;

// ---------- P02 — Forest stride ----------
LOOPS.P02 = t => {
  msSeed();
  msSky(PN.skyDay, '#2E9E6A', { y0: .3 });
  msGlade(1250, 300, 520, 330, '#FFEDB0');
  msDapple(200, 100, 1700, 600, 6, [PN.cream, PN.goldLt], 50);
  msTrunk(120, 1000, 1150, 150, .04, PN.barkLt, { ph: 2 });
  msTrunk(520, 980, 1100, 70, -.03, PN.barkLt, { ph: 4 });
  msTrunk(1820, 1000, 1150, 110, -.05, PN.barkLt, { ph: 1, side: -1 });
  msFoliage(380, 100, 520, 250, [PN.emerDk, PN.emer, PN.leafLt], { n: 32 });
  msFoliage(1700, 110, 380, 200, [PN.vioDk, PN.vio, PN.leafMd], { n: 24 });
  msFoliage(1150, 50, 300, 110, [PN.emer, PN.leafLt, PN.gold], { n: 16 });
  msBranchTree(1880, 160, 3.3, 600, 40, PN.bark, 2, [PN.leafMd, PN.leafLt], { seed: 11 });
  msBranchTree(560, 120, .4, 400, 26, PN.bark, 1, [PN.leafLt, PN.emer], { seed: 12 });
  // sunlit path between mossy banks
  msGround([[-40, 940], [500, 915], [1100, 925], [1960, 900], [1960, 1120], [-40, 1120]], PN.mossDk, PN.emerDk, 110);
  msGround([[300, 1120], [520, 960], [900, 940], [1300, 950], [1600, 1120]], PN.path, PN.pathDk, 90);
  msHatch(400, 990, 500, 70, .08, 14, PN.emerDk, .2); msHatch(1550, 985, 500, 70, -.06, 14, PN.emerDk, .2);
  // the root she steps over
  msWood([[880, 1010], [1000, 950], [1150, 925], [1350, 935], [1600, 975], [1900, 1020]], 64, 56, PN.bark, { seed: 13, knot: true, moss: PN.moss });
  msWood([[1180, 930], [1260, 885], [1380, 865], [1520, 895]], 34, 24, PN.bark, { seed: 14 });
  // leaves streaming left on the breeze, behind her
  const bl = []; for (let i = 0; i < 14; i++) bl.push([msRnd(150, 760), msRnd(220, 720), msRnd(14, 26), Math.PI + msRnd(-.3, .3)]);
  msLeaves(bl, PN.leafLt, .2); pnlStreaks(bl, PN.cream);
  // Helena mid-stride: left foot planted, right foot lifted over the root, skirts and hair blown left
  const HE = MS_CAST.helena, s = 125, p = msStand({ lean: .18, turn: .55 });
  Object.assign(p, {
    head: [.3, -2.8], neck: [.25, -2.3], shL: [-.3, -2.05], shR: [.55, -2.0],
    elL: [.12, -1.2], wrL: [.68, -.55], handL: { ang: .5, spread: .4, curl: .15, side: 1 },
    elR: [.3, -1.0], wrR: [-.25, -.2], handR: { ang: 1.9, spread: .3, curl: .45, side: -1 },
    hipL: [-.22, 0], hipR: [.28, 0], knL: [-.5, 1.75], anL: [-.72, 3.5], footL: { ang: .15 },
    knR: [.9, 1.15], anR: [1.05, 2.3], footR: { ang: .8 },
    wind: -.75, hairLen: .9, front: 'R', tilt: -.04, face: { brow: .3, browAsym: .2, lids: .1, mouth: { open: .15, smile: .4 }, look: [.8, -.1] },
    skirt: [[.8, .9], [.55, 2.3], [.05, 2.75], [-.6, 2.95], [-1.25, 2.75], [-1.5, 2.25], [-1.05, 1.65], [-.5, 1.25]],
    over: [[.5, .8], [.3, 1.5], [-.35, 2.1], [-1.3, 2.5], [-2.1, 2.2], [-1.95, 1.6], [-1.3, 1.25], [-.6, .95]]
  });
  msFigure(900, 520, s, HE, p, { light: 1, skirt: { folds: 4 }, over: { trim: HE.trim, folds: 3 } });
  // the breeze crossing in front of her: a few leaves, hem streaks
  msLeaves([[700, 300, 18, 3.3], [640, 560, 16, 3.0], [1180, 420, 15, 3.2], [1250, 700, 17, 2.9]], PN.leafLt, .2);
  pnlStreaks([[560, 760], [520, 820]], PN.turqLt);
  msBed(250, 985, 220, 45, [PN.mag, PN.gold, PN.vio], 14, 12, 22);
  msBed(1650, 1000, 260, 45, [PN.turq, PN.mag, PN.ruby], 14, 12, 22);
  msBlooms([[1120, 905, 16, 6], [1300, 912, 14, 5], [1480, 940, 15, 6]], PN.vio);
  msFern(1700, 950, -1.9, 160, PN.emer); msFern(380, 925, -1.2, 150, PN.leafMd);
  glows([[1300, 250, 240, .5], [700, 200, 60, .4], [1500, 500, 40, .4]], PN.sun, true);
};
LOOPS.P02.len = 1;

// ---------- P03 — Lily-pool portrait ----------
LOOPS.P03 = t => {
  msSeed();
  msSky('#B9F0E6', '#1F8A6A', { y0: .25 });
  msDapple(200, 60, 1800, 700, 7, [PN.cream, PN.turq], 70);
  glow(1500, 350, 600, '#FFF0B8', .9); glow(1400, 250, 300, '#FFFFFF', .5);
  msFoliage(250, 120, 400, 220, [PN.emerDk, PN.emer, PN.leafLt], { n: 26 });
  msFoliage(1750, 60, 320, 150, [PN.vioDk, PN.vio, PN.leafMd], { n: 16 });
  msBranchTree(1760, -20, 2.0, 520, 30, PN.bark, 2, [PN.leafLt, PN.emer], { twist: .6, seed: 21 });
  for (let i = 0; i < 6; i++) { const x0 = 1320 + i * 90; msVine([[x0, -20], [x0 - 20 + msRnd(-10, 10), msRnd(120, 260)], [x0 - 50, msRnd(260, 520)]], 3, PN.emerDk, PN.leafMd, 4); }
  // the pool behind and beside her
  msGround([[-40, 1120], [-40, 990], [250, 965], [520, 975], [800, 950], [1000, 895], [1300, 785], [1700, 750], [1960, 770], [1960, 1120]], PN.water, PN.waterDk, 120);
  msF([[1050, 900], [1400, 820], [1800, 800], [1900, 950], [1500, 1000], [1150, 1000]], PN.turq, 110, .4, .3, { curv: .5 });
  msRipples(1450, 900, 400, 120, 10, PN.waterLt);
  msPads([[1250, 880, 60, .5], [1500, 850, 55, .3], [1700, 900, 70, .45], [1350, 960, 65, .4]], PN.emer);
  msLilies([[1260, 862, 30], [1510, 832, 26], [1710, 880, 34]]);
  // Hermia turns to the voice off-frame right, eyes to the far corner; one hand at her collarbone
  const HM = MS_CAST.hermia, s = 220, p = msStand({ lean: .1, turn: .72 });
  Object.assign(p, {
    head: [.22, -2.85], neck: [.16, -2.32], shL: [-.55, -2.05], shR: [.6, -2.05],
    elR: [.85, -1.1], wrR: [.25, -1.7], handR: { ang: -2.2, spread: .3, curl: .3, side: -1 },
    elL: [-.95, -1.25], wrL: [-1.3, -.68], handL: { ang: 2.6, spread: .35, curl: .1, side: -1 },
    tilt: -.05, wind: .15, front: 'R', face: { ...MS_EXPR.attentive, look: [1, -.08] },
    drape: [[-.7, -2.1], [-1.0, -1.6], [-1.15, -1.0], [-1.25, -.55]],
    order: ['hairBack', 'torso', 'drape', 'armF', 'head', 'hairFront']
  });
  const J = msFigure(760, 1100, s, HM, p, { light: 1, headScale: 1.1, drape: { w0: .35, w1: .6 } });
  glow(900, 720, 260, '#B9F2EA', .3);
  // the near bank and water in front of her, the resting hand on the bank, foreground lilies
  msGround([[-40, 1120], [-40, 1005], [250, 985], [520, 995], [800, 970], [1000, 915], [1300, 805], [1960, 790], [1960, 1120]], PN.water, PN.waterDk, 100);
  msWood([[-40, 985], [250, 962], [520, 972], [800, 948], [1000, 893], [1300, 783]], 46, 30, PN.mossDk, { seed: 22, dk: PN.emerDk, lt: PN.moss, moss: PN.moss, sw: .3 });
  msGrass(400, 960, 350, 10, PN.mossDk, 8);
  msArm(J.shL, J.elL, J.wrL, p.handL, HM, s, 1);
  msRipples(700, 1040, 600, 30, 6, PN.waterLt);
  msPads([[200, 1045, 80, .4], [700, 1055, 75, .5], [1150, 1030, 70, .35], [1600, 1000, 80, .45], [1850, 1060, 70, .4]], PN.emer);
  msLilies([[215, 1020, 44], [1165, 1005, 40], [1615, 975, 46], [720, 1035, 36]]);
  msBlooms([[1000, 905, 14, 6], [1420, 790, 12, 5], [1860, 795, 14, 6]], PN.vio);
  glows([[1500, 350, 260, .4], [1200, 150, 50, .4], [1650, 560, 40, .4], [1700, 880, 24, .5], [1260, 862, 20, .5]], PN.sunHot, true);
};
LOOPS.P03.len = 1;

// ---------- P04 — Moonlit disagreement ----------
LOOPS.P04 = t => {
  msSeed();
  msSky(PN.night, '#5A3FA8', { y0: .2 });
  msF(ellPts(960, 300, 760, 360, 28, 60), PN.nightLt, 110, .45, .3, { curv: .5 });
  glow(420, 170, 420, '#C9D8FF', .8); glow(420, 170, 200, '#FFF3D0', .9);
  paint(ellPts(420, 170, 78, 78, 30, 2), { wash: PN.moon, ink: null });
  glows([[420, 170, 140, .9], [1500, 130, 7, .8], [1200, 90, 6, .7], [1700, 260, 6, .7], [900, 60, 5, .6], [1650, 60, 5, .6], [300, 420, 5, .6], [1050, 200, 5, .6]], PN.sunHot, true);
  msFoliage(1500, 60, 520, 230, [PN.vioDk, '#4A2E8A', '#2A5A74'], { n: 28 });
  msFoliage(180, 420, 240, 260, [PN.vioDk, '#2E6B6A', '#4A2E8A'], { n: 20 });
  const nt = { dk: PN.barkNtDk, lt: '#8A6E9A' };
  msTrunk(1800, 1000, 1150, 130, -.05, PN.barkNt, { ph: 2, side: -1, ...nt });
  msTrunk(90, 1000, 1150, 110, .03, PN.barkNt, { ph: 3, ...nt });
  msBranchTree(1760, 120, 3.0, 620, 42, PN.barkNt, 2, ['#2E8A7A', '#4A2E8A'], { seed: 31, ...nt });
  msBranchTree(60, 300, -.3, 420, 30, PN.barkNt, 1, ['#2E8A7A', '#6AC7B8'], { seed: 32, ...nt });
  // moonlit ground
  msGround([[-40, 1000], [600, 985], [1300, 975], [1960, 960], [1960, 1120], [-40, 1120]], '#1F4A5A', PN.night, 130);
  msF([[300, 1000], [800, 985], [1200, 980], [1500, 1020], [1000, 1060], [400, 1050]], '#2FA6A0', 80, .4, .4, { curv: .5 });
  msHatch(960, 1045, 1700, 50, .03, 16, '#102A40', .22);
  // the fallen branch between them, with broken twigs
  msWood([[700, 1000], [850, 950], [1000, 928], [1150, 938], [1280, 985]], 58, 44, '#5A4058', { seed: 33, knot: true, moss: '#3C7A66', ...nt });
  msBranchTree(1000, 928, -1.3, 110, 12, '#5A4058', 0, null, { seed: 34, ...nt }); msBranchTree(860, 950, -2.0, 90, 10, '#5A4058', 0, null, { seed: 35, ...nt });
  // Helena, left: pleading brows, open palm offered toward Hermia, the other hand pressed to her heart
  const HE = MS_CAST.helena, HM = MS_CAST.hermia;
  const a = msStand({ lean: .1, turn: .7 });
  Object.assign(a, {
    head: [.3, -2.82], neck: [.25, -2.3], shL: [-.3, -2.05], shR: [.55, -2.02],
    elL: [-.62, -1.2], wrL: [-.05, -1.5], handL: { ang: -.9, spread: .25, curl: .1, side: 1 },
    elR: [.95, -1.35], wrR: [1.55, -1.7], handR: { ang: -.35, spread: .5, curl: -.05, side: -1 },
    hipL: [-.25, 0], hipR: [.28, 0], knL: [-.35, 1.9], anL: [-.45, 3.75], footL: { ang: .3 }, knR: [.5, 1.85], anR: [.65, 3.72], footR: { ang: .1 },
    wind: -.2, front: 'R', tilt: -.05, face: { ...MS_EXPR.plead, look: [.9, .1] },
    skirt: [[.8, 3.3], [.45, 3.5], [-.15, 3.55], [-.7, 3.45], [-1.0, 3.15], [-.8, 2.2]],
    over: [[.3, .9], [.1, 2.0], [-.3, 3.0], [-.9, 3.5], [-1.5, 3.4], [-1.4, 2.6], [-.9, 1.6], [-.5, .8]],
    order: ['hairBack', 'legB', 'legF', 'skirt', 'over', 'torso', 'armB', 'armF', 'head', 'hairFront']
  });
  msFigure(600, 555, 112, HE, a, { light: -1, skirt: { folds: 4 }, over: { trim: HE.trim, folds: 3 } });
  // Hermia, right: knitted brows and pressed mouth, one hand raised flat to halt her, the other fist on her hip
  const b = msStand({ lean: -.08, turn: -.7 });
  Object.assign(b, {
    head: [-.3, -2.82], neck: [-.25, -2.3], shR: [.3, -2.05], shL: [-.55, -2.02],
    elR: [.78, -1.2], wrR: [.38, -.2], handR: { ang: 1.3, spread: .15, curl: .6, side: -1 },
    elL: [-.9, -1.4], wrL: [-1.4, -1.9], handL: { ang: -2.5, spread: .35, curl: 0, side: 1 },
    hipL: [-.28, 0], hipR: [.25, 0], knL: [-.5, 1.85], anL: [-.65, 3.72], footL: { ang: Math.PI - .15 }, knR: [.35, 1.9], anR: [.45, 3.75], footR: { ang: Math.PI - .3 },
    wind: .15, front: 'L', tilt: .04, face: { ...MS_EXPR.firm, look: [-.9, 0] },
    skirt: [[.9, 3.2], [.6, 3.5], [.1, 3.55], [-.45, 3.5], [-.85, 3.3], [-.75, 2.4]],
    drape: [[-.6, -2.1], [-.95, -1.5], [-1.05, -.8], [-1.2, 0]]
  });
  msFigure(1300, 572, 104, HM, b, { light: -1, skirt: { trim: HM.trim, folds: 4 }, drape: { w0: .3, w1: .5 } });
  // night flowers and fireflies
  msBed(220, 990, 150, 40, [PN.vio, PN.mag, PN.turq], 10, 12, 20, { shade: 60, grass: '#1C4A4A' });
  msBed(1700, 985, 170, 40, [PN.mag, PN.turq, PN.gold], 10, 12, 20, { shade: 60, grass: '#1C4A4A' });
  msBlooms([[960, 1030, 16, 6], [1040, 1050, 14, 5], [880, 1050, 13, 6]], PN.vio);
  const ff = []; for (let i = 0; i < 16; i++) ff.push([msRnd(120, 1800), msRnd(380, 980), msRnd(8, 20), msRnd(.4, .9)]);
  glows(ff, '#FFE48A', true);
  glows([[960, 940, 260, .25], [700, 760, 140, .2]], '#8FD6FF', true);
};
LOOPS.P04.len = 1;

// ---------- P05 — Canopy court ----------
LOOPS.P05 = t => {
  msSeed();
  msSky('#8FE0E6', '#1E7D55', { y0: .35 });
  msGlade(900, 480, 520, 420);
  msDapple(300, 100, 1700, 700, 6, [PN.cream, PN.goldLt], 50);
  // the great left trunk, its arching branches, the canopy and Puck's branch from the right
  msTrunk(230, 1010, 1120, 230, .08, PN.bark, { ph: 1.5, top: .6 });
  msBranchTree(330, 150, .25, 760, 70, PN.bark, 2, [PN.leafLt, PN.emer], { bend: .5, twist: .8, seed: 41 });
  msBranchTree(290, 420, -.1, 420, 46, PN.bark, 1, [PN.leafMd, PN.leafLt], { bend: -.5, seed: 42 });
  msBranchTree(1900, 140, 3.05, 560, 52, PN.bark, 2, [PN.leafMd, PN.gold], { bend: -.4, seed: 43 });
  msFoliage(520, 60, 560, 200, [PN.emerDk, PN.emer, PN.leafLt], { n: 34 });
  msFoliage(1400, 30, 520, 150, [PN.vioDk, PN.vio, PN.leafMd], { n: 28 });
  msFoliage(1800, 440, 190, 240, [PN.emerDk, PN.emer, PN.turq], { n: 18 });
  msWood([[1230, 400], [1380, 352], [1530, 338], [1700, 322], [1960, 280]], 56, 70, PN.bark, { seed: 44, knot: true, moss: PN.moss });
  msVine([[1250, 395], [1340, 372], [1440, 352]], 4, PN.mossDk, PN.leafLt, 4);
  // layered roots at the ground, behind the queen
  msGround([[-40, 960], [600, 940], [1200, 950], [1960, 935], [1960, 1120], [-40, 1120]], PN.mossDk, PN.emerDk, 120);
  msWood([[280, 960], [420, 870], [650, 840], [900, 860], [1150, 910], [1400, 960]], 90, 60, PN.bark, { seed: 45, knot: true, moss: PN.moss });
  msWood([[1100, 960], [1300, 900], [1550, 880], [1800, 920], [1960, 980]], 80, 70, PN.bark, { seed: 46, knot: true, moss: PN.moss, side: -1 });
  msHatch(1000, 1000, 1700, 60, .02, 14, PN.emerDk, .2);
  msBlooms([[300, 760, 48, 6], [1350, 790, 42, 7], [1600, 820, 36, 6]], PN.mag);
  msBlooms([[470, 820, 32, 5], [1180, 830, 30, 6]], PN.turq, { core: PN.goldDk });
  // Puck, a lean adult, seated on the branch with his palms braced on the wood, boots hanging apart, watching her amused
  const PU = MS_CAST.puck, q = msStand({ lean: -.15, turn: -.55 });
  Object.assign(q, {
    head: [-.3, -2.75], neck: [-.22, -2.28], shL: [-.6, -2.0], shR: [.35, -2.05],
    elL: [-.9, -1.0], wrL: [-.6, .12], handL: { ang: 2.7, spread: .3, curl: .3, side: 1 },
    elR: [.8, -1.0], wrR: [1.0, .1], handR: { ang: .3, spread: .3, curl: .3, side: -1 },
    hipL: [-.3, 0], hipR: [.28, 0], knL: [-1.05, .45], anL: [-1.2, 1.85], footL: { ang: 1.15 }, knR: [-.5, .8], anR: [-.3, 2.2], footR: { ang: 1.5 },
    front: 'L', face: { ...MS_EXPR.amused, look: [-.9, .35] }, skirt: [[.55, .3], [.35, .6], [0, .7], [-.45, .65], [-.8, .4]]
  });
  msFigure(1500, 304, 70, PU, q, { light: -1, skirt: { trim: PU.trim, folds: 2 } });
  // Titania holding court: one hand raised toward the branch, the other lifting her gown through the slit
  const TI = MS_CAST.titania, s = 112, p = msStand({ lean: .04, turn: .2 });
  Object.assign(p, {
    head: [.08, -2.85], neck: [.06, -2.32], shL: [-.55, -2.05], shR: [.55, -2.05],
    elR: [1.15, -1.6], wrR: [1.75, -2.35], handR: { ang: -1.1, spread: .5, curl: .05, side: -1 },
    elL: [-.85, -1.1], wrL: [-.75, -.05], handL: { ang: 1.7, spread: .3, curl: .5, side: 1 },
    hipL: [-.33, 0], hipR: [.33, 0], knL: [-.4, 1.9], anL: [-.5, 3.75], footL: { ang: .1 }, knR: [.55, 1.85], anR: [.75, 3.7], footR: { ang: .5 },
    wind: .1, front: 'R', face: { ...MS_EXPR.regal, look: [.7, -.25] },
    skirt: [[.6, 1.3], [.35, 2.4], [.5, 3.5], [0, 3.65], [-.6, 3.55], [-1.05, 3.25], [-.95, 2.4]]
  });
  msFigure(760, 560, s, TI, p, { light: 1, skirt: { trim: TI.trim, folds: 5 } });
  // foreground roots, beds and ferns framing the clearing
  msWood([[-40, 1060], [200, 990], [450, 1000], [600, 1060]], 70, 60, PN.bark, { seed: 47, moss: PN.moss });
  msWood([[1050, 1080], [1250, 990], [1500, 962], [1750, 990], [1960, 1060]], 76, 60, PN.bark, { seed: 48, knot: true, moss: PN.moss });
  msBed(330, 985, 200, 40, [PN.vio, PN.gold, PN.mag], 14, 14, 24);
  msBed(1250, 1010, 220, 36, [PN.turq, PN.ruby, PN.gold], 14, 14, 24);
  msBed(1750, 960, 150, 36, [PN.mag, PN.vio, PN.turq], 10, 12, 22);
  msFern(560, 950, -1.4, 170, PN.emer); msFern(1050, 960, -1.9, 160, PN.leafMd); msFern(1480, 940, -1.2, 150, PN.emer);
  glows([[900, 440, 240, .5], [1250, 300, 60, .4], [500, 600, 50, .4], [1650, 600, 40, .4], [1120, 700, 30, .4]], PN.sun, true);
};
LOOPS.P05.len = 1;
