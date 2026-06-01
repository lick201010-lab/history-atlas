// Petra / Al-Khazneh landmark asset.
//
// The map-scale model should read as a facade carved into sandstone, not as a
// rectangular freestanding block. The cliff is built from staggered masses and
// shadow seams; the architectural face sits slightly forward from the rock.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/petra.glb', import.meta.url);

const COLORS = {
  ground: 0xc4a06f,
  sand: 0xc88c55,
  sandLight: 0xdfad78,
  sandDark: 0x8d5c35,
  sandDeep: 0x51351f,
  facade: 0xd99c62,
  trim: 0xe6bd86,
  column: 0xd6a16a,
  dark: 0x21160f,
  gold: 0xb07d35,
};

function material() {
  return { metalness: 0.0, roughness: 0.94 };
}

const a = new WonderAsset({ name: 'Petra' });
const G = 0.03;

a.box('ground', 0.92, 1.06, 0.03, 0, 0, 0.015);

// Irregular sandstone cliff: split masses instead of one thick slab.
a.box('sand', 0.30, 0.28, 0.86, 0.22, -0.34, G + 0.43);
a.box('sandDark', 0.36, 0.28, 0.96, 0.25, 0.34, G + 0.48);
a.box('sand', 0.28, 0.34, 0.92, 0.30, 0.00, G + 0.46);
a.box('sandDark', 0.22, 0.24, 0.42, 0.35, -0.09, G + 0.98);
a.box('sand', 0.18, 0.22, 0.35, 0.18, 0.20, G + 1.05);
a.box('sandDeep', 0.09, 0.20, 0.36, 0.05, -0.48, G + 0.20);
a.box('sandDark', 0.08, 0.18, 0.30, 0.02, 0.49, G + 0.18);

// Layer seams and eroded grooves.
for (const z of [0.24, 0.40, 0.59, 0.78]) {
  a.box('sandDeep', 0.035, 0.78, 0.014, 0.075, 0, G + z);
}
for (const [y, h] of [[-0.46, 0.55], [-0.31, 0.32], [0.33, 0.50], [0.48, 0.44]]) {
  a.box('sandDeep', 0.022, 0.018, h, 0.045, y, G + h / 2 + 0.08);
}

// Carved back plane, slightly recessed between cliff shoulders.
a.box('sandDark', 0.050, 0.58, 0.80, 0.055, 0, G + 0.43);
a.box('facade', 0.050, 0.50, 0.70, -0.015, 0, G + 0.38);

// Lower colonnade and deep central doorway.
const X = -0.075;
a.box('trim', 0.080, 0.58, 0.035, X, 0, G + 0.035);
a.colonnade('column', 'trim', {
  axis: 'y',
  from: -0.245,
  to: 0.245,
  count: 6,
  fixed: X - 0.030,
  baseZ: G + 0.040,
  h: 0.355,
  rBot: 0.026,
  rTop: 0.022,
  capR: 0.036,
  capH: 0.022,
  baseH: 0.018,
  seg: 12,
});
a.box('dark', 0.105, 0.118, 0.305, X - 0.055, 0, G + 0.185);
a.box('sandDeep', 0.034, 0.158, 0.340, X - 0.079, 0, G + 0.190);
for (let s = 0; s < 4; s += 1) {
  a.box('trim', 0.038, 0.230, 0.018, X - 0.090 - s * 0.030, 0, G + 0.015 + s * 0.018);
}

// Lower entablature and broken pediments on both sides.
a.box('trim', 0.080, 0.620, 0.050, X - 0.020, 0, G + 0.430);
a.box('facade', 0.060, 0.500, 0.050, X - 0.035, 0, G + 0.482);
for (const sy of [-0.18, 0.18]) {
  a.gable('trim', 0.210, 0.075, 0.060, X - 0.055, sy, G + 0.500, 'yz');
  a.box('dark', 0.050, 0.075, 0.160, X - 0.070, sy, G + 0.185);
}

// Upper tholos and side shrines.
const UZ = G + 0.545;
a.cyl('facade', 0.105, 0.115, 0.205, X - 0.070, 0, UZ + 0.105, 18);
for (let i = 0; i < 8; i += 1) {
  const th = -Math.PI * 0.72 + (i / 7) * Math.PI * 1.44;
  a.cyl('column', 0.015, 0.018, 0.190, X - 0.090 + Math.cos(th) * 0.105, Math.sin(th) * 0.105, UZ + 0.095, 8);
}
a.coneUp('trim', 0.125, 0.130, X - 0.070, 0, UZ + 0.205, 18);
a.cyl('gold', 0.020, 0.026, 0.055, X - 0.070, 0, UZ + 0.360, 10);
a.sphere('gold', 0.027, X - 0.070, 0, UZ + 0.415, 10);

for (const sy of [-0.255, 0.255]) {
  a.box('facade', 0.050, 0.118, 0.250, X - 0.025, sy, UZ + 0.125);
  a.colonnade('column', 'trim', {
    axis: 'y',
    from: sy - 0.045,
    to: sy + 0.045,
    count: 2,
    fixed: X - 0.070,
    baseZ: UZ,
    h: 0.235,
    rBot: 0.020,
    rTop: 0.017,
    capR: 0.028,
    capH: 0.018,
    baseH: 0.012,
    seg: 8,
  });
  a.gable('trim', 0.145, 0.055, 0.050, X - 0.070, sy, UZ + 0.280, 'yz');
}

// Small shadow cuts tie the carved facade back into the cliff.
for (const sy of [-0.30, 0.30]) a.box('sandDeep', 0.034, 0.026, 0.62, X + 0.020, sy, G + 0.34);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Petra: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
