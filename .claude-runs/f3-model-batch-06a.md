# F3 Model Batch 06A Task Record

## Task Name

F3 Model Batch 06A - Meroe Pyramids and Great Zimbabwe GLB drafts

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

- `meroe-pyramids`
- `great-zimbabwe`

This is a draft implementation target only. Do not claim F3 completion.

## Worker Write Scope

- `scripts/buildMeroePyramidsGlb.mjs`
- `scripts/buildGreatZimbabweGlb.mjs`
- `public/models/meroe-pyramids.glb`
- `public/models/great-zimbabwe.glb`

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

- `meroe-pyramids` should read as a Nubian royal cemetery: clustered small steep pyramids, chapel/entry blocks, sandy desert plinth, warm sandstone palette. It must not look like a single Egyptian pyramid copy.
- `great-zimbabwe` should read as a dry-stone hill/valley enclosure: elliptical stone walls, conical tower cue, interior ruins, muted granite/earth palette. It must not look like a European castle.
- Both models must be z-up, base at z >= -0.01, zero texture, vertex/simple material only, browser-budget friendly.
- Prefer recognizable silhouettes over excessive triangle count.

## Verification Commands

Run and report:

- `node scripts/buildMeroePyramidsGlb.mjs`
- `node scripts/buildGreatZimbabweGlb.mjs`
- `npm run audit:glb`
- `npm run validate:data`

`npm run audit:glb` may fail only because new GLBs are not yet mapped in `createBuildingLayer.js`; report that clearly if it happens. Do not edit integration files. Codex will wire these GLBs after reviewing the generated assets.

## Worker Output

Status: DONE.

Changed files:

- `scripts/buildMeroePyramidsGlb.mjs`
- `scripts/buildGreatZimbabweGlb.mjs`
- `public/models/meroe-pyramids.glb`
- `public/models/great-zimbabwe.glb`

Reported model stats:

- `meroe-pyramids`: 11 materials, 205 parts, about 2,672 triangles, z -0.00..0.59, 189.1 KB.
- `great-zimbabwe`: 12 materials, 427 parts, about 6,172 triangles, z -0.00..0.46, 437.8 KB.

Worker verification:

- `node scripts/buildMeroePyramidsGlb.mjs` passed.
- `node scripts/buildGreatZimbabweGlb.mjs` passed.
- `npm run validate:data` passed.
- `npm run audit:glb` failed only for expected integration-scope reasons: unmapped new GLBs missing z-up orientation overrides before Codex integration.

## Codex Acceptance Result

Accepted as F3 Batch06 B-grade readable GLB coverage on 2026-06-06.

Codex actions:

- Integrated both GLBs into `src/map/createBuildingLayer.js`.
- Added focus camera presets in `src/components/MapScene.jsx`.
- Ran mechanical GLB/data/build checks and Batch06 map-view QA.
- Performed in-app browser QA for both models.

Result:

- `meroe-pyramids` reads as a clustered Nubian pyramid cemetery rather than a single Egyptian pyramid copy.
- `great-zimbabwe` reads as a dry-stone enclosure with a conical tower cue rather than a European castle.
- Both models are accepted as coverage-quality B-grade miniatures. This does not complete F3.
