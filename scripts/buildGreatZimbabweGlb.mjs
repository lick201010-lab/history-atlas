// Great Zimbabwe - F3 Batch06A GLB draft.
// Zero-texture procedural miniature: dry-stone elliptical enclosures,
// conical tower cue, interior ruins, hill wall, and muted granite palette.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/great-zimbabwe.glb', import.meta.url);

const COLORS = {
  earth: 0x8e7655,
  earthLight: 0xb49a6c,
  granite: 0x8d8a7a,
  graniteDark: 0x646153,
  graniteLight: 0xb0aa93,
  wall: 0x777466,
  wallShade: 0x555146,
  tower: 0x8a8573,
  towerLight: 0xb7af94,
  doorway: 0x302b24,
  path: 0xc4ad7a,
  brush: 0x5d6947,
};

function material(key) {
  if (key === 'doorway') return { metalness: 0.0, roughness: 0.98 };
  if (key === 'towerLight' || key === 'graniteLight') return { metalness: 0.0, roughness: 0.78 };
  return { metalness: 0.0, roughness: 0.92 };
}

const a = new WonderAsset({ name: 'GreatZimbabwe' });

function angleDistance(theta, target) {
  return Math.abs(Math.atan2(Math.sin(theta - target), Math.cos(theta - target)));
}

function ellipseWall({ aRadius, bRadius, z, height, thickness, key, capKey, n = 64, gate = null }) {
  a.ellipseRing(aRadius, bRadius, n, z, thickness, 1.05, (i, theta) => {
    if (gate && angleDistance(theta, gate.theta) < gate.width) return null;
    return { key, height };
  });
  a.ellipseRing(aRadius, bRadius, n, z + height, thickness * 1.18, 1.05, (i, theta) => {
    if (gate && angleDistance(theta, gate.theta) < gate.width) return null;
    return { key: capKey, height: 0.026 + (i % 2) * 0.006 };
  });
}

function wallRun(points, h, key = 'granite') {
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const rz = Math.atan2(dy, dx);
    a.boxRotZ(key, len, 0.036, h, (x0 + x1) / 2, (y0 + y1) / 2, 0.052 + h / 2, rz);
  }
}

function lowRuin(x, y, w, d, rot = 0) {
  a.boxRotZ('granite', w, 0.032, 0.072, x, y - d / 2, 0.088, rot);
  a.boxRotZ('graniteDark', w, 0.030, 0.060, x, y + d / 2, 0.082, rot);
  a.boxRotZ('granite', 0.030, d, 0.065, x - w / 2, y, 0.084, rot);
  a.boxRotZ('graniteDark', 0.030, d, 0.058, x + w / 2, y, 0.081, rot);
  a.boxRotZ('doorway', w * 0.22, 0.034, 0.050, x, y - d / 2 - 0.004, 0.076, rot);
}

function stoneBlocksOnEllipse(aRadius, bRadius, count, z, gate = null) {
  for (let i = 0; i < count; i += 1) {
    const theta = (i / count) * Math.PI * 2;
    if (gate && angleDistance(theta, gate.theta) < gate.width * 1.25) continue;
    const x = aRadius * Math.cos(theta);
    const y = bRadius * Math.sin(theta);
    const tangent = Math.atan2(bRadius * Math.cos(theta), -aRadius * Math.sin(theta));
    const key = i % 3 === 0 ? 'graniteLight' : 'wallShade';
    a.boxRotZ(key, 0.052, 0.020, 0.026, x, y, z, tangent);
  }
}

// Earth pad and low hill shelf. Keep the base broad but browser-budget friendly.
a.box('earth', 1.58, 1.12, 0.032, 0, 0, 0.016);
a.boxRotZ('earthLight', 1.28, 0.70, 0.038, -0.035, -0.010, 0.051, -0.05);
a.boxRotZ('earth', 0.94, 0.38, 0.050, -0.245, 0.350, 0.078, 0.12);
a.boxRotZ('path', 0.64, 0.050, 0.014, 0.090, -0.420, 0.064, 0.06);

