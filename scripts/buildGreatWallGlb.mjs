// 万里长城 —— 奇观资产样板（public/models/great-wall.glb）。
// 复用 scripts/lib/wonderKit.mjs：沿蜿蜒路径起伏翻山的城墙 —— 夯土山脊填方（贴地）+
//   砖砌墙身 + 顶部交错垛口 crenellation + 三座敌楼（楼身 + 四坡顶）。
// 坐标 z=上，足迹约 ±0.66，base 贴地。运行：node scripts/buildGreatWallGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/great-wall.glb', import.meta.url);

const COLORS = {
  earth: 0x9a8a6a,     // 夯土山脊
  brick: 0xb89a78,     // 砖墙（受光）
  brickShade: 0xa3855f,// 背光墙
  cren: 0xc6b491,      // 垛口（浅）
  tower: 0xc0a880,     // 敌楼身
  roof: 0x6f5238,      // 敌楼顶（暗瓦）
};

function material() { return { metalness: 0.0, roughness: 0.9 }; }

const a = new WonderAsset({ name: 'GreatWall' });

const NSEG = 24;
function pathAt(t) {                       // t∈[0,1] → 路径点 + 山脊基高
  const x = -0.66 + 1.32 * t;
  const y = 0.17 * Math.sin(t * Math.PI * 1.7);
  const base = 0.02 + 0.20 * Math.sin(t * Math.PI) * (0.6 + 0.4 * Math.sin(t * Math.PI * 3.3));
  return { x, y, base: Math.max(0.02, base) };
}

const towersAt = new Set([4, 12, 20]);
for (let i = 0; i < NSEG; i += 1) {
  const t0 = i / NSEG, t1 = (i + 1) / NSEG;
  const p = pathAt(t0), q = pathAt(t1);
  const cx = (p.x + q.x) / 2, cy = (p.y + q.y) / 2, cb = (p.base + q.base) / 2;
  const len = Math.hypot(q.x - p.x, q.y - p.y) * 1.18;
  const tan = Math.atan2(q.y - p.y, q.x - p.x);
  const wallH = 0.15;
  // 夯土山脊填方（z0..cb，把墙托到山脊高度，贴地无悬空）
  a.boxRotZ('earth', len, 0.16, cb, cx, cy, cb / 2, tan);
  // 砖墙身
  a.boxRotZ(i % 2 ? 'brick' : 'brickShade', len, 0.11, wallH, cx, cy, cb + wallH / 2, tan);
  // 顶部交错垛口（沿墙脊外侧）
  const merlonZ = cb + wallH + 0.018;
  for (const mf of [-0.22, 0.22]) {
    const mx = cx + Math.cos(tan) * len * mf;
    const my = cy + Math.sin(tan) * len * mf;
    a.boxRotZ('cren', len * 0.28, 0.115, 0.04, mx, my, merlonZ, tan);
  }
  // 敌楼
  if (towersAt.has(i)) {
    a.box('tower', 0.16, 0.16, 0.26, cx, cy, cb + 0.13);
    a.box('cren', 0.185, 0.185, 0.02, cx, cy, cb + 0.27);
    a.coneUp('roof', 0.145, 0.085, cx, cy, cb + 0.28, 4);   // 四坡顶
    for (const wx of [-0.05, 0.05]) a.box('roof', 0.018, 0.05, 0.05, cx + wx, cy, cb + 0.10); // 楼窗暗示（暗块）
  }
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`GreatWall: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
