import { memo } from 'react';
import { formatYear } from '../utils/formatYear.js';

function ComparePanel({ dynasties, onRemove, onClear, onSelect }) {
  if (!dynasties.length) return null;
  return (
    <div className="compare-panel" aria-label="文明对比">
      <header className="compare-header">
        <span className="compare-title">
          <em>◆</em> 对比 · {dynasties.length} / 2
        </span>
        <button type="button" className="compare-clear" onClick={onClear} title="清空对比">
          清空
        </button>
      </header>
      <div className="compare-grid" style={{ gridTemplateColumns: `repeat(${dynasties.length}, minmax(0, 1fr))` }}>
        {dynasties.map((dynasty) => (
          <article key={dynasty.id} className="compare-card" style={{ '--cmp-accent': dynasty.color }}>
            <button
              type="button"
              className="compare-remove"
              onClick={() => onRemove(dynasty.id)}
              aria-label={`移除 ${dynasty.name}`}
              title="移除"
            >
              ×
            </button>
            <button
              type="button"
              className="compare-card-body"
              onClick={() => onSelect?.(dynasty.id)}
            >
              <div className="compare-name">{dynasty.name}</div>
              {dynasty.nameEn ? <div className="compare-en">{dynasty.nameEn}</div> : null}
              <div className="compare-meta">
                {formatYear(dynasty.startYear)} – {formatYear(dynasty.endYear)}
              </div>
              <div className="compare-row">
                <span className="compare-row-label">都</span>
                <span>{dynasty.capital?.name}</span>
              </div>
              <div className="compare-row">
                <span className="compare-row-label">区</span>
                <span>{dynasty.region}</span>
              </div>
              {dynasty.importance ? (
                <div className="compare-row">
                  <span className="compare-row-label">重</span>
                  <span className="compare-imp">
                    {'★'.repeat(dynasty.importance)}{'☆'.repeat(5 - dynasty.importance)}
                  </span>
                </div>
              ) : null}
              {dynasty.tags?.length ? (
                <div className="compare-tags">
                  {dynasty.tags.slice(0, 4).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}
              {dynasty.legacy ? (
                <p className="compare-legacy">{dynasty.legacy}</p>
              ) : null}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default memo(ComparePanel);
