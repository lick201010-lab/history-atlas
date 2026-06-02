# GLB Asset Baseline

Generated from the local repository with `npm run audit:glb -- --write`.

## Summary

- Landmark GLB overrides: 14
- GLB files in public/models: 14
- Passing without warnings: 14
- Warnings: 0
- Failures: 0
- Total GLB weight: 4,337 KB

## Budget

- Target file size: < 1.5 MB; hard limit: <= 3 MB.
- Target triangles: <= 20,000; hard limit: <= 35,000.
- Images/textures are not allowed; this project uses vertex colors and simple materials.
- Every GLB override must also have a z-up orientation override in `createBuildingLayer.js`.
- `minZ` should be >= -0.01 so the base does not sink visibly into the map.

## Current Assets

| Status | id | file | size | triangles | vertices | materials | tex/img | minZ | maxZ | footprint | notes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| OK | `angkor-wat` | `angkor-wat.glb` | 110 KB | 2,834 | 2,409 | 7 | 0/0 | -0.000 | 0.996 | 0.715 | - |
| OK | `borobudur` | `borobudur.glb` | 606 KB | 18,604 | 13,972 | 5 | 0/0 | -0.000 | 0.790 | 0.550 | - |
| OK | `chichen-itza` | `chichen-itza.glb` | 197 KB | 2,584 | 4,812 | 11 | 0/0 | 0.000 | 0.823 | 0.550 | - |
| OK | `colosseum` | `colosseum.glb` | 687 KB | 8,992 | 17,828 | 6 | 0/0 | 0.000 | 0.605 | 0.737 | - |
| OK | `forbidden-city` | `forbidden-city.glb` | 201 KB | 2,582 | 4,858 | 13 | 0/0 | -0.000 | 0.623 | 0.663 | - |
| OK | `great-wall` | `great-wall.glb` | 108 KB | 1,332 | 2,637 | 6 | 0/0 | -0.000 | 0.492 | 0.710 | - |
| OK | `hagia-sophia` | `hagia-sophia.glb` | 750 KB | 19,228 | 17,579 | 16 | 0/0 | -0.000 | 1.459 | 0.780 | - |
| OK | `notre-dame` | `notre-dame.glb` | 241 KB | 3,488 | 5,968 | 9 | 0/0 | -0.000 | 0.986 | 0.687 | - |
| OK | `parthenon` | `parthenon.glb` | 397 KB | 7,400 | 9,768 | 9 | 0/0 | -0.000 | 0.894 | 0.730 | - |
| OK | `petra` | `petra.glb` | 129 KB | 2,044 | 2,980 | 10 | 0/0 | 0.000 | 1.210 | 0.540 | - |
| OK | `pyramid` | `great-pyramid.glb` | 53 KB | 892 | 1,148 | 6 | 0/0 | 0.000 | 0.680 | 0.710 | - |
| OK | `red-fort` | `red-fort.glb` | 431 KB | 13,192 | 9,777 | 8 | 0/0 | 0.000 | 0.570 | 0.638 | - |
| OK | `stonehenge` | `stonehenge.glb` | 52 KB | 688 | 1,220 | 4 | 0/0 | -0.000 | 0.379 | 0.520 | - |
| OK | `tajmahal` | `taj-mahal.glb` | 376 KB | 12,300 | 8,252 | 11 | 0/0 | -0.000 | 1.265 | 0.720 | - |

## How To Use This Baseline

1. Run `npm run audit:glb` after changing any GLB script, model file, or `createBuildingLayer.js` override.
2. Run `npm run audit:glb -- --write` when the baseline table itself should be refreshed.
3. Treat `WARN` rows as visual QA candidates. They are not build blockers, but they should be screenshot-tested before more GLBs are added.
4. Treat `FAIL` rows as blockers before deployment.

