# Agent Operating Notes

## Default Work Habit

For this project, every troubleshooting or delivery task should follow this loop:

1. Verify the current state before changing anything.
2. Identify the most likely cause with evidence.
3. Apply the smallest safe fix.
4. Re-verify after the fix.
5. Record any follow-up work that would make the setup more reliable.

When the issue touches deployment, networking, GitHub, Aliyun, Caddy, DNS, or local browser access, include the exact evidence gathered: command results, reachable/unreachable domains, active ports, and the final working URL.

## Collaboration Stance

Codex is a project collaborator, not a passive confirmer. If the user's idea, assumption, or requested direction appears technically wrong, inefficient, risky, or misaligned with the product goal, Codex must say so directly, explain the evidence, and propose a better path. Agreement should be earned by the facts of the situation, not given automatically.

This is especially important for:

- Claude/Codex task allocation.
- Architecture choices.
- Deployment and infrastructure decisions.
- Visual quality tradeoffs.
- Data accuracy and historical representation.
- Any change that may create technical debt or weaken the product experience.

## Current Deployment Preference

- Use GitHub as the source repository.
- Use the existing Aliyun server when practical.
- Prefer Caddy on the current server; do not introduce Nginx unless the user explicitly decides to migrate.
- Prefer local Windows build plus uploading `dist/` for this project because the current server has limited memory.

## Network Troubleshooting Note

If Google, Aliyun OAuth, or other login pages fail while the user says VPN is enabled:

1. Check whether the target domain resolves.
2. Check whether direct HTTPS works.
3. Check whether the local proxy port is listening, usually `127.0.0.1:7890` for Clash Verge.
4. Test the same target through the proxy.
5. If proxy test works but direct browser access fails, enable the Windows current-user proxy:

   ```powershell
   Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyEnable -Type DWord -Value 1
   Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyServer -Type String -Value '127.0.0.1:7890'
   ```

6. Re-test the target URL.

WinHTTP proxy sync may require administrator permission. Browser access usually only needs the current-user proxy setting.

## Incident Record: atlas.ckl.hk First Deployment

Date: 2026-05-25

Goal: deploy the local Vite history-atlas build to the existing Aliyun server used by the lottery project.

Verification before changes:

- DNS for `atlas.ckl.hk` resolved to `47.237.181.181` from local DNS, Google DNS, and Cloudflare DNS.
- `npm run check` passed locally: data validation passed and Vite production build completed.
- SSH to `root@47.237.181.181` succeeded.
- `/etc/caddy/Caddyfile` had no existing `atlas.ckl.hk` block.

Fix/deployment performed:

- Created `/opt/history-atlas/dist` on the server.
- Backed up `/etc/caddy/Caddyfile`.
- Added a dedicated Caddy site block:

  ```caddy
  atlas.ckl.hk {
      root * /opt/history-atlas/dist
      file_server
      try_files {path} /index.html
      encode gzip zstd
  }
  ```

- Uploaded local `dist/` with `scp`.
- Fixed static file permissions with `chmod -R a+rX /opt/history-atlas/dist`.
- Ran `caddy validate --config /etc/caddy/Caddyfile`.
- Reloaded Caddy with `systemctl reload caddy`.

Verification after changes:

- `https://atlas.ckl.hk` returned `200 OK`.
- Production HTML returned `<!doctype html>`.
- SPA fallback path returned `200 OK`.
- JS and CSS assets returned `200 OK`.
- Caddy logs showed Let's Encrypt authorization finalized and certificate obtained successfully for `atlas.ckl.hk`.

Follow-up improvement:

- `scp -r dist/*` leaves old hashed asset files on the server. This is acceptable for early MVP use because the static bundle is small. Later, replace it with `rsync --delete` or a small deployment script.

## Incident Record: Deploy Script Validation

Date: 2026-05-25

Goal: add and validate `npm run deploy` for local Windows deployment to `atlas.ckl.hk`.

Verification before accepting the script:

- Confirmed the script only targets `/opt/history-atlas/dist`.
- Confirmed it does not touch `/opt/lottery-analysis`.
- Confirmed it does not edit or reload Caddy.
- Ran the script for real instead of only reading it.

Issue found:

- The first run uploaded files successfully but failed during the curl homepage check.
- Root cause: PowerShell passed `$null` poorly to native `curl.exe -o`, which made curl argument parsing unstable.

Fix applied:

- Replaced `-o $null` with `-o NUL`.
- Quoted URL variables passed to `curl.exe`.

