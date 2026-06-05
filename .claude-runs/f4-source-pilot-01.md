# F4 Source Pilot 01

## Task Name

F4 source pilot 01: five-civilization references and source UI.

## Project Context

This project is History Atlas. `https://atlas.ckl.hk/` is only an online milestone, not the final complete product.

Before editing, read:

- `AGENTS.md`
- `docs/FINAL_VERSION_SPEC.md`
- `docs/ROADMAP.md`
- `docs/CURRENT_PHASE.md`
- latest relevant section of `WORK_LOG.md`
- `git status --short --branch`

Current truth:

- F2 is still in progress.
- F4 may run only as a controlled pilot for five allowlisted civilizations.
- Do not claim the project or F4 is final.

## Goal

Add a credible source/reference pilot for exactly these five civilizations:

- `tang`
- `roman-republic-empire`
- `islamic-caliphates`
- `mughal`
- `maya`

The pilot must add data, validation, and UI display for civilization-level and event-level source information.

## Allowed Write Scope

You may edit:

- `src/data/dynasties.json`
- `scripts/validateHistoricalData.mjs`
- `src/utils/buildCard.js`
- `src/components/MapScene.jsx`
- `src/styles.css`
- `.claude-runs/f4-source-pilot-01-output.md`

## Forbidden Write Scope

Do not edit:

- `src/data/boundaries-simplified.json`
- `src/data/landmarks.json`
- `src/map/mapStyle.js`
- `public/models/*`
- GLB/model scripts
- deployment scripts
- package dependencies
- README / WORK_LOG / docs/CURRENT_PHASE.md

## Required Behavior

Data:

- For each pilot civilization, add a dynasty-level `sourceNote`.
- For each pilot civilization, add a non-empty `references` array.
- Each reference must have:
  - `id`
  - `title`
  - at least one of `author`, `year`, `url`, or `note`
- For every event in the pilot civilizations, add at least one of:
  - `sourceNote`
  - `referenceIds`
- `referenceIds` must point to IDs that exist in that civilization's `references`.

Validation:

- Update `scripts/validateHistoricalData.mjs` so it enforces the new source rules only for the five pilot ids.
- Do not require all 43 civilizations to have references yet.
- Keep existing F2 boundary validation behavior intact.

UI:

- The civilization info card should show civilization-level source information separately from boundary source/accuracy.
- Boundary source/accuracy display must continue working.
- Keep the UI compact; do not redesign the whole panel.
- Chinese UI labels preferred, for example `文明来源`, `参考资料`, `边界精度`.

Quality:

- Source wording must be honest: this is a curated reference/source note pilot, not academic peer-reviewed GIS precision.
- Do not invent fake URLs. If unsure, use author/year/note without URL.
- Use stable, well-known references where possible, such as Cambridge histories, Oxford histories, Encyclopaedia Britannica, UNESCO pages, or standard historical atlases.

## Verification Commands

Run:

```powershell
npm run validate:data
npm run check
```

If the UI was changed, also start or reuse a local app and perform a quick browser/manual check for at least one pilot civilization card. A screenshot is optional but useful.

## Output Requirements

Write `.claude-runs/f4-source-pilot-01-output.md` with:

- files changed
- exact commands run
- pass/fail result
- short note on how the UI displays civilization sources vs boundary sources
- known risks or follow-ups

Do not commit.
Do not claim F4 is complete.
