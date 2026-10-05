# Painted-panel review

Twenty of twenty requested paintings were rendered from verified model source and inspected at native and phone sizes. All four actual model lanes are present.

| Model | Mean six-category score | Eligible scenes | Selected pass | Recorded outer calls |
| --- | ---: | ---: | --- | ---: |
| GPT-6.1 Sol | 3.40/5 | 3/5 | correction | 4 |
| GPT-6 Astra | 3.67/5 | 5/5 | correction | 4 |
| Claude Opus 5.5 | 3.33/5 | 3/5 | correction | 9 |
| Claude Fable 5.1 | 2.90/5 | 1/5 | correction | 8 |

Scores are the fixed six-category rubric’s equal-weight mean, from a fresh AI reviewer. The twenty neutral native images and their twenty phone derivatives were inspected individually; anonymous five-scene bundles tested continuity. The report hash was frozen before identities were revealed. Human artistic acceptance remains pending.

Recorded 25 outer author invocations and 8 completed creative packages. All 20 requested results are available. Strict scene/framing eligibility is 12/20: seven flags concern the visual 5% prop/foot margin, and one concerns unclear crossed knees and seat bracing. Margin judgments were visual, without numerical object segmentation. The selected paintings retain visible weaknesses, which remain in individual scores and comments. The machine-readable completion flag requires every scene to be eligible; it remains false while results coverage is 20/20.

## Method and limits

- The scene brief, adult cast, high effort label, 1920×1080 dimensions, t=0, seed424242, three-file schema, 256KiB decoded source ceiling and pinned painting engine stayed fixed.
- The first eight outer invocations used a coordinator-chosen 1200-second cutoff. Recovery removed that cutoff for every unfinished lane. Sol/Astra resumed saved corrections; Claude initial calls lacked persisted sessions and were restarted with the same model and brief.
- Two ten-second GPT recovery invocations were stopped by a coordinator guard false positive on unrelated INFO metadata. No provider model error occurred. The guard was repaired and the same saved corrections resumed; all attempts remain recorded.
- Each model has at most one completed initial package and one completed visual-feedback correction. Historical Claude correction calls had no completed initial source to assess; each recovered initial receives its first actual visual correction under the same six headings. No extra artistic variant, cross-model source reuse or coordinator drawing edit.
- Outer CLI invocations and completed creative packages are counted separately. Provider automatic output-limit continuations are recorded where exposed; the schema retry cap does not disable those continuations. Hidden provider response counts and computation are not fully exposed.
- Claude source transport was divided into files in the same persistent session after provider output-token limits. Previously completed files and frozen source prefixes stayed fixed across those calls. Each actual Claude visual correction used one frozen feedback packet and the same file-by-file transport, with no rendering, feedback, file replacement or extra creative variant between files. Automatic provider output-limit continuations inside a file call are disclosed separately. The final package joins exact completed authored file bytes; all component call and source hashes are recorded.
- Recovery durations and accumulated retry time differ. Equal effort labels do not imply equal internal computation or provider token limits, and these measurements are not a clean speed/cost benchmark.
- Usage fields are authoritative per-invocation completed CLI-result usage where available. Thinking-progress estimates and partial assistant usage from interrupted calls are excluded from totals. Cached/resumed input is included as the CLI reports it. Resumed Claude modelUsage and dollar estimates accumulate over the persistent session and must not be summed across calls. Actual subscription charges are unexposed and null; dollar values use CLI list prices.
- Source and technical pixel QA were unblinded. A fresh reviewer inspected every neutral native image and 360px derivative plus anonymous continuity bundles; the report hash was frozen before model identities were revealed. AI artistic judgment is not human acceptance.
- No paid API fallback, provider substitution, purchased credits, external image generation, copyrighted pose-reference publication or drawing-source repair was used.

[Gallery and source](../comparisons/midsummer-five-panels/README.md) · [Machine-readable results](../comparisons/midsummer-five-panels/results.json)
