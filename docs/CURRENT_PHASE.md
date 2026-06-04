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

## Current F2 Batch

Batch 01 should target:

1. Byzantine Empire
2. Ottoman Empire
3. Mongol Empire
4. Aztec Empire
5. Inca Empire

Reason:

- These are priority civilizations named in the final plan.
- They cover the main failure modes: Mediterranean coastlines, Anatolia/Balkans overlap, huge inland steppe empire, Mesoamerican coast-aware polygons, and Andean terrain-following polygons.
- The first five refined samples already exist for Tang, Rome, Islamic Caliphates, Mughal, and Maya, so Batch 01 should expand coverage instead of reworking the same examples again.

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

