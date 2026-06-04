// Refine the Mongol Empire boundary without using a single huge convex envelope.
//
// The previous method (Natural Earth clipping inside one Eurasian hull) is good
// for coastal empires, but it turns the Mongol Empire into a diagonal grassland
// slab. This script uses hand-authored historical-geographic anchor rings:
// - rise: Mongolian plateau + northern China + Central Asia campaign zone
// - peak: connected Eurasian land empire with holes for Black Sea/Caspian/Aral
// - decline: four successor-zone polygons shown as one dynasty layer
//
// Run: node scripts/refineMongolBoundary.mjs

import { readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../src/data/boundaries-simplified.json', import.meta.url);
const TARGET_ID = 'mongol-empire';

const ACCURACY_NOTE = '人工历史地理锚点绘制的粗边界：外轮廓参考欧亚草原、河流、山脉与通行历史地图范围，水体以 hole 排除；属沙盘级示意，不代表精确历史疆域。';
const SOURCE_NOTE = '蒙古帝国范围参考通行历史地图（成吉思汗时期扩张、13 世纪中叶最大范围、四大汗国分化）与现代底图地理锚点手绘；为避免凸包裁切造成大斜带，未使用单一 Natural Earth 凸包裁剪。';

function closeRing(points) {
  const ring = points.map(([lng, lat]) => [lng, lat]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!last || first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }
  return ring;
}

function signedArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return area / 2;
}

function orientOuter(ring) {
  return signedArea(ring) < 0 ? ring.slice().reverse() : ring;
}

function orientHole(ring) {
  return signedArea(ring) > 0 ? ring.slice().reverse() : ring;
}

function hash01(x, y, seed = 0) {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 41.9) * 43758.5453;
  return h - Math.floor(h);
}

function densifyAndRoughen(points, { step = 1.15, amplitude = 0.28, seed = 1 } = {}) {
  const ring = closeRing(points);
  const out = [];
  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i];
    const b = ring[i + 1];
    out.push(a);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len <= step) continue;
    const n = Math.ceil(len / step);
    const nx = -dy / len;
    const ny = dx / len;
    const phase = hash01(Math.round(a[0] * 11), Math.round(a[1] * 11), seed) * Math.PI * 2;
    const amp = Math.min(amplitude, len * 0.09);
    for (let k = 1; k < n; k += 1) {
      const t = k / n;
      const taper = Math.sin(Math.PI * t);
      const wobble = 0.58 * Math.sin(Math.PI * 2 * t + phase)
        + 0.28 * Math.sin(Math.PI * 5 * t + phase * 1.37)
        + 0.14 * Math.sin(Math.PI * 9 * t + phase * 0.73);
      out.push([
        a[0] + dx * t + nx * amp * taper * wobble,
        a[1] + dy * t + ny * amp * taper * wobble,
      ]);
    }
  }
  out.push(out[0].slice());
  return out.map(([lng, lat]) => [
    Math.round(lng * 1000) / 1000,
    Math.round(lat * 1000) / 1000,
  ]);
}

function outer(points, options) {
  return orientOuter(densifyAndRoughen(points, options));
}

function hole(points, options) {
  return orientHole(densifyAndRoughen(points, { step: 0.55, amplitude: 0.08, ...options }));
}

function polygon(points, holes = [], options = {}) {
  return [outer(points, options), ...holes.map(([pts, opts]) => hole(pts, opts))];
}

function feature({ phase, phaseLabel, startYear, endYear, summary, geometry, outlineGeometry }) {
  return {
    type: 'Feature',
    id: TARGET_ID,
    properties: {
      id: TARGET_ID,
      dynasty: '蒙古帝国',
      phase,
      phaseLabel,
      startYear,
      endYear,
      color: '#16a085',
      capital: '哈拉和林',
      summary,
      accuracy: 'coastline-aware-rough',
      accuracyLabel: '地理锚点粗多边形',
      accuracyNote: ACCURACY_NOTE,
      sourceNote: SOURCE_NOTE,
      ...(outlineGeometry ? { outlineGeometry } : {}),
    },
    geometry,
  };
}

// 1206-1227: from Mongolian core into Jin/Xixia and Khwarezmian Central Asia.
const RISE_OUTER = [
  [58.0, 42.0], [63.5, 45.5], [72.0, 47.5], [83.5, 50.5],
  [96.5, 53.2], [109.0, 53.0], [119.5, 49.2], [123.0, 43.5],
  [119.0, 39.2], [109.5, 37.5], [99.0, 38.5], [90.0, 40.5],
  [80.5, 39.0], [70.5, 36.8], [62.0, 38.2], [58.0, 42.0],
];

const BLACK_SEA_HOLE = [
  [27.2, 41.0], [29.5, 43.2], [33.5, 45.1], [38.6, 45.6],
  [41.7, 43.2], [41.0, 40.8], [36.0, 40.1], [31.0, 40.5],
  [27.2, 41.0],
];

const CASPIAN_HOLE = [
  [47.3, 37.0], [48.6, 40.0], [49.5, 43.0], [51.2, 46.2],
  [53.2, 45.4], [53.7, 41.5], [52.2, 38.5], [50.4, 36.5],
  [47.3, 37.0],
];

const ARAL_HOLE = [
  [58.1, 43.2], [59.0, 45.3], [61.0, 46.8], [62.3, 45.2],
  [61.2, 43.5], [59.4, 42.8], [58.1, 43.2],
];

