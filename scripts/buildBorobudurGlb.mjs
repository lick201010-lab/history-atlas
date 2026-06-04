// 婆罗浮屠 Borobudur —— 奇观资产样板（public/models/borobudur.glb）。
// 复用 scripts/lib/wonderKit.mjs：曼陀罗五层方形台基（stepPyramid 截顶，带佛龛暗格）+
//   三层圆形台 + 同心环列钟形舍利塔 stupa + 中央大舍利塔。
// 坐标 z=上，足迹约 ±0.58，base 贴地。运行：node scripts/buildBorobudurGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/borobudur.glb', import.meta.url);

const COLORS = {
  stone: 0xb6a585,      // 安山岩台体（受光）
  stoneShade: 0xa1906f, // 层带 / 背光
  dark: 0x3f3324,       // 佛龛暗格
  bell: 0xc0b193,       // 钟形小塔
  stupa: 0xc6b896,      // 中央大塔
};

function material() { return { metalness: 0.0, roughness: 0.92 }; }

const a = new WonderAsset({ name: 'Borobudur' });

// 五层方形台基（曼陀罗）
a.stepPyramid('stone', 0.55, 0.34, 5, 0, 0, 0, { bandKey: 'stoneShade', topHalf: 0.34 });
const SQ = 0.34;                         // 方台顶 z

// 方台各层边缘佛龛（沿四边的小暗格）
for (let t = 0; t < 4; t += 1) {
  const half = 0.55 - (0.55 - 0.34) * (t / 5) - 0.03;
  const z = (SQ / 5) * (t + 0.5);
  for (let i = -3; i <= 3; i += 1) {
    const u = i * (half / 3.4);
    a.box('dark', 0.022, 0.03, 0.035, half, u, z);   // +x 边
    a.box('dark', 0.022, 0.03, 0.035, -half, u, z);  // −x 边
    a.box('dark', 0.03, 0.022, 0.035, u, half, z);   // +y 边
    a.box('dark', 0.03, 0.022, 0.035, u, -half, z);  // −y 边
  }
}

// 三层圆形台
const circ = [{ r: 0.32, z: SQ, h: 0.05 }, { r: 0.245, z: SQ + 0.06, h: 0.05 }, { r: 0.175, z: SQ + 0.12, h: 0.05 }];
for (const c of circ) a.cyl('stone', c.r - 0.01, c.r, c.h, 0, 0, c.z + c.h / 2, 40);

// 同心环列钟形舍利塔（带顶尖小座，镂空感由台面分隔表现）
function bellStupa(x, y, z, r) {
  a.cyl('bell', r * 0.85, r * 0.95, r * 0.5, x, y, z + r * 0.25, 8);          // 方/多边基座
  a.latheDome('bell', r, x, y, z + r * 0.5, 1.05, 12, { basePow: 0.8 });      // 钟身
  a.coneUp('bell', r * 0.28, r * 0.5, x, y, z + r * 1.45, 6);                 // 顶尖
}
const rings = [{ r: 0.30, z: SQ + 0.05, n: 16, br: 0.045 }, { r: 0.225, z: SQ + 0.11, n: 12, br: 0.042 }, { r: 0.155, z: SQ + 0.17, n: 8, br: 0.04 }];
for (const ring of rings) {
  for (let i = 0; i < ring.n; i += 1) {
    const th = (i / ring.n) * Math.PI * 2;
    bellStupa(ring.r * Math.cos(th), ring.r * Math.sin(th), ring.z, ring.br);
  }
}

// 中央大舍利塔
const CZ = SQ + 0.17;
a.cyl('stupa', 0.12, 0.14, 0.05, 0, 0, CZ + 0.025, 24);
a.latheDome('stupa', 0.135, 0, 0, CZ + 0.05, 1.1, 28);
a.cyl('stupa', 0.02, 0.03, 0.05, 0, 0, CZ + 0.20, 12);
a.coneUp('stupa', 0.035, 0.06, 0, 0, CZ + 0.22, 12);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Borobudur: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
