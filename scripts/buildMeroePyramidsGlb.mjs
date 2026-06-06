// Meroe Pyramids - F3 Batch06A GLB draft.
// Zero-texture procedural miniature: Nubian royal cemetery cluster with
// many steep small pyramids, chapel blocks, desert plinth, and sandstone tones.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/meroe-pyramids.glb', import.meta.url);

const COLORS = {
  desert: 0xb9905d,
  desertShade: 0x98734a,
  path: 0xd3b277,
  stone: 0xc9995f,
  stoneShade: 0x9f7047,
  stoneLight: 0xd8b176,
  chapel: 0xb87d4f,
  chapelLight: 0xd0a16b,
  chapelDark: 0x865739,
  doorway: 0x32251c,
  rubble: 0x8d6846,
};

function material(key) {
  if (key === 'doorway') return { metalness: 0.0, roughness: 0.98 };
  return { metalness: 0.0, roughness: 0.90 };
}

const a = new WonderAsset({ name: 'MeroePyramids' });

function addChapel(x, y, half, z, face = -1) {
  const cy = y + face * half * 1.22;
  const h = Math.max(half * 0.42, 0.035);
  a.box('chapel', half * 1.20, half * 0.62, h, x, cy, z + h / 2);
  a.gable('chapelLight', half * 1.05, half * 0.22, half * 0.68, x, cy, z + h, 'xz');
  a.box('chapelDark', half * 0.18, half * 0.70, h * 0.84, x - half * 0.48, cy, z + h * 0.48);
  a.box('chapelDark', half * 0.18, half * 0.70, h * 0.84, x + half * 0.48, cy, z + h * 0.48);
  a.box('doorway', half * 0.34, half * 0.05, h * 0.66, x, cy + face * half * 0.34, z + h * 0.38);
  a.box('path', half * 0.70, half * 0.78, 0.012, x, cy + face * half * 0.64, z + 0.006);
}

function addPyramid({ x, y, half, height, layers = 5, ruined = false, face = -1 }) {
  const baseZ = 0.050;
  const topHalf = ruined ? half * 0.23 : Math.max(half * 0.028, 0.004);
  const pyramidHeight = ruined ? height * 0.72 : height;
  a.stepPyramid('stone', half, pyramidHeight, layers, x, y, baseZ, {
    bandKey: 'stoneShade',
    topHalf,
    twist: Math.PI / 4,
  });
  if (!ruined) {
    a.box('stoneLight', half * 0.20, half * 0.20, Math.max(height * 0.035, 0.010), x, y, baseZ + height + Math.max(height * 0.018, 0.005));
  } else {
    a.box('rubble', half * 1.35, half * 0.24, 0.030, x, y + face * half * 0.18, baseZ + pyramidHeight + 0.015);
  }
  addChapel(x, y, half, baseZ, face);
}

function scatterRubble(x, y, half, n) {
  for (let i = 0; i < n; i += 1) {
    const dx = (i % 3 - 1) * half * 0.36;
    const dy = (Math.floor(i / 3) - 0.5) * half * 0.30;
    const scale = 0.55 + (i % 4) * 0.10;
    a.boxRotZ('rubble', half * 0.20 * scale, half * 0.13, 0.030, x + dx, y + dy, 0.070, (i % 5) * 0.35);
  }
}

// Desert platform and cemetery ridges.
a.box('desert', 1.58, 1.18, 0.032, 0, 0, 0.016);
a.boxRotZ('desertShade', 1.26, 0.150, 0.026, -0.05, -0.255, 0.045, -0.06);
a.boxRotZ('desertShade', 1.12, 0.130, 0.024, 0.02, 0.055, 0.045, 0.04);
a.boxRotZ('desertShade', 1.04, 0.115, 0.022, 0.00, 0.335, 0.044, -0.08);
a.box('path', 1.20, 0.050, 0.014, 0, -0.410, 0.056);
a.box('path', 1.05, 0.045, 0.014, 0.02, -0.065, 0.056);
a.box('path', 0.92, 0.042, 0.014, 0.08, 0.235, 0.056);

const pyramids = [
  { x: -0.48, y: -0.260, half: 0.082, height: 0.360, layers: 5 },
  { x: -0.28, y: -0.245, half: 0.066, height: 0.290, layers: 4 },
  { x: -0.075, y: -0.270, half: 0.095, height: 0.430, layers: 5 },
  { x: 0.165, y: -0.245, half: 0.070, height: 0.310, layers: 4 },
  { x: 0.390, y: -0.255, half: 0.083, height: 0.355, layers: 5 },
  { x: -0.390, y: 0.045, half: 0.066, height: 0.275, layers: 4 },
  { x: -0.175, y: 0.025, half: 0.118, height: 0.525, layers: 6 },
  { x: 0.090, y: 0.010, half: 0.088, height: 0.385, layers: 5 },
  { x: 0.320, y: 0.055, half: 0.060, height: 0.250, layers: 4, ruined: true },
  { x: 0.505, y: 0.030, half: 0.066, height: 0.280, layers: 4 },
  { x: -0.525, y: 0.330, half: 0.062, height: 0.250, layers: 4, ruined: true },
  { x: -0.300, y: 0.295, half: 0.083, height: 0.340, layers: 5 },
  { x: -0.055, y: 0.335, half: 0.066, height: 0.270, layers: 4 },
  { x: 0.205, y: 0.300, half: 0.102, height: 0.425, layers: 5 },
  { x: 0.485, y: 0.285, half: 0.058, height: 0.235, layers: 4 },
];

for (const spec of pyramids) addPyramid(spec);

for (const [x, y, half, count] of [
  [-0.48, -0.085, 0.060, 5],
  [0.350, -0.070, 0.055, 6],
  [-0.050, 0.180, 0.060, 5],
  [0.445, 0.405, 0.050, 4],
]) {
  scatterRubble(x, y, half, count);
}

// Low enclosure walls and chapel rows keep the cluster from reading as one pyramid.
for (const y of [-0.415, -0.070, 0.225]) {
  a.box('chapelDark', 1.18, 0.020, 0.045, 0.02, y, 0.080);
}
for (const x of [-0.62, 0.62]) {
  a.box('chapelDark', 0.020, 0.775, 0.042, x, -0.035, 0.079);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`MeroePyramids: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
