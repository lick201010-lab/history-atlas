// 德里红堡 Lal Qila —— 奇观资产样板（public/models/red-fort.glb）。
// 修「闯入画面的红色大方块」：用一座可辨识的莫卧儿红砂岩王城替换通用兜底体块 ——
//   红砂岩雉堞城墙 + 四角棱堡 + 拉合尔门（双塔 + 顶部 chhatri 群）+ 内庭白大理石殿亭（小穹+金尖）。
// 复用 scripts/lib/wonderKit.mjs。坐标 z=上，足迹约 ±0.6，base 贴地。
// 运行：node scripts/buildRedFortGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/red-fort.glb', import.meta.url);

const COLORS = {
  ground: 0xc9b48f,
  red: 0xa8492c,        // 红砂岩（受光）
  redShade: 0x8f3c24,   // 背光
  cren: 0xb55636,       // 雉堞
  marble: 0xe6ded0,     // 白大理石殿亭
  dome: 0xeae3d4,       // 穹/chhatri 顶
  dark: 0x2e211a,       // 门洞 / 窗龛
  gold: 0xc9a14e,
};
function material(key) {
  if (key === 'gold') return { metalness: 0.45, roughness: 0.42 };
  if (key === 'dome') return { metalness: 0.0, roughness: 0.55 };
  return { metalness: 0.0, roughness: 0.85 };
}
const a = new WonderAsset({ name: 'RedFort' });

// 小型 chhatri 圆顶亭
function chhatri(x, y, z, r, domeKey = 'dome') {
  a.cyl('marble', r * 0.95, r, r * 0.5, x, y, z + r * 0.25, 8);
  a.latheDome(domeKey, r, x, y, z + r * 0.5, 1.05, 14);
  a.cyl('gold', r * 0.06, r * 0.1, r * 0.4, x, y, z + r * 1.0, 6);
}
// 一段雉堞（沿 axis 排小垛口）
function crenel(key, axis, from, to, fixed, z, n) {
  for (let i = 0; i < n; i += 1) {
    const u = from + (to - from) * (i / (n - 1));
    const x = axis === 'x' ? u : fixed, y = axis === 'x' ? fixed : u;
    a.box(key, axis === 'x' ? 0.03 : 0.05, axis === 'x' ? 0.05 : 0.03, 0.04, x, y, z);
  }
}

// 地面
a.box('ground', 1.18, 0.90, 0.04, 0, 0, 0.02);
const G = 0.04;

// 雉堞城墙（矩形 x±0.55 / y±0.40，墙高 0.20）
const WX = 0.55, WY = 0.40, WH = 0.20, TH = 0.06;
a.box('red', 2 * WX, TH, WH, 0, -WY, G + WH / 2);          // 前 −y
a.box('redShade', 2 * WX, TH, WH, 0, WY, G + WH / 2);      // 后 +y
a.box('redShade', TH, 2 * WY, WH, -WX, 0, G + WH / 2);     // 左 −x
a.box('red', TH, 2 * WY, WH, WX, 0, G + WH / 2);           // 右 +x
crenel('cren', 'x', -WX + 0.05, WX - 0.05, -WY, G + WH + 0.02, 16);
crenel('cren', 'x', -WX + 0.05, WX - 0.05, WY, G + WH + 0.02, 16);
crenel('cren', 'y', -WY + 0.05, WY - 0.05, -WX, G + WH + 0.02, 11);
crenel('cren', 'y', -WY + 0.05, WY - 0.05, WX, G + WH + 0.02, 11);

// 四角棱堡（圆塔 + 雉堞 + chhatri）
for (const [bx, by] of [[-WX, -WY], [WX, -WY], [-WX, WY], [WX, WY]]) {
  a.cyl('red', 0.075, 0.085, 0.26, bx, by, G + 0.13, 16);
  a.cyl('cren', 0.088, 0.088, 0.03, bx, by, G + 0.27, 16);
  chhatri(bx, by, G + 0.28, 0.05);
}
// 墙顶 chhatri 群（沿前后墙等距）
for (const x of [-0.28, 0, 0.28]) { chhatri(x, WY, G + WH, 0.04); }
for (const x of [-0.34, 0.34]) { chhatri(x, -WY, G + WH, 0.04); }

// 拉合尔门（前中 −y）：门楼 + 双塔 + 中央拱 + 顶 chhatri 群
a.box('red', 0.30, 0.13, 0.42, 0, -WY, G + 0.21);
a.box('dark', 0.11, 0.07, 0.24, 0, -WY - 0.04, G + 0.13);   // 中央门拱（暗）
a.gable('dark', 0.11, 0.05, 0.05, 0, -WY - 0.05, G + 0.25, 'xz');
for (const tx of [-0.12, 0.12]) {
  a.cyl('red', 0.045, 0.05, 0.46, tx, -WY, G + 0.23, 8);     // 八角侧塔
  chhatri(tx, -WY, G + 0.46, 0.045);
}
for (const cx of [-0.07, 0, 0.07]) chhatri(cx, -WY + 0.01, G + 0.42, 0.035);

// 内庭白大理石殿亭群（迪万-伊-哈斯 / 哈斯庭等）
// Diwan-i-Am（红砂岩柱厅，朝南列柱）
a.box('red', 0.34, 0.16, 0.14, -0.18, 0.02, G + 0.07);
a.colonnade('marble', 'marble', { axis: 'x', from: -0.32, to: -0.04, count: 7, fixed: -0.07, baseZ: G, h: 0.13, rBot: 0.012, rTop: 0.011, capR: 0, baseH: 0 });
a.box('marble', 0.36, 0.18, 0.02, -0.18, 0.02, G + 0.15);
for (const cx of [-0.29, -0.18, -0.07]) chhatri(cx, 0.02, G + 0.16, 0.035);
// Khas Mahal / Diwan-i-Khas（白大理石殿，三亭一线）
a.box('marble', 0.30, 0.16, 0.16, 0.28, 0.14, G + 0.08);
a.box('dark', 0.28, 0.02, 0.10, 0.28, 0.055, G + 0.07);     // 朝庭拱廊暗带
for (const cx of [0.18, 0.28, 0.38]) chhatri(cx, 0.14, G + 0.16, 0.05);
// 莫蒂清真寺暗示（小白殿 + 三穹）
a.box('marble', 0.18, 0.12, 0.12, 0.05, 0.28, G + 0.06);
for (const cx of [-0.04, 0.05, 0.14]) a.latheDome('dome', 0.04, cx, 0.30, G + 0.12, 1.05, 14);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`RedFort: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
