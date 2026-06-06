import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { createBuildingLayer } from '../map/createBuildingLayer.js';
import { boundaryOpacityExpression, buildFocusIds, isFocusActive } from '../map/boundaryFocus.js';
import { smoothBoundaryCollection } from '../map/smoothBoundaries.js';
import { createBoundaryOutlineCollection } from '../map/boundaryOutlines.js';
import {
  INITIAL_VIEW,
  MOUNTAIN_VIEW,
  darkStyle,
  setTerrainMode,
  applyMapTheme,
  applyBoundaryPaint,
} from '../map/mapStyle.js';
import { formatYear } from '../utils/formatYear.js';

// 离屏 canvas 生成"雕版波纹"平铺纹理：透明底 + 两条细密正弦墨青波线，
// 横向恰好一个完整周期（无缝平铺），给 atlas 海面叠一层铜版画质感。无依赖。
function makeWavePattern() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  // 淡浅蓝高光波纹：模拟水面反光（而非深色雕版线），低对比、随海色叠加。
  ctx.strokeStyle = 'rgba(150, 196, 232, 0.34)';
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';
  for (const yBase of [8, 24]) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 1) {
      const y = yBase + Math.sin((x / size) * Math.PI * 2) * 2.2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const { data } = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: new Uint8Array(data.buffer) };
}

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
        // 标注碰撞排序用：重要文明（importance 大）在低 zoom 优先保留。
        importance: dynasty.importance ?? 3,
      },
      geometry: {
        type: 'Point',
        coordinates: [dynasty.capital.lng, dynasty.capital.lat],
      },
    })),
  };
}

function createBuildingLabelGeoJson(landmarks) {
  return {
    type: 'FeatureCollection',
    features: landmarks.map((building) => ({
      type: 'Feature',
      properties: {
        id: building.id,
        name: building.name,
        startYear: building.startYear,
        endYear: building.endYear,
        importance: building.importance ?? 3,
      },
      geometry: { type: 'Point', coordinates: [building.lng, building.lat] },
    })),
  };
}

function activeYearFilter(year) {
  return ['all', ['<=', ['get', 'startYear'], year], ['>=', ['get', 'endYear'], year]];
}

function activeBuildingLabelFilter(year, selectedLandmarkId) {
  const filter = activeYearFilter(year);
  if (!selectedLandmarkId) return filter;
  return ['all', ...filter.slice(1), ['==', ['get', 'id'], selectedLandmarkId]];
}

function boundaryHoverFilter(year, hoveredId) {
  return ['all', ...activeYearFilter(year).slice(1), ['==', ['get', 'id'], hoveredId || '__none__']];
}

function focusCameraForBuilding(building, duration = 2000) {
  const presets = {
    petra: { zoom: 7.5, pitch: 64, bearing: -18 },
    'forbidden-city': { zoom: 7.0, pitch: 64, bearing: -35 },
    'great-wall': { zoom: 7.2, pitch: 66, bearing: -38 },
    'hagia-sophia': { zoom: 6.8, pitch: 64, bearing: -18 },
    colosseum: { zoom: 6.8, pitch: 64, bearing: -28 },
    'angkor-wat': { zoom: 7.1, pitch: 64, bearing: -32 },
    pyramid: { zoom: 7.8, pitch: 58, bearing: 42 },
    persepolis: { zoom: 7.0, pitch: 64, bearing: -24 },
    'ziggurat-ur': { zoom: 7.2, pitch: 62, bearing: 34 },
    'ishtar-gate': { zoom: 7.1, pitch: 64, bearing: -28 },
    'sanchi-stupa': { zoom: 7.2, pitch: 62, bearing: 22 },
    'konark-sun': { zoom: 7.1, pitch: 64, bearing: -36 },
    'djenne-mosque': { zoom: 7.0, pitch: 64, bearing: -24 },
    'mecca-haram': { zoom: 7.0, pitch: 62, bearing: -22 },
    teotihuacan: { zoom: 7.2, pitch: 62, bearing: 28 },
    'machu-picchu': { zoom: 7.3, pitch: 66, bearing: -34 },
    changan: { zoom: 7.2, pitch: 62, bearing: -26 },
    'terracotta-army': { zoom: 7.6, pitch: 62, bearing: -28 },
    'temple-of-heaven': { zoom: 7.5, pitch: 62, bearing: -30 },
    cheomseongdae: { zoom: 7.7, pitch: 62, bearing: 30 },
    'meroe-pyramids': { zoom: 7.2, pitch: 62, bearing: 26 },
    'great-zimbabwe': { zoom: 7.0, pitch: 64, bearing: -24 },
    'westminster-abbey': { zoom: 7.4, pitch: 62, bearing: -34 },
  };
  const preset = presets[building.id] || { zoom: 6.4, pitch: 64, bearing: -30 };
  return {
    center: [building.lng, building.lat],
    ...preset,
    duration,
  };
}

