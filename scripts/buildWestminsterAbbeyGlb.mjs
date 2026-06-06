// Westminster Abbey - F3 Batch06B GLB draft asset.
// Zero-texture procedural miniature: long Gothic abbey nave, transepts,
// twin square west towers, rhythmic pointed roofs, buttresses, and lancet windows.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/westminster-abbey.glb', import.meta.url);

const COLORS = {
  ground: 0x9f957a,
  stoneShade: 0x9f9b8c,
  stone: 0xbdb9a8,
  stoneLight: 0xd5d0bf,
  trim: 0xe1dbca,
  roof: 0x59625d,
  roofLight: 0x747c75,
  dark: 0x242620,
  gold: 0xb8954b,
};

function material(key) {
  if (key === 'gold') return { metalness: 0.28, roughness: 0.48 };
  if (key === 'dark') return { metalness: 0.0, roughness: 0.95 };
  return { metalness: 0.0, roughness: 0.87 };
}

const a = new WonderAsset({ name: 'WestminsterAbbey' });
const G = 0.040;

function pointedOpening({ x, y, z, w, h, face = 'y' }) {
  if (face === 'y') {
    a.box('dark', w, 0.024, h, x, y, z + h / 2);
    a.gable('dark', w, h * 0.34, 0.026, x, y, z + h, 'xz');
    a.gable('trim', w * 1.35, h * 0.42, 0.020, x, y, z + h - 0.004, 'xz');
  } else {
    a.box('dark', 0.026, w, h, x, y, z + h / 2);
    a.gable('dark', w, h * 0.34, 0.026, x, y, z + h, 'yz');
    a.gable('trim', w * 1.35, h * 0.42, 0.020, x, y, z + h - 0.004, 'yz');
  }
}

function sideButtress(x, side, h = 0.355) {
  const y = side * 0.294;
  a.box('stoneShade', 0.044, 0.065, h, x, y, G + h / 2);
  a.box('stoneLight', 0.030, 0.085, h * 0.50, x, y + side * 0.006, G + h * 0.70);
  a.boxRotX('stone', 0.026, 0.145, 0.022, x, side * 0.238, G + 0.320, side * 0.56);
  a.coneUp('stoneLight', 0.020, 0.070, x, y, G + h, 6);
}

function tower(cx, cy) {
  a.box('stoneShade', 0.205, 0.205, 0.055, cx, cy, G + 0.0275);
  a.box('stone', 0.175, 0.175, 0.640, cx, cy, G + 0.055 + 0.320);
  a.box('stoneLight', 0.190, 0.190, 0.034, cx, cy, G + 0.700);

  // Stacked bell openings on each visible face keep the tower square and English.
  for (const ySide of [-1, 1]) {
    pointedOpening({ x: cx, y: cy + ySide * 0.091, z: G + 0.300, w: 0.048, h: 0.165, face: 'y' });
    pointedOpening({ x: cx, y: cy + ySide * 0.091, z: G + 0.505, w: 0.042, h: 0.118, face: 'y' });
  }
  pointedOpening({ x: cx - 0.091, y: cy, z: G + 0.300, w: 0.050, h: 0.165, face: 'x' });
  pointedOpening({ x: cx - 0.091, y: cy, z: G + 0.505, w: 0.044, h: 0.118, face: 'x' });

  for (const dx of [-0.083, 0.083]) {
    for (const dy of [-0.083, 0.083]) {
      a.box('stoneShade', 0.025, 0.025, 0.665, cx + dx, cy + dy, G + 0.390);
      a.coneUp('stoneLight', 0.021, 0.105, cx + dx, cy + dy, G + 0.720, 6);
    }
  }

  for (const i of [-1, 0, 1]) {
    a.box('stoneLight', 0.034, 0.018, 0.050, cx + i * 0.054, cy - 0.096, G + 0.748);
    a.box('stoneLight', 0.018, 0.034, 0.050, cx - 0.096, cy + i * 0.054, G + 0.748);
  }
}

function roofRibs(from, to, yHalf, z) {
  const count = 9;
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const x = from + (to - from) * t;
    a.box('roofLight', 0.014, yHalf * 2, 0.014, x, 0, z);
  }
}

// Ground plinth and long English abbey footprint.
a.box('ground', 1.38, 0.70, 0.035, 0.035, 0, 0.0175);
a.box('stoneShade', 1.12, 0.315, 0.060, 0.045, 0, G + 0.030);

// Long nave and choir, intentionally lower and more elongated than Notre-Dame.
a.box('stone', 0.965, 0.235, 0.360, 0.060, 0, G + 0.060 + 0.180);
a.gable('roof', 0.270, 0.155, 1.010, 0.060, 0, G + 0.420, 'yz');
a.box('roofLight', 1.020, 0.018, 0.018, 0.060, 0, G + 0.574);
roofRibs(-0.390, 0.490, 0.138, G + 0.506);

