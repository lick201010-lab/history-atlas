// Great Wall - F3 core-10 A-grade repair.
// Goal: read as a long mountain-ridge wall system in map view, not a short fort block.

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/great-wall.glb', import.meta.url);

const COLORS = {
  ridgeLow: 0x6f5f43,
  ridgeHigh: 0x9b875f,
  wall: 0xb7a284,
  wallShade: 0x9f8a6a,
  coping: 0xc8b99a,
  walkway: 0x6f6048,
  tower: 0xb49b72,
  towerShade: 0x987f5e,
  towerCap: 0xc7b38d,
  roof: 0x655036,
  dark: 0x2a2117,
  beacon: 0xd1a24f,
};

function material() {
  return { metalness: 0.0, roughness: 0.9 };
}

const a = new WonderAsset({ name: 'GreatWall' });

function pathAt(t) {
  const x = -1.08 + 2.16 * t;
  const y =
    0.34 * Math.sin(t * Math.PI * 2.65 - 0.45) +
    0.11 * Math.sin(t * Math.PI * 6.1 + 0.8);
  const ridge =
    0.025 +
    0.105 * Math.sin(Math.PI * t) +
    0.055 * Math.max(0, Math.sin(t * Math.PI * 5.2 - 0.4)) +
    0.035 * Math.max(0, Math.sin(t * Math.PI * 9.0 + 1.2));
  return { x, y, base: Math.max(0.018, ridge) };
}

function segmentInfo(t0, t1) {
  const p = pathAt(t0);
  const q = pathAt(t1);
  const cx = (p.x + q.x) / 2;
  const cy = (p.y + q.y) / 2;
  const cz = (p.base + q.base) / 2;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  return { p, q, cx, cy, cz, len, angle };
}

function offsetPoint(x, y, angle, along, side) {
  const tx = Math.cos(angle);
  const ty = Math.sin(angle);
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  return { x: x + tx * along + nx * side, y: y + ty * along + ny * side };
}

const SEGMENTS = 42;
const WALL_H = 0.118;
const WALL_W = 0.078;
const PARAPET_H = 0.045;

for (let i = 0; i < SEGMENTS; i += 1) {
  const { cx, cy, cz, len, angle } = segmentInfo(i / SEGMENTS, (i + 1) / SEGMENTS);
  const segLen = len * 1.18;
  const ridgeKey = i % 3 === 0 ? 'ridgeHigh' : 'ridgeLow';
  const wallKey = i % 2 === 0 ? 'wall' : 'wallShade';

  a.boxRotZ(ridgeKey, segLen, 0.23, cz, cx, cy, cz / 2, angle);
  a.boxRotZ(wallKey, segLen, WALL_W, WALL_H, cx, cy, cz + WALL_H / 2, angle);
  a.boxRotZ('walkway', segLen * 0.93, WALL_W * 0.48, 0.012, cx, cy, cz + WALL_H + 0.006, angle);

  for (const side of [-1, 1]) {
    const sideOffset = side * WALL_W * 0.57;
    a.boxRotZ('coping', segLen * 0.96, 0.018, 0.025, ...Object.values(offsetPoint(cx, cy, angle, 0, sideOffset)), cz + WALL_H + 0.018, angle);

    for (const along of [-0.34, -0.12, 0.12, 0.34]) {
      if ((i + Math.round((along + 0.5) * 10)) % 3 === 0) continue;
      const m = offsetPoint(cx, cy, angle, segLen * along, sideOffset);
      a.boxRotZ('coping', segLen * 0.095, 0.026, PARAPET_H, m.x, m.y, cz + WALL_H + 0.034, angle);
    }
  }
}

const towers = [
  { t: 0.055, size: 0.135, h: 0.22, roof: true },
  { t: 0.17, size: 0.165, h: 0.285, roof: false },
  { t: 0.285, size: 0.145, h: 0.25, roof: true },
  { t: 0.405, size: 0.185, h: 0.315, roof: false, beacon: true },
  { t: 0.52, size: 0.16, h: 0.275, roof: true },
  { t: 0.635, size: 0.178, h: 0.31, roof: false },
  { t: 0.745, size: 0.142, h: 0.245, roof: true },
  { t: 0.86, size: 0.168, h: 0.295, roof: false, beacon: true },
  { t: 0.955, size: 0.132, h: 0.22, roof: true },
];

for (const tower of towers) {
  const p = pathAt(tower.t);
  const angle = segmentInfo(Math.max(0, tower.t - 0.01), Math.min(1, tower.t + 0.01)).angle;
  const s = tower.size;
  const h = tower.h;
  const z0 = p.base;

  a.boxRotZ('towerShade', s * 1.1, s * 1.1, 0.035, p.x, p.y, z0 + 0.0175, angle);
  a.boxRotZ('tower', s, s, h, p.x, p.y, z0 + h / 2, angle);
  a.boxRotZ('towerCap', s * 1.18, s * 1.18, 0.028, p.x, p.y, z0 + h + 0.014, angle);

  for (const face of [-1, 1]) {
    const w0 = offsetPoint(p.x, p.y, angle, s * 0.22, face * s * 0.52);
    const w1 = offsetPoint(p.x, p.y, angle, -s * 0.22, face * s * 0.52);
    a.boxRotZ('dark', s * 0.16, 0.018, 0.05, w0.x, w0.y, z0 + h * 0.55, angle);
    a.boxRotZ('dark', s * 0.16, 0.018, 0.05, w1.x, w1.y, z0 + h * 0.55, angle);
  }

  if (tower.roof) {
    a.hipRoof('roof', s * 1.32, s * 1.32, 0.085, s * 0.16, p.x, p.y, z0 + h + 0.028);
  } else {
    for (const side of [-1, 1]) {
      const edge = side * s * 0.48;
      for (const along of [-0.32, 0, 0.32]) {
        const c = offsetPoint(p.x, p.y, angle, along * s, edge);
        a.boxRotZ('coping', s * 0.18, 0.032, 0.045, c.x, c.y, z0 + h + 0.058, angle);
      }
    }
    for (const along of [-0.45, 0.45]) {
      const c = offsetPoint(p.x, p.y, angle, along * s, 0);
      a.boxRotZ('coping', 0.035, s * 0.18, 0.045, c.x, c.y, z0 + h + 0.058, angle);
    }
  }

  if (tower.beacon) {
    a.cyl('beacon', s * 0.13, s * 0.16, 0.045, p.x, p.y, z0 + h + 0.075, 10);
  }
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`GreatWall: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