Verification after fix:

- `npm run deploy` completed successfully.
- Local `npm run check` passed during the deploy.
- `scp` upload succeeded.
- Remote `chmod -R a+rX /opt/history-atlas/dist` succeeded.
- `https://atlas.ckl.hk/` returned `200`.
- Random SPA fallback path returned `200`.
- Main JS asset returned `200`.

PowerShell note:

- For native Windows commands, prefer explicit Windows null output `NUL` over PowerShell `$null` when passing arguments to executables like `curl.exe`.

## Incident Record: Online First-View Stabilization

Date: 2026-05-25

Goal: improve the public `https://atlas.ckl.hk` first-view experience after the site was already deployed.

Verification before changes:

- Production homepage returned `200 OK`.
- Production HTML, CSS, and JS were reachable.
- Initial build emitted a single large app bundle around 1.55 MB minified.
- External map tile dependencies were checked directly.
- A glyph URL test returned `404`, and the app does not currently render MapLibre text layers.

Fixes applied:

- Added a centered loading HUD while MapLibre initializes terrain, boundaries, and building layers.
- Added a non-blocking map warning when external map tiles or terrain resources are slow/failing.
- Added a 4.5 second readiness fallback so the loading HUD cannot cover the UI forever on bad networks.
- Added `preconnect` hints for CARTO basemap and AWS terrain domains.
- Split the Vite build into `react`, `maplibre`, `three`, and app entry chunks with `manualChunks`.
- Removed the unused MapLibre `glyphs` URL to avoid a known-bad external font dependency.
- Upgraded `scripts/deploy.ps1` to verify every production JS/CSS chunk, not just the entry JS.

Verification after changes:

- `npm run check` passed.
- `npm run deploy` passed.
- Production homepage returned `200`.
- SPA fallback returned `200`.
- All five production JS/CSS chunks returned `200`.
- The app entry chunk dropped to roughly 135 KB minified / 43 KB gzip. MapLibre remains a large independent cached chunk, so the Vite size warning is still expected.

## Incident Record: Online Browser QA And Responsive Fixes

Date: 2026-05-25

Goal: verify the public site in real browser conditions and fix P0/P1 issues before continuing product work.

Verification method:

- Used command-level checks for production HTML, SPA fallback, JS/CSS chunks, CARTO basemap tiles, and AWS DEM tiles.
- Used Edge headless through the Chrome DevTools Protocol for desktop `1365x768` and mobile `390x844` browser checks.
- Captured screenshots locally for inspection; these files are ignored by Git via `online-*.png`.

Findings:

- Production homepage, SPA fallback, JS/CSS chunks, basemap tiles, and DEM tile returned `200`.
- Desktop and mobile had no console errors, no page exceptions, no failed network requests, and no bad `>=400` production responses.
- The timeline range stayed correct: `-2000` to `2025`.
- MapLibre canvas rendered on both desktop and mobile.
- Initial browser QA found layout overlap: the desktop info panel touched the timeline, and the mobile HUD panels were too dense.
- A later mobile pass found the info panel height fix caused dynasty/building list visual overlap inside the panel.

Fixes applied:

- Reduced desktop info panel max height so it clears the timeline.
- Repositioned mobile view controls and layer controls into full-width rows.
- Reworked mobile info panel to fit between controls and timeline.
- Hid the era narrative panel on mobile to keep the core map/list/timeline workflow usable.
- Made the mobile info panel itself scrollable, with inner dynasty/building lists allowed to flow naturally.

Verification after fixes:

- `npm run check` passed.
- `npm run deploy` passed.
- Desktop browser QA: no overlap among controls, info panel, title, top-right buttons, and timeline.
- Mobile browser QA: no overlap among controls, info panel, top-right buttons, title, and timeline; info panel `overflow-y` is `auto`.
- No console errors, no failed requests, and no bad production responses after final mobile run.

## Incident Record: Landmark Archive Card

Date: 2026-05-25

Goal: add the first building-focused interaction layer without changing the current map style.

Verification before changes:

- `npm run validate:data` passed before feature wiring, but landmarks only carried render fields and did not have enough copy for an archive card.
- The existing building list and 3D custom layer already exposed building ids, coordinates, and year ranges.

Fixes applied:

- Added `LandmarkCard` for building details.
- Wired building selection from the 3D map click handler, the right-side building list, and search results.
- Opening a building card now closes the civilization card to avoid panel overlap.
- Dragging the timeline closes the building card when the selected building is no longer active in that year.
- Added `summary`, `region`, `importance`, and `relatedDynastyIds` to all 30 landmarks.
- Extended the historical data validator so every landmark must have archive-card fields and valid dynasty references.

