import { memo, useCallback, useEffect, useState } from 'react';
import { formatYear } from '../utils/formatYear.js';
import { annotateLifecycle } from '../utils/narrative.js';

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 500px)').matches;
}

function stopPanelEvent(event) {
  event.stopPropagation();
}

function InfoPanel({
  year,
  buildings,
  dynasties,
  totalActive,
  selectedDynastyId,
  hoveredDynastyId,
  locked,
  compareIds,
  filterActive,
  onSelectBuilding,
  onSelectDynasty,
  onAddCompare,
  onRemoveCompare,
  onHoverDynasty,
}) {
  const annotated = annotateLifecycle(dynasties, year);
  const compareSet = new Set(compareIds || []);
  const hiddenByFilter = filterActive ? Math.max(0, (totalActive || 0) - dynasties.length) : 0;
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [expanded, setExpanded] = useState(() => !isMobileViewport());
  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);
  const showBody = !isMobile || expanded;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(max-width: 500px)');
    const syncViewport = () => {
      setIsMobile(media.matches);
      if (!media.matches) setExpanded(true);
    };
    syncViewport();
    media.addEventListener?.('change', syncViewport);
    return () => media.removeEventListener?.('change', syncViewport);
  }, []);

  return (
    <div
      className={`info-panel${showBody ? ' expanded' : ''}`}
      onPointerDown={stopPanelEvent}
      onPointerUp={stopPanelEvent}
      onClick={stopPanelEvent}
    >
      <h3>当前时空</h3>
      <div className="year-big" id="year-big">{formatYear(year)}</div>
      <div className="count">
        活跃文明 <span id="dynasty-count">{totalActive ?? dynasties.length}</span>
        <span className="count-divider">/</span>
        可见建筑 <span id="count">{buildings.length}</span>
      </div>

      <button
        type="button"
        className="info-status-bar"
        onClick={(event) => {
          event.stopPropagation();
          toggleExpanded();
        }}
        aria-label={expanded ? '折叠信息面板' : '展开信息面板'}
      >
        <span className="info-status-year">{formatYear(year)}</span>
        <span className="info-status-counts">
          文明 <em>{totalActive ?? dynasties.length}</em>
          <span className="count-divider">/</span>
          建筑 <em>{buildings.length}</em>
        </span>
        <span className={`info-status-caret${expanded ? ' open' : ''}`} aria-hidden="true">
          {expanded ? '▴' : '▸'}
        </span>
      </button>

      {showBody && (
        <div className="info-panel-body">
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
                  const isHovered = hoveredDynastyId === dynasty.id;
                  const inCompare = compareSet.has(dynasty.id);
                  return (
                    <div
                      key={dynasty.id}
                      className={[
                        'item dynasty-item',
                        phase ? `dynasty-${phase}` : '',
                        isSelected ? 'is-selected' : '',
                        isSelected && locked ? 'is-locked' : '',
                        isHovered ? 'is-hovered' : '',
                      ].filter(Boolean).join(' ')}
                      data-id={dynasty.id}
                      style={{ '--item-accent': dynasty.color }}
                      onPointerEnter={() => onHoverDynasty?.(dynasty.id)}
                      onPointerLeave={() => onHoverDynasty?.(null)}
                    >
                      <button
                        type="button"
                        className="dynasty-item-main"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectDynasty(dynasty);
                        }}
                      >
                        <span className="swatch" />
                        <span className="item-copy">
                          <span className="name-line">
                            {dynasty.name}
                            {hint ? <span className={`life-badge life-${phase}`}>{phase === 'rising' ? '兴' : '衰'}</span> : null}
                            {isSelected ? <span className={`select-badge${locked ? ' locked' : ''}`}>{locked ? '锁' : '◆'}</span> : null}
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
                        onClick={(event) => {
                          event.stopPropagation();
                          if (inCompare) onRemoveCompare(dynasty.id);
                          else onAddCompare(dynasty.id);
                        }}
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
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectBuilding(building);
                    }}
                  >
                    {building.name}
                    <div className="type">{building.typeLabel || building.type} · {formatYear(building.startYear)}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(InfoPanel);
