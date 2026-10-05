// panels.js: the five Midsummer stills, P01–P05. Each loop repaints its whole frame at t = 0 from palette.js and cast.js.
(() => {
  const at = (X, Y, s) => (x, y) => [X + x * s, Y + y * s];
  const pm = (f, L) => L.map(p => f(p[0], p[1]));
  function wavy(y, amp, seed, n = 10) {
    const P = [];
    for (let i = 0; i <= n; i++) P.push([lerp(-60, W + 60, i / n), y + amp * Math.sin(i * 1.7 + seed) + amp * (mdH(seed, i) - .5)]);
    return P;
  }
  const ground = (y, amp, col, seed, op = 255) => mdWash([...wavy(y, amp, seed), [W + 60, H + 80], [-60, H + 80]], col, op, .3);
  function farTrees(list, col, op = 255) {
    for (const [x, w, bend] of list) mdWash(mdTube([[x, H + 40], [x + bend * .25, H * .62], [x + bend * .7, H * .3], [x + bend, -80]], [w * 1.3, w, w * .85, w * .7]), col, op, .3);
  }
  function clumps(list, col, op = 255, fill = false) {
    for (const [x, y, rx, ry, sd] of list) { const B = mdBlob(x, y, rx, ry, sd || 1, 22, .2); if (fill) mdFill(B, col, op, .16, .65); else mdWash(B, col, op, .4); }
  }
  function leafRim(x, y, rx, ry, n, seed, col, sz = 26, ink = MD.leafDk) {
    const L = [];
    for (let i = 0; i < n; i++) {
      const a = (i + mdH(seed, i) * .5) / n * TAU, px = x + Math.cos(a) * rx * .88, py = y + Math.sin(a) * ry * .88;
      if (py < -40) continue;
      L.push([px, py, sz * (.7 + .6 * mdH(seed + 2, i)), a + (mdH(seed + 4, i) - .5) * .9]);
    }
    mdLeaves(L, col, ink);
  }
  // a curling stem with alternating leaves in two greens
  function spray(x, y, a, len, seed, c1, c2, sz = 22, bend = .5) {
    const P = [];
    for (let i = 0; i <= 4; i++) { const k = i / 4, an = a + bend * k; P.push([x + Math.cos(an) * len * k, y + Math.sin(an) * len * k]); }
    inkLine(P, .5, MD.leafDk, 'ink', .5);
    const C = through(P, 3), A = [], B = [];
    for (let i = 1; i < C.length; i++) {
      const q = C[i - 1], p = C[i], d = Math.atan2(p[1] - q[1], p[0] - q[0]), g = i % 2 ? 1 : -1;
      (g > 0 ? A : B).push([p[0], p[1], sz * (.75 + .5 * mdH(seed, i)) * (1 - .3 * i / C.length), d + g * .85]);
    }
    mdLeaves(A, c1, MD.leafDk); mdLeaves(B, c2, MD.leafDk);
  }
  // foxglove / lupin spire
  function spire(x, y, h, lean, col, seed, r = 11) {
    inkLine([[x, y], [x + lean * .3, y - h * .5], [x + lean, y - h]], .55, MD.leafDk, 'ink', .5);
    mdLeaves([[x, y - h * .1, h * .24, -2.5], [x + lean * .05, y - h * .2, h * .2, -.7]], MD.leaf, MD.leafDk);
    const L = [];
    for (let i = 0; i < 9; i++) { const k = .35 + .65 * i / 8; L.push([x + lean * k * k + (i % 2 ? 1 : -1) * r * .5, y - h * k, r * (1.25 - .55 * k), 5, mdH(seed, i) * TAU]); }
    mdFlowers(L, col, MD.goldLt);
  }
  function stars(n, x0, y0, x1, y1, seed, col, r = 7) {
    const L = [];
    for (let i = 0; i < n; i++) L.push([lerp(x0, x1, mdH(seed, i)), lerp(y0, y1, mdH(seed + 1, i)), r * (.5 + mdH(seed + 2, i)), mdH(seed + 3, i)]);
    mdSparks(L, col);
  }
  // hanging vine with blossoms
  function blossomVine(P, col, seed, r = 10) {
    inkLine(through(P, 4), .45, MD.leafDk, 'ink', .5);
    const C = through(P, 3), L = [], F = [];
    C.forEach(([x, y], i) => { if (i % 2) L.push([x, y, r * 1.8, i % 4 === 1 ? .5 : 2.6]); else F.push([x + (mdH(seed, i) - .5) * r, y, r * (.8 + .4 * mdH(seed + 1, i)), 5, i]); });
    mdLeaves(L, MD.leafLt, MD.leafDk); mdFlowers(F, col, MD.goldLt);
  }

  // ======================= P01 — Root throne =======================
  LOOPS.P01 = t => {
    randomSeed(424242); noiseSeed(424242);
    mdBands([MD.turqDk, '#1F8C80', '#3AAE94', '#7FD09C', '#CBEA9E', MD.goldLt], -20, 930, 10, 1);
    glows([[1480, 300, 640, .75], [1150, 470, 430, .55], [860, 260, 300, .6]], MD.goldLt, true);
    farTrees([[70, 70, 40], [360, 40, -30], [1330, 46, 36], [1650, 84, -60], [1860, 44, 20]], mixCol(MD.violetLt, MD.turqLt, .35), 150);
    farTrees([[220, 56, 30], [1760, 60, -40]], mixCol(MD.violet, MD.turq, .35), 200);
    clumps([[230, 40, 360, 160, 1], [960, -10, 460, 120, 2], [1680, 60, 400, 180, 3]], MD.emerald, 170, true);
    clumps([[90, 230, 170, 90, 4], [1830, 280, 160, 100, 5]], MD.leafLt, 140, true);
    leafRim(230, 40, 360, 160, 30, 6, MD.leaf);
    leafRim(1680, 60, 400, 180, 30, 7, MD.leafLt);
    leafRim(960, -10, 460, 120, 26, 8, MD.emeraldLt);
    mdShaft(1740, -40, 1170, 640, 150, MD.goldLt, .32, 7);
    ground(880, 14, MD.mossDk, 3);
    ground(900, 10, MD.moss, 4);
    mdFill(rectPts(-40, 905, W + 80, 200), MD.emerald, 80, .2, .7);
    mdFill(mdBlob(1100, 965, 520, 50, 9, 18, .1), MD.goldLt, 90, .2, .5);
    // the throne: a twisting root arch over the queen
    const bk = '#6B3E4E', bk2 = '#5A3A62';
    mdRoot([[300, 1100], [430, 790], [530, 490], [680, 260], [880, 112], [1100, 96], [1250, 180]], 180, 44, bk, '#B98377', MD.barkDk, 2);
    mdRoot([[1610, 1100], [1510, 790], [1450, 500], [1370, 300], [1250, 180]], 150, 44, bk2, '#A98BC0', MD.barkDk, 3);
    mdCross(470, 760, 50, 140, -1.2, 11, .2, MD.barkDk, 4);
    mdCross(1520, 800, 45, 130, -1.9, 11, .2, MD.barkDk, 5);
    const tp = mdTree(1255, 175, -.75, 160, 28, 2, 7, bk2, MD.barkDk).concat(mdTree(690, 255, -2.35, 150, 26, 2, 9, bk, MD.barkDk));
    mdFoliage(tp, 30, 12, MD.leaf, MD.leafLt);
    const arch = through([[430, 790], [530, 490], [680, 260], [880, 112], [1100, 96], [1250, 180], [1370, 300], [1450, 500], [1510, 790]], 2);
    const FA = [], FB = [], FC = [], LA = [];
    arch.forEach(([x, y], i) => {
      if (x > 700 && x < 1080) return;
      const f = [x + (mdH(31, i) - .5) * 60, y + (mdH(32, i) - .5) * 40, 14 + 10 * mdH(33, i), 5 + i % 2, i];
      [FA, FB, FC][i % 3].push(f);
      LA.push([x, y, 30, (i % 2 ? .4 : 2.7) + mdH(34, i)]);
    });
    mdLeaves(LA, MD.leafLt, MD.leafDk);
    mdFlowers(FA, MD.magentaLt, MD.gold); mdFlowers(FB, MD.sapphireLt, MD.goldLt); mdFlowers(FC, MD.gold, MD.rubyDk);
    // the seat root and its moss cushion
    mdRoot([[270, 840], [560, 754], [850, 740], [1010, 776], [1060, 905]], 132, 64, bk, '#C08A78', MD.barkDk, 4);
    mdCross(600, 805, 110, 34, -.4, 10, .2, MD.barkDk, 6);
    mdMound(790, 694, 400, 36, MD.moss, MD.mossDk, 5);
    mdMeadow(320, 600, 712, 760, 12, 21, [MD.magentaLt, MD.gold, MD.sapphireLt], [9, 15]);
    spire(150, 1000, 400, 24, MD.violetLt, 3); spire(240, 1010, 300, -18, MD.magentaLt, 4);
    spire(1690, 1000, 380, -26, MD.sapphireLt, 5); spire(1785, 1010, 290, 12, MD.magentaLt, 6);
    spray(-10, 60, .55, 330, 41, MD.leafLt, MD.leaf, 28, .5);
    spray(1930, 40, 2.6, 330, 42, MD.leaf, MD.leafLt, 28, -.5);
    mdFireflies(16, 150, 140, 1780, 860, 8, MD.goldLt, 14);

    // Titania, seated with knees crossed
    const C = CAST.titania, s = 135, X = 860, Y = 640, R = at(X, Y, s);
    glow(...R(-.1, -3.2), 300, MD.goldLt, .55);
    mdShadow(...R(0, .34), 150, 16, 70);
    mdShadow(...R(1.72, 2.33), 120, 12, 85);
    // the wrap's long panel falls over the front of the root, behind the calves
    mdGownSkirt(C, R(-.78, .12), R(.95, .42), R(-1.06, 2.3), R(1.1, 2.27), { s, folds: 5, wave: 9, hip: 8, seed: 3, col: mixCol(C.gown, C.gownDk, .3), fw: 28 });
    const P = mdPose(X, Y, s, {
      head: [-.08, -3.35], turn: .28, tilt: -.04, neck: [-.04, -2.45],
      sL: [-.8, -2.2], sR: [.74, -2.26], eL: [-1.22, -1.05], wL: [-1.3, .12], eR: [.66, -1.3], wR: [1.15, -.68], waist: [0, -.92],
      hL: [-.36, 0], hR: [.3, .06], kL: [1.28, .1], aL: [1.34, 2.05], tL: [2.05, 2.2], kR: [1.5, -.32], aR: [1.92, 1.42], tR: [2.58, 1.84]
    });
    mdFigure(C, P, {
      expr: { look: [.1, 0], smile: .45, brow: .15, mouth: .06, lid: .12 },
      over: ['lR'],
      arms: { L: { hand: 'brace', ang: 2.45, side: 1, cd: -1, shade: 1 }, R: { hand: 'rest', ang: .3, side: -1, cd: 1 } },
      torso: { shadeL: true },
      // lower thigh's cloth, under the crossing leg
      skirt: () => {
        const B = pm(R, [[-.62, -.32], [-.68, .3], [.4, .5], [1.15, .45], [1.48, .32], [1.58, .1], [1.38, -.1], [.5, -.16]]);
        mdCloth(B, mixCol(C.gown, C.gownDk, .2), C.gownDk, C.gownLt, [pm(R, [[-.2, .1], [.6, .24], [1.3, .24]])], { fw: 22 });
      },
      // hips and the crossing thigh: tension folds run to the raised knee
      mid: Q => {
        const [wL, wR] = mdWaistLR(C, Q);
        const T = [wR, ...pm(R, [[.55, -.72], [1.0, -.62], [1.58, -.66], [1.84, -.36], [1.72, -.06], [1.4, .06], [.9, .15], [.2, .33], [-.64, .26], [-.76, -.36]]), wL];
        mdCloth(T, C.gown, C.gownDk, C.gownLt, [pm(R, [[.25, -.66], [.9, -.5], [1.52, -.44]]), pm(R, [[-.3, -.3], [.5, -.12], [1.32, -.18]]), pm(R, [[-.5, .08], [.25, .2], [.9, .1]])],
          { fw: 30, shadeP: pm(R, [[-.64, .26], [.2, .33], [.9, .15], [1.4, .06], [1.25, -.08], [.2, .08], [-.62, .02]]) });
        mdVine(pm(R, [[.42, -.8], [.95, -.3], [1.62, -.08]]), MD.gold, .35, 9, 2);
        mdVine(pm(R, [[-.6, .24], [.2, .3], [.9, .13], [1.4, .04]]), MD.goldLt, .3, 7, 4);
      }
    });
    mdMeadow(60, 1860, 985, 1065, 64, 11, [MD.magentaLt, MD.sapphireLt, MD.gold, MD.violetLt, MD.turq, MD.coral], [12, 26]);
    mdGrass(0, 1920, 1082, 56, MD.leafDk, 40, 13, .6);
  };
  LOOPS.P01.len = 1;

  // ======================= P02 — Forest stride =======================
  LOOPS.P02 = t => {
    randomSeed(424242); noiseSeed(424242);
    mdBands([MD.sapphireLt, '#78C8EA', MD.turqLt, '#BDEBC4', '#E4F2A8', MD.goldLt], -20, 880, 10, 2);
    glows([[1180, 330, 600, .6], [560, 200, 380, .45]], MD.goldLt, true);
    farTrees([[330, 40, -24], [640, 30, 18], [1300, 36, 20], [1480, 52, -30]], mixCol(MD.violetLt, MD.sky, .3), 170);
    farTrees([[470, 46, 30], [1600, 58, -20]], mixCol(MD.violet, MD.sapphireLt, .45), 200);
    clumps([[360, 30, 420, 170, 11], [1250, 0, 520, 150, 12], [1850, 160, 200, 260, 13]], MD.emerald, 160, true);
    clumps([[700, 90, 220, 80, 14], [1500, 120, 240, 90, 15]], MD.turq, 120, true);
    leafRim(360, 30, 420, 170, 30, 16, MD.leafLt); leafRim(1250, 0, 520, 150, 30, 17, MD.leaf);
    const bk = '#5A3A62', bk2 = '#4E3A58';
    mdRoot([[100, 1100], [160, 760], [120, 440], [190, 160], [260, -80]], 200, 110, bk, '#B08FC8', MD.barkDk, 5);
    mdRoot([[1830, 1100], [1770, 740], [1830, 420], [1760, 120], [1800, -80]], 180, 100, bk2, '#9C8BC4', MD.barkDk, 6);
    mdCross(130, 640, 40, 200, -1.4, 11, .2, MD.barkDk, 7);
    mdCross(1810, 600, 40, 200, -1.7, 11, .2, MD.barkDk, 8);
    const tp = mdTree(200, 300, -.35, 260, 44, 3, 21, bk, MD.barkDk).concat(mdTree(1770, 260, -2.75, 240, 40, 3, 23, bk2, MD.barkDk));
    mdFoliage(tp, 28, 24, MD.leaf, MD.leafLt);
    ground(850, 14, '#3E8E4A', 21);
    ground(872, 10, MD.moss, 22);
    mdFill(rectPts(-40, 880, W + 80, 220), MD.emerald, 70, .2, .7);
    const path = [[260, 1100], [620, 990], [900, 930], [1180, 880], [1480, 858], [1700, 872], [1520, 930], [1220, 990], [960, 1100]];
    mdWash(path, '#EAD9A0', 230, .5);
    mdFill(path, MD.goldLt, 90, .15, .6);
    mdMeadow(40, 600, 900, 1060, 34, 31, [MD.sapphireLt, MD.violetLt, MD.magentaLt, MD.gold], [10, 22]);
    mdMeadow(1320, 1880, 880, 1060, 34, 33, [MD.magentaLt, MD.turq, MD.gold, MD.sapphireLt], [10, 22]);
    spire(330, 960, 300, 20, MD.violetLt, 34); spire(1640, 940, 330, -20, MD.magentaLt, 35);
    // the root she steps over
    mdRoot([[960, 1040], [1070, 950], [1210, 916], [1380, 950], [1560, 1060]], 96, 70, '#6B3E4E', '#C08A78', MD.barkDk, 7);
    mdMound(1240, 878, 200, 14, MD.mossLt, MD.mossDk, 8);
    mdShadow(1130, 880, 70, 7, 55);
    // breeze from the right: drifting leaves, petals and air
    const BL = [], BP = [];
    for (let i = 0; i < 28; i++) {
      const x = lerp(150, 1800, mdH(41, i)), y = lerp(120, 820, mdH(42, i));
      if (Math.abs(x - 930) < 330 && y < 860) continue;
      (i % 3 ? BL : BP).push([x, y, 16 + 14 * mdH(43, i), Math.PI + (mdH(44, i) - .5) * 1.2]);
    }
    mdLeaves(BL, MD.leafLt, MD.leafDk); mdLeaves(BP, MD.magentaLt, MD.magentaDk);
    for (let i = 0; i < 7; i++) { const y = 180 + i * 100, x = 1320 + 260 * mdH(45, i); inkLine([[x + 240, y], [x + 110, y - 12], [x, y + 6], [x - 130, y - 4]], .35, MD.white, 'inkfine', .5); }

    // Helena, mid-stride
    const C = CAST.helena, s = 110, X = 900, Y = 520, R = at(X, Y, s), wind = [-1.6, .12];
    mdShadow(...R(-.1, 3.72), 120, 12, 80);
    glow(...R(.2, -3.0), 260, MD.goldLt, .4);
    // trailing turquoise outer skirt, lifted by the breeze
    mdCloth(pm(R, [[-.38, -.95], [-.95, -.15], [-1.75, .7], [-2.6, 1.3], [-3.1, 1.65], [-2.8, 2.05], [-3.0, 2.55], [-2.35, 2.82], [-1.85, 3.2], [-1.15, 3.28], [-.6, 2.4], [-.2, .9], [.15, -.9]]),
      C.over, C.overDk, C.overLt, [pm(R, [[-.5, -.4], [-1.5, .85], [-2.6, 1.65]]), pm(R, [[-.45, .3], [-1.35, 1.6], [-2.35, 2.6]]), pm(R, [[-.35, 1.2], [-.95, 2.3], [-1.45, 3.05]])], { fw: 34 });
    inkLine(pm(R, [[-1.15, 3.28], [-1.85, 3.2], [-2.35, 2.82], [-3.0, 2.55]]), 1, MD.gold, 'ink', .5);
    const P = mdPose(X, Y, s, {
      head: [.2, -3.3], turn: .45, tilt: .06, neck: [.12, -2.45],
      sL: [-.58, -2.18], sR: [.72, -2.3], eL: [-1.15, -1.25], wL: [-1.55, -.4], eR: [1.32, -1.55], wR: [1.98, -1.15], waist: [.05, -.92],
      hL: [-.32, 0], hR: [.34, -.05], kL: [-.38, 1.85], aL: [-.5, 3.5], tL: [.42, 3.66], kR: [1.3, 1.0], aR: [1.55, 2.55], tR: [2.38, 2.78]
    });
    mdFigure(C, P, {
      wind, over: ['lR'],
      expr: { look: [.8, .15], brow: .18, knit: .12, mouth: .14, smile: .15, lid: .12 },
      legs: { R: { start: .6 } },
      arms: { L: { hand: 'grip', ang: 2.0, side: 1, cd: 1, shade: -1 }, R: { hand: 'open', ang: -.2, side: -1, cd: 1 } },
      torso: { sashEnds: [-1.1, .8], sashSide: -1, shadeL: true },
      skirt: Q => {
        const [wL, wR] = mdWaistLR(C, Q);
        mdGownSkirt(C, wL, wR, R(-1.0, 3.3), R(.98, 2.45), { s, folds: 6, wave: 12, sway: -50, hip: 14, seed: 5, fw: 30 });
        const SP = [wL, mdV.mid(wL, wR, .42), ...pm(R, [[-.05, 1.0], [-.3, 2.3], [-.62, 3.34], [-1.25, 3.2], [-1.9, 2.7], [-1.45, 1.3], [-.72, -.1]])];
        mdCloth(SP, C.over, C.overDk, C.overLt, [pm(R, [[-.25, -.5], [-.65, 1.2], [-1.0, 3.0]]), pm(R, [[-.45, -.3], [-1.05, 1.1], [-1.62, 2.6]])], { fw: 28 });
        inkLine(pm(R, [[-.05, 1.0], [-.3, 2.3], [-.62, 3.34]]), 1.1, MD.gold, 'ink', .5);
      },
      // slit edge folding over the stepping thigh
      mid: Q => {
        const [, wR] = mdWaistLR(C, Q);
        mdCloth([wR, ...pm(R, [[.8, .05], [1.22, .42], [1.1, .84], [.62, .86], [.38, .2]])], C.gown, C.gownDk, C.gownLt, [pm(R, [[.45, -.4], [.72, .3], [.88, .75]])], { fw: 20 });
        inkLine(pm(R, [[1.22, .42], [1.1, .84], [.62, .86]]), 1, MD.gold, 'ink', .5);
      }
    });
    mdGrass(0, 700, 1082, 60, MD.leafDk, 22, 46, .6);
    mdGrass(1250, 1920, 1082, 60, MD.leafDk, 22, 47, .6);
  };
  LOOPS.P02.len = 1;

  // ======================= P03 — Lily-pool portrait =======================
  LOOPS.P03 = t => {
    randomSeed(424242); noiseSeed(424242);
    mdBands([MD.emeraldDk, '#127A5C', '#1E9A72', '#3DB89A', '#7ED8C0'], -20, 610, 8, 3);
    glows([[560, 260, 560, .75], [1560, 170, 380, .5]], MD.goldLt, true);
    clumps([[200, 80, 340, 200, 31], [900, -20, 420, 140, 32], [1700, 60, 360, 200, 33]], MD.leaf, 170, true);
    clumps([[420, 300, 240, 110, 34], [1500, 330, 260, 120, 35]], MD.turq, 120, true);
    leafRim(200, 80, 340, 200, 32, 36, MD.leafLt, 30); leafRim(1700, 60, 360, 200, 32, 37, MD.emeraldLt, 30); leafRim(900, -20, 420, 140, 24, 38, MD.leaf, 28);
    // far bank
    mdWash([...wavy(540, 10, 5), ...wavy(612, 6, 6).reverse()], '#1C6A4E', 255, .4);
    mdMeadow(30, 1890, 548, 600, 46, 39, [MD.magentaLt, MD.gold, MD.sapphireLt, MD.rose], [7, 13]);
    // the pool and its reflected light
    mdBands([MD.poolLt, '#5BB8D8', MD.pool, '#1F739E', MD.poolDk], 604, 1100, 8, 4);
    for (let i = 0; i < 12; i++) {
      const x = 80 + i * 160 + 40 * mdH(51, i), w = 30 + 40 * mdH(52, i), c = [MD.emerald, MD.magentaLt, MD.gold, MD.turqLt][i % 4];
      mdWash(mdTube([[x, 612], [x + 6, 700], [x - 4, 800]], [w, w * .6, w * .15]), c, 90, .5);
    }
    mdFill(mdBlob(500, 800, 420, 120, 53, 18, .15), MD.turqLt, 70, .2, .5);
    glows([[520, 760, 280, .55], [300, 940, 220, .45], [1560, 780, 240, .45], [860, 680, 200, .4]], MD.turqLt, true);
    mdRipples(470, 740, 240, 50, 5, MD.poolLt, .3, 4);
    mdRipples(1580, 780, 220, 44, 4, MD.poolLt, .3, 6);
    mdRipples(700, 960, 300, 60, 4, MD.poolLt, .3, 8);
    mdLilyPad(430, 712, 74, 22, MD.emerald, MD.emeraldDk, .3);
    mdLilyPad(720, 680, 50, 15, MD.emeraldLt, MD.emeraldDk, 1.2);
    mdLilyPad(1600, 700, 64, 19, MD.emerald, MD.emeraldDk, 2.2);
    mdLily(440, 700, 30, MD.magentaLt, MD.rose);
    mdLily(1590, 690, 26, MD.violetLt, '#EBD9FF');
    stars(18, 120, 640, 1800, 1060, 54, MD.cream, 6);
    spray(-10, 30, .5, 360, 61, MD.leafLt, MD.leaf, 30, .6);
    spray(1930, 20, 2.6, 360, 62, MD.leaf, MD.leafLt, 30, -.6);
    blossomVine([[1640, -10], [1660, 160], [1630, 320], [1650, 430]], MD.magentaLt, 63, 11);
    blossomVine([[300, -10], [285, 140], [310, 280]], MD.violetLt, 64, 10);

    // Hermia turns toward a voice off-frame left
    const C = CAST.hermia, s = 290, X = 1060, Y = 400;
    glow(1100, 380, 380, MD.turqLt, .55);
    const P = mdPose(X, Y, s, {
      head: [0, 0], turn: -.5, tilt: -.05, neck: [.06, .95],
      sL: [-.76, 1.16], sR: [.88, 1.2], eL: [-1.0, 2.4], wL: [-1.0, 3.4], eR: [.95, 2.35], wR: [.24, 1.52], waist: [.04, 2.65]
    });
    mdFigure(C, P, {
      noLegs: true,
      expr: { look: [-1, -.12], brow: .25, browL: .6, mouth: .3, smile: .08 },
      arms: { L: { hand: false, shade: -1 }, R: { hand: 'touch', ang: -2.25, side: 1, cd: 1, hs: s * .78 } }
    });
    mdLilyPad(230, 940, 170, 52, MD.emerald, MD.emeraldDk, .4);
    mdLilyPad(520, 1030, 140, 44, MD.emeraldLt, MD.emeraldDk, 1.9);
    mdLilyPad(1720, 960, 160, 52, MD.emerald, MD.emeraldDk, 3.0);
    mdLilyPad(1520, 1050, 120, 38, MD.emeraldLt, MD.emeraldDk, .9);
    mdLily(250, 915, 78, MD.magentaLt, MD.rose);
    mdLily(540, 1005, 58, MD.violetLt, '#EBD9FF');
    mdLily(1700, 935, 80, MD.magentaLt, MD.rose);
    mdLily(1530, 1030, 50, MD.gold, MD.goldLt, MD.magenta);
  };
  LOOPS.P03.len = 1;

  // ======================= P04 — Moonlit disagreement =======================
  LOOPS.P04 = t => {
    randomSeed(424242); noiseSeed(424242);
    mdBands([MD.night, '#262C82', '#3A2F8E', '#33479E', '#2C6A9A', '#1F5A6E'], -20, 900, 10, 7);
    glows([[960, 160, 700, .45]], MD.moonGlow, true);
    stars(40, 60, 40, 1860, 480, 71, MD.moon, 6);
    mdMoon(960, 150, 64);
    farTrees([[120, 70, 30], [330, 44, -20], [1600, 50, 26], [1820, 76, -30]], '#2B2C7C', 230);
    farTrees([[60, 90, 20], [1880, 90, -20]], '#22205E', 255);
    clumps([[150, 60, 330, 190, 72], [1780, 70, 330, 190, 73]], '#1E5A6A', 200, true);
    clumps([[420, 20, 260, 90, 74], [1500, 20, 260, 90, 75]], MD.violetDk, 200, true);
    leafRim(150, 60, 330, 190, 30, 76, '#2C8C88', 28, MD.night);
    leafRim(1780, 70, 330, 190, 30, 77, '#3D7FB0', 28, MD.night);
    ground(830, 16, '#243C7A', 78);
    ground(860, 12, '#1E5466', 79);
    mdFill(rectPts(-40, 860, W + 80, 240), MD.violet, 60, .2, .7);
    mdFill(mdBlob(960, 930, 700, 70, 80, 18, .1), MD.turq, 80, .2, .6);
    mdMeadow(40, 420, 900, 1060, 22, 81, [MD.turqLt, MD.violetLt, MD.magentaLt], [9, 18]);
    mdMeadow(1520, 1880, 900, 1060, 22, 82, [MD.magentaLt, MD.sapphireLt, MD.turqLt], [9, 18]);
    // the fallen branch between them, with moon-pale blossoms
    const bb = '#5A3A70';
    mdRoot([[720, 1050], [850, 985], [990, 925], [1110, 880], [1210, 858]], 80, 34, bb, '#9FB8FF', MD.night, 84);
    const tw = mdTree(990, 925, -1.9, 120, 14, 2, 85, bb, MD.night).concat(mdTree(1110, 880, -1.2, 100, 12, 2, 86, bb, MD.night));
    mdFoliage(tw, 18, 87, '#2E8C7E', '#5BC0B0', MD.night);
    glows(tw.map(([x, y]) => [x, y, 34, .7]), MD.turqLt, true);
    mdFlowers(tw.map(([x, y], i) => [x, y, 9, 5, i]), MD.turqLt, MD.goldLt, MD.night);
    mdFireflies(22, 80, 260, 1840, 880, 83, MD.goldLt, 16);

    // Helena, hurt and pleading, open hand toward Hermia
    {
      const C = CAST.helena, s = 108, X = 560, Y = 500, R = at(X, Y, s);
      glow(...R(.2, -2.0), 430, MD.turq, .6);
      mdShadow(...R(0, 3.68), 120, 12, 90, '#0E0C2A');
      mdCloth(pm(R, [[-.4, -.95], [-1.0, -.1], [-1.45, 1.3], [-1.8, 2.7], [-1.75, 3.45], [-1.0, 3.52], [-.3, 1.5], [.1, -.9]]), C.over, C.overDk, C.overLt,
        [pm(R, [[-.6, -.3], [-1.2, 1.4], [-1.5, 3.2]]), pm(R, [[-.4, .4], [-.9, 2.0], [-1.1, 3.4]])], { fw: 28 });
      const P = mdPose(X, Y, s, {
        head: [.12, -3.3], turn: .55, tilt: -.06, neck: [.08, -2.45],
        sL: [-.55, -2.2], sR: [.68, -2.28], eL: [-.8, -1.2], wL: [-.12, -1.55], eR: [1.25, -1.55], wR: [1.92, -1.5], waist: [0, -.92],
        hL: [-.32, 0], hR: [.32, 0], kL: [-.42, 1.8], aL: [-.58, 3.5], tL: [.32, 3.62], kR: [.42, 1.78], aR: [.6, 3.48], tR: [1.5, 3.6]
      });
      mdFigure(C, P, {
        expr: { look: [.9, -.05], brow: .5, knit: .55, mouth: .35, smile: -.35 },
        arms: { L: { hand: 'touch', ang: -.75, side: -1, cd: 1, shade: -1 }, R: { hand: 'open', ang: -.12, side: -1, cd: 1 } },
        torso: { shadeL: true },
        skirt: Q => {
          const [wL, wR] = mdWaistLR(C, Q);
          mdGownSkirt(C, wL, wR, R(-1.0, 3.42), R(1.08, 3.38), { s, folds: 6, wave: 10, hip: 12, seed: 7, fw: 26 });
          mdCloth([wL, mdV.mid(wL, wR, .4), ...pm(R, [[-.1, 1.2], [-.35, 2.5], [-.5, 3.44], [-1.05, 3.46], [-1.3, 2.2], [-.9, .6], [-.6, -.3]])], C.over, C.overDk, C.overLt,
            [pm(R, [[-.25, -.4], [-.55, 1.4], [-.8, 3.2]])], { fw: 24 });
          inkLine(pm(R, [[-.1, 1.2], [-.35, 2.5], [-.5, 3.44]]), 1, MD.gold, 'ink', .5);
        }
      });
    }
    // Hermia, shorter, leaning in with a hand on her hip
    {
      const C = CAST.hermia, s = 104, X = 1360, Y = 560, R = at(X, Y, s);
      glow(...R(-.1, -2.0), 420, MD.violetLt, .5);
      mdShadow(...R(-.2, 3.6), 120, 12, 90, '#0E0C2A');
      const P = mdPose(X, Y, s, {
        head: [-.22, -3.3], turn: -.6, tilt: .08, neck: [-.14, -2.45],
        sL: [-.68, -2.25], sR: [.6, -2.2], eL: [-1.3, -1.6], wL: [-1.92, -1.85], eR: [1.22, -1.35], wR: [.66, -.72], waist: [-.05, -.92],
        hL: [-.34, 0], hR: [.32, 0], kL: [-.58, 1.75], aL: [-.72, 3.45], tL: [-1.62, 3.58], kR: [.25, 1.8], aR: [.35, 3.5], tR: [-.5, 3.62]
      });
      mdFigure(C, P, {
        expr: { look: [-.9, 0], brow: -.3, knit: .85, mouth: .5, smile: -.45 },
        legs: { L: { sole: -1 }, R: { sole: -1 } },
        arms: { L: { hand: 'open', ang: Math.PI + .3, side: 1, cd: -1 }, R: { hand: 'grip', ang: 2.25, side: 1, cd: 1, shade: -1 } },
        torso: { sashEnds: [.45, 1.25], sashSide: 1 },
        skirt: Q => { const [wL, wR] = mdWaistLR(C, Q); mdGownSkirt(C, wL, wR, R(-1.12, 3.42), R(1.0, 3.45), { s, folds: 6, wave: 10, hip: 12, seed: 9, fw: 26, sway: 10 }); }
      });
    }
    mdGrass(0, 1920, 1082, 50, '#1A4A5A', 44, 88, .6);
  };
  LOOPS.P04.len = 1;

  // ======================= P05 — Canopy court =======================
  LOOPS.P05 = t => {
    randomSeed(424242); noiseSeed(424242);
    mdBands([MD.violetDk, '#3B2D8A', '#245E92', MD.turqDk, '#16876C', '#2FA060'], -20, 980, 10, 9);
    glows([[830, 560, 760, .85], [830, 380, 420, .75], [1480, 330, 320, .4]], MD.goldLt, true);
    glows([[830, 700, 900, .35]], MD.turqLt, true);
    farTrees([[470, 56, 30], [1180, 46, -20], [1360, 64, 30], [1660, 52, -30]], mixCol(MD.violetLt, MD.turq, .4), 150);
    clumps([[1180, 380, 260, 120, 101], [480, 420, 220, 110, 102]], mixCol(MD.emerald, MD.turqLt, .3), 110, true);
    mdShaft(830, -20, 830, 620, 200, MD.goldLt, .35, 7);
    // vast twisting canopy
    const bk = '#5A3460', bkL = '#C79AE0', bk2 = '#4A3A6E';
    clumps([[300, 30, 420, 160, 103], [1000, -40, 560, 120, 104], [1650, 20, 420, 160, 105]], MD.emeraldDk, 220, true);
    mdRoot([[60, 1110], [230, 770], [200, 470], [300, 220], [560, 60], [1000, -10], [1400, 20], [1990, -20]], 380, 70, bk, bkL, MD.barkDk, 91);
    mdRoot([[300, 230], [470, 210], [640, 150], [760, 120]], 90, 30, bk, bkL, MD.barkDk, 93);
    mdRoot([[1990, 1000], [1880, 760], [1900, 480], [1840, 220], [1880, -40]], 200, 90, bk2, bkL, MD.barkDk, 106);
    mdCross(180, 760, 70, 220, -1.3, 12, .22, MD.barkDk, 94);
    mdCross(1890, 700, 50, 200, -1.8, 12, .22, MD.barkDk, 95);
    const tp = mdTree(240, 600, -2.8, 160, 36, 2, 96, bk, MD.barkDk).concat(mdTree(1880, 420, -2.2, 160, 30, 2, 97, bk2, MD.barkDk));
    mdFoliage(tp, 30, 98, MD.leaf, MD.leafLt);
    leafRim(300, 30, 420, 160, 34, 98, MD.leafLt, 32); leafRim(1000, -40, 560, 120, 30, 99, MD.emeraldLt, 32); leafRim(1650, 20, 420, 160, 34, 100, MD.leafLt, 32);
    blossomVine([[400, 150], [420, 280], [395, 420], [410, 540]], MD.magentaLt, 111, 12);
    blossomVine([[560, 90], [575, 210], [550, 330]], MD.violetLt, 112, 11);
    blossomVine([[1150, 40], [1165, 170], [1145, 250]], MD.sapphireLt, 113, 11);
    blossomVine([[1760, 160], [1772, 320], [1750, 470], [1765, 590]], MD.magentaLt, 114, 12);
    // Puck's branch
    mdRoot([[1990, 470], [1780, 412], [1560, 424], [1380, 386], [1220, 320], [1090, 300]], 86, 26, bk, bkL, MD.barkDk, 107);
    mdLeaves([[1180, 312, 34, 2.2], [1250, 345, 30, 1.2], [1320, 370, 32, 2.0], [1700, 420, 34, 1.4], [1820, 440, 30, 2.1], [1110, 300, 28, -2.6]], MD.leafLt, MD.leafDk);
    mdFlowers([[1240, 336, 14, 5, 1], [1700, 404, 15, 5, 2], [1860, 430, 13, 6, 3]], MD.gold, MD.rubyDk);
    // layered roots, the mossy dais and jewel flowers
    ground(900, 14, MD.mossDk, 122);
    ground(930, 10, '#2F8A4A', 123);
    mdFill(rectPts(-40, 930, W + 80, 200), MD.emerald, 70, .2, .7);
    mdRoot([[-20, 880], [240, 860], [480, 905], [640, 990], [700, 1100]], 130, 60, bk2, bkL, MD.barkDk, 120);
    mdRoot([[1990, 860], [1760, 870], [1560, 940], [1440, 1100]], 130, 70, bk, bkL, MD.barkDk, 121);
    mdRoot([[280, 1100], [520, 975], [830, 962], [1130, 975], [1380, 1100]], 120, 80, bk, bkL, MD.barkDk, 124);
    mdMound(830, 945, 560, 26, MD.moss, MD.mossDk, 125);
    mdFlowers([[150, 830, 40, 6, .2], [420, 1000, 36, 5, 1], [1250, 1010, 40, 6, 2], [1640, 850, 44, 5, .5], [1820, 960, 34, 6, 1.4], [580, 880, 28, 5, 2.2]], MD.magentaLt, MD.gold);
    mdFlowers([[300, 950, 32, 5, .4], [1500, 1000, 34, 5, .9], [1090, 905, 24, 6, .1], [1720, 760, 30, 5, 2]], MD.sapphireLt, MD.goldLt);
    mdFlowers([[80, 1010, 34, 6, .7], [1380, 880, 28, 5, 1.1], [520, 820, 24, 5, 2.4]], MD.gold, MD.rubyDk);
    mdFlowers([[1880, 820, 30, 5, .3], [250, 760, 26, 6, 1.7], [1600, 1040, 30, 6, .6]], MD.violetLt, MD.goldLt);
    mdFlowers([[700, 1040, 28, 5, .2], [1180, 1050, 26, 5, 1.6]], MD.turq, MD.goldLt);
    mdFireflies(26, 120, 120, 1800, 880, 126, MD.goldLt, 16);

    // Titania holds court
    {
      const C = CAST.titania, s = 96, X = 820, Y = 575, R = at(X, Y, s);
      mdShadow(...R(.1, 3.66), 160, 14, 80);
      const P = mdPose(X, Y, s, {
        head: [.05, -3.32], turn: .25, tilt: -.05, neck: [.03, -2.45],
        sL: [-.74, -2.2], sR: [.72, -2.28], eL: [-1.02, -1.15], wL: [-.98, -.2], eR: [1.55, -2.9], wR: [1.85, -3.85], waist: [0, -.92],
        hL: [-.32, 0], hR: [.32, 0], kL: [-.28, 1.8], aL: [-.36, 3.5], tL: [.52, 3.62], kR: [.62, 1.72], aR: [.76, 3.42], tR: [1.6, 3.58]
      });
      mdFigure(C, P, {
        over: ['lR'], legs: { R: { start: .55 } },
        expr: { look: [.55, -.15], smile: .35, brow: .22, mouth: .12 },
        arms: { L: { hand: 'rest', ang: 1.75, side: 1, cd: -1, shade: -1 }, R: { hand: 'open', ang: -1.3, side: -1, cd: 1 } },
        torso: { shadeL: true },
        skirt: Q => { const [wL, wR] = mdWaistLR(C, Q); mdGownSkirt(C, wL, wR, R(-1.62, 3.62), R(1.12, 3.46), { s, folds: 7, wave: 10, hip: 14, seed: 11, fw: 26 }); },
        mid: Q => {
          const [, wR] = mdWaistLR(C, Q);
          mdCloth([wR, ...pm(R, [[.62, -.2], [.82, .55], [.8, 1.02], [.5, 1.12], [.18, 1.0], [.1, 0]])], C.gown, C.gownDk, C.gownLt, [pm(R, [[.3, -.6], [.45, .3], [.5, .95]])], { fw: 18 });
          mdVine(pm(R, [[.82, .55], [.8, 1.02], [.5, 1.12], [.18, 1.0]]), MD.gold, .3, 7, 6);
        }
      });
      const h = R(1.95, -4.3);
      mdSparks([[h[0] - 40, h[1] - 30, 10, .3], [h[0] + 30, h[1] - 50, 8, 1], [h[0] + 55, h[1] + 10, 7, .6], [h[0] - 60, h[1] + 20, 6, 1.2]], MD.goldLt);
    }
    // Puck watches from the branch
    {
      const C = CAST.puck, s = 64, X = 1540, Y = 372, R = at(X, Y, s);
      const P = mdPose(X, Y, s, {
        head: [-.55, -3.25], turn: -.55, tilt: .14, neck: [-.4, -2.45],
        sL: [-.98, -2.15], sR: [.36, -2.3], eL: [-1.45, -1.25], wL: [-2.1, -1.0], eR: [.85, -1.25], wR: [1.0, -.1], waist: [-.15, -.95],
        hL: [-.25, .05], hR: [.3, 0], kL: [-1.6, .25], aL: [-1.7, 1.95], tL: [-2.5, 2.1], kR: [-1.2, -1.05], aR: [-1.55, .05], tR: [-2.35, .12]
      });
      mdFigure(C, P, {
        expr: { look: [-.7, .55], smile: .55, brow: .15, browR: .6, mouth: .08 },
        legs: { L: { sole: -1 }, R: { sole: -1 } },
        arms: { L: { hand: 'rest', ang: 1.75, side: 1, cd: -1 }, R: { hand: 'brace', ang: 1.35, side: -1, cd: 1, shade: -1 } },
        skirt: () => paint(pm(R, [[-.62, -.6], [.5, -.65], [.62, .05], [.35, .36], [-.4, .38], [-.75, 0]]), { wash: C.trouser, ink: MD.ink, sw: .3, br: 'inkfine', curv: .4 })
      });
    }
    mdMeadow(40, 1880, 1010, 1070, 40, 127, [MD.magentaLt, MD.sapphireLt, MD.gold, MD.violetLt, MD.turq], [10, 20]);
  };
  LOOPS.P05.len = 1;
})();
