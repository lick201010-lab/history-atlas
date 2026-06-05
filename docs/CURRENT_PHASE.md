# Current Phase: F2 Boundary Refinement

Updated: 2026-06-04

Status: F2 in progress. F1 visual foundation has passed the Codex Gate and the project may now begin controlled boundary refinement. This is still not the final complete version.

## Project Rule

The current deployed site at `https://atlas.ckl.hk/` and package version `v0.1.0` are online milestones only. No agent may call the project final until F1-F6 Gates all pass.

## F1 Gate Result

F1 was accepted on 2026-06-04 after pass 3.

Evidence:

- `npm run check` passed.
- `VISUAL_FOUNDATION_URL=http://127.0.0.1:4174/ npm run audit:visual-foundation` passed.
- `RELEASE_SMOKE_URL=http://127.0.0.1:4174/ npm run smoke:release` passed.
- Reviewed foundation screenshots:
  - `docs/visual-qa/foundation-himalaya-relief.png`
  - `docs/visual-qa/foundation-open-ocean-flatness.png`
  - `docs/visual-qa/foundation-mediterranean-boundary-readability.png`
  - `docs/visual-qa/foundation-central-america-readability.png`
- Ocean is visually flat, deep, and clean.
- Dark-theme land relief is calmer and no longer reads as strong white-noise texture.
- Civilization boundaries are calmer and less fluorescent.
- Desktop and mobile smoke paths still work.

Residual F1 risks to remember:

- Himalaya relief is intentionally subdued in the default world view; mountain mode still carries stronger 3D terrain.
- Open-ocean high-pitch views can still show far-horizon darkness from the map/sky perspective, but not underwater mountain relief.
- F6 must still handle bundle size and resource strategy.

## F2 Goal

Upgrade all 43 civilization boundaries from placeholder or rough sample polygons to rough-refined historical-geographic outlines.

F2 is about boundary data quality, not a new visual redesign.

## F2 Batch Rule

- One batch contains 5 civilizations.
- Do not merge broad all-at-once boundary rewrites.
- Each civilization must have at least 3 phase features: rise, peak, decline or equivalent historically meaningful phases.
- Coastal civilizations must be coast-aware.
- Large inland empires must avoid simple convex blobs and should follow historical anchors and natural geography.
- Every feature must include `sourceNote` and `accuracyNote`.
- Each accepted batch must be committed separately.

## Accepted F2 Batch 01

Batch 01 was accepted on 2026-06-04.

1. Byzantine Empire
2. Ottoman Empire
3. Mongol Empire
4. Aztec Empire
5. Inca Empire

Evidence:

- `npm run validate:data` passed.
- `npm run check` passed.
- `node .claude-runs/capture-f2-boundary-batch-01.mjs` passed.
- QA report: `docs/boundary-qa/F2_BATCH01_REPORT_2026-06-04.md`
- Screenshots:
  - `docs/boundary-qa/f2-batch01-byzantine-600.png`
  - `docs/boundary-qa/f2-batch01-ottoman-1600.png`
  - `docs/boundary-qa/f2-batch01-mongol-empire-1250.png`
  - `docs/boundary-qa/f2-batch01-aztec-1500.png`
  - `docs/boundary-qa/f2-batch01-inca-1500.png`

## Accepted F2 Batch 02

Batch 02 was accepted on 2026-06-05.

1. Greek City-States / `greek-city-states`
2. Assyrian Empire / `assyrian`
3. Babylonian Empire / `babylon`
4. Carolingian Empire / `carolingian`
5. Holy Roman Empire / `holy-roman-empire`

Evidence:

- `npm run validate:data` passed.
- `npm run check` passed.
- `scripts/auditF2BoundaryBatch02Playwright.mjs` passed with `failures: []`.
- QA report: `docs/boundary-qa/F2_BATCH02_REPORT_2026-06-05.md`
- Screenshots:
  - `docs/boundary-qa/f2-batch02-greek-city-states-450.png`
  - `docs/boundary-qa/f2-batch02-assyrian-670.png`
  - `docs/boundary-qa/f2-batch02-babylon-560.png`
  - `docs/boundary-qa/f2-batch02-carolingian-820.png`
  - `docs/boundary-qa/f2-batch02-holy-roman-empire-1200.png`

Notes:

- `egypt-old-kingdom` is not counted as an accepted Batch 02 id because the public timeline currently starts at BCE 2000 and Old Kingdom Egypt ends before that display range.
- Carolingian and Holy Roman Empire were rejected once for triangular wedge artifacts, then accepted after being rewritten as cleaner multi-part rough-refined geometries.

## Accepted F2 Batch 03

Batch 03 was accepted on 2026-06-05.

1. Xia / `xia`
2. Shang / `shang`
3. Zhou / `zhou`
4. Qin / `qin`
5. Sui / `sui`

Evidence:

