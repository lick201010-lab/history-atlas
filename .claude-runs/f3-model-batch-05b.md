# F3 Model Batch 05B Task Record

## Task Name

F3 Model Batch 05B - Temple of Heaven and Cheomseongdae GLB drafts

## Project Context

History Atlas is not final yet. F1 and F2 have passed phase Gates. F3 is active and incomplete.

Before editing, agents must read:

- `AGENTS.md`
- `docs/FINAL_VERSION_SPEC.md`
- `docs/ROADMAP.md`
- `docs/CURRENT_PHASE.md`
- latest relevant `WORK_LOG.md`
- `git status --short --branch`

## Owner

Worker owns bounded implementation for GLB draft scripts and model files only.

Codex main thread owns integration into `createBuildingLayer.js`, camera presets, browser QA, acceptance, logging, and commit.

## Goal

Add procedural GLB draft coverage for exactly:

- `temple-of-heaven`
- `cheomseongdae`

This is a draft implementation target only. Do not claim F3 completion.

## Worker Write Scope

- `scripts/buildTempleOfHeavenGlb.mjs`
- `scripts/buildCheomseongdaeGlb.mjs`
- `public/models/temple-of-heaven.glb`
- `public/models/cheomseongdae.glb`

## Worker Forbidden Scope

- `src/data/*.json`
- `src/map/createBuildingLayer.js`
- `src/components/MapScene.jsx`
- `src/map/mapStyle.js`
- `src/styles.css`
- `package.json`
- `docs/*`
- `WORK_LOG.md`
- unrelated dirty F1 visual QA files

## Model Expectations

- `temple-of-heaven` should read as a circular triple-tier Chinese ritual hall on a round marble terrace: blue-tiled round roofs, red columns, white base, axial steps. Avoid a generic pagoda silhouette.
- `cheomseongdae` should read as a small Silla observatory tower: tapered stone cylinder/stack, square window/opening cue, square base, modest height. Avoid a lighthouse/minaret look.
- Both models must be z-up, base at z >= 0, zero texture, vertex/simple material only, browser-budget friendly.

## Verification Commands

Run and report:

- `node scripts/buildTempleOfHeavenGlb.mjs`
- `node scripts/buildCheomseongdaeGlb.mjs`
- `npm run audit:glb`
- `npm run validate:data`

Do not edit integration files. Codex will wire these GLBs after reviewing the generated assets.

## Worker Output

Status: DONE.

Changed files:

- `scripts/buildTempleOfHeavenGlb.mjs`
- `scripts/buildCheomseongdaeGlb.mjs`
- `public/models/temple-of-heaven.glb`
- `public/models/cheomseongdae.glb`

Reported model stats:

- `temple-of-heaven`: 12 materials, 364 parts, about 10,066 triangles, z 0.00..1.35, 533.6 KB.
- `cheomseongdae`: 8 materials, 401 parts, about 4,896 triangles, z -0.00..1.00, 379.0 KB.

## Codex Acceptance Result

Accepted as F3 Batch05 B-grade readable GLB coverage on 2026-06-06.

Codex actions:

- Integrated both GLBs into `src/map/createBuildingLayer.js`.
- Added focus camera presets in `src/components/MapScene.jsx`.
- Ran mechanical GLB/data/build checks and Batch05 map-view QA.
- Performed in-app browser QA for both models.

Result:

- `temple-of-heaven` is the strongest visual model in Batch05 and clearly reads as a circular triple-tier ritual hall.
- `cheomseongdae` reads as a small tapered observatory tower and is accepted visually, but its current landmark location appears close to the coastline in map view. Treat that as a later data/placement refinement note.
- Both models are accepted as coverage-quality B-grade miniatures. This does not complete F3.
