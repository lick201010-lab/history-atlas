# F2 Boundary Compiler Pilot

## Goal

Implement a boundary compiler pilot for `han`, `ming`, `egypt-new-kingdom`, `achaemenid`, and `sasanian`.

## Allowed Write Scope

- `.claude-runs/f2-boundary-compiler-pilot.md`
- `src/data/boundary-anchors.json`
- `src/data/boundaries-simplified.json`
- `scripts/boundaryCompiler/*.mjs`
- `scripts/auditBoundaryQuality.mjs`
- `scripts/validateHistoricalData.mjs`
- `package.json`

## Forbidden Write Scope

- `src/data/dynasties.json`
- `src/data/landmarks.json`
- `src/map/mapStyle.js`
- `src/components/MapScene.jsx`
- `public/models/*`
- deployment scripts
- `README.md`
- `WORK_LOG.md`
- `docs/CURRENT_PHASE.md`
- `docs/boundary-qa/*` screenshots/reports
- package dependencies

## Verification

- `npm run compile:boundaries -- --ids han,ming,egypt-new-kingdom,achaemenid,sasanian`
- `npm run validate:data`
- `npm run audit:boundary-quality`
- `npm run check`

## 2026-06-06 Worker Gauss visual repair

- Changed `multi-region` compilation to union all selected region envelopes before land tracing, removing overlapping per-region slabs while preserving local `atlas-land-110m` clipping evidence.
- Tightened Batch05 presets/anchors: Han and Ming now use unioned China-core regions instead of giant regional hulls; New Kingdom Egypt uses a narrower Nile/Nubia/Sinai/Levant corridor; Achaemenid and Sasanian retain coherent unioned land-clipped extents.
- Updated boundary-quality audit to require `regionUnion` evidence for high-risk multi-region empires and reject overfilled slab-like shapes instead of requiring artificial split parts.
- Ran `npm run compile:boundaries -- --ids han,ming,egypt-new-kingdom,achaemenid,sasanian`, `npm run validate:data`, and `npm run audit:boundary-quality`; all passed after the repair.

## 2026-06-06 Codex acceptance

- Codex rejected the first browser QA pass because West Asia output still looked like overlapping translucent region slabs.
- After the visual repair, Codex reran `npm run validate:data`, `npm run audit:boundary-quality`, `npm run check`, and `scripts/auditF2BoundaryBatch05Playwright.mjs`.
- Browser QA generated six Batch05 screenshots and passed with `failures: []`.
- Codex accepted Batch05 as F2 batch progress only. This is not final-version completion.
