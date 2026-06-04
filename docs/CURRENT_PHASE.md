# Current Phase: F1 Visual Foundation Review

Updated: 2026-06-04

Status: F0 workflow lock has passed in this workspace. The active phase is now F1 visual foundation review. The deployed site is an online milestone only, not the final complete version.

## F0 Gate Result

F0 passed on 2026-06-04.

Evidence:

- `AGENTS.md` exists and states that `v0.1.0` is not final.
- `docs/FINAL_VERSION_SPEC.md` exists.
- `docs/CURRENT_PHASE.md` exists and names the active phase.
- `.claude-runs/TEMPLATE.md` exists.
- `WORK_LOG.md` records the workflow reset.
- `git status --short --branch` has been inspected before changes.
- `npm.cmd run check` passed.

## F1 Gate

F1 is not accepted yet in this workspace.

F1 requires:

- Ocean flatness review.
- Land relief readability review.
- Boundary readability review.
- HUD overlap review.
- Browser screenshots and console review.

## Current Findings

- This workspace currently has 43 civilizations, 89 boundary features, and 30 landmarks.
- There are existing uncommitted visual/map changes in `src/App.jsx`, `src/components/MapScene.jsx`, `src/map/mapStyle.js`, `src/styles.css`, plus untracked `src/map/smoothBoundaries.js`. Treat those as user/other-agent work until reviewed.

## Phase Order

After F0 passes, continue:

1. F1 visual foundation
2. F2 full boundary refinement
3. F3 landmark model upgrade
4. F4 content and sources
5. F5 product interaction and mobile
6. F6 performance, release, and packaging

## Allowed Write Scope For Current F1 Review

Codex may inspect and validate current visual/map changes. Do not modify `src/data/*.json` during F1 review.

If implementation is needed, Claude may be assigned a bounded task for:

- `src/map/mapStyle.js`
- `src/styles.css`
- small, scoped `src/components/MapScene.jsx` changes

Forbidden during F1 unless explicitly re-scoped:

- `src/data/*.json`
- `public/models/*`
- GLB build scripts
- deployment scripts

## Codex Responsibilities

- Lock the workflow.
- Review and integrate work from Claude.
- Run checks and browser QA.
- Commit only scoped accepted changes.

## Claude Responsibilities

Claude may only work from a `.claude-runs/*.md` task file. Claude output is not accepted until Codex reviews it.
