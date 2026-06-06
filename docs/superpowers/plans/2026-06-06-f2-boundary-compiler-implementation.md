# F2 Boundary Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a semi-automatic F2 boundary compiler and use it for a Batch05 pilot (`han`, `ming`, `egypt-new-kingdom`, `achaemenid`, `sasanian`).

**Architecture:** Add source anchor specs and deterministic compiler scripts that generate F2-compatible GeoJSON. Keep app runtime unchanged; all compilation and QA run offline in Node scripts.

**Tech Stack:** Node.js ESM scripts, static JSON data, existing React/Vite/MapLibre app, no new npm dependencies.

---

## File Structure

- Create `src/data/boundary-anchors.json`: source-of-truth anchor specs for compiled F2 batches.
- Create `scripts/boundaryCompiler/geoUtils.mjs`: ring utilities, densify, hull, bbox, rectangle/blob checks, feature builders.
- Create `scripts/boundaryCompiler/regionPresets.mjs`: reusable regional anchor polygons.
- Create `scripts/boundaryCompiler/compileBoundaryAnchors.mjs`: compile selected ids from anchors into `boundaries-simplified.json`.
- Create `scripts/auditBoundaryQuality.mjs`: non-visual QA for compiled/refined boundaries.
- Modify `scripts/validateHistoricalData.mjs`: include Batch05 ids and validate anchor specs.
- Modify `package.json`: add `compile:boundaries` and `audit:boundary-quality`.
- Create `.claude-runs/f2-boundary-compiler-pilot.md`: bounded task record.
- Later acceptance updates: `docs/CURRENT_PHASE.md`, `WORK_LOG.md`, `README.md`, `docs/boundary-qa/*`.

## Task 1: Spec And Task Record

**Files:**
- Already created: `docs/superpowers/specs/2026-06-06-f2-boundary-compiler-design.md`
- Already created: `docs/superpowers/plans/2026-06-06-f2-boundary-compiler-implementation.md`
- Create: `.claude-runs/f2-boundary-compiler-pilot.md`

- [ ] **Step 1: Create task record**

Create `.claude-runs/f2-boundary-compiler-pilot.md` with:

