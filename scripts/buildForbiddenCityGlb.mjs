// 紫禁城 —— 奇观资产样板（public/models/forbidden-city.glb）· 重做版（宫殿建筑群）。
// 修「大面积板状几何」：彻底移除旧的大平板屋檐板，屋顶一律用多段层叠檐（重檐 hipRoof）。
//   建筑群层次：外宫墙 + 四角楼（多重檐）+ 午门门楼 + 三层须弥座上的太和殿（重檐庑殿）+
//   后殿 + 东西庑廊。配色：暗红墙体 / 金棕屋顶 / 暖石基座 / 暗金点缀（无蓝绿大色块）。
// 复用 wonderKit；z=上；足迹约 ±0.63；base 贴地；0 贴图。
// 运行：node scripts/buildForbiddenCityGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/forbidden-city.glb', import.meta.url);

const COLORS = {
  base: 0xcabd9c, terrace: 0xe8e0cf, terraceShade: 0xd2c8b0, rail: 0xeae3d2,
  wall: 0xa3392c, wallDark: 0x8a3024, column: 0x7e2e23, beam: 0x6f5a39,
  dougong: 0x8a6e40, roof: 0xb07b32, roofShade: 0x966827, dark: 0x2e2620, gold: 0xc9a14e,
};
function material(key) {
  if (key === 'gold') return { metalness: 0.45, roughness: 0.42 };
  if (key === 'roof' || key === 'roofShade') return { metalness: 0.18, roughness: 0.6 };
  return { metalness: 0.0, roughness: 0.85 };
}
const a = new WonderAsset({ name: 'ForbiddenCity' });

// ---- 屋顶构件（全部用坡屋面，杜绝大平板）----
function ridge(cx, cy, len, z) {
  a.box('gold', len, 0.02, 0.026, cx, cy, z - 0.004);
  for (const ex of [-(len / 2 - 0.02), (len / 2 - 0.02)]) a.box('gold', 0.022, 0.038, 0.05, cx + ex, cy, z - 0.018);
}
function singleEave(cx, cy, baseZ, w, d, h) {
  a.hipRoof('roof', w + 0.12, d + 0.12, h, Math.max(w - 0.16, 0.04), cx, cy, baseZ);
  ridge(cx, cy, Math.max(w - 0.16, 0.06), baseZ + h);
}
function doubleEave(cx, cy, baseZ, w, d, h) {
  a.hipRoof('roofShade', w + 0.14, d + 0.14, h * 0.5, Math.max(w - 0.2, 0.04), cx, cy, baseZ);   // 下层檐
  const uw = w * 0.72, ud = d * 0.72, uz = baseZ + h * 0.5 + 0.015;
  a.box('wall', uw, ud, 0.05, cx, cy, uz + 0.025);                                               // 上层短墙
  a.box('beam', uw * 1.04, ud * 1.04, 0.016, cx, cy, uz + 0.052);
  a.hipRoof('roof', uw + 0.14, ud + 0.14, h, Math.max(uw - 0.12, 0.04), cx, cy, uz + 0.06);      // 上层主檐
  ridge(cx, cy, Math.max(uw - 0.12, 0.06), uz + 0.06 + h);
}
// 殿堂：墙身 + 前檐柱 + 额枋 + 斗栱 + 屋顶
function hall(cx, cy, w, d, bodyH, baseZ, { double = false, h = 0.13, cols = true, dgong = false } = {}) {
  a.box('wall', w, d, bodyH, cx, cy, baseZ + bodyH / 2);
  if (cols) {
    const n = Math.max(4, Math.round(w / 0.085));
    a.colonnade('column', 'column', { axis: 'x', from: cx - w / 2 + 0.03, to: cx + w / 2 - 0.03, count: n, fixed: cy - d / 2 + 0.008, baseZ, h: bodyH, rBot: 0.015, rTop: 0.013, capR: 0, baseH: 0 });
  }
  a.box('beam', w * 0.98, d * 0.98, 0.018, cx, cy, baseZ + bodyH + 0.009);
  if (dgong) for (let i = -6; i <= 6; i += 1) for (const sy of [-1, 1]) a.box('dougong', 0.024, 0.04, 0.03, cx + i * (w / 13), cy + sy * (d / 2 - 0.01), baseZ + bodyH + 0.035);
  if (double) doubleEave(cx, cy, baseZ + bodyH + 0.02, w, d, h);
  else singleEave(cx, cy, baseZ + bodyH + 0.02, w, d, h);
}
// 角楼：细身 + 三重檐
function cornerTower(cx, cy) {
  a.box('wallDark', 0.14, 0.14, 0.22, cx, cy, 0.11);
  let z = 0.22;
  for (const [w, hh] of [[0.24, 0.06], [0.18, 0.055], [0.12, 0.06]]) {
    a.hipRoof('roof', w, w, hh, w * 0.34, cx, cy, z);
    z += hh + 0.004;
  }
  a.cyl('gold', 0.009, 0.013, 0.05, cx, cy, z + 0.02, 8);
}

