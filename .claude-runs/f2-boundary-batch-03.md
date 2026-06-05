# F2 Boundary Batch 03 Visual Rejection Fix Closeout

## Scope

Reworked Batch 03 for:

1. `xia`
2. `shang`
3. `zhou`
4. `qin`
5. `sui`

## Rejection Context

Codex main thread rejected the first Batch03 version because `xia`, `shang`, `qin`, and `sui` looked like smooth cakes / simple ellipses, while `zhou` decline used separated oval blocks that read as placeholders.

## Allowed Write Scope Used

- `src/data/boundaries-simplified.json`
- `scripts/refineF2Batch03Boundaries.mjs`
- `scripts/auditF2BoundaryBatch03Playwright.mjs`
- `docs/boundary-qa/f2-batch03-*.png`
- `docs/boundary-qa/f2-batch03-manifest.json`
- `docs/boundary-qa/f2-batch03-report.md`
- `.claude-runs/f2-boundary-batch-03.md`

## Forbidden Scope

No intentional edits were made to:

- `src/data/dynasties.json`
- `src/data/landmarks.json`
- `src/map/*`
- `src/components/*`
- `public/models/*`
- deploy files
- package files
- `README.md`
- `AGENTS.md`
- `docs/ROADMAP.md`
- `WORK_LOG.md`

Existing dirty files outside this batch were left untouched.

## Data Result

- Each Batch 03 id has exactly 3 phase features: `rise`, `peak`, `decline`.
- Each id keeps the original dynasty year coverage:
  - `xia`: BCE 2070 to BCE 1600
  - `shang`: BCE 1600 to BCE 1046
  - `zhou`: BCE 1046 to BCE 256
  - `qin`: BCE 221 to BCE 206
  - `sui`: CE 581 to CE 618
- Every generated feature includes `sourceNote` and `accuracyNote`.
- `xia` and `shang` are now narrower, irregular Central Plains / Yellow River corridor shapes rather than rounded ovals.
- `zhou` decline is now one irregular Warring States activity envelope instead of separated oval blocks.
- `qin` and `sui` retain large unified-dynasty scale but add visible north China, Guanzhong, Jianghuai, lower Yangtze, Sichuan, Lingnan, and coastline turns.

## Verification Commands Run

```powershell
node scripts/refineF2Batch03Boundaries.mjs
npm run validate:data
npm run check
$env:F2_BATCH03_URL='http://127.0.0.1:4183/'
$env:CHROME_PATH='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$env:CODEX_NODE_MODULES='C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:NODE_PATH='C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules'
& 'C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/auditF2BoundaryBatch03Playwright.mjs
```

## Verification Results

- `node scripts/refineF2Batch03Boundaries.mjs`: passed.
- `npm run validate:data`: passed.
- `npm run check`: passed.
- Batch 03 Playwright QA: passed with `failures: []`.
- Screenshots regenerated:
  - `docs/boundary-qa/f2-batch03-xia-1850.png`
  - `docs/boundary-qa/f2-batch03-shang-1250.png`
  - `docs/boundary-qa/f2-batch03-zhou-350.png`
  - `docs/boundary-qa/f2-batch03-qin-214.png`
  - `docs/boundary-qa/f2-batch03-sui-600.png`

## Notes

- A transient Windows file-open `UNKNOWN` occurred once when the generator was run in parallel with another read; rerunning the generator serially passed.
- `npm run check` still emits the existing Vite chunk-size warning; this is an F6 performance concern, not a Batch 03 blocker.
