// Forbidden City landmark asset.
//
// Goal for the map view: recognizable palace compound, no oversized roof slab.
// The roof surfaces are intentionally split into small hip-roof modules so the
// model reads as layered halls instead of one big blue-lit plate in the scene.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/forbidden-city.glb', import.meta.url);

const COLORS = {
  base: 0x8d5f36,
  stone: 0xc69a5a,
  stoneDark: 0x735034,
  wall: 0xa33125,
  wallDark: 0x7d271e,
  column: 0x6f241b,
  beam: 0x7a4f25,
  bracket: 0xa37a35,
  roof: 0x9a6421,
  roofDark: 0x6e4318,
  roofLight: 0xc28a32,
  dark: 0x231812,
  gold: 0xc9a14e,
};

function material(key) {
  if (key === 'gold') return { metalness: 0.35, roughness: 0.46 };
  if (key.startsWith('roof')) return { metalness: 0.08, roughness: 0.74 };
  return { metalness: 0.0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'ForbiddenCity' });

function ridge(cx, cy, z, len) {
  a.box('gold', len, 0.018, 0.018, cx, cy, z);
}

function tiledHipRoof(cx, cy, z, w, d, h, segments = 3, key = 'roof') {
  const gap = 0.012;
  const segW = (w - gap * (segments - 1)) / segments;
  const start = cx - w / 2 + segW / 2;
  for (let i = 0; i < segments; i += 1) {
    const x = start + i * (segW + gap);
    const localKey = i % 2 === 0 ? key : 'roofDark';
    a.hipRoof(localKey, segW, d, h, Math.max(segW * 0.55, 0.045), x, cy, z);
    ridge(x, cy, z + h + 0.004, Math.max(segW * 0.46, 0.045));
  }
  // Thin warm eave lines break large silhouettes; skip them on tiny service roofs.
  if (w > 0.18) {
    a.box('roofLight', w + 0.035, 0.018, 0.018, cx, cy - d / 2 - 0.006, z + 0.012);
    a.box('roofDark', w + 0.035, 0.018, 0.016, cx, cy + d / 2 + 0.006, z + 0.008);
  }
}

function palaceHall(cx, cy, w, d, bodyH, baseZ, opts = {}) {
  const roofH = opts.roofH ?? 0.10;
  const segments = opts.segments ?? 3;
  const columns = opts.columns ?? true;
  const double = opts.double ?? false;

  a.box('wall', w, d, bodyH, cx, cy, baseZ + bodyH / 2);
  if (columns) {
    const n = Math.max(3, Math.round(w / 0.12));
    a.colonnade('column', 'bracket', {
      axis: 'x',
      from: cx - w / 2 + 0.035,
      to: cx + w / 2 - 0.035,
      count: n,
      fixed: cy - d / 2 - 0.004,
      baseZ,
      h: bodyH * 0.94,
      rBot: 0.012,
      rTop: 0.010,
      capR: 0.017,
      capH: 0.014,
      baseH: 0,
      seg: 6,
    });
  }
  a.box('beam', w * 1.02, d * 1.02, 0.018, cx, cy, baseZ + bodyH + 0.010);
  for (let i = 0; i < 3; i += 1) {
    const x = cx - w * 0.25 + (w * 0.25 * i);
    a.box('bracket', 0.030, 0.020, 0.018, x, cy - d / 2 - 0.006, baseZ + bodyH + 0.030);
  }

  if (double) {
    tiledHipRoof(cx, cy, baseZ + bodyH + 0.020, w * 1.08, d * 1.06, roofH * 0.46, segments, 'roofDark');
    const upperW = w * 0.68;
    const upperD = d * 0.68;
    const upperZ = baseZ + bodyH + roofH * 0.50 + 0.045;
    a.box('wallDark', upperW, upperD, 0.045, cx, cy, upperZ + 0.022);
    a.box('beam', upperW * 1.05, upperD * 1.05, 0.014, cx, cy, upperZ + 0.052);
    tiledHipRoof(cx, cy, upperZ + 0.066, upperW * 1.16, upperD * 1.14, roofH * 0.70, Math.max(2, segments - 1), 'roof');
  } else {
    tiledHipRoof(cx, cy, baseZ + bodyH + 0.020, w * 1.10, d * 1.10, roofH, segments, 'roof');
  }
}

