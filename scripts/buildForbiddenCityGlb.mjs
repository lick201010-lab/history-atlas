// 紫禁城 太和殿 —— 奇观资产样板（public/models/forbidden-city.glb）· 精修版（对齐圣索菲亚细节档）。
// 复用 scripts/lib/wonderKit.mjs：三层汉白玉须弥座（栏杆 + 御路台阶）+ 朱红殿身 + 周匝檐柱 +
//   斗栱带 + 门窗棂格 + 重檐庑殿顶（hipRoof，金瓦 + 正脊鸱吻 + 檐口走兽）。
// 坐标 z=上，足迹约 ±0.6，base 贴地。运行：node scripts/buildForbiddenCityGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/forbidden-city.glb', import.meta.url);

const COLORS = {
  base: 0xcabd9c, terrace: 0xe8e0cf, terraceShade: 0xd2c8b0, rail: 0xeae3d2,
  wall: 0xa83f37, column: 0x9c322b, beam: 0x3f5e54, dougong: 0x386b8a,
  roof: 0xc1973f, roofShade: 0xa67f33, dark: 0x2e2620, gold: 0xc9a14e,
};
function material(key) {
  if (key === 'gold') return { metalness: 0.45, roughness: 0.42 };
  if (key === 'roof' || key === 'roofShade') return { metalness: 0.25, roughness: 0.55 };
  return { metalness: 0.0, roughness: 0.85 };
}
const a = new WonderAsset({ name: 'ForbiddenCity' });

// 广场 + 三层须弥座
a.box('base', 1.30, 1.00, 0.04, 0, 0, 0.02);
a.box('terrace', 1.10, 0.80, 0.08, 0, 0, 0.08);
a.box('terraceShade', 0.98, 0.70, 0.07, 0, 0, 0.155);
a.box('terrace', 0.88, 0.62, 0.07, 0, 0, 0.225);
const T = 0.26;

// 须弥座栏杆（望柱 + 寻杖栏板，环台顶一圈）
for (let i = -4; i <= 4; i += 1) {
  for (const y of [-0.31, 0.31]) a.box('rail', 0.02, 0.02, 0.06, i * 0.105, y, T + 0.03);
}
for (let i = -2; i <= 2; i += 1) {
  for (const x of [-0.43, 0.43]) a.box('rail', 0.02, 0.02, 0.06, x, i * 0.12, T + 0.03);
}
for (const y of [-0.31, 0.31]) a.box('rail', 0.86, 0.012, 0.012, 0, y, T + 0.052);
for (const x of [-0.43, 0.43]) a.box('rail', 0.012, 0.60, 0.012, x, 0, T + 0.052);
// 御路台阶（前中）
for (let s = 0; s < 4; s += 1) a.box('terrace', 0.34, 0.05, 0.06, 0, -0.40 - s * 0.045, T - 0.02 - s * 0.055);
a.box('terraceShade', 0.12, 0.24, 0.02, 0, -0.46, T - 0.10);     // 御路石

// 殿身（朱红）
a.box('wall', 0.78, 0.50, 0.24, 0, 0, T + 0.12);
// 周匝檐柱
const cOpt = { h: 0.24, rBot: 0.021, rTop: 0.019, capR: 0, baseH: 0.018, seg: 10 };
a.colonnade('column', 'column', { ...cOpt, axis: 'x', from: -0.34, to: 0.34, count: 8, fixed: -0.27, baseZ: T });
a.colonnade('column', 'column', { ...cOpt, axis: 'x', from: -0.34, to: 0.34, count: 8, fixed: 0.27, baseZ: T });
a.colonnade('column', 'column', { ...cOpt, axis: 'y', from: -0.18, to: 0.18, count: 4, fixed: -0.38, baseZ: T });
a.colonnade('column', 'column', { ...cOpt, axis: 'y', from: -0.18, to: 0.18, count: 4, fixed: 0.38, baseZ: T });
// 门窗棂格（南面）
for (const dx of [-0.27, -0.09, 0.09, 0.27]) {
  a.box('dark', 0.12, 0.02, 0.20, dx, -0.255, T + 0.11);
  for (const lx of [-0.04, 0, 0.04]) a.box('column', 0.012, 0.022, 0.20, dx + lx, -0.248, T + 0.11);
}
// 额枋（彩画）+ 斗栱带
a.box('beam', 0.84, 0.56, 0.035, 0, 0, T + 0.245);
for (let i = -6; i <= 6; i += 1) {
  for (const y of [-0.28, 0.28]) a.box('dougong', 0.028, 0.05, 0.04, i * 0.064, y, T + 0.285);
}
for (let i = -3; i <= 3; i += 1) {
  for (const x of [-0.40, 0.40]) a.box('dougong', 0.05, 0.028, 0.04, x, i * 0.082, T + 0.285);
}

// 重檐庑殿顶
a.box('roofShade', 1.00, 0.74, 0.02, 0, 0, T + 0.255);           // 下檐瓦口
a.hipRoof('roof', 0.98, 0.72, 0.11, 0.46, 0, 0, T + 0.265);      // 下层檐
// 上层墙体 + 额枋
a.box('wall', 0.66, 0.44, 0.10, 0, 0, T + 0.42);
a.box('beam', 0.70, 0.48, 0.03, 0, 0, T + 0.485);
for (let i = -5; i <= 5; i += 1) for (const y of [-0.24, 0.24]) a.box('dougong', 0.026, 0.045, 0.035, i * 0.06, y, T + 0.51);
// 上层主屋顶
a.hipRoof('roof', 0.86, 0.62, 0.17, 0.42, 0, 0, T + 0.50);
// 正脊 + 两端鸱吻 + 前檐走兽
a.box('gold', 0.46, 0.03, 0.035, 0, 0, T + 0.668);
for (const x of [-0.22, 0.22]) a.box('gold', 0.03, 0.05, 0.06, x, 0, T + 0.665);   // 鸱吻
for (let i = -3; i <= 3; i += 1) a.box('roofShade', 0.018, 0.018, 0.022, -0.30 + i * 0.10, -0.26, T + 0.585); // 戗脊走兽

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`ForbiddenCity: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
