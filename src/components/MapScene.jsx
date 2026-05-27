import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { createBuildingLayer } from '../map/createBuildingLayer.js';
import {
  INITIAL_VIEW,
  MOUNTAIN_VIEW,
  darkStyle,
  setTerrainMode,
  applyMapTheme,
  applyBoundaryPaint,
} from '../map/mapStyle.js';
import { formatYear } from '../utils/formatYear.js';

function createDynastyCapitalGeoJson(dynasties) {
  return {
    type: 'FeatureCollection',
    features: dynasties.map((dynasty) => ({
      type: 'Feature',
      properties: {
        id: dynasty.id,
        name: dynasty.name,
        nameEn: dynasty.nameEn,
        capital: dynasty.capital.name,
        region: dynasty.region,
        startYear: dynasty.startYear,
        endYear: dynasty.endYear,
        color: dynasty.color,
      },
      geometry: {
        type: 'Point',
        coordinates: [dynasty.capital.lng, dynasty.capital.lat],
      },
    })),
  };
}

function activeYearFilter(year) {
  return ['all', ['<=', ['get', 'startYear'], year], ['>=', ['get', 'endYear'], year]];
}

function boundaryHoverFilter(year, hoveredId) {
  return ['all', ...activeYearFilter(year).slice(1), ['==', ['get', 'id'], hoveredId || '__none__']];
}

