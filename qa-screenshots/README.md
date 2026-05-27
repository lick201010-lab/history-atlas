# QA Screenshots - Coastline-Aware Sample Boundaries

These screenshots verify the five sample civilizations after upgrading their
boundaries to `coastline-aware-rough`.

| Civilization | Year | File | Expected result |
|---|---:|---|---|
| Tang | 742 | `tang-742.png` | East Asia outline follows mainland coast, with Korea and the South China coast visible. |
| Roman Republic / Empire | 117 | `rome-117.png` | Mediterranean territories are split around the sea instead of covering it as one filled polygon. |
| Islamic Caliphates | 800 | `caliphate-800.png` | North Africa, Arabia, Mesopotamia, Persia, and Central Asia follow land masses with major seas mostly left open. |
| Mughal Empire | 1700 | `mughal-1700.png` | Northern and central Indian subcontinent shape is visible, excluding Sri Lanka. |
| Maya | 700 | `maya-700.png` | Yucatan, Guatemala, Belize, and nearby Central America are visible as a land-shaped region. |

The `src/components/MapScene.jsx` change is intentionally retained as a small
rendering exception: `coastline-aware-rough` must be treated like
`rough-refined`, otherwise the new refined boundaries render with the weaker
placeholder opacity and line style.

Validation command:

```bash
npm run check
```
