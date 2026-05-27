// MapLibre style + 主题切换助手
// 当前支持两个视觉主题：
//   - dark：深色 HUD 沙盘（默认）
//   - atlas：古地图浮雕 / 羊皮纸（17 世纪荷兰海图风）
//
// 主题不是在 style.json 里"二选一构造"，而是同一个 style 跑两套 paint。
// 切主题不需要 setStyle()（会丢自定义层 / 3D 建筑），
// 用 setPaintProperty / setLayoutProperty / setSky 改样式 + 切换 base 源。

export const INITIAL_VIEW = { center: [55, 35], zoom: 3.2, pitch: 55, bearing: -22 };
export const MOUNTAIN_VIEW = { center: [86.9, 27.99], zoom: 6.2, pitch: 68, bearing: -35 };

export const WORLD_TERRAIN_EXAGGERATION = 0.18;
export const MOUNTAIN_TERRAIN_EXAGGERATION = 2.6;

// CARTO 公共栅格瓦片（无需 API key）。两套基底，按主题切 visibility。
const DARK_BASE_TILES = [
  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
];
const ATLAS_BASE_TILES = [
  'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
];

export const darkStyle = {
  version: 8,
  sources: {
    'osm-tiles-dark': {
      type: 'raster',
      tiles: DARK_BASE_TILES,
      tileSize: 256,
      attribution: '',
    },
    'osm-tiles-atlas': {
      type: 'raster',
      tiles: ATLAS_BASE_TILES,
      tileSize: 256,
      attribution: '',
    },
    'terrain-dem': {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 15,
      attribution: '<a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles</a>',
    },
    'terrain-dem-shade': {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 15,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#04080f' } },
    {
      id: 'base-dark',
      type: 'raster',
      source: 'osm-tiles-dark',
      paint: {
        'raster-opacity': 0.86,
        'raster-contrast': 0.12,
        'raster-saturation': -0.18,
      },
    },
    {
      id: 'base-atlas',
      type: 'raster',
      source: 'osm-tiles-atlas',
      paint: {
        // 用 opacity 0 隐藏（不用 visibility:none）以保证瓦片照常预取，
        // 切到 atlas 主题时即时显示，无加载等待。
        'raster-opacity': 0,
        'raster-contrast': -0.05,
        'raster-saturation': -0.15,
        'raster-brightness-min': 0.18,
        'raster-brightness-max': 0.98,
        'raster-hue-rotate': 20,
      },
    },
    {
      id: 'terrain-shade',
      type: 'hillshade',
      source: 'terrain-dem-shade',
      paint: {
        'hillshade-exaggeration': 0,
        'hillshade-shadow-color': 'rgba(0, 0, 0, 0.72)',
        'hillshade-highlight-color': 'rgba(155, 185, 220, 0.28)',
        'hillshade-accent-color': 'rgba(95, 120, 155, 0.30)',
      },
    },
  ],
  terrain: { source: 'terrain-dem', exaggeration: WORLD_TERRAIN_EXAGGERATION },
  sky: {
    'sky-color': '#0a1428',
    'sky-horizon-blend': 0.5,
    'horizon-color': '#1a2a44',
    'horizon-fog-blend': 0.6,
    'fog-color': '#04080f',
    'fog-ground-blend': 0.1,
  },
};

export const THEME_PRESETS = {
  dark: {
    background: '#04080f',
    base: 'base-dark',
    hillshade: {
      shadow: 'rgba(0, 0, 0, 0.72)',
      highlight: 'rgba(155, 185, 220, 0.28)',
      accent: 'rgba(95, 120, 155, 0.30)',
    },
    sky: {
      'sky-color': '#0a1428',
      'sky-horizon-blend': 0.5,
      'horizon-color': '#1a2a44',
      'horizon-fog-blend': 0.6,
      'fog-color': '#04080f',
      'fog-ground-blend': 0.1,
    },
    boundary: {
      glowOpacityRefined: 0.45,
      glowOpacityPlain: 0.22,
      lineOpacityRefined: 0.78,
      lineOpacityPlain: 0.40,
      lineDash: [5, 1.4],
      fillOpacityRefined: 0.11,
      fillOpacityPlain: 0.05,
    },
  },
  atlas: {
    background: '#2a4f5a', // 深蓝绿色海洋背景（瓦片之间和瓦片缝隙都是这色）
    base: 'base-atlas',
    hillshade: {
      shadow: 'rgba(60, 38, 22, 0.55)',
      highlight: 'rgba(252, 240, 215, 0.40)',
      accent: 'rgba(140, 90, 50, 0.32)',
    },
    sky: {
      'sky-color': '#dac79a',
      'sky-horizon-blend': 0.65,
      'horizon-color': '#a98452',
      'horizon-fog-blend': 0.55,
      'fog-color': '#e3cb98',
      'fog-ground-blend': 0.05,
    },
    boundary: {
      glowOpacityRefined: 0.32,
      glowOpacityPlain: 0.16,
      lineOpacityRefined: 0.88,
      lineOpacityPlain: 0.48,
      lineDash: [3, 1.2],
      fillOpacityRefined: 0.07,
      fillOpacityPlain: 0.03,
    },
  },
};

/** 给朝代边界 / 都城点套上当前主题的画风。供 MapScene 在 layer 创建后或主题切换后调用。 */
export function applyBoundaryPaint(map, themeKey) {
  if (!map) return;
  const preset = THEME_PRESETS[themeKey] || THEME_PRESETS.dark;
  const isAtlas = themeKey === 'atlas';

  const isRefinedExpr = [
    'in', ['get', 'accuracy'],
    ['literal', ['rough-refined', 'coastline-aware-rough']],
  ];

  if (map.getLayer('dynasty-territory-fill')) {
    map.setPaintProperty('dynasty-territory-fill', 'fill-opacity', [
      'case', isRefinedExpr, preset.boundary.fillOpacityRefined, preset.boundary.fillOpacityPlain,
    ]);
  }

  if (map.getLayer('dynasty-territory-glow')) {
    if (isAtlas) {
      map.setPaintProperty('dynasty-territory-glow', 'line-color', '#c9a44b');
      map.setPaintProperty('dynasty-territory-glow', 'line-width', ['case', isRefinedExpr, 5, 3]);
    } else {
      map.setPaintProperty('dynasty-territory-glow', 'line-color', ['get', 'color']);
      map.setPaintProperty('dynasty-territory-glow', 'line-width', ['case', isRefinedExpr, 8, 5]);
    }
    map.setPaintProperty('dynasty-territory-glow', 'line-opacity', [
      'case', isRefinedExpr, preset.boundary.glowOpacityRefined, preset.boundary.glowOpacityPlain,
    ]);
  }

  if (map.getLayer('dynasty-territory-line')) {
    if (isAtlas) {
      map.setPaintProperty('dynasty-territory-line', 'line-color', '#3a2a18');
    } else {
      map.setPaintProperty('dynasty-territory-line', 'line-color', ['get', 'color']);
    }
    map.setPaintProperty('dynasty-territory-line', 'line-opacity', [
      'case', isRefinedExpr, preset.boundary.lineOpacityRefined, preset.boundary.lineOpacityPlain,
    ]);
    map.setPaintProperty('dynasty-territory-line', 'line-dasharray', preset.boundary.lineDash);
  }

  if (map.getLayer('dynasty-capital-core')) {
    map.setPaintProperty('dynasty-capital-core', 'circle-color', isAtlas ? '#b22222' : ['get', 'color']);
    map.setPaintProperty('dynasty-capital-core', 'circle-stroke-color',
      isAtlas ? 'rgba(60, 20, 16, 0.8)' : 'rgba(240, 248, 255, 0.9)');
  }
  if (map.getLayer('dynasty-capital-glow')) {
    map.setPaintProperty('dynasty-capital-glow', 'circle-color', isAtlas ? '#b22222' : ['get', 'color']);
  }
}

/**
 * 应用整套主题（背景 / base 可见性 / hillshade / sky / 边界）。
 * 切主题时由 MapScene 调用。
 */
export function applyMapTheme(map, themeKey) {
  if (!map) return;
  const preset = THEME_PRESETS[themeKey] || THEME_PRESETS.dark;

  if (map.getLayer('bg')) {
    map.setPaintProperty('bg', 'background-color', preset.background);
  }
  // 两层基底都保持加载（visibility:visible），用 opacity 切显隐：
  //   dark 主题：base-dark 0.86，base-atlas 0
  //   atlas 主题：base-dark 0，base-atlas 0.95
  if (map.getLayer('base-dark')) {
    map.setPaintProperty('base-dark', 'raster-opacity', preset.base === 'base-dark' ? 0.86 : 0);
  }
  if (map.getLayer('base-atlas')) {
    map.setPaintProperty('base-atlas', 'raster-opacity', preset.base === 'base-atlas' ? 0.95 : 0);
  }
  if (map.getLayer('terrain-shade')) {
    map.setPaintProperty('terrain-shade', 'hillshade-shadow-color', preset.hillshade.shadow);
    map.setPaintProperty('terrain-shade', 'hillshade-highlight-color', preset.hillshade.highlight);
    map.setPaintProperty('terrain-shade', 'hillshade-accent-color', preset.hillshade.accent);
  }
  if (typeof map.setSky === 'function') {
    map.setSky(preset.sky);
  }
  applyBoundaryPaint(map, themeKey);
}

export function setTerrainMode(map, mode) {
  if (!map) return;
  const isMountain = mode === 'mountain';
  map.setTerrain({
    source: 'terrain-dem',
    exaggeration: isMountain ? MOUNTAIN_TERRAIN_EXAGGERATION : WORLD_TERRAIN_EXAGGERATION,
  });
  if (map.getLayer('terrain-shade')) {
    map.setPaintProperty('terrain-shade', 'hillshade-exaggeration', isMountain ? 0.75 : 0);
  }
}
