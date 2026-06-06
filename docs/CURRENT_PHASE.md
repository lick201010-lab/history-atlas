# Current Phase: F3 Landmark Model Quality

Updated: 2026-06-06

Status: F3 is active. F1 and F2 have passed their phase Gates. The whole project is still not the final complete version because F3-F6 remain incomplete.

## Project Rule

The deployed site at `https://atlas.ckl.hk/` and package version `v0.1.0` are online milestones only. No agent may call the project final until F1-F6 Gates all pass.

## Completed Phase Gates

F1 visual foundation passed on 2026-06-04.

Evidence:

- `npm run check` passed.
- `VISUAL_FOUNDATION_URL=http://127.0.0.1:4174/ npm run audit:visual-foundation` passed.
- `RELEASE_SMOKE_URL=http://127.0.0.1:4174/ npm run smoke:release` passed.
- Foundation screenshots were reviewed for Himalaya relief, open-ocean flatness, Mediterranean readability, and Central America readability.

F2 boundary refinement passed on 2026-06-06.

Evidence:

- All 43 civilizations have at least three boundary phases: `rise`, `peak`, and `decline`.
- Total boundary feature count is 129.
- `npm run validate:data` passed.
- `npm run audit:boundary-quality` passed with no failures or warnings.
- `npm run check` passed.
- `npm run audit:f2-batch06` and `npm run audit:f2-batch07` passed.
- Manual screenshot review accepted the repaired West Africa and United States outputs.

## F3 Goal

Upgrade landmark models from MVP map pieces to final-version miniature architecture quality.

F3 completion requires:

- 30 / 30 landmarks have GLB or equivalent runtime 3D models.
- The core 10 landmarks are A-grade in map-view QA:
  - `hagia-sophia`
  - `forbidden-city`
  - `angkor-wat`
  - `pyramid`
  - `colosseum`
  - `parthenon`
  - `tajmahal`
  - `chichen-itza`
  - `great-wall`
  - `petra`
- All other landmarks are A/B-grade.
- No accepted model may be upside down, floating, sunk into terrain, black-material broken, roof-bugged, or unreadable in selected map view.
- Every accepted batch keeps at least one map-view QA screenshot.

## Current F3 Inventory

Current GLB coverage:

- Total landmarks: 30.
- GLB overrides: 27.
- Missing GLB coverage: 3.
- Core 10 GLB coverage: 10 / 10, but these are not automatically final A-grade. They still need final map-view inspection.

Missing GLB ids:

- `meroe-pyramids`
- `great-zimbabwe`
- `westminster-abbey`

## F3 Batch Rule

- Prefer 1-3 landmarks per implementation batch.
- Start with missing GLB coverage before broad core-10 polish.
- Each batch must include a reusable QA path or a map-view screenshot record.
- A batch cannot be accepted from `npm run audit:glb` alone. Mechanical GLB health is not the same as visual quality.
- Codex owns acceptance. Claude or workers may implement bounded model batches but do not decide final quality.

## Accepted F3 Batch 01

Target:

- `persepolis`

Reason:

- It is historically important.
- It is missing GLB coverage.
- It already has a procedural `modelProfile`, making it a low-risk first F3 pipeline target.

Result:

- Accepted as F3 Batch01 GLB coverage on 2026-06-06.
- `npm run audit:f3-batch01` passed with no failures.
- `npm run check` passed.
- Screenshot: `docs/model-qa/f3-batch01-persepolis-500bce-immersive.png`.
- Quality note: accepted as a readable B-grade miniature coverage model, not as full F3 completion and not as a core final A-grade benchmark.

Allowed write scope used:

- `scripts/buildPersepolisGlb.mjs`
- `public/models/persepolis.glb`
- `src/map/createBuildingLayer.js`
- `src/components/MapScene.jsx` only for a minimal focus-camera preset if needed.
- `scripts/auditF3ModelBatch01Playwright.mjs`
- `docs/model-qa/*`
- `docs/GLB_ASSET_BASELINE.md`
- `.claude-runs/f3-model-batch-01.md`
- `WORK_LOG.md`
- Obsidian project notes

Forbidden write scope during F3 Batch 01:

- `src/data/dynasties.json`
- `src/data/boundaries-simplified.json`
- `src/data/boundary-anchors.json`
- `src/data/landmarks.json`
- `src/map/mapStyle.js`
- deployment scripts
- package dependencies

## Accepted F3 Batch 02

Target:

- `ziggurat-ur`
- `ishtar-gate`

Result:

- Accepted as F3 Batch02 GLB coverage on 2026-06-06.
- `npm run audit:f3-batch02` passed with no failures.
- `npm run check` passed.
- Screenshots:
  - `docs/model-qa/f3-batch02-ziggurat-ur-1800bce.png`
  - `docs/model-qa/f3-batch02-ishtar-gate-575bce.png`
  - `docs/model-qa/f3-batch02-ziggurat-ur-inapp.png`
  - `docs/model-qa/f3-batch02-ishtar-gate-inapp.png`
