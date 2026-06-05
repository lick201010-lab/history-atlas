import { readFile, writeFile } from 'node:fs/promises';

const boundariesUrl = new URL('../src/data/boundaries-simplified.json', import.meta.url);
const dynastiesUrl = new URL('../src/data/dynasties.json', import.meta.url);

const batchIds = ['jin', 'song', 'yuan', 'qing', 'prc'];
const batchIdSet = new Set(batchIds);
const phases = ['rise', 'peak', 'decline'];

const accuracyLabel = '海岸线粗贴合示意范围';
const sourceNote = '参考谭其骧《中国历史地图集》、公开历史地图与 Natural Earth 海岸线方向，按历史沙盘展示需要手工概化为 rough-refined 分期轮廓。';
const accuracyNote = '边界为 coastline-aware rough-refined 历史沙盘示意范围；沿渤海、黄海、东海、南海海岸作粗略转折，内陆边缘按历史势力、山地、高原、草原与交通廊道概化，不代表学术级精确疆域。';
const prcAccuracyNote = '边界为 coastline-aware rough-refined 当代历史沙盘示意范围；用于展示中国大陆、东北、内蒙古、新疆、西藏、西南与沿海大轮廓，岛屿与争议边界仅作地图示意，不代表法理或实际控制的精确判定。';

const round = (value) => Math.round(value * 1000) / 1000;

function densify(points, perSegment = 2, jitter = 0.08) {
  if (!Array.isArray(points) || points.length < 3) {
    throw new Error('Ring must include at least three anchor points.');
  }

  const out = [];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    out.push([round(current[0]), round(current[1])]);

    const dx = next[0] - current[0];
    const dy = next[1] - current[1];
    const length = Math.hypot(dx, dy) || 1;
    const px = -dy / length;
    const py = dx / length;

    for (let step = 1; step <= perSegment; step += 1) {
      const t = step / (perSegment + 1);
      const seed = Math.sin(index * 17.17 + step * 9.31 + current[0] * 0.37 + current[1] * 0.73) * 10000;
      const offset = (seed - Math.floor(seed) - 0.5) * jitter;
      out.push([
        round(current[0] + dx * t + px * offset),
        round(current[1] + dy * t + py * offset),
      ]);
    }
  }

  const first = out[0];
  const last = out.at(-1);
  if (first[0] !== last[0] || first[1] !== last[1]) out.push([...first]);
  return out;
}

function polygon(points, perSegment = 2, jitter = 0.08) {
  return {
    type: 'Polygon',
    coordinates: [densify(points, perSegment, jitter)],
  };
}

function multiPolygon(rings, perSegment = 2, jitter = 0.08) {
  return {
    type: 'MultiPolygon',
    coordinates: rings.map((ring) => [densify(ring, perSegment, jitter)]),
  };
}

function idOf(feature) {
  return feature.properties?.id || feature.id;
}

function outerRings(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates[0]];
  return geometry.coordinates.map((item) => item[0]);
}

const HAINAN = [
  [108.55, 19.1], [109.15, 18.35], [110.1, 18.05], [111.0, 18.45],
  [111.25, 19.15], [110.65, 20.0], [109.65, 20.22], [108.8, 19.82],
];

const TAIWAN = [
  [120.05, 23.05], [120.45, 22.35], [121.05, 22.05], [121.65, 23.0],
  [122.0, 24.2], [121.65, 25.15], [120.9, 25.28], [120.25, 24.35],
];

const JIN_RISE = [
  [100.2, 36.6], [101.3, 38.1], [103.6, 39.35], [106.7, 40.05],
  [110.0, 40.35], [113.4, 40.2], [116.7, 39.72], [119.0, 38.72],
  [120.55, 37.35], [120.18, 36.32], [119.55, 35.45], [118.15, 35.02],
  [116.85, 34.28], [115.35, 33.62], [113.3, 32.92], [111.1, 32.38],
  [108.95, 31.85], [106.8, 31.92], [104.8, 32.65], [102.95, 33.85],
  [101.4, 35.0],
];

