# F4 Source Pilot 01 Output

Status: DONE_WITH_CONCERNS

## Files Changed

- `src/data/dynasties.json`
- `scripts/validateHistoricalData.mjs`
- `src/utils/buildCard.js`
- `src/components/MapScene.jsx`
- `src/styles.css`
- `.claude-runs/f4-source-pilot-01-output.md`

## Commands Run

```powershell
npm run validate:data
```

Result: PASS

```powershell
npm run check
```

Result: PASS

`npm run check` included `validate:data`, boundary outline tests, boundary focus tests, GLB audit, and Vite build. Vite build completed with the existing chunk-size warning for large bundles.

```powershell
npm run preview -- --port 4174
Invoke-WebRequest -Uri http://127.0.0.1:4174/ -UseBasicParsing -TimeoutSec 10
```

Result: preview started and returned HTTP 200. The temporary preview process was stopped afterward.

## Implementation Summary

- Added dynasty-level `sourceNote` and 3-item `references` arrays for exactly the five pilot ids: `tang`, `roman-republic-empire`, `islamic-caliphates`, `mughal`, and `maya`.
- Added event-level `referenceIds` for every event in those five pilot civilizations.
- Added validator rules scoped only to the five F4 source pilot ids.
- Updated card data building so civilization sources and boundary sources are separate fields.
- Updated the civilization card UI to show:
  - `文明来源`: dynasty-level source note and compact reference list.
  - event source labels under displayed key events.
  - `边界精度` and boundary source/accuracy in the existing footer.

## Risks / Follow-ups

- Browser automation was not available in this worker environment: local `node_modules` and MCP Node runtime both lacked Playwright, and no callable in-app Browser tool was exposed. I verified the local preview returned HTTP 200 and the build artifact contains the new UI labels, but did not perform a rendered browser screenshot.
- The source pilot is a curated reference/source-note layer, not a peer-reviewed citation system and not academic GIS precision.
- Future F4 batches should decide a stable reference style before expanding this schema to all 43 civilizations.

---

# F4 Source Pilot 01 Encoding Repair

Status: DONE

## Files Changed

- `src/data/dynasties.json`
- `.claude-runs/f4-source-pilot-01-output.md`

## Repair Summary

- Replaced literal `????` text in newly added F4 pilot source fields for exactly the five pilot ids: `tang`, `roman-republic-empire`, `islamic-caliphates`, `mughal`, and `maya`.
- Preserved existing `referenceIds`.
- Preserved event order.
- Did not add or invent URLs.
- Restored the Tang reference title and author as `中国历史地图集` and `谭其骧主编`.

## Commands Run

```powershell
Select-String -LiteralPath 'src\data\dynasties.json' -Pattern '\?\?\?\?' -Encoding UTF8
```

Result: PASS, no matches.

```powershell
npm run validate:data
```

Result: PASS.

```powershell
npm run check
```

Result: PASS. Vite build still reports the existing chunk-size warning.

## Risks / Follow-ups

- This repair only fixes encoding-damaged source text in the five pilot ids. It does not review source quality beyond making the existing pilot fields readable.