- `npm run validate:data` passed.
- `npm run check` passed.
- `scripts/auditF2BoundaryBatch03Playwright.mjs` passed with `failures: []`.
- QA report: `docs/boundary-qa/F2_BATCH03_REPORT_2026-06-05.md`
- Screenshots:
  - `docs/boundary-qa/f2-batch03-xia-1850.png`
  - `docs/boundary-qa/f2-batch03-shang-1250.png`
  - `docs/boundary-qa/f2-batch03-zhou-350.png`
  - `docs/boundary-qa/f2-batch03-qin-214.png`
  - `docs/boundary-qa/f2-batch03-sui-600.png`

Notes:

- The first worker pass was rejected because the shapes read as smooth ovals or placeholder blobs.
- The accepted pass has more irregular Yellow River / Central Plains directionality and larger Qin/Sui contours with rough regional structure.

## Accepted F2 Batch 04

Batch 04 was accepted on 2026-06-05.

1. Jin / `jin`
2. Song / `song`
3. Yuan / `yuan`
4. Qing / `qing`
5. PRC / `prc`

Evidence:

- `npm run validate:data` passed.
- `npm run check` passed.
- `scripts/auditF2BoundaryBatch04Playwright.mjs` passed with `failures: []`.
- QA report: `docs/boundary-qa/F2_BATCH04_REPORT_2026-06-05.md`
- Screenshots:
  - `docs/boundary-qa/f2-batch04-jin-280.png`
  - `docs/boundary-qa/f2-batch04-song-1160.png`
  - `docs/boundary-qa/f2-batch04-yuan-1300.png`
  - `docs/boundary-qa/f2-batch04-qing-1765.png`
  - `docs/boundary-qa/f2-batch04-prc-2020.png`

Notes:

- The first Batch 04 review was `ACCEPT_WITH_FIXES` because PRC QA text said `mainland` while the illustrative range included Taiwan. The accepted pass now describes PRC as an illustrative contemporary China / contested-range outline.
- Yuan, Qing, and PRC remain rough-refined large-extent historical visualization, not academic GIS borders.

## Current F2 Batch 05

Batch 05 should target:

1. Han / `han`
2. Ming / `ming`
3. New Kingdom Egypt / `egypt-new-kingdom`
4. Achaemenid Empire / `achaemenid`
5. Sasanian Empire / `sasanian`

## Allowed F4 Pilot Sidecar

F4 is not the primary current phase yet, but a controlled source-system pilot may run in parallel after Batch 04.

Pilot targets:

1. Tang / `tang`
2. Roman Republic / Empire / `roman-republic-empire`
3. Islamic Caliphates / `islamic-caliphates`
4. Mughal Empire / `mughal`
5. Maya Civilization / `maya`

Pilot rule:

- The F4 pilot may add dynasty-level `sourceNote`, `references`, and event-level source fields for the five allowlisted targets only.
- The F4 pilot must not rewrite boundary geometry, landmark data, map style, GLB models, dependencies, or deployment scripts.

## F2 Allowed Write Scope

Claude or a worker may edit:

- `src/data/boundaries-simplified.json`
- Data validator fixtures only if the current schema blocks required F2 fields.
- A `.claude-runs/*.md` task/output record.

Codex may additionally edit:

- `WORK_LOG.md`
- `docs/CURRENT_PHASE.md`
- relevant QA docs and screenshots
- Obsidian project notes

## F2 Forbidden Write Scope

Do not edit during F2 boundary batches unless Codex explicitly changes this file:

- `src/data/dynasties.json`
- `src/data/landmarks.json`
- `src/map/mapStyle.js`
- `src/components/MapScene.jsx`
- `public/models/*`
- GLB build scripts
- deployment scripts
- package dependencies

## F2 Gate Checks

Every batch must pass:

- `npm run validate:data`
- `npm run check`
- browser screenshot review at zoom 4-5 for the batch region
- no random internal line spaghetti
- no obvious rectangle placeholders
- no careless cross-sea fills unless historically intentional and visually acceptable
- no severe coastline mismatch where rough-refined coast-aware data is required

F2 full phase is not complete until:

- 43 civilizations all have at least 3 phase boundary features.
- Total boundary features are at least 129.
- `npm run validate:data` passes.
- `npm run check` passes.
- priority screenshots are reviewed for Tang, Rome, Islamic Caliphates, Byzantine, Ottoman, Mongol, Maya, Aztec, Mughal, and Inca.

## Codex Responsibilities

- Define batch task files.
- Invoke Claude or worker agents with bounded write scopes.
- Review diffs and reject weak geometry.
- Run automated checks and browser screenshot QA.
- Commit and push accepted batches.
- Keep `WORK_LOG.md`, `docs/CURRENT_PHASE.md`, and Obsidian notes updated.

## Claude Responsibilities

Claude may only work from a `.claude-runs/*.md` task file.

Claude is responsible for controlled implementation only. Claude does not decide whether a batch is accepted.
