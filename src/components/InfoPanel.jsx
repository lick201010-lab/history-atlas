import { memo } from 'react';
import { formatYear } from '../utils/formatYear.js';
import { annotateLifecycle } from '../utils/narrative.js';

function InfoPanel({
  year,
  buildings,
  dynasties,
  totalActive,
  selectedDynastyId,
  locked,
  compareIds,
  filterActive,
  onSelectBuilding,
  onSelectDynasty,
  onAddCompare,
  onRemoveCompare,
}) {
  const annotated = annotateLifecycle(dynasties, year);
  const compareSet = new Set(compareIds || []);
  const hiddenByFilter = filterActive ? Math.max(0, (totalActive || 0) - dynasties.length) : 0;

  return (
    <div className="info-panel">
      <h3>当前时空</h3>
      <div className="year-big" id="year-big">{formatYear(year)}</div>
      <div className="count">
        活跃文明 <span id="dynasty-count">{totalActive ?? dynasties.length}</span>
        <span className="count-divider">/</span>
        可见建筑 <span id="count">{buildings.length}</span>
      </div>
      {hiddenByFilter > 0 ? (
        <div className="filter-hint">筛选生效 · 隐藏 {hiddenByFilter} 个</div>
      ) : null}

      <div className="panel-section">
        <div className="section-title">文明 / 朝代</div>
        <div className="dynasty-list" id="dynasty-list">
          {dynasties.length === 0 ? (
            <div className="empty">{filterActive ? '当前筛选无匹配文明' : '此时期暂无文明数据'}</div>
          ) : (
            annotated.map(({ dynasty, phase, hint }) => {
              const isSelected = selectedDynastyId === dynasty.id;
              const inCompare = compareSet.has(dynasty.id);
              return (
                <div
                  key={dynasty.id}
                  className={[
                    'item dynasty-item',
                    phase ? `dynasty-${phase}` : '',
                    isSelected ? 'is-selected' : '',
                    isSelected && locked ? 'is-locked' : '',
                  ].filter(Boolean).join(' ')}
                  data-id={dynasty.id}
                  style={{ '--item-accent': dynasty.color }}
                >
                  <button
                    type="button"
                    className="dynasty-item-main"
                    onClick={() => onSelectDynasty(dynasty)}
                  >
                    <span className="swatch" />
                    <span className="item-copy">
                      <span className="name-line">
                        {dynasty.name}
                        {hint ? <span className={`life-badge life-${phase}`}>{phase === 'rising' ? '兴' : '衰'}</span> : null}
                        {isSelected ? <span className={`select-badge${locked ? ' locked' : ''}`}>{locked ? '🔒' : '◆'}</span> : null}
                      </span>
                      <span className="type">
                        {hint ? hint : `${dynasty.capital.name} · ${dynasty.region}`}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`compare-toggle${inCompare ? ' on' : ''}`}
                    title={inCompare ? '从对比中移除' : '加入对比'}
                    aria-label={inCompare ? '从对比中移除' : '加入对比'}
                    onClick={() => (inCompare ? onRemoveCompare(dynasty.id) : onAddCompare(dynasty.id))}
                  >
                    {inCompare ? '✓' : '+'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel-section compact">
        <div className="section-title">奇观 / 建筑</div>
        <div className="building-list" id="building-list">
          {buildings.length === 0 ? (
            <div className="empty">此时期暂无建筑</div>
          ) : (
            buildings.map((building) => (
              <button
                type="button"
                className="item"
                data-id={building.id}
                key={building.id}
                onClick={() => onSelectBuilding(building)}
              >
                {building.name}
                <div className="type">{building.typeLabel || building.type} · {formatYear(building.startYear)}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(InfoPanel);
