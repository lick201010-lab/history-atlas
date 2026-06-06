// Konark Sun Temple - F3 Batch03 GLB asset.
// Zero-texture procedural miniature: Odisha temple/chariot silhouette,
// stepped jagamohana, rekha tower massing, carved wheels, and entry hall.

import * as THREE from 'three';
import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/konark-sun.glb', import.meta.url);

const COLORS = {
  ground: 0xb99063,
  plinth: 0xb87950,
  plinthShade: 0x925f42,
  temple: 0xc58b5d,
  templeShade: 0x9e6b4a,
  roof: 0xd19b6c,
  wheel: 0xd4a46f,
  spoke: 0x7a4d34,
  carving: 0xe0b47e,
  dark: 0x3d2a21,
  horse: 0xc99762,
  finial: 0xb27d35,
};

function material(key) {
  if (key === 'finial') return { metalness: 0.16, roughness: 0.56 };
  if (key === 'dark') return { metalness: 0.0, roughness: 0.96 };
  return { metalness: 0.0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'KonarkSun' });

function pushSideWheel(x, y, z, r, key = 'wheel') {
  const disk = new THREE.CylinderGeometry(r, r, 0.018, 28, 1, false);
  disk.translate(x, y, z);
  a.push(disk, key);

  const hub = new THREE.CylinderGeometry(r * 0.22, r * 0.24, 0.024, 18, 1, false);
  hub.translate(x, y + Math.sign(y) * 0.004, z);
  a.push(hub, 'carving');

  for (let i = 0; i < 8; i += 1) {
    const th = (i / 8) * Math.PI;
    const spoke = new THREE.BoxGeometry(r * 1.50, 0.020, 0.012);
    spoke.rotateY(th);
    spoke.translate(x, y + Math.sign(y) * 0.010, z);
    a.push(spoke, 'spoke');
  }
  for (let i = 0; i < 12; i += 1) {
    const th = (i / 12) * Math.PI * 2;
    const px = x + Math.cos(th) * r * 0.78;
    const pz = z + Math.sin(th) * r * 0.78;
    a.box('carving', 0.020, 0.024, 0.020, px, y + Math.sign(y) * 0.016, pz);
  }
}

function pidhaRoof(cx, cy, baseZ, w, d, levels) {
  for (let i = 0; i < levels; i += 1) {
    const inset = i * 0.045;
    a.box(i % 2 ? 'templeShade' : 'roof', w - inset, d - inset * 0.72, 0.052, cx, cy, baseZ + i * 0.055);
  }
}

function miniHorse(x, y, z, scale) {
  a.box('horse', 0.10 * scale, 0.040 * scale, 0.050 * scale, x, y, z + 0.055 * scale);
  a.box('horse', 0.040 * scale, 0.036 * scale, 0.045 * scale, x + 0.055 * scale, y, z + 0.082 * scale);
  for (const dx of [-0.030, 0.030]) {
    a.box('horse', 0.012 * scale, 0.018 * scale, 0.065 * scale, x + dx * scale, y, z + 0.024 * scale);
  }
  a.boxRotZ('horse', 0.055 * scale, 0.014 * scale, 0.018 * scale, x - 0.060 * scale, y, z + 0.090 * scale, -0.32);
}

// Chariot platform and carved plinth.
a.box('ground', 1.46, 0.94, 0.035, 0, 0, 0.0175);
const G = 0.035;
a.box('plinthShade', 1.22, 0.72, 0.090, 0, 0, G + 0.045);
a.box('plinth', 1.08, 0.62, 0.070, 0.02, 0, G + 0.125);
a.box('carving', 1.15, 0.035, 0.035, 0, -0.365, G + 0.105);
a.box('carving', 1.15, 0.035, 0.035, 0, 0.365, G + 0.105);

// Twelve symbolic chariot wheels, six visible on each long side.
for (const y of [-0.386, 0.386]) {
  for (let i = 0; i < 6; i += 1) {
    pushSideWheel(-0.47 + i * 0.188, y, G + 0.145, 0.067);
  }
}

// Main sanctuary tower: stacked square courses read as a surviving rekha deul.
for (let i = 0; i < 9; i += 1) {
  const t = i / 8;
  const w = 0.38 - t * 0.16;
  const d = 0.35 - t * 0.13;
  const h = 0.070;
  a.box(i % 2 ? 'templeShade' : 'temple', w, d, h, 0.25, 0, G + 0.18 + i * 0.070);
  if (i % 2 === 0) {
    a.box('carving', w + 0.020, 0.018, 0.018, 0.25, -d / 2 - 0.006, G + 0.207 + i * 0.070);
    a.box('carving', w + 0.020, 0.018, 0.018, 0.25, d / 2 + 0.006, G + 0.207 + i * 0.070);
  }
}
a.lathe('roof', [
  [0.095, 0.000], [0.120, 0.030], [0.105, 0.070], [0.070, 0.115],
  [0.040, 0.155], [0.014, 0.195], [0.001, 0.230],
], 0.25, 0, G + 0.800, 24);
a.cyl('finial', 0.014, 0.022, 0.090, 0.25, 0, G + 1.055, 12);

// Jagamohana / entry hall with pidha roof and dark entrance opening.
a.box('temple', 0.42, 0.46, 0.250, -0.22, 0, G + 0.255);
a.box('dark', 0.150, 0.050, 0.180, -0.43, 0, G + 0.220);
a.gable('dark', 0.150, 0.070, 0.060, -0.43, 0, G + 0.310, 'yz');
pidhaRoof(-0.22, 0, G + 0.395, 0.50, 0.54, 5);

// Dancing hall / porch in front, lower and more open.
a.box('plinth', 0.28, 0.38, 0.120, -0.52, 0, G + 0.205);
for (const y of [-0.13, -0.043, 0.043, 0.13]) {
  a.cyl('carving', 0.013, 0.016, 0.210, -0.62, y, G + 0.255, 10);
}
a.box('roof', 0.32, 0.42, 0.050, -0.52, 0, G + 0.360);
pidhaRoof(-0.52, 0, G + 0.405, 0.31, 0.40, 3);

// Seven horse cues reduced to small front silhouettes.
for (let i = 0; i < 7; i += 1) {
  miniHorse(-0.74, -0.24 + i * 0.08, G + 0.02, 0.78);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`KonarkSun: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
