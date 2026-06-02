import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CloudLayer from './components/CloudLayer.jsx';
import ComparePanel from './components/ComparePanel.jsx';
import EraNarrative from './components/EraNarrative.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import LandmarkCard from './components/LandmarkCard.jsx';
import LayerControls from './components/LayerControls.jsx';
import MapScene from './components/MapScene.jsx';
import Starfield from './components/Starfield.jsx';
import Timeline from './components/Timeline.jsx';
import boundaries from './data/boundaries-simplified.json';
import dynasties from './data/dynasties.json';
import landmarks from './data/landmarks.json';
import { buildCardData } from './utils/buildCard.js';
import { formatYear } from './utils/formatYear.js';
import { pickPhaseFeature } from './utils/phase.js';

const OVERLAY_DRIFT = { x: 2.5, y: 0.6 };
const COMPARE_LIMIT = 2;

export default function App() {
  const [year, setYear] = useState(1000);
  const [visibleBuildings, setVisibleBuildings] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({
    territories: true,
    capitals: true,
    buildings: true,
  });
  const [selectedDynastyId, setSelectedDynastyId] = useState(null);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState(null);
  // 共享悬停态：地图疆域 ↔ 右侧文明列表 双向高亮联动的单一数据源。
  const [hoveredDynastyId, setHoveredDynastyId] = useState(null);
  const [locked, setLocked] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareNotice, setCompareNotice] = useState('');
  const [filter, setFilter] = useState({ regions: [], tags: [] });
  // atlas 主题已冻结：始终锁定深色"文明星图"，并清掉历史里残留的 atlas 选择，
  // 避免老用户被旧的 localStorage 卡在发白的 atlas 底图上。
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    try {
      if (window.localStorage?.getItem('history-atlas:theme') === 'atlas') {
        window.localStorage.setItem('history-atlas:theme', 'dark');
      }
    } catch (e) { /* ignore */ }
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'atlas' ? 'dark' : 'atlas';
      try { window.localStorage?.setItem('history-atlas:theme', next); } catch (e) { /* ignore quota */ }
      return next;
    });
  }, []);
  const mapSceneRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
  }, [theme]);

  // Lookups
  const dynastyById = useMemo(() => new Map(dynasties.map((d) => [d.id, d])), []);
  const landmarksById = useMemo(() => new Map(landmarks.map((l) => [l.id, l])), []);
  const boundariesById = useMemo(
    () => new Map((boundaries.features || []).map((f) => [f.properties?.id || f.id, f])),
    [],
  );
  // Sample civilizations have multiple phased features under the same id;
  // keep the full list so we can pick the one matching the current year.
  const boundaryFeaturesById = useMemo(() => {
    const m = new Map();
    for (const f of boundaries.features || []) {
      const id = f.properties?.id || f.id;
      if (!m.has(id)) m.set(id, []);
      m.get(id).push(f);
    }
    return m;
  }, []);

  const sortedVisibleBuildings = useMemo(
    () => {
      const visibleFromLayer = visibleBuildings.length > 0
        ? visibleBuildings
        : landmarks.filter((building) => year >= building.startYear && year <= building.endYear);
      return [...visibleFromLayer].sort((a, b) => a.startYear - b.startYear);
    },
    [visibleBuildings, year],
  );

  // Active dynasties for the given year, then filtered.
  const activeDynastiesAll = useMemo(
    () => dynasties
      .filter((dynasty) => year >= dynasty.startYear && year <= dynasty.endYear)
      .sort((a, b) => a.startYear - b.startYear),
    [year],
  );
  const activeDynasties = useMemo(() => {
    const { regions, tags } = filter;
    if (!regions.length && !tags.length) return activeDynastiesAll;
    const regionSet = new Set(regions);
    const tagSet = new Set(tags);
    return activeDynastiesAll.filter((d) => {
      const regionOk = !regions.length || regionSet.has(d.region);
      const tagOk = !tags.length || (d.tags || []).some((t) => tagSet.has(t));
      return regionOk && tagOk;
    });
  }, [activeDynastiesAll, filter]);

  // Card data derived from selection.
  const selectedDynasty = selectedDynastyId ? dynastyById.get(selectedDynastyId) : null;
  const selectedLandmark = selectedLandmarkId ? landmarksById.get(selectedLandmarkId) : null;
  const boundaryCard = useMemo(() => {
    if (!selectedDynasty) return null;
    const features = boundaryFeaturesById.get(selectedDynasty.id) || [];
    const phaseFeature = pickPhaseFeature(features, year) || boundariesById.get(selectedDynasty.id) || null;
    return buildCardData(selectedDynasty, phaseFeature, landmarksById);
  }, [selectedDynasty, boundaryFeaturesById, boundariesById, landmarksById, year]);

  // Compare list resolves ids to full dynasty records.
  const compareDynasties = useMemo(
    () => compareIds.map((id) => dynastyById.get(id)).filter(Boolean),
    [compareIds, dynastyById],
  );

  const filterActive = filter.regions.length > 0 || filter.tags.length > 0;

  // Closing the card auto-unlocks too.
  const closeCard = useCallback(() => {
    setSelectedDynastyId(null);
    setLocked(false);
  }, []);
  const closeLandmarkCard = useCallback(() => setSelectedLandmarkId(null), []);
  const toggleLock = useCallback(() => setLocked((v) => !v), []);

  // When the year changes, auto-close non-locked card.
  useEffect(() => {
    if (!locked && selectedDynastyId) {
      setSelectedDynastyId(null);
    }
    if (selectedLandmarkId) {
      const selected = landmarksById.get(selectedLandmarkId);
      if (selected && (year < selected.startYear || year > selected.endYear)) {
        setSelectedLandmarkId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // Body-level state classes so CSS can let panels make room for one another.
  useEffect(() => {
    const cls = document.body.classList;
    cls.toggle('has-card', !!boundaryCard || !!selectedLandmark);
    cls.toggle('has-compare', compareIds.length > 0);
    cls.toggle('filter-active', filterActive);
    return () => {
      cls.remove('has-card');
      cls.remove('has-compare');
      cls.remove('filter-active');
    };
  }, [boundaryCard, selectedLandmark, compareIds.length, filterActive]);

  // openDynasty by id or full object. Optionally fly to it.
  const openDynasty = useCallback((dynastyOrId, opts = {}) => {
    const dynasty = typeof dynastyOrId === 'string'
      ? dynastyById.get(dynastyOrId)
      : dynastyOrId;
    if (!dynasty) return;
    setSelectedDynastyId(dynasty.id);
    setSelectedLandmarkId(null);
    if (opts.fly !== false) {
      mapSceneRef.current?.flyToDynasty(dynasty);
    }
  }, [dynastyById]);

  // 单一稳定回调：地图侧 hover 与列表侧 hover 都写它（memo 子组件不会因此频繁失效）。
  const handleHoverDynasty = useCallback((id) => setHoveredDynastyId(id || null), []);

  const openLandmark = useCallback((landmarkOrId, opts = {}) => {
    const landmark = typeof landmarkOrId === 'string'
      ? landmarksById.get(landmarkOrId)
      : landmarkOrId;
    if (!landmark) return;
    setSelectedLandmarkId(landmark.id);
    setSelectedDynastyId(null);
    setLocked(false);
    if (opts.fly !== false) {
      mapSceneRef.current?.flyToBuilding(landmark);
    }
  }, [landmarksById]);

  const addCompare = useCallback((id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length >= COMPARE_LIMIT) {
        setCompareNotice(`最多对比 ${COMPARE_LIMIT} 个文明，先移除一个再添加`);
        return prev;
      }
      return [...prev, id];
    });
  }, []);
  const removeCompare = useCallback((id) => {
    setCompareIds((prev) => prev.filter((x) => x !== id));
  }, []);
  const clearCompare = useCallback(() => setCompareIds([]), []);

  // Auto-dismiss compare notice
  useEffect(() => {
    if (!compareNotice) return undefined;
    const handle = setTimeout(() => setCompareNotice(''), 2400);
    return () => clearTimeout(handle);
  }, [compareNotice]);

  // Stable wrappers so memoized panels (ComparePanel / LandmarkCard / InfoPanel)
  // don't see a new callback identity on every (year-driven) App render.
  const openDynastyFly = useCallback((dynastyOrId) => openDynasty(dynastyOrId, { fly: true }), [openDynasty]);
  const openLandmarkFly = useCallback((landmarkOrId) => openLandmark(landmarkOrId, { fly: true }), [openLandmark]);
  const flyToBuilding = useCallback((landmark) => mapSceneRef.current?.flyToBuilding(landmark), []);

  const handleSearchSelect = useCallback((item) => {
    if ('capital' in item && item.capital) {
      // dynasty
      openDynasty(item, { fly: true });
    } else {
      // building
      openLandmark(item, { fly: true });
    }
  }, [openDynasty, openLandmark]);

  const handleEventClick = useCallback((event) => {
    if (!event?.dynastyId) return;
    openDynasty(event.dynastyId, { fly: true });
    setLocked(true);
  }, [openDynasty]);

  return (
    <>
      <Starfield
        id="stars-bg"
        density={5500}
        minR={0.2}
        maxR={1}
        baseAlpha={0.22}
        color="200, 220, 255"
        bgGradient
        twinkle
        twinkleRatio={0.1}
      />
      <MapScene
        ref={mapSceneRef}
        boundaries={boundaries}
        dynasties={dynasties}
        landmarks={landmarks}
        layerVisibility={layerVisibility}
        year={year}
        theme={theme}
        selectedDynastyId={selectedDynastyId}
        selectedLandmarkId={selectedLandmarkId}
        hoveredDynastyId={hoveredDynastyId}
        locked={locked}
        boundaryCard={boundaryCard}
        compareIds={compareIds}
        onVisibleBuildingsChange={setVisibleBuildings}
        onHoverDynasty={handleHoverDynasty}
        onSelectDynasty={(id) => openDynasty(id, { fly: false })}
        onSelectBuilding={(building) => openLandmark(building, { fly: false })}
        onCloseCard={closeCard}
        onToggleLock={toggleLock}
        onAddCompare={addCompare}
        onRemoveCompare={removeCompare}
        onToggleTheme={toggleTheme}
      />
      <Starfield
        id="stars-overlay"
        density={17000}
        minR={0.4}
        maxR={1.5}
        baseAlpha={0.42}
        color="210, 230, 255"
        drift={OVERLAY_DRIFT}
      />
      <CloudLayer />
      {/* 星图卡装裱框（仅 dark 主题可见，CSS 控制；atlas 下整体隐藏） */}
      <div className="map-frame" aria-hidden="true">
        <span className="map-frame-corner tl" />
        <span className="map-frame-corner tr" />
        <span className="map-frame-corner bl" />
        <span className="map-frame-corner br" />
        <span className="map-frame-compass">
          <span className="map-frame-compass-n">N</span>
        </span>
      </div>

      <div className="title">
        历史沙盘
        <span className="sub">文明星图 · ATLAS OF CIVILIZATIONS</span>
      </div>

      <LayerControls
        dynasties={dynasties}
        landmarks={landmarks}
        layerVisibility={layerVisibility}
        onLayerVisibilityChange={setLayerVisibility}
        onSelectBuilding={handleSearchSelect}
        onSelectDynasty={handleSearchSelect}
      />

      <FilterPanel
        dynasties={dynasties}
        filter={filter}
        onFilterChange={setFilter}
      />

      <InfoPanel
        year={year}
        buildings={sortedVisibleBuildings}
        dynasties={activeDynasties}
        totalActive={activeDynastiesAll.length}
        selectedDynastyId={selectedDynastyId}
        hoveredDynastyId={hoveredDynastyId}
        locked={locked}
        compareIds={compareIds}
        filterActive={filterActive}
        onSelectBuilding={openLandmarkFly}
        onSelectDynasty={openDynastyFly}
        onHoverDynasty={handleHoverDynasty}
        onAddCompare={addCompare}
        onRemoveCompare={removeCompare}
      />

      <EraNarrative
        year={year}
        dynasties={activeDynasties}
        onSelectEvent={handleEventClick}
      />

      <LandmarkCard
        landmark={selectedLandmark}
        dynastyById={dynastyById}
        onClose={closeLandmarkCard}
        onFlyTo={flyToBuilding}
      />

      <ComparePanel
        dynasties={compareDynasties}
        onRemove={removeCompare}
        onClear={clearCompare}
        onSelect={openDynastyFly}
      />

      {compareNotice ? (
        <div className="compare-notice" role="status">{compareNotice}</div>
      ) : null}

      <Timeline year={year} onYearChange={setYear} formatYear={formatYear} />
    </>
  );
}
