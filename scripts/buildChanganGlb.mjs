// Changan - F3 Batch05A GLB draft.
// Zero-texture procedural miniature: Tang capital city wall, gate towers,
// gridded wards, central avenue, palace compound, and warm timber/earth palette.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/changan.glb', import.meta.url);

const COLORS = {
  ground: 0xa98655,
  earth: 0xb78b56,
  packed: 0xc7a775,
  wall: 0xb76c3c,
  wallDark: 0x8a452a,
  gate: 0x9c3728,
  timber: 0x6f351f,
  roof: 0xc7852c,
  roofDark: 0x8d5b27,
  palace: 0xb83a2b,
  stone: 0xd0bea0,
  shadow: 0x3d281c,
  gold: 0xd4a64a,
  garden: 0x586f45,
};

function material(key) {
  if (key === 'gold') return { metalness: 0.24, roughness: 0.50 };
  if (key === 'shadow') return { metalness: 0.0, roughness: 0.96 };
  if (key.startsWith('roof')) return { metalness: 0.04, roughness: 0.70 };
  return { metalness: 0.0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'Changan' });

function roof(x, y, z, w, d, h, key = 'roof') {
  a.hipRoof(key, w, d, h, Math.max(w * 0.46, 0.035), x, y, z);
  a.box('timber', w * 1.05, d * 1.04, 0.010, x, y, z + 0.004);
  a.box('gold', Math.max(w * 0.42, 0.035), 0.012, 0.012, x, y, z + h + 0.004);
}

function hall(x, y, w, d, baseZ, h = 0.070, roofH = 0.060, key = 'palace') {
  a.box(key, w, d, h, x, y, baseZ + h / 2);
  a.box('timber', w * 1.03, d * 1.03, 0.014, x, y, baseZ + h + 0.007);
  roof(x, y, baseZ + h + 0.016, w * 1.12, d * 1.16, roofH);
}

function gateTower(x, y, rz = 0, wide = false) {
  const w = wide ? 0.30 : 0.20;
  const d = wide ? 0.105 : 0.095;
  a.boxRotZ('gate', w, d, 0.100, x, y, 0.080, rz);
  a.boxRotZ('shadow', w * 0.24, d * 0.16, 0.070, x, y, 0.060, rz);
  a.hipRoof('roofDark', w * 1.18, d * 1.32, 0.060, Math.max(w * 0.45, 0.04), x, y, 0.150);
  a.box('gold', Math.max(w * 0.40, 0.04), 0.012, 0.012, x, y, 0.214);
}

function ward(x, y, w, d, tone = 'packed') {
  a.box(tone, w, d, 0.014, x, y, 0.044);
  a.box('wallDark', w, 0.012, 0.032, x, y - d / 2, 0.067);
  a.box('wallDark', w, 0.012, 0.032, x, y + d / 2, 0.067);
  a.box('wallDark', 0.012, d, 0.032, x - w / 2, y, 0.067);
  a.box('wallDark', 0.012, d, 0.032, x + w / 2, y, 0.067);

  const rows = d > 0.10 ? 2 : 1;
  const cols = w > 0.15 ? 2 : 1;
  for (let ix = 0; ix < cols; ix += 1) {
    for (let iy = 0; iy < rows; iy += 1) {
      const bx = x + (ix - (cols - 1) / 2) * w * 0.35;
      const by = y + (iy - (rows - 1) / 2) * d * 0.36;
      a.box('earth', w * 0.18, d * 0.18, 0.030, bx, by, 0.074);
      roof(bx, by, 0.104, w * 0.22, d * 0.22, 0.028, 'roofDark');
    }
  }
}

function marketCluster(x, y) {
  a.box('packed', 0.24, 0.20, 0.018, x, y, 0.046);
  for (let i = 0; i < 6; i += 1) {
    const bx = x - 0.085 + (i % 3) * 0.085;
    const by = y - 0.045 + Math.floor(i / 3) * 0.090;
    a.box('earth', 0.050, 0.038, 0.030, bx, by, 0.070);
    roof(bx, by, 0.100, 0.062, 0.050, 0.024, i % 2 ? 'roof' : 'roofDark');
  }
}