const JIN_PEAK = [
  [99.7, 36.1], [100.8, 38.35], [103.5, 39.82], [107.2, 40.72],
  [111.0, 41.02], [114.9, 40.82], [118.4, 40.28], [121.75, 39.25],
  [124.25, 40.0], [125.15, 39.05], [123.35, 38.55], [121.15, 37.82],
  [120.35, 36.58], [120.45, 35.32], [119.68, 34.45], [120.45, 33.48],
  [121.55, 31.55], [120.82, 30.45], [120.05, 29.35], [119.2, 28.15],
  [118.2, 26.95], [117.0, 25.75], [115.55, 24.55], [113.85, 23.35],
  [111.9, 22.42], [109.8, 21.88], [108.35, 22.02], [106.55, 23.38],
  [104.75, 25.25], [103.15, 27.6], [101.6, 30.25], [100.35, 33.05],
];

const JIN_DECLINE = [
  [102.45, 30.0], [103.65, 31.45], [105.65, 32.45], [108.25, 32.9],
  [111.1, 33.02], [114.0, 33.22], [116.9, 33.08], [119.25, 33.18],
  [120.25, 33.72], [121.55, 31.55], [120.82, 30.45], [120.05, 29.35],
  [119.2, 28.15], [118.2, 26.95], [117.0, 25.75], [115.55, 24.55],
  [113.85, 23.35], [111.9, 22.42], [109.8, 21.88], [108.35, 22.02],
  [106.55, 23.38], [104.85, 25.25], [103.45, 27.25], [102.52, 28.9],
];

const SONG_RISE = [
  [103.65, 33.5], [104.75, 35.25], [107.0, 36.95], [110.05, 37.9],
  [113.35, 38.32], [116.42, 38.15], [118.78, 37.48], [120.18, 36.35],
  [120.08, 35.2], [119.25, 34.38], [118.0, 33.85], [116.42, 33.3],
  [114.55, 32.82], [112.45, 32.45], [110.1, 31.98], [107.85, 31.55],
  [105.65, 31.0], [104.1, 31.35], [103.35, 32.2],
];

const SONG_PEAK = [
  [103.2, 32.8], [104.0, 35.0], [105.9, 36.95], [108.65, 38.25],
  [111.75, 38.92], [114.95, 38.95], [117.65, 38.45], [119.85, 37.35],
  [120.48, 36.18], [120.25, 35.05], [119.62, 34.22], [120.42, 33.35],
  [121.62, 31.45], [120.95, 30.42], [120.18, 29.28], [119.25, 28.15],
  [118.25, 27.0], [117.0, 25.78], [115.55, 24.55], [113.85, 23.32],
  [111.75, 22.35], [109.55, 21.92], [108.35, 22.08], [106.52, 23.55],
  [104.95, 25.82], [103.95, 28.2], [103.45, 30.38],
];

const SONG_DECLINE = [
  [102.95, 29.62], [104.35, 31.55], [106.75, 32.65], [109.72, 32.92],
  [112.75, 32.9], [115.75, 32.98], [118.65, 33.12], [120.05, 33.72],
  [121.62, 31.45], [120.95, 30.42], [120.18, 29.28], [119.25, 28.15],
  [118.25, 27.0], [117.0, 25.78], [115.55, 24.55], [113.85, 23.32],
  [111.75, 22.35], [109.55, 21.92], [108.35, 22.08], [106.52, 23.55],
  [104.95, 25.82], [103.82, 27.85],
];

