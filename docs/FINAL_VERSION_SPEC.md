# History Atlas Final Version Specification

This file defines what "final complete version" means. It is not an MVP definition and not an online milestone definition.

The final product should feel like a polished, credible, explorable 3D historical map work: dark atlas clarity, physical sand-table terrain, readable historical boundaries, and miniature landmark models that feel crafted rather than placeholder icons.

## Completion Definition

The final complete version requires all six gates below to pass.

## F1 Visual Foundation

Pass criteria:

- Ocean is flat, deep, and clean, with no visible underwater mountain relief.
- Land relief is readable but not noisy.
- Coastlines are crisp enough to support boundary reading.
- Boundary glow is layered and restrained, not fluorescent debugging paint.
- HUD is polished and does not block primary exploration.
- Desktop and mobile screenshots pass visual review.

Required checks:

- `npm run check`
- visual foundation screenshots
- browser console review

## F2 Boundary Refinement

Pass criteria:

- All 43 civilizations have at least 3 phase features.
- Total boundary features are at least 129.
- Every boundary feature has `sourceNote` and `accuracyNote`.
- Coastal civilizations are coast-aware.
- Large inland empires avoid simple convex blobs.
- Zoom 4-5 views do not show obvious rectangles, random internal line spaghetti, or careless cross-sea fills.

Required checks:

- `npm run validate:data`
- `npm run check`
- browser screenshot QA for each accepted batch

## F3 Landmark Model Quality

Pass criteria:

- All 30 landmarks have A/B quality GLB or equivalent 3D models.
- The core 10 landmarks reach A quality: Hagia Sophia, Forbidden City, Angkor Wat, Great Pyramid, Colosseum, Parthenon, Taj Mahal, Chichen Itza, Great Wall, Petra.
- No model is upside down, floating, buried, black-material broken, or visibly placeholder quality.
- Every model has at least one map-view QA screenshot.

Required checks:

- GLB audit
- map-view model screenshots
- browser console review

## F4 Content And Sources

Pass criteria:

- All 43 civilizations include `summary`, `events`, `tags`, `importance`, `legacy`, `relatedLandmarks`, and `references`.
- Key events include year/type/source context where possible.
- UI shows source and accuracy notes.
- Validator blocks missing source fields for final-phase data.

Required checks:

- `npm run validate:data`
- content field audit

## F5 Product Interaction And Mobile Experience

Pass criteria:

- Desktop and mobile users can select a year, search civilizations, select a civilization, view boundaries, view landmarks, and open details.
- Mobile uses a comfortable bottom sheet or drawer model.
- No horizontal overflow, text clipping, or hard-to-tap controls.
- Civilization cards and landmark cards are linked.
- Important timeline events can fly to related regions.

Required checks:

- desktop browser smoke
- mobile browser smoke
- interaction path screenshots

## F6 Performance, Release, And Packaging

Pass criteria:

- Production site homepage, SPA fallback, JS, CSS, and GLB assets return 200.
- No severe console errors or page exceptions.
- GLB and large JS resources have a reasonable loading strategy.
- SEO/share metadata and a public work introduction exist.
- Release tag and rollback notes exist.

Required checks:

- `npm run check`
- production smoke
- release report

## Current Status Rule

Until every gate above passes, the project must be called an online milestone or phase build, not the final complete version.
