// Temple of Heaven - F3 Batch05B GLB draft asset.
// Zero-texture procedural miniature: round marble terraces, red column rings,
// triple blue-tiled circular roofs, axial stair cues, and gold finial.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/temple-of-heaven.glb', import.meta.url);

const COLORS = {
  ground: 0xb9a978,
  marbleShade: 0xb8b2a2,
  marble: 0xe2ded2,
  marbleLight: 0xf2eee2,
  stair: 0xd6d0c0,
  red: 0xa33b28,
  redDark: 0x72281f,
  gold: 0xc7983c,
  blueRoof: 0x235b86,
  blueRoofLight: 0x3c82af,
  eave: 0x163c5c,
  shadow: 0x33241d,
};

function material(key) {
  if (key === 'gold') return { metalness: 0.25, roughness: 0.48 };
  if (key === 'shadow') return { metalness: 0.0, roughness: 0.96 };
  return { metalness: 0.0, roughness: 0.86 };
}

const a = new WonderAsset({ name: 'TempleOfHeaven' });

function ringPosts(key, radius, count, z, h, r = 0.017, every = 1) {
  for (let i = 0; i < count; i += every) {
    const th = (i / count) * Math.PI * 2;
    a.cyl(key, r * 0.88, r, h, Math.cos(th) * radius, Math.sin(th) * radius, z + h / 2, 10);
  }
}

function railRing(radius, count, z, key = 'marbleLight') {
  for (let i = 0; i < count; i += 1) {
    const th = (i / count) * Math.PI * 2;
    const x = Math.cos(th) * radius;
    const y = Math.sin(th) * radius;
    a.boxRotZ(key, 0.045, 0.014, 0.034, x, y, z, th + Math.PI / 2);
  }
}

function stair(angle, r0, r1, z, width) {
  const nx = Math.cos(angle);
  const ny = Math.sin(angle);
  const tx = -Math.sin(angle);
  const ty = Math.cos(angle);
  const mid = (r0 + r1) / 2;
  const len = r1 - r0;
  for (let i = 0; i < 4; i += 1) {
    const stepR = mid + (i - 1.5) * len * 0.16;
    const x = nx * stepR;
    const y = ny * stepR;
    a.boxRotZ('stair', len * 0.30, width - i * 0.010, 0.018, x, y, z + i * 0.010, angle);
    a.boxRotZ('marbleLight', 0.020, width + 0.020, 0.024, x + tx * (width * 0.55), y + ty * (width * 0.55), z + i * 0.010, angle);
    a.boxRotZ('marbleLight', 0.020, width + 0.020, 0.024, x - tx * (width * 0.55), y - ty * (width * 0.55), z + i * 0.010, angle);
  }
}

function roofTier(baseZ, radius, h, key = 'blueRoof') {
  a.lathe(key, [
    [radius * 0.98, 0.000],
    [radius * 1.05, 0.030],
    [radius * 0.82, h * 0.36],
    [radius * 0.45, h * 0.74],
    [radius * 0.080, h],
    [0.001, h * 1.02],
  ], 0, 0, baseZ, 48);
  a.cyl('eave', radius * 1.06, radius * 1.09, 0.022, 0, 0, baseZ + 0.016, 48);
  for (let i = 0; i < 24; i += 1) {
    const th = (i / 24) * Math.PI * 2;
    const rr = radius * 0.72;
    a.boxRotZ('blueRoofLight', radius * 0.28, 0.010, 0.014, Math.cos(th) * rr, Math.sin(th) * rr, baseZ + h * 0.39, th);
  }
}

// Circular altar terrace footprint.
a.box('ground', 1.54, 1.54, 0.030, 0, 0, 0.015);
a.cyl('marbleShade', 0.70, 0.75, 0.060, 0, 0, 0.060, 64);
a.cyl('marble', 0.60, 0.65, 0.060, 0, 0, 0.120, 64);
a.cyl('marbleLight', 0.49, 0.54, 0.055, 0, 0, 0.1775, 64);
for (const r of [0.72, 0.62, 0.515]) railRing(r, 48, 0.205);
for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) stair(angle, 0.50, 0.80, 0.035, 0.18);

// Hall body: round red structure, dark door, and column rings.
a.cyl('redDark', 0.325, 0.345, 0.315, 0, 0, 0.3625, 48);
a.cyl('red', 0.285, 0.305, 0.345, 0, 0, 0.3975, 48);
ringPosts('gold', 0.345, 24, 0.215, 0.350, 0.012);
ringPosts('red', 0.395, 24, 0.205, 0.405, 0.016);
a.box('shadow', 0.018, 0.110, 0.170, 0, -0.347, 0.315);
a.box('gold', 0.026, 0.122, 0.022, 0, -0.352, 0.420);

// Three roof tiers, explicitly circular rather than pagoda-like.
roofTier(0.600, 0.460, 0.195);
a.cyl('red', 0.210, 0.230, 0.125, 0, 0, 0.7525, 40);
ringPosts('red', 0.260, 18, 0.645, 0.205, 0.012);
roofTier(0.845, 0.330, 0.155);
a.cyl('red', 0.120, 0.140, 0.095, 0, 0, 0.990, 32);
ringPosts('gold', 0.165, 16, 0.895, 0.160, 0.009);
roofTier(1.055, 0.220, 0.125);
a.cyl('gold', 0.026, 0.040, 0.075, 0, 0, 1.210, 18);
a.coneUp('gold', 0.034, 0.100, 0, 0, 1.247, 18);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`TempleOfHeaven: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