const YUAN_RISE = [
  [78.2, 38.2], [82.8, 41.75], [89.0, 44.65], [96.0, 47.15],
  [103.8, 49.0], [111.8, 48.82], [119.0, 47.1], [126.25, 45.55],
  [130.4, 46.65], [131.85, 45.45], [130.35, 43.2], [127.35, 41.95],
  [123.8, 40.35], [120.95, 39.15], [119.95, 37.55], [120.15, 36.05],
  [119.12, 35.0], [117.45, 34.38], [115.2, 33.52], [112.35, 32.42],
  [109.55, 31.28], [106.3, 29.8], [102.55, 28.0], [98.65, 25.1],
  [96.1, 27.65], [91.6, 29.1], [86.0, 29.55], [81.3, 31.65],
  [78.9, 34.8],
];

const YUAN_PEAK = [
  [76.2, 38.1], [80.4, 42.35], [86.5, 45.75], [94.0, 48.45],
  [98.0, 49.25], [103.5, 50.25], [108.2, 49.55], [113.6, 49.85],
  [118.45, 48.35], [125.45, 46.72],
  [130.75, 48.0], [132.25, 46.75], [130.62, 43.75], [131.0, 42.72],
  [128.25, 41.82], [125.2, 40.52], [122.25, 39.62], [120.65, 38.15],
  [120.42, 36.65], [120.5, 35.15], [119.72, 34.25], [120.45, 33.32],
  [121.62, 31.48], [120.95, 30.42], [120.12, 29.25], [119.15, 28.05],
  [118.0, 26.82], [116.65, 25.58], [115.05, 24.32], [113.05, 23.02],
  [110.8, 21.82], [108.7, 21.55], [106.25, 22.6], [102.65, 22.12],
  [99.25, 23.9], [97.7, 27.35], [94.4, 28.85], [88.0, 28.22],
  [82.0, 30.35], [78.35, 33.82],
];

const YUAN_DECLINE = [
  [82.5, 38.45], [87.4, 42.25], [94.0, 45.2], [101.4, 47.15],
  [109.2, 47.2], [116.7, 46.15], [123.5, 44.65], [128.8, 45.35],
  [130.0, 43.2], [127.35, 41.72], [124.2, 40.4], [121.15, 39.1],
  [119.72, 37.65], [119.95, 36.1], [119.05, 35.0], [117.2, 34.35],
  [114.7, 33.55], [111.45, 32.5], [108.15, 31.3], [104.75, 29.55],
  [101.4, 27.35], [98.0, 25.5], [95.2, 28.05], [90.0, 29.0],
  [85.0, 30.55], [82.0, 34.0],
];

const QING_RISE = [
  [88.5, 39.2], [94.0, 42.2], [100.8, 44.45], [108.0, 45.82],
  [112.2, 45.45], [116.0, 46.95], [121.2, 49.05], [123.8, 51.5],
  [126.0, 51.9], [130.4, 52.4], [132.8, 53.15],
  [137.8, 53.25], [140.0, 51.75], [136.9, 48.85], [132.8, 46.55],
  [130.55, 42.35], [127.72, 41.72], [124.85, 40.55], [122.1, 39.55],
  [120.65, 38.15], [120.42, 36.65], [120.5, 35.15], [119.72, 34.25],
  [120.45, 33.32], [121.62, 31.48], [120.95, 30.42], [120.12, 29.25],
  [119.15, 28.05], [118.0, 26.82], [116.65, 25.58], [115.05, 24.32],
  [113.05, 23.02], [110.8, 21.82], [108.7, 21.55], [106.25, 22.6],
  [102.65, 22.12], [99.0, 24.65], [97.6, 28.15], [98.2, 32.5],
  [95.6, 35.7], [91.8, 37.82],
];

