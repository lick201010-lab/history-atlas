# GLB Asset Baseline

Generated from the local repository with `npm run audit:glb -- --write`.

## Summary

- Landmark GLB overrides: 27
- GLB files in public/models: 27
- Passing without warnings: 27
- Warnings: 0
- Failures: 0
- Total GLB weight: 9,242 KB

## Budget

- Target file size: < 1.5 MB; hard limit: <= 3 MB.
- Target triangles: <= 20,000; hard limit: <= 35,000.
- Images/textures are not allowed; this project uses vertex colors and simple materials.
- Every GLB override must also have a z-up orientation override in `createBuildingLayer.js`.
- `minZ` should be >= -0.01 so the base does not sink visibly into the map.

## Current Assets

| Status | id | file | size | triangles | vertices | materials | tex/img | minZ | maxZ | footprint | notes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| OK | `angkor-wat` | `angkor-wat.glb` | 152 KB | 3,722 | 3,405 | 9 | 0/0 | -0.000 | 1.198 | 0.712 | - |
| OK | `borobudur` | `borobudur.glb` | 606 KB | 18,604 | 13,972 | 5 | 0/0 | -0.000 | 0.790 | 0.550 | - |
| OK | `changan` | `changan.glb` | 466 KB | 6,066 | 11,778 | 14 | 0/0 | -0.000 | 0.318 | 0.873 | - |
| OK | `cheomseongdae` | `cheomseongdae.glb` | 379 KB | 4,896 | 9,700 | 8 | 0/0 | -0.000 | 0.996 | 0.390 | - |
| OK | `chichen-itza` | `chichen-itza.glb` | 197 KB | 2,584 | 4,812 | 11 | 0/0 | 0.000 | 0.823 | 0.550 | - |
| OK | `colosseum` | `colosseum.glb` | 687 KB | 8,992 | 17,828 | 6 | 0/0 | 0.000 | 0.605 | 0.737 | - |
| OK | `djenne-mosque` | `djenne-mosque.glb` | 179 KB | 2,766 | 4,335 | 9 | 0/0 | -0.000 | 1.055 | 0.670 | - |
| OK | `forbidden-city` | `forbidden-city.glb` | 300 KB | 4,148 | 7,375 | 14 | 0/0 | 0.000 | 0.558 | 0.605 | - |
| OK | `great-wall` | `great-wall.glb` | 161 KB | 1,992 | 3,966 | 8 | 0/0 | -0.000 | 0.545 | 1.058 | - |
| OK | `hagia-sophia` | `hagia-sophia.glb` | 750 KB | 19,228 | 17,579 | 16 | 0/0 | -0.000 | 1.459 | 0.780 | - |
| OK | `ishtar-gate` | `ishtar-gate.glb` | 278 KB | 3,584 | 6,950 | 11 | 0/0 | 0.000 | 0.985 | 0.676 | - |
| OK | `konark-sun` | `konark-sun.glb` | 410 KB | 6,444 | 10,189 | 12 | 0/0 | -0.000 | 1.135 | 0.809 | - |
| OK | `machu-picchu` | `machu-picchu.glb` | 85 KB | 984 | 1,902 | 10 | 0/0 | 0.000 | 0.369 | 0.840 | - |
| OK | `mecca-haram` | `mecca-haram.glb` | 505 KB | 12,980 | 11,778 | 12 | 0/0 | -0.000 | 1.275 | 0.882 | - |
| OK | `notre-dame` | `notre-dame.glb` | 241 KB | 3,488 | 5,968 | 9 | 0/0 | -0.000 | 0.986 | 0.687 | - |
| OK | `parthenon` | `parthenon.glb` | 397 KB | 7,400 | 9,768 | 9 | 0/0 | -0.000 | 0.894 | 0.730 | - |
| OK | `persepolis` | `persepolis.glb` | 403 KB | 7,154 | 9,927 | 10 | 0/0 | -0.000 | 0.935 | 0.810 | - |
| OK | `petra` | `petra.glb` | 129 KB | 2,044 | 2,980 | 10 | 0/0 | 0.000 | 1.210 | 0.540 | - |
| OK | `pyramid` | `great-pyramid.glb` | 96 KB | 1,540 | 2,145 | 10 | 0/0 | -0.000 | 0.650 | 0.760 | - |
| OK | `red-fort` | `red-fort.glb` | 431 KB | 13,192 | 9,777 | 8 | 0/0 | 0.000 | 0.570 | 0.638 | - |
| OK | `sanchi-stupa` | `sanchi-stupa.glb` | 305 KB | 5,918 | 7,307 | 11 | 0/0 | -0.000 | 1.135 | 0.765 | - |
| OK | `stonehenge` | `stonehenge.glb` | 52 KB | 688 | 1,220 | 4 | 0/0 | -0.000 | 0.379 | 0.520 | - |
| OK | `tajmahal` | `taj-mahal.glb` | 376 KB | 12,300 | 8,252 | 11 | 0/0 | -0.000 | 1.265 | 0.720 | - |
| OK | `temple-of-heaven` | `temple-of-heaven.glb` | 534 KB | 10,066 | 13,087 | 12 | 0/0 | 0.000 | 1.347 | 0.770 | - |
| OK | `teotihuacan` | `teotihuacan.glb` | 169 KB | 2,268 | 4,104 | 10 | 0/0 | -0.000 | 0.730 | 0.810 | - |
| OK | `terracotta-army` | `terracotta-army.glb` | 629 KB | 12,802 | 15,328 | 13 | 0/0 | -0.000 | 0.226 | 0.810 | - |
| OK | `ziggurat-ur` | `ziggurat-ur.glb` | 325 KB | 4,092 | 8,184 | 11 | 0/0 | 0.000 | 0.983 | 0.785 | - |

## How To Use This Baseline

1. Run `npm run audit:glb` after changing any GLB script, model file, or `createBuildingLayer.js` override.
2. Run `npm run audit:glb -- --write` when the baseline table itself should be refreshed.
3. Treat `WARN` rows as visual QA candidates. They are not build blockers, but they should be screenshot-tested before more GLBs are added.
4. Treat `FAIL` rows as blockers before deployment.
