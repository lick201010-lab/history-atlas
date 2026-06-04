# Current Phase: F2 Boundary Refinement

Updated: 2026-06-04

Status: F1 visual foundation has passed in this workspace. The active phase is now F2 boundary refinement. The deployed site is an online milestone only, not the final complete version.

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

## F1 Gate Result

F1 passed on 2026-06-04.

Evidence:

- `npm.cmd run check` passed.
- `npm.cmd run audit:visual-foundation` passed.
- Browser screenshots were generated in `docs/visual-qa/`.
- `docs/visual-qa/F1_VISUAL_FOUNDATION_REPORT.md` records the review.
- Open ocean is flat and clean.
- Land relief remains readable.
- Boundary styling is more legible and less like debug output.
- Mobile HUD controls and bottom sheet no longer overlap.
- No serious browser console errors were captured.

## Current Findings

- This workspace currently has 43 civilizations, 89 boundary features, and 30 landmarks.
- F2 must raise boundary data from rough/placeholder state toward coast-aware rough-refined geometry.
- Current boundary smoothing is a visual aid only. It is not a replacement for true historical geometry refinement.

## Phase Order

After F0 passes, continue:

1. F1 visual foundation
2. F2 full boundary refinement
3. F3 landmark model upgrade
4. F4 content and sources
5. F5 product interaction and mobile
6. F6 performance, release, and packaging

## F2 Gate

F2 is not accepted yet.

F2 requires:

- All 43 civilizations have at least 3 historical phases.
- Total boundary features are at least 129.
- Every boundary feature has `sourceNote` and `accuracyNote`.
- Key regions are visually reviewed at zoom 4-5.
- Coast-aware civilizations do not use crude cross-sea convex hulls.
- `npm.cmd run validate:data`, `npm.cmd run check`, and browser boundary screenshots pass.

## Allowed Write Scope For Current F2 Work

Codex may inspect, validate, and integrate boundary changes.

Claude may be assigned bounded batches for:

- `src/data/boundaries-simplified.json`
- boundary generation scripts
- validation fixtures if needed

Forbidden during F2 unless explicitly re-scoped:

- `src/data/dynasties.json`
- `src/data/landmarks.json`
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
