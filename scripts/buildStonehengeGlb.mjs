// 巨石阵 Stonehenge —— 奇观资产样板（public/models/stonehenge.glb）。
// 复用 scripts/lib/wonderKit.mjs：外圈砂岩立石 + 楣石环（部分残缺）+ 内圈马蹄形三石塔
//   trilithon（更高）+ 中央祭坛石 + 低草土堆。确定性伪随机给立石轻微歪斜/大小变化 → 自然巨石感。
// 坐标 z=上，足迹约 ±0.5，base 贴地。运行：node scripts/buildStonehengeGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/stonehenge.glb', import.meta.url);

const COLORS = {
  grass: 0xb0b189,      // 草土堆
  sarsen: 0xb8b09c,     // 砂岩立石（受光）
  sarsenShade: 0xa49c87,// 背光石
  altar: 0xaaa28c,      // 祭坛石
};

function material() { return { metalness: 0.0, roughness: 0.96 }; }

const a = new WonderAsset({ name: 'Stonehenge' });
const TWO_PI = Math.PI * 2;
function rnd(i) { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); }

// 低草土堆（贴地）
a.cyl('grass', 0.50, 0.52, 0.035, 0, 0, 0.0175, 40);
const G = 0.035;

// 外圈砂岩立石环 + 楣石
const R = 0.38, N = 20, upH = 0.22;
const present = [];
for (let i = 0; i < N; i += 1) {
  const th = (i / N) * TWO_PI;
  const r = rnd(i);
  if (r < 0.28) { present.push(false); continue; }   // 残缺
  present.push(true);
  const x = R * Math.cos(th), y = R * Math.sin(th);
  const h = upH * (0.88 + 0.24 * r);
  const lean = (rnd(i + 1) - 0.5) * 0.12;             // 轻微歪斜
  a.boxRotZ(rnd(i + 2) < 0.5 ? 'sarsen' : 'sarsenShade', 0.05, 0.10, h, x, y, G + h / 2, th + lean);
}
// 楣石：相邻两根立石都在时，顶上架横楣
for (let i = 0; i < N; i += 1) {
  if (!present[i] || !present[(i + 1) % N]) continue;
  if (rnd(i + 5) < 0.25) continue;                    // 部分楣石已塌
  const mid = ((i + 0.5) / N) * TWO_PI;
  const x = R * Math.cos(mid), y = R * Math.sin(mid);
  const chord = 2 * R * Math.sin(Math.PI / N) * 1.25;
  a.boxRotZ('sarsen', 0.055, chord, 0.045, x, y, G + upH + 0.022, mid);
}

// 内圈马蹄形三石塔 trilithon（5 座，开口朝东 +x，更高）
const ir = 0.18, tH = 0.30;
const angles = [Math.PI * 0.62, Math.PI * 0.81, Math.PI, Math.PI * 1.19, Math.PI * 1.38];
for (let k = 0; k < angles.length; k += 1) {
  const th = angles[k];
  const cx = ir * Math.cos(th), cy = ir * Math.sin(th);
  const tangent = th + Math.PI / 2;
  const h = tH * (0.92 + 0.16 * rnd(k + 20));
  // 两根并列立柱
  for (const s of [-1, 1]) {
    const ox = Math.cos(tangent) * 0.05 * s, oy = Math.sin(tangent) * 0.05 * s;
    a.boxRotZ('sarsen', 0.055, 0.075, h, cx + ox, cy + oy, G + h / 2, th);
  }
  // 横楣
  a.boxRotZ('sarsenShade', 0.06, 0.17, 0.05, cx, cy, G + h + 0.025, th);
}

// 中央祭坛石
a.box('altar', 0.12, 0.05, 0.045, 0.04, 0, G + 0.0225);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Stonehenge: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
