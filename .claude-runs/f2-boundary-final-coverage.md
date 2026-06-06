# F2 Boundary Final Coverage Task Record

Date: 2026-06-06

Status: accepted by Codex after repair, validation, browser QA, and manual screenshot review.

## Goal

Complete F2 boundary refinement coverage so all 43 civilizations have at least three rough-refined phase boundaries and the phase can pass its Gate without being confused with the whole final product.

## Main-Thread Rule

Codex main thread remained responsible for standard, integration, browser QA, final judgment, logs, and commit. Subagents produced bounded implementation or review output only.

## Subagents

### Hegel / read-only reviewer

Scope:

- Read AGENTS, CURRENT_PHASE, package scripts, validators, boundary audit, compiler presets, and final coverage anchors.
- Do not edit files.

Result:

- Confirmed structural coverage: 43 dynasty ids, 129 boundary features, and every id has rise/peak/decline.
- Flagged risks: Batch06/07 scripts were untracked, audit writes a manifest, older coast-aware features have uneven compiler evidence, and US/British/West Africa required browser review.

Disposition:

- Accepted as review input.
- Closed after main-thread verification.

### Singer / bounded repair worker

Scope:

- Allowed: `src/data/boundary-anchors.json`, `scripts/boundaryCompiler/regionPresets.mjs`, generated `src/data/boundaries-simplified.json`, audit manifest.
- Forbidden: dynasties, landmarks, map style, MapScene, models, deployment, dependencies.

Result:

- Repaired Ghana, Mali, Songhai, and United States after Codex rejected first visual pass.
- Recompiled affected boundaries.
- Reported `DONE_WITH_CONCERNS`, requiring Codex browser review.

Disposition:

- Accepted after Codex reran data checks, project check, Batch06/07 Playwright QA, and manual screenshot review.
- Closed after acceptance.

## Verification

Fresh commands run by Codex:

```powershell
npm run compile:boundaries -- --ids srivijaya,joseon,yamato-japan,ghana,mali,songhai,british-empire,united-states
npm run validate:data
npm run audit:boundary-quality
npm run check
$env:F2_BATCH06_URL='http://127.0.0.1:4186/'; npm run audit:f2-batch06
$env:F2_BATCH07_URL='http://127.0.0.1:4186/'; npm run audit:f2-batch07
```

Results:

- Dynasties: 43
- Boundaries: 129
- F2 phased boundary ids: 43
- Boundary quality failures: []
- Boundary quality warnings: []
- Batch06 browser failures: []
- Batch07 browser failures: []

## Important Correction

Codex previously stopped after batch-level work. That was wrong for this user request. The accepted stopping point for this phase is now the F2 full Gate, not an intermediate batch.
