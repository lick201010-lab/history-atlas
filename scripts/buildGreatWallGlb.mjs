// 万里长城 —— 奇观资产样板（public/models/great-wall.glb）· 重建版。
// 依 Codex GLB QA：旧版像个小堡垒块、读不出「墙」。本版重做成沿地形横向延展的长城段：
//   · 蛇形/折线墙体，x 跨 ±1.0 → 地图视角一眼是「墙线」而非单点；
//   · 夯土山脊填方（贴地）随起伏翻山；
//   · 墙顶规则垛口（merlon + 缺口）→ 齿形轮廓；
//   · 5 座敌楼/烽火台沿墙分布（方身 + 雉堞顶 + 窗），其中两座带四坡顶；
//   · 暖灰砖 / 土黄夯土，纯顶点色无贴图。
// 复用 wonderKit；z=上；横向足迹 ~±1.0（审计 footprint<1.2 不告警）；base 贴地。
// 运行：node scripts/buildGreatWallGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/great-wall.glb', import.meta.url);

const COLORS = {
  earth: 0x9c8a63,     // 夯土山脊（土黄）
  brick: 0xb7a587,     // 砖墙（暖灰，受光）
  brickShade: 0xa08d6d,// 背光墙
  cren: 0xc4b597,      // 垛口（浅）
  tower: 0xb49c75,     // 敌楼身
  towerCap: 0xc4b597,  // 敌楼雉堞
  roof: 0x6e5a3e,      // 敌楼四坡顶（暗）
  dark: 0x2c2317,      // 窗洞 / 门洞
};
function material() { return { metalness: 0.0, roughness: 0.9 }; }

const a = new WonderAsset({ name: 'GreatWall' });
const TWO_PI = Math.PI * 2;

// 路径：x 横向延展，y 蛇形摆动，base 随山丘起伏（贴地）
function pathAt(t) {
  const x = -1.00 + 2.00 * t;
  const y = 0.22 * Math.sin(t * Math.PI * 2.3) + 0.06 * Math.sin(t * Math.PI * 5.1);
  const base = 0.03 + 0.15 * Math.sin(t * Math.PI) + 0.07 * Math.max(0, Math.sin(t * Math.PI * 2.7 + 0.4));
  return { x, y, base: Math.max(0.03, base) };
}

const NSEG = 30;
const WALL_H = 0.15;
for (let i = 0; i < NSEG; i += 1) {
  const t0 = i / NSEG, t1 = (i + 1) / NSEG;
  const p = pathAt(t0), q = pathAt(t1);
  const cx = (p.x + q.x) / 2, cy = (p.y + q.y) / 2, cb = (p.base + q.base) / 2;
  const len = Math.hypot(q.x - p.x, q.y - p.y) * 1.16;
  const tan = Math.atan2(q.y - p.y, q.x - p.x);
  // 夯土山脊填方（z0..cb，托墙贴地、随地形起伏）
  a.boxRotZ('earth', len, 0.135, cb, cx, cy, cb / 2, tan);
  // 砖墙身
  a.boxRotZ(i % 2 ? 'brick' : 'brickShade', len, 0.10, WALL_H, cx, cy, cb + WALL_H / 2, tan);
  // 墙顶规则垛口：每段放 2 个 merlon（留缺口 → 齿形）
  for (const off of [-0.26, 0.26]) {
    const mx = cx + Math.cos(tan) * len * off;
    const my = cy + Math.sin(tan) * len * off;
    a.boxRotZ('cren', len * 0.34, 0.105, 0.045, mx, my, cb + WALL_H + 0.0225, tan);
  }
}

// 敌楼 / 烽火台（沿墙 5 座；roofed 标记的两座带四坡顶）
const towers = [
  { t: 0.10, roofed: true }, { t: 0.30, roofed: false }, { t: 0.52, roofed: true },
  { t: 0.72, roofed: false }, { t: 0.90, roofed: false },
];
for (const { t, roofed } of towers) {
  const p = pathAt(t);
  const z0 = p.base;
  const H = roofed ? 0.26 : 0.30;
  a.box('tower', 0.16, 0.16, H, p.x, p.y, z0 + H / 2);
  // 窗洞
  for (const sx of [-0.045, 0.045]) a.box('dark', 0.02, 0.05, 0.05, p.x + sx, p.y - 0.082, z0 + H * 0.55);
  if (roofed) {
    a.box('towerCap', 0.185, 0.185, 0.02, p.x, p.y, z0 + H + 0.01);
    a.coneUp('roof', 0.15, 0.085, p.x, p.y, z0 + H + 0.02, 4);     // 四坡顶
  } else {
    // 烽火台：方台 + 一圈雉堞
    a.box('towerCap', 0.185, 0.185, 0.022, p.x, p.y, z0 + H + 0.011);
    for (let k = 0; k < 4; k += 1) {
      const ang = k * Math.PI / 2;
      const ex = Math.cos(ang) * 0.075, ey = Math.sin(ang) * 0.075;
      a.box('cren', 0.05, 0.05, 0.04, p.x + ex, p.y + ey, z0 + H + 0.04);
    }
    for (const c of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) {
      a.box('cren', 0.045, 0.045, 0.04, p.x + c[0], p.y + c[1], z0 + H + 0.04);
    }
  }
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`GreatWall: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
