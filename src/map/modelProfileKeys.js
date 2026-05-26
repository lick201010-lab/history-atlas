// Single source of truth for valid landmark.modelProfile values.
//
// This array is imported by:
//   - src/map/createBuildingLayer.js to dispatch each id to its procedural builder
//   - scripts/validateHistoricalData.mjs to validate landmarks.json
//
// Adding a new profile here without adding a matching builder in
// createBuildingLayer.js will throw at module load via assertProfileCoverage.
// Adding it without listing it here will be caught by the data validator.

export const MODEL_PROFILE_KEYS = Object.freeze([
  // Batch 1
  'palace',
  'pyramid',
  'colosseum',
  'parthenon',
  'tajmahal',
  // Batch 2
  'forbidden-city',
  'great-wall',
  'mecca-haram',
  'angkor-wat',
  'borobudur',
  // Batch 3
  'terracotta-army',
  'machu-picchu',
  'stonehenge',
  'persepolis',
  'chichen-itza',
]);

/**
 * Assert that every profile key has a matching builder function.
 * Called at module load by createBuildingLayer.js so any drift between
 * code and data is caught immediately instead of silently rendering a
 * default cube where the user expected a temple.
 */
export function assertProfileCoverage(profilesMap) {
  const missing = [];
  const extra = [];
  for (const key of MODEL_PROFILE_KEYS) {
    if (typeof profilesMap[key] !== 'function') missing.push(key);
  }
  for (const key of Object.keys(profilesMap)) {
    if (!MODEL_PROFILE_KEYS.includes(key)) extra.push(key);
  }
  if (missing.length || extra.length) {
    const parts = [];
    if (missing.length) parts.push(`missing builders for [${missing.join(', ')}]`);
    if (extra.length) parts.push(`builders present but not in MODEL_PROFILE_KEYS: [${extra.join(', ')}]`);
    throw new Error(`createBuildingLayer profile coverage mismatch: ${parts.join('; ')}`);
  }
}
