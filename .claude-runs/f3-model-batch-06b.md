# F3 Model Batch 06B Task Record

## Task Name

F3 Model Batch 06B - Westminster Abbey GLB draft

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

Worker owns bounded implementation for GLB draft script and model file only.

Codex main thread owns integration into `createBuildingLayer.js`, camera presets, browser QA, acceptance, logging, and commit.

## Goal

Add procedural GLB draft coverage for exactly:

- `westminster-abbey`

This is a draft implementation target only. Do not claim F3 completion.

## Worker Write Scope

- `scripts/buildWestminsterAbbeyGlb.mjs`
- `public/models/westminster-abbey.glb`

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

- `westminster-abbey` should read as a Gothic abbey miniature: long nave, transepts, twin west towers, pointed roof rhythm, buttress cues, warm grey stone palette.
- It must not look like Notre-Dame copied one-for-one. Keep the Westminster massing lower and more elongated, with twin square western towers and a long nave.
- The model must be z-up, base at z >= -0.01, zero texture, vertex/simple material only, browser-budget friendly.
- Prefer a strong Gothic silhouette and readable roof/tower structure over excessive fine ornament.

## Verification Commands

Run and report:

- `node scripts/buildWestminsterAbbeyGlb.mjs`
- `npm run audit:glb`
- `npm run validate:data`

`npm run audit:glb` may fail only because the new GLB is not yet mapped in `createBuildingLayer.js`; report that clearly if it happens. Do not edit integration files. Codex will wire this GLB after reviewing the generated asset.

## Worker Output

Status: DONE.

Changed files:

- `scripts/buildWestminsterAbbeyGlb.mjs`
- `public/models/westminster-abbey.glb`

Reported model stats:

- `westminster-abbey`: 9 materials, 332 parts, about 3,748 triangles, z -0.00..0.87, 284.2 KB.

Worker verification:

- `node scripts/buildWestminsterAbbeyGlb.mjs` passed.
- `npm run validate:data` passed.
- `npm run audit:glb` failed only for expected integration-scope reasons: unmapped new GLB missing z-up orientation override before Codex integration.

## Codex Acceptance Result

Accepted as F3 Batch06 B-grade readable GLB coverage on 2026-06-06.

Codex actions:

- Integrated the GLB into `src/map/createBuildingLayer.js`.
- Added focus camera preset in `src/components/MapScene.jsx`.
- Ran mechanical GLB/data/build checks and Batch06 map-view QA.
- Performed in-app browser QA for the model.

Result:

- `westminster-abbey` reads as a long Gothic abbey with twin western towers, nave/transept massing, buttress cues, and pointed roof rhythm.
- The model is accepted as coverage-quality B-grade miniature. This does not complete F3.
