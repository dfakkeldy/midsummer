# Five-scene painting comparison

Twenty verified painted stills: the same five scenes from four actual requested models. Each lane is allocated one initial package and one actual visual correction; completed phases and selected passes are recorded per model. The complete call history includes interrupted invocations and recovery.

Phone galleries: [GPT-6.1 Sol](gallery-sol.md) · [GPT-6 Astra](gallery-astra.md) · [Claude Opus 5.5](gallery-opus.md) · [Claude Fable 5.1](gallery-fable.md).

[Download all twenty full-size paintings and five contact sheets](https://github.com/dfakkeldy/midsummer/releases/download/paintings-2026-10-05-complete/midsummer-paintings-complete.zip).

| Scene | Sol | Astra | Opus | Fable |
| --- | --- | --- | --- | --- |
| P01 | ![GPT-6.1 Sol P01](previews/sol/P01.png) | ![GPT-6 Astra P01](previews/astra/P01.png) | ![Claude Opus 5.5 P01](previews/opus/P01.png) | ![Claude Fable 5.1 P01](previews/fable/P01.png) |
| P02 | ![GPT-6.1 Sol P02](previews/sol/P02.png) | ![GPT-6 Astra P02](previews/astra/P02.png) | ![Claude Opus 5.5 P02](previews/opus/P02.png) | ![Claude Fable 5.1 P02](previews/fable/P02.png) |
| P03 | ![GPT-6.1 Sol P03](previews/sol/P03.png) | ![GPT-6 Astra P03](previews/astra/P03.png) | ![Claude Opus 5.5 P03](previews/opus/P03.png) | ![Claude Fable 5.1 P03](previews/fable/P03.png) |
| P04 | ![GPT-6.1 Sol P04](previews/sol/P04.png) | ![GPT-6 Astra P04](previews/astra/P04.png) | ![Claude Opus 5.5 P04](previews/opus/P04.png) | ![Claude Fable 5.1 P04](previews/fable/P04.png) |
| P05 | ![GPT-6.1 Sol P05](previews/sol/P05.png) | ![GPT-6 Astra P05](previews/astra/P05.png) | ![Claude Opus 5.5 P05](previews/opus/P05.png) | ![Claude Fable 5.1 P05](previews/fable/P05.png) |

[Brief](brief.md) · [Cast](cast.json) · [Settings](settings.json) · [Scores and evidence](results.json) · [Review](../../reviews/panel-comparison.md)

Each selected package preserves the exact authored file bytes. Same-session file transport assembly and component author-call hashes are recorded in the results. Initial and corrected packages remain in source/<lane>/<pass>; each manifest identifies its final actual author call. Corrected packages are selected when receipt, source, rendering, coverage and pixel QA pass. Selection uses one whole package per model, without scene-level cherry-picking or combining different model/pass packages.

The original 1200-second author cutoff remains in frozen settings for historical hash lineage. The recovery policy and every invocation are recorded in results.json. Recovery used no overall author cutoff and preserved the other settings. Timing and CLI list-price estimates have the stated fairness limits.

To reproduce, copy art/engine into a disposable project with its declared dependencies, copy a chosen package’s three src files and replace src/manifest.js with this comparison’s manifest.js. Set CHROME_PATH and run node render.mjs --loop=P01 --stills=0 --captions=0 --page=panel-studio.html --out=<fresh-output-directory>, repeating P02–P05 with an external 90-second render limit. Browser/GPU rounding may differ; exact master and preview hashes are recorded.
