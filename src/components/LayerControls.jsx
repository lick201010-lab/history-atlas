import { useMemo, useState } from 'react';

export default function LayerControls({
  dynasties,
  landmarks,
  layerVisibility,
  onLayerVisibilityChange,
  onSelectDynasty,
  onSelectBuilding,
}) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const dynastyMatches = dynasties
      .filter((item) => `${item.name} ${item.nameEn} ${item.capital.name} ${item.region}`.toLowerCase().includes(normalized))
      .slice(0, 5)
      .map((item) => ({ kind: '文明', id: item.id, label: item.name, meta: `${item.capital.name} · ${item.region}`, item }));
    const buildingMatches = landmarks
      .filter((item) => `${item.name} ${item.typeLabel || item.type}`.toLowerCase().includes(normalized))
      .slice(0, 4)
      .map((item) => ({ kind: '建筑', id: item.id, label: item.name, meta: item.typeLabel || item.type, item }));
    return [...dynastyMatches, ...buildingMatches].slice(0, 7);
  }, [dynasties, landmarks, query]);

  const toggleLayer = (key) => {
    onLayerVisibilityChange((current) => ({ ...current, [key]: !current[key] }));
  };

  const handlePick = (match) => {
    if (match.kind === '文明') onSelectDynasty(match.item, { fromSearch: true });
    else onSelectBuilding(match.item);
    setQuery('');
  };

  return (
    <div className="layer-controls">
      <div className="layer-row" role="group" aria-label="地图图层">
        <button type="button" className={`chip ${layerVisibility.territories ? 'active' : ''}`} onClick={() => toggleLayer('territories')}>
          领土
        </button>
        <button type="button" className={`chip ${layerVisibility.capitals ? 'active' : ''}`} onClick={() => toggleLayer('capitals')}>
          都城
        </button>
        <button type="button" className={`chip ${layerVisibility.buildings ? 'active' : ''}`} onClick={() => toggleLayer('buildings')}>
          建筑
        </button>
      </div>
      <div className="search-box">
        <input
          type="search"
          value={query}
          placeholder="搜索文明或建筑"
          aria-label="搜索文明或建筑"
          onChange={(event) => setQuery(event.target.value)}
        />
        {matches.length > 0 ? (
          <div className="search-results">
            {matches.map((match) => (
              <button
                type="button"
                key={`${match.kind}-${match.id}`}
                onPointerDown={() => handlePick(match)}
                onClick={() => handlePick(match)}
              >
                <span className="result-kind">{match.kind}</span>
                <span className="result-copy">
                  {match.label}
                  <span>{match.meta}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
