// Forbidden City landmark asset — refined low-poly microcosm.
//
// Layout: rectangular red-wall compound with corner towers, clear south→north
// central axis, triple marble terrace for the three Front Halls, inner court
// halls, side galleries, and imperial garden.  All geometry via wonderKit
// primitives; zero textures; vertex-color AO only.
//
// Fixes for prior QA:
//   - Blue side artifacts: add warm eave-soffit closure under every roof overhang
//     so no open wedge bottoms catch cool scene light.
//   - Imperial-yellow roof palette replaces dull brown; distinguishable from walls.
//   - Recognisable axis progression: Meridian Gate → Gate of Supreme Harmony →
//     triple-terrace Front Halls → Inner Court → garden → north gate.
//   - Red compound wall with gold trim + 4 corner towers reads instantly as
//     Chinese walled palace, not a generic block.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/forbidden-city.glb', import.meta.url);

const C = {
  base:      0x8d5f36,  // warm earth
  stone:     0xd5c8b0,  // white marble (汉白玉)
  stoneDark: 0xb8a890,
  wall:      0xbc3a2a,  // vermillion red (朱红宫墙)
  wallDark:  0x8b2020,
  column:    0x8b1a1a,  // dark red lacquer column
  beam:      0x6b3a1f,  // wood beam
  bracket:   0xc4943a,  // dougong (斗栱)
  roof:      0xd4a017,  // imperial yellow glaze (琉璃黄)
  roofDark:  0xb8860b,  // darker yellow tile
  roofLight: 0xe8c840,  // light gold highlight
  dark:      0x1a1008,  // door / void
  gold:      0xd4a840,  // ridge trim / finial
  eave:      0x5c3010,  // warm eave shadow (closes roof underside)
};

function mat(key) {
  if (key === 'gold') return { metalness: 0.35, roughness: 0.46 };
  if (key.startsWith('roof')) return { metalness: 0.06, roughness: 0.66 };
  return { metalness: 0.0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'ForbiddenCity' });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Ridge line along the roof peak.
function ridge(cx, cy, z, len) {
  a.box('gold', len, 0.016, 0.016, cx, cy, z);
}

// Eave soffit — closes the open underside of a hip roof overhang so no
// back-face / interior wedge catches cool scene light.
function eaveSoffit(cx, cy, z, w, d) {
  a.box('eave', w + 0.01, d + 0.01, 0.010, cx, cy, z + 0.005);
}

// Tiled hip roof with ridge + eave closure.
function tiledRoof(cx, cy, z, w, d, h, segments = 3, key = 'roof') {
  const gap = 0.010;
  const segW = (w - gap * (segments - 1)) / segments;
  const start = cx - w / 2 + segW / 2;
  for (let i = 0; i < segments; i += 1) {
    const sx = start + i * (segW + gap);
    const k = i % 2 === 0 ? key : 'roofDark';
    a.hipRoof(k, segW, d, h, Math.max(segW * 0.52, 0.04), sx, cy, z);
    ridge(sx, cy, z + h + 0.004, Math.max(segW * 0.44, 0.04));
  }
  eaveSoffit(cx, cy, z, w, d);
  // Eave trim lines — skip on tiny roofs.
  if (w > 0.14) {
    a.box('roofLight', w + 0.030, 0.016, 0.016, cx, cy - d / 2 - 0.004, z + 0.014);
    a.box('roofDark',  w + 0.030, 0.016, 0.014, cx, cy + d / 2 + 0.004, z + 0.010);
  }
}

// Single-segment hip roof for small buildings.
function simpleRoof(cx, cy, z, w, d, h, key = 'roof') {
  a.hipRoof(key, w, d, h, Math.max(w * 0.52, 0.04), cx, cy, z);
  ridge(cx, cy, z + h + 0.004, Math.max(w * 0.44, 0.04));
  eaveSoffit(cx, cy, z, w, d);
}

// Pyramidal roof (ridgeLen=0 → all four slopes meet at a point).
function pyramidalRoof(cx, cy, z, w, d, h, key = 'roof') {
  a.hipRoof(key, w, d, h, 0.0, cx, cy, z);
  // Finial at apex
  a.cyl('gold', 0.006, 0.008, 0.030, cx, cy, z + h, 8);
  eaveSoffit(cx, cy, z, w, d);
}

