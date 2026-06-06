# F3 Model Batch 04 Task Record

## Task Name

F3 Model Batch 04 - Mecca Haram, Teotihuacan, and Machu Picchu GLB coverage

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

Bacon worker owns bounded implementation for three models only.

Codex main thread owns integration, browser QA, acceptance, logging, and commit.

## Goal

Add procedural GLB coverage for exactly:

- `mecca-haram`
- `teotihuacan`
- `machu-picchu`

This is a batch acceptance target only, not F3 completion and not final project completion.

## Worker Write Scope

- `scripts/buildMeccaHaramGlb.mjs`
- `scripts/buildTeotihuacanGlb.mjs`
- `scripts/buildMachuPicchuGlb.mjs`
- `public/models/mecca-haram.glb`
- `public/models/teotihuacan.glb`
- `public/models/machu-picchu.glb`
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

- `mecca-haram` reads as a respectful schematic sanctuary courtyard with central Kaaba-like cube, colonnades, minarets, and warm stone palette.
- `teotihuacan` reads as a Mesoamerican stepped pyramid / avenue complex.
- `machu-picchu` reads as an Andean stone citadel with terraces and small masonry buildings.
- All models have base at z >= 0, correct z-up orientation, sane scale, and no black-material failure.
- `npm run audit:glb` reports 23 OK, 0 WARN, 0 FAIL after integration.
- `npm run validate:data` passes.
- `npm run check` passes after Codex integration.
- Codex must perform browser QA with map-view screenshots before accepting.

## Expected QA Artifacts

- `docs/model-qa/F3_BATCH04_REPORT_2026-06-06.md`
- `docs/model-qa/f3-batch04-manifest.json`
- at least one selected map-view screenshot for each target

Do not claim F3 or the final complete version is done.

## Worker Output

Bacon reported mechanical implementation complete:

- `mecca-haram`: about 12980 triangles, 504.5 KB, z -0.00..1.27.
- `teotihuacan`: about 2268 triangles, 169.4 KB, z -0.00..0.73.
- `machu-picchu`: initially about 872 triangles, 78.2 KB, z -0.00..0.75.
- Worker ran `audit:glb`, `validate:data`, and `check`, but did not perform map-view browser QA.

## Codex Acceptance Result

Accepted on 2026-06-06 as F3 Batch04 GLB coverage only. F3 remains incomplete.

Codex review found and fixed additional issues before acceptance:

- `machu-picchu` initially read like sharp-roof / pyramid-like geometry in map screenshots.
- Preview QA was initially stale because `127.0.0.1:4188` serves built `dist`; Codex rebuilt before judging screenshots.
- Batch04 GLB URLs now include a cache-bust query parameter, and `auditGlbAssets.mjs` strips query strings when inspecting local files.
- GLB-backed landmarks no longer receive extra procedural grove/hamlet decoration, preventing overlap with accepted GLB models.
- `machu-picchu` was repaired into a lower roofless Andean terrace ruin, z 0.00..0.37.

Fresh verification:

- `node scripts/buildMeccaHaramGlb.mjs` passed.
- `node scripts/buildTeotihuacanGlb.mjs` passed.
- `node scripts/buildMachuPicchuGlb.mjs` passed.
- `npm run audit:glb -- --write` passed: 23 OK, 0 WARN, 0 FAIL.
- `npm run validate:data` passed.
- `npm run build` passed with existing Vite chunk-size warnings.
- `npm run audit:f3-batch04` passed with `failures: []`.
- In-app browser QA passed for all three models: selected landmark, immersive mode active, Chinese title correct, and app logs empty.

Accepted screenshots:

- `docs/model-qa/f3-batch04-mecca-haram-800.png`
- `docs/model-qa/f3-batch04-teotihuacan-450.png`
- `docs/model-qa/f3-batch04-machu-picchu-1500.png`
- `docs/model-qa/f3-batch04-mecca-haram-inapp.png`
- `docs/model-qa/f3-batch04-teotihuacan-inapp.png`
- `docs/model-qa/f3-batch04-machu-picchu-inapp.png`
