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
  // @2x 高清瓦片：拉近时更锐利，缓解栅格过缩放的模糊
  'https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png',
  'https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png',
  'https://c.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png',
];

import atlasLand from '../data/atlas-land-110m.json';

// 海洋遮罩：世界矩形为外环，每块陆地的外环作为"洞"，于是只有海洋被填色。
// 放在 hillshade 之上、海岸线之下，用一层干净深蓝绿盖住海底 relief，
// 陆地因为是镂空所以浮雕照常透出。这是制图里常用的 ocean mask 技法。
const ATLAS_OCEAN_MASK = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[-180, -85], [-180, 85], [180, 85], [180, -85], [-180, -85]],
          ...atlasLand.features.map((f) => f.geometry.coordinates[0]),
        ],
      },
    },
  ],
};
const ATLAS_OCEAN_COLOR = '#0e2a44'; // 深邃藏蓝 / 墨蓝（写实深海，Civ 风），整体压暗

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
      tileSize: 512, // 配合 @2x 高清瓦片
      attribution: '',
    },
    // 小体积 Natural Earth 110m land（约 197 KB 原始 / gzip 约 65 KB）。
    // 仅用于 atlas 模式分离海陆与画海岸线。
    'atlas-land': {
      type: 'geojson',
      data: atlasLand,
    },
    'atlas-ocean': {
      type: 'geojson',
      data: ATLAS_OCEAN_MASK,
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
        // 深色"地球夜景"底：在近黑的 dark_all 上加一点冷蓝，让海"深邃"而非死黑，
        // 陆地高光压住保持幽暗。
        'raster-opacity': 0.86,
        'raster-contrast': 0.18,
        'raster-saturation': 0.1,
        'raster-hue-rotate': 202,
        'raster-brightness-min': 0.0,
        'raster-brightness-max': 0.9,
      },
    },
    {
      id: 'base-atlas',
      type: 'raster',
      source: 'osm-tiles-atlas',
      paint: {
        // atlas 模式作为"拟真地貌底图"：让 voyager 真实地表（沙漠/森林/草原/山地）
        // 充分透出，配合 hillshade 浮雕形成"地图模型"感（而非羊皮纸）。
        // 海洋部分会被上方 ocean mask 盖掉，所以只在陆地可见。
        'raster-opacity': 0,
        'raster-contrast': 0.24,
        'raster-saturation': 0.34, // 提高饱和，让陆地的草绿/沙黄显出来（去白）
        'raster-hue-rotate': 0,
        'raster-brightness-min': 0.1,
        'raster-brightness-max': 0.74, // 压低高光，杀掉 voyager 的近白陆地底
      },
    },
    // atlas 陆地填色：暖羊皮纸 / 赭石 wash，半透明罩在 voyager 地貌之上。
    {
      id: 'atlas-land-fill',
      type: 'fill',
      source: 'atlas-land',
      paint: {
        'fill-color': '#d4ad6a',
        'fill-opacity': 0,
        'fill-antialias': true,
      },
    },
    // hillshade（浮雕）画在全图，包括海底。随后的 ocean mask 会把海里盖掉。
    // 主光：西北向键光（雕刻感）。
    {
      id: 'terrain-shade',
      type: 'hillshade',
      source: 'terrain-dem-shade',
      paint: {
        'hillshade-exaggeration': 0,
        'hillshade-illumination-direction': 315,
        'hillshade-shadow-color': 'rgba(0, 0, 0, 0.72)',
        'hillshade-highlight-color': 'rgba(155, 185, 220, 0.28)',
        'hillshade-accent-color': 'rgba(95, 120, 155, 0.30)',
      },
    },
    // 第二层 hillshade：副光（东南向、低透明），v4 无 multidirectional，用两层伪多向，
    // 柔化主光硬阴影、增加雕塑体积感。仅 atlas 开启（dark 下 exaggeration 0）。
    {
      id: 'terrain-shade-fill',
      type: 'hillshade',
      source: 'terrain-dem-shade',
      paint: {
        'hillshade-exaggeration': 0,
        'hillshade-illumination-direction': 135,
        'hillshade-shadow-color': 'rgba(40, 22, 8, 0.0)',
        'hillshade-highlight-color': 'rgba(255, 244, 214, 0.0)',
        'hillshade-accent-color': 'rgba(120, 80, 40, 0.0)',
      },
    },
    // 海洋遮罩：盖住海底 hillshade，让海面平、深、干净；陆地镂空所以浮雕透出。
    // 仅 atlas 可见（dark 模式 opacity 0），位于海岸线之下所以不挡海岸墨线。
    {
      id: 'atlas-ocean-mask',
      type: 'fill',
      source: 'atlas-ocean',
      paint: {
        'fill-color': ATLAS_OCEAN_COLOR,
        'fill-opacity': 0,
        'fill-antialias': true,
      },
    },
    // 海面雕版纹理：与 ocean mask 同源/同遮罩，叠一层细密波纹 fill-pattern，
    // 模拟铜版画海面。纹理图在 MapScene load 后用 canvas 生成并 addImage('atlas-wave')，
    // 这里先占位（无 pattern 时 fill 不可见）；仅 atlas 显示。位于深海遮罩之上、浅水带之下。
    {
      id: 'atlas-ocean-texture',
      type: 'fill',
      source: 'atlas-ocean',
      paint: {
        'fill-color': ATLAS_OCEAN_COLOR,
        'fill-opacity': 0,
        'fill-antialias': true,
      },
    },
    // 大陆架中浅水带：更宽更糊、比深海略亮的青，沿海岸铺一条宽缓过渡，
    // 在浅水带之下形成由岸到海的渐变（bathymetry 错觉）。仅 atlas 可见。
    {
      id: 'atlas-shelf-mid',
      type: 'line',
      source: 'atlas-land',
      paint: {
        'line-color': '#2f6e74',
        'line-opacity': 0,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 8, 4, 18, 6, 34],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 26],
      },
    },
    // 近岸浅水带：在中浅水带之上、海岸墨线之下，沿海岸画一圈偏亮的青绿糊光，
    // 模拟最浅海大陆架；深海仍保持平、深、干净。仅 atlas 可见。
    {
      id: 'atlas-coast-shallow',
      type: 'line',
      source: 'atlas-land',
      paint: {
        'line-color': '#3f93bd',
        'line-opacity': 0,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 5, 4, 12, 6, 24],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 2, 4, 6, 13],
      },
    },
    // 最近岸沙滩/浅滩带：紧贴海岸内侧一条窄而亮的松石绿，
    // 模拟水下沙石透光的浅滩（Civ 那种近岸发亮）。在浅水带之上、海岸线之下。仅 atlas。
    {
      id: 'atlas-coast-sand',
      type: 'line',
      source: 'atlas-land',
      paint: {
        'line-color': '#8fe3d2',
        'line-opacity': 0,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 2.5, 4, 6, 6, 13],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 2, 1.6, 6, 6],
      },
    },
    // 海岸光晕：宽糊光晕在主线之下，像晕染的墨迹
    {
      id: 'atlas-coastline-glow',
      type: 'line',
      source: 'atlas-land',
      paint: {
        'line-color': '#7a4818',
        'line-opacity': 0,
        'line-width': 2.4,
        'line-blur': 2.2,
      },
    },
    // 海岸主线：细深墨实线
    {
      id: 'atlas-coastline-line',
      type: 'line',
      source: 'atlas-land',
      paint: {
        'line-color': '#3a1f08',
        'line-opacity': 0,
        'line-width': 0.9,
        'line-blur': 0.15,
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
    // 始终保留一层很弱的冷调世界级浮雕，给陆块体积感而不杂乱（山脉模式再加强）。
    hillshadeExaggeration: ['interpolate', ['linear'], ['zoom'], 2, 0.12, 5, 0.32],
    hillshade: {
      shadow: 'rgba(2, 8, 18, 0.6)',
      highlight: 'rgba(150, 185, 225, 0.22)',
      accent: 'rgba(90, 120, 160, 0.26)',
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
    background: '#0e2a44', // 深邃藏蓝海洋（瓦片缝隙也是这色，与 ocean mask 一致）
    base: 'base-atlas',
    ocean: ATLAS_OCEAN_COLOR,
    baseOpacity: 0.95, // 真实地貌底图充分透出（拟真地图模型，而非羊皮纸）
    landFillOpacity: 0.15, // 极淡暖色统一调 + 进一步压住近白陆地
    // 由岸到海的写实深浅（多层 bathymetry）：
    //   沙滩浅滩 → 松石浅水 → 中蓝 → 深海藏蓝
    shelf: { color: '#1d5078', opacity: 0.7 }, // 大陆架中浅水带（中蓝，宽缓过渡）
    shallow: { color: '#3f93bd', opacity: 0.82 }, // 浅水带（亮松石蓝）
    sand: { color: '#8fe3d2', opacity: 0.88 }, // 最近岸沙滩/浅滩（亮松石绿，露出水下沙石感）
    oceanTextureOpacity: 0.22, // 海面波光强度（淡浅蓝高光，模拟水面反光而非雕版线）
    // 主光向 + 随 zoom 渐强的浮雕（世界视角柔、区域视角强）
    illuminationDirection: 315,
    hillshadeExaggeration: ['interpolate', ['linear'], ['zoom'], 2, 0.6, 4, 0.95, 6, 1.15],
    hillshade: {
      // 雕刻浮雕：深棕阴影 + 温暖羊皮纸高光 + 墨重音（阴影略减弱，去脏更清晰）
      shadow: 'rgba(28, 12, 4, 0.68)',
      highlight: 'rgba(252, 232, 188, 0.62)',
      accent: 'rgba(110, 64, 28, 0.48)',
    },
    // 第二层副光 hillshade：低强度暖色，柔化硬阴影
    hillshadeFill: {
      exaggeration: ['interpolate', ['linear'], ['zoom'], 2, 0.4, 4, 0.6, 6, 0.7],
      shadow: 'rgba(40, 22, 8, 0.22)',
      highlight: 'rgba(255, 244, 214, 0.20)',
      accent: 'rgba(120, 80, 40, 0.16)',
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
      glowOpacityRefined: 0.30,
      glowOpacityPlain: 0.14,
      lineOpacityRefined: 0.94,
      lineOpacityPlain: 0.55,
      // atlas 用实线 + 微弱晕染，模拟羽毛笔墨线
      lineDash: [1, 0],
      fillOpacityRefined: 0.06,
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
      // 深墨棕实线 + 微弱晕染（line-blur）模拟羽毛笔渗墨
      map.setPaintProperty('dynasty-territory-line', 'line-color', '#2a1808');
      map.setPaintProperty('dynasty-territory-line', 'line-blur', 0.5);
      map.setPaintProperty('dynasty-territory-line', 'line-width', [
        'case', isRefinedExpr, 1.6, 1.0,
      ]);
    } else {
      map.setPaintProperty('dynasty-territory-line', 'line-color', ['get', 'color']);
      map.setPaintProperty('dynasty-territory-line', 'line-blur', 0.35);
      map.setPaintProperty('dynasty-territory-line', 'line-width', [
        'case', isRefinedExpr, 1.4, 0.8,
      ]);
    }
    map.setPaintProperty('dynasty-territory-line', 'line-opacity', [
      'case', isRefinedExpr, preset.boundary.lineOpacityRefined, preset.boundary.lineOpacityPlain,
    ]);
    map.setPaintProperty('dynasty-territory-line', 'line-dasharray', preset.boundary.lineDash);
  }

  if (map.getLayer('dynasty-capital-core')) {
    map.setPaintProperty('dynasty-capital-core', 'circle-color', isAtlas ? '#b3201b' : ['get', 'color']);
    map.setPaintProperty('dynasty-capital-core', 'circle-stroke-color',
      isAtlas ? 'rgba(40, 12, 8, 0.92)' : 'rgba(240, 248, 255, 0.9)');
    map.setPaintProperty('dynasty-capital-core', 'circle-stroke-width', isAtlas ? 1.2 : 0.8);
  }
  if (map.getLayer('dynasty-capital-glow')) {
    // atlas: 几乎不发光（古地图朱砂点不应该发光），只留一圈淡晕
    map.setPaintProperty('dynasty-capital-glow', 'circle-color', isAtlas ? '#b3201b' : ['get', 'color']);
    map.setPaintProperty('dynasty-capital-glow', 'circle-opacity', isAtlas ? 0.18 : 0.28);
    map.setPaintProperty('dynasty-capital-glow', 'circle-blur', isAtlas ? 0.3 : 0.72);
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
  const isAtlas = themeKey === 'atlas';
  // atlas 模式让 voyager 低透明度做地貌底色；dark 隐藏。
  if (map.getLayer('base-atlas')) {
    map.setPaintProperty('base-atlas', 'raster-opacity', isAtlas ? (preset.baseOpacity ?? 0.42) : 0);
  }
  // atlas 陆地填色（半透明 wash）+ 海岸光晕 + 海岸主线：仅 atlas 时显示
  if (map.getLayer('atlas-land-fill')) {
    map.setPaintProperty('atlas-land-fill', 'fill-opacity', isAtlas ? (preset.landFillOpacity ?? 0.6) : 0);
  }
  // 海洋遮罩：atlas 全不透明盖住海底 relief；dark 完全隐藏
  if (map.getLayer('atlas-ocean-mask')) {
    map.setPaintProperty('atlas-ocean-mask', 'fill-color', preset.ocean || ATLAS_OCEAN_COLOR);
    map.setPaintProperty('atlas-ocean-mask', 'fill-opacity', isAtlas ? 1 : 0);
  }
  // 海面雕版波纹纹理：仅 atlas，且只有在 fill-pattern 已注入时才显形
  if (map.getLayer('atlas-ocean-texture')) {
    map.setPaintProperty('atlas-ocean-texture', 'fill-opacity', isAtlas ? (preset.oceanTextureOpacity ?? 0.5) : 0);
  }
  // 大陆架中浅水带：仅 atlas
  if (map.getLayer('atlas-shelf-mid')) {
    map.setPaintProperty('atlas-shelf-mid', 'line-color', preset.shelf?.color ?? '#2f6e74');
    map.setPaintProperty('atlas-shelf-mid', 'line-opacity', isAtlas ? (preset.shelf?.opacity ?? 0.45) : 0);
  }
  // 近岸浅水带：仅 atlas
  if (map.getLayer('atlas-coast-shallow')) {
    map.setPaintProperty('atlas-coast-shallow', 'line-color', preset.shallow?.color ?? '#5aa0a0');
    map.setPaintProperty('atlas-coast-shallow', 'line-opacity', isAtlas ? (preset.shallow?.opacity ?? 0.5) : 0);
  }
  // 最近岸沙滩/浅滩带：仅 atlas
  if (map.getLayer('atlas-coast-sand')) {
    map.setPaintProperty('atlas-coast-sand', 'line-color', preset.sand?.color ?? '#9ed7c8');
    map.setPaintProperty('atlas-coast-sand', 'line-opacity', isAtlas ? (preset.sand?.opacity ?? 0.7) : 0);
  }
  // 海岸线：atlas 为墨棕实线 + 晕染；dark "地球夜景" 复用同一几何做冷青发光海岸线。
  if (map.getLayer('atlas-coastline-glow')) {
    map.setPaintProperty('atlas-coastline-glow', 'line-color', isAtlas ? '#7a4818' : '#2f7d92');
    map.setPaintProperty('atlas-coastline-glow', 'line-width', isAtlas ? 2.4 : 2.8);
    map.setPaintProperty('atlas-coastline-glow', 'line-blur', isAtlas ? 2.2 : 3);
    map.setPaintProperty('atlas-coastline-glow', 'line-opacity', isAtlas ? 0.4 : 0.22);
  }
  if (map.getLayer('atlas-coastline-line')) {
    map.setPaintProperty('atlas-coastline-line', 'line-color', isAtlas ? '#3a1f08' : '#86dcec');
    map.setPaintProperty('atlas-coastline-line', 'line-width', isAtlas ? 0.9 : 0.7);
    map.setPaintProperty('atlas-coastline-line', 'line-blur', isAtlas ? 0.15 : 0.4);
    map.setPaintProperty('atlas-coastline-line', 'line-opacity', isAtlas ? 0.85 : 0.4);
  }
  if (map.getLayer('terrain-shade')) {
    map.setPaintProperty('terrain-shade', 'hillshade-shadow-color', preset.hillshade.shadow);
    map.setPaintProperty('terrain-shade', 'hillshade-highlight-color', preset.hillshade.highlight);
    map.setPaintProperty('terrain-shade', 'hillshade-accent-color', preset.hillshade.accent);
    if (preset.illuminationDirection != null) {
      map.setPaintProperty('terrain-shade', 'hillshade-illumination-direction', preset.illuminationDirection);
    }
    // atlas 与 dark 都保持各自 preset 的世界级浮雕（dark 为很弱的冷调浮雕，
    // 给陆块体积感；山脉模式再由 setTerrainMode 加强）。
    const exaggeration = preset.hillshadeExaggeration ?? 0;
    map.setPaintProperty('terrain-shade', 'hillshade-exaggeration', exaggeration);
  }
  // 第二层副光 hillshade：仅 atlas 开启
  if (map.getLayer('terrain-shade-fill')) {
    const fill = preset.hillshadeFill;
    if (isAtlas && fill) {
      map.setPaintProperty('terrain-shade-fill', 'hillshade-shadow-color', fill.shadow);
      map.setPaintProperty('terrain-shade-fill', 'hillshade-highlight-color', fill.highlight);
      map.setPaintProperty('terrain-shade-fill', 'hillshade-accent-color', fill.accent);
      map.setPaintProperty('terrain-shade-fill', 'hillshade-exaggeration', fill.exaggeration ?? 0.6);
    } else {
      map.setPaintProperty('terrain-shade-fill', 'hillshade-exaggeration', 0);
    }
  }
  if (typeof map.setSky === 'function') {
    map.setSky(preset.sky);
  }
  applyBoundaryPaint(map, themeKey);
}

export function setTerrainMode(map, mode, themeKey) {
  if (!map) return;
  const isMountain = mode === 'mountain';
  const isAtlas = themeKey === 'atlas';
  const atlasPreset = THEME_PRESETS.atlas;
  map.setTerrain({
    source: 'terrain-dem',
    exaggeration: isMountain ? MOUNTAIN_TERRAIN_EXAGGERATION : WORLD_TERRAIN_EXAGGERATION,
  });
  if (map.getLayer('terrain-shade')) {
    // dark：世界视角保留很弱的冷调浮雕，山脉模式再加强
    // atlas：始终开启随 zoom 渐强的浮雕，山脉永远要有雕刻感
    let exaggeration = 0;
    if (isAtlas) exaggeration = atlasPreset.hillshadeExaggeration ?? 0.95;
    else if (isMountain) exaggeration = 0.95;
    else exaggeration = THEME_PRESETS.dark.hillshadeExaggeration ?? 0;
    map.setPaintProperty('terrain-shade', 'hillshade-exaggeration', exaggeration);
  }
  // 第二层副光 hillshade 仅 atlas 跟随
  if (map.getLayer('terrain-shade-fill')) {
    map.setPaintProperty(
      'terrain-shade-fill',
      'hillshade-exaggeration',
      isAtlas ? (atlasPreset.hillshadeFill?.exaggeration ?? 0.6) : 0,
    );
  }
}
