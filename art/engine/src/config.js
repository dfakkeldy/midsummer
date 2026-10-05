// config.js: project settings.
//   The PROJECT line is rewritten by analysis/analyze.py (duration, bpm, offset of the first downbeat, audio).
//   Put everything else in the Object.assign below it, which analyze.py leaves alone.
const PROJECT = { duration: 11, bpm: 120, offset: 0 };
Object.assign(PROJECT, {
  // Lines lettered in the caption band in both cuts, e.g. a disclaimer while the intro plays:
  //   notes: [{ a: .6, b: 7.2, size: 34, lines: ['The characters in this video are invented.', 'Any resemblance is coincidental.'] }],
  notes: [],
  // Sung lines (indexes into LYRICS) the captions skip, e.g. a line the picture letters itself.
  captionSkip: [],
  // Caption colours and font (defaults: PAL.ink, PAL.clay / PAL.clayDk for the echo, PAL.cream halo, Patrick Hand).
  //   captionStyle: { main: '#2B2233', echo: '#D97757', echoSung: '#A84D33', halo: '#FFF5E2' },
});
