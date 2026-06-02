# GLB Visual QA

Date: 2026-06-02

Scope: desktop map-view QA for the 14 current GLB landmark overrides. Screenshots were captured from the local Vite app at `http://127.0.0.1:5173/` with a hidden Chrome `1440x900` viewport. HUD panels were hidden during capture so the result focuses on the map, boundary layer, terrain, labels, and GLB silhouettes.

## Summary

- The GLB pipeline is working: 14/14 assets rendered in-map and none appeared upside down, floating high above the terrain, or fully sunk.
- Console QA found no app/runtime errors. The only captured network failures were `ERR_ABORTED` tile requests caused by rapidly jumping the camera during automation, not GLB load failures.
- The best current samples are `hagia-sophia`, `colosseum`, `tajmahal`, `notre-dame`, and `stonehenge`.
- The weakest assets from the first pass were `chichen-itza`, `petra`, `great-wall`, and `forbidden-city`.
- The biggest overall visual problem is not only model quality: large historical boundary fills and coastline-mismatched polygons still cut across seas or dominate the model view. This can make otherwise acceptable models feel rough.

## 2026-06-03 Chichen Itza Follow-Up

Claude rebuilt `chichen-itza.glb` in commit `8175062`. Codex re-ran the asset audit, full check, and a fresh map-view screenshot.

- `npm run check`: passed.
- GLB audit: improved from `13 OK, 1 WARN, 0 FAIL` to `14 OK, 0 WARN, 0 FAIL`.
- `chichen-itza.glb`: increased from 34 KB to 197 KB, still well under budget.
- Visual result: [after screenshot](glb-visual-qa/09-chichen-itza-after.png).
- Verdict: upgraded from Fail to Pass for the current MVP quality bar. It now reads as a terraced pyramid with visible stair lines and a summit temple. Remaining polish: slightly stronger highlights or selected-landmark focus mode would help it read better against the dark map.

## Asset Verdicts

| id | Screenshot | Verdict | Evidence | Next action |
| --- | --- | --- | --- | --- |
| `hagia-sophia` | [01](glb-visual-qa/01-hagia-sophia.png) | Pass | Dome, minarets, massing, and warm material separation are readable at map zoom. It sits on the ground correctly. | Keep as the first quality reference; minor material/lighting polish only. |
| `parthenon` | [02](glb-visual-qa/02-parthenon.png) | Pass | Temple silhouette and colonnade read clearly. Boundary lines are more distracting than the model. | Keep; optional second pass on column depth and roof bevels. |
| `colosseum` | [03](glb-visual-qa/03-colosseum.png) | Pass | Strong circular amphitheater silhouette, layered outer walls, good recognizability. | Keep as a reference sample for iconic outline quality. |
| `tajmahal` | [04](glb-visual-qa/04-tajmahal.png) | Pass | Dome/minaret silhouette reads well and feels materially distinct from the dark map. | Keep; tune scale only if later label collision changes. |
| `pyramid` | [05](glb-visual-qa/05-pyramid.png) | Warn | Correct form, but it reads as a generic stepped pyramid rather than Giza-specific. | Add base plateau, satellite pyramids, and warmer stone highlights. |
| `great-wall` | [06](glb-visual-qa/06-great-wall.png) | Warn | It reads more like a small fortress block than a wall line following terrain. | Rebuild as a short serpentine wall segment with towers and lengthwise footprint. |
| `angkor-wat` | [07](glb-visual-qa/07-angkor-wat.png) | Warn | Towers are visible, but the model is still too compact and lacks the causeway/enclosure identity. | Add rectangular moat/base, gallery ring, and stronger central tower hierarchy. |
| `stonehenge` | [08](glb-visual-qa/08-stonehenge.png) | Pass | Ring shape and standing stones are recognizable despite low file weight. | Keep; optional texture/color variation. |
| `chichen-itza` | [09 before](glb-visual-qa/09-chichen-itza.png), [09 after](glb-visual-qa/09-chichen-itza-after.png) | Pass | First pass failed because of very low triangle count and weak silhouette. After commit `8175062`, the model has readable terraced layers, stair lines, and a summit temple. | Keep for MVP; consider contrast/lighting polish later. |
| `forbidden-city` | [10](glb-visual-qa/10-forbidden-city.png) | Warn | The palace color/detail is visible, but a blue side artifact and nearby Great Wall label/model collision hurt the view. | Fix material/backface artifact and add label/model collision handling. |
| `notre-dame` | [11](glb-visual-qa/11-notre-dame.png) | Pass | Nave, towers, and Gothic massing read well. Nearby labels are distracting but not a model failure. | Keep; optional roof color and buttress refinement. |
| `borobudur` | [12](glb-visual-qa/12-borobudur.png) | Pass | Terraced circular/stupa silhouette is recognizable and stable. | Keep; add contrast only if it looks too dark in production. |
| `petra` | [13](glb-visual-qa/13-petra.png) | Warn | Vertical facade mass is visible, but it reads like stacked blocks, not a rock-cut cliff monument. | Rebuild as cliff slab + carved facade + darker recesses. |
| `red-fort` | [14](glb-visual-qa/14-red-fort.png) | Pass | Fort footprint, walls, and corner masses read clearly. It shares the frame with Taj Mahal but remains identifiable. | Keep; optional roof/courtyard detail. |

## Priority Order

1. Fix `petra`: current shape does not communicate the famous rock-cut facade.
2. Fix `great-wall`: current model is not wall-like enough for the landmark.
3. Fix `forbidden-city`: solve the blue side artifact and label/model overlap.
4. Add a landmark focus mode: when a user clicks a landmark, dim or simplify territory fills and suppress nearby non-selected labels/models for a cleaner inspection view.
5. Revisit coastline-aware boundaries after the model pass. The screenshots show that boundary polygons still cross water or form coarse diagonal cuts in several regions.

## Recommendation

Do not scale immediately to 30 new high-detail GLBs. The pipeline is good enough, but the product quality ceiling is now controlled by model silhouettes, label collision, and boundary-map alignment. The efficient path is:

1. Use `hagia-sophia`, `colosseum`, `tajmahal`, and `notre-dame` as the accepted quality floor.
2. Run one Claude pass on the four weak assets above.
3. Add a selected-landmark focus mode so detailed models can be appreciated without territory overlays competing with them.
4. Only then expand to the next 10 assets.
