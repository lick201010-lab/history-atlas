# F2 Boundary Batch 04 Worker Record

Owner: Codex worker

Goal: implement rough-refined, phase-aware boundaries for `jin`, `song`, `yuan`, `qing`, and `prc`.

Write scope used:

- `src/data/boundaries-simplified.json`
- `scripts/validateHistoricalData.mjs`
- `scripts/refineF2Batch04Boundaries.mjs`
- `scripts/auditF2BoundaryBatch04Playwright.mjs`
- `docs/boundary-qa/f2-batch04-*.png`
- `docs/boundary-qa/f2-batch04-manifest.json`
- `docs/boundary-qa/f2-batch04-report-2026-06-05.md`
- `.claude-runs/f2-boundary-batch-04.md`

Forbidden scope respected:

- No edits to `src/data/dynasties.json`
- No edits to `src/data/landmarks.json`
- No edits to `src/map/*`
- No edits to `src/components/*`
- No edits to `public/models/*`
- No edits to README, AGENTS, ROADMAP, WORK_LOG, deploy scripts, or package files

Implementation notes:

- Each target id now has exactly 3 phases: `rise`, `peak`, `decline`.
- Phase ranges are contiguous and cover dynasty `startYear` through `endYear`.
- Every feature includes `sourceNote` and `accuracyNote`.
- Song uses distinct Northern Song and Southern Song geometry; the Southern Song screenshot intentionally leaves north China unpainted.
- Yuan, Qing, and PRC use large irregular coastline-aware outlines with north/west/southwest/coastal anchor awareness; Qing and PRC include Hainan/Taiwan as separate illustrative island polygons.
- PRC `decline` is a data-model phase label for the contemporary transition period, not a territorial decline claim.

Verification run:

- `node scripts/refineF2Batch04Boundaries.mjs` passed.
- `npm run validate:data` passed.
- `npm run check` passed.
- `scripts/auditF2BoundaryBatch04Playwright.mjs` passed with `failures: []`.

QA artifacts:

- `docs/boundary-qa/f2-batch04-jin-280.png`
- `docs/boundary-qa/f2-batch04-song-1160.png`
- `docs/boundary-qa/f2-batch04-yuan-1300.png`
- `docs/boundary-qa/f2-batch04-qing-1765.png`
- `docs/boundary-qa/f2-batch04-prc-2020.png`
- `docs/boundary-qa/f2-batch04-manifest.json`
- `docs/boundary-qa/f2-batch04-report-2026-06-05.md`

Risks and follow-ups:

- These are rough-refined illustrative ranges, not academic GIS boundaries.
- The five screenshots are zoom 4-5 acceptance views; Yuan/Qing/PRC still require panning to inspect the full west-east extent at that zoom.
- Main thread should review and decide whether Batch04 is accepted before logging it as accepted.
