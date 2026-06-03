# Current Phase: F1 Final Visual Foundation

Updated: 2026-06-04

Status: F1 in progress. Passes 1-2 have improved ocean, boundary, HUD, and hillshade hierarchy, but the F1 Gate is not accepted yet.

## Phase Goal

Make the map feel like a polished final visual foundation before expanding boundary data or landmark models.

The current deployed site at `https://atlas.ckl.hk/` is an online milestone and audit baseline. It is not the final complete version.

## Why F1 Comes First

Boundary and model quality depend on the base map. If ocean, relief, boundary hierarchy, and HUD layering are not stable, later refined data and GLB assets will still look unfinished.

## In Scope

- Improve ocean flatness, depth, and cleanliness.
- Improve land relief readability while reducing white-noise texture.
- Reduce visible terrain/tile seam artifacts.
- Improve focus vs non-focus boundary hierarchy.
- Make HUD panels feel more like a finished atlas interface and less like a development workbench.
- Keep the current dark atlas / 3D sandbox direction.
- Use existing MapLibre, React, Vite, and Three.js architecture.

## Out of Scope

- Do not migrate map engines.
- Do not switch the whole site to a blurry antique map theme.
- Do not start broad 43-civilization boundary refinement.
- Do not start broad 30-landmark GLB production.
- Do not change `src/data/*.json` during the F1 visual pass.
- Do not change deployment scripts during the F1 visual pass.

## Codex Responsibilities

- Define and enforce the visual standard.
- Create bounded Claude task prompts.
- Review Claude diffs before committing.
- Run automated checks.
- Use browser screenshots for real visual QA.
- Update `WORK_LOG.md` and Obsidian notes.
- Reject work that still reads as debug-layer, noisy, or unfinished.

## Claude Responsibilities

Claude may work only from a `.claude-runs/*.md` task file.

Allowed F1 write scope:

- `src/map/mapStyle.js`
- `src/styles.css`
- `src/styles-mobile.css`
- Small, necessary edits to `src/components/MapScene.jsx`

Forbidden F1 write scope:

- `src/data/*.json`
- `public/models/*`
- `scripts/build*Glb.mjs`
- deployment scripts
- package dependency changes unless Codex explicitly updates this phase file

## Gate Checks

F1 is not accepted until all are true:

- `npm run check` passes.
- `npm run audit:visual-foundation` passes.
- Four foundation screenshots are manually reviewed:
  - `foundation-himalaya-relief.png`
  - `foundation-open-ocean-flatness.png`
  - `foundation-mediterranean-boundary-readability.png`
  - `foundation-central-america-readability.png`
- Ocean is flat, deep, and clean without visible underwater mountain noise.
- Land mountains remain visibly raised.
- Terrain/tile seam artifacts are significantly reduced.
- Civilization boundaries no longer look like fluorescent debug geometry.
- HUD does not dominate the map and reads as a finished atlas interface.
- Results are recorded in `WORK_LOG.md`.

## Latest Pass

2026-06-04 F1 pass 1:

- Claude made a bounded visual pass, then Codex tightened default boundary opacity further.
- `npm run check` passed.
- `VISUAL_FOUNDATION_URL=http://127.0.0.1:4174/ npm run audit:visual-foundation` passed.
- Foundation screenshots show cleaner ocean and calmer multi-civilization boundaries.
- F1 remains open because mountain relief still reads noisy in places and distant terrain/tile seam artifacts remain visible.

2026-06-04 F1 pass 2:

- Codex reduced dark-theme hillshade high lights, accent color, and secondary hillshade intensity.
- Mountain mode keeps 3D terrain exaggeration but uses lower hillshade exaggeration so shape carries the relief instead of bright texture noise.
- `npm run check` passed.
- `VISUAL_FOUNDATION_URL=http://127.0.0.1:4174/ npm run audit:visual-foundation` passed.
- F1 remains open because the distant dark wedge/seam artifact is still visible in fixed audit views.

## Next Phase Entry Rule

Only after F1 passes may the project enter F2 full boundary refinement.

F2 must begin with a new `docs/CURRENT_PHASE.md` update and a new Claude task template for a 5-civilization batch.