// Low side aisles with lean-to roofs.
for (const side of [-1, 1]) {
  a.box('stoneShade', 0.945, 0.092, 0.245, 0.060, side * 0.172, G + 0.060 + 0.1225);
  a.boxRotX('roof', 0.955, 0.118, 0.020, 0.060, side * 0.177, G + 0.332, -side * 0.48);
  for (let i = 0; i < 8; i += 1) {
    const x = -0.320 + i * 0.105;
    pointedOpening({ x, y: side * 0.223, z: G + 0.115, w: 0.032, h: 0.120, face: 'y' });
  }
}

// Clerestory lancets on the upper nave walls.
for (const side of [-1, 1]) {
  for (let i = 0; i < 9; i += 1) {
    const x = -0.330 + i * 0.096;
    pointedOpening({ x, y: side * 0.128, z: G + 0.275, w: 0.030, h: 0.118, face: 'y' });
  }
}

// Exterior buttresses and small pinnacles along both sides.
for (const side of [-1, 1]) {
  for (let i = 0; i < 8; i += 1) sideButtress(-0.350 + i * 0.120, side);
}

// North-south transepts and modest crossing lantern.
a.box('stone', 0.190, 0.600, 0.350, 0.150, 0, G + 0.060 + 0.175);
a.gable('roof', 0.205, 0.135, 0.615, 0.150, 0, G + 0.410, 'xz');
a.box('roofLight', 0.018, 0.620, 0.016, 0.150, 0, G + 0.543);
for (const side of [-1, 1]) {
  pointedOpening({ x: 0.150, y: side * 0.314, z: G + 0.190, w: 0.072, h: 0.155, face: 'y' });
  a.box('stoneShade', 0.048, 0.052, 0.360, 0.060, side * 0.315, G + 0.220);
  a.box('stoneShade', 0.048, 0.052, 0.360, 0.240, side * 0.315, G + 0.220);
  a.coneUp('stoneLight', 0.020, 0.070, 0.060, side * 0.315, G + 0.400, 6);
  a.coneUp('stoneLight', 0.020, 0.070, 0.240, side * 0.315, G + 0.400, 6);
}
a.box('stoneLight', 0.170, 0.170, 0.150, 0.150, 0, G + 0.520);
a.box('stoneShade', 0.192, 0.192, 0.032, 0.150, 0, G + 0.612);
for (const dx of [-0.070, 0.070]) for (const dy of [-0.070, 0.070]) {
  a.coneUp('stoneLight', 0.017, 0.075, 0.150 + dx, dy, G + 0.628, 6);
}

// East Lady Chapel cue: smaller squared extension with dense windows.
a.box('stoneLight', 0.205, 0.185, 0.300, 0.615, 0, G + 0.060 + 0.150);
a.gable('roof', 0.205, 0.105, 0.220, 0.615, 0, G + 0.360, 'yz');
for (const side of [-1, 1]) {
  pointedOpening({ x: 0.610, y: side * 0.100, z: G + 0.150, w: 0.030, h: 0.105, face: 'y' });
  sideButtress(0.525, side, 0.285);
  sideButtress(0.690, side, 0.285);
}
pointedOpening({ x: 0.728, y: 0, z: G + 0.155, w: 0.064, h: 0.130, face: 'x' });

// Western facade with twin square towers and three recessed portals.
tower(-0.505, -0.172);
tower(-0.505, 0.172);
a.box('stoneLight', 0.095, 0.255, 0.460, -0.510, 0, G + 0.060 + 0.230);
a.box('stoneShade', 0.070, 0.302, 0.036, -0.545, 0, G + 0.410);
a.box('stoneLight', 0.070, 0.270, 0.036, -0.552, 0, G + 0.555);
for (const [y, w, h] of [[0, 0.092, 0.155], [-0.095, 0.058, 0.125], [0.095, 0.058, 0.125]]) {
  a.box('dark', 0.040, w, h, -0.565, y, G + 0.065 + h / 2);
  a.gable('dark', w, h * 0.42, 0.044, -0.566, y, G + 0.065 + h, 'yz');
  a.gable('trim', w * 1.35, h * 0.50, 0.030, -0.548, y, G + 0.060 + h, 'yz');
}
pointedOpening({ x: -0.570, y: 0, z: G + 0.305, w: 0.072, h: 0.120, face: 'x' });
for (let i = -4; i <= 4; i += 1) {
  a.box('trim', 0.026, 0.018, 0.046, -0.565, i * 0.026, G + 0.482);
}

// Small gilt crosses mark the abbey roofline without becoming tall spires.
for (const [x, y, z] of [[-0.020, 0, G + 0.595], [0.615, 0, G + 0.480]]) {
  a.box('gold', 0.012, 0.012, 0.060, x, y, z);
  a.box('gold', 0.038, 0.010, 0.010, x, y, z + 0.018);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`WestminsterAbbey: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
