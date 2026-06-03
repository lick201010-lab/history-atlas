# GLB Visual QA

Date: 2026-06-02

Scope: desktop map-view QA for the 14 current GLB landmark overrides. Screenshots were captured from the local Vite app at `http://127.0.0.1:5173/` with a hidden Chrome `1440x900` viewport. HUD panels were hidden during capture so the result focuses on the map, boundary layer, terrain, labels, and GLB silhouettes.

## Summary

- The GLB pipeline is working: 14/14 assets rendered in-map and none appeared upside down, floating high above the terrain, or fully sunk.
- Console QA found no app/runtime errors. The only captured network failures were `ERR_ABORTED` tile requests caused by rapidly jumping the camera during automation, not GLB load failures.
- The best current samples are `hagia-sophia`, `colosseum`, `tajmahal`, `notre-dame`, and `stonehenge`.
- The weakest assets from the first pass were `chichen-itza`, `petra`, `great-wall`, `forbidden-city`, and `angkor-wat`. As of the 2026-06-03 follow-ups, all five have been upgraded to the current MVP Pass bar.
- `pyramid` was the last remaining Warn-level GLB after the Angkor pass. It has now also been upgraded to the current MVP Pass bar, with a selected-state scale/camera preset so the Giza group is readable in-map.
- The biggest overall visual problem is not only model quality: large historical boundary fills and coastline-mismatched polygons still cut across seas or dominate the model view. This can make otherwise acceptable models feel rough.

## 2026-06-03 Pyramid Follow-Up

Claude rebuilt `great-pyramid.glb` via `scripts/buildGreatPyramidGlb.mjs`. Codex re-ran the asset audit, full check, reviewed multiple camera angles, added a selected-state scale override and a Giza-specific focus camera preset, then captured a fresh focus-mode screenshot.

- `npm run check`: passed.
- GLB audit: stayed at `14 OK, 0 WARN, 0 FAIL`.
- `great-pyramid.glb`: increased from 53 KB / 892 tris to 96 KB / 1,540 tris, still far under the 800 KB target.
- Build/audit metrics: 10 materials, z -0.00..0.65, footprint 0.760.
- Focus QA view: [after screenshot](glb-visual-qa/05-pyramid-after-focus.png), [manifest](glb-visual-qa/05-pyramid-after-focus-manifest.json).
- Verdict: upgraded from Warn to Pass for the current MVP quality bar. The focus view now reads as a Giza complex rather than a single generic pyramid: main pyramid, second/third pyramids, plateau, and satellite small pyramids are visible. Remaining polish: this is still a stylized low-poly miniature; later final passes can add more stone course contrast, clearer Sphinx silhouette, and warmer surface highlights.

## 2026-06-03 Chichen Itza Follow-Up

Claude rebuilt `chichen-itza.glb` in commit `8175062`. Codex re-ran the asset audit, full check, and a fresh map-view screenshot.

- `npm run check`: passed.
- GLB audit: improved from `13 OK, 1 WARN, 0 FAIL` to `14 OK, 0 WARN, 0 FAIL`.
- `chichen-itza.glb`: increased from 34 KB to 197 KB, still well under budget.
- Visual result: [after screenshot](glb-visual-qa/09-chichen-itza-after.png).
- Verdict: upgraded from Fail to Pass for the current MVP quality bar. It now reads as a terraced pyramid with visible stair lines and a summit temple. Remaining polish: slightly stronger highlights or selected-landmark focus mode would help it read better against the dark map.

## 2026-06-03 Petra Follow-Up

Claude rebuilt `petra.glb` in commit `5e7dc14`. Codex re-ran the asset audit, full check, and three map-view screenshots.

