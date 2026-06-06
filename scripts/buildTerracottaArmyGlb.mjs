// Terracotta Army - F3 Batch05A GLB draft.
// Zero-texture procedural miniature: excavated Qin burial pits, rowed soldier
// cues, rammed-earth dividers, command pavilion, and clay/loess palette.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/terracotta-army.glb', import.meta.url);

const COLORS = {
  ground: 0xa6784f,
  loess: 0xc29662,
  pit: 0x7d583b,
  pitFloor: 0xb78355,
  divider: 0x8f6848,
  plank: 0x6c4930,
  clay: 0xb76b3d,
  clayDark: 0x7d422c,
  shadow: 0x3a281e,
  roof: 0x8a4d2c,
  roofDark: 0x5d3423,
  stone: 0xc9ad83,
  marker: 0xd1a35c,
};

function material(key) {
  if (key === 'shadow') return { metalness: 0.0, roughness: 0.98 };
  if (key === 'marker') return { metalness: 0.12, roughness: 0.56 };
  return { metalness: 0.0, roughness: 0.90 };
}

const a = new WonderAsset({ name: 'TerracottaArmy' });

function soldier(x, y, z, scale = 1, rot = 0) {
  // Low-poly standing figure: base, robe, head, shoulders, and rank cap.
  a.boxRotZ('clayDark', 0.030 * scale, 0.024 * scale, 0.012 * scale, x, y, z + 0.006 * scale, rot);
  a.cyl('clay', 0.014 * scale, 0.020 * scale, 0.070 * scale, x, y, z + 0.012 * scale + 0.035 * scale, 7);
  a.boxRotZ('clayDark', 0.050 * scale, 0.016 * scale, 0.012 * scale, x, y - 0.004 * scale, z + 0.076 * scale, rot);
  a.sphere('clay', 0.017 * scale, x, y, z + 0.098 * scale, 7);
  a.boxRotZ('clayDark', 0.030 * scale, 0.020 * scale, 0.010 * scale, x, y, z + 0.116 * scale, rot);
}

function horse(x, y, z, scale = 1) {
  a.box('clayDark', 0.072 * scale, 0.026 * scale, 0.035 * scale, x, y, z + 0.036 * scale);
  a.box('clayDark', 0.026 * scale, 0.020 * scale, 0.036 * scale, x + 0.045 * scale, y, z + 0.060 * scale);
  for (const sx of [-0.026, 0.026]) {
    for (const sy of [-0.007, 0.007]) {
      a.box('clay', 0.007 * scale, 0.006 * scale, 0.040 * scale, x + sx * scale, y + sy * scale, z + 0.020 * scale);
    }
  }
}

function pit(x, y, w, d, labelOffset = 0) {
  a.box('pit', w, d, 0.035, x, y, 0.048);
  a.box('pitFloor', w - 0.070, d - 0.060, 0.018, x, y, 0.076);
  a.box('loess', w + 0.030, 0.030, 0.050, x, y - d / 2, 0.095);
  a.box('loess', w + 0.030, 0.030, 0.050, x, y + d / 2, 0.095);
  a.box('loess', 0.030, d, 0.050, x - w / 2, y, 0.095);
  a.box('loess', 0.030, d, 0.050, x + w / 2, y, 0.095);

  // Rammed-earth lane dividers across the pit.
  for (let i = 1; i < 4; i += 1) {
    const yy = y - d / 2 + (d / 4) * i;
    a.box('divider', w - 0.090, 0.018, 0.036, x, yy, 0.104);
  }
  for (let i = 0; i < 7; i += 1) {
    const xx = x - w / 2 + 0.110 + i * ((w - 0.220) / 6);
    a.box('plank', 0.018, d - 0.090, 0.014, xx, y, 0.118);
  }

  // Small marker blocks break up the excavated rim and help show this as a pit.
  for (let i = 0; i < 4; i += 1) {
    a.box('marker', 0.040, 0.016, 0.024, x - w / 2 + 0.12 + i * 0.13, y + d / 2 + 0.024 + labelOffset, 0.118);
  }
}

function rowOfSoldiers(x0, y, count, spacing, z, scale = 1, stagger = 0) {
  for (let i = 0; i < count; i += 1) {
    const x = x0 + i * spacing + ((i % 2) ? stagger : 0);
    soldier(x, y, z, scale, 0);
  }
}

function commandPavilion(x, y) {
  a.box('stone', 0.24, 0.16, 0.040, x, y, 0.056);
  a.box('roofDark', 0.170, 0.105, 0.060, x, y, 0.106);
  a.hipRoof('roof', 0.230, 0.160, 0.070, 0.100, x, y, 0.150);
  a.box('shadow', 0.070, 0.012, 0.050, x, y - 0.084, 0.106);
}

// Broad loess base with three visible excavation cuts.
a.box('ground', 1.62, 1.08, 0.032, 0, 0, 0.016);
a.box('loess', 1.46, 0.92, 0.030, 0, 0, 0.047);

pit(0.00, -0.12, 1.25, 0.44);
pit(-0.12, 0.315, 0.78, 0.22, 0.010);
pit(0.38, 0.315, 0.40, 0.18, 0.010);

// Dense ranks in the main pit: silhouettes remain individual at selected zoom.
for (let r = 0; r < 5; r += 1) {
  rowOfSoldiers(-0.50, -0.285 + r * 0.082, 11, 0.100, 0.120, 0.82, r % 2 ? 0.010 : 0);
}

// Secondary pits: fewer figures and a command cluster.
for (let r = 0; r < 2; r += 1) rowOfSoldiers(-0.43, 0.260 + r * 0.078, 7, 0.095, 0.120, 0.78, 0.006);
for (let r = 0; r < 2; r += 1) rowOfSoldiers(0.25, 0.270 + r * 0.070, 4, 0.080, 0.120, 0.70, 0.004);

// Chariot/horse cues near one end of the principal pit.
for (const y of [-0.265, -0.170]) {
  horse(0.53, y, 0.122, 0.78);
  a.box('plank', 0.070, 0.035, 0.020, 0.45, y, 0.138);
}
soldier(0.42, -0.220, 0.122, 0.86);
soldier(0.42, -0.125, 0.122, 0.86);

// Viewing mound / command pavilion and cutaway stair.
commandPavilion(-0.55, 0.325);
for (let i = 0; i < 6; i += 1) {
  a.box('stone', 0.040 + i * 0.010, 0.028, 0.012, -0.70 + i * 0.040, 0.075 + i * 0.020, 0.070 + i * 0.010);
}

// Dark shadow strips under ranks make the rows read in the small map view.
for (let r = 0; r < 5; r += 1) {
  a.box('shadow', 1.02, 0.012, 0.010, 0.00, -0.285 + r * 0.082 - 0.020, 0.124);
}
for (const y of [0.240, 0.318]) a.box('shadow', 0.70, 0.010, 0.010, -0.12, y - 0.018, 0.124);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`TerracottaArmy: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