// Standard Chinese palace hall: wall body → colonnade → beam → brackets → roof.
function hall(cx, cy, w, d, bodyH, baseZ, opts = {}) {
  const roofH = opts.roofH ?? 0.10;
  const segs = opts.segs ?? 3;
  const double = opts.double ?? false;
  const cols = opts.cols !== false;
  const pyramidal = opts.pyramidal ?? false;
  const rf = opts.roofKey ?? 'roof';

  // Wall body
  a.box('wall', w, d, bodyH, cx, cy, baseZ + bodyH / 2);

  // Colonnade on south (front, -y) face
  if (cols) {
    const n = Math.max(3, Math.round(w / 0.13));
    a.colonnade('column', 'bracket', {
      axis: 'x',
      from: cx - w / 2 + 0.030,
      to:   cx + w / 2 - 0.030,
      count: n,
      fixed: cy - d / 2 - 0.004,
      baseZ,
      h: bodyH * 0.92,
      rBot: 0.011,
      rTop: 0.009,
      capR: 0.016,
      capH: 0.012,
      baseH: 0,
      seg: 6,
    });
  }

  // Beam layer on top of walls
  a.box('beam', w * 1.02, d * 1.02, 0.016, cx, cy, baseZ + bodyH + 0.008);

  // Bracket clusters under eave (front face only)
  for (let i = 0; i < 3; i += 1) {
    const bx = cx - w * 0.25 + w * 0.25 * i;
    a.box('bracket', 0.028, 0.018, 0.016, bx, cy - d / 2 - 0.006, baseZ + bodyH + 0.026);
  }

  if (double) {
    // Lower roof
    tiledRoof(cx, cy, baseZ + bodyH + 0.020, w * 1.08, d * 1.06, roofH * 0.44, Math.max(2, segs), 'roofDark');
    // Upper body (setback)
    const uw = w * 0.66;
    const ud = d * 0.66;
    const uz = baseZ + bodyH + roofH * 0.48 + 0.040;
    a.box('wallDark', uw, ud, 0.042, cx, cy, uz + 0.021);
    a.box('beam', uw * 1.06, ud * 1.06, 0.012, cx, cy, uz + 0.048);
    // Upper roof
    if (pyramidal) {
      pyramidalRoof(cx, cy, uz + 0.060, uw * 1.18, ud * 1.18, roofH * 0.72, rf);
    } else {
      tiledRoof(cx, cy, uz + 0.060, uw * 1.18, ud * 1.18, roofH * 0.72, Math.max(2, segs - 1), rf);
    }
  } else {
    if (pyramidal) {
      pyramidalRoof(cx, cy, baseZ + bodyH + 0.020, w * 1.12, d * 1.12, roofH, rf);
    } else {
      tiledRoof(cx, cy, baseZ + bodyH + 0.020, w * 1.12, d * 1.12, roofH, segs, rf);
    }
  }
}

// Square pavilion with pyramidal roof (Central Harmony / Hall of Union type).
function squareHall(cx, cy, size, bodyH, baseZ, opts = {}) {
  const roofH = opts.roofH ?? 0.08;
  a.box('wall', size, size, bodyH, cx, cy, baseZ + bodyH / 2);
  a.box('beam', size * 1.04, size * 1.04, 0.014, cx, cy, baseZ + bodyH + 0.008);
  pyramidalRoof(cx, cy, baseZ + bodyH + 0.020, size * 1.14, size * 1.14, roofH, 'roof');
}

// Corner watchtower with multi-eave roof + finial.
function cornerTower(cx, cy, baseZ = 0.045) {
  const size = 0.10;
  const bodyH = 0.16;
  a.box('wallDark', size, size, bodyH, cx, cy, baseZ + bodyH / 2);
  tiledRoof(cx, cy, baseZ + bodyH + 0.018, size * 1.55, size * 1.55, 0.045, 2, 'roofDark');
  // Upper tier
  a.box('wallDark', size * 0.58, size * 0.58, 0.042, cx, cy, baseZ + bodyH + 0.075);
  tiledRoof(cx, cy, baseZ + bodyH + 0.118, size * 1.05, size * 1.05, 0.038, 1, 'roof');
  // Finial
  a.cyl('gold', 0.005, 0.007, 0.038, cx, cy, baseZ + bodyH + 0.168, 8);
}

