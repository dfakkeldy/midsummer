// captions.js: the sung lyrics as hand-lettered subtitles in the bottom band (about y 975-1070).
//
// Scenes never draw these: the compositor paints them after the frame and under the paper grain, so they sit in the
// paper like the rest of the painting. Words darken as they're sung (timings from analysis/analyze.py via timing.js).
// An echo in parentheses, e.g. "(Put it in writing!)" (a gang vocal), is lettered in the echo colour, without brackets.
// Colours and font: PROJECT.captionStyle = { main, echo, echoSung, halo, font, weight, size } in config.js (defaults below). The font
// loads from Google Fonts in studio.html, so renders need network access (or vendor the font into assets/).
// Off with studio.html?captions=0, or render.mjs --captions=0 (the clean cut). NOTES (below) show in both cuts.
const CAPTIONS_ON = PROJECT.captions !== false && new URLSearchParams(location.search).get('captions') !== '0';
// The anime look letters them like TV-anime subtitles: rounded bold sans, white with a dark outline, the echo in yellow.
const CAP = { y: 1022, size: 50, maxW: 1760, font: '"Patrick Hand", "Comic Sans MS", cursive', weight: '', lead: .25, tail: 1.0, fade: .15,
  main: PAL.ink, echo: PAL.clay, echoSung: PAL.clayDk, halo: PAL.cream,
  ...(LOOK === 'anime' ? { size: 46, font: '"M PLUS Rounded 1c", "Zen Kaku Gothic New", sans-serif', weight: 800, main: '#FFFFFF', echo: '#FFE27A', echoSung: '#FFC21A', halo: '#1C1626' } : {}),
  ...(PROJECT.captionStyle || {}) };
const capFont = size => `${CAP.weight ? CAP.weight + ' ' : ''}${size}px ${CAP.font}`;

// The line showing at time t, with its show window.
function captionAt(t) {
  for (let i = 0; i < LYRICS.length; i++) {
    const L = LYRICS[i]; if (L.start < 0 || CAP_SKIP.has(i)) continue;
    const next = LYRICS.slice(i + 1).find(n => n.start >= 0);
    const a = L.start - CAP.lead, b = Math.min(next ? next.start - CAP.lead - .05 : Infinity, L.end + CAP.tail);
    if (t >= a && t < b) return { L, a, b };
  }
  return null;
}

// Split a line's display words into main and echo runs: [[word, time, isEcho], ...]
function captionWords(L) {
  let echo = false;
  return L.display.map(([w, s]) => {
    if (w.startsWith('(')) echo = true;
    const out = [w.replace(/[()]/g, ''), s, echo];
    if (w.endsWith(')')) echo = false;
    return out;
  });
}

// Notes lettered in the same band, usually before the singing starts (a disclaimer, a credit). They show in BOTH cuts,
// because they aren't subtitles. Set them in config.js:
//   PROJECT.notes = [{ a: .6, b: 7.2, size: 34, lines: ['First line.', 'Second line.'] }]
const NOTES = PROJECT.notes || [];
// Sung lines that should NOT be captioned (for example a line the picture letters itself): indexes into LYRICS.
const CAP_SKIP = new Set(PROJECT.captionSkip || []);
function drawNotes(c, t) {
  for (const N of NOTES) {
    if (t < N.a || t >= N.b) continue;
    const alpha = .85 * Math.min(seg(t, N.a, N.a + .5), 1 - seg(t, N.b - .6, N.b));
    c.save(); c.textBaseline = 'middle'; c.textAlign = 'center'; c.lineJoin = 'round'; c.font = capFont(N.size);
    N.lines.forEach((line, i) => {
      const y = CAP.y - (N.lines.length - 1) * N.size * .55 + i * N.size * 1.1;
      c.globalAlpha = alpha; c.lineWidth = N.size * .18; c.strokeStyle = CAP.halo; c.strokeText(line, W / 2, y);
      c.fillStyle = CAP.main; c.fillText(line, W / 2, y);
    });
    c.restore();
  }
}

function drawCaptions(c, t) {
  if (window.LOOP) return;   // model sheets and test loops stay clean: no notes, no lyrics
  drawNotes(c, t);
  if (!CAPTIONS_ON || typeof LYRICS === 'undefined') return;
  const cap = captionAt(t); if (!cap) return;
  const { L, a, b } = cap, alpha = Math.min(seg(t, a, a + CAP.fade), 1 - seg(t, b - CAP.fade, b));
  const words = captionWords(L);
  c.save(); c.textBaseline = 'middle'; c.lineJoin = 'round';
  let size = CAP.size; c.font = capFont(size);
  const space = () => c.measureText(' ').width * 1.25;
  let total = words.reduce((s, [w]) => s + c.measureText(w).width, 0) + space() * (words.length - 1);
  if (total > CAP.maxW) { size *= CAP.maxW / total; c.font = capFont(size); total = words.reduce((s, [w]) => s + c.measureText(w).width, 0) + space() * (words.length - 1); }
  let x = (W - total) / 2;
  for (const [w, s, echo] of words) {
    const ww = c.measureText(w).width, sung = t >= s, age = t - s;
    const pop = sung ? 1 + .1 * Math.exp(-age * 12) : 1;                 // a small bounce as each word lands
    const col = echo ? (sung ? CAP.echoSung : CAP.echo) : CAP.main;
    c.save(); c.translate(x + ww / 2, CAP.y + (hash(w.length + s) - .5) * 3); c.rotate((hash(s * 7) - .5) * .03); c.scale(pop, pop);
    c.globalAlpha = alpha * (sung ? 1 : .55);
    c.lineWidth = size * .2; c.strokeStyle = CAP.halo; c.strokeText(w, -ww / 2, 0);   // paper halo keeps it readable on any ground
    c.fillStyle = col; c.fillText(w, -ww / 2, 0);
    c.restore();
    x += ww + space();
  }
  c.restore();
}
