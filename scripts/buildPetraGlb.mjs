// 佩特拉 卡兹尼神殿 Al-Khazneh —— 奇观资产样板（public/models/petra.glb）· 重建版。
// 依 Codex GLB QA：旧版像几块积木、缺「岩壁 + 雕刻立面 + 深色凹槽」识别特征。本版：
//   · 背后一整块玫瑰砂岩崖壁（左右肩 + 顶岩檐围成凿入式壁龛，崖体明显高出立面）；
//   · 正面雕刻神殿立面，强两层划分：下层 6 柱廊 + 额枋 + 断山花 + 中央深凹门洞；
//     上层中央圆亭 tholos（锥顶 + 瓮饰）+ 两翼柱与半山花；
//   · 大量深色 recessed panel（门洞/壁龛/崖体侵蚀缝）表现雕刻阴影，纯顶点色无贴图。
// 复用 wonderKit；立面朝 −x；z=上；足迹约 ±0.55；base 贴地；0 贴图。
// 运行：node scripts/buildPetraGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/petra.glb', import.meta.url);

const COLORS = {
  ground: 0xc09b66,
  rock: 0xb87a48,      // 玫瑰砂岩崖壁（受光）
  rockShade: 0x9a6236, // 背光崖面
  rockDeep: 0x4a2f1a,  // 深侵蚀缝 / 阴影
  facade: 0xdba76b,    // 雕出的立面（较亮，与崖体拉开）
  facadeShade: 0xc28f55,
  trim: 0xe6bd86,      // 额枋 / 檐口 / 山花高光
  column: 0xd6a16a,
  dark: 0x1d130b,      // 门洞 / 凹龛（最深阴影）
  gold: 0xb07d35,      // 瓮饰
};
function material() { return { metalness: 0.0, roughness: 0.93 }; }
const a = new WonderAsset({ name: 'Petra' });
const G = 0.03;

// 地面
a.box('ground', 0.92, 1.08, 0.03, 0, 0, 0.015);

// ===== 玫瑰砂岩崖壁（一整块主体 + 顶部参差峰 + 左右肩 + 顶岩檐，围成凿入壁龛）=====
a.box('rock', 0.46, 0.92, 1.00, 0.30, 0, G + 0.50);                 // 主崖体（高出立面）
a.box('rockShade', 0.40, 0.42, 0.24, 0.34, -0.12, G + 1.04);       // 参差峰
a.box('rock', 0.30, 0.30, 0.16, 0.30, 0.24, G + 1.02);
a.box('rockShade', 0.22, 0.20, 0.12, 0.40, 0.30, G + 1.12);
// 左右岩肩（前凸，框住立面两侧）
a.box('rockShade', 0.18, 0.22, 0.96, 0.03, -0.40, G + 0.48);
a.box('rock', 0.18, 0.22, 0.96, 0.03, 0.40, G + 0.48);
// 顶岩檐（盖在立面之上，形成壁龛顶）
a.box('rockShade', 0.20, 0.66, 0.16, 0.04, 0, G + 0.96);
// 崖肩竖向侵蚀缝（深色）
for (const sy of [-0.40, 0.40]) for (const gz of [-0.18, 0.02, 0.22]) {
  a.box('rockDeep', 0.02, 0.022, 0.46, -0.055, sy + gz * 0.4, G + 0.5);
}
// 立面背墙（凹嵌于壁龛内，较亮）
a.box('facade', 0.06, 0.58, 0.86, 0.07, 0, G + 0.46);

// ===== 下层（z..G+0.46）：6 柱廊 + 额枋 + 中央深门洞 + 断山花 + 台阶 =====
const X = -0.03;          // 立面前表面 x
a.box('facadeShade', 0.07, 0.60, 0.04, X + 0.02, 0, G + 0.02);      // 柱基座台
a.colonnade('column', 'trim', {
  axis: 'y', from: -0.25, to: 0.25, count: 6, fixed: X - 0.01,
  baseZ: G + 0.04, h: 0.40, rBot: 0.038, rTop: 0.032, capR: 0.05, capH: 0.032, baseH: 0.024, seg: 12,
});
// 中央深凹门洞（可读的中央暗竖槽）
a.box('dark', 0.12, 0.14, 0.32, X + 0.01, 0, G + 0.18);
a.box('rockDeep', 0.05, 0.17, 0.36, 0.07, 0, G + 0.185);           // 门内更深暗腔
// 两侧雕刻凹龛（碎影）
for (const sy of [-0.18, 0.18]) {
  a.box('dark', 0.05, 0.075, 0.22, X - 0.005, sy, G + 0.15);
  a.box('column', 0.022, 0.024, 0.12, X - 0.02, sy, G + 0.16);     // 龛中立像
}
// 下层额枋（强横向分层）
a.box('trim', 0.085, 0.64, 0.05, X + 0.005, 0, G + 0.45);
a.box('facade', 0.06, 0.58, 0.05, X + 0.02, 0, G + 0.50);
// 断山花（中央留口给上层圆亭）
for (const sy of [-0.19, 0.19]) a.gable('trim', 0.22, 0.085, 0.07, X - 0.01, sy, G + 0.50, 'yz');
// 神殿台阶
for (let s = 0; s < 4; s += 1) a.box('trim', 0.04, 0.26, 0.02, X - 0.06 - s * 0.035, 0, G + 0.012 + s * 0.02);

// ===== 上层（z UZ..）：中央圆亭 tholos + 两翼柱与半山花 =====
const UZ = G + 0.52;
a.cyl('facade', 0.12, 0.125, 0.22, X - 0.04, 0, UZ + 0.11, 16);    // 圆亭鼓身（前凸）
for (let i = 0; i < 7; i += 1) {                                   // 圆亭前半圈小柱
  const th = -Math.PI * 0.66 + (i / 6) * Math.PI * 1.32;
  a.cyl('column', 0.017, 0.019, 0.20, X - 0.04 + Math.cos(th) * 0.115, Math.sin(th) * 0.115, UZ + 0.10, 8);
}
a.coneUp('trim', 0.145, 0.135, X - 0.04, 0, UZ + 0.22, 16);        // 锥顶（识别冠）
a.cyl('gold', 0.022, 0.03, 0.055, X - 0.04, 0, UZ + 0.355, 10);    // 瓮饰座
a.sphere('gold', 0.032, X - 0.04, 0, UZ + 0.41, 10);               // 瓮
for (const sy of [-1, 1]) {                                        // 两翼（断山花外侧）
  a.box('facade', 0.05, 0.16, 0.30, X + 0.005, sy * 0.27, UZ + 0.15);
  a.colonnade('column', 'trim', {
    axis: 'y', from: sy * 0.20, to: sy * 0.32, count: 2, fixed: X - 0.02,
    baseZ: UZ + 0.02, h: 0.24, rBot: 0.02, rTop: 0.017, capR: 0.03, capH: 0.022, baseH: 0.014, seg: 8,
  });
  a.gable('trim', 0.18, 0.07, 0.06, X - 0.01, sy * 0.27, UZ + 0.30, 'xz');
  a.box('dark', 0.04, 0.06, 0.16, X - 0.01, sy * 0.27, UZ + 0.10);  // 翼上小龛暗影
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Petra: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