const QING_PEAK = [
  [74.5, 39.4], [79.5, 44.65], [85.2, 47.22], [91.8, 48.32],
  [96.2, 49.4], [100.4, 50.85], [104.8, 52.02], [109.0, 51.22],
  [113.8, 51.85], [118.0, 51.25], [121.8, 52.1], [124.8, 52.9],
  [131.2, 53.05], [136.4, 54.0], [140.0, 51.75],
  [136.9, 48.85], [132.8, 46.55], [130.55, 42.35], [127.72, 41.72],
  [124.85, 40.55], [122.1, 39.55], [120.65, 38.15], [120.42, 36.65],
  [120.5, 35.15], [119.72, 34.25], [120.45, 33.32], [121.62, 31.48],
  [120.95, 30.42], [120.12, 29.25], [119.15, 28.05], [118.0, 26.82],
  [116.65, 25.58], [115.05, 24.32], [113.05, 23.02], [110.8, 21.82],
  [108.7, 21.55], [106.25, 22.6], [102.65, 22.12], [98.05, 24.45],
  [95.25, 27.95], [90.5, 27.75], [84.8, 28.22], [79.55, 30.8],
  [77.5, 34.0], [75.0, 36.62],
];

const QING_DECLINE = [
  [74.8, 39.3], [79.8, 44.45], [85.2, 46.95], [91.5, 48.0],
  [96.0, 49.05], [100.3, 50.25], [105.5, 51.55], [109.8, 50.95],
  [113.4, 51.25], [117.6, 50.72], [120.8, 51.65], [123.6, 52.1],
  [126.8, 51.2], [129.2, 49.45], [133.5, 48.05],
  [130.7, 45.0], [130.55, 42.35], [127.72, 41.72], [124.85, 40.55],
  [122.1, 39.55], [120.65, 38.15], [120.42, 36.65], [120.5, 35.15],
  [119.72, 34.25], [120.45, 33.32], [121.62, 31.48], [120.95, 30.42],
  [120.12, 29.25], [119.15, 28.05], [118.0, 26.82], [116.65, 25.58],
  [115.05, 24.32], [113.05, 23.02], [110.8, 21.82], [108.7, 21.55],
  [106.25, 22.6], [102.65, 22.12], [98.05, 24.45], [95.25, 27.95],
  [90.5, 27.75], [84.8, 28.22], [79.55, 30.8], [77.5, 34.0],
  [75.0, 36.62],
];

const PRC_RISE = [
  [74.2, 39.2], [77.2, 42.35], [81.8, 44.9], [87.8, 47.2],
  [94.8, 48.55], [99.5, 48.85], [103.8, 49.62], [108.6, 49.0],
  [113.2, 49.38], [117.6, 49.12], [121.2, 51.0], [126.0, 52.8],
  [130.6, 48.1], [133.0, 47.2],
  [130.65, 44.95], [130.55, 42.35], [127.72, 41.72], [124.85, 40.55],
  [122.1, 39.55], [120.65, 38.15], [120.42, 36.65], [120.5, 35.15],
  [119.72, 34.25], [120.45, 33.32], [121.62, 31.48], [120.95, 30.42],
  [120.12, 29.25], [119.15, 28.05], [118.0, 26.82], [116.65, 25.58],
  [115.05, 24.32], [113.05, 23.02], [110.8, 21.82], [108.7, 21.55],
  [106.25, 22.6], [102.65, 22.12], [99.6, 22.45], [97.4, 24.8],
  [96.5, 27.5], [92.0, 28.25], [86.5, 28.2], [81.2, 30.38],
  [78.2, 33.55], [75.8, 36.52],
];

const PRC_PEAK = [
  [73.4, 39.35], [76.4, 42.55], [80.7, 45.3], [86.4, 47.75],
  [93.5, 49.0], [98.8, 49.28], [103.6, 50.0], [108.2, 49.18],
  [112.6, 49.65], [117.4, 49.2], [122.2, 52.4], [127.0, 53.05],
  [131.2, 48.15], [134.6, 47.25],
  [131.0, 44.95], [130.55, 42.35], [127.72, 41.72], [124.85, 40.55],
  [122.1, 39.55], [120.65, 38.15], [120.42, 36.65], [120.5, 35.15],
  [119.72, 34.25], [120.45, 33.32], [121.62, 31.48], [120.95, 30.42],
  [120.12, 29.25], [119.15, 28.05], [118.0, 26.82], [116.65, 25.58],
  [115.05, 24.32], [113.05, 23.02], [110.8, 21.82], [108.7, 21.55],
  [106.25, 22.6], [102.65, 22.12], [99.5, 21.85], [97.4, 24.45],
  [96.3, 27.7], [92.0, 28.3], [86.2, 28.25], [80.8, 30.55],
  [77.8, 33.8], [75.0, 36.7],
];