// Main Great Enclosure: elliptical dry-stone wall with a southern entrance gap.
const southGate = { theta: Math.PI * 1.5, width: 0.145 };
ellipseWall({
  aRadius: 0.575,
  bRadius: 0.365,
  z: 0.052,
  height: 0.315,
  thickness: 0.062,
  key: 'wall',
  capKey: 'graniteLight',
  n: 72,
  gate: southGate,
});
ellipseWall({
  aRadius: 0.405,
  bRadius: 0.245,
  z: 0.060,
  height: 0.150,
  thickness: 0.042,
  key: 'granite',
  capKey: 'graniteLight',
  n: 56,
  gate: { theta: Math.PI * 1.48, width: 0.185 },
});
stoneBlocksOnEllipse(0.575, 0.365, 54, 0.345, southGate);
stoneBlocksOnEllipse(0.405, 0.245, 40, 0.198, { theta: Math.PI * 1.48, width: 0.185 });

// Conical tower inside the enclosure, a key Great Zimbabwe cue.
a.cyl('tower', 0.050, 0.125, 0.410, 0.205, -0.080, 0.052 + 0.205, 22);
for (let i = 0; i < 7; i += 1) {
  const t = i / 6;
  const r = 0.118 + (0.055 - 0.118) * t;
  a.cyl(i % 2 ? 'towerLight' : 'wallShade', r * 0.98, r * 1.02, 0.014, 0.205, -0.080, 0.094 + t * 0.340, 22);
}
a.box('doorway', 0.036, 0.028, 0.070, 0.205, -0.202, 0.095);

// Curving passage walls and interior ruin traces.
wallRun([
  [-0.325, -0.180],
  [-0.170, -0.105],
  [0.030, -0.115],
  [0.165, -0.205],
], 0.105, 'graniteDark');
wallRun([
  [-0.260, 0.105],
  [-0.070, 0.160],
  [0.140, 0.120],
  [0.290, 0.010],
], 0.095, 'granite');
wallRun([
  [-0.410, 0.345],
  [-0.265, 0.450],
  [-0.030, 0.470],
  [0.185, 0.405],
], 0.135, 'wallShade');

for (const spec of [
  [-0.230, -0.020, 0.150, 0.100, -0.15],
  [-0.055, 0.020, 0.125, 0.088, 0.08],
  [0.090, 0.165, 0.120, 0.085, 0.20],
  [-0.360, 0.230, 0.130, 0.082, -0.35],
]) {
  lowRuin(...spec);
}

// Decorative stone courses: stacked block read without looking like crenellations.
for (const y of [-0.370, 0.370]) {
  for (let i = 0; i < 13; i += 1) {
    const x = -0.450 + i * 0.075;
    a.box('graniteLight', 0.045, 0.018, 0.018, x, y, 0.170 + (i % 2) * 0.035);
  }
}
for (let i = 0; i < 10; i += 1) {
  const y = -0.260 + i * 0.060;
  a.box('wallShade', 0.018, 0.040, 0.018, -0.570, y, 0.145 + (i % 2) * 0.042);
  a.box('graniteLight', 0.018, 0.040, 0.018, 0.570, y, 0.160 + (i % 2) * 0.036);
}

// Sparse brush clumps reinforce the dry hill/valley enclosure setting.
for (const [x, y, r] of [
  [-0.650, -0.320, 0.030],
  [-0.560, 0.455, 0.026],
  [0.545, 0.435, 0.030],
  [0.640, -0.235, 0.024],
  [-0.090, 0.505, 0.022],
]) {
  a.cyl('brush', r * 0.70, r, 0.035, x, y, 0.058, 7);
  a.sphere('brush', r, x, y, 0.088, 7);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`GreatZimbabwe: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
