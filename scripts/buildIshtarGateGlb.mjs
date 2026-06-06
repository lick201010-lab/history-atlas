// Ishtar Gate - F3 Batch02 GLB asset.
// Zero-texture procedural miniature: blue-glazed Babylonian gate, twin towers,
// central arch, battlements, and simple relief-color animal/rosette accents.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/ishtar-gate.glb', import.meta.url);

const COLORS = {
  ground: 0xb99b68,
  blue: 0x1f66ad,
  blueShade: 0x154a83,
  blueLight: 0x3a8fd2,
  glaze: 0x61acd8,
  brick: 0x143f70,
  archDark: 0x17233e,
  ochre: 0xc18a3f,
  cream: 0xe0c58b,
  horn: 0xd7b86a,
  cap: 0x2f7fbd,
};

function material(key) {
  if (key === 'blue' || key === 'blueShade' || key === 'blueLight' || key === 'glaze' || key === 'cap') {
    return { metalness: 0.02, roughness: 0.46 };
  }
  if (key === 'archDark') return { metalness: 0.0, roughness: 0.92 };
  return { metalness: 0.0, roughness: 0.72 };
}

const a = new WonderAsset({ name: 'IshtarGate' });

function crenel(axis, from, to, fixed, z, count, key = 'blueLight') {
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const u = from + (to - from) * t;
    const x = axis === 'x' ? u : fixed;
    const y = axis === 'x' ? fixed : u;
    a.box(key, axis === 'x' ? 0.055 : 0.040, axis === 'x' ? 0.040 : 0.055, 0.070, x, y, z);
  }
}

function brickBand(y, z, width, count) {
  for (let i = 0; i < count; i += 1) {
    const x = -width / 2 + ((i + 0.5) / count) * width;
    const key = i % 2 === 0 ? 'glaze' : 'brick';
    a.box(key, 0.035, 0.018, 0.012, x, y, z);
  }
}

function reliefAnimal(x, y, z, scale, key) {
  // Small geometric bull/dragon marks: body, head, legs, tail/horn.
  a.box(key, 0.070 * scale, 0.018 * scale, 0.030 * scale, x, y, z);
  a.box(key, 0.024 * scale, 0.018 * scale, 0.024 * scale, x + 0.044 * scale, y, z + 0.010 * scale);
  for (const dx of [-0.024, 0.020]) {
    a.box(key, 0.010 * scale, 0.014 * scale, 0.032 * scale, x + dx * scale, y, z - 0.026 * scale);
  }
  a.box('horn', 0.018 * scale, 0.010 * scale, 0.010 * scale, x + 0.062 * scale, y, z + 0.030 * scale);
  a.box(key, 0.030 * scale, 0.010 * scale, 0.012 * scale, x - 0.052 * scale, y, z + 0.020 * scale);
}

function rosette(x, y, z, scale) {
  a.box('cream', 0.030 * scale, 0.012 * scale, 0.030 * scale, x, y, z);
  a.box('cream', 0.012 * scale, 0.012 * scale, 0.046 * scale, x, y, z);
  a.boxRotZ('cream', 0.012 * scale, 0.012 * scale, 0.046 * scale, x, y, z, Math.PI / 4);
  a.boxRotZ('cream', 0.012 * scale, 0.012 * scale, 0.046 * scale, x, y, z, -Math.PI / 4);
}

// Base and massive blue-glazed masonry. Front faces point toward -y.
a.box('ground', 1.28, 0.62, 0.04, 0, 0, 0.02);
const G = 0.04;
a.box('blueShade', 1.16, 0.22, 0.12, 0, 0.02, G + 0.06);

// Twin towers with thick pylons.
for (const x of [-0.38, 0.38]) {
  a.box('blue', 0.34, 0.28, 0.82, x, 0, G + 0.41);
  a.box('blueShade', 0.30, 0.055, 0.76, x, 0.145, G + 0.39);
  a.box('blueLight', 0.35, 0.035, 0.72, x, -0.155, G + 0.38);
  a.box('cap', 0.38, 0.31, 0.045, x, 0, G + 0.845);
  crenel('x', x - 0.13, x + 0.13, -0.15, G + 0.91, 4);
  crenel('x', x - 0.13, x + 0.13, 0.15, G + 0.91, 4, 'cap');
}

// Central arched passage and upper bridge mass.
a.box('blue', 0.38, 0.26, 0.72, 0, 0, G + 0.36);
a.box('archDark', 0.22, 0.305, 0.43, 0, -0.012, G + 0.235);
a.gable('archDark', 0.22, 0.12, 0.305, 0, -0.012, G + 0.45, 'xz');
a.box('blueLight', 0.42, 0.035, 0.18, 0, -0.156, G + 0.61);
a.box('cap', 0.48, 0.30, 0.045, 0, 0, G + 0.745);
crenel('x', -0.20, 0.20, -0.15, G + 0.81, 6);

// Side returns make the gate read as a pass-through structure instead of a flat billboard.
for (const sx of [-1, 1]) {
  a.box('blueShade', 0.085, 0.42, 0.48, sx * 0.58, 0.06, G + 0.28);
  a.box('cap', 0.095, 0.44, 0.040, sx * 0.58, 0.06, G + 0.54);
  crenel('y', -0.12, 0.24, sx * 0.58, G + 0.60, 5, 'blue');
}

// Glazed brick bands and relief rows on the visible front.
for (const z of [G + 0.18, G + 0.34, G + 0.50, G + 0.665]) {
  brickBand(-0.174, z, 1.05, 26);
}
for (const x of [-0.44, -0.32, 0.32, 0.44]) {
  for (const z of [G + 0.23, G + 0.39, G + 0.55]) {
    reliefAnimal(x, -0.185, z, 1.0, (x + z) % 0.2 > 0.1 ? 'ochre' : 'cream');
  }
}
for (const x of [-0.16, 0, 0.16]) {
  rosette(x, -0.186, G + 0.66, 1.0);
}

// Smaller relief accents on side returns for color continuity during oblique camera views.
for (const sx of [-1, 1]) {
  for (const y of [-0.05, 0.10, 0.22]) {
    reliefAnimal(sx * 0.625, y, G + 0.31, 0.72, 'ochre');
    rosette(sx * 0.626, y, G + 0.47, 0.72);
  }
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`IshtarGate: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