// Ground and outer city wall.
a.box('ground', 1.62, 1.22, 0.032, 0, 0, 0.016);
a.box('wall', 1.48, 0.045, 0.100, 0, -0.56, 0.082);
a.box('wall', 1.48, 0.045, 0.100, 0, 0.56, 0.082);
a.box('wall', 0.045, 1.12, 0.100, -0.74, 0, 0.082);
a.box('wall', 0.045, 1.12, 0.100, 0.74, 0, 0.082);
for (const y of [-0.56, 0.56]) a.box('gold', 1.50, 0.020, 0.012, 0, y, 0.138);
for (const x of [-0.74, 0.74]) a.box('gold', 0.020, 1.10, 0.012, x, 0, 0.138);

// Major gates and corner towers.
gateTower(0, -0.575, 0, true);
gateTower(0, 0.575, 0, true);
for (const x of [-0.37, 0.37]) {
  gateTower(x, -0.575, 0);
  gateTower(x, 0.575, 0);
}
for (const y of [-0.25, 0.25]) {
  gateTower(-0.755, y, Math.PI / 2);
  gateTower(0.755, y, Math.PI / 2);
}
for (const [x, y] of [[-0.74, -0.56], [0.74, -0.56], [-0.74, 0.56], [0.74, 0.56]]) {
  a.box('gate', 0.100, 0.100, 0.115, x, y, 0.090);
  a.hipRoof('roofDark', 0.145, 0.145, 0.050, 0, x, y, 0.150);
}

// Orthogonal road grid and the central朱雀 avenue.
for (const x of [-0.50, -0.25, 0.25, 0.50]) a.box('earth', 0.020, 0.99, 0.010, x, -0.02, 0.043);
for (const y of [-0.36, -0.18, 0.08, 0.29, 0.44]) a.box('earth', 1.24, 0.018, 0.010, 0, y, 0.044);
a.box('stone', 0.080, 0.96, 0.014, 0, -0.04, 0.048);
for (let i = 0; i < 10; i += 1) {
  a.box('wallDark', 0.010, 0.028, 0.020, -0.055, -0.44 + i * 0.088, 0.062);
  a.box('wallDark', 0.010, 0.028, 0.020, 0.055, -0.44 + i * 0.088, 0.062);
}

// Ward blocks: clear Tang capital checkerboard read.
for (const x of [-0.58, -0.36, 0.36, 0.58]) {
  for (const y of [-0.42, -0.25, -0.08, 0.14, 0.34]) {
    ward(x, y, 0.15, 0.105, (x + y > 0) ? 'packed' : 'earth');
  }
}
for (const x of [-0.14, 0.14]) {
  for (const y of [-0.36, -0.17, 0.28, 0.44]) ward(x, y, 0.14, 0.10, 'packed');
}

// East and West Markets.
marketCluster(-0.42, -0.01);
marketCluster(0.42, -0.01);

// Palace and imperial city in the north: raised compound with axial halls.
a.box('wallDark', 0.78, 0.030, 0.070, 0, 0.205, 0.082);
a.box('wallDark', 0.78, 0.030, 0.070, 0, 0.520, 0.082);
a.box('wallDark', 0.030, 0.315, 0.070, -0.39, 0.362, 0.082);
a.box('wallDark', 0.030, 0.315, 0.070, 0.39, 0.362, 0.082);
a.box('stone', 0.58, 0.24, 0.032, 0, 0.370, 0.066);
a.box('stone', 0.46, 0.18, 0.028, 0, 0.374, 0.096);
hall(0, 0.285, 0.34, 0.135, 0.110, 0.100, 0.082);
hall(0, 0.385, 0.28, 0.120, 0.110, 0.085, 0.070);
hall(0, 0.475, 0.24, 0.105, 0.110, 0.075, 0.060);
for (const x of [-0.27, 0.27]) {
  hall(x, 0.310, 0.130, 0.090, 0.078, 0.055, 0.045, 'gate');
  hall(x, 0.435, 0.120, 0.082, 0.078, 0.050, 0.040, 'gate');
}

// Garden / pond cues behind the palace.
for (const [x, y] of [[-0.21, 0.505], [0.22, 0.505], [-0.30, 0.250], [0.30, 0.250]]) {
  a.cyl('timber', 0.004, 0.005, 0.035, x, y, 0.070, 6);
  a.sphere('garden', 0.025, x, y, 0.104, 7);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Changan: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
