// Machu Picchu - F3 Batch04 GLB asset.
// Zero-texture procedural miniature: Andean ridge, agricultural terraces,
// masonry building clusters, sacred plaza, and mountain-city silhouette.

import * as THREE from 'three';
import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/machu-picchu.glb', import.meta.url);

const COLORS = {
  ground: 0x7d8a63,
  ridge: 0x8c9470,
  ridgeShade: 0x626b4c,
  terrace: 0xa5a46f,
  terraceWall: 0x7a704f,
  path: 0xc2b383,
  stone: 0xb7ad91,
  stoneShade: 0x8d846c,
  roof: 0x9a7a4d,
  shadow: 0x3f3527,
  altar: 0xc4b995,
};

function material(key) {
  if (key === 'shadow') return { metalness: 0.0, roughness: 0.96 };
  return { metalness: 0.0, roughness: 0.90 };
}

const a = new WonderAsset({ name: 'MachuPicchu' });

function irregularPrism(key, points, z, height) {
  const positions = [];
  const topZ = z + height;
  const add = (...pts) => {
    for (const [x, y, zz] of pts) positions.push(x, y, zz);
  };

  for (let i = 1; i < points.length - 1; i += 1) {
    add([points[0][0], points[0][1], topZ], [points[i][0], points[i][1], topZ], [points[i + 1][0], points[i + 1][1], topZ]);
    add([points[0][0], points[0][1], z], [points[i + 1][0], points[i + 1][1], z], [points[i][0], points[i][1], z]);
  }

  for (let i = 0; i < points.length; i += 1) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    add([p0[0], p0[1], z], [p1[0], p1[1], z], [p1[0], p1[1], topZ]);
    add([p0[0], p0[1], z], [p1[0], p1[1], topZ], [p0[0], p0[1], topZ]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  a.push(geometry, key);
}

function terrace(y, z, width, depth, x = -0.12) {
  a.box('terraceWall', width, depth, 0.040, x, y, z);
  a.box('terrace', width * 0.94, depth * 0.60, 0.020, x, y + depth * 0.10, z + 0.030);
}

function house(x, y, z, w = 0.105, d = 0.080, h = 0.095, rot = 0) {
  // Machu Picchu reads better as roofless masonry ruins at map scale.
  a.boxRotZ('stone', w, d, h, x, y, z + h / 2, rot);
  a.boxRotZ('stoneShade', w * 0.86, d * 0.72, 0.020, x, y, z + h + 0.010, rot);
  a.boxRotZ('shadow', w * 0.24, 0.012, h * 0.48, x, y - d * 0.53, z + h * 0.42, rot);
}

function wallRun(points, h = 0.075) {
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0, z0] = points[i];
    const [x1, y1, z1] = points[i + 1];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    a.boxRotZ('stoneShade', len, 0.030, h, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2 + h / 2, ang);
  }
}

// Irregular Andean ridge footprint. Avoid a square map tile look in selected view.
irregularPrism('ground', [
  [-0.84, -0.18], [-0.68, -0.48], [-0.32, -0.63], [0.12, -0.60],
  [0.54, -0.42], [0.75, -0.12], [0.66, 0.20], [0.33, 0.48],
  [-0.08, 0.61], [-0.48, 0.50], [-0.78, 0.20],
], 0, 0.030);
irregularPrism('ridgeShade', [
  [-0.68, -0.10], [-0.48, -0.35], [-0.15, -0.44], [0.25, -0.36],
  [0.55, -0.12], [0.48, 0.18], [0.12, 0.38], [-0.28, 0.34],
  [-0.58, 0.12],
], 0.030, 0.060);
irregularPrism('ridge', [
  [-0.50, 0.02], [-0.28, -0.20], [0.05, -0.25], [0.37, -0.12],
  [0.42, 0.10], [0.12, 0.27], [-0.25, 0.23],
], 0.090, 0.060);

// Low ridgeline hints, not background pyramids.
a.boxRotZ('ridgeShade', 0.52, 0.060, 0.050, -0.28, -0.30, 0.125, 0.28);
a.boxRotZ('ridgeShade', 0.42, 0.052, 0.045, 0.36, -0.25, 0.120, -0.38);
a.boxRotZ('ridge', 0.66, 0.085, 0.055, -0.02, 0.28, 0.155, -0.12);

// Agricultural terrace fan on the city slope.
for (let i = 0; i < 7; i += 1) {
  terrace(0.42 - i * 0.087, 0.150 + i * 0.035, 1.04 - i * 0.065, 0.045, -0.10 + i * 0.018);
}
for (let i = 0; i < 5; i += 1) {
  a.boxRotZ('path', 0.045, 0.115, 0.018, -0.58 + i * 0.065, 0.35 - i * 0.090, 0.205 + i * 0.045, 0.52);
}

// Sacred plaza and upper ridge paths.
a.boxRotZ('path', 0.46, 0.145, 0.026, 0.16, 0.035, 0.470, -0.10);
a.boxRotZ('path', 0.34, 0.050, 0.020, -0.10, -0.145, 0.430, -0.15);
a.boxRotZ('path', 0.28, 0.045, 0.020, 0.37, -0.090, 0.405, 0.24);

// Masonry house clusters on both sides of the plaza.
const houseSpots = [
  [-0.25, 0.10, 0.435, 0.11, 0.075, 0.090, -0.10],
  [-0.09, 0.13, 0.465, 0.11, 0.075, 0.095, -0.10],
  [0.08, 0.13, 0.480, 0.11, 0.075, 0.100, -0.10],
  [0.27, 0.10, 0.455, 0.12, 0.080, 0.100, -0.08],
  [-0.28, -0.05, 0.395, 0.10, 0.070, 0.085, 0.06],
  [-0.12, -0.06, 0.410, 0.10, 0.070, 0.085, 0.04],
  [0.18, -0.08, 0.395, 0.10, 0.070, 0.085, 0.22],
  [0.35, -0.02, 0.385, 0.10, 0.070, 0.085, 0.26],
  [0.48, 0.10, 0.370, 0.09, 0.065, 0.075, 0.35],
  [-0.43, 0.18, 0.370, 0.09, 0.065, 0.075, -0.24],
];
for (const spec of houseSpots) house(...spec);

// Intihuatana-like carved stone and enclosing walls.
a.stepPyramid('altar', 0.075, 0.085, 3, 0.03, 0.285, 0.460, { bandKey: 'stoneShade', topHalf: 0.036 });
a.boxRotZ('altar', 0.050, 0.035, 0.095, 0.035, 0.290, 0.588, 0.25);
wallRun([
  [-0.42, 0.28, 0.355],
  [-0.17, 0.34, 0.415],
  [0.16, 0.32, 0.435],
  [0.43, 0.24, 0.390],
], 0.060);
wallRun([
  [-0.36, -0.18, 0.330],
  [-0.08, -0.25, 0.380],
  [0.22, -0.21, 0.370],
  [0.47, -0.15, 0.335],
], 0.055);

// Small stair ribbons cutting through terraces.
for (let i = 0; i < 8; i += 1) {
  a.boxRotZ('stoneShade', 0.055, 0.022, 0.024, 0.52 - i * 0.060, 0.42 - i * 0.074, 0.165 + i * 0.046, -0.42);
}

// Machu Picchu is an archaeological city, not a tower. Compress z so the map
// silhouette reads as terraces and low stone ruins instead of miniature pyramids.
for (const bucket of Object.values(a.buckets)) {
  for (const geometry of bucket) geometry.scale(1, 1, 0.58);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`MachuPicchu: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
