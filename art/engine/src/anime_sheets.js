// anime_sheets.js: model-sheet loops for the anime rig (anime.js). Reference sheets, so labels are fine.
//   node render.mjs --loop=rigFaces --sheet=1 --cols=1 --w=1920 --out=docs/anime-faces.jpg
//   rigTurn rigFaces rigCast rigPoses rigClose rigAct, plus work and regression loops at the end
//   (rigHeads, rigWork, rigBlink, menBusts, rigRobust, rigDeterm, rigPerf, rigPerf4).
(() => {
  const label = (txt, x, y, size = 20, col = '#3A3550') => celText(txt, x, y, size, { fill: col, font: ANIME_FONTS.clean, weight: 700 });
  const title = (txt, x = 40, y = 44) => celText(txt, x, y, 30, { fill: '#2A2540', font: ANIME_FONTS.title, align: 'left' });
  const studio = (top = '#EEF1F8', bot = '#F8EEF1') => skyGrad([[0, top], [1, bot]]);
  const floorLine = (y, x0 = 40, x1 = W - 40) => celStroke([[x0, y], [x1, y]], 2, 'rgba(60,50,90,.18)');
  const guide = (y, txt, x0 = 40, x1 = W - 40) => { celStroke([[x0, y], [x1, y]], 1.5, 'rgba(200,60,110,.45)', { dash: [10, 8] }); celText(txt, 1560, y - 12, 15, { fill: 'rgba(170,50,95,.85)', font: ANIME_FONTS.clean, weight: 700, align: 'left' }); };
  const AD = ANIME_DESIGNS;

  // ---- one design through every view: full figures, a continuous turn, heads with the eye and chin lines
  LOOPS.rigTurn = t => {
    studio();
    const d = AD.heroine, views = ['front', 'q', 'side', 'qback', 'back'];
    title('rigTurn · heroine');
    views.forEach((v, i) => { const x = 170 + i * 300; animeChar(x, 690, 78, d, { view: v, t, seed: i }); label(v, x, 725); });
    // continuous yaw (one full turn per loop, on twos) with the hair following through
    const yaw = (onTwos(t) / LOOPS.rigTurn.len) * 4 - 2;
    animeChar(1745, 690, 78, d, { yaw, hairYaw: yaw - .12, t, seed: 9 });
    label('yaw ' + yaw.toFixed(2), 1745, 725);
    floorLine(690);
    // heads: the eye line and the chin line hold in every view (the on-model proof)
    const hy = 905, hu = 150;
    guide(hy + .07 * hu, 'eye line'); guide(hy + .5 * hu, 'chin');
    views.forEach((v, i) => animeHead(170 + i * 300, hy, hu, d, { view: v, t, seed: i + 3, saccade: false }));
    animeHead(1745, hy, hu, d, { view: 'q', flip: true, t, seed: 7, expr: 'smile' });
    celRect(1690, 760, 110, 26, { fill: 'rgba(255,255,255,.85)' }, 6); label('q, flip', 1745, 773, 18);
  };
  LOOPS.rigTurn.len = 4;

  // ---- every expression, bust, cycled through the cast and the views (expressions must work on every face)
  LOOPS.rigFaces = t => {
    studio('#F1F0F7', '#F7EFF2');
    const names = Object.keys(ANIME_EXPR), cols = 7, cw = W / cols, ch = H / 4, cast = ['heroine', 'rival', 'elder', 'youth'];
    names.forEach((n, i) => {
      const cx = cw * (i % cols) + cw / 2, cy = ch * Math.floor(i / cols), r = Math.floor(i / cols);
      const who = cast[(i + r) % 4], k = (i + r) % 3;   // 0 front, 1 three-quarter right, 2 three-quarter left
      animeBust(cx, cy + 236, 150, AD[who], { expr: n, t, seed: i, view: k ? 'q' : 'front', flip: k === 2, cut: .04 });
      celRect(cx - 74, cy + ch - 33, 148, 27, { fill: 'rgba(255,255,255,.88)' }, 6);
      label(n, cx, cy + ch - 19, 19);
    });
  };
  LOOPS.rigFaces.len = 4;

  // ---- the cast side by side at true relative scale, with a head-height ruler
  LOOPS.rigCast = t => {
    studio();
    title('rigCast · true relative scale (ticks = 1 head)');
    const N = ['heroine', 'rival', 'elder', 'youth', 'sage', 'diva', 'judge'], u = 104, gy = 1010;
    for (let k = 0; k <= 8; k++) { const y = gy - k * u; celStroke([[60, y], [92, y]], 2, 'rgba(60,50,90,.5)'); label(String(k), 40, y, 16); }
    celStroke([[76, gy], [76, gy - 8 * u]], 2, 'rgba(60,50,90,.35)');
    const arms = [['hip', 'down'], ['cross', 'cross'], ['down', 'down'], ['down', 'hip'], ['hold', 'down'], ['down', 'hip'], ['down', 'down']];
    N.forEach((n, i) => {
      const d = AD[n], D = _anD(d), x = 215 + i * 250;
      animeChar(x, gy, u, d, { view: i % 2 ? 'q' : 'front', flip: i > 3, t, seed: i, expr: ['smile', 'confident', 'neutral', 'grin', 'tender', 'wink', 'cold'][i], armR: arms[i][0], armL: arms[i][1] });
      label(`${D.name} · ${D.heads} heads`, x, gy + 38, 17);
    });
    floorLine(gy, 110);
  };
  LOOPS.rigCast.len = 4;

  // ---- arm and hand poses, a walk, a held prop
  const wineGlass = () => {
    cel([[-.02, -.02], [.02, -.02], [.02, -.42], [-.02, -.42]], { fill: 'rgba(230,240,255,.85)', line: '#8FA0C0', lw: .008 });
    cel(celSpline([[-.13, -.42], [.13, -.42], [.11, -.62], [0, -.68], [-.11, -.62]]), { fill: 'rgba(225,238,255,.55)', line: '#8FA0C0', lw: .008 });
    cel(celSpline([[-.1, -.5], [.1, -.5], [.08, -.6], [0, -.64], [-.08, -.6]]), { fill: '#9E1B36' });
    celEll(0, -.02, .1, .025, { fill: 'rgba(230,240,255,.85)', line: '#8FA0C0', lw: .008 });
  };
  LOOPS.rigPoses = t => {
    studio();
    title('rigPoses', 1600, 40);
    // row 1: the named arm poses ('point' follows the heading: front, 3/4 and profile)
    const row1 = [['point', 'youth', 'front'], ['down', 'rival', 'front'], ['hip', 'heroine', 'front'], ['cross', AN_HATTED_ELDER, 'front'], ['point', 'youth', 'q'], ['point', 'rival', 'side'], ['raise', 'diva', 'front'], ['wave', 'heroine', 'front'], ['reach', 'youth', 'front']];
    row1.forEach(([a, n, v], i) => { const x = 215 + i * 198; animeChar(x, 555, 54, typeof n === 'string' ? AD[n] : n, { view: v, armR: a, armL: a === 'cross' ? 'cross' : a === 'hip' ? 'hip' : 'down', t, seed: i, expr: a === 'point' ? 'determined' : a === 'wave' ? 'smile' : a === 'raise' ? 'laugh' : 'neutral' }); label(a + (v !== 'front' ? ' · ' + v : ''), x, 580, 17); });
    floorLine(555);
    const gy = 1040, u2 = 56;
    animeChar(110, gy, u2, AD.heroine, { view: 'q', armR: 'hold', holdR: wineGlass, t, seed: 11, expr: 'smile' }); label('hold + prop', 110, 1066, 16);
    animeChar(300, gy, u2, AD.rival, { view: 'q', armR: 'chin', armL: 'cross', t, seed: 12, expr: 'thinking' }); label('chin', 300, 1066, 16);
    // sitting (on a bench) and half way up (the body leans over the feet), then a blended arm
    const bench = (x, top) => { celRect(x - 95, top, 190, 16, { fill: '#8A6A50', line: '#4A3428', lw: 2 }, 3); celRect(x - 85, top + 16, 12, gy - top - 16, { fill: '#6E5240' }); celRect(x + 73, top + 16, 12, gy - top - 16, { fill: '#6E5240' }); };
    bench(520, gy - 2.12 * u2); animeChar(520, gy, u2, AD.sage, { view: 'q', sit: 1, armR: 'desk', armL: 'down', t, seed: 13, expr: 'tender' }); label('sit', 520, 1066, 16);
    animeChar(720, gy, u2, AD.rival, { view: 'side', sit: .5, armR: 'down', armL: 'down', t, seed: 14 }); label('sit .5 (rising)', 720, 1066, 16);
    animeChar(900, gy, u2, AD.youth, { view: 'q', armR: animeArm(.5, 0, 1, 'down', 'point'), t, seed: 15 }); label('animeArm down→point', 900, 1066, 16);
    // a walk cycle in profile, and one walking live
    const sw = (s, ph) => ({ up: [s * .05, 1, -s * .35 * Math.sin(ph * TAU)], fore: [s * .05, 1, -s * .2 * Math.sin(ph * TAU) + .25] });
    for (let k = 0; k < 3; k++) { const x = 1070 + k * 140, ph = k / 4; animeChar(x, gy, u2, AD.youth, { view: 'side', walk: ph, armR: sw(-1, ph), armL: sw(1, ph), t, seed: 20 + k }); label('walk ' + ph, x, 1066, 15); }
    const ph = t * 1.1; animeChar(1500, gy, u2, AD.heroine, { view: 'q', walk: ph, armR: sw(-1, ph), armL: sw(1, ph), t, seed: 30, expr: 'smile' }); label('walk (live)', 1500, 1066, 15);
    // hands, large
    ['open', 'fist', 'point', 'relaxed', 'hold'].forEach((k, i) => { const x = 1700 + (i % 2) * 130, y = 660 + Math.floor(i / 2) * 140; _anHandSheet(x, y, 190, AD.heroine, k); label(k, x, y + 62, 15); });
    floorLine(gy);
  };
  LOOPS.rigPoses.len = 4;

  // ---- big heads: front, 3/4, profile; blinking and talking
  const LINE = [['I', .3, .45], ['will', .5, .75], ['not', .82, 1.05], ['lose', 1.1, 1.5], ['to', 1.9, 2.0], ['you', 2.05, 2.4], ['tonight', 2.5, 3.1]];
  LOOPS.rigClose = t => {
    studio('#EAEFF8', '#F6EEF2');
    const talk = animeTalk(t % 3.6, LINE);
    [['front', 'heroine'], ['q', 'heroine'], ['side', 'heroine']].forEach(([v, n], i) => animeBust(330 + i * 630, 540 + .8 * 430, 430, AD[n], { view: v, t: t + i * 1.3, seed: i * 2, talk, expr: 'neutral' }));
  };
  LOOPS.rigClose.len = 4;

  // ---- the acting test: she notices something, turns to it (a big turn, on twos, the hair following through), a
  // surprised take (anticipation squint, eyes pop, push-in, focus lines), then a confident smile and a wink
  LOOPS.rigAct = t => {
    skyGrad([[0, '#2E3A6E'], [.55, '#C77FA0'], [1, '#F6C9A8']]);
    bokeh(t, { n: 16, a: .22, seed: 3 });
    // she is lost in thought (looking down), hears something: the head lifts, she leans toward it with a half blink and
    // the eyes snap round; she turns (on twos, hair following through), a surprised take (anticipation squint, eyes
    // pop, push-in, focus lines), then a confident smile and a wink (on the near eye), with a sparkle on it
    const keys = [[0, 'neutral', { lookX: -.3, lookY: .45, headNod: .12, open: .9 }], [.95, 'neutral', { lookX: -.1, lookY: .1, headNod: -.06, browY: .1 }], [1.2, 'neutral', { lookX: .95, lookY: -.1, browY: .22, open: 1.06, headNod: -.14 }], [2.45, 'surprised'], [3.6, 'confident'], [4.75, 'wink']];
    const A = animeAct(t, keys, { seed: 4 });
    const P = { ...A, ...animeTurn(t, 1.65, 2.2, -1, .3), t, seed: 4, rim: '#FFD9E8', light: [-.7, -.7], wind: [.1 + .08 * Math.sin(t * 1.3), 0], lean: .035 * ease(seg(t, .95, 1.25)) * (1 - ease(seg(t, 1.65, 2.2))),
      blink: Math.max(A.blink, .55 * _anBump(t, .93, 1.0, 1.08)) };
    camBegin(960, 560, 1 + .07 * ease(seg(t, 2.45, 2.75)) - .035 * ease(seg(t, 3.6, 4.6)));
    animeBust(960, 870, 430, AD.heroine, P);
    if (t > 4.78) {   // the sparkle sits on the winking (near) eye's outer corner, wherever the head is
      const k = easeOut(seg(t, 4.78, 5.0)), e = animeAnchors(960, 870, 430, AD.heroine, P, 'bust').eyeNear, ex = e[0] - 78, ey = e[1] - 46;
      sparkle(ex, ey, 46 * k * (1 + .1 * Math.sin(t * 9)), '#FFFFFF', k * (1 - seg(t, 5.7, 6)), .3); sparkle(ex - 34, ey - 44, 22 * k, '#FFF2C8', k * (.6 + .4 * Math.sin(t * 7)), 0); sparkles(t, ex - 30, ey - 20, 90, 70, { n: 6, r: 18, seed: 2, col: '#FFFFFF' });
    }
    camEnd();
    if (t > 2.45 && t < 3.25) { const k = seg(t, 2.45, 2.55) * (1 - seg(t, 2.9, 3.25)); speedLines(t, { x: 960, y: 430, rx: 430, ry: 380, n: 70, a: .38 * k, col: '#FFFFFF' }); }
  };
  LOOPS.rigAct.len = 6;

  // ---- perf: one heroine at u = 120 (and a sheet of four)
  LOOPS.rigPerf = t => { studio(); animeChar(960, 1040, 120, AD.heroine, { view: 'q', t }); };
  LOOPS.rigPerf.len = 1;
  LOOPS.rigPerf4 = t => { studio(); ['heroine', 'rival', 'elder', 'youth'].forEach((n, i) => animeChar(280 + i * 450, 1040, 120, AD[n], { view: 'q', t })); };
  LOOPS.rigPerf4.len = 1;
  LOOPS.rigBg = t => { studio(); };   // background only (subtract it from the perf numbers)
  LOOPS.rigBg.len = 1;
})();
// A single hand, large, for the pose sheet.
function _anHandSheet(x, y, s, design, kind) {
  push(); translate(x, y); scale(s);
  _anRun(c => { const D = _anD(design); _anHand(D, kind, [-.25, 0], [1, -.35], [0, -1], .62, [-.55, -.83], kind === 'hold' ? () => { c.fillStyle = '#8B5A3C'; c.fillRect(-.05, -.35, .1, .7); } : null); });
  pop();
}
// ---- the men (and the rival) at bust scale, and a forced blink + talk for strips
LOOPS.menBusts = t => {
  skyGrad([[0, '#EAEFF8'], [1, '#F6EEF2']]);
  [['elder', 'front', 'neutral'], ['elder', 'q', 'confident'], ['youth', 'q', 'smile'], ['rival', 'q', 'smug']].forEach(([n, v, e], i) => animeBust(240 + i * 480, 330 + .8 * 300, 300, ANIME_DESIGNS[n], { view: v, t, expr: e, cut: .7, seed: i }));
};
LOOPS.menBusts.len = 4;
LOOPS.rigBlink = t => {
  skyGrad([[0, '#EAEFF8'], [1, '#F6EEF2']]);
  const b = _anBump(t, .1, .17, .3), words = [['hello', .35, .7], ['there', .75, 1.0]];
  animeBust(560, 380 + .8 * 600, 600, ANIME_DESIGNS.heroine, { view: 'q', blink: b, autoBlink: false, saccade: false, t: 0, talk: animeTalk(t, words) });
  animeBust(1500, 380 + .8 * 600, 600, ANIME_DESIGNS.elder, { view: 'front', blink: b, autoBlink: false, saccade: false, t: 0, talk: animeTalk(t, words) });
};
LOOPS.rigBlink.len = 1.2;
// ---- determinism: a frozen pose must render the same pixels every time (render it twice and compare the bytes):
//   node render.mjs --loop=rigDeterm --stills=0.5 --out=out/det1 && node render.mjs --loop=rigDeterm --stills=0.5 --out=out/det2
//   && shasum out/det1/* out/det2/*
LOOPS.rigDeterm = t => {
  skyGrad([[0, '#EAEFF8'], [1, '#F6EEF2']]);
  const P = { t: 1.234, seed: 3, autoBlink: false, saccade: false };
  animeBust(480, 900, 300, ANIME_DESIGNS.heroine, { ...P, view: 'q', expr: 'smile', wind: [.2, 0] });
  animeChar(1100, 1040, 110, ANIME_DESIGNS.elder, { ...P, view: 'front', armR: 'hip' });
  animeChar(1500, 1040, 110, ANIME_DESIGNS.youth, { ...P, view: 'side', walk: .3 });
};
LOOPS.rigDeterm.len = 1;

