// Build a unified "civilization dossier" card from a dynasty record plus the
// matching boundary feature and landmark lookup. Pure function — no React.

export function buildCardData(dynasty, boundary, landmarksById) {
  if (!dynasty) return null;
  const props = boundary?.properties || {};
  const related = (dynasty.relatedLandmarks || [])
    .map((id) => landmarksById?.get(id))
    .filter(Boolean);
  return {
    id: dynasty.id,
    dynasty: dynasty.name,
    nameEn: dynasty.nameEn,
    startYear: dynasty.startYear,
    endYear: dynasty.endYear,
    capital: dynasty.capital?.name,
    region: dynasty.region,
    summary: dynasty.summary,
    color: dynasty.color,
    tags: dynasty.tags || [],
    importance: dynasty.importance,
    legacy: dynasty.legacy,
    events: dynasty.events || [],
    relatedLandmarks: related,
    accuracyLabel: props.accuracyLabel,
    accuracyNote: props.accuracyNote,
    sourceNote: props.sourceNote,
  };
}