// Gate building with central + side bays.
function gateBuilding(cx, cy, w, baseZ) {
  const d = 0.12;
  const bodyH = 0.085;
  a.box('wallDark', w, d, bodyH, cx, cy, baseZ + bodyH / 2);
  // Central doorway
  a.box('dark', 0.08, 0.05, bodyH * 0.60, cx, cy - 0.028, baseZ + bodyH * 0.30);
  // Roof
  tiledRoof(cx, cy, baseZ + bodyH + 0.016, w * 1.08, d * 1.10, 0.065, Math.max(2, Math.round(w / 0.15)), 'roof');
}

// Side gallery building (long narrow hall along east or west).
function sideGallery(cx, cy, w, d, baseZ) {
  const bodyH = 0.065;
  a.box('wall', w, d, bodyH, cx, cy, baseZ + bodyH / 2);
  simpleRoof(cx, cy, baseZ + bodyH + 0.014, w * 1.06, d * 1.10, 0.045, 'roofDark');
}

// ===========================================================================
// Build
// ===========================================================================

// --- Ground slab ---
a.box('base', 1.16, 1.00, 0.030, 0, 0, 0.015);

// --- Compound walls (red, with gold top trim) ---
const WX = 0.480;  // half-width (east-west)
const WY = 0.480;  // half-depth (north-south)
const WH = 0.105;  // wall height
const WT = 0.032;  // wall thickness

// South wall with gate opening
a.box('wallDark', WX * 2, WT, WH, 0, -WY, 0.040 + WH / 2);
// North wall
a.box('wallDark', WX * 2, WT, WH, 0, +WY, 0.040 + WH / 2);
// East wall
a.box('wallDark', WT, WY * 2, WH, +WX, 0, 0.040 + WH / 2);
// West wall
a.box('wallDark', WT, WY * 2, WH, -WX, 0, 0.040 + WH / 2);

// Wall top gold trim
a.box('gold', WX * 2 + 0.02, WT + 0.02, 0.012, 0, -WY, 0.040 + WH + 0.006);
a.box('gold', WX * 2 + 0.02, WT + 0.02, 0.012, 0, +WY, 0.040 + WH + 0.006);
a.box('gold', WT + 0.02, WY * 2, 0.012, +WX, 0, 0.040 + WH + 0.006);
a.box('gold', WT + 0.02, WY * 2, 0.012, -WX, 0, 0.040 + WH + 0.006);

// --- Four corner towers ---
for (const [cx, cy] of [[-WX, -WY], [+WX, -WY], [-WX, +WY], [+WX, +WY]]) {
  cornerTower(cx, cy, 0.040);
}

// --- Meridian Gate (午门) – south entrance ---
// Protruding wall section forming a U-shaped gate court
const gateY = -WY;
// Gate platform
a.box('stoneDark', 0.44, 0.16, 0.028, 0, gateY - 0.045, 0.044);
// Gate tower
gateBuilding(0, gateY - 0.030, 0.40, 0.068);
// Side wings
for (const sx of [-0.175, +0.175]) {
  a.box('wallDark', 0.10, 0.09, 0.10, sx, gateY - 0.055, 0.040 + 0.050);
  simpleRoof(sx, gateY - 0.055, 0.140, 0.14, 0.13, 0.042, 'roofDark');
}

// --- Gate of Divine Might (神武门) – north entrance ---
gateBuilding(0, +WY - 0.018, 0.32, 0.040);

// ===========================================================================
// Central axis – outer court (外朝)
// ===========================================================================

// --- Gate of Supreme Harmony (太和门) ---
gateBuilding(0, -0.240, 0.32, 0.042);

// --- Grand courtyard paving ---
a.box('stone', 0.56, 0.16, 0.012, 0, -0.160, 0.038);