// ---- regression guards (not model sheets): bad input, nesting, spins. Errors and NaN geometry are printed to the
// render log as [page] lines; a clean run prints "rigRobust: 0 bad canvas calls".
//   node render.mjs --loop=rigRobust --sheet=0.5 --cols=1 --w=1920 --out=out/robust.jpg
LOOPS.rigRobust = t => {
  skyGrad([[0, '#EEF1F8'], [1, '#F8EEF1']]);
  let bad = 0;
  const wrap = (proto, names) => names.map(n => { const f = proto[n]; proto[n] = function (...a) { for (const v of a) if (typeof v === 'number' && !isFinite(v)) { bad++; break; } return f.apply(this, a); }; return [proto, n, f]; });
  const undo = [...wrap(CanvasRenderingContext2D.prototype, ['moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc', 'ellipse', 'rect', 'translate', 'scale', 'rotate', 'transform', 'setTransform', 'createLinearGradient', 'createRadialGradient', 'fillRect']),
    ...wrap(Path2D.prototype, ['moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc', 'ellipse', 'rect'])];
  const H0 = ANIME_DESIGNS.heroine, cases = [
    ['empty design', u => animeHead(0, 0, u, {}, { t })],
    ['male minimal', u => animeHead(0, 0, u, { build: { sex: 'm' }, age: 'elder' }, { t })],
    ['3-digit hex', u => animeHead(0, 0, u, { skin: '#fdb', hair: { col: '#a33' }, eyes: { col: '#3a6' } }, { t })],
    ['bogus names', u => animeHead(0, 0, u, { hair: { style: 'mohawk' }, eyes: { shape: 'star' } }, { view: 'up', expr: 'zany', eyes: 'nope', t })],
    ['NaN pose', u => animeHead(0, 0, u, H0, { yaw: NaN, tilt: Infinity, nod: NaN, lookX: NaN, talk: NaN, blink: NaN, t })],
    ['extremes', u => animeHead(0, 0, u, H0, { tilt: 3, nod: 5, lookX: 9, lookY: -9, talk: 4, t })],
    ['yaw 405', u => animeHead(0, 0, u, H0, { yaw: 4.5, t })],
    ['yaw -315', u => animeHead(0, 0, u, H0, { yaw: -3.5, t })],
    ['yaw 540 hair lag', u => animeHead(0, 0, u, H0, { yaw: 6, hairYaw: 5.6, t })],
    ['act []', u => animeHead(0, 0, u, H0, { ...animeAct(t, []), t })],
    ['act unknown', u => animeHead(0, 0, u, H0, { ...animeAct(t, [[0, 'zz'], [.2, 'surprised']]), t })],
    ['turn t0==t1', u => animeHead(0, 0, u, H0, { ...animeTurn(t, .3, .3, 'side', 'front'), t })],
    ['talk undefined', u => animeHead(0, 0, u, H0, { talk: animeTalk(t, undefined), t })],
    ['nested prop', u => animeChar(0, u * 3.9, u / 2, H0, { armR: 'hold', holdR: () => animeHead(0, -.3, .5, ANIME_DESIGNS.rival, { t }), t })],
    ['throwing prop', u => animeChar(0, u * 3.9, u / 2, H0, { armR: 'hold', holdR: () => { throw new Error('prop test throw (expected once)'); }, t })],
    ['after the throw', u => animeHead(0, 0, u, ANIME_DESIGNS.youth, { expr: 'grin', t })],
    ['walk 1e6 wind 50', u => animeChar(0, u * 3.9, u / 2, ANIME_DESIGNS.youth, { view: 'side', walk: 1e6, wind: [50, 50], t: 1e7 })],
    ['u = 6', u => animeChar(0, u * 3.9, 6, H0, { t })],
    ['sit NaN, arm triple', u => animeChar(0, u * 3.9, u / 2, ANIME_DESIGNS.sage, { sit: NaN, seat: Infinity, armR: ['down', 'nope', NaN], armL: [{ T: [NaN, 1, 2] }, 'point', .5], t })],
    ['sit 1, aim', u => animeChar(0, u * 3.9, u / 2, ANIME_DESIGNS.rival, { view: 'q', sit: 1, seat: .4, armR: { aim: [1, -.2, 0] }, t })],
    ['bun, grey, collar', u => animeBust(0, u * .9, u * .8, { hair: { style: 'bun', grey: .7, bunAt: 9 }, outfit: { type: 'robe', collar: 'jabot', sash: false }, age: 'mature' }, { view: 'qback', t })],
    ['anchors', u => { const a = animeAnchors(0, 0, u, H0, { t, view: 'q', armR: 'point' }, 'head'); celEll(a.eyeNear[0], a.eyeNear[1], 6, 6, { fill: '#F0A' }); animeHead(0, 0, u, H0, { t, view: 'q' }); }],
  ];
  cases.forEach(([name, fn], i) => {
    const x = 115 + (i % 8) * 240, y = 150 + Math.floor(i / 8) * 340;
    push(); translate(x, y); fn(130); pop();
    celText(name, x, y + 125, 16, { fill: '#3A3550', font: ANIME_FONTS.clean, weight: 700 });
  });
  for (const [p, n, f] of undo) p[n] = f;
  console.warn(`rigRobust: ${bad} bad canvas calls`);
};
LOOPS.rigRobust.len = 1;