// hover 高亮由两层共同呈现：彩色填充 wash + 金色亮边。统一在此同步两层 filter，
// 避免在多处各设一遍、漏掉填充层。
function applyHoverFilter(map, year, hoveredId) {
  const filter = boundaryHoverFilter(year, hoveredId);
  if (map?.getLayer('dynasty-territory-hover-fill')) map.setFilter('dynasty-territory-hover-fill', filter);
  if (map?.getLayer('dynasty-territory-hover')) map.setFilter('dynasty-territory-hover', filter);
}

function setVisibility(map, layerId, visible) {
  if (map?.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

function focusMatchExpression(focusIds) {
  return ['in', ['get', 'id'], ['literal', focusIds]];
}

function focusCaseExpression(focusIds, focused, muted) {
  if (!isFocusActive(focusIds)) return focused;
  return ['case', focusMatchExpression(focusIds), focused, muted];
}

function applyBoundaryFocusPaint(map, theme, selectedId, hoveredId, compareIds) {
  if (!map) return;

  applyBoundaryPaint(map, theme);

  const focusIds = buildFocusIds({ selectedId, hoveredId, compareIds });
  if (!isFocusActive(focusIds)) return;

  const atlas = theme === 'atlas';
  const textBase = atlas ? 0 : ['interpolate', ['linear'], ['zoom'], 1.6, 0, 2.8, 0.95];

  if (map.getLayer('dynasty-territory-fill')) {
    map.setPaintProperty('dynasty-territory-fill', 'fill-opacity', boundaryOpacityExpression({
      focusIds,
      refined: atlas ? 0.08 : 0.10,
      plain: atlas ? 0.04 : 0.042,
      mutedRefined: atlas ? 0.016 : 0.014,
      mutedPlain: atlas ? 0.01 : 0.01,
    }));
  }
  if (map.getLayer('dynasty-territory-glow')) {
    map.setPaintProperty('dynasty-territory-glow', 'line-opacity', boundaryOpacityExpression({
      focusIds,
      refined: atlas ? 0.34 : 0.30,
      plain: atlas ? 0.16 : 0.13,
      mutedRefined: atlas ? 0.035 : 0.032,
      mutedPlain: atlas ? 0.02 : 0.018,
    }));
  }
  if (map.getLayer('dynasty-territory-casing')) {
    map.setPaintProperty('dynasty-territory-casing', 'line-opacity', boundaryOpacityExpression({
      focusIds,
      refined: atlas ? 0 : 0.28,
      plain: atlas ? 0 : 0.18,
      mutedRefined: 0,
      mutedPlain: 0,
    }));
  }
  if (map.getLayer('dynasty-territory-line')) {
    map.setPaintProperty('dynasty-territory-line', 'line-opacity', boundaryOpacityExpression({
      focusIds,
      refined: atlas ? 0.94 : 0.62,
      plain: atlas ? 0.55 : 0.28,
      mutedRefined: atlas ? 0.11 : 0.075,
      mutedPlain: atlas ? 0.055 : 0.034,
    }));
  }
  if (map.getLayer('dynasty-capital-glow')) {
    map.setPaintProperty('dynasty-capital-glow', 'circle-opacity', focusCaseExpression(focusIds, atlas ? 0.2 : 0.28, atlas ? 0.035 : 0.04));
  }
  if (map.getLayer('dynasty-capital-core')) {
    map.setPaintProperty('dynasty-capital-core', 'circle-opacity', focusCaseExpression(focusIds, atlas ? 0.92 : 0.92, atlas ? 0.16 : 0.13));
  }
  if (map.getLayer('dynasty-capital-label')) {
    map.setPaintProperty('dynasty-capital-label', 'text-opacity', focusCaseExpression(focusIds, textBase, atlas ? 0 : 0.08));
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
  selectedLandmarkId,
  hoveredDynastyId,
  locked,
  boundaryCard,
  compareIds = [],
  onVisibleBuildingsChange,
  onHoverDynasty,
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
  const lastVisibleSigRef = useRef('');
  const onSelectDynastyRef = useRef(onSelectDynasty);
  const onSelectBuildingRef = useRef(onSelectBuilding);
  const onHoverDynastyRef = useRef(onHoverDynasty);
  const selectedLandmarkIdRef = useRef(selectedLandmarkId);
  const themeRef = useRef(theme);
  const [viewMode, setViewMode] = useState('world');
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, building: null });
  const [mapReady, setMapReady] = useState(false);
  const [mapWarning, setMapWarning] = useState('');

  useEffect(() => { onSelectDynastyRef.current = onSelectDynasty; }, [onSelectDynasty]);
  useEffect(() => { onSelectBuildingRef.current = onSelectBuilding; }, [onSelectBuilding]);
  useEffect(() => { onHoverDynastyRef.current = onHoverDynasty; }, [onHoverDynasty]);
  useEffect(() => { selectedLandmarkIdRef.current = selectedLandmarkId; }, [selectedLandmarkId]);

  // 列表 → 地图：右侧文明列表 hover 时，复用地图侧的 hover 强调层高亮对应疆域。
  // 用 hoveredBoundaryIdRef 作为单一状态：地图侧 hover 已直接设过 filter 并回灌同一 id 时，
  // 这里会因 ref 相同而提前返回，避免重复设值与潜在闪烁。
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('dynasty-territory-hover')) return;
    const next = hoveredDynastyId || null;
    if (hoveredBoundaryIdRef.current === next) return;
    hoveredBoundaryIdRef.current = next;
    applyHoverFilter(map, yearRef.current, next);
  }, [hoveredDynastyId]);

  // 主题切换：应用 base 可见性 / hillshade / sky / 边界 paint / 建筑材质
  useEffect(() => {
    themeRef.current = theme;
    const map = mapRef.current;
    if (!map) return;
    applyMapTheme(map, theme);
    buildingLayerRef.current?.setTheme?.(theme);
    // dark 主题把 #map 内缩进装裱框、atlas 满屏，容器尺寸随主题变化，
    // 等 CSS 过渡后让 MapLibre 重读容器尺寸，避免画布与容器错位。
    const resizeTimer = setTimeout(() => map.resize(), 360);
    return () => clearTimeout(resizeTimer);
  }, [theme]);

  useImperativeHandle(ref, () => ({
    flyToBuilding(building) {
      mapRef.current?.flyTo(focusCameraForBuilding(building, 2000));
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
    // Only push the visible-building set up to App when it actually changes;
    // setYear runs every tick (to drive the grow/shrink animation) but the set
    // is stable across most ticks, so this avoids a redundant 2nd App render.
    if (visible) {
      const sig = visible.map((building) => building.id).join('|');
      if (sig !== lastVisibleSigRef.current) {
        lastVisibleSigRef.current = sig;
        onVisibleBuildingsChange(visible);
      }
    }
    const map = mapRef.current;
    if (map?.getLayer('dynasty-capital-core')) {
      const filter = activeYearFilter(year);
      map.setFilter('dynasty-territory-fill', filter);
      map.setFilter('dynasty-territory-glow', filter);
      map.setFilter('dynasty-territory-casing', filter);
      map.setFilter('dynasty-territory-line', filter);
      applyHoverFilter(map, year, hoveredBoundaryIdRef.current);
      map.setFilter('dynasty-capital-glow', filter);
      map.setFilter('dynasty-capital-core', filter);
      map.setFilter('dynasty-capital-label', filter);
      if (map.getLayer('building-label')) map.setFilter('building-label', activeBuildingLabelFilter(year, selectedLandmarkId));
    }
  }, [onVisibleBuildingsChange, selectedLandmarkId, year]);

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
    const map = mapRef.current;
    buildingLayerRef.current?.setFocus?.(selectedLandmarkId || null);
    if (!map) return;

    const focused = !!selectedLandmarkId;
    if (map.getLayer('building-label')) {
      map.setFilter('building-label', activeBuildingLabelFilter(yearRef.current, selectedLandmarkId));
      map.setPaintProperty('building-label', 'text-opacity', focused
        ? 0.98
        : ['interpolate', ['linear'], ['zoom'], 2, 0.7, 5, 0.92]);
    }

    if (!focused) {
      applyBoundaryFocusPaint(
        map,
        themeRef.current,
        selectedDynastyId,
        hoveredDynastyId || hoveredBoundaryIdRef.current,
        compareIds,
      );
      return;
    }

    if (map.getLayer('dynasty-territory-fill')) {
      map.setPaintProperty('dynasty-territory-fill', 'fill-opacity', 0.018);
    }
    if (map.getLayer('dynasty-territory-glow')) {
      map.setPaintProperty('dynasty-territory-glow', 'line-opacity', 0.07);
      map.setPaintProperty('dynasty-territory-glow', 'line-width', 1.6);
      map.setPaintProperty('dynasty-territory-glow', 'line-blur', 2.4);
    }
    if (map.getLayer('dynasty-territory-casing')) {
      map.setPaintProperty('dynasty-territory-casing', 'line-opacity', 0.13);
    }
    if (map.getLayer('dynasty-territory-line')) {
      map.setPaintProperty('dynasty-territory-line', 'line-opacity', 0.18);
      map.setPaintProperty('dynasty-territory-line', 'line-width', 0.75);
    }
    if (map.getLayer('dynasty-capital-glow')) {
      map.setPaintProperty('dynasty-capital-glow', 'circle-opacity', 0.08);
    }
    if (map.getLayer('dynasty-capital-core')) {
      map.setPaintProperty('dynasty-capital-core', 'circle-opacity', 0.22);
    }
    if (map.getLayer('dynasty-capital-label')) {
      map.setPaintProperty('dynasty-capital-label', 'text-opacity', 0.10);
    }
  }, [compareIds, hoveredDynastyId, selectedDynastyId, selectedLandmarkId, theme, year]);

  useEffect(() => {
    layerVisibilityRef.current = layerVisibility;
    const map = mapRef.current;
    setVisibility(map, 'dynasty-territory-fill', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-glow', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-casing', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-line', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-hover-fill', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-hover', layerVisibility.territories);
    setVisibility(map, 'dynasty-territory-selected-fill', layerVisibility.territories);
    setVisibility(map, 'dynasty-capital-glow', layerVisibility.capitals);
    setVisibility(map, 'dynasty-capital-core', layerVisibility.capitals);
    setVisibility(map, 'dynasty-capital-label', layerVisibility.capitals);
    buildingLayerRef.current?.setLayerVisible(layerVisibility.buildings);
    setVisibility(map, 'building-label', layerVisibility.buildings);
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
    source?.setData(smoothBoundaryCollection(boundaries));
    const outlineSource = mapRef.current?.getSource('dynasty-boundary-outlines');
    outlineSource?.setData(smoothBoundaryCollection(createBoundaryOutlineCollection(boundaries)));
  }, [boundaries]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: darkStyle,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      // 更大俯仰上限：可把视角压更低、看到「地球边缘」星空，更 3D 自由环绕。
      maxPitch: 82,
      // 单世界悬浮星空·自由环绕：关闭世界副本（不重复），但允许把镜头平移/旋转
      // 到任意边缘、越过边缘见星空。
      // 注意：不要加 maxBounds —— 高 pitch 下 MapLibre 为把视锥地面足迹塞进 bounds
      // 会强制 zoom-22 / center 推到角落 → 黑屏（已两次复现）。靠 renderWorldCopies:false
      // 自身约束 + 合适初始 zoom 即可平移到边缘见星空。
      renderWorldCopies: false,
      antialias: true,
      attributionControl: false,
      // 中文都城名（长安/君士坦丁堡…）由浏览器本地字体渲染，避免依赖字体服务的 CJK 字形。
      localIdeographFontFamily: "'Noto Sans CJK SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    });

    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    // 右侧「当前时空」信息面板会盖住地图右部（日本/太平洋等最右地区被挡），
    // 且 renderWorldCopies:false 的平移约束把世界钉在视口里、顶不出面板。
    // 解法：给相机设右侧 padding —— 把"有效视口"内缩到面板左缘，平移约束随之
    // 以更窄的可视区为基准放宽，于是世界可向左推、最右地区移出面板进入可见区。
    // 不用 maxBounds（高 pitch 必触发 zoom-22 黑屏），padding 无投影风险。
    const applyViewportPadding = () => {
      const w = map.getContainer()?.clientWidth || window.innerWidth;
      // 面板约 460px 宽；窄屏按比例收，避免 padding 占满视口。
      const right = w > 1100 ? 360 : Math.round(Math.min(200, w * 0.3));
      map.setPadding({ top: 0, bottom: 0, left: 0, right });
    };
    map.on('load', applyViewportPadding);
    map.on('resize', applyViewportPadding);

    mapRef.current = map;
    window._map = map;

    const buildingLayer = createBuildingLayer(landmarks);
    buildingLayerRef.current = buildingLayer;

    function initDynastyBoundaries() {
      if (!map.getSource('dynasty-boundaries')) {
        map.addSource('dynasty-boundaries', {
          type: 'geojson',
          data: smoothBoundaryCollection(boundariesRef.current),
        });
      }
      if (!map.getSource('dynasty-boundary-outlines')) {
        map.addSource('dynasty-boundary-outlines', {
          type: 'geojson',
          data: smoothBoundaryCollection(createBoundaryOutlineCollection(boundariesRef.current)),
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
            'fill-antialias': false,
          },
        });
      }
      // 边界发光底（宽、糊）—— 样板文明更明显
      if (!map.getLayer('dynasty-territory-glow')) {
        map.addLayer({
          id: 'dynasty-territory-glow',
          type: 'line',
          source: 'dynasty-boundary-outlines',
          filter: activeYearFilter(yearRef.current),
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-opacity': ifRefined(0.45, 0.22),
            'line-width': ifRefined(7, 4),
            'line-blur': 5,
          },
        });
      }
      // 深色衬底（casing）：清亮边下方垫一道近黑藏蓝，让上面的亮线在地形上更跳更干净。
      // 初值即可，随后由 applyBoundaryPaint dark 分支覆写（atlas 分支会把它压成 0）。
      if (!map.getLayer('dynasty-territory-casing')) {
        map.addLayer({
          id: 'dynasty-territory-casing',
          type: 'line',
          source: 'dynasty-boundary-outlines',
          filter: activeYearFilter(yearRef.current),
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': 'rgba(3, 8, 16, 0.85)',
            'line-opacity': ifRefined(0.85, 0.5),
            'line-width': ifRefined(3.4, 2.2),
            'line-blur': 0.4,
          },
        });
      }
      if (!map.getLayer('dynasty-territory-line')) {
        map.addLayer({
          id: 'dynasty-territory-line',
          type: 'line',
          source: 'dynasty-boundary-outlines',
          filter: activeYearFilter(yearRef.current),
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-opacity': ifRefined(0.78, 0.4),
            'line-width': ifRefined(1.4, 0.8),
            'line-blur': 0.3,
            'line-dasharray': [5, 1.4],
          },
        });
      }
      // hover 填充 wash：聚焦的那一国用自身颜色淡淡铺满，读作"这片是它的疆域"。
      // 放在亮边层之下，保证金色亮边压在 wash 之上更清晰。
      if (!map.getLayer('dynasty-territory-hover-fill')) {
        map.addLayer({
          id: 'dynasty-territory-hover-fill',
          type: 'fill',
          source: 'dynasty-boundaries',
          filter: boundaryHoverFilter(yearRef.current, hoveredBoundaryIdRef.current),
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.16,
            'fill-antialias': false,
          },
        });
      }
      if (!map.getLayer('dynasty-territory-hover')) {
        map.addLayer({
          id: 'dynasty-territory-hover',
          type: 'line',
          source: 'dynasty-boundary-outlines',
          filter: boundaryHoverFilter(yearRef.current, hoveredBoundaryIdRef.current),
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#f6d58f',
            'line-opacity': 0.98,
            'line-width': ['interpolate', ['linear'], ['zoom'], 2, 2.6, 5, 4.4],
            'line-blur': 1,
          },
        });
      }
      // 选中态填充（被点击的领土持续高亮）：金色 accent，与 hover 的彩色 wash 区分语义。
      if (!map.getLayer('dynasty-territory-selected-fill')) {
        map.addLayer({
          id: 'dynasty-territory-selected-fill',
          type: 'fill',
          source: 'dynasty-boundaries',
          filter: boundaryHoverFilter(yearRef.current, '__none__'),
          paint: {
            'fill-color': '#f6d58f',
            'fill-opacity': 0.14,
            'fill-antialias': false,
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
      // 都城名标注（dark-only symbol 层，复用同一 GeoJSON 源）。
      // 显隐三重控制：年代 filter（与都城点同步）、"都城"图层开关（visibility）、
      // 主题（text-opacity 由 applyBoundaryPaint 设；atlas=0）。中文走本地字体，
      // 拉丁/标点用 demotiles Noto Sans。碰撞按 importance 排序，低 zoom 自然只剩重点都城。
      if (!map.getLayer('dynasty-capital-label')) {
        map.addLayer({
          id: 'dynasty-capital-label',
          type: 'symbol',
          source: 'dynasty-capitals',
          filter: activeYearFilter(yearRef.current),
          layout: {
            'text-field': ['get', 'capital'],
            'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10.5, 4, 13, 6.5, 16],
            'text-anchor': 'top',
            'text-offset': [0, 0.75],
            'text-max-width': 7,
            'text-padding': 4,
            'text-allow-overlap': false,
            'symbol-sort-key': ['-', 5, ['get', 'importance']],
          },
          paint: {
            'text-color': '#ffe9cc',
            'text-halo-color': 'rgba(6, 10, 18, 0.9)',
            'text-halo-width': 1.4,
            'text-halo-blur': 0.6,
            // text-opacity 由 applyBoundaryPaint 按主题设置（dark 淡入 / atlas 0）。
          },
        });
      }
    }

    // 建筑常驻淡标注：3D 建筑模型旁常显一行淡名牌，不点也能识别是什么建筑。
    // 复用建筑年代 filter（与模型同步显隐）、"建筑"图层开关（visibility）。
    // 字号小、低透明、碰撞按 importance 排序——低 zoom 自动只留重点，避免糊成一片。
    function initBuildingLabels() {
      if (!map.getSource('dynasty-buildings')) {
        map.addSource('dynasty-buildings', {
          type: 'geojson',
          data: createBuildingLabelGeoJson(landmarks),
        });
      }
      if (!map.getLayer('building-label')) {
        map.addLayer({
          id: 'building-label',
          type: 'symbol',
          source: 'dynasty-buildings',
          filter: activeYearFilter(yearRef.current),
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9.5, 4.5, 11.5, 7, 14],
            'text-anchor': 'top',
            'text-offset': [0, 1.05],
            'text-max-width': 8,
            'text-padding': 6,
            'text-optional': true,
            'text-allow-overlap': false,
            'symbol-sort-key': ['-', 5, ['get', 'importance']],
          },
          paint: {
            'text-color': 'rgba(228, 238, 252, 0.82)',
            'text-halo-color': 'rgba(5, 9, 16, 0.92)',
            'text-halo-width': 1.3,
            'text-halo-blur': 0.5,
            'text-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.7, 5, 0.92],
          },
        });
      }
    }

    // 海面雕版波纹：生成一次平铺纹理并绑到 atlas-ocean-texture 的 fill-pattern。
    // 幂等：图已注册 / 图层缺失都安全跳过。失败不影响其余图层。
    function initOceanTexture() {
      try {
        if (!map.hasImage('atlas-wave')) {
          const pattern = makeWavePattern();
          if (pattern) map.addImage('atlas-wave', pattern, { pixelRatio: 2 });
        }
        if (map.hasImage('atlas-wave') && map.getLayer('atlas-ocean-texture')) {
          map.setPaintProperty('atlas-ocean-texture', 'fill-pattern', 'atlas-wave');
        }
      } catch (error) {
        console.warn('ocean texture init failed', error);
      }
    }

    function initBuildingLayer() {
      if (map.getLayer('buildings-3d')) return;
      try {
        initDynastyBoundaries();
        initDynastyCapitals();
        initOceanTexture();
        map.addLayer(buildingLayer);
        initBuildingLabels();
        setVisibility(map, 'dynasty-territory-fill', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-glow', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-casing', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-line', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-hover-fill', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-hover', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-territory-selected-fill', layerVisibilityRef.current.territories);
        setVisibility(map, 'dynasty-capital-glow', layerVisibilityRef.current.capitals);
        setVisibility(map, 'dynasty-capital-core', layerVisibilityRef.current.capitals);
        setVisibility(map, 'dynasty-capital-label', layerVisibilityRef.current.capitals);
        buildingLayer.setLayerVisible(layerVisibilityRef.current.buildings);
        buildingLayer.setFocus?.(selectedLandmarkIdRef.current || null);
        setVisibility(map, 'building-label', layerVisibilityRef.current.buildings);
        if (map.getLayer('building-label')) {
          map.setFilter('building-label', activeBuildingLabelFilter(yearRef.current, selectedLandmarkIdRef.current));
        }
        onVisibleBuildingsChange(buildingLayer.setYear(yearRef.current));
        // 图层创建后立即把当前主题套上去
        applyMapTheme(map, themeRef.current);
        buildingLayer.setTheme?.(themeRef.current);
      } catch (error) {
        console.error('addLayer failed', error);
      }
    }

    let mapIsReady = false;
    let readyFallback = window.setTimeout(() => markMapReady(), 4500);
    let warningTimer = null;

    function markMapReady() {
      mapIsReady = true;
      window.clearTimeout(readyFallback);
      readyFallback = null;
      // 底图瓦片已绘出，放行 3D 建筑渲染（之前一直被 _baseReady 门控隐藏），
      // 让建筑在有底图的前提下"长出来"，而非悬浮在黑色虚空里。
      buildingLayerRef.current?.setBaseReady?.(true);
      setMapReady(true);
      // 地图就绪后清掉"加载较慢"的提示——瓦片已补齐，横幅不该再占着首屏中心。
      if (warningTimer) { window.clearTimeout(warningTimer); warningTimer = null; }
      setMapWarning('');
    }

    function clearMapWarning() {
      if (warningTimer) { window.clearTimeout(warningTimer); warningTimer = null; }
      setMapWarning('');
    }

    // 底图栅格源一旦补齐瓦片就立刻放行建筑（通常早于 idle），缩短首屏纯黑等待。
    function handleBaseSourceData(event) {
      if (!event?.isSourceLoaded) return;
      const sid = event.sourceId || '';
      if (sid.startsWith('osm-tiles') && map.isSourceLoaded(sid)) {
        buildingLayerRef.current?.setBaseReady?.(true);
        map.off('sourcedata', handleBaseSourceData);
      }
    }

    function handleMapError(event) {
      const sourceId = event?.sourceId || event?.source?.id || '';
      const errorText = String(event?.error?.message || event?.error || '');
      if (/abort|cancel/i.test(errorText)) return;
      // 只对底图 / 地形瓦片源报警（底图源实际命名为 osm-tiles-dark / osm-tiles-atlas）。
      if (sourceId.startsWith('osm-tiles') || sourceId.includes('terrain')) {
        if (warningTimer) window.clearTimeout(warningTimer);
        warningTimer = window.setTimeout(() => {
          const tilesStable = map.areTilesLoaded?.() ?? false;
          if (!mapIsReady || !tilesStable) {
            setMapWarning('地图瓦片加载较慢，沙盘仍可操作；如地形短暂缺失，稍后会自动补齐。');
            warningTimer = window.setTimeout(() => { setMapWarning(''); warningTimer = null; }, 5000);
          } else {
            warningTimer = null;
          }
        }, mapIsReady ? 5000 : 1800);
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

    // Building hover-pick is coalesced to at most one run per animation frame
    // (mousemove can fire many times per frame) and skipped while the camera is
    // moving, since projecting against an in-flight camera is wasted work.
    let pickRaf = 0;
    let lastPickPoint = null;
    let lastClient = { x: 0, y: 0 };

    function runPick() {
      pickRaf = 0;
      if (!layerVisibilityRef.current.buildings || !lastPickPoint) return;
      if (map.isMoving()) {
        setTooltip((current) => (current.visible ? { visible: false, x: 0, y: 0, building: null } : current));
        return;
      }
      const best = pickBuilding(lastPickPoint);
      if (best) {
        setTooltip({ visible: true, x: lastClient.x + 14, y: lastClient.y + 14, building: best });
        map.getCanvas().style.cursor = 'pointer';
      } else {
        setTooltip((current) => (current.visible ? { visible: false, x: 0, y: 0, building: null } : current));
        map.getCanvas().style.cursor = '';
      }
    }

    function handleMouseMove(event) {
      if (!layerVisibilityRef.current.buildings) return;
      lastPickPoint = event.point;
      lastClient = { x: event.originalEvent.clientX, y: event.originalEvent.clientY };
      if (!pickRaf) pickRaf = requestAnimationFrame(runPick);
    }

    function handleClick(event) {
      if (!layerVisibilityRef.current.buildings) return;
      const best = pickBuilding(event.point);
      if (best) {
        event.preventDefault();
        map.flyTo(focusCameraForBuilding(best, 1800));
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
      applyHoverFilter(map, yearRef.current, id);
      map.getCanvas().style.cursor = 'pointer';
      // 地图 → 列表：通知 App，让右侧对应文明行同步高亮。
      onHoverDynastyRef.current?.(id);
    }

    function handleTerritoryLeave() {
      hoveredBoundaryIdRef.current = null;
      applyHoverFilter(map, yearRef.current, null);
      map.getCanvas().style.cursor = '';
      onHoverDynastyRef.current?.(null);
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
    map.on('idle', clearMapWarning);
    map.on('sourcedata', handleBaseSourceData);
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
      if (warningTimer) window.clearTimeout(warningTimer);
      if (pickRaf) cancelAnimationFrame(pickRaf);
      map.off('load', initBuildingLayer);
      map.off('styledata', initBuildingLayer);
      map.off('sourcedata', handleBaseSourceData);
      map.off('idle', clearMapWarning);
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
      {/* 屏幕空间羊皮纸 + 暗角覆层：只在 atlas 主题显形（CSS 门控），
          盖在地图画布之上、UI 面板之下。屏幕空间所以不随 pitch/zoom 变形。 */}
      <div className="atlas-paper-overlay" aria-hidden="true" />
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
            setTerrainMode(mapRef.current, 'mountain', themeRef.current);
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
            setTerrainMode(mapRef.current, 'world', themeRef.current);
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
        {/* 主题切换按钮已冻结：atlas（羊皮纸/写实）主题暂停投入，
            统一走深色"地球夜景"。toggleTheme / atlas 代码与 CSS 保留，仅隐藏入口。
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
        */}
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

            {boundaryCard.phaseName ? (
              <div className="territory-phase">
                <span className="phase-label">当前阶段</span>
                <span className="phase-name" style={{ color: boundaryCard.color }}>
                  {boundaryCard.phaseName}
                </span>
                {(typeof boundaryCard.phaseStartYear === 'number'
                  && typeof boundaryCard.phaseEndYear === 'number') ? (
                  <span className="phase-range">
                    （{formatYear(boundaryCard.phaseStartYear)}–{formatYear(boundaryCard.phaseEndYear)}）
                  </span>
                ) : null}
                {boundaryCard.phaseLabel ? (
                  <span className="phase-sub">{boundaryCard.phaseLabel}</span>
                ) : null}
              </div>
            ) : null}

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
                    <span className="event-body">
                      <span className="event-title">{event.title}</span>
                      {(event.sourceRefs?.length || event.sourceNote) ? (
                        <small className="event-source">
                          {event.sourceRefs?.length
                            ? `来源：${event.sourceRefs.map((reference) => reference.title).join('；')}`
                            : `来源：${event.sourceNote}`}
                        </small>
                      ) : null}
                    </span>
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

            {(boundaryCard.dynastySourceNote || boundaryCard.references?.length) ? (
              <section className="territory-civilization-sources">
                <div className="territory-subtitle">文明来源</div>
                {boundaryCard.dynastySourceNote ? (
                  <p>{boundaryCard.dynastySourceNote}</p>
                ) : null}
                {boundaryCard.references?.length ? (
                  <div className="territory-reference-list" aria-label="参考资料">
                    {boundaryCard.references.slice(0, 3).map((reference) => (
                      <span key={reference.id} title={reference.note || reference.title}>
                        {reference.title}
                        {reference.year ? ` (${reference.year})` : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {(boundaryCard.accuracyLabel || boundaryCard.boundarySourceNote || boundaryCard.accuracyNote) ? (
              <footer className="territory-footer">
                {boundaryCard.accuracyLabel ? (
                  <div className="territory-quality" title={boundaryCard.accuracyNote}>
                    <span>边界精度</span>
                    <em>{boundaryCard.accuracyLabel}</em>
                  </div>
                ) : null}
                {boundaryCard.boundarySourceNote || boundaryCard.accuracyNote ? (
                  <div className="territory-source">
                    {boundaryCard.boundarySourceNote || boundaryCard.accuracyNote}
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