// --- East & West side galleries flanking grand courtyard ---
for (const sx of [-0.36, +0.36]) {
  sideGallery(sx, -0.160, 0.08, 0.28, 0.042);
}

// --- Triple marble terrace (三层汉白玉台基) ---
// Three progressively smaller platforms create the iconic stepped base
const terraceY = 0.010;
a.box('stone', 0.64, 0.340, 0.032, 0, terraceY - 0.040, 0.048);
a.box('stoneDark', 0.56, 0.290, 0.028, 0, terraceY - 0.032, 0.078);
a.box('stone', 0.48, 0.240, 0.026, 0, terraceY - 0.024, 0.108);

// Baluster posts along terrace edges
for (let i = -5; i <= 5; i += 1) {
  if (i % 2 === 0) {
    for (const sy of [-0.22, +0.22]) {
      a.box('stone', 0.010, 0.010, 0.034, i * 0.056, terraceY + sy, 0.136);
    }
  }
}

// --- Three Front Halls (三大殿) on the triple terrace ---

// Hall of Supreme Harmony (太和殿) – largest, double-eave
hall(0, -0.010, 0.42, 0.22, 0.170, 0.138, {
  double: true,
  roofH: 0.115,
  segs: 5,
  cols: true,
});

// Hall of Central Harmony (中和殿) – square, pyramidal roof
squareHall(0, 0.065, 0.16, 0.100, 0.138);

// Hall of Preserving Harmony (保和殿) – large, double-eave
hall(0, 0.145, 0.36, 0.20, 0.155, 0.138, {
  double: true,
  roofH: 0.105,
  segs: 4,
  cols: true,
});

// ===========================================================================
// Central axis – inner court (内廷)
// ===========================================================================

// Inner court gate platform
a.box('stone', 0.40, 0.06, 0.014, 0, 0.215, 0.042);

// Palace of Heavenly Purity (乾清宫)
hall(0, 0.260, 0.30, 0.18, 0.130, 0.055, {
  double: true,
  roofH: 0.090,
  segs: 3,
  cols: true,
});

// Hall of Union (交泰殿) – small square, pyramidal
squareHall(0, 0.315, 0.12, 0.075, 0.055);

// Palace of Earthly Tranquility (坤宁宫)
hall(0, 0.370, 0.28, 0.17, 0.125, 0.055, {
  double: true,
  roofH: 0.085,
  segs: 3,
  cols: true,
});

// --- Imperial Garden (御花园) ---
// Small pavilion
squareHall(0, 0.430, 0.09, 0.060, 0.050);
// Garden tree暗示 (small green spheres)
for (const [gx, gy] of [[-0.06, 0.430], [0.06, 0.430], [-0.04, 0.450], [0.04, 0.450]]) {
  a.cyl('wallDark', 0.003, 0.004, 0.035, gx, gy, 0.058, 6);
  a.sphere('wallDark', 0.022, gx, gy, 0.098, 6);
}

// ===========================================================================
// Side halls – east & west auxiliary buildings
// ===========================================================================

// Outer court side halls (east and west of the three Front Halls)
for (const sx of [-0.38, +0.38]) {
  // Long side hall
  a.box('wall', 0.10, 0.32, 0.080, sx, terraceY, 0.082);
  tiledRoof(sx, terraceY, 0.162, 0.14, 0.38, 0.055, 2, 'roofDark');
}

// Inner court side halls
for (const sx of [-0.32, +0.32]) {
  for (const cy of [0.260, 0.315, 0.370]) {
    a.box('wall', 0.09, 0.10, 0.065, sx, cy, 0.058 + 0.032);
    simpleRoof(sx, cy, 0.123, 0.11, 0.13, 0.040, 'roofDark');
  }
}

// ===========================================================================
// Export
// ===========================================================================

const stats = await a.exportGlb(OUT, { colors: C, material: mat, weld: true });
console.log(
  `ForbiddenCity: ${stats.materials} mats, ${stats.parts} parts, ` +
  `~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ` +
  `${(stats.bytes / 1024).toFixed(1)} KB`
);