const PRC_DECLINE = [
  [73.55, 39.18], [76.7, 42.35], [81.0, 45.05], [86.8, 47.55],
  [93.8, 48.92], [98.9, 49.18], [103.7, 49.88], [108.35, 49.12],
  [112.8, 49.55], [117.5, 49.08], [122.0, 52.25], [126.85, 52.85],
  [131.0, 48.0], [134.25, 47.08],
  [130.85, 44.92], [130.55, 42.35], [127.72, 41.72], [124.85, 40.55],
  [122.1, 39.55], [120.65, 38.15], [120.42, 36.65], [120.5, 35.15],
  [119.72, 34.25], [120.45, 33.32], [121.62, 31.48], [120.95, 30.42],
  [120.12, 29.25], [119.15, 28.05], [118.0, 26.82], [116.65, 25.58],
  [115.05, 24.32], [113.05, 23.02], [110.8, 21.82], [108.7, 21.55],
  [106.25, 22.6], [102.65, 22.12], [99.55, 21.95], [97.45, 24.55],
  [96.35, 27.62], [92.0, 28.28], [86.35, 28.22], [80.95, 30.48],
  [77.95, 33.72], [75.2, 36.62],
];

const phaseDefinitions = {
  jin: [
    {
      phase: 'rise',
      phaseLabel: '西晋建国 · 北方与巴蜀整合',
      startYear: 266,
      endYear: 279,
      summary: '晋初承魏、蜀旧地，以洛阳为核心整合华北、中原、关中与巴蜀，东南吴地尚未并入。',
      geometry: polygon(JIN_RISE, 2, 0.07),
    },
    {
      phase: 'peak',
      phaseLabel: '西晋短暂统一',
      startYear: 280,
      endYear: 316,
      summary: '灭吴后西晋短暂统一中国本部，北抵长城与辽东边缘，南含江南、岭南与巴蜀，海岸作粗略贴合。',
      geometry: polygon(JIN_PEAK, 2, 0.08),
    },
    {
      phase: 'decline',
      phaseLabel: '东晋偏安江南',
      startYear: 317,
      endYear: 420,
      summary: '永嘉南渡后晋室退守长江流域与东南、岭南，北方不再完整涂满，以淮河—秦岭以南为主。',
      geometry: polygon(JIN_DECLINE, 2, 0.07),
    },
  ],
  song: [
    {
      phase: 'rise',
      phaseLabel: '北宋创业 · 中原再整合',
      startYear: 960,
      endYear: 979,
      summary: '宋初以汴京为核心整合中原、华北南缘与长江下游，南方诸国陆续并入，北部避开辽控制区。',
      geometry: polygon(SONG_RISE, 2, 0.07),
    },
    {
      phase: 'peak',
      phaseLabel: '北宋鼎盛',
      startYear: 980,
      endYear: 1126,
      summary: '北宋鼎盛范围覆盖华北南部、中原、江南、东南沿海与岭南，但不完整涂满燕云、河西、西夏和云南。',
      geometry: polygon(SONG_PEAK, 2, 0.08),
    },
    {
      phase: 'decline',
      phaseLabel: '南宋偏安江南',
      startYear: 1127,
      endYear: 1279,
      summary: '靖康之变后南宋退守长江以南、四川、江南和东南沿海，北方区域留空以体现北宋/南宋阶段差异。',
      geometry: polygon(SONG_DECLINE, 2, 0.07),
    },
  ],
  yuan: [
    {
      phase: 'rise',
      phaseLabel: '大元建号 · 北方与西南整合',
      startYear: 1271,
      endYear: 1278,
      summary: '忽必烈定国号后，大元控制漠北、华北、西域通道、吐蕃与云南，南宋江南核心尚未完全纳入。',
      geometry: polygon(YUAN_RISE, 2, 0.11),
    },
    {
      phase: 'peak',
      phaseLabel: '元代全盛',
      startYear: 1279,
      endYear: 1351,
      summary: '灭宋后元朝范围北逾漠北，西括西域，南抵岭南与云南，兼具中国本土、蒙古、西域、青藏和沿海轮廓。',
      geometry: polygon(YUAN_PEAK, 2, 0.12),
    },
    {
      phase: 'decline',
      phaseLabel: '元末收缩',
      startYear: 1352,
      endYear: 1368,
      summary: '元末起义与地方割据削弱南方和中原控制，示意范围收缩为北方、漠北、西域与西南关键廊道。',
      geometry: polygon(YUAN_DECLINE, 2, 0.1),
    },
  ],
  qing: [
    {
      phase: 'rise',
      phaseLabel: '入关定鼎 · 康熙扩展',
      startYear: 1644,
      endYear: 1758,
      summary: '清入关后逐步控制中国本部、满洲、漠南蒙古、台湾与青藏边缘，西域尚未达到乾隆极盛外轮廓。',
      geometry: multiPolygon([QING_RISE, HAINAN, TAIWAN], 2, 0.1),
    },
    {
      phase: 'peak',
      phaseLabel: '康雍乾极盛',
      startYear: 1759,
      endYear: 1840,
      summary: '平定准噶尔与回部后，清朝极盛范围包含中国本土、东北、蒙古、新疆、西藏、西南、台湾和沿海。',
      geometry: multiPolygon([QING_PEAK, HAINAN, TAIWAN], 2, 0.11),
    },
    {
      phase: 'decline',
      phaseLabel: '晚清边疆收缩',
      startYear: 1841,
      endYear: 1912,
      summary: '晚清在外东北等边缘出现收缩，仍保留本部、新疆、青藏、西南和沿海轮廓的沙盘级示意。',
      geometry: multiPolygon([QING_DECLINE, HAINAN, TAIWAN], 2, 0.1),
    },
  ],
  prc: [
    {
      phase: 'rise',
      phaseLabel: '建国整合',
      startYear: 1949,
      endYear: 1978,
      summary: '中华人民共和国建国后整合大陆、东北、内蒙古、新疆、西藏、西南和海岸线，本图为当代国家范围示意。',
      geometry: multiPolygon([PRC_RISE, HAINAN, TAIWAN], 2, 0.1),
      accuracyNote: prcAccuracyNote,
    },
    {
      phase: 'peak',
      phaseLabel: '改革开放后高速发展',
      startYear: 1979,
      endYear: 2012,
      summary: '改革开放后中国沿海、内陆与边疆的整体国家轮廓稳定呈现，强调陆地大轮廓和东部海岸转折。',
      geometry: multiPolygon([PRC_PEAK, HAINAN, TAIWAN], 2, 0.1),
      accuracyNote: prcAccuracyNote,
    },
    {
      phase: 'decline',
      phaseLabel: '当代转型 · 增速换挡',
      startYear: 2013,
      endYear: 2025,
      summary: '当代阶段并非疆域衰落，而是沿用 rise/peak/decline 数据模型表达现代转型期，范围保持中国大轮廓示意。',
      geometry: multiPolygon([PRC_DECLINE, HAINAN, TAIWAN], 2, 0.1),
      accuracyNote: prcAccuracyNote,
    },
  ],
};