function setVisibility(map, layerId, visible) {
  if (map?.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

const MapScene = forwardRef(function MapScene({
  boundaries,
  dynasties,
  landmarks,
  layerVisibility,
  year,
  theme = 'dark',
  selectedDynastyId,
  locked,
  boundaryCard,
  compareIds = [],
  onVisibleBuildingsChange,
  onSelectDynasty,
  onSelectBuilding,
  onCloseCard,
  onToggleLock,
  onAddCompare,
  onRemoveCompare,
  onToggleTheme,
}, ref) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const buildingLayerRef = useRef(null);
  const yearRef = useRef(year);
  const dynastiesRef = useRef(dynasties);
  const boundariesRef = useRef(boundaries);
  const layerVisibilityRef = useRef(layerVisibility);
  const hoveredBoundaryIdRef = useRef(null);
  const onSelectDynastyRef = useRef(onSelectDynasty);
  const onSelectBuildingRef = useRef(onSelectBuilding);
  const themeRef = useRef(theme);
  const [viewMode, setViewMode] = useState('world');
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, building: null });
  const [mapReady, setMapReady] = useState(false);
  const [mapWarning, setMapWarning] = useState('');

  useEffect(() => { onSelectDynastyRef.current = onSelectDynasty; }, [onSelectDynasty]);
  useEffect(() => { onSelectBuildingRef.current = onSelectBuilding; }, [onSelectBuilding]);

  // 主题切换：应用 base 可见性 / hillshade / sky / 边界 paint / 建筑材质
  useEffect(() => {
    themeRef.current = theme;
    const map = mapRef.current;
    if (!map) return;
    applyMapTheme(map, theme);
    buildingLayerRef.current?.setTheme?.(theme);
  }, [theme]);

  useImperativeHandle(ref, () => ({
    flyToBuilding(building) {
      mapRef.current?.flyTo({
        center: [building.lng, building.lat],
        zoom: 5.5,
        pitch: 62,
        duration: 2000,
      });
    },
    flyToDynasty(dynasty) {
      mapRef.current?.flyTo({
        center: [dynasty.capital.lng, dynasty.capital.lat],
        zoom: 4.8,
        pitch: 58,
        duration: 1800,
      });
    },
  }), []);

  useEffect(() => {
    yearRef.current = year;
    const visible = buildingLayerRef.current?.setYear(year);
    if (visible) onVisibleBuildingsChange(visible);
    const map = mapRef.current;
    if (map?.getLayer('dynasty-capital-core')) {
      const filter = activeYearFilter(year);
      map.setFilter('dynasty-territory-fill', filter);
      map.setFilter('dynasty-territory-glow', filter);
      map.setFilter('dynasty-territory-line', filter);
      map.setFilter('dynasty-territory-hover', boundaryHoverFilter(year, hoveredBoundaryIdRef.current));
      map.setFilter('dynasty-capital-glow', filter);
      map.setFilter('dynasty-capital-core', filter);
    }
  }, [onVisibleBuildingsChange, year]);

  // Selected-fill (driven by selectedDynastyId prop, persists across year drags)
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('dynasty-territory-selected-fill')) return;
    map.setFilter(
      'dynasty-territory-selected-fill',
      boundaryHoverFilter(yearRef.current, selectedDynastyId || '__none__'),
    );
  }, [selectedDynastyId, year]);

  useEffect(() => {
    layerVisibilityRef.current = layerVisibility;
    const map = mapRef.current;
    setVisibility(map, 'dynasty-territory-fill', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-glow', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-line', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-hover', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-selected-fill', layerVisibility.territories);
    setVisibility(map, 'dynasty-capital-glow', layerVisibility.capitals);
    setVisibility(map, 'dynasty-capital-core', layerVisibility.capitals);
    buildingLayerRef.current?.setLayerVisible(layerVisibility.buildings);
    if (!layerVisibility.territories) onCloseCard?.();
    if (!layerVisibility.buildings) setTooltip((current) => ({ ...current, visible: false }));
  }, [layerVisibility, onCloseCard]);

  useEffect(() => {
    dynastiesRef.current = dynasties;
    const source = mapRef.current?.getSource('dynasty-capitals');
    source?.setData(createDynastyCapitalGeoJson(dynasties));
  }, [dynasties]);

  useEffect(() => {
    boundariesRef.current = boundaries;
    const source = mapRef.current?.getSource('dynasty-boundaries');
    source?.setData(boundaries);
  }, [boundaries]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: darkStyle,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      maxPitch: 75,
      antialias: true,
      attributionControl: false,
    });

    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
    mapRef.current = map;
    window._map = map;

    const buildingLayer = createBuildingLayer(landmarks);
    buildingLayerRef.current = buildingLayer;

    function initDynastyBoundaries() {
      if (!map.getSource('dynasty-boundaries')) {
        map.addSource('dynasty-boundaries', {
          type: 'geojson',
          data: boundariesRef.current,
        });
      }
      // 样板（精修过的）文明 vs 占位文明，由 accuracy 字段驱动。
      // rough-refined（人工凸多边形 sample）与 coastline-aware-rough（海岸贴合 sample）
      // 都享受同一套精修级描边 / 光晕；其他 accuracy（如 rough）走低强度的占位渲染。
      const ifRefined = (refined, plain) => [
        'case',
        ['in', ['get', 'accuracy'], ['literal', ['rough-refined', 'coastline-aware-rough']]],
        refined, plain,
      ];
      if (!map.getLayer('dynasty-territory-fill')) {
        map.addLayer({
          id: 'dynasty-territory-fill',
          type: 'fill',
          source: 'dynasty-boundaries',
          filter: activeYearFilter(yearRef.current),
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': ifRefined(0.11, 0.05),
            'fill-antialias': true,
          },
        });
      }
      // 边界发光底（宽、糊）—— 样板文明更明显
      if (!map.getLayer('dynasty-territory-glow')) {
        map.addLayer({
          id: 'dynasty-territory-glow',
          type: 'line',
          source: 'dynasty-boundaries',
          filter: activeYearFilter(yearRef.current),
          paint: {
            'line-color': ['get', 'color'],
            'line-opacity': ifRefined(0.45, 0.22),
            'line-width': ifRefined(7, 4),
            'line-blur': 5,
          },
        });
      }
      if (!map.getLayer('dynasty-territory-line')) {
        map.addLayer({
          id: 'dynasty-territory-line',
          type: 'line',
          source: 'dynasty-boundaries',
          filter: activeYearFilter(yearRef.current),
          paint: {
            'line-color': ['get', 'color'],
            'line-opacity': ifRefined(0.78, 0.4),
            'line-width': ifRefined(1.4, 0.8),
            'line-blur': 0.3,
            'line-dasharray': [5, 1.4],
          },
        });
      }
      if (!map.getLayer('dynasty-territory-hover')) {
        map.addLayer({
          id: 'dynasty-territory-hover',
          type: 'line',
          source: 'dynasty-boundaries',
          filter: boundaryHoverFilter(yearRef.current, hoveredBoundaryIdRef.current),
          paint: {
            'line-color': '#f6d58f',
            'line-opacity': 0.95,
            'line-width': ['interpolate', ['linear'], ['zoom'], 2, 2, 5, 3.4],
            'line-blur': 1.2,
          },
        });
      }
      // 选中态填充（被点击的领土轻微高亮）
      if (!map.getLayer('dynasty-territory-selected-fill')) {
        map.addLayer({
          id: 'dynasty-territory-selected-fill',
          type: 'fill',
          source: 'dynasty-boundaries',
          filter: boundaryHoverFilter(yearRef.current, '__none__'),
          paint: {
            'fill-color': '#f6d58f',
            'fill-opacity': 0.08,
          },
        });
      }
    }

    function initDynastyCapitals() {
      if (!map.getSource('dynasty-capitals')) {
        map.addSource('dynasty-capitals', {
          type: 'geojson',
          data: createDynastyCapitalGeoJson(dynastiesRef.current),
        });
      }
      if (!map.getLayer('dynasty-capital-glow')) {
        map.addLayer({
          id: 'dynasty-capital-glow',
          type: 'circle',
          source: 'dynasty-capitals',
          filter: activeYearFilter(yearRef.current),
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 4, 9, 6, 16],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.28,
            'circle-blur': 0.72,
          },
        });
      }
      if (!map.getLayer('dynasty-capital-core')) {
        map.addLayer({
          id: 'dynasty-capital-core',
          type: 'circle',
          source: 'dynasty-capitals',
          filter: activeYearFilter(yearRef.current),
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 2.5, 4, 4, 6, 7],
            'circle-color': ['get', 'color'],
            'circle-stroke-color': 'rgba(240, 248, 255, 0.9)',
            'circle-stroke-width': 0.8,
            'circle-opacity': 0.92,
          },
        });
      }
    }

    function initBuildingLayer() {
      if (map.getLayer('buildings-3d')) return;
      try {
        initDynastyBoundaries();
        initDynastyCapitals();
        map.addLayer(buildingLayer);
        setVisibility(map, 'dynasty-territory-fill', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-glow', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-line', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-hover', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-selected-fill', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-capital-glow', layerVisibilityRef.current.capitals);
        setVisibility(map, 'dynasty-capital-core', layerVisibilityRef.current.capitals);
        buildingLayer.setLayerVisible(layerVisibilityRef.current.buildings);
        onVisibleBuildingsChange(buildingLayer.setYear(yearRef.current));
        // 图层创建后立即把当前主题套上去
        applyMapTheme(map, themeRef.current);
        buildingLayer.setTheme?.(themeRef.current);
      } catch (error) {
        console.error('addLayer failed', error);
      }
    }

    let readyFallback = window.setTimeout(() => markMapReady(), 4500);

    function markMapReady() {
      window.clearTimeout(readyFallback);
      readyFallback = null;
      setMapReady(true);
    }

    function handleMapError(event) {
      const sourceId = event?.sourceId || event?.source?.id || '';
      if (sourceId === 'osm-tiles' || sourceId.includes('terrain') || event?.error) {
        setMapWarning('地图瓦片加载较慢，沙盘仍可操作；如地形短暂缺失，稍后会自动补齐。');
      }
    }

    function pickBuilding(point) {
      let best = null;
      let bestDist = Infinity;
      for (const building of landmarks) {
        if (yearRef.current < building.startYear || yearRef.current > building.endYear) continue;
        const projected = map.project([building.lng, building.lat]);
        const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
        if (distance < 50 && distance < bestDist) {
          bestDist = distance;
          best = building;
        }
      }
      return best;
    }

    function handleMouseMove(event) {
      if (!layerVisibilityRef.current.buildings) return;
      const best = pickBuilding(event.point);
      if (best) {
        setTooltip({
          visible: true,
          x: event.originalEvent.clientX + 14,
          y: event.originalEvent.clientY + 14,
          building: best,
        });
        map.getCanvas().style.cursor = 'pointer';
      } else {
        setTooltip((current) => (current.visible ? { visible: false, x: 0, y: 0, building: null } : current));
        map.getCanvas().style.cursor = '';
      }
    }

    function handleClick(event) {
      if (!layerVisibilityRef.current.buildings) return;
      const best = pickBuilding(event.point);
      if (best) {
        event.preventDefault();
        map.flyTo({ center: [best.lng, best.lat], zoom: 5.5, pitch: 62, duration: 1800 });
        onSelectBuildingRef.current?.(best, { fromMap: true });
      }
    }

    function handleCapitalClick(event) {
      if (!layerVisibilityRef.current.capitals) return;
      const feature = event.features?.[0];
      if (!feature) return;
      event.preventDefault();
      map.flyTo({ center: feature.geometry.coordinates, zoom: 4.8, pitch: 58, duration: 1600 });
    }

    function handleCapitalEnter() {
      map.getCanvas().style.cursor = 'pointer';
    }

    function handleTerritoryMove(event) {
      if (!layerVisibilityRef.current.territories) return;
      const feature = event.features?.[0];
      const id = feature?.properties?.id;
      if (!id || hoveredBoundaryIdRef.current === id) return;
      hoveredBoundaryIdRef.current = id;
      map.setFilter('dynasty-territory-hover', boundaryHoverFilter(yearRef.current, id));
      map.getCanvas().style.cursor = 'pointer';
    }

    function handleTerritoryLeave() {
      hoveredBoundaryIdRef.current = null;
      if (map.getLayer('dynasty-territory-hover')) {
        map.setFilter('dynasty-territory-hover', boundaryHoverFilter(yearRef.current, null));
      }
      map.getCanvas().style.cursor = '';
    }

    function handleTerritoryClick(event) {
      if (!layerVisibilityRef.current.territories) return;
      const feature = event.features?.[0];
      if (!feature || event.defaultPrevented) return;
      event.preventDefault();
      onSelectDynastyRef.current?.(feature.properties.id, { fromMap: true });
    }

    const container = mapContainerRef.current;
    const preventContextMenu = (event) => event.preventDefault();
    container.addEventListener('contextmenu', preventContextMenu);

    if (map.loaded()) {
      initBuildingLayer();
      markMapReady();
    } else {
      map.on('load', initBuildingLayer);
      map.on('styledata', initBuildingLayer);
      map.once('idle', initBuildingLayer);
    }
    map.once('idle', markMapReady);
    map.on('error', handleMapError);
    map.on('mousemove', handleMouseMove);
    map.on('click', handleClick);
    map.on('mousemove', 'dynasty-territory-fill', handleTerritoryMove);
    map.on('mouseleave', 'dynasty-territory-fill', handleTerritoryLeave);
    map.on('click', 'dynasty-territory-fill', handleTerritoryClick);
    map.on('click', 'dynasty-capital-core', handleCapitalClick);
    map.on('mouseenter', 'dynasty-capital-core', handleCapitalEnter);

    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
      if (readyFallback) window.clearTimeout(readyFallback);
      map.off('load', initBuildingLayer);
      map.off('styledata', initBuildingLayer);
      map.off('error', handleMapError);
      map.off('mousemove', handleMouseMove);
      map.off('click', handleClick);
      map.off('mousemove', 'dynasty-territory-fill', handleTerritoryMove);
      map.off('mouseleave', 'dynasty-territory-fill', handleTerritoryLeave);
      map.off('click', 'dynasty-territory-fill', handleTerritoryClick);
      map.off('click', 'dynasty-capital-core', handleCapitalClick);
      map.off('mouseenter', 'dynasty-capital-core', handleCapitalEnter);
      buildingLayer.dispose?.();
      map.remove();
      mapRef.current = null;
      buildingLayerRef.current = null;
      if (window._map === map) delete window._map;
    };
  }, [landmarks, onVisibleBuildingsChange]);

  return (
    <>
      <div id="map" ref={mapContainerRef} data-view-mode={viewMode} />
      {!mapReady ? (
        <div className="map-loading" role="status" aria-live="polite">
          <div className="loading-mark" />
          <div>
            <strong>正在加载历史沙盘</strong>
            <span>初始化 3D 地形、文明边界与建筑模型</span>
          </div>
        </div>
      ) : null}
      {mapWarning ? (
        <div className="map-warning" role="status">
          {mapWarning}
          <button type="button" onClick={() => setMapWarning('')} aria-label="关闭地图提示">关闭</button>
        </div>
      ) : null}
      <div className="top-right">
        <button
          className="btn"
          type="button"
          id="btn-mountain"
          onClick={() => {
            setViewMode('mountain');
            setTerrainMode(mapRef.current, 'mountain');
            mapRef.current?.flyTo({ ...MOUNTAIN_VIEW, duration: 2000 });
          }}
        >
          山脉视角
        </button>
        <button
          className="btn"
          type="button"
          id="btn-reset"
          onClick={() => {
            setViewMode('world');
            setTerrainMode(mapRef.current, 'world');
            mapRef.current?.flyTo({ ...INITIAL_VIEW, duration: 1500 });
          }}
        >
          重置视角
        </button>
        <button
          className="btn"
          type="button"
          id="btn-north"
          onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 55, duration: 1000 })}
        >
          指南针
        </button>
        <button
          className="btn btn-theme"
          type="button"
          id="btn-theme"
          onClick={() => onToggleTheme?.()}
          title={theme === 'atlas' ? '切回深色 HUD' : '切到古地图浮雕'}
          aria-label={theme === 'atlas' ? '切回深色 HUD' : '切到古地图浮雕'}
        >
          {theme === 'atlas' ? '夜色' : '古地图'}
        </button>
      </div>
      <div
        className="building-tooltip"
        id="tooltip"
        style={{
          display: tooltip.visible ? 'block' : 'none',
          left: tooltip.x,
          top: tooltip.y,
        }}
      >
        <div className="name">{tooltip.building?.name}</div>
        <div className="meta">
          {tooltip.building
            ? `${tooltip.building.typeLabel || tooltip.building.type} · ${formatYear(tooltip.building.startYear)} ~ ${formatYear(tooltip.building.endYear)}`
            : ''}
        </div>
      </div>
      {boundaryCard ? (
        <div className={`territory-card${locked ? ' is-locked' : ''}`} style={{ '--card-accent': boundaryCard.color }}>
          <div className="territory-card-actions">
            <button
              type="button"
              className={`card-action-btn lock-btn${locked ? ' locked' : ''}`}
              aria-label={locked ? '取消锁定' : '锁定文明'}
              title={locked ? '取消锁定' : '锁定文明（拖动时间轴不关闭）'}
              onClick={() => onToggleLock?.()}
            >
              {locked ? '🔒' : '🔓'}
            </button>
            <button
              type="button"
              className={`card-action-btn compare-btn${compareIds.includes(boundaryCard.id) ? ' on' : ''}`}
              aria-label={compareIds.includes(boundaryCard.id) ? '从对比移除' : '加入对比'}
              title={compareIds.includes(boundaryCard.id) ? '从对比移除' : '加入对比'}
              onClick={() => (compareIds.includes(boundaryCard.id)
                ? onRemoveCompare?.(boundaryCard.id)
                : onAddCompare?.(boundaryCard.id))}
            >
              {compareIds.includes(boundaryCard.id) ? '✓' : '+'}
            </button>
            <button
              className="card-action-btn territory-close"
              type="button"
              aria-label="关闭"
              title="关闭"
              onClick={() => onCloseCard?.()}
            >
              ×
            </button>
          </div>
          <div className="territory-card-inner">
            <header className="territory-header">
              <div className="territory-kicker" style={{ color: boundaryCard.color }}>文明档案</div>
              <div className="territory-name">{boundaryCard.dynasty}</div>
              {boundaryCard.nameEn ? <div className="territory-en">{boundaryCard.nameEn}</div> : null}
            </header>

            <div className="territory-meta">
              <span className="meta-time">
                {formatYear(boundaryCard.startYear)} – {formatYear(boundaryCard.endYear)}
              </span>
              <span className="meta-dot">·</span>
              <span className="meta-capital">都 {boundaryCard.capital}</span>
            </div>

            {(boundaryCard.region || boundaryCard.tags?.length) ? (
              <div className="territory-chip-row">
                {boundaryCard.region ? (
                  <span className="chip-pill chip-region">{boundaryCard.region}</span>
                ) : null}
                {boundaryCard.tags?.map((tag) => (
                  <span className="chip-pill" key={`${boundaryCard.id}-${tag}`}>{tag}</span>
                ))}
              </div>
            ) : null}

            {boundaryCard.importance ? (
              <div className="territory-importance" aria-label={`历史重要性 ${boundaryCard.importance} 分`}>
                <span className="imp-label">历史重要性</span>
                <div className="importance-dots">
                  {Array.from({ length: 5 }, (_, index) => (
                    <i
                      key={`${boundaryCard.id}-importance-${index}`}
                      className={index < boundaryCard.importance ? 'active' : ''}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <p className="territory-summary">{boundaryCard.summary}</p>

            {boundaryCard.legacy ? (
              <blockquote className="territory-legacy">
                <div className="territory-subtitle">历史影响</div>
                <p>{boundaryCard.legacy}</p>
              </blockquote>
            ) : null}

            {boundaryCard.events?.length ? (
              <section className="territory-events">
                <div className="territory-subtitle">关键节点</div>
                {boundaryCard.events.slice(0, 3).map((event) => (
                  <div className="territory-event" key={`${boundaryCard.id}-${event.year}-${event.title}`}>
                    <span>{formatYear(event.year)}</span>
                    <span className="event-title">{event.title}</span>
                  </div>
                ))}
              </section>
            ) : null}

            {boundaryCard.relatedLandmarks?.length ? (
              <section className="territory-related">
                <div className="territory-subtitle">关联建筑</div>
                <div className="territory-tags">
                  {boundaryCard.relatedLandmarks.map((landmark) => (
                    <span key={landmark.id}>{landmark.name}</span>
                  ))}
                </div>
              </section>
            ) : null}

            {(boundaryCard.accuracyLabel || boundaryCard.sourceNote || boundaryCard.accuracyNote) ? (
              <footer className="territory-footer">
                {boundaryCard.accuracyLabel ? (
                  <div className="territory-quality" title={boundaryCard.accuracyNote}>
                    <span>边界精度</span>
                    <em>{boundaryCard.accuracyLabel}</em>
                  </div>
                ) : null}
                {boundaryCard.sourceNote || boundaryCard.accuracyNote ? (
                  <div className="territory-source">
                    {boundaryCard.sourceNote || boundaryCard.accuracyNote}
                  </div>
                ) : null}
              </footer>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
});

export default MapScene;
