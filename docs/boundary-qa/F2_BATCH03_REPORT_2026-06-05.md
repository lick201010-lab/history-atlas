# F2 Boundary Batch 03 Visual Rejection Fix Report

Date: 2026-06-05

Status: worker verification passed; awaiting Codex main-thread acceptance. This is not final-version completion.

## Scope

Batch 03 ids:

1. `xia`
2. `shang`
3. `zhou`
4. `qin`
5. `sui`

## Rejection Addressed

Codex rejected the first Batch03 visual pass because:

- `xia`, `shang`, `qin`, and `sui` read as smooth cakes / simple ellipses.
- `zhou` decline used separated oval blocks that looked like placeholders.
- The batch therefore did not meet the F2 rough-refined requirement.

## Fix Summary

- Reworked the generated geometries in `scripts/refineF2Batch03Boundaries.mjs`.
- Kept exactly 3 phases for every target id.
- Kept all original phase year coverage unchanged.
- Preserved `sourceNote` and `accuracyNote` on every generated feature.
- Changed `xia` and `shang` into narrower, irregular Central Plains / Yellow River corridor shapes with visible northwest-southeast direction and concave kinks.
- Changed `zhou` decline from separated oval MultiPolygon blocks into one irregular Warring States activity envelope, removing the random detached bubble look.
- Kept `qin` and `sui` large, but added stronger coastline / regional turns for north China, Guanzhong, Jianghuai, lower Yangtze, Sichuan, and Lingnan.
- Adjusted the Qin and Sui QA cameras slightly, still at zoom 4+, so screenshots show more of the coastline-aware outline.

## Verification

Commands run:

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

Results:

- `node scripts/refineF2Batch03Boundaries.mjs`: passed; regenerated 15 features.
- `npm run validate:data`: passed.
- `npm run check`: passed.
- Batch 03 Playwright QA: passed with `failures: []`.
- Known non-blocking build warning: Vite chunk-size warning remains an F6 performance item.

## Screenshots

- `docs/boundary-qa/f2-batch03-xia-1850.png`
- `docs/boundary-qa/f2-batch03-shang-1250.png`
- `docs/boundary-qa/f2-batch03-zhou-350.png`
- `docs/boundary-qa/f2-batch03-qin-214.png`
- `docs/boundary-qa/f2-batch03-sui-600.png`
- Manifest: `docs/boundary-qa/f2-batch03-manifest.json`

## Residual Risks

- These remain rough-refined historical visualization boundaries, not academic GIS borders.
- Qin and Sui still use unified-dynasty outer envelopes; detailed commandery-level change is out of scope for this batch.
- The public timeline starts at BCE 2000, so Xia browser QA uses BCE 1850 rather than the dynasty start year BCE 2070.