function makeFeature(base, definition) {
  return {
    type: 'Feature',
    properties: {
      id: base.id,
      dynasty: base.dynasty,
      phase: definition.phase,
      phaseLabel: definition.phaseLabel,
      startYear: definition.startYear,
      endYear: definition.endYear,
      color: base.color,
      capital: base.capital,
      summary: definition.summary,
      accuracy: 'coastline-aware-rough',
      accuracyLabel,
      accuracyNote: definition.accuracyNote || accuracyNote,
      sourceNote,
    },
    geometry: definition.geometry,
  };
}

function assertGenerated(features, dynastyById) {
  for (const id of batchIds) {
    const dynasty = dynastyById.get(id);
    if (!dynasty) throw new Error(`Missing dynasty metadata for ${id}.`);

    const group = features
      .filter((feature) => idOf(feature) === id)
      .sort((a, b) => a.properties.startYear - b.properties.startYear);

    if (group.length !== 3) throw new Error(`${id} must have exactly 3 features.`);
    if (group[0].properties.startYear !== dynasty.startYear) throw new Error(`${id} must start at ${dynasty.startYear}.`);
    if (group.at(-1).properties.endYear !== dynasty.endYear) throw new Error(`${id} must end at ${dynasty.endYear}.`);

    for (const phase of phases) {
      if (!group.some((feature) => feature.properties.phase === phase)) throw new Error(`${id} missing phase ${phase}.`);
    }

    for (let index = 1; index < group.length; index += 1) {
      if (group[index].properties.startYear !== group[index - 1].properties.endYear + 1) {
        throw new Error(`${id} phases are not contiguous.`);
      }
    }

    for (const feature of group) {
      if (!feature.properties.sourceNote || !feature.properties.accuracyNote) {
        throw new Error(`${id} feature missing sourceNote or accuracyNote.`);
      }
      const rings = outerRings(feature.geometry);
      const totalVertices = rings.reduce((sum, ring) => sum + ring.length, 0);
      if (feature.geometry.type === 'Polygon' && rings[0].length < 40) {
        throw new Error(`${id} coastline-aware polygon has too few vertices (${rings[0].length}).`);
      }
      if (feature.geometry.type === 'MultiPolygon' && totalVertices < 80) {
        throw new Error(`${id} coastline-aware multipolygon has too few vertices (${totalVertices}).`);
      }
    }
  }
}

