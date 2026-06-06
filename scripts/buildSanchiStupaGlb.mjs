// Sanchi Stupa - F3 Batch03 GLB asset.
// Zero-texture procedural miniature: hemispherical dome, stone railing,
// four torana gateways, harmika, and central chhatra umbrella stack.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/sanchi-stupa.glb', import.meta.url);

const COLORS = {
  ground: 0xb99b6e,
  stone: 0xc8b58e,
  stoneShade: 0xa88f68,
  dome: 0xd2bd93,
  rail: 0xb9a27b,
  torana: 0xcbb78c,
  carving: 0x8d7555,
  harmika: 0xd8c49a,
  umbrella: 0xdcc993,
  finial: 0xb89044,
  shadow: 0x4a3829,
};

function material(key) {
  if (key === 'finial') return { metalness: 0.18, roughness: 0.52 };
  if (key === 'shadow') return { metalness: 0.0, roughness: 0.96 };
  return { metalness: 0.0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'SanchiStupa' });

function ringBoxes(key, radius, count, width, depth, height, z, every = 1) {
  for (let i = 0; i < count; i += every) {
    const th = (i / count) * Math.PI * 2;
    const x = Math.cos(th) * radius;
    const y = Math.sin(th) * radius;
    const tangent = th + Math.PI / 2;
    a.boxRotZ(key, width, depth, height, x, y, z, tangent);
  }
}

function torana(angle) {
  const r = 0.71;
  const nx = Math.cos(angle);
  const ny = Math.sin(angle);
  const tx = -Math.sin(angle);
  const ty = Math.cos(angle);
  const cx = nx * r;
  const cy = ny * r;

  for (const side of [-1, 1]) {
    const x = cx + tx * side * 0.105;
    const y = cy + ty * side * 0.105;
    a.cyl('torana', 0.022, 0.027, 0.34, x, y, 0.23, 10);
    a.cyl('carving', 0.030, 0.034, 0.028, x, y, 0.08, 10);
    a.boxRotZ('carving', 0.050, 0.026, 0.035, x, y, 0.405, angle);
  }

  for (let i = 0; i < 3; i += 1) {
    const z = 0.34 + i * 0.085;
    a.boxRotZ('torana', 0.34 + i * 0.035, 0.040, 0.038, cx, cy, z, angle + Math.PI / 2);
    a.boxRotZ('carving', 0.030, 0.044, 0.030, cx + tx * (-0.12 + i * 0.12), cy + ty * (-0.12 + i * 0.12), z + 0.035, angle);
  }

  a.boxRotZ('shadow', 0.16, 0.034, 0.16, cx - nx * 0.035, cy - ny * 0.035, 0.18, angle + Math.PI / 2);
  a.boxRotZ('stoneShade', 0.20, 0.070, 0.030, cx, cy, 0.055, angle + Math.PI / 2);
}

// Ground, circular plinth, and drum.
a.box('ground', 1.52, 1.52, 0.035, 0, 0, 0.0175);
a.cyl('stoneShade', 0.68, 0.72, 0.075, 0, 0, 0.0725, 48);
a.cyl('stone', 0.61, 0.65, 0.080, 0, 0, 0.150, 48);
a.cyl('rail', 0.57, 0.60, 0.040, 0, 0, 0.210, 48);

// Outer vedika railing: posts plus two horizontal stone rails.
ringBoxes('rail', 0.74, 48, 0.022, 0.050, 0.155, 0.155, 1);
ringBoxes('stoneShade', 0.74, 48, 0.070, 0.018, 0.022, 0.195, 2);
ringBoxes('stoneShade', 0.74, 48, 0.070, 0.018, 0.020, 0.105, 2);

// Four carved torana gateways.
for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) torana(angle);

// Hemispherical anda dome and subtle rib/carving markers.
a.dome('dome', 0.52, 0, 0, 0.205, 0.86, 48, 22);
ringBoxes('carving', 0.51, 40, 0.035, 0.012, 0.018, 0.270, 2);
ringBoxes('stoneShade', 0.38, 36, 0.045, 0.012, 0.016, 0.500, 3);

// Harmika enclosure and central yasti/chhatra.
a.box('harmika', 0.19, 0.19, 0.075, 0, 0, 0.685);
ringBoxes('carving', 0.125, 16, 0.022, 0.012, 0.052, 0.725, 1);
a.cyl('finial', 0.012, 0.016, 0.38, 0, 0, 0.905, 10);
for (let i = 0; i < 3; i += 1) {
  const r = 0.145 - i * 0.035;
  a.cyl('umbrella', r, r * 1.04, 0.026, 0, 0, 0.815 + i * 0.095, 28);
}
a.coneUp('finial', 0.024, 0.075, 0, 0, 1.060, 10);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`SanchiStupa: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
