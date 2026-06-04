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

export const WORLD_TERRAIN_EXAGGERATION = 0.1;
export const MOUNTAIN_TERRAIN_EXAGGERATION = 2.6;

// CARTO 公共栅格瓦片（无需 API key）。两套基底，按主题切 visibility。
const DARK_BASE_TILES = [
  // dark_nolabels @2x：无路网/标注的干净深色陆海，高清；作为"文明星图"的幽深底。
  'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
  'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
  'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
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

// 经纬网格（graticule）：深色"文明星图"的天文/制图科技感底纹。
// 每 step 度一条经线/纬线，沿线密集打点以适配投影与地形起伏。
function buildGraticule(step = 30) {
  const features = [];
  for (let lon = -180; lon <= 180; lon += step) {
    const coords = [];
    for (let lat = -80; lat <= 80; lat += 4) coords.push([lon, lat]);
    features.push({ type: 'Feature', properties: { kind: 'meridian' }, geometry: { type: 'LineString', coordinates: coords } });
  }
  for (let lat = -60; lat <= 80; lat += step) {
    const coords = [];
    for (let lon = -180; lon <= 180; lon += 4) coords.push([lon, lat]);
    features.push({ type: 'Feature', properties: { kind: lat === 0 ? 'equator' : 'parallel' }, geometry: { type: 'LineString', coordinates: coords } });
  }
  return { type: 'FeatureCollection', features };
}
const GRATICULE = buildGraticule(30);

export const darkStyle = {
  version: 8,
  // 字体 PBF：raster 底图自带 nolabels，故没有 glyphs 端点。用 MapLibre 官方 demotiles
  // 字体服务（免 key，CORS 开放）提供拉丁/标点/字号度量；中文都城名由地图的
  // localIdeographFontFamily 在浏览器本地渲染（见 MapScene 构造器），不依赖该端点的 CJK。
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'osm-tiles-dark': {
      type: 'raster',
      tiles: DARK_BASE_TILES,
      tileSize: 512, // 配合 @2x 高清瓦片
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
    graticule: {
      type: 'geojson',
      data: GRATICULE,
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
        // 高级深邃"文明星图"底：把 dark_nolabels 进一步压暗去白——
        // 陆地近黑带极淡冷蓝、海更深，所有亮度交给上面发光的数据层。
        'raster-opacity': 0.95,
        'raster-contrast': 0.32,
        'raster-saturation': -0.22,
        'raster-hue-rotate': 210,
        'raster-brightness-min': 0.03,
        'raster-brightness-max': 0.6,
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
    // 经纬网格：极淡冷青细线，天文/制图科技感。仅 dark 显示（atlas 下 opacity 0）。
    // 放在数据层之下（朝代层在 MapScene 动态 addLayer 到最上）。
    {
      id: 'graticule-line',
      type: 'line',
      source: 'graticule',
      paint: {
        'line-color': '#5fb8d8',
        'line-opacity': 0,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          1, ['case', ['==', ['get', 'kind'], 'equator'], 0.8, 0.4],
          5, ['case', ['==', ['get', 'kind'], 'equator'], 1.2, 0.6],
        ],
        'line-blur': 0.4,
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
    illuminationDirection: 315,
    // 深邃夜海：近黑藏蓝、全不透明盖掉海底浮雕——海越深越暗，让大陆从中浮起。
    // （黑色大理石夜地球：海近黑、陆稍亮的冷灰，全程冷调，靠明度差分离而非换色。）
    ocean: '#030a13',
    oceanMaskOpacity: 1,
    // 陆地不另铺色：保持冷调basemap本身，靠"陆比海亮 + 浮雕 + 发光海岸"刻清晰。
    landFillOpacity: 0,
    // 月光夜景浮雕：随 zoom 渐强的真实地势（世界视角已有体积感，区域视角山脉清晰）。
    // 强度对标 atlas，但走冷调，营造"地球夜景被冷月光斜照"的游戏级体积感。
    hillshadeExaggeration: ['interpolate', ['linear'], ['zoom'], 2, 0.2, 4, 0.32, 6, 0.46],
    hillshade: {
      // 深蓝阴影 + 冷月光高光（青白）+ 冷青墨重音：让山脊一侧受光、一侧没入深蓝
      shadow: 'rgba(2, 8, 18, 0.42)',
      highlight: 'rgba(140, 182, 224, 0.22)',
      accent: 'rgba(50, 88, 130, 0.13)',
    },
    // 第二层副光 hillshade（东南向、低强度冷调）：柔化硬阴影，增加多向体积层次
    hillshadeFill: {
      exaggeration: ['interpolate', ['linear'], ['zoom'], 2, 0.06, 4, 0.1, 6, 0.14],
      shadow: 'rgba(2, 10, 24, 0.075)',
      highlight: 'rgba(172, 204, 240, 0.04)',
      accent: 'rgba(55, 85, 125, 0.035)',
    },
    sky: {
      // 深空基调 + 地平线冷青大气辉光（俯仰时露出"地球边缘辉光"）
      'sky-color': '#050d1d',
      'sky-horizon-blend': 0.62,
      'horizon-color': '#27597d',
      'horizon-fog-blend': 0.7,
      'fog-color': '#03070f',
      'fog-ground-blend': 0.1,
    },
    boundary: {
      // 星图风发光轮廓：去掉填充色块（fill 仅作隐形点击域 + 极淡发光薄膜，地形透出），
      // 文明＝明亮发光边界（实线清亮边 + 向内淡入的霓虹辉光晕）。多文明并存时靠收窄的
      // 辉光 + 高对比清亮边分离，不再糊成色块。详见 applyBoundaryPaint dark 分支。
      // F1 去荧光：默认只留一条细窄清亮边 + 收紧内晕，多国并存时不串色；
      // hover / 选中由专属图层把那一国亮色+填充浮起。
      glowOpacityRefined: 0.075,
      glowOpacityPlain: 0.035,
      lineOpacityRefined: 0.56,
      lineOpacityPlain: 0.24,
      lineDash: [1, 0],
      fillOpacityRefined: 0.032,
      fillOpacityPlain: 0.018,
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
      map.setPaintProperty('dynasty-territory-glow', 'line-blur', 5);
    } else {
      // F1 去荧光：收紧晕宽和 blur，多国并存时各文明边界不再互染成"开发图层荧光带"。
      map.setPaintProperty('dynasty-territory-glow', 'line-color', ['get', 'color']);
      map.setPaintProperty('dynasty-territory-glow', 'line-width', ['case', isRefinedExpr,
        ['interpolate', ['linear'], ['zoom'], 2, 1.1, 5, 2.3],
        ['interpolate', ['linear'], ['zoom'], 2, 0.6, 5, 1.2],
      ]);
      map.setPaintProperty('dynasty-territory-glow', 'line-blur', 2.0);
    }
    map.setPaintProperty('dynasty-territory-glow', 'line-opacity', [
      'case', isRefinedExpr, preset.boundary.glowOpacityRefined, preset.boundary.glowOpacityPlain,
    ]);
  }

  // 深色衬底（casing）：亮线正下方一道近黑藏蓝、随 zoom 加宽，让彩色亮线在地形上更跳更干净。
  // atlas 冻结：直接压成不可见，不改 atlas 观感。
  if (map.getLayer('dynasty-territory-casing')) {
    if (isAtlas) {
      map.setPaintProperty('dynasty-territory-casing', 'line-opacity', 0);
    } else {
      map.setPaintProperty('dynasty-territory-casing', 'line-color', '#03070e');
      map.setPaintProperty('dynasty-territory-casing', 'line-blur', 0.3);
      map.setPaintProperty('dynasty-territory-casing', 'line-width', ['case', isRefinedExpr,
        ['interpolate', ['linear'], ['zoom'], 2, 1.0, 5, 1.8],
        ['interpolate', ['linear'], ['zoom'], 2, 0.6, 5, 1.1],
      ]);
      map.setPaintProperty('dynasty-territory-casing', 'line-opacity', ['case', isRefinedExpr, 0.28, 0.16]);
    }
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
      // F1 去荧光：保持星图风细亮边，但收窄核线宽度避免多国串色。
      map.setPaintProperty('dynasty-territory-line', 'line-color', ['get', 'color']);
      map.setPaintProperty('dynasty-territory-line', 'line-blur', 0.25);
      map.setPaintProperty('dynasty-territory-line', 'line-width', ['case', isRefinedExpr,
        ['interpolate', ['linear'], ['zoom'], 2, 0.65, 5, 1.5],
        ['interpolate', ['linear'], ['zoom'], 2, 0.4, 5, 0.8],
      ]);
    }
    map.setPaintProperty('dynasty-territory-line', 'line-opacity', [
      'case', isRefinedExpr, preset.boundary.lineOpacityRefined, preset.boundary.lineOpacityPlain,
    ]);
    map.setPaintProperty('dynasty-territory-line', 'line-dasharray', preset.boundary.lineDash);
  }

  if (map.getLayer('dynasty-capital-core')) {
    // dark：都城为暖白灯火亮核（像夜景城市灯光）；atlas：朱砂点
    map.setPaintProperty('dynasty-capital-core', 'circle-color', isAtlas ? '#b3201b' : '#ffeccc');
    map.setPaintProperty('dynasty-capital-core', 'circle-stroke-color',
      isAtlas ? 'rgba(40, 12, 8, 0.92)' : 'rgba(255, 214, 150, 0.45)');
    map.setPaintProperty('dynasty-capital-core', 'circle-stroke-width', isAtlas ? 1.2 : 0.7);
  }
  if (map.getLayer('dynasty-capital-glow')) {
    // dark：暖金 bloom 收紧 blur，读作精准城市灯火而非模糊光斑
    map.setPaintProperty('dynasty-capital-glow', 'circle-color', isAtlas ? '#b3201b' : '#ffcf7a');
    map.setPaintProperty('dynasty-capital-glow', 'circle-opacity', isAtlas ? 0.18 : 0.22);
    map.setPaintProperty('dynasty-capital-glow', 'circle-blur', isAtlas ? 0.3 : 0.9);
  }
  if (map.getLayer('dynasty-capital-label')) {
    // 都城名标注仅深色显示（atlas 冻结隐藏）——沿用 graticule 的 opacity=0 手法，
    // 不动 visibility（visibility 交给"都城"图层开关）。dark 下随 zoom 淡入，
    // 避免世界级缩放时小字挤成一团。
    map.setPaintProperty('dynasty-capital-label', 'text-opacity',
      isAtlas ? 0 : ['interpolate', ['linear'], ['zoom'], 1.6, 0, 2.8, 0.95]);
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
    map.setPaintProperty('base-dark', 'raster-opacity', preset.base === 'base-dark' ? 0.85 : 0);
  }
  const isAtlas = themeKey === 'atlas';
  // atlas 模式让 voyager 低透明度做地貌底色；dark 隐藏。
  if (map.getLayer('base-atlas')) {
    map.setPaintProperty('base-atlas', 'raster-opacity', isAtlas ? (preset.baseOpacity ?? 0.42) : 0);
  }
  // 陆地填色：atlas 暖羊皮纸 wash；dark 不另铺色（landFillOpacity=0），保持冷调 basemap。
  if (map.getLayer('atlas-land-fill')) {
    map.setPaintProperty('atlas-land-fill', 'fill-color',
      isAtlas ? '#d4ad6a' : (preset.landFillColor || '#2a3340'));
    map.setPaintProperty('atlas-land-fill', 'fill-opacity', preset.landFillOpacity ?? (isAtlas ? 0.6 : 0));
  }
  // 海洋遮罩：两个主题都全不透明盖住海底 relief，让海面平、深、真实（不要海上浮雕）。
  if (map.getLayer('atlas-ocean-mask')) {
    map.setPaintProperty('atlas-ocean-mask', 'fill-color', preset.ocean || ATLAS_OCEAN_COLOR);
    map.setPaintProperty('atlas-ocean-mask', 'fill-opacity', isAtlas ? 1 : (preset.oceanMaskOpacity ?? 0));
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
    map.setPaintProperty('atlas-coastline-glow', 'line-color', isAtlas ? '#7a4818' : '#3a93b0');
    map.setPaintProperty('atlas-coastline-glow', 'line-width', isAtlas ? 2.4 : 3);
    map.setPaintProperty('atlas-coastline-glow', 'line-blur', isAtlas ? 2.2 : 3.2);
    map.setPaintProperty('atlas-coastline-glow', 'line-opacity', isAtlas ? 0.4 : 0.24);
  }
  if (map.getLayer('atlas-coastline-line')) {
    map.setPaintProperty('atlas-coastline-line', 'line-color', isAtlas ? '#3a1f08' : '#7fcfe6');
    map.setPaintProperty('atlas-coastline-line', 'line-width', isAtlas ? 0.9 : 0.9);
    map.setPaintProperty('atlas-coastline-line', 'line-blur', isAtlas ? 0.15 : 0.35);
    map.setPaintProperty('atlas-coastline-line', 'line-opacity', isAtlas ? 0.85 : 0.5);
  }
  // 经纬网格（科技/天文台标志元素）：仅深色主题极淡显示，atlas 冻结隐藏
  if (map.getLayer('graticule-line')) {
    map.setPaintProperty('graticule-line', 'line-opacity', isAtlas ? 0 : 0.1);
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
  // 第二层副光 hillshade：atlas 与 dark 都开启（各自冷/暖调），增强多向体积层次
  if (map.getLayer('terrain-shade-fill')) {
    const fill = preset.hillshadeFill;
    if (fill) {
      map.setPaintProperty('terrain-shade-fill', 'hillshade-illumination-direction', 135);
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
  const activePreset = isAtlas ? atlasPreset : THEME_PRESETS.dark;
  if (map.getLayer('terrain-shade')) {
    // 两个主题都始终开启随 zoom 渐强的浮雕；山脉模式再加一档雕刻感。
    let exaggeration = activePreset.hillshadeExaggeration ?? 0.95;
    if (isMountain) exaggeration = isAtlas ? 1.18 : 0.95;
    map.setPaintProperty('terrain-shade', 'hillshade-exaggeration', exaggeration);
  }
  // 第二层副光 hillshade：两个主题都跟随各自 preset
  if (map.getLayer('terrain-shade-fill')) {
    map.setPaintProperty(
      'terrain-shade-fill',
      'hillshade-exaggeration',
      activePreset.hillshadeFill?.exaggeration ?? 0,
    );
  }
}
