# F4 Source Pilot 01 QA

Scope: `tang`, `roman-republic-empire`, `islamic-caliphates`, `mughal`, `maya`.

## Result

- Status: accepted as F4 source-system pilot.
- This does not complete F4 for all 43 civilizations.

## Data Checks

- Each pilot civilization has dynasty-level `sourceNote`.
- Each pilot civilization has a non-empty `references` array.
- Each pilot event has `referenceIds`.
- `referenceIds` point to references defined on the same civilization.
- No literal `????` encoding damage remains in `src/data/dynasties.json`.

## Verification

- `Select-String -LiteralPath 'src\data\dynasties.json' -Pattern '\?\?\?\?' -Encoding UTF8` returned no matches.
- `npm run validate:data` passed.
- `npm run check` passed.
- Browser QA passed on local preview `http://127.0.0.1:4176/`.

## Browser QA

Checked in the in-app browser:

- Tang card: event source labels, `文明来源`, `参考资料`, and `边界精度` were all present.
- Roman Republic / Empire card at BCE 27: event source labels, `文明来源`, `参考资料`, and `边界精度` were all present.
- No visible source-field encoding damage in the checked cards.

Screenshots:

- `docs/source-qa/f4-pilot-roman-source-card.png`
- `docs/source-qa/f4-pilot-roman-source-card-scrolled.png`

## Notes

- The pilot creates a curated source/reference layer, not a peer-reviewed citation system.
- Boundary source/accuracy remains separate from civilization source references.
- Expansion to all 43 civilizations should happen in controlled batches after this pilot pattern is accepted.