- `npm run check`: passed.
- GLB audit: stayed at `14 OK, 0 WARN, 0 FAIL`.
- `petra.glb`: 129 KB, about 2,044 triangles, still very light.
- Standard QA view: [after screenshot](glb-visual-qa/13-petra-after.png).
- Front/readability views: [front A](glb-visual-qa/13-petra-after-front-a.png), [front B](glb-visual-qa/13-petra-after-front-b.png).
- Verdict: upgraded from Warn to Pass for the current MVP quality bar. The front view now clearly shows a rock slab, carved facade, column rhythm, recessed doorway, and pediment-like upper mass. Remaining polish: selected-landmark focus mode should rotate/zoom the camera toward the facade, because a default side angle still reads more blocky than the model actually is.

## 2026-06-03 Great Wall Follow-Up

Claude rebuilt `great-wall.glb` in commit `974479c`. Codex re-ran the asset audit, full check, and two map-view screenshots.

- `npm run check`: passed.
- GLB audit: stayed at `14 OK, 0 WARN, 0 FAIL`.
- `great-wall.glb`: 161 KB, about 1,992 triangles, still very light.
- Standard QA view: [after screenshot](glb-visual-qa/06-great-wall-after.png).
- Readability view: [focus screenshot](glb-visual-qa/06-great-wall-after-focus.png).
- Verdict: upgraded from Warn to Pass for the current MVP quality bar. The model now reads as a crenellated wall segment with watchtower masses instead of a generic fortress block. Remaining polish: it still reads as a short landmark sample, not yet as a long terrain-following wall system; a later final-quality pass should extend the wall route and make it more serpentine across terrain.

## 2026-06-03 Angkor Wat Follow-Up

Claude rebuilt `angkor-wat.glb` via `scripts/buildAngkorWatGlb.mjs`. Codex re-ran the asset audit, full check, added an Angkor-specific selected-landmark camera preset, and captured a fresh focus-mode screenshot.

- `npm run check`: passed.
- GLB audit: stayed at `14 OK, 0 WARN, 0 FAIL`.
- `angkor-wat.glb`: increased from 110 KB / 2,834 tris to 152 KB / 3,722 tris, still well under the 800 KB target.
- Build log: 9 materials, z -0.00..1.20, footprint 0.712.
- Focus QA view: [after screenshot](glb-visual-qa/07-angkor-wat-after-focus.png), [manifest](glb-visual-qa/07-angkor-wat-after-focus-manifest.json).
- Verdict: upgraded from Warn to Pass for the current MVP quality bar. The model now has a rectangular moat, a prominent western causeway with balustrade hints, double gallery rings with gopuras on all four sides, a three-tier central platform, and a clearly differentiated quincunx of five towers (central tower dominant at zMax 1.20, corner towers shorter). The cross-shaped connecting galleries between towers add to the temple-mountain readability. Remaining polish: this is still a stylized low-poly miniature; later final passes can add more gallery bay rhythm and finer lotus-bud detail.

## 2026-06-03 Selected Landmark Focus Mode

Codex added a lightweight selected-landmark focus mode so users can inspect one landmark without nearby labels, non-selected GLBs, and territory overlays competing with it.

- `npm run check`: passed.
- Scope: `src/App.jsx`, `src/components/MapScene.jsx`, and `src/map/createBuildingLayer.js`.
- Behavior: selecting a landmark now uses per-landmark camera presets, filters the map label layer down to the selected landmark, dims dynasty fills/lines/capital labels, and hides non-selected 3D landmark groups at the Three custom-layer level.
- Forbidden City QA: [focus screenshot](glb-visual-qa/focus-mode-forbidden-city.png).
- Petra QA: [focus screenshot](glb-visual-qa/focus-mode-petra.png).
- Verdict: Pass for MVP interaction quality. It makes model inspection cleaner and reduces the Beijing-area Great Wall / Forbidden City collision. Remaining polish: a future immersive inspection mode could temporarily hide HUD panels too; the current mode keeps the normal panels visible for workflow continuity.

## 2026-06-03 Immersive Inspection Mode

Codex added an explicit immersive toggle to the landmark card. Selecting a landmark still opens the normal workflow card first; pressing `沉浸` hides the title, top controls, layer/search panel, filter panel, info panel, era narrative, compare panel, and timeline while keeping the selected GLB, map frame, map label, and a compact landmark nameplate with `定位` / `退出` controls.

