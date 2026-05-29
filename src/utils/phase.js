// Phase helpers for sample civilizations whose boundaries are split into
// rise / peak / decline features. Non-sample dynasties return null.

export const PHASE_LABELS = {
  rise: '兴起期',
  peak: '鼎盛期',
  decline: '衰落/转型期',
};

// Only these sample civilizations surface a phase in the info card.
// Other dynasties may carry phase data on their boundary features, but
// per spec the phase indicator stays limited to the curated samples.
export const PHASE_SAMPLE_IDS = new Set([
  'tang',
  'roman-republic-empire',
  'islamic-caliphates',
  'mughal',
  'maya',
]);

// Pick the boundary feature whose [startYear, endYear] contains `year`.
// Falls back to the nearest feature so a locked card never goes blank.
export function pickPhaseFeature(features, year) {
  if (!Array.isArray(features) || features.length === 0) return null;
  if (features.length === 1) return features[0];

  const sorted = [...features].sort(
    (a, b) => (a.properties?.startYear ?? 0) - (b.properties?.startYear ?? 0),
  );

  for (const feature of sorted) {
    const startYear = feature.properties?.startYear;
    const endYear = feature.properties?.endYear;
    if (
      typeof startYear === 'number'
      && typeof endYear === 'number'
      && year >= startYear
      && year <= endYear
    ) {
      return feature;
    }
  }

  if (year < (sorted[0].properties?.startYear ?? 0)) return sorted[0];
  return sorted[sorted.length - 1];
}
