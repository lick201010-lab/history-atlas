// Teotihuacan - F3 Batch04 GLB asset.
// Zero-texture procedural miniature: Pyramid of the Sun style stepped mass,
// Avenue of the Dead axis, plaza platforms, stair bands, and temple mounds.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/teotihuacan.glb', import.meta.url);

const COLORS = {
  ground: 0xb59667,
  plaza: 0xc7b183,
  plazaShade: 0xa9865b,
  pyramid: 0xc5a46e,
  pyramidShade: 0xa27e52,
  stair: 0xd0ba8f,
  talud: 0x8f6844,
  temple: 0xb98f5d,
  templeLight: 0xd1b47d,
  shadow: 0x4a3422,
};

function material(key) {
  if (key === 'shadow') return { metalness: 0.0, roughness: 0.96 };
  return { metalness: 0.0, roughness: 0.90 };
}

const a = new WonderAsset({ name: 'Teotihuacan' });

function stairRun(axis, sign, baseHalf, topHalf, baseZ, height, steps, width) {
  for (let i = 0; i < steps; i += 1) {
    const t = i / Math.max(1, steps - 1);
    const u = sign * (baseHalf + (topHalf - baseHalf) * t);
    const z = baseZ + height * t + 0.020;
    if (axis === 'y') {
      a.box('stair', width, 0.045, 0.032, 0, u, z);
      a.box('talud', 0.035, 0.045, 0.052, -width / 2 - 0.025, u, z + 0.005);
      a.box('talud', 0.035, 0.045, 0.052, width / 2 + 0.025, u, z + 0.005);
    } else {
      a.box('stair', 0.045, width, 0.032, u, 0, z);
      a.box('talud', 0.045, 0.035, 0.052, u, -width / 2 - 0.025, z + 0.005);
      a.box('talud', 0.045, 0.035, 0.052, u, width / 2 + 0.025, z + 0.005);
    }
  }
}

function platformTemple(x, y, half, height, levels = 4) {
  a.stepPyramid('temple', half, height, levels, x, y, 0.055, {
    bandKey: 'plazaShade',
    topHalf: half * 0.48,
    twist: Math.PI / 4,
  });
  a.box('templeLight', half * 0.65, half * 0.50, 0.070, x, y, 0.055 + height + 0.035);
  a.box('shadow', half * 0.22, half * 0.030, 0.045, x, y - half * 0.26, 0.055 + height + 0.033);
}

// Site platform, plazas, and Avenue of the Dead cue.
a.box('ground', 1.62, 1.30, 0.035, 0, 0, 0.0175);
a.box('plazaShade', 1.42, 1.10, 0.040, 0, 0, 0.055);
a.box('plaza', 0.155, 1.16, 0.020, -0.44, 0, 0.085);
for (let i = 0; i < 10; i += 1) {
  const y = -0.50 + i * (1.0 / 9);
  a.box('plazaShade', 0.185, 0.018, 0.014, -0.44, y, 0.103);
}

// Pyramid of the Sun, broad and dominant.
const G = 0.075;
a.stepPyramid('pyramid', 0.46, 0.58, 5, 0.16, 0, G, {
  bandKey: 'pyramidShade',
  topHalf: 0.145,
  twist: Math.PI / 4,
});
for (let i = 1; i <= 4; i += 1) {
  const half = 0.46 + (0.145 - 0.46) * (i / 5);
  const z = G + 0.58 * (i / 5);
  a.box('talud', half * 2.04, 0.018, 0.016, 0.16, -half, z);
  a.box('talud', half * 2.04, 0.018, 0.016, 0.16, half, z);
  a.box('talud', 0.018, half * 2.04, 0.016, 0.16 - half, 0, z);
  a.box('talud', 0.018, half * 2.04, 0.016, 0.16 + half, 0, z);
}
stairRun('y', -1, 0.46, 0.145, G, 0.58, 13, 0.165);
stairRun('y', 1, 0.46, 0.145, G, 0.58, 9, 0.120);
a.box('templeLight', 0.205, 0.170, 0.075, 0.16, 0, G + 0.58 + 0.0375);
a.box('shadow', 0.065, 0.018, 0.046, 0.16, -0.091, G + 0.58 + 0.037);

// Moon pyramid / Citadel-like supporting masses along the axis.
platformTemple(-0.44, 0.46, 0.185, 0.245, 4);
platformTemple(-0.44, -0.47, 0.150, 0.190, 3);
for (const y of [-0.30, -0.15, 0.12, 0.30]) {
  platformTemple(-0.68, y, 0.070, 0.095, 2);
  platformTemple(-0.22, y, 0.070, 0.095, 2);
}

// Plaza steps and small side platforms make the orthogonal urban plan readable.
for (const y of [-0.54, 0.54]) {
  a.box('plaza', 0.70, 0.070, 0.026, 0.16, y, 0.104);
  for (let i = 0; i < 7; i += 1) a.box('stair', 0.055, 0.030, 0.026, -0.08 + i * 0.075, y - Math.sign(y) * 0.055, 0.125);
}
for (const x of [-0.04, 0.36]) {
  for (const y of [-0.35, 0.35]) platformTemple(x, y, 0.070, 0.090, 2);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Teotihuacan: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
