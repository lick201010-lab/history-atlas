// 帕特农神庙 —— 奇观资产样板（public/models/parthenon.glb）。
// 复用 scripts/lib/wonderKit.mjs：三级基座（crepidoma）+ 周柱式多立克柱廊 +
//   额枋/檐部 + 内殿 cella + 三角山墙坡顶（gable 棱柱两端即三角楣 pediment）。
// 坐标：z=上，足迹约 ±0.65，base 贴地。运行：node scripts/buildParthenonGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/parthenon.glb', import.meta.url);

const COLORS = {
  base: 0xcfc3a6,     // 基座石阶（暖石）
  column: 0xe4dac2,   // 大理石柱身（受光）
  capital: 0xeee4cf,  // 柱头（最浅）
  entab: 0xd6caae,    // 额枋/檐部
  cella: 0xc6b896,    // 内殿墙（背光）
  arch: 0x3f3324,     // 门洞/柱间暗
  roof: 0xb0794a,     // 陶瓦坡顶（赤陶）
};

function material(key) {
  if (key === 'roof') return { metalness: 0.0, roughness: 0.92 };
  return { metalness: 0.0, roughness: 0.85 };
}

const a = new WonderAsset({ name: 'Parthenon' });

// 三级基座 crepidoma（底面贴地）
a.box('base', 1.42, 0.74, 0.050, 0, 0, 0.025);
a.box('base', 1.34, 0.68, 0.045, 0, 0, 0.0725);
a.box('base', 1.26, 0.62, 0.045, 0, 0, 0.1175);   // stylobate 顶 ~0.14
const STY = 0.14;

// 内殿 cella（柱廊内的实墙体 naos）
a.box('cella', 0.92, 0.40, 0.42, 0, 0, STY + 0.21);
a.box('arch', 0.04, 0.18, 0.30, -0.46, 0, STY + 0.15);  // 西门暗洞
a.box('cella', 0.96, 0.44, 0.03, 0, 0, STY + 0.435);    // 内殿压顶

// 周柱式多立克柱廊（柱身微收分 + 柱头 echinus + 方形 abacus）
const COL_H = 0.40;
const colTopZ = STY + COL_H;     // 0.54
function column(x, y) {
  a.cyl('column', 0.044, 0.052, COL_H, x, y, STY + COL_H / 2, 12);
  a.cyl('capital', 0.060, 0.046, 0.035, x, y, colTopZ + 0.018, 12);  // echinus
  a.box('capital', 0.125, 0.125, 0.024, x, y, colTopZ + 0.047);      // abacus
}
for (const face of [-1, 1]) {
  const y = face * 0.27;
  for (let i = 0; i < 8; i += 1) column(-0.57 + i * (1.14 / 7), y);  // 长边 8 柱
}
for (const face of [-1, 1]) {
  const x = face * 0.57;
  for (const y of [-0.09, 0.09]) column(x, y);                       // 短边内侧 2 柱
}

// 檐部 entablature（额枋 + 檐口出挑），坐在柱头之上
const ENT = colTopZ + 0.06;      // ~0.60
a.box('entab', 1.34, 0.62, 0.065, 0, 0, ENT + 0.0325);  // 额枋+中楣
a.box('entab', 1.40, 0.68, 0.032, 0, 0, ENT + 0.081);   // 出挑檐口

// 三角山墙坡顶：沿 X 的 gable 棱柱，两端三角面即东西三角楣 pediment
const EAVE = ENT + 0.097;        // ~0.70
a.gable('roof', 0.70, 0.135, 1.40, 0, 0, EAVE, 'yz');
// 屋脊 + 檐口压条收口
a.box('entab', 1.42, 0.04, 0.022, 0, 0, EAVE - 0.005);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Parthenon: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