// ===== 庭院地面 =====
a.box('base', 1.30, 0.94, 0.04, 0, 0, 0.02);

// ===== 外宫墙 + 四角楼 =====
const WX = 0.60, WY = 0.42, WH = 0.13;
a.box('wallDark', 2 * WX, 0.05, WH, 0, WY, WH / 2 + 0.04);            // 后墙
a.box('wallDark', 0.05, 2 * WY, WH, -WX, 0, WH / 2 + 0.04);          // 左墙
a.box('wallDark', 0.05, 2 * WY, WH, WX, 0, WH / 2 + 0.04);           // 右墙
a.box('wallDark', WX - 0.16, 0.05, WH, -(WX - 0.16) / 2 - 0.16, -WY, WH / 2 + 0.04); // 前墙（左段，给午门留口）
a.box('wallDark', WX - 0.16, 0.05, WH, (WX - 0.16) / 2 + 0.16, -WY, WH / 2 + 0.04);  // 前墙（右段）
for (const z of [WH + 0.04]) {                                       // 墙顶压条
  a.box('gold', 2 * WX + 0.02, 0.06, 0.014, 0, WY, z);
  for (const sx of [-WX, WX]) a.box('gold', 0.06, 2 * WY, 0.014, sx, 0, z);
}
for (const [cx, cy] of [[-WX, -WY], [WX, -WY], [-WX, WY], [WX, WY]]) cornerTower(cx, cy);

// ===== 午门门楼（前中）=====
a.box('wallDark', 0.46, 0.16, 0.22, 0, -WY, 0.11 + 0.04);
a.box('dark', 0.10, 0.07, 0.14, 0, -WY - 0.05, 0.07 + 0.04);         // 中央门洞
hall(0, -WY, 0.26, 0.14, 0.10, 0.26, { double: true, h: 0.085, cols: false });
for (const fx of [-0.18, 0.18]) hall(fx, -WY, 0.13, 0.12, 0.08, 0.26, { double: false, h: 0.06, cols: false });

// ===== 三层须弥座 + 太和殿（重檐庑殿，建筑群中心）=====
const MCY = -0.02;
a.box('terrace', 0.74, 0.56, 0.05, 0, MCY, 0.065);
a.box('terraceShade', 0.66, 0.48, 0.045, 0, MCY, 0.1125);
a.box('terrace', 0.58, 0.42, 0.045, 0, MCY, 0.1575);
const MT = 0.18;
for (let i = -4; i <= 4; i += 1) for (const sy of [-0.30, 0.30]) a.box('rail', 0.018, 0.018, 0.05, i * 0.072, MCY + sy, MT + 0.025); // 栏杆望柱
for (let s = 0; s < 3; s += 1) a.box('terrace', 0.26, 0.045, 0.05, 0, MCY - 0.30 - s * 0.04, MT - 0.02 - s * 0.05); // 御路台阶
hall(0, MCY, 0.50, 0.36, 0.20, MT, { double: true, h: 0.155, cols: true, dgong: true });

// ===== 后殿（保和殿一线）=====
hall(0, 0.28, 0.34, 0.22, 0.14, 0.04, { double: true, h: 0.10, cols: true });

// ===== 东西庑廊（长向沿 y，脊沿 y）=====
for (const sx of [-0.40, 0.40]) {
  a.box('wall', 0.10, 0.60, 0.11, sx, MCY, 0.04 + 0.055);
  a.gable('roof', 0.16, 0.05, 0.62, sx, MCY, 0.04 + 0.11, 'xz');
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`ForbiddenCity: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