Verification after changes:

- `npm run validate:data` passed: 43 dynasties, 43 boundaries, 30 landmarks.
- `npm run check` passed.
- Local browser CDP smoke test verified the map canvas rendered, the building list opened a building archive card, and the card contained summary text.
- Local browser CDP smoke test set the year to 700, opened `changan`, then moved the timeline to 2025; the card closed because `changan` was outside its active range.
- `npm run deploy` passed and confirmed `https://atlas.ckl.hk`, SPA fallback, and all 5 JS/CSS chunks returned `200`.
- Online browser CDP smoke test opened `https://atlas.ckl.hk`, confirmed the map canvas rendered, clicked the building list, and verified the building archive card appeared with Chinese summary text.
- A Windows PowerShell encoding issue initially wrote new landmark summaries as question marks; the data was rewritten with Unicode-safe strings and re-deployed. Final online smoke test confirmed `hasQuestionMarks: false`.

Follow-up improvement:

- The current card uses procedural metadata and text summaries. A later content pass should add source notes for individual landmark dates and replace placeholder 3D shapes with optimized GLB assets for the most important monuments.

## Incident Record: Atlas Theme Visual Pass 3 Deployment

Date: 2026-05-27

Goal: publish the improved antique atlas visual theme to GitHub and the Aliyun production site.

Verification before deployment:

- Working branch was `main`, ahead of `origin/main` by 10 commits.
- Latest implementation commit was `b22c154 feat: improve atlas ocean and relief styling`.
- `npm run check` passed locally: data validation passed and the Vite production build completed.
- Local browser QA confirmed dark theme and atlas theme both rendered. Atlas mode showed separated deep blue-green ocean, warm parchment land, and stronger relief. `public/favicon.svg` returned `200` locally.

Deployment performed:

- Pushed `main` to `https://github.com/lick201010-lab/history-atlas.git`.
- Ran `npm run deploy`, which performed local check/build, uploaded `dist/*` to `root@47.237.181.181:/opt/history-atlas/dist/`, fixed permissions with `chmod -R a+rX`, and verified the live site.

Verification after deployment:

- `https://atlas.ckl.hk/` returned `200` with `Content-Type: text/html; charset=utf-8`.
- Random SPA fallback path returned `200`.
- All five production JS/CSS chunks returned `200`.
- `https://atlas.ckl.hk/favicon.svg` returned `200` with `Content-Type: image/svg+xml`.
- Online browser QA captured desktop screenshots for dark and atlas modes. Both rendered with three canvases present, and the atlas theme toggle changed `body/html data-theme` from `dark` to `atlas`.
- Browser console had no errors. Network `net::ERR_ABORTED` entries were tile requests canceled during camera/theme switching, not production HTTP errors.

Follow-up improvement:

- The atlas theme is now good enough as the visual baseline. Future visual work should focus on hand-drawn map ornamentation, better labels, and refined monument models rather than more global filter tuning.

## Incident Record: Hagia Sophia Procedural GLB Polish

Date: 2026-05-31

Goal: improve the Byzantine landmark model so it feels less like a flat map icon and closer to a refined miniature building.

Verification before changes:

- `public/models/hagia-sophia.glb` loaded successfully in the local app, but browser screenshots showed a large flat wall, weak facade detail, and low contrast compared with the reference miniature.
- The current architecture already supports an async GLB override for `hagia-sophia`, so the safest scope was to improve `scripts/buildHagiaSophiaGlb.mjs` and regenerate the GLB only.

Fixes applied:

- Added a rotated-box helper for dome rib details.
- Added richer west entrance geometry: layered narthex, facade pilasters, dark arch recesses, cornice strips, and small side domes.
- Added side arcade/cornice/pilaster detail to reduce long-wall flatness from common map camera angles.
- Lowered the main nave wall slightly so roof and dome layers are more visible.
- Darkened arch/shadow material and lightened cornice material so detail remains readable in the dark theme.
- Regenerated `public/models/hagia-sophia.glb`; final local asset is about 999 KB and roughly 21k triangles.

Verification after changes:

- `npm run validate:data` passed.
- `npm run build` passed.
- Local browser CDP QA loaded `http://127.0.0.1:5173/`, focused Istanbul, confirmed `/models/hagia-sophia.glb` returned `200`, and captured a screenshot with no console errors or failed network requests.

