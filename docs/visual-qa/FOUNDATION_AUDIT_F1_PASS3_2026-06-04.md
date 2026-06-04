# F1 Visual Foundation Pass 3 Audit · 2026-06-04

Goal:

- Diagnose the remaining Himalaya high-pitch relief noise before changing production style again.
- Keep oceans flat, deep, and clean.
- Preserve visible land relief without the white-noise hillshade look.

## Diagnostic Matrix

Temporary screenshots were written to the ignored directory:

```text
.claude-runs/f1-pass3-diagnostics/
```

Compared variants:

- baseline
- pitch 45
- bearing 0
- sky disabled
- lighter fog
- lower terrain exaggeration
- terrain disabled
- hillshade disabled
- three soft-hillshade candidates

Finding:

- Disabling terrain mesh did not remove the noisy relief.
- Disabling hillshade removed the noise but made the map too flat.
- Sky/fog changes alone did not solve the relief problem.
- Soft hillshade candidate B preserved readable mountains while removing most white-noise texture.

## Code Changes

File:

```text
src/map/mapStyle.js
```

Changes:

- `WORLD_TERRAIN_EXAGGERATION`: `0.18` -> `0.1`
- dark main hillshade exaggeration: `0.32 / 0.54 / 0.72` -> `0.2 / 0.32 / 0.46`
- dark secondary hillshade exaggeration: `0.14 / 0.22 / 0.32` -> `0.06 / 0.1 / 0.14`
- dark hillshade highlight, shadow, and accent opacities reduced

## Verification

Commands:

```bash
npm run check
VISUAL_FOUNDATION_URL=http://127.0.0.1:4174/ npm run audit:visual-foundation
RELEASE_SMOKE_URL=http://127.0.0.1:4174/ npm run smoke:release
```

Results:

- `npm run check`: passed
- `audit:visual-foundation`: passed
- `smoke:release`: passed
- bad responses: `0`
- page exceptions: `0`
- console errors: `0`

Note:

- The first visual audit run had one transient external MapLibre glyph connection close.
- A second run passed with `nonCanceledFailures: 0`.

## Reviewed Screenshots

- `docs/visual-qa/foundation-himalaya-relief.png`
- `docs/visual-qa/foundation-open-ocean-flatness.png`
- `docs/visual-qa/foundation-mediterranean-boundary-readability.png`
- `docs/visual-qa/foundation-central-america-readability.png`
- `docs/release-qa/release-desktop-1250-maya.png`
- `docs/release-qa/release-mobile-1250-maya.png`

## Codex Gate Decision

F1 is accepted and the project may enter F2.

Reason:

- Ocean is visually flat, deep, and clean.
- Himalaya relief remains visible but no longer reads as high-contrast white-noise texture.
- Civilization boundaries are calmer and readable.
- Desktop and mobile smoke paths still work.

Residual risks:

- Default world view terrain is intentionally subdued; mountain mode still carries stronger 3D terrain.
- High-pitch far horizons can still show map/sky darkness, but this is no longer the earlier underwater-mountain problem.
- Final polish still belongs to later F5/F6 product and performance stages.