const [boundaries, dynasties] = await Promise.all([
  readFile(boundariesUrl, 'utf8').then(JSON.parse),
  readFile(dynastiesUrl, 'utf8').then(JSON.parse),
]);

const dynastyById = new Map(dynasties.map((dynasty) => [dynasty.id, dynasty]));
const firstBatchIndex = boundaries.features.findIndex((feature) => batchIdSet.has(idOf(feature)));
if (firstBatchIndex === -1) throw new Error('Cannot find any existing Batch04 boundary feature.');

const baseById = new Map();
for (const feature of boundaries.features) {
  const id = idOf(feature);
  if (batchIdSet.has(id) && !baseById.has(id)) {
    baseById.set(id, {
      id,
      dynasty: feature.properties.dynasty,
      color: feature.properties.color,
      capital: feature.properties.capital,
    });
  }
}

for (const id of batchIds) {
  if (!baseById.has(id)) throw new Error(`Cannot find existing base feature for ${id}.`);
}

const generated = batchIds.flatMap((id) => phaseDefinitions[id].map((definition) => makeFeature(baseById.get(id), definition)));
assertGenerated(generated, dynastyById);

const keptBefore = boundaries.features.slice(0, firstBatchIndex).filter((feature) => !batchIdSet.has(idOf(feature)));
const keptAfter = boundaries.features.slice(firstBatchIndex).filter((feature) => !batchIdSet.has(idOf(feature)));
boundaries.features = [...keptBefore, ...generated, ...keptAfter];

await writeFile(boundariesUrl, `${JSON.stringify(boundaries, null, 2)}\n`, 'utf8');

console.log(`Regenerated F2 Batch04 boundaries: ${generated.length} features for ${batchIds.join(', ')}`);
