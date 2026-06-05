# F2 Boundary Batch 02 Task And Closeout

## Current Decision

Batch 02 accepted target ids are:

1. `greek-city-states`
2. `assyrian`
3. `babylon`
4. `carolingian`
5. `holy-roman-empire`

`egypt-old-kingdom` is not a Batch 02 accepted id because the timeline minimum is BCE 2000 and Old Kingdom Egypt ends in BCE 2181, so browser QA cannot display it. Its three draft phase features may remain in `src/data/boundaries-simplified.json`, but `scripts/validateHistoricalData.mjs` must not include it in `F2_BATCH_02_IDS`.

## Goal

Close out F2 Batch 02 by ensuring each accepted id has exactly three phased boundary features:

- `rise`
- `peak`
- `decline`

The three features for each accepted id must continuously cover the matching dynasty `startYear` through `endYear`.

## Allowed Write Scope

- `scripts/refineF2Batch02Boundaries.mjs`
- `scripts/validateHistoricalData.mjs`
- `src/data/boundaries-simplified.json`
- `scripts/auditF2BoundaryBatch02Playwright.mjs`
- `docs/boundary-qa/*`
- `.claude-runs/f2-boundary-batch-02.md`

## Forbidden Write Scope

- `src/data/dynasties.json`
- `src/data/landmarks.json`
- `src/map/*`
- `src/components/*`
- `public/models/*`
- `package.json`
- `package-lock.json`
- deploy files
- `README.md`
- `AGENTS.md`
- `docs/ROADMAP.md`

## Verification Commands Run

```powershell
node scripts/refineF2Batch02Boundaries.mjs
npm run validate:data
npm run check
$env:F2_BATCH02_URL='http://127.0.0.1:4182/'; $env:CODEX_NODE_MODULES='C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'; $env:NODE_PATH='C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules'; node scripts/auditF2BoundaryBatch02Playwright.mjs
```

## Closeout Notes

- `scripts/validateHistoricalData.mjs` Batch 02 ids are the five accepted ids listed above.
- `src/data/boundaries-simplified.json` contains exactly three accepted phase features for each Batch 02 id.
- `egypt-old-kingdom` remains as a three-phase draft only.
- Playwright QA captured the five accepted scenes and wrote `docs/boundary-qa/f2-batch02-manifest.json`.
- The first Playwright attempt failed because local project dependencies did not include `playwright`; rerun succeeded with Codex runtime `CODEX_NODE_MODULES` and `NODE_PATH`.

Do not claim the project is final. This is only an F2 batch closeout.

## 2026-06-05 Geometry Fix Worker Closeout

- Fixed `carolingian` and `holy-roman-empire` geometry in `scripts/refineF2Batch02Boundaries.mjs`, then regenerated `src/data/boundaries-simplified.json`.
- `carolingian` now uses split MultiPolygon phase geometry for the West Frankish/Gaul core, East Frankish/Saxon-Bavarian area, and northern Italy instead of one broad convex western-Europe ring.
- `holy-roman-empire` rise and peak now use separate MultiPolygon regions for the German/Central European core, Burgundy/Arles, and northern/central Italy; decline remains a single late central-European polygon.
- Time coverage, phase names, `sourceNote`, and `accuracyNote` were preserved.
- Verification run:
  - `node scripts/refineF2Batch02Boundaries.mjs`
  - `npm run validate:data`
  - `npm run check`
  - `$env:F2_BATCH02_URL='http://127.0.0.1:4182/'; $env:CHROME_PATH='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'; $env:CODEX_NODE_MODULES='C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'; $env:NODE_PATH='C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules'; & 'C:\Users\Yvette\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/auditF2BoundaryBatch02Playwright.mjs`
- Result: all commands passed; Playwright wrote updated Batch02 screenshots and manifest with `failures: []`.
