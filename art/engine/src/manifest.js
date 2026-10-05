// manifest.js: the project's own scripts, in load order. Edit this list instead of studio.html.
// The library (src/lib) loads before the chapters (src/scenes); a chapter registers its shots with shots([...]).
const MANIFEST = [
  // 'src/lib/palette.js', 'src/lib/cast.js', 'src/lib/props.js', 'src/lib/sets.js',
  // 'src/scenes/ch1_intro.js', 'src/scenes/ch2_verse1.js',
];
for (const f of MANIFEST) document.write(`<script src="${f}"><\/script>`);
