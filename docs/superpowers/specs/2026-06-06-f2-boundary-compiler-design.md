# F2 Boundary Compiler Design

## Status

Approved direction: replace the slow hand-edited F2 boundary workflow with a semi-automatic boundary compiler.

This design does not mark F2 complete. It defines a new pipeline that should make F2 completion faster and more consistent.

## Problem

The current F2 workflow has proven useful for sample quality control, but it is inefficient and has a low quality ceiling:

- Workers directly edit or generate final GeoJSON.
- Large empires tend to become broad bands, convex blobs, or overgeneralized shapes.
- Visual QA catches problems late, after data has already been generated.
- Each batch repeats the same coastline, island, and cross-sea mistakes.
- The process depends too much on individual agent judgment.

The target visual quality requires boundaries that feel anchored to real geography: coastlines, rivers, mountain chains, deserts, island groups, and historical core regions.

## Goal

Build an F2 boundary compiler that turns compact historical-geographic anchor specs into validated GeoJSON boundary features.

The compiler should not promise academic GIS precision. It should produce better rough-refined historical visualization:

- More coast-aware than hand polygons.
- Less rectangular or blob-like.
- More consistent across all 43 civilizations.
- Easier to review in batches.
- Safer for subagents to contribute to.

## Non-Goals

- Do not replace MapLibre rendering.
- Do not add runtime dependencies.
- Do not fetch data at app runtime.
- Do not claim exact historical borders.
- Do not complete F3/F4/F5/F6.
- Do not rewrite all 43 boundaries in one unchecked commit.

## Core Idea

Split F2 into two layers:

1. `boundary-anchors.json`
   Human/agent-authored historical geography.

2. Compiler scripts
   Deterministic transformation from anchors plus geographic constraints into GeoJSON features and QA artifacts.

Subagents should write anchor specs, not final boundary geometry. Codex should run the compiler, inspect generated output, and accept or reject batches.

## Data Model

Create `src/data/boundary-anchors.json`.

Top-level shape:

```json
{
  "version": 1,
  "generatedFor": "F2 boundary compiler",
  "civilizations": [
    {
      "id": "han",
      "phases": [
        {
          "phase": "rise",
          "phaseLabel": "西汉建国 · 关中与中原",
          "startYear": -202,
          "endYear": -141,
          "summary": "西汉初年以关中、黄河中下游和淮河流域为核心，边疆控制仍在恢复。",
          "mode": "regional-hull",
          "includeRegions": ["china-core-north", "guanzhong", "huai-river"],
          "softBoundaries": ["yellow-river", "qinling", "north-china-plain"],
          "avoidRegions": ["japan", "korea", "southeast-asia-islands"],
          "sourceNote": "参考《中国历史地图集》与通用汉代疆域图，按历史沙盘展示概化。",
          "accuracyNote": "示意范围，强调核心区和边疆方向，不代表县郡级边界。"
        }
      ]
    }
  ]
}
```

Required phase fields:

- `phase`: `rise`, `peak`, or `decline`
- `phaseLabel`
- `startYear`
- `endYear`
- `summary`
- `mode`
- `includeRegions`
- `sourceNote`
- `accuracyNote`

Optional fields:

- `softBoundaries`
- `avoidRegions`
- `includeIslands`
- `holes`
- `capitalFocus`
- `notes`

## Region Presets

Create `scripts/boundaryCompiler/regionPresets.mjs`.

Presets are reusable geographic anchor polygons, not final borders. Examples:

- `china-core-north`
- `guanzhong`
- `yangtze-lower`
- `south-china-coast`
- `tarim-basin`
- `mongolian-steppe`
- `iranian-plateau`
- `mesopotamia`
- `levant`
- `egypt-nile`
- `anatolia`
- `caucasus`
- `roman-italy`
- `iberia`
- `greece-aegean`
- `mesoamerica-maya-lowlands`
- `andes-core`

Each preset should be a convex or near-convex polygon with metadata:

```js
export const REGION_PRESETS = {
  'china-core-north': {
    label: 'North China Core',
    ring: [[103, 32], [108, 39], [116, 41], [122, 37], [119, 32], [110, 30]],
  },
};
```