- Quality note: both are accepted as readable B-grade coverage miniatures. They are not full F3 completion and not final A-grade benchmark models.

## Accepted F3 Batch 03

Target:

- `sanchi-stupa`
- `konark-sun`
- `djenne-mosque`

Result:

- Accepted as F3 Batch03 GLB coverage on 2026-06-06.
- `npm run audit:f3-batch03` passed with no failures.
- `npm run check` passed.
- Screenshots:
  - `docs/model-qa/f3-batch03-sanchi-stupa-200bce.png`
  - `docs/model-qa/f3-batch03-konark-sun-1300.png`
  - `docs/model-qa/f3-batch03-djenne-mosque-1500.png`
  - `docs/model-qa/f3-batch03-sanchi-stupa-inapp.png`
  - `docs/model-qa/f3-batch03-konark-sun-inapp.png`
  - `docs/model-qa/f3-batch03-djenne-mosque-inapp.png`
- Quality note: all three are accepted as readable B-grade coverage miniatures. `konark-sun` is near the coastline in the current map data, but the model is not upside down, floating, or sunk.

## Accepted F3 Batch 04

Target:

- `mecca-haram`
- `teotihuacan`
- `machu-picchu`

Result:

- Accepted as F3 Batch04 GLB coverage on 2026-06-06.
- `npm run audit:f3-batch04` passed with no failures.
- `npm run audit:glb -- --write` passed with 23 OK, 0 WARN, 0 FAIL.
- In-app browser QA passed for all three models: selected landmark, immersive mode active, Chinese title correct, and app logs empty.
- Screenshots:
  - `docs/model-qa/f3-batch04-mecca-haram-800.png`
  - `docs/model-qa/f3-batch04-teotihuacan-450.png`
  - `docs/model-qa/f3-batch04-machu-picchu-1500.png`
  - `docs/model-qa/f3-batch04-mecca-haram-inapp.png`
  - `docs/model-qa/f3-batch04-teotihuacan-inapp.png`
  - `docs/model-qa/f3-batch04-machu-picchu-inapp.png`
- Quality note: all three are accepted as readable B-grade coverage miniatures. `machu-picchu` was repaired during Codex QA to remove a misleading sharp-roof / pyramid-like read and now uses a lower roofless terrace silhouette. This is not full F3 completion.

## Accepted F3 Batch 05

Target:

- `changan`
- `terracotta-army`
- `temple-of-heaven`
- `cheomseongdae`

Result:

- Accepted as F3 Batch05 GLB coverage on 2026-06-06.
- `npm run audit:f3-batch05` passed with no failures.
- `npm run audit:glb -- --write` passed with 27 OK, 0 WARN, 0 FAIL.
- In-app browser QA passed for all four models: selected landmark, immersive mode active, Chinese title correct, and app logs empty.
- Screenshots:
  - `docs/model-qa/f3-batch05-changan-700.png`
  - `docs/model-qa/f3-batch05-terracotta-army-200bce.png`
  - `docs/model-qa/f3-batch05-temple-of-heaven-1600.png`
  - `docs/model-qa/f3-batch05-cheomseongdae-700.png`
  - `docs/model-qa/f3-batch05-changan-inapp.png`
  - `docs/model-qa/f3-batch05-terracotta-army-inapp.png`
  - `docs/model-qa/f3-batch05-temple-of-heaven-inapp.png`
  - `docs/model-qa/f3-batch05-cheomseongdae-inapp.png`
- Quality note: all four are accepted as readable B-grade coverage miniatures. `temple-of-heaven` is the strongest visual model in this batch. `cheomseongdae` is visually acceptable, but its current landmark location appears close to the coastline in the map view; treat that as a future data/placement refinement note, not a GLB blocker. This is not full F3 completion.

## F3 Gate Checks

Every F3 batch must pass:

- `npm run audit:glb`
- `npm run validate:data`
- `npm run check`
- Batch-specific browser QA script or manual screenshot review

F3 full phase is not complete until:

- GLB coverage reaches 30 / 30.
- Core 10 are accepted as A-grade in map-view screenshots.
- Remaining 20 are accepted as A/B-grade.
- `npm run check` passes.
- GLB audit has 0 FAIL.
- Model QA screenshots/reports exist for all accepted model batches.

## Residual Risks Carried Forward

- Existing F1 visual QA files are dirty in the working tree and are unrelated to F3. Do not stage or revert them without an explicit request.
- Existing 14 GLBs passed the MVP visual bar. F3 must re-grade them against the final-version bar, especially roof detail, silhouette quality, facing direction, and selected-view readability.
- F4 source work may continue only as a sidecar and must not block F3 model quality.
