# Claude Run Review: Cocos Byzantine Sample

Date: 2026-06-07

## Context

The user asked Claude to create a Cocos Creator 3.8 mobile game sample for the Byzantine/Eastern Mediterranean scenario. Codex then reviewed, repaired, and integrated the result.

This is a sidecar mobile-game validation path under the F5 product/mobile experience direction. It is not the final product and does not replace the React/MapLibre web project.

## Accepted Scope

- `mini-game/`

## Codex Repairs

- Fixed Cocos engine package configuration so Creator 3.8.8 asset worker can initialize.
- Mounted `Bootstrap` on `Game` in `assets/main/Main.scene`.
- Rewrote the six runtime TypeScript files to remove broken mojibake/import risk.
- Re-exported Byzantine data from the current main project.
- Rewrote unreadable Cocos docs.

## Verification

Passed:

- `node mini-game/tools/exportByzantineData.mjs`
- `npm run validate:data`
- `npm run check`
- Cocos Creator 3.8.8 open/import sanity check
- Cocos-bundled TypeScript `transpileModule` check for all runtime scripts
- Read-only subagent structure/log review

Not yet passed:

- Cocos Preview visual QA
- Web Desktop build screenshot QA
- WeChat developer tool QA
- Douyin developer tool QA
- Mobile device QA

## Acceptance

Accepted as a structural Cocos sample baseline only. Not accepted as a final visual migration.
