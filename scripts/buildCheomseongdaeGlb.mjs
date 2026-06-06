// Cheomseongdae - F3 Batch05B GLB draft asset.
// Zero-texture procedural miniature: modest tapered Silla stone observatory,
// stacked masonry courses, square base, and dark square opening cue.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/cheomseongdae.glb', import.meta.url);

const COLORS = {
  ground: 0xa99467,
  base: 0xb7aa8e,
  baseShade: 0x8f846d,
  stone: 0xb8ae96,
  stoneLight: 0xd1c5aa,
  stoneDark: 0x827963,
  cap: 0xc6b997,
  aperture: 0x2a2520,
};

function material(key) {
  if (key === 'aperture') return { metalness: 0.0, roughness: 0.98 };
  return { metalness: 0.0, roughness: 0.91 };
}

const a = new WonderAsset({ name: 'Cheomseongdae' });

function courseRing(i, count, baseZ, h, r, thickness) {
  const z = baseZ + h * (i + 0.5);
  const key = i % 3 === 0 ? 'stoneLight' : (i % 3 === 1 ? 'stone' : 'stoneDark');
  for (let j = 0; j < count; j += 1) {
    const th = ((j + (i % 2) * 0.5) / count) * Math.PI * 2;
    const x = Math.cos(th) * r;
    const y = Math.sin(th) * r;
    a.boxRotZ(key, 0.066, thickness, h * 0.72, x, y, z, th + Math.PI / 2);
  }
}

function squareTrim(x, y, z, faceAngle) {
  a.boxRotZ('stoneLight', 0.152, 0.022, 0.022, x, y, z + 0.090, faceAngle);
  a.boxRotZ('stoneLight', 0.152, 0.022, 0.022, x, y, z - 0.090, faceAngle);
  a.boxRotZ('stoneLight', 0.024, 0.022, 0.172, x - 0.075, y, z, faceAngle);
  a.boxRotZ('stoneLight', 0.024, 0.022, 0.172, x + 0.075, y, z, faceAngle);
}

// Low square base and plinth stones.
a.box('ground', 0.78, 0.78, 0.032, 0, 0, 0.016);
a.box('baseShade', 0.52, 0.52, 0.055, 0, 0, 0.0595);
a.box('base', 0.44, 0.44, 0.055, 0, 0, 0.1145);
for (const [x, y] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
  a.box('baseShade', 0.145, 0.145, 0.035, x, y, 0.1595);
}

// Slightly tapered stacked stone tower. Kept short so it does not read as minaret.
const baseZ = 0.177;
const courses = 17;
const courseH = 0.042;
for (let i = 0; i < courses; i += 1) {
  const t = i / (courses - 1);
  const r = 0.205 - t * 0.054;
  const count = i < 4 ? 24 : 22;
  courseRing(i, count, baseZ, courseH, r, 0.034);
}

// Dark square aperture on the south face, with stone lintel/jamb trim.
const apertureZ = baseZ + courseH * 9.4;
a.box('aperture', 0.145, 0.025, 0.165, 0, -0.184, apertureZ);
squareTrim(0, -0.201, apertureZ, 0);

// Subtle rear/side shallow shadow blocks suggest irregular masonry without fake holes.
for (const [th, zMul] of [[0.70, 6.5], [2.18, 11.0], [4.30, 5.3]]) {
  const r = 0.178;
  a.boxRotZ('stoneDark', 0.050, 0.016, 0.026, Math.cos(th) * r, Math.sin(th) * r, baseZ + courseH * zMul, th + Math.PI / 2);
}

// Square-ish top cap/open observing platform.
a.cyl('cap', 0.152, 0.166, 0.035, 0, 0, baseZ + courses * courseH + 0.0175, 24, Math.PI / 24);
a.box('cap', 0.300, 0.300, 0.036, 0, 0, baseZ + courses * courseH + 0.056);
a.box('stoneDark', 0.205, 0.205, 0.020, 0, 0, baseZ + courses * courseH + 0.084);
a.box('aperture', 0.120, 0.120, 0.018, 0, 0, baseZ + courses * courseH + 0.096);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Cheomseongdae: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