// ---- every cast member's head through the five views (work sheet): ?r= picks rows via LOOPS.rigHeads.rows
//   node render.mjs --loop=rigHeads --sheet=0.5 --cols=1 --w=1920 --out=out/heads.jpg
LOOPS.rigHeads = t => {
  skyGrad([[0, '#EAEFF8'], [1, '#F6EEF2']]);
  const names = LOOPS.rigHeads.rows || ['heroine', 'rival', 'elder', 'youth'], views = ['front', 'q', 'side', 'qback', 'back'], rh = H / names.length;
  names.forEach((n, r) => views.forEach((v, i) => animeBust(220 + i * 370, r * rh + rh * .74, rh * .42, ANIME_DESIGNS[n], { view: v, t, seed: r * 5 + i, cut: .55, expr: LOOPS.rigHeads.expr || 'neutral', autoBlink: false, saccade: false })));
};
LOOPS.rigHeads.len = 1;

// ---- scratch work loop: big heads for close inspection (cells: [design name or object, view, expr])
LOOPS.rigWork = t => {
  skyGrad([[0, '#EAEFF8'], [1, '#F6EEF2']]);
  LOOPS.rigWork.cells.forEach(([n, v, e], i) => animeBust(330 + i * 630, 540 + .86 * 400, 400, typeof n === 'string' ? ANIME_DESIGNS[n] : n, { view: v, t, seed: 2, autoBlink: false, saccade: false, expr: e }));
};
LOOPS.rigWork.len = 1;
const AN_HATTED_ELDER = { ...ANIME_DESIGNS.elder, name: 'Elder in a fedora', acc: { beard: 'short', hat: { col: '#2E2A33', band: '#7A2836' } } };
LOOPS.rigWork.cells = [['elder', 'front', 'neutral'], ['judge', 'q', 'cold'], ['heroine', 'side', 'neutral']];

