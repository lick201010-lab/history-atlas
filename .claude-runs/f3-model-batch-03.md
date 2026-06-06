# F3 Model Batch 03 Task Record

## Task Name

F3 Model Batch 03 - Sanchi Stupa, Konark Sun Temple, and Djenne Mosque GLB coverage

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

Peirce worker owns bounded implementation for three models only.

Codex main thread owns integration, browser QA, acceptance, logging, and commit.

## Goal

Add procedural GLB coverage for exactly:

- `sanchi-stupa`
- `konark-sun`
- `djenne-mosque`

This is a batch acceptance target only, not F3 completion and not final project completion.

## Worker Write Scope

- `scripts/buildSanchiStupaGlb.mjs`
- `scripts/buildKonarkSunGlb.mjs`
- `scripts/buildDjenneMosqueGlb.mjs`
- `public/models/sanchi-stupa.glb`
- `public/models/konark-sun.glb`
- `public/models/djenne-mosque.glb`
- `src/map/createBuildingLayer.js` only for these three ids
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

- `sanchi-stupa` reads as a hemispherical stupa with railing, torana gateways, and central umbrella/chhatra.
- `konark-sun` reads as an Odisha temple / sun chariot miniature with temple mass, wheel motifs, and entry hall silhouette.
- `djenne-mosque` reads as an earthen Sahelian mosque with tower masses, toron spikes, buttresses, and warm mud color.
- All models have base at z >= 0, correct z-up orientation, sane scale, and no black-material failure.
- `npm run audit:glb` reports 20 OK, 0 WARN, 0 FAIL after integration.
- `npm run validate:data` passes.
- `npm run check` passes after Codex integration.
- Codex must perform browser QA with map-view screenshots before accepting.

## Expected QA Artifacts

- `docs/model-qa/F3_BATCH03_REPORT_2026-06-06.md`
- `docs/model-qa/f3-batch03-manifest.json`
- at least one selected map-view screenshot for each target

Do not claim F3 or the final complete version is done.

## Codex Acceptance Result

Accepted on 2026-06-06 as F3 Batch03 coverage only.

Changed files:

- `scripts/buildSanchiStupaGlb.mjs`
- `scripts/buildKonarkSunGlb.mjs`
- `scripts/buildDjenneMosqueGlb.mjs`
- `public/models/sanchi-stupa.glb`
- `public/models/konark-sun.glb`
- `public/models/djenne-mosque.glb`
- `src/map/createBuildingLayer.js`
- `src/components/MapScene.jsx`
- `scripts/auditF3ModelBatch03Playwright.mjs`
- `docs/model-qa/F3_BATCH03_REPORT_2026-06-06.md`
- `docs/model-qa/f3-batch03-manifest.json`
- `docs/model-qa/f3-batch03-sanchi-stupa-200bce.png`
- `docs/model-qa/f3-batch03-konark-sun-1300.png`
- `docs/model-qa/f3-batch03-djenne-mosque-1500.png`
- `docs/model-qa/f3-batch03-sanchi-stupa-inapp.png`
- `docs/model-qa/f3-batch03-konark-sun-inapp.png`
- `docs/model-qa/f3-batch03-djenne-mosque-inapp.png`
- `docs/GLB_ASSET_BASELINE.md`
- `docs/CURRENT_PHASE.md`

Verification:

- `node scripts/buildSanchiStupaGlb.mjs` passed: about 5918 tris, z -0.00..1.13, 304.8 KB.
- `node scripts/buildKonarkSunGlb.mjs` passed: about 6444 tris, z -0.00..1.13, 410.2 KB.
- `node scripts/buildDjenneMosqueGlb.mjs` passed: about 2766 tris, z -0.00..1.06, 179.4 KB.
- `npm run audit:glb` passed: 20 OK, 0 WARN, 0 FAIL.
- `npm run validate:data` passed.
- `npm run check` passed.
- `npm run audit:f3-batch03` passed with `failures: []`.
- In-app browser QA passed: selected all three landmarks, entered immersive mode, Chinese titles rendered correctly, and page logs were empty.

QA notes:

- All three are accepted as B-grade readable coverage miniatures.
- `konark-sun` appears close to the coast in the current map/data view, but the model itself is correctly oriented and not floating or sunk.
- This batch does not complete F3 and does not make the project final.
