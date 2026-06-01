import { memo, useMemo, useState } from 'react';

// 图层开关用的可见性图标：on=睁眼，off=闭眼带斜杠。让"这是开关而非单选 Tab"一目了然。
function EyeIcon({ on }) {
  return (
    <svg className="chip-eye" width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12Z"
        fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      {on ? null : (
        <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      )}
    </svg>
  );
}

function LayerControls({
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
      <div className="layer-row" role="group" aria-label="地图图层（各自独立开关）">
        <button
          type="button"
          className={`chip ${layerVisibility.territories ? 'active' : 'is-off'}`}
          aria-pressed={layerVisibility.territories}
          onClick={() => toggleLayer('territories')}
        >
          <EyeIcon on={layerVisibility.territories} />领土
        </button>
        <button
          type="button"
          className={`chip ${layerVisibility.capitals ? 'active' : 'is-off'}`}
          aria-pressed={layerVisibility.capitals}
          onClick={() => toggleLayer('capitals')}
        >
          <EyeIcon on={layerVisibility.capitals} />都城
        </button>
        <button
          type="button"
          className={`chip ${layerVisibility.buildings ? 'active' : 'is-off'}`}
          aria-pressed={layerVisibility.buildings}
          onClick={() => toggleLayer('buildings')}
        >
          <EyeIcon on={layerVisibility.buildings} />建筑
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

export default memo(LayerControls);
