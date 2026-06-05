# F2 Boundary Batch 02 QA Report

Date: 2026-06-05

Status: accepted for F2 rough-refined batch gate. This is not final-version completion.

## Scope

Accepted ids:

1. `greek-city-states`
2. `assyrian`
3. `babylon`
4. `carolingian`
5. `holy-roman-empire`

`egypt-old-kingdom` is intentionally not counted in this accepted batch because the public timeline currently starts at BCE 2000 and Old Kingdom Egypt ends before that range.

## Implementation Notes

- Added a dedicated generator: `scripts/refineF2Batch02Boundaries.mjs`.
- Added dedicated browser QA: `scripts/auditF2BoundaryBatch02Playwright.mjs`.
- Tightened `scripts/validateHistoricalData.mjs` so Batch 02 ids require exactly 3 contiguous phase features.
- Reworked Carolingian and Holy Roman Empire geometry after review rejected single-ring shapes that created large triangular fills over the Alps and Italy.
- The final Carolingian and Holy Roman Empire phases use cleaner `MultiPolygon` shapes to avoid cross-region wedge artifacts.

## Verification

Commands run:

```powershell
npm run validate:data
npm run check
$env:F2_BATCH02_URL='http://127.0.0.1:4182/'
$env:CHROME_PATH='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$env:CODEX_NODE_MODULES='C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:NODE_PATH='C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules'
& 'C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/auditF2BoundaryBatch02Playwright.mjs
```

Results:

- `npm run validate:data`: passed.
- `npm run check`: passed.
- Batch 02 Playwright QA: passed with `failures: []`.
- Known non-blocking build warning: Vite chunk-size warning remains an F6 performance item.

## Screenshots

- `docs/boundary-qa/f2-batch02-greek-city-states-450.png`
- `docs/boundary-qa/f2-batch02-assyrian-670.png`
- `docs/boundary-qa/f2-batch02-babylon-560.png`
- `docs/boundary-qa/f2-batch02-carolingian-820.png`
- `docs/boundary-qa/f2-batch02-holy-roman-empire-1200.png`
- Manifest: `docs/boundary-qa/f2-batch02-manifest.json`

## Gate Decision

Accepted.

The batch is still rough historical visualization. It should not be described as academically precise boundary data.

