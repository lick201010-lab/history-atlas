# F2 Boundary Batch 01 Report · 2026-06-04

## Scope

Batch 01 civilizations:

1. Byzantine Empire / `byzantine`
2. Ottoman Empire / `ottoman`
3. Mongol Empire / `mongol-empire`
4. Aztec Empire / `aztec`
5. Inca Empire / `inca`

## Implementation Summary

Claude produced the first bounded patch under `.claude-runs/f2-boundary-batch-01-prompt.md`.

Codex accepted the existing 3-phase structures for:

- `byzantine`
- `ottoman`
- `mongol-empire`

Codex rejected and corrected parts of the first patch:

- Claude extended Inca decline to 1572 while `src/data/dynasties.json` currently ends Inca at 1533. F2 forbids editing `dynasties.json`, so this was rejected.
- Claude's Inca peak still read as a wide block rather than a narrow Andean empire. Codex replaced it with a slimmer Andean corridor.
- Codex strengthened `scripts/validateHistoricalData.mjs` so F2 Batch 01 ids are now checked for exactly 3 contiguous phases.

## Final Phase Counts

| id | feature count | phases | notes |
| --- | ---: | --- | --- |
| `byzantine` | 3 | rise / peak / decline | unchanged, coastline-aware rough |
| `ottoman` | 3 | rise / peak / decline | unchanged, coastline-aware rough |
| `mongol-empire` | 3 | rise / peak / decline | unchanged, no random internal line issue in QA view |
| `aztec` | 3 | rise / peak / decline | new phased structure |
| `inca` | 3 | rise / peak / decline | peak narrowed to Andean corridor; decline ends at 1533 |

## Validation

Commands:

```bash
npm run validate:data
npm run check
node .claude-runs/capture-f2-boundary-batch-01.mjs
```

Results:

- `npm run validate:data`: passed
- `npm run check`: passed
- F2 screenshot script: passed
- page exceptions: `0`
- console errors: `0`
- non-canceled failures: `0`

## Screenshots

- `docs/boundary-qa/f2-batch01-byzantine-600.png`
- `docs/boundary-qa/f2-batch01-ottoman-1600.png`
- `docs/boundary-qa/f2-batch01-mongol-empire-1250.png`
- `docs/boundary-qa/f2-batch01-aztec-1500.png`
- `docs/boundary-qa/f2-batch01-inca-1500.png`
- `docs/boundary-qa/f2-batch01-manifest.json`

## Visual Decision

Accepted for F2 Batch 01.

Rationale:

- Aztec no longer has a single unphased placeholder.
- Inca now reads more like a long Andean corridor instead of a broad South America block.
- Byzantine and Ottoman remain coastline-aware and readable around the eastern Mediterranean.
- Mongol remains a large simplified land empire but does not show the prior random internal-line failure in the QA screenshot.

Residual risk:

- Mongol and Ottoman are acceptable for this batch but should still receive closer regional QA during full F2 final sweep.
- Aztec tributary pockets are schematic and not scholarly precise.