Follow-up improvement:

- This procedural pass is an improvement, but it still does not reach the quality of a dedicated artist-made reference model. For the next quality jump, use a real asset pipeline: Blender/asset kitbash or sourced CC0/paid GLB, decimate to web scale, bake simple materials/AO, then replace the procedural GLB through the existing override path.

## Incident Record: Landmark GLB Overlap and Depth Cleanup

Date: 2026-06-01

Goal: fix the rough/buggy landmark presentation around the Forbidden City and Petra without changing the historical data or the main map style.

Verification before changes:

- Browser QA showed the Beijing landmark cluster could visually merge into a large blue plate at close zoom, especially near Forbidden City / Great Wall / Temple of Heaven.
- Petra read more like a flat sandstone block than a carved facade.
- The issue was not just one GLB material. It combined oversized close-zoom model scale, aura/beam effects, cool fill lighting, hidden helper meshes still writing depth, and map depth values cutting through landmark meshes at steep pitch.

Fixes applied:

- Rebuilt `public/models/forbidden-city.glb` from `scripts/buildForbiddenCityGlb.mjs` with smaller tiled hip-roof modules, warmer base colors, compound walls, gatehouse, central halls, side corridors, and no oversized roof slab.
- Rebuilt `public/models/petra.glb` from `scripts/buildPetraGlb.mjs` with staggered sandstone cliff masses, carved facade depth, colonnade detail, shadow cuts, and more natural warm materials.
- Updated `src/map/createBuildingLayer.js` so close-up landmarks shrink more aggressively, reducing overlap in dense regions.
- Reduced aura, disc, and beam opacity/size so markers support the model instead of covering it.
- Changed the fill light from cool blue to warm low-intensity light.
- Hid dark-theme tree/house helper meshes with `object.visible = false` and disabled depth writing so invisible objects cannot create depth artifacts.
- Cleared the MapLibre depth buffer before rendering landmarks, keeping landmark internal 3D depth while preventing terrain/fill layers from slicing through models.

Verification after changes:

- `npm run validate:data` passed: 43 dynasties, 89 boundaries, 30 landmarks, 5 refined samples, 15 model profiles.
- `npm run build` passed. The only output was the expected Vite large-chunk warning for MapLibre/Three bundles.
- Browser QA opened `http://127.0.0.1:5177/`; the app title, map canvas, starfield canvases, and Chinese UI rendered with no browser console errors or warnings.
- Local QA screenshots confirmed Forbidden City no longer appears as a giant overlapping blue slab, Petra reads as a warmer carved facade, and Beijing close-up landmarks no longer merge as badly.

Follow-up improvement:

- This is still a procedural low-poly repair, not the final art direction. To reach the reference-model quality the user wants, move priority landmarks to a real asset pipeline: Blender or sourced GLB, modeled with proper silhouette, baked ambient occlusion, material simplification, Draco/mesh optimization if needed, and replacement through the existing GLB override path.

## Incident Record: Dark Theme Clarity Pass

Date: 2026-06-02

Goal: improve readability and terrain clarity after the previous feature pass, without changing data, map logic, model assets, or the overall dark "civilization star map" direction.

Verification before changes:

- `npm run check` passed, and browser QA showed the app was functionally healthy.
- Desktop screenshots still felt too soft: cloud overlays, global vignette, text glow, and heavy glass blur made terrain and HUD text read slightly fuzzy.

Fixes applied:

- Increased HUD panel opacity and border contrast so text sits on a firmer surface.
- Lightened `--text-dim` and `--text-faint` so labels remain readable without increasing font size.
- Reduced global vignette and inner map shadow strength to let terrain detail come through.
- Reduced cloud overlay alpha and blur so it reads as atmosphere rather than a screen-wide soft-focus layer.
- Lowered backdrop blur on controls, search results, info panels, timeline, cards, compare panel, filter panel, and tooltips.
- Reduced title/year text glows to keep the cinematic tone while sharpening letter edges.

Verification after changes:

- `npm run check` passed: data validation and Vite production build both succeeded.
- Browser QA at `http://127.0.0.1:5173/` rendered three canvases, opened a civilization card, and had no console errors or warnings.
- Desktop and card screenshots confirmed clearer text, cleaner terrain, and no new panel/timeline overlap.

Follow-up improvement:

- This pass improves clarity but does not solve the deeper map-boundary accuracy issue. The next visual-quality jump should focus on coast-aware/historical boundary geometry and priority GLB replacement, not more global blur tuning.