- `npm run check`: passed.
- Desktop QA: [screenshot](glb-visual-qa/immersive-mode-hagia-sophia-desktop.png), [manifest](glb-visual-qa/immersive-mode-hagia-sophia-desktop-manifest.json).
- Mobile QA: [screenshot](glb-visual-qa/immersive-mode-hagia-sophia-mobile.png), [manifest](glb-visual-qa/immersive-mode-hagia-sophia-mobile-manifest.json).
- Manifest evidence: both desktop and mobile entered `body.has-card.landmark-immersive`; `.timeline`, `.info-panel`, `.layer-controls`, and `.title` had `opacity: 0` and `pointer-events: none`; the compact landmark card remained visible with an exit button.
- Verdict: Pass for MVP presentation polish. This removes the largest HUD obstruction during close landmark inspection without breaking the normal exploration workflow. Remaining polish: later work can add a smooth camera orbit or cinematic lighting state, but static inspection is now clean enough for user review.

## 2026-06-03 Forbidden City Follow-Up

Claude rebuilt `forbidden-city.glb` via `scripts/buildForbiddenCityGlb.mjs`. Codex re-ran the full check and captured a fresh focus-mode screenshot.

- `npm run check`: passed.
- GLB audit: stayed at `14 OK, 0 WARN, 0 FAIL`.
- `forbidden-city.glb`: increased from 201 KB to 300 KB, still well under the 800 KB target.
- Focus QA view: [after screenshot](glb-visual-qa/10-forbidden-city-after-focus.png).
- Verdict: upgraded from Warn to Pass for the current MVP quality bar. The model now reads as a red-walled, yellow-roofed palace compound with a clearer central axis and courtyard hierarchy. The previous blue side artifact is no longer visible in the focus screenshot. Remaining polish: this is still a stylized low-poly miniature, not final museum-grade modeling; later passes can add stronger roof ridges, gate detail, and courtyard depth.

## Asset Verdicts

