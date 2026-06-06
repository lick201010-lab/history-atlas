// Persepolis - F3 Batch01 GLB asset.
// Zero-texture procedural miniature: terrace, processional stairs,
// Gate of All Nations, Apadana column hall, relief bands, and palace slabs.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/persepolis.glb', import.meta.url);

const COLORS = {
  ground: 0xb99a68,
  terrace: 0xc8b28a,
  terraceShade: 0xa98b63,
  stair: 0xd4c3a0,
  column: 0xe1d4b8,
  capital: 0xc3a77b,
  shadow: 0x3f3324,
  palace: 0xb89561,
  relief: 0x8f714e,
  gold: 0xc49a45,
};

function material(key) {
  if (key === 'gold') return { metalness: 0.38, roughness: 0.45 };
  if (key === 'shadow') return { metalness: 0, roughness: 0.96 };
  return { metalness: 0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'Persepolis' });

function bullCapital(x, y, z, scale = 1) {
  a.box('capital', 0.18 * scale, 0.055 * scale, 0.05 * scale, x, y, z);
  a.box('capital', 0.055 * scale, 0.18 * scale, 0.05 * scale, x, y, z + 0.012 * scale);
  for (const sx of [-1, 1]) {
    a.box('capital', 0.055 * scale, 0.04 * scale, 0.035 * scale, x + sx * 0.085 * scale, y, z + 0.035 * scale);
    a.coneUp('gold', 0.014 * scale, 0.04 * scale, x + sx * 0.115 * scale, y, z + 0.045 * scale, 8);
  }
}

function stairBand(x, y, rz, count, stepW = 0.032) {
  for (let i = 0; i < count; i += 1) {
    a.boxRotZ('stair', 0.32 - i * 0.004, stepW, 0.018, x, y + i * 0.018, 0.12 + i * 0.012, rz);
  }
}

function reliefBand(x0, y, z, width, count) {
  for (let i = 0; i < count; i += 1) {
    const x = x0 + (i / Math.max(1, count - 1)) * width;
    const h = i % 3 === 0 ? 0.075 : 0.055;
    a.box('relief', 0.018, 0.012, h, x, y, z + h / 2);
  }
}

// Main terrace and substructure.
a.box('ground', 1.62, 1.06, 0.035, 0, 0, 0.0175);
a.box('terraceShade', 1.48, 0.94, 0.12, 0, 0, 0.095);
a.box('terrace', 1.38, 0.84, 0.045, 0, 0, 0.1775);

// Grand processional stairs on the western approach plus small stepped edges.
for (const y of [-0.18, 0.18]) stairBand(-0.78, y, Math.PI / 2, 8, 0.03);
for (let i = 0; i < 7; i += 1) {
  a.box('stair', 0.06, 0.64 - i * 0.035, 0.012, -0.58 + i * 0.035, 0, 0.20 + i * 0.006);
}
reliefBand(-0.42, -0.45, 0.20, 0.84, 18);
reliefBand(-0.42, 0.45, 0.20, 0.84, 18);

// Gate of All Nations: four columns, high lintel, simplified lamassu guardians.
const gateX = -0.43;
for (const x of [gateX - 0.11, gateX + 0.11]) {
  for (const y of [-0.14, 0.14]) {
    a.cyl('column', 0.022, 0.03, 0.54, x, y, 0.22 + 0.27, 14);
    bullCapital(x, y, 0.79, 0.9);
  }
}
a.box('palace', 0.34, 0.36, 0.035, gateX, 0, 0.875);
for (const y of [-0.25, 0.25]) {
  a.box('palace', 0.12, 0.08, 0.12, gateX - 0.16, y, 0.29);
  a.box('shadow', 0.045, 0.012, 0.07, gateX - 0.16, y - Math.sign(y) * 0.043, 0.30);
}

// Apadana column hall: 6x6 forest of columns with animal capitals.
const cols = 6;
const rows = 6;
const ox = 0.20;
const spanX = 0.62;
const spanY = 0.54;
for (let i = 0; i < cols; i += 1) {
  for (let j = 0; j < rows; j += 1) {
    const x = ox + (i - (cols - 1) / 2) * (spanX / (cols - 1));
    const y = (j - (rows - 1) / 2) * (spanY / (rows - 1));
    a.cyl('column', 0.014, 0.020, 0.50, x, y, 0.22 + 0.25, 12);
    a.cyl('capital', 0.030, 0.018, 0.035, x, y, 0.74, 12);
    if ((i + j) % 2 === 0) bullCapital(x, y, 0.785, 0.55);
  }
}
a.box('palace', 0.76, 0.68, 0.030, ox, 0, 0.84);

// Palace fragments and audience platforms around the main hall.
a.box('palace', 0.38, 0.20, 0.22, 0.47, -0.31, 0.33);
a.box('palace', 0.32, 0.18, 0.19, 0.48, 0.30, 0.315);
a.box('shadow', 0.18, 0.014, 0.12, 0.47, -0.415, 0.34);
a.box('shadow', 0.15, 0.014, 0.10, 0.48, 0.395, 0.32);
a.box('stair', 0.30, 0.08, 0.03, 0.47, -0.17, 0.24);
a.box('stair', 0.24, 0.07, 0.025, 0.47, -0.08, 0.265);

// Processional relief strips on the Apadana stair faces.
reliefBand(-0.06, -0.36, 0.225, 0.54, 16);
reliefBand(-0.06, 0.36, 0.225, 0.54, 16);

// Small gold finials to give distant map silhouettes a readable upper rhythm.
for (const [x, y] of [[gateX, 0], [0.02, -0.27], [0.38, 0.25]]) {
  a.coneUp('gold', 0.025, 0.075, x, y, 0.86, 10);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Persepolis: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
