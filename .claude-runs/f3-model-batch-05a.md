# F3 Model Batch 05A Task Record

## Task Name

F3 Model Batch 05A - Changan and Terracotta Army GLB drafts

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

- `changan`
- `terracotta-army`

This is a draft implementation target only. Do not claim F3 completion.

## Worker Write Scope

- `scripts/buildChanganGlb.mjs`
- `scripts/buildTerracottaArmyGlb.mjs`
- `public/models/changan.glb`
- `public/models/terracotta-army.glb`

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

- `changan` should read as a Tang capital palace/city miniature: rectilinear city wall, gate towers, central avenue, palace compound, warm timber/earth palette. It should not be a generic cube.
- `terracotta-army` should read as a Qin burial pit / ranks of soldiers: long pit base, rowed figure cues, command pavilion or mound, earthy clay palette. It should not look like a pyramid or generic tomb.
- Both models must be z-up, base at z >= 0, zero texture, vertex/simple material only, browser-budget friendly.

## Verification Commands

Run and report:

- `node scripts/buildChanganGlb.mjs`
- `node scripts/buildTerracottaArmyGlb.mjs`
- `npm run audit:glb`
- `npm run validate:data`

Do not edit integration files. Codex will wire these GLBs after reviewing the generated assets.

## Worker Output

Status: DONE.

Changed files:

- `scripts/buildChanganGlb.mjs`
- `scripts/buildTerracottaArmyGlb.mjs`
- `public/models/changan.glb`
- `public/models/terracotta-army.glb`

Reported model stats:

- `changan`: 14 materials, 518 parts, about 6,066 triangles, z -0.00..0.32, 466.4 KB.
- `terracotta-army`: 13 materials, 488 parts, about 12,802 triangles, z -0.00..0.23, 629.2 KB.

## Codex Acceptance Result

Accepted as F3 Batch05 B-grade readable GLB coverage on 2026-06-06.

Codex actions:

- Fixed a small script-comment encoding issue in `scripts/buildChanganGlb.mjs`.
- Integrated both GLBs into `src/map/createBuildingLayer.js`.
- Added focus camera presets in `src/components/MapScene.jsx`.
- Ran mechanical GLB/data/build checks and Batch05 map-view QA.
- Performed in-app browser QA for both models.

Result:

- `changan` reads as a Tang city/palace miniature with visible wall and compound cues.
- `terracotta-army` reads as a long burial pit with ordered soldier-row cues.
- Both models are accepted as coverage-quality B-grade miniatures. This does not complete F3.
