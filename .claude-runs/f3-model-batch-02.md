# F3 Model Batch 02 Task Record

## Task Name

F3 Model Batch 02 - Ziggurat of Ur and Ishtar Gate GLB coverage

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

Descartes worker owns bounded implementation for two models only.

Codex main thread owns integration, browser QA, acceptance, logging, and commit.

## Goal

Add procedural GLB coverage for exactly:

- `ziggurat-ur`
- `ishtar-gate`

This is a batch acceptance target only, not F3 completion and not final project completion.

## Worker Write Scope

- `scripts/buildZigguratUrGlb.mjs`
- `scripts/buildIshtarGateGlb.mjs`
- `public/models/ziggurat-ur.glb`
- `public/models/ishtar-gate.glb`
- `src/map/createBuildingLayer.js` only for these two ids
- `src/components/MapScene.jsx` only for minimal selected-camera presets if needed

## Worker Forbidden Scope

- `src/data/*.json`
- `src/map/mapStyle.js`
- `src/styles.css`
- `package.json`
- deployment scripts
- `docs/*`
- `WORK_LOG.md`
- unrelated dirty F1 visual QA files

## Acceptance Criteria

- `ziggurat-ur` reads as a stepped mudbrick ziggurat with ramp/stair and shrine volume.
- `ishtar-gate` reads as a blue-glazed Babylonian gate with twin towers, central arch, battlements, and relief color accents.
- Both models have base at z >= 0, correct z-up orientation, sane scale, and no black-material failure.
- `npm run audit:glb` reports 17 OK, 0 WARN, 0 FAIL after integration.
- `npm run validate:data` passes.
- `npm run check` passes after Codex integration.
- Codex must perform browser QA with map-view screenshots before accepting.

## Expected QA Artifacts

- `docs/model-qa/F3_BATCH02_REPORT_2026-06-06.md`
- `docs/model-qa/f3-batch02-manifest.json`
- at least one selected map-view screenshot for each target

Do not claim F3 or the final complete version is done.

## Codex Acceptance Result

Accepted on 2026-06-06 as F3 Batch02 coverage only.

Changed files:

- `scripts/buildZigguratUrGlb.mjs`
- `scripts/buildIshtarGateGlb.mjs`
- `public/models/ziggurat-ur.glb`
- `public/models/ishtar-gate.glb`
- `src/map/createBuildingLayer.js`
- `src/components/MapScene.jsx`
- `scripts/auditF3ModelBatch02Playwright.mjs`
- `docs/model-qa/F3_BATCH02_REPORT_2026-06-06.md`
- `docs/model-qa/f3-batch02-manifest.json`
- `docs/model-qa/f3-batch02-ziggurat-ur-1800bce.png`
- `docs/model-qa/f3-batch02-ishtar-gate-575bce.png`
- `docs/model-qa/f3-batch02-ziggurat-ur-inapp.png`
- `docs/model-qa/f3-batch02-ishtar-gate-inapp.png`
- `docs/GLB_ASSET_BASELINE.md`
- `docs/CURRENT_PHASE.md`

Verification:

- `node scripts/buildZigguratUrGlb.mjs` passed: 11 mats, 341 parts, about 4092 tris, z 0.00..0.98, 324.6 KB.
- `node scripts/buildIshtarGateGlb.mjs` passed: 11 mats, 299 parts, about 3584 tris, z 0.00..0.99, 278.3 KB.
- `npm run audit:glb` passed: 17 OK, 0 WARN, 0 FAIL.
- `npm run validate:data` passed.
- `npm run check` passed.
- `npm run audit:f3-batch02` passed with `failures: []`.
- In-app browser QA passed: selected both landmarks, entered immersive mode, Chinese titles rendered correctly, and page logs were empty.

QA notes:

- Ziggurat of Ur is accepted as a B-grade readable stepped ziggurat miniature.
- Ishtar Gate is accepted as a B-grade readable blue gate miniature.
- This batch does not complete F3 and does not make the project final.