// ---- re-entrancy: a prop that draws another character (a portrait, a puppet) lands in the hand
LOOPS.rigNested = t => {
  skyGrad([[0, '#EAEFF8'], [1, '#F6EEF2']]);
  animeChar(700, 1040, 120, ANIME_DESIGNS.heroine, { view: 'q', armR: 'hold', t, holdR: () => { cel([[-.28, -.95], [.28, -.95], [.28, -.05], [-.28, -.05]], { fill: '#F4E9D6', line: '#8A6A3A', lw: .02 }); animeHead(0, -.5, .5, ANIME_DESIGNS.rival, { t, expr: 'smile' }); } });
  animeChar(1300, 1040, 120, ANIME_DESIGNS.youth, { view: 'front', armR: 'point', armL: 'hold', t, holdL: () => animeHead(0, -.35, .4, ANIME_DESIGNS.elder, { t, view: 'q' }) });
};
LOOPS.rigNested.len = 1;
// ---- a slow continuous glide (no stepping) from 3/4-left through front to profile-right: checks the hair layers
LOOPS.rigGlide = t => {
  skyGrad([[0, '#EAEFF8'], [1, '#F6EEF2']]);
  const yaw = lerp(-1.2, 1.2, t / 2);
  animeBust(960, 900, 380, ANIME_DESIGNS.heroine, { yaw, hairYaw: yaw - .1, t: 0, autoBlink: false, saccade: false });
  celText('yaw ' + yaw.toFixed(2), 960, 60, 30, { fill: '#3A3550', font: ANIME_FONTS.clean, weight: 700 });
};
LOOPS.rigGlide.len = 2;

// ---- debug: hair clumps coloured by kind (back blue, side green, cap orange, bang red; a dome style's mass magenta)
LOOPS.rigDbg = t => { window._AN_DBG = true; LOOPS.rigWork(t); window._AN_DBG = false; };
LOOPS.rigDbg.len = 1;

// the other three sample designs through the five views
LOOPS.rigHeads2 = t => { LOOPS.rigHeads.rows = ['sage', 'diva', 'judge']; LOOPS.rigHeads(t); LOOPS.rigHeads.rows = null; };
LOOPS.rigHeads2.len = 1;
