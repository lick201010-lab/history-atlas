// Great Mosque of Djenne - F3 Batch03 GLB asset.
// Zero-texture procedural miniature: earthen Sahelian facade, three towers,
// timber toron spikes, buttresses, crenellations, and warm mud color.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/djenne-mosque.glb', import.meta.url);

const COLORS = {
  ground: 0xb88a58,
  mud: 0xc38a55,
  mudShade: 0x9b6842,
  mudLight: 0xd4a16a,
  buttress: 0xb7794b,
  timber: 0x5b3924,
  door: 0x33251c,
  cap: 0xd7a56a,
  finial: 0xe0bc79,
};

function material(key) {
  if (key === 'timber' || key === 'door') return { metalness: 0.0, roughness: 0.96 };
  return { metalness: 0.0, roughness: 0.90 };
}

const a = new WonderAsset({ name: 'DjenneMosque' });

function crenels(axis, from, to, fixed, z, count, key = 'mudLight') {
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const u = from + (to - from) * t;
    const x = axis === 'x' ? u : fixed;
    const y = axis === 'x' ? fixed : u;
    a.coneUp(key, 0.026, 0.070, x, y, z, 6);
  }
}

function toronRow(y, z, from, to, count, depth = 0.095) {
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = from + (to - from) * t;
    a.box('timber', 0.025, depth, 0.018, x, y, z);
  }
}

function facadeButtress(x, y, h, w = 0.075) {
  a.box('buttress', w, 0.075, h, x, y, 0.055 + h / 2);
  a.box('mudLight', w * 0.70, 0.090, h * 0.58, x, y - 0.018, 0.055 + h * 0.71);
}

function tower(cx, y, w, h, capH) {
  a.box('mud', w, 0.18, h, cx, y, 0.055 + h / 2);
  a.box('mudShade', w * 0.72, 0.040, h * 0.92, cx, y - 0.105, 0.055 + h * 0.50);
  a.box('mudLight', w * 1.05, 0.20, 0.045, cx, y, 0.055 + h + 0.022);
  a.coneUp('cap', w * 0.30, capH, cx, y, 0.055 + h + 0.045, 8);
  a.sphere('finial', w * 0.09, cx, y, 0.055 + h + capH + 0.090, 10);
  for (const dx of [-0.34, 0, 0.34]) {
    a.box('timber', 0.025, 0.125, 0.020, cx + dx * w, y - 0.125, 0.055 + h * 0.47);
    a.box('timber', 0.025, 0.115, 0.020, cx + dx * w, y - 0.120, 0.055 + h * 0.68);
  }
}

// Earthen platform and prayer hall mass. Front facade faces -y.
a.box('ground', 1.34, 0.92, 0.035, 0, 0, 0.0175);
const G = 0.035;
a.box('mudShade', 1.12, 0.68, 0.075, 0, 0, G + 0.0375);
a.box('mud', 1.02, 0.58, 0.360, 0, 0.02, G + 0.255);
a.box('mudLight', 1.07, 0.62, 0.045, 0, 0.02, G + 0.455);

// Three front tower masses, with the central qibla tower higher.
tower(0, -0.285, 0.180, 0.770, 0.125);
tower(-0.37, -0.285, 0.150, 0.610, 0.100);
tower(0.37, -0.285, 0.150, 0.610, 0.100);

// Engaged buttresses across the facade and side walls.
for (const x of [-0.52, -0.23, 0.23, 0.52]) facadeButtress(x, -0.31, 0.420, 0.070);
for (const x of [-0.47, 0.47]) facadeButtress(x, 0.335, 0.330, 0.060);
for (const y of [-0.16, 0.06, 0.27]) {
  a.box('buttress', 0.065, 0.080, 0.360, -0.575, y, G + 0.220);
  a.box('buttress', 0.065, 0.080, 0.360, 0.575, y, G + 0.220);
}

// Doorways and small recessed openings.
for (const [x, w, h] of [[0, 0.115, 0.230], [-0.25, 0.080, 0.170], [0.25, 0.080, 0.170]]) {
  a.box('door', w, 0.045, h, x, -0.356, G + h / 2 + 0.025);
  a.gable('door', w, 0.055, 0.048, x, -0.358, G + h + 0.025, 'xz');
}

// Timber toron rows: projecting sticks used for maintenance scaffolding.
for (const z of [G + 0.205, G + 0.335, G + 0.475, G + 0.610]) toronRow(-0.372, z, -0.53, 0.53, 13);
for (const z of [G + 0.245, G + 0.390]) {
  toronRow(-0.372, z, -0.11, 0.11, 5, 0.130);
  toronRow(-0.372, z, -0.44, -0.30, 4, 0.115);
  toronRow(-0.372, z, 0.30, 0.44, 4, 0.115);
}

// Roofline crenellations and corner finials.
crenels('x', -0.48, 0.48, -0.275, G + 0.480, 12);
crenels('x', -0.46, 0.46, 0.335, G + 0.470, 11, 'mud');
for (const x of [-0.56, 0.56]) for (const y of [-0.32, 0.34]) {
  a.coneUp('cap', 0.035, 0.095, x, y, G + 0.435, 7);
}

// Low roof vents read as the flat mud-brick roof from oblique map views.
for (const x of [-0.28, 0, 0.28]) {
  a.box('mudLight', 0.115, 0.085, 0.060, x, 0.12, G + 0.515);
  a.box('door', 0.075, 0.020, 0.035, x, 0.075, G + 0.510);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`DjenneMosque: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
