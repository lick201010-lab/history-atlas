# F3 Model Batch 01 Task Record

## Task Name

F3 Model Batch 01 - Persepolis GLB and map-view QA

## Project Context

History Atlas is not final yet. F1 and F2 have passed phase Gates. The active phase is F3 landmark model quality.

Before editing, agents must read:

- `AGENTS.md`
- `docs/FINAL_VERSION_SPEC.md`
- `docs/ROADMAP.md`
- `docs/CURRENT_PHASE.md`
- latest relevant `WORK_LOG.md`
- `git status --short --branch`

## Owner

Codex main thread owns integration, QA, and acceptance.

Hilbert explorer performed read-only inventory and recommended `persepolis` as the first F3 target.

## Goal

Add a runtime GLB for `persepolis` and create a repeatable F3 Batch01 browser QA path. This is a batch acceptance target only, not F3 completion and not final project completion.

## Allowed Write Scope

- `scripts/buildPersepolisGlb.mjs`
- `public/models/persepolis.glb`
- `src/map/createBuildingLayer.js`
- `src/components/MapScene.jsx`
- `scripts/auditF3ModelBatch01Playwright.mjs`
- `docs/model-qa/*`
- `docs/GLB_ASSET_BASELINE.md`
- `.claude-runs/f3-model-batch-01.md`
- `WORK_LOG.md`

## Forbidden Write Scope

- `src/data/dynasties.json`
- `src/data/boundaries-simplified.json`
- `src/data/boundary-anchors.json`
- `src/data/landmarks.json`
- `src/map/mapStyle.js`
- deployment scripts
- package dependencies
- unrelated dirty F1 visual QA files

## Required Behavior

- Use the existing procedural zero-texture GLB pipeline.
- Keep z-up source geometry with base at z >= 0.
- Keep footprint within the existing map miniature budget.
- Preserve fallback procedural rendering if GLB loading fails.
- Add `persepolis` to GLB override and z-up orientation override.
- Add a browser QA script that selects Persepolis in-map, enters inspection mode, captures a screenshot, and fails on page errors or GLB load failures.

## Verification Commands

```powershell
node scripts/buildPersepolisGlb.mjs
npm run audit:glb
npm run validate:data
npm run check
npm run preview -- --port 4188
node scripts/auditF3ModelBatch01Playwright.mjs
```

## Output Requirements

The acceptance review must record:

- changed files
- exact commands run
- pass/fail result
- screenshot path
- remaining visual issues

Do not claim F3 or the final complete version is done.

## Codex Acceptance Result

Accepted on 2026-06-06 as F3 Batch01 coverage only.

Changed files:

- `scripts/buildPersepolisGlb.mjs`
- `public/models/persepolis.glb`
- `src/map/createBuildingLayer.js`
- `src/components/MapScene.jsx`
- `src/components/LandmarkCard.jsx`
- `src/styles.css`
- `scripts/auditF3ModelBatch01Playwright.mjs`
- `docs/model-qa/F3_BATCH01_REPORT_2026-06-06.md`
- `docs/model-qa/f3-batch01-manifest.json`
- `docs/model-qa/f3-batch01-persepolis-500bce-immersive.png`
- `docs/model-qa/f3-batch01-persepolis-inapp.png`
- `docs/GLB_ASSET_BASELINE.md`
- `docs/CURRENT_PHASE.md`

Verification:

- `node scripts/buildPersepolisGlb.mjs` passed.
- `npm run audit:glb` passed: 15 OK, 0 WARN, 0 FAIL.
- `npm run validate:data` passed.
- `npm run audit:f3-batch01` passed with `failures: []`.
- `npm run check` passed.
- `http://127.0.0.1:4188/models/persepolis.glb` returned 200.
- In-app browser QA passed: selected Persepolis, entered immersive mode, title rendered as `波斯波利斯`, and page logs were empty.

QA notes:

- The first manual browser check found that the close button inherited absolute positioning and overlapped the immersive inspect button.
- Codex fixed the button event isolation and card-action CSS, then reran the F3 browser audit.
- Persepolis is accepted as a readable B-grade miniature coverage model. It is not the full F3 Gate and does not make the project final.