```markdown
# F2 Boundary Compiler Pilot

## Goal

Implement a boundary compiler pilot for `han`, `ming`, `egypt-new-kingdom`, `achaemenid`, and `sasanian`.

## Allowed Write Scope

- `src/data/boundary-anchors.json`
- `src/data/boundaries-simplified.json`
- `scripts/boundaryCompiler/*.mjs`
- `scripts/auditBoundaryQuality.mjs`
- `scripts/validateHistoricalData.mjs`
- `package.json`
- `docs/boundary-qa/*batch05*`

## Forbidden Write Scope

- `src/data/dynasties.json`
- `src/data/landmarks.json`
- `src/map/mapStyle.js`
- `src/components/MapScene.jsx`
- `public/models/*`
- deployment scripts
- package dependencies

## Verification

- `npm run compile:boundaries -- --ids han,ming,egypt-new-kingdom,achaemenid,sasanian`
- `npm run validate:data`
- `npm run audit:boundary-quality`
- `npm run check`
```

- [ ] **Step 2: Confirm no unrelated files are staged**

Run:

```powershell
git status --short --branch
```

Expected: old F1 visual QA files may remain dirty; do not stage them.

## Task 2: Geo Utilities And Region Presets

**Files:**
- Create: `scripts/boundaryCompiler/geoUtils.mjs`
- Create: `scripts/boundaryCompiler/regionPresets.mjs`

- [ ] **Step 1: Implement `geoUtils.mjs`**

Include exported functions:

```js
export function roundCoord(value) {
  return Math.round(value * 1000) / 1000;
}

export function closeRing(points) {
  const rounded = points.map(([lng, lat]) => [roundCoord(lng), roundCoord(lat)]);
  const first = rounded[0];
  const last = rounded.at(-1);
  if (!last || first[0] !== last[0] || first[1] !== last[1]) rounded.push([...first]);
  return rounded;
}

export function densifyRing(points, maxSegment = 1.2) {
  const ring = closeRing(points);
  const out = [];
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    out.push(current);
    const dx = next[0] - current[0];
    const dy = next[1] - current[1];
    const steps = Math.max(0, Math.ceil(Math.hypot(dx, dy) / maxSegment) - 1);
    for (let step = 1; step <= steps; step += 1) {
      const t = step / (steps + 1);
      out.push([roundCoord(current[0] + dx * t), roundCoord(current[1] + dy * t)]);
    }
  }
  out.push([...out[0]]);
  return out;
}
```

Also include:

- `ringArea(ring)`
- `bboxForRing(ring)`
- `bboxForGeometry(geometry)`
- `isRectangleLike(ring)`
- `totalOuterVertices(geometry)`
- `polygonGeometry(ring)`
- `multiPolygonGeometry(rings)`
- `featureFromPhase({ dynasty, phase, geometry, color })`

- [ ] **Step 2: Implement `regionPresets.mjs`**

Export `REGION_PRESETS` with enough presets for Batch05:

```js
export const REGION_PRESETS = {
  'china-core-north': { label: 'North China Core', ring: [[103, 32], [108, 39.5], [116.5, 41], [122, 37], [119, 31.5], [110, 29.8]] },
  'guanzhong': { label: 'Guanzhong', ring: [[105, 33.5], [107, 35.8], [110.5, 35.6], [111, 33.6], [108, 32.8]] },
  'han-corridor': { label: 'Hexi Corridor', ring: [[94, 38], [99, 41], [104, 40], [103, 37], [97, 36]] },
  'yangtze-lower': { label: 'Lower Yangtze', ring: [[113, 28], [118, 32.5], [122, 32], [121, 28], [116, 26.5]] },
  'south-china': { label: 'South China', ring: [[105, 22], [111, 25.5], [118, 25], [121, 22], [113, 19], [107, 20]] },
  'egypt-nile': { label: 'Egypt Nile', ring: [[24, 22], [29, 31.8], [33, 31.2], [34, 24], [31, 20.5], [26, 20.5]] },
  'levant': { label: 'Levant', ring: [[33, 29], [36, 36.8], [40, 36], [39, 31], [35, 28.5]] },
  'mesopotamia': { label: 'Mesopotamia', ring: [[38, 29], [42, 37], [48, 36], [50, 30], [44, 28]] },
  'iranian-plateau': { label: 'Iranian Plateau', ring: [[44, 25], [51, 39], [61, 39], [66, 30], [58, 24], [49, 24]] },
  'anatolia': { label: 'Anatolia', ring: [[26, 36], [31, 42], [41, 41], [43, 36], [34, 35]] },
  'caucasus': { label: 'Caucasus', ring: [[39, 38], [42, 43], [48, 43], [50, 39], [45, 37]] },
  'central-asia-west': { label: 'Western Central Asia', ring: [[55, 35], [62, 44], [72, 43], [75, 35], [66, 30]] }
};
```

- [ ] **Step 3: Run syntax check**

Run:

```powershell
node -e "import('./scripts/boundaryCompiler/geoUtils.mjs').then(()=>import('./scripts/boundaryCompiler/regionPresets.mjs')).then(()=>console.log('ok'))"
```

Expected: `ok`.

## Task 3: Anchor Data For Batch05

**Files:**
- Create: `src/data/boundary-anchors.json`

- [ ] **Step 1: Add anchor schema and Batch05 anchors**

Create a JSON document with `version`, `civilizations`, and phases for:

- `han`
- `ming`
- `egypt-new-kingdom`
- `achaemenid`
- `sasanian`

Each civilization must have exactly 3 phases: `rise`, `peak`, `decline`.

Each phase must include:

```json
{
  "phase": "rise",
  "phaseLabel": "display label",
  "startYear": -202,
  "endYear": -141,
  "summary": "one sentence",
  "mode": "regional-hull",
  "includeRegions": ["china-core-north"],
  "softBoundaries": ["yellow-river"],
  "avoidRegions": ["japan"],
  "sourceNote": "source wording",
  "accuracyNote": "accuracy wording"
}
```

- [ ] **Step 2: Validate JSON parse**

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('src/data/boundary-anchors.json','utf8')); console.log('anchors ok')"
```

Expected: `anchors ok`.

## Task 4: Compiler Script

**Files:**
- Create: `scripts/boundaryCompiler/compileBoundaryAnchors.mjs`

- [ ] **Step 1: Implement CLI parsing**

Support:

```powershell
npm run compile:boundaries -- --ids han,ming
```

Use `process.argv` to parse `--ids`.

- [ ] **Step 2: Implement data loading**

Read:

- `src/data/dynasties.json`
- `src/data/boundary-anchors.json`
- `src/data/boundaries-simplified.json`

- [ ] **Step 3: Implement compilation**

For each selected id:

- Look up dynasty.
- Look up anchors.
- For each phase, resolve each `includeRegions` key through `REGION_PRESETS`.
- For `mode: "regional-hull"`, concatenate all region points and compute a convex hull.
- For `mode: "multi-region"`, emit one ring per region.
- Densify rings.
- Build a `Feature` with properties:
  - `id`
  - `dynasty`
  - `phase`
  - `phaseLabel`
  - `startYear`
  - `endYear`
  - `color`
  - `capital`
  - `summary`
  - `accuracy: "coastline-aware-rough"`
  - `accuracyLabel: "地理锚点编译示意范围"`
  - `accuracyNote`
  - `sourceNote`

- [ ] **Step 4: Replace selected features**

Remove existing `boundaries-simplified.json` features whose `properties.id` is in selected ids, append compiled features, and write the file with pretty JSON.

- [ ] **Step 5: Run compiler**

Run:

```powershell
node scripts/boundaryCompiler/compileBoundaryAnchors.mjs --ids han,ming,egypt-new-kingdom,achaemenid,sasanian
```

Expected output includes compiled counts and no thrown errors.

## Task 5: Validation And Quality Audit

**Files:**
- Modify: `scripts/validateHistoricalData.mjs`
- Create: `scripts/auditBoundaryQuality.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add Batch05 ids to validation**

Add:

```js
const F2_BATCH_05_IDS = new Set(['han', 'ming', 'egypt-new-kingdom', 'achaemenid', 'sasanian']);
```

Include it in `PHASED_BOUNDARY_IDS`.

- [ ] **Step 2: Validate anchor data**

In `validateHistoricalData.mjs`, read `boundary-anchors.json` and validate:

- top-level `civilizations` array exists.
- each Batch05 id exists.
- each Batch05 id has `rise`, `peak`, `decline`.
- every `includeRegions` key exists in `REGION_PRESETS`.
- every phase has `sourceNote` and `accuracyNote`.

- [ ] **Step 3: Add scripts to `package.json`**

Add:

```json
"compile:boundaries": "node scripts/boundaryCompiler/compileBoundaryAnchors.mjs",
"audit:boundary-quality": "node scripts/auditBoundaryQuality.mjs"
```

- [ ] **Step 4: Implement quality audit**

`scripts/auditBoundaryQuality.mjs` should:

- load boundaries.
- check Batch05 ids each have 3 features.
- reject rectangle-like rings.
- reject total outer vertices below 40 for Polygon and 80 for MultiPolygon.
- warn if bbox width or height is extremely large for a non-global civilization.
- write `docs/boundary-qa/boundary-quality-manifest.json`.
- exit 1 on failures.

- [ ] **Step 5: Run checks**

Run:

```powershell
npm run compile:boundaries -- --ids han,ming,egypt-new-kingdom,achaemenid,sasanian
npm run validate:data
npm run audit:boundary-quality
npm run check
```

Expected: all pass except the existing Vite chunk-size warning.

## Task 6: Browser QA For Batch05

**Files:**
- Create: `scripts/auditF2BoundaryBatch05Playwright.mjs`
- Create generated files: `docs/boundary-qa/f2-batch05-*.png`, `docs/boundary-qa/F2_BATCH05_REPORT_2026-06-06.md`, `docs/boundary-qa/f2-batch05-manifest.json`

- [ ] **Step 1: Create Playwright QA script**

Use the pattern from `scripts/auditF2BoundaryBatch04Playwright.mjs`.

Scenes:

- `han--100`: year `-100`, center `[111, 35]`, zoom `4.2`
- `ming-1450`: year `1450`, center `[112, 32]`, zoom `4.2`
- `egypt-new-kingdom--1300`: year `-1300`, center `[32, 28]`, zoom `4.8`
- `achaemenid--500`: year `-500`, center `[50, 33]`, zoom `4.1`
- `sasanian-620`: year `620`, center `[50, 33]`, zoom `4.1`

- [ ] **Step 2: Run Browser QA**

Start local preview and run the script with the same Playwright environment variables used by prior batch scripts.

Expected:

- `failures: []`
- screenshots written.
- no page errors.

## Task 7: Acceptance Docs And Commit

**Files:**
- Modify: `docs/CURRENT_PHASE.md`
- Modify: `WORK_LOG.md`
- Modify: `README.md`
- Create: `D:\松君\文件库\松君\history-atlas\21-F2边界Compiler与Batch05.md`
- Modify: `D:\松君\文件库\松君\history-atlas\00-索引.md`

- [ ] **Step 1: Update phase docs**

Record:

- Boundary compiler pilot accepted or rejected.
- Batch05 accepted only if all checks and browser QA pass.
- Do not claim F2 full completion.

- [ ] **Step 2: Update Obsidian notes**

Create the Batch05 note and add it to the index.

- [ ] **Step 3: Stage only relevant files**

Run:

```powershell
git status --short
git diff --cached --name-only
```

Do not stage old F1 visual QA dirt or `.superpowers/`.

- [ ] **Step 4: Commit**

If accepted:

```powershell
git commit -m "data(boundaries): add F2 boundary compiler pilot"
git push
```

Expected: commit and push succeed.

## Self-Review

- Spec coverage: compiler, anchors, validation, audit, browser QA, docs, and subagent workflow are covered.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: `boundary-anchors.json`, `REGION_PRESETS`, compiler, validator, and audit names match across tasks.
