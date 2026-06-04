# F1 Visual Foundation Report

Date: 2026-06-04

Status: accepted for F1, with performance chunk warnings deferred to F6.

## Scope

F1 reviewed and integrated the current visual-foundation changes without touching `src/data/*.json` or model assets.

Implemented or integrated:

- Dark framed map presentation with star-card border treatment.
- Boundary readability changes: casing layer, round joins, clearer dark-theme paint.
- Runtime boundary smoothing via `src/map/smoothBoundaries.js`.
- Mobile HUD consolidation into a bottom sheet and non-overlapping top controls.
- Short-lived map tile warning so transient network messages do not permanently block the canvas.
- `npm run audit:visual-foundation` as a repeatable F1 gate check.

## Evidence

Screenshots:

- `docs/visual-qa/f1-world-frame.png`
- `docs/visual-qa/f1-open-ocean.png`
- `docs/visual-qa/f1-mediterranean-boundaries.png`
- `docs/visual-qa/f1-mobile.png`

Manifest:

- `docs/visual-qa/f1-visual-manifest.json`

Checks:

- `npm.cmd run audit:visual-foundation`: passed.
- `npm.cmd run check`: passed.
- `npm.cmd run validate:data`: passed as part of `check`.
- `npm.cmd run build`: passed as part of `check`.

## Visual Findings

- Open ocean is visually flat, dark, and clean.
- Land relief is visible, especially in high-terrain regions, without dominating the entire canvas.
- Mediterranean boundaries are readable and less like debug overlays than the earlier state.
- Mobile top controls, search, filter, bottom info sheet, and timeline no longer overlap.
- Browser capture reported zero serious console errors.

## Deferred Risks

- The large JavaScript chunk warning remains and belongs to F6 performance work.
- Boundary smoothing improves line feel but does not solve historical coast accuracy. F2 still needs true coast-aware geometry refinement.
- Some model quality and placement issues remain outside F1 and belong to F3.
