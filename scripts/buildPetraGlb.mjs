// 佩特拉 卡兹尼神殿 Al-Khazneh —— 奇观资产样板（public/models/petra.glb）· 重做版。
// 目标：砂岩「山体」+ 凿入岩壁的两层立面，而非一块竖直石板。
//   · 山体由多块错落体量堆成（深进 +x、参差峰顶、左右前凸峡壁），带横向岩层带与竖向侵蚀凹槽；
//   · 立面凹嵌在山体前面（柱身明显凸出背墙 → 进深）；
//   · 下层 6 柱廊 + 额枋 + 断山花 + 深门洞 + 台阶；上层中央圆亭 tholos + 两翼半山花。
// 复用 wonderKit；立面朝 −x；z=上；足迹约 ±0.6；base 贴地。0 贴图。
// 运行：node scripts/buildPetraGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/petra.glb', import.meta.url);

const COLORS = {
  ground: 0xc6a878,
  rock: 0xbe8453,       // 砂岩山体（受光）
  rockShade: 0xa46e3f,  // 背光岩面
  rockDeep: 0x86592f,   // 深阴影 / 凹槽 / 岩层缝
  facade: 0xd9a877,     // 凿出的立面（受光，较亮）
  column: 0xd2a067,
  cap: 0xe3c096,
  dark: 0x2a1f17,       // 门洞 / 龛 深阴影
  gold: 0xb2823f,
};
function material() { return { metalness: 0.0, roughness: 0.93 }; }
const a = new WonderAsset({ name: 'Petra' });
const G = 0.03;

// 地面
a.box('ground', 0.86, 1.08, 0.03, 0, 0, 0.015);

// ===== 砂岩山体（多块错落，深进 +x，参差峰顶）=====
a.box('rock', 0.52, 0.84, 1.00, 0.34, 0, G + 0.50);              // 主体山块（深）
a.box('rockShade', 0.40, 0.62, 0.42, 0.44, 0.06, G + 0.98);      // 高处退台峰
a.box('rock', 0.28, 0.40, 0.30, 0.40, -0.26, G + 1.04);          // 不对称小峰
a.box('rockShade', 0.30, 0.30, 0.96, 0.05, -0.46, G + 0.48);     // 左峡壁（前凸）
a.box('rock', 0.30, 0.30, 0.96, 0.05, 0.46, G + 0.48);           // 右峡壁
a.box('rockShade', 0.20, 0.24, 0.40, -0.06, -0.44, G + 0.20);    // 左前低岩
a.box('rock', 0.18, 0.22, 0.34, -0.05, 0.45, G + 0.17);          // 右前低岩
a.box('rockDeep', 0.16, 0.30, 0.26, 0.30, 0.30, G + 1.10);       // 顶部碎岩阴影
// 横向岩层带（前面提亮/压暗的水平条，制造层理）
for (const [zz, key] of [[0.30, 'rockDeep'], [0.52, 'rockShade'], [0.74, 'rockDeep']]) {
  a.box('rockShade', 0.02, 0.30, 0.02, -0.09, -0.46, G + zz);
  a.box('rockShade', 0.02, 0.30, 0.02, -0.09, 0.46, G + zz);
  a.box(key, 0.30, 0.02, 0.015, 0.44, 0.06, G + 0.80 + zz * 0.3); // 退台峰层理
}
// 竖向侵蚀凹槽（峡壁上的深缝）
for (const sy of [-0.46, 0.46]) for (const gz of [-0.16, 0.0, 0.16]) {
  a.box('rockDeep', 0.022, 0.018, 0.5, -0.085, sy + gz, G + 0.5);
}

// ===== 立面背墙（凹嵌于左右峡壁之间）=====
a.box('facade', 0.07, 0.62, 0.84, 0.06, 0, G + 0.45);

// ---- 下层柱廊（z..0.46）柱身明显凸出背墙 ----
const LX = -0.05;
a.colonnade('column', 'cap', { axis: 'y', from: -0.27, to: 0.27, count: 6, fixed: LX, baseZ: G, h: 0.40, rBot: 0.036, rTop: 0.031, capR: 0.048, capH: 0.03, baseH: 0.024, seg: 12 });
a.box('facade', 0.08, 0.70, 0.06, LX + 0.03, 0, G + 0.45);       // 下层额枋
a.box('cap', 0.12, 0.72, 0.045, LX - 0.005, 0, G + 0.49);        // 强分层横檐（凸出）
// 中央深门洞 + 门楣山花 + 台阶
a.box('dark', 0.14, 0.13, 0.32, LX + 0.06, 0, G + 0.16);
a.gable('cap', 0.16, 0.07, 0.07, LX, 0, G + 0.32, 'yz');
for (let s = 0; s < 3; s += 1) a.box('cap', 0.04, 0.20, 0.022, LX - 0.05 - s * 0.04, 0, G + 0.012 + s * 0.022);  // 台阶
// 两侧壁龛 + 立像
for (const sy of [-0.18, 0.18]) {
  a.box('dark', 0.06, 0.08, 0.20, LX + 0.02, sy, G + 0.14);
  a.box('cap', 0.022, 0.024, 0.12, LX, sy, G + 0.145);
}
// 下层断山花（中央留口给上层圆亭）
for (const sy of [-0.21, 0.21]) a.gable('facade', 0.26, 0.10, 0.08, LX, sy, G + 0.50, 'yz');

// ---- 上层（z0.52..0.88）----
const UZ = G + 0.52;
a.cyl('facade', 0.13, 0.135, 0.24, -0.07, 0, UZ + 0.12, 16);     // 圆亭 tholos（前凸）
for (let i = 0; i < 6; i += 1) {
  const th = -Math.PI / 2 + (i - 2.5) * 0.36;
  a.cyl('column', 0.021, 0.023, 0.21, -0.07 + Math.cos(th) * 0.12, Math.sin(th) * 0.12, UZ + 0.11, 8);
}
a.coneUp('facade', 0.155, 0.14, -0.07, 0, UZ + 0.24, 16);        // 锥顶
a.cyl('gold', 0.024, 0.034, 0.06, -0.07, 0, UZ + 0.38, 10);      // 瓮饰座
a.sphere('gold', 0.034, -0.07, 0, UZ + 0.45, 10);                // 瓮
for (const sy of [-1, 1]) {                                       // 两翼柱 + 半山花
  a.colonnade('column', 'cap', { axis: 'y', from: sy * 0.19, to: sy * 0.30, count: 2, fixed: -0.01, baseZ: UZ, h: 0.26, rBot: 0.026, rTop: 0.022, capR: 0.034, capH: 0.024, baseH: 0.018, seg: 8 });
  a.box('facade', 0.05, 0.18, 0.05, -0.01, sy * 0.28, UZ + 0.29);
  a.gable('facade', 0.20, 0.09, 0.06, -0.01, sy * 0.28, UZ + 0.32, 'xz');
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Petra: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