The compiler unions/densifies these regions and then clips to land where appropriate.

## Geographic Constraints

Use existing or generated local data:

- `src/data/atlas-land-110m.json` as offline land fallback.
- Optional cached Natural Earth 50m land if already present in `scripts/.cache/`.
- Do not require network for normal compilation.

The first compiler version can be self-contained and use land clipping plus heuristics. Later versions may add rivers and mountain vectors.

## Compiler Files

Create:

- `scripts/boundaryCompiler/geoUtils.mjs`
- `scripts/boundaryCompiler/regionPresets.mjs`
- `scripts/boundaryCompiler/compileBoundaryAnchors.mjs`
- `scripts/auditBoundaryQuality.mjs`

Modify:

- `scripts/validateHistoricalData.mjs`
- `package.json`
- `docs/CURRENT_PHASE.md`
- `WORK_LOG.md`
- `README.md`

## Compiler Behavior

For each anchor phase:

1. Load dynasty metadata from `src/data/dynasties.json`.
2. Load anchor phases from `src/data/boundary-anchors.json`.
3. Convert `includeRegions` into rings.
4. Merge rings by creating a hull or multi-part geometry depending on `mode`.
5. Densify long segments so borders do not look under-specified.
6. Clip or intersect with land data for coast-aware phases.
7. Remove tiny accidental pieces.
8. Preserve intentional islands listed in `includeIslands`.
9. Smooth or simplify to display-quality geometry.
10. Emit GeoJSON features compatible with `boundaries-simplified.json`.
11. Replace only the ids targeted by the current batch.

First implementation may use deterministic region hulls and limited land clipping rather than a full polygon union library. The important improvement is that final features come from reusable anchors and a consistent compiler, not one-off final geometry edits.

## Quality Audit

`scripts/auditBoundaryQuality.mjs` should provide a stronger non-visual gate than current validation:

- Each compiled id has at least 3 phases.
- Each feature has `sourceNote` and `accuracyNote`.
- No rectangle-like rings.
- No severe low-vertex features.
- No single huge diagonal band for named high-risk empires.
- MultiPolygon part count is within expected bounds.
- Bounding box is within configured tolerance for that civilization.
- Suspicious island inclusion is reported.
- Output includes a JSON QA report.

It should not replace browser review.

## Batch05 Pilot

Use the new compiler for:

- `han`
- `ming`
- `egypt-new-kingdom`
- `achaemenid`
- `sasanian`

These cover:

- China inland/coastal dynastic states.
- Nile/Levant geography.
- Iranian plateau and Near East empires.
- Large inland-plus-coast empires.

Batch05 acceptance requires:

- `npm run compile:boundaries -- --ids han,ming,egypt-new-kingdom,achaemenid,sasanian`
- `npm run validate:data`
- `npm run audit:boundary-quality`
- `npm run check`
- Browser screenshots for the five peak phases plus at least one overview for Achaemenid or Sasanian.

## Subagent Workflow

Use subagents for bounded work:

- Worker A: region presets and geo utility scaffolding.
- Worker B: Batch05 anchor specs.
- Worker C: compiler and quality audit scripts.
- Reviewer D: read-only spec and output review.

Main thread remains responsible for:

- Diff review.
- Running final verification.
- Browser QA.
- Accept/reject decisions.
- Logs and commits.

## Risks

- Without a real polygon union dependency, the first compiler may still approximate some regions. That is acceptable for the pilot if it improves consistency and prevents obvious bad shapes.
- Fully accurate historical boundaries remain impossible without curated historical GIS data. This pipeline aims for credible visual geography, not academic exactness.
- Current old accepted batches may later need re-compilation through the new pipeline for visual consistency.

## Acceptance for This Design

This design is acceptable if the Batch05 pilot proves:

- The compiler can produce F2-compatible features.
- The resulting screenshots look less hand-drawn and less blob-like than the old route.
- Subagents can add anchors without directly editing final GeoJSON.
- Validators catch malformed anchors and weak compiled output before browser QA.
