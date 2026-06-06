// Ziggurat of Ur - F3 Batch02 GLB asset.
// Zero-texture procedural miniature: mudbrick stepped terraces, processional
// ramps/stairs, buttresses, brick courses, and a summit shrine.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/ziggurat-ur.glb', import.meta.url);

const COLORS = {
  ground: 0xb89463,
  mud: 0xb77d4b,
  mudShade: 0x93603b,
  mudLight: 0xd0a06a,
  brick: 0x7e4f32,
  stair: 0xc6935e,
  ramp: 0xaa7045,
  shrine: 0xc18a55,
  shrineShade: 0x8f5c39,
  doorway: 0x2e261d,
  cap: 0xd0b076,
};

function material(key) {
  if (key === 'cap') return { metalness: 0.0, roughness: 0.72 };
  if (key === 'doorway') return { metalness: 0.0, roughness: 0.96 };
  return { metalness: 0.0, roughness: 0.9 };
}

const a = new WonderAsset({ name: 'ZigguratUr' });

function crenel(axis, from, to, fixed, z, count, key = 'mudLight') {
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const u = from + (to - from) * t;
    const x = axis === 'x' ? u : fixed;
    const y = axis === 'x' ? fixed : u;
    a.box(key, axis === 'x' ? 0.035 : 0.045, axis === 'x' ? 0.045 : 0.035, 0.045, x, y, z);
  }
}

function brickCourse(axis, from, to, fixed, z, count) {
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const u = from + (to - from) * t;
    const stagger = i % 2 === 0 ? 0.005 : -0.005;
    const x = axis === 'x' ? u : fixed + stagger;
    const y = axis === 'x' ? fixed + stagger : u;
    a.box('brick', axis === 'x' ? 0.035 : 0.012, axis === 'x' ? 0.012 : 0.035, 0.014, x, y, z);
  }
}

function stairRun(x0, x1, y, z0, z1, count, width) {
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    a.box('stair', Math.abs(x1 - x0) / count + 0.01, width, 0.025, x, y, z);
  }
}

// Ground and stepped baked-brick massing. All bases sit at z >= 0.
a.box('ground', 1.52, 1.12, 0.04, 0, 0, 0.02);
const G = 0.04;
a.box('mudShade', 1.34, 0.92, 0.20, 0, 0, G + 0.10);
a.box('mud', 1.18, 0.78, 0.17, 0.03, 0, G + 0.285);
a.box('mudShade', 0.86, 0.56, 0.16, 0.09, 0, G + 0.45);
a.box('mud', 0.56, 0.36, 0.14, 0.13, 0, G + 0.60);

// Thin shadow seams emphasize the terraced profile at map scale.
for (const [w, d, z] of [
  [1.36, 0.94, G + 0.205],
  [1.20, 0.80, G + 0.375],
  [0.88, 0.58, G + 0.535],
  [0.58, 0.38, G + 0.675],
]) {
  a.box('brick', w, 0.018, 0.018, 0, -d / 2, z);
  a.box('brick', w, 0.018, 0.018, 0, d / 2, z);
  a.box('brick', 0.018, d, 0.018, -w / 2, 0, z);
  a.box('brick', 0.018, d, 0.018, w / 2, 0, z);
}

// Tripartite approach: central broad stair plus two angled side ramps.
stairRun(-0.78, -0.18, 0, G + 0.035, G + 0.34, 16, 0.18);
for (const y of [-0.18, 0.18]) {
  for (let i = 0; i < 12; i += 1) {
    const t = (i + 0.5) / 12;
    const x = -0.72 + 0.52 * t;
    const z = G + 0.05 + 0.24 * t;
    const drift = y + (y > 0 ? -0.11 : 0.11) * t;
    a.boxRotZ('ramp', 0.075, 0.12, 0.025, x, drift, z, y > 0 ? -0.22 : 0.22);
  }
}
a.box('ramp', 0.20, 0.08, 0.045, -0.13, 0, G + 0.36);
stairRun(-0.14, 0.18, 0, G + 0.39, G + 0.58, 9, 0.13);

// Buttresses and exposed baked-brick courses on the long walls.
for (const x of [-0.54, -0.28, 0.0, 0.28, 0.54]) {
  a.box('mudLight', 0.055, 0.055, 0.19, x, -0.485, G + 0.12);
  a.box('mudShade', 0.055, 0.055, 0.19, x, 0.485, G + 0.12);
}
for (const y of [-0.34, -0.12, 0.12, 0.34]) {
  a.box('mudShade', 0.050, 0.050, 0.16, -0.69, y, G + 0.11);
  a.box('mudLight', 0.050, 0.050, 0.16, 0.69, y, G + 0.11);
}
for (const z of [G + 0.09, G + 0.145, G + 0.30, G + 0.465]) {
  brickCourse('x', -0.58, 0.62, -0.47, z, 24);
  brickCourse('x', -0.58, 0.62, 0.47, z, 24);
}

// Parapets and summit shrine dedicated to Nanna.
crenel('x', -0.58, 0.64, -0.44, G + 0.235, 15);
crenel('x', -0.58, 0.64, 0.44, G + 0.235, 15);
crenel('x', -0.32, 0.50, -0.29, G + 0.555, 11, 'mud');
crenel('x', -0.32, 0.50, 0.29, G + 0.555, 11, 'mud');
a.box('shrineShade', 0.36, 0.24, 0.20, 0.15, 0, G + 0.78);
a.box('shrine', 0.30, 0.20, 0.19, 0.14, 0, G + 0.815);
a.box('doorway', 0.040, 0.105, 0.12, -0.012, 0, G + 0.78);
a.box('cap', 0.36, 0.24, 0.035, 0.14, 0, G + 0.925);
for (const y of [-0.075, 0.075]) {
  a.box('cap', 0.035, 0.030, 0.12, 0.00, y, G + 0.83);
  a.box('cap', 0.035, 0.030, 0.12, 0.28, y, G + 0.83);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`ZigguratUr: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
