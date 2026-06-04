# Release Readiness - 2026-06-04

Target: public MVP launch for `https://atlas.ckl.hk/`.

## Current Verdict

Status: Go for MVP launch, with known non-blocking limitations documented below.

The current build is suitable for a first public launch as a visual historical atlas prototype. It is not yet a final academic GIS product or museum-grade 3D model library.

Final pre-launch deploy: `npm run deploy` succeeded on 2026-06-03 after commit `ec37fcf`, followed by a passing `npm run smoke:release`.

## Hard Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Git clean before QA | Pass | `git status --short --branch` showed `main...origin/main` before this release pass. |
| Full local check | Pass | `npm run check` passed on 2026-06-03. |
| Historical data validation | Pass | 43 dynasties, 91 boundaries, 30 landmarks, 5 refined samples. |
| Boundary outline test | Pass | `npm run test:boundary-outlines` passed. |
| Boundary focus test | Pass | `npm run test:boundary-focus` passed. |
| GLB asset audit | Pass | 14 OK, 0 WARN, 0 FAIL. |
| Production build | Pass | `vite build` completed; only existing large-chunk warning. |
| Production HTTP | Pass | Latest deploy verified homepage, SPA fallback, and 5 JS/CSS chunks as HTTP 200. |
| Release smoke desktop | Pass | `npm run smoke:release` desktop run opened year 1250 and selected Maya civilization. |
| Release smoke mobile | Pass | `npm run smoke:release` mobile run opened year 1250 and selected Maya civilization. |
| Console/runtime errors | Pass | Release smoke found 0 console errors and 0 page exceptions. |
| App asset 400+ responses | Pass | Release smoke found 0 bad app responses. |
| Public docs | Pass | README, acceptance checklist, known issues, work log, and Obsidian notes were updated for the launch workflow. |
| Final deploy | Pass | `npm run deploy` uploaded `dist/*`, fixed permissions, and verified homepage, SPA fallback, and 5 JS/CSS chunks as HTTP 200. |

## Release Smoke Evidence

Command:

```bash
npm run smoke:release
```

Output summary:

```json
{
  "appUrl": "https://atlas.ckl.hk/",
  "failures": [],
  "badResponses": 0,
  "pageExceptions": 0,
  "consoleErrors": 0,
  "nonCanceledFailures": 0
}
```

Artifacts:

- `docs/release-qa/release-smoke-manifest.json`
- `docs/release-qa/release-desktop-1250-maya.png`
- `docs/release-qa/release-mobile-1250-maya.png`

## What Was Verified

- The site opens at `https://atlas.ckl.hk/`.
- MapLibre canvas initializes.
- Timeline slider exists and can be set to year `1250`.
- Desktop viewport `1440x900` can open a civilization card.
- Mobile viewport `390x844` can open a civilization card without horizontal overflow.
- Selecting `玛雅文明` opens a civilization card, not a landmark card.
- The loading overlay disappears before screenshots are taken.
- No app console errors, page exceptions, or bad app responses were detected.
- Mobile smoke has no horizontal overflow. Desktop smoke records strict scroll-width overflow from the wide HUD layout, but the screenshot remains visually acceptable for MVP.

## Launch-Accepted Limitations

These are acceptable for the first public launch and should not block tomorrow's release:

- Historical boundaries are rough-refined, not precise academic borders.
- External raster tiles and DEM tiles remain runtime dependencies.
- Vite still reports large chunk warnings because MapLibre and Three.js are heavy.
- 3D landmarks are stylized low-poly miniatures, not final museum-grade models.
- Desktop can have wide fixed HUD layout, but mobile release smoke shows no horizontal overflow.
- This report, `README.md`, `docs/ACCEPTANCE.md`, and `docs/KNOWN_ISSUES.md` are the authoritative launch docs.

## Do Not Start Before Launch

Avoid these before the first public launch unless a blocking bug appears:

- Broad boundary expansion to all 43 civilizations.
- Adding many new GLB models.
- Changing map engine, projection, or tile providers.
- Big visual redesign of the HUD.
- Nginx/server migration.

## Recommended Launch-Day Checklist

1. Run `git status --short --branch`.
2. Run `npm run check`.
3. Run `npm run smoke:release`.
4. Open `https://atlas.ckl.hk/` manually on desktop.
5. Open `https://atlas.ckl.hk/` manually on phone or narrow browser viewport.
6. Drag timeline to `1250`.
7. Click one civilization and one landmark.
8. If no hard blocker appears, launch.

## Next Work After Launch

1. Run another GLB visual QA pass on the public site rather than local only.
2. Refine the weakest 1-2 landmark models if public feedback notices them.
3. Continue boundary precision work in small batches.
4. Add source/citation fields to priority civilizations.
5. Plan performance chunking and tile-cache work after the MVP is stable.