// Peak is a unified hand-drawn outline. The previous regional MultiPolygon
// produced internal seams and transparent overlap artifacts in MapLibre.
const PEAK_VISUAL_OUTLINE = [
  [23.5, 49.8], [30.5, 52.5], [42.5, 54.8], [55.5, 53.4],
  [70.5, 48.6], [86.0, 49.2], [96.0, 54.8], [111.5, 54.2],
  [125.5, 49.8], [128.0, 43.0], [123.0, 36.8], [113.0, 32.0],
  [101.0, 30.0], [92.0, 34.5], [88.0, 37.0], [78.0, 35.0],
  [68.0, 35.8], [66.0, 31.0], [59.0, 27.0], [49.0, 29.0],
  [41.5, 33.4], [38.5, 39.4], [30.5, 45.2], [23.5, 49.8],
];

// 1261-1368: show successor-zone fragments as one feature. This reads better
// than a single late-empire slab while preserving the existing dynasty id.
const GOLDEN_HORDE = [
  [26.0, 49.0], [34.0, 52.5], [47.0, 53.5], [58.0, 51.5],
  [60.0, 47.0], [52.0, 45.0], [41.0, 44.0], [31.0, 45.5],
  [26.0, 49.0],
];

const ILKHANATE = [
  [40.0, 38.5], [47.0, 40.5], [56.0, 40.0], [65.0, 36.0],
  [66.0, 31.0], [59.0, 27.0], [49.0, 29.0], [42.0, 33.5],
  [40.0, 38.5],
];

const CHAGATAI = [
  [64.0, 44.5], [73.0, 47.0], [86.0, 46.0], [91.0, 42.0],
  [88.0, 37.0], [78.0, 35.0], [68.0, 36.5], [64.0, 40.0],
  [64.0, 44.5],
];

const YUAN = [
  [88.0, 48.0], [97.0, 52.5], [112.0, 53.0], [124.0, 48.0],
  [125.0, 41.0], [120.0, 36.0], [111.0, 32.0], [101.0, 31.0],
  [94.0, 35.0], [89.0, 40.0], [88.0, 48.0],
];

const mongolFeatures = [
  feature({
    phase: 'rise',
    phaseLabel: '成吉思汗扩张',
    startYear: 1206,
    endYear: 1227,
    summary: '成吉思汗统一蒙古诸部后，势力由蒙古高原扩至西夏、金朝北境与花剌子模中亚地带。',
    geometry: {
      type: 'Polygon',
      coordinates: polygon(
        RISE_OUTER,
        [[[[58.1, 43.2], [59.2, 45.1], [61.3, 45.8], [60.8, 43.5], [58.1, 43.2]], { seed: 11 }]],
        { seed: 10 },
      ),
    },
  }),
  feature({
    phase: 'peak',
    phaseLabel: '欧亚极盛',
    startYear: 1228,
    endYear: 1260,
    summary: '窝阔台、贵由、蒙哥时期，蒙古军政体系横跨东亚、内亚、伊朗、高加索、罗斯与东欧草原，形成历史上最大的陆上帝国。',
    geometry: {
      type: 'Polygon',
      coordinates: polygon(
        PEAK_VISUAL_OUTLINE,
        [
          [BLACK_SEA_HOLE, { seed: 21 }],
          [CASPIAN_HOLE, { seed: 23 }],
          [ARAL_HOLE, { seed: 25 }],
        ],
        { seed: 20, step: 1.35, amplitude: 0.22 },
      ),
    },
    outlineGeometry: {
      type: 'Polygon',
      coordinates: polygon(
        PEAK_VISUAL_OUTLINE,
        [
          [BLACK_SEA_HOLE, { seed: 41 }],
          [CASPIAN_HOLE, { seed: 42 }],
          [ARAL_HOLE, { seed: 43 }],
        ],
        { seed: 40, step: 1.35, amplitude: 0.22 },
      ),
    },
  }),
  feature({
    phase: 'decline',
    phaseLabel: '四大汗国分化',
    startYear: 1261,
    endYear: 1368,
    summary: '忽必烈与阿里不哥之争后，帝国分裂为元、察合台、伊儿汗和金帐等汗国，仍保持蒙古世界秩序但不再是单一中央帝国。',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        polygon(GOLDEN_HORDE, [[BLACK_SEA_HOLE, { seed: 31 }]], { seed: 30 }),
        polygon(ILKHANATE, [[CASPIAN_HOLE, { seed: 33 }]], { seed: 32 }),
        polygon(CHAGATAI, [[ARAL_HOLE, { seed: 35 }]], { seed: 34 }),
        polygon(YUAN, [], { seed: 36 }),
      ],
    },
  }),
];

const collection = JSON.parse(await readFile(OUT, 'utf8'));
const nextFeatures = [];
let inserted = false;
let removed = 0;

for (const existing of collection.features) {
  if (existing.properties?.id !== TARGET_ID) {
    nextFeatures.push(existing);
    continue;
  }
  removed += 1;
  if (!inserted) {
    nextFeatures.push(...mongolFeatures);
    inserted = true;
  }
}

if (!inserted) nextFeatures.push(...mongolFeatures);

const next = {
  type: 'FeatureCollection',
  features: nextFeatures,
};

await writeFile(OUT, JSON.stringify(next, null, 2) + '\n');

for (const item of mongolFeatures) {
  const rings = item.geometry.type === 'Polygon'
    ? [item.geometry.coordinates[0]]
    : item.geometry.coordinates.map((poly) => poly[0]);
  const verts = rings.reduce((sum, ring) => sum + ring.length, 0);
  console.log(`${item.properties.phase}: ${item.geometry.type}, ${rings.length} outer ring(s), ${verts} outer vertices`);
}
console.log(`Replaced ${removed} ${TARGET_ID} feature(s) with ${mongolFeatures.length} phased feature(s).`);