| id | Screenshot | Verdict | Evidence | Next action |
| --- | --- | --- | --- | --- |
| `hagia-sophia` | [01](glb-visual-qa/01-hagia-sophia.png) | Pass | Dome, minarets, massing, and warm material separation are readable at map zoom. It sits on the ground correctly. | Keep as the first quality reference; minor material/lighting polish only. |
| `parthenon` | [02](glb-visual-qa/02-parthenon.png) | Pass | Temple silhouette and colonnade read clearly. Boundary lines are more distracting than the model. | Keep; optional second pass on column depth and roof bevels. |
| `colosseum` | [03](glb-visual-qa/03-colosseum.png) | Pass | Strong circular amphitheater silhouette, layered outer walls, good recognizability. | Keep as a reference sample for iconic outline quality. |
| `tajmahal` | [04](glb-visual-qa/04-tajmahal.png) | Pass | Dome/minaret silhouette reads well and feels materially distinct from the dark map. | Keep; tune scale only if later label collision changes. |
| `pyramid` | [05 before](glb-visual-qa/05-pyramid.png), [05 after](glb-visual-qa/05-pyramid-after-focus.png) | Pass | First pass warned because it read as a generic stepped pyramid. After the Claude rebuild and Codex focus scale/camera tuning, the focus view reads as a Giza complex with main pyramid, second/third pyramids, plateau, and satellite small pyramids. | Keep for MVP; later final polish can add stronger stone course contrast, Sphinx silhouette, and warmer highlights. |
| `great-wall` | [06 before](glb-visual-qa/06-great-wall.png), [06 after](glb-visual-qa/06-great-wall-after.png), [focus](glb-visual-qa/06-great-wall-after-focus.png) | Pass | First pass read like a small fortress block. After commit `974479c`, the model has a lengthwise wall body, crenellations, and watchtower masses that read correctly in-map. | Keep for MVP; final polish should extend the route so it feels more like a terrain-following wall system rather than a short sample. |
| `angkor-wat` | [07 before](glb-visual-qa/07-angkor-wat.png), [07 after](glb-visual-qa/07-angkor-wat-after-focus.png) | Pass | First pass warned because the model was too compact and lacked causeway/enclosure identity. After the Claude rebuild and Codex focus-camera preset, the model has a rectangular moat, prominent causeway, double gallery rings with four gopuras, and a clearly differentiated five-tower quincunx with cross-shaped connecting galleries. | Keep for MVP; later final polish can add more gallery bay rhythm and finer lotus-bud detail. |
| `stonehenge` | [08](glb-visual-qa/08-stonehenge.png) | Pass | Ring shape and standing stones are recognizable despite low file weight. | Keep; optional texture/color variation. |
| `chichen-itza` | [09 before](glb-visual-qa/09-chichen-itza.png), [09 after](glb-visual-qa/09-chichen-itza-after.png) | Pass | First pass failed because of very low triangle count and weak silhouette. After commit `8175062`, the model has readable terraced layers, stair lines, and a summit temple. | Keep for MVP; consider contrast/lighting polish later. |
| `forbidden-city` | [10 before](glb-visual-qa/10-forbidden-city.png), [10 after](glb-visual-qa/10-forbidden-city-after-focus.png) | Pass | First pass warned because of a blue side artifact and Beijing-area model/label collision. After the Claude rebuild and Codex focus mode, it reads as a red-walled, yellow-roofed palace compound with a clearer central axis. | Keep for MVP; later final polish can add richer roof ridges, gates, and courtyard depth. |
| `notre-dame` | [11](glb-visual-qa/11-notre-dame.png) | Pass | Nave, towers, and Gothic massing read well. Nearby labels are distracting but not a model failure. | Keep; optional roof color and buttress refinement. |
| `borobudur` | [12](glb-visual-qa/12-borobudur.png) | Pass | Terraced circular/stupa silhouette is recognizable and stable. | Keep; add contrast only if it looks too dark in production. |
| `petra` | [13 before](glb-visual-qa/13-petra.png), [13 after](glb-visual-qa/13-petra-after.png), [front](glb-visual-qa/13-petra-after-front-a.png), [focus](glb-visual-qa/focus-mode-petra.png) | Pass | First pass warned because it read like stacked vertical blocks. After commit `5e7dc14`, the front view shows a rock slab, carved facade, column rhythm, recessed doorway, and upper pediment mass. The selected-landmark focus mode now uses the validated front-facing camera. | Keep for MVP; later final polish can improve material contrast and facade depth. |
| `red-fort` | [14](glb-visual-qa/14-red-fort.png) | Pass | Fort footprint, walls, and corner masses read clearly. It shares the frame with Taj Mahal but remains identifiable. | Keep; optional roof/courtyard detail. |

## Priority Order

1. Revisit coastline-aware boundaries after the model pass. The screenshots show that boundary polygons still cross water or form coarse diagonal cuts in several regions.
2. Plan the next 10 GLB expansion only after the current MVP Pass set is accepted as the quality floor.
3. For final-grade polish, revisit all Pass models against the `hagia-sophia` / `colosseum` / `tajmahal` quality references instead of treating MVP Pass as finished.
4. Consider a cinematic orbit/light polish layer after boundary quality stops distracting from the landmark view.

## Recommendation

Do not scale immediately to 30 new high-detail GLBs. The pipeline is good enough, but the product quality ceiling is now controlled by model silhouettes, label collision, and boundary-map alignment. The efficient path is:

1. Use `hagia-sophia`, `colosseum`, `tajmahal`, and `notre-dame` as the accepted quality floor.
2. Use the selected-landmark focus mode as the default QA path for detailed landmark reviews.
3. Move to coastline-aware boundary repair next; the landmark inspection path is now clean enough for MVP review.
4. Only then expand to the next 10 assets.
