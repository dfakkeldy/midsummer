# Panels

The current goal is a twenty-panel model comparison, not a full manga. Future selected story panels can map to exact EPUB text and verified Echo word alignment without changing the audiobook.

[alignment-schema.json](alignment-schema.json) defines the future handoff. Start/end seconds remain null and `verified` remains false until matching final edition hashes and real alignment IDs are supplied. The validator additionally checks finite times and increasing order. The five comparison scenes are artistic stagings; they have no invented narration timings or canonical chapter placements.
