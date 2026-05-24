import { useMemo } from 'react';

const TOP_TAGS = 18;

export default function FilterPanel({ dynasties, filter, onFilterChange }) {
  const { regions, tags } = useMemo(() => {
    const regionCount = new Map();
    const tagCount = new Map();
    for (const d of dynasties) {
      if (d.region) regionCount.set(d.region, (regionCount.get(d.region) || 0) + 1);
      for (const t of d.tags || []) tagCount.set(t, (tagCount.get(t) || 0) + 1);
    }
    const sortedRegions = [...regionCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const sortedTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, TOP_TAGS);
    return { regions: sortedRegions, tags: sortedTags };
  }, [dynasties]);

  const active = filter.regions.length > 0 || filter.tags.length > 0;

  function toggleRegion(region) {
    const next = filter.regions.includes(region)
      ? filter.regions.filter((r) => r !== region)
      : [...filter.regions, region];
    onFilterChange({ ...filter, regions: next });
  }
  function toggleTag(tag) {
    const next = filter.tags.includes(tag)
      ? filter.tags.filter((t) => t !== tag)
      : [...filter.tags, tag];
    onFilterChange({ ...filter, tags: next });
  }
  function clearAll() {
    onFilterChange({ regions: [], tags: [] });
  }

  return (
    <details className={`filter-panel${active ? ' filter-active' : ''}`}>
      <summary className="filter-toggle">
        <span className="filter-toggle-label">筛选</span>
        {active ? (
          <span className="filter-badge">{filter.regions.length + filter.tags.length}</span>
        ) : null}
        <span className="filter-caret" aria-hidden="true">+</span>
      </summary>

      <div className="filter-body">
        <div className="filter-section">
          <div className="filter-section-title">
            <span>区域</span>
            {filter.regions.length > 0 ? (
              <em>{filter.regions.length} 项</em>
            ) : null}
          </div>
          <div className="filter-chip-row">
            {regions.map((region) => (
              <button
                type="button"
                key={region}
                className={`filter-chip${filter.regions.includes(region) ? ' on' : ''}`}
                onClick={() => toggleRegion(region)}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-section-title">
            <span>标签</span>
            {filter.tags.length > 0 ? <em>{filter.tags.length} 项</em> : null}
          </div>
          <div className="filter-chip-row">
            {tags.map((tag) => (
              <button
                type="button"
                key={tag}
                className={`filter-chip${filter.tags.includes(tag) ? ' on' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {active ? (
          <button type="button" className="filter-clear" onClick={clearAll}>
            清除筛选
          </button>
        ) : null}
      </div>
    </details>
  );
}