function cornerTower(cx, cy) {
  a.box('wallDark', 0.115, 0.115, 0.17, cx, cy, 0.125);
  tiledHipRoof(cx, cy, 0.215, 0.19, 0.19, 0.055, 2, 'roofDark');
  tiledHipRoof(cx, cy, 0.285, 0.135, 0.135, 0.050, 1, 'roof');
  a.cyl('gold', 0.008, 0.010, 0.045, cx, cy, 0.365, 8);
}

function gateHouse(cx, cy) {
  a.box('wallDark', 0.40, 0.125, 0.19, cx, cy, 0.135);
  a.box('dark', 0.095, 0.052, 0.12, cx, cy - 0.050, 0.100);
  palaceHall(cx, cy, 0.25, 0.13, 0.09, 0.245, { double: true, roofH: 0.070, segments: 3, columns: false });
  for (const sx of [-0.17, 0.17]) {
    palaceHall(cx + sx, cy, 0.10, 0.10, 0.070, 0.250, { roofH: 0.050, segments: 1, columns: false });
  }
}

// Ground and compound walls.
a.box('base', 1.22, 0.86, 0.035, 0, 0, 0.0175);
a.box('stoneDark', 1.10, 0.74, 0.018, 0, 0, 0.044);

const WX = 0.55;
const WY = 0.38;
const WH = 0.115;
a.box('wallDark', 2 * WX, 0.045, WH, 0, WY, 0.045 + WH / 2);
a.box('wallDark', 0.045, 2 * WY, WH, -WX, 0, 0.045 + WH / 2);
a.box('wallDark', 0.045, 2 * WY, WH, WX, 0, 0.045 + WH / 2);
a.box('wallDark', 0.36, 0.045, WH, -0.29, -WY, 0.045 + WH / 2);
a.box('wallDark', 0.36, 0.045, WH, 0.29, -WY, 0.045 + WH / 2);
a.box('gold', 2 * WX + 0.02, 0.040, 0.014, 0, WY, 0.166);
a.box('gold', 0.040, 2 * WY, 0.014, -WX, 0, 0.166);
a.box('gold', 0.040, 2 * WY, 0.014, WX, 0, 0.166);

for (const [cx, cy] of [[-WX, -WY], [WX, -WY], [-WX, WY], [WX, WY]]) cornerTower(cx, cy);
gateHouse(0, -WY);

// Three-level ceremonial terrace and central halls.
const MCY = -0.02;
a.box('stone', 0.70, 0.50, 0.045, 0, MCY, 0.067);
a.box('stoneDark', 0.62, 0.42, 0.040, 0, MCY, 0.110);
a.box('stone', 0.53, 0.36, 0.038, 0, MCY, 0.151);
for (let i = -4; i <= 4; i += 1) {
  if (i % 2 === 0) for (const sy of [-0.265, 0.265]) a.box('stone', 0.014, 0.014, 0.040, i * 0.065, MCY + sy, 0.190);
}
for (let s = 0; s < 3; s += 1) a.box('stone', 0.22, 0.038, 0.035, 0, MCY - 0.28 - s * 0.040, 0.165 - s * 0.035);

palaceHall(0, MCY - 0.01, 0.44, 0.29, 0.175, 0.180, {
  double: true,
  roofH: 0.120,
  segments: 4,
  columns: true,
});

palaceHall(0, 0.245, 0.30, 0.20, 0.120, 0.055, {
  double: true,
  roofH: 0.085,
  segments: 3,
  columns: true,
});

// Side corridors and smaller administrative halls.
for (const sx of [-0.39, 0.39]) {
  a.box('wall', 0.09, 0.52, 0.095, sx, MCY, 0.092);
  for (const cy of [-0.17, 0.17]) {
    tiledHipRoof(sx, cy, 0.145, 0.13, 0.18, 0.050, 1, 'roofDark');
  }
}

for (const [cx, cy] of [[-0.24, 0.17], [0.24, 0.17], [-0.23, -0.23], [0.23, -0.23]]) {
  palaceHall(cx, cy, 0.16, 0.12, 0.075, 0.055, { roofH: 0.055, segments: 2, columns: false });
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`ForbiddenCity: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
