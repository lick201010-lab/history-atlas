const REFINED_ACCURACY = ['literal', ['rough-refined', 'coastline-aware-rough']];
const IS_REFINED_EXPR = ['in', ['get', 'accuracy'], REFINED_ACCURACY];

export function buildFocusIds({ selectedId, hoveredId, compareIds = [] } = {}) {
  const ids = [selectedId, hoveredId, ...compareIds]
    .filter((id) => typeof id === 'string' && id.trim().length > 0);
  return [...new Set(ids)];
}

export function isFocusActive(focusIds) {
  return Array.isArray(focusIds) && focusIds.length > 0;
}

function refinedCase(refined, plain) {
  return ['case', IS_REFINED_EXPR, refined, plain];
}

export function boundaryOpacityExpression({
  focusIds,
  refined,
  plain,
  mutedRefined,
  mutedPlain,
}) {
  const base = refinedCase(refined, plain);
  if (!isFocusActive(focusIds)) return base;

  return [
    'case',
    ['in', ['get', 'id'], ['literal', focusIds]],
    base,
    refinedCase(mutedRefined, mutedPlain),
  ];
}
