// Mecca Masjid al-Haram - F3 Batch04 GLB asset.
// Zero-texture procedural miniature: broad sanctuary courtyard,
// Kaaba-like central cube, colonnaded prayer halls, minarets, and warm stone palette.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/mecca-haram.glb', import.meta.url);

const COLORS = {
  ground: 0xbfa775,
  court: 0xd8ccb0,
  courtShade: 0xb7a47d,
  wall: 0xcdbb95,
  arcade: 0xe0d2b0,
  column: 0xdfd2b7,
  dome: 0xd9c59b,
  minaret: 0xd4c29e,
  minaretShade: 0xae966c,
  kaaba: 0x241d17,
  kiswahBand: 0xb88a3b,
  shadow: 0x4b3b2a,
};

function material(key) {
  if (key === 'kiswahBand') return { metalness: 0.22, roughness: 0.50 };
  if (key === 'kaaba' || key === 'shadow') return { metalness: 0.0, roughness: 0.96 };
  return { metalness: 0.0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'MeccaHaram' });

function minaret(x, y, h = 0.92) {
  a.cyl('minaretShade', 0.058, 0.074, 0.070, x, y, 0.085, 14);
  a.cyl('minaret', 0.034, 0.046, h, x, y, 0.120 + h / 2, 16);
  a.cyl('minaretShade', 0.064, 0.067, 0.040, x, y, 0.120 + h * 0.62, 16);
  a.cyl('minaretShade', 0.052, 0.056, 0.035, x, y, 0.120 + h * 0.84, 16);
  a.coneUp('dome', 0.046, 0.155, x, y, 0.120 + h, 16);
  a.coneUp('kiswahBand', 0.010, 0.060, x, y, 0.120 + h + 0.145, 8);
}

function colonnadeSide(side) {
  const northSouth = side === 'north' || side === 'south';
  const sign = side === 'north' || side === 'east' ? 1 : -1;
  if (northSouth) {
    const y = sign * 0.59;
    a.box('wall', 1.42, 0.115, 0.150, 0, y, 0.120);
    a.box('arcade', 1.45, 0.145, 0.038, 0, y, 0.235);
    for (let i = 0; i < 13; i += 1) {
      const x = -0.62 + i * (1.24 / 12);
      a.cyl('column', 0.013, 0.017, 0.175, x, y - sign * 0.040, 0.070 + 0.0875, 10);
      if (i % 2 === 0) a.box('shadow', 0.034, 0.016, 0.070, x, y - sign * 0.061, 0.125);
    }
  } else {
    const x = sign * 0.75;
    a.box('wall', 0.115, 1.10, 0.150, x, 0, 0.120);
    a.box('arcade', 0.145, 1.12, 0.038, x, 0, 0.235);
    for (let i = 0; i < 10; i += 1) {
      const y = -0.48 + i * (0.96 / 9);
      a.cyl('column', 0.013, 0.017, 0.175, x - sign * 0.040, y, 0.070 + 0.0875, 10);
      if (i % 2 === 0) a.box('shadow', 0.016, 0.034, 0.070, x - sign * 0.061, y, 0.125);
    }
  }
}

function lowDome(x, y, r = 0.052) {
  a.cyl('dome', r * 0.88, r, 0.025, x, y, 0.270, 14);
  a.dome('dome', r, x, y, 0.282, 0.62, 18, 8);
}

// Sanctuary footprint and open courtyard.
a.box('ground', 1.68, 1.42, 0.035, 0, 0, 0.0175);
a.box('courtShade', 1.56, 1.30, 0.038, 0, 0, 0.054);
a.box('court', 1.30, 1.04, 0.018, 0, 0, 0.083);

for (const side of ['north', 'south', 'east', 'west']) colonnadeSide(side);

// Repeating roof domes on the sanctuary edges for a distant arcade rhythm.
for (const y of [-0.59, 0.59]) {
  for (let i = 0; i < 7; i += 1) lowDome(-0.54 + i * 0.18, y, 0.042);
}
for (const x of [-0.75, 0.75]) {
  for (let i = 0; i < 5; i += 1) lowDome(x, -0.38 + i * 0.19, 0.038);
}

// Kaaba-like central cube, kept schematic and respectfully simple.
a.box('kaaba', 0.205, 0.205, 0.235, 0, 0, 0.083 + 0.1175);
a.box('kiswahBand', 0.216, 0.216, 0.018, 0, 0, 0.265);
a.box('kiswahBand', 0.072, 0.012, 0.066, -0.069, -0.109, 0.156);
a.box('shadow', 0.058, 0.012, 0.088, 0.055, -0.110, 0.150);

// Mataf paving rings as subtle square/round cues around the central volume.
a.cyl('courtShade', 0.335, 0.345, 0.010, 0, 0, 0.093, 40);
a.cyl('court', 0.270, 0.278, 0.012, 0, 0, 0.101, 40);
for (let i = 0; i < 24; i += 1) {
  const th = (i / 24) * Math.PI * 2;
  a.boxRotZ('courtShade', 0.030, 0.010, 0.010, Math.cos(th) * 0.315, Math.sin(th) * 0.315, 0.112, th);
}

// Seven minaret cues around the sanctuary perimeter.
for (const [x, y, h] of [
  [-0.78, -0.64, 0.95], [0.78, -0.64, 0.95],
  [-0.78, 0.64, 0.88], [0.78, 0.64, 0.88],
  [0, -0.67, 0.82], [-0.81, 0.04, 0.80], [0.81, 0.04, 0.80],
]) minaret(x, y, h);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`MeccaHaram: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
