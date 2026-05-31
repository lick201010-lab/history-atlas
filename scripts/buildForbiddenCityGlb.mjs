// 紫禁城 太和殿 —— 奇观资产样板（public/models/forbidden-city.glb）。
// 复用 scripts/lib/wonderKit.mjs：三层汉白玉须弥座 + 朱红殿身 + 前檐红柱 + 彩画额枋 +
//   重檐庑殿顶（两层 hipRoof，金色琉璃瓦）+ 门窗暗龛。
// 坐标 z=上，足迹约 ±0.6，base 贴地。运行：node scripts/buildForbiddenCityGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/forbidden-city.glb', import.meta.url);

const COLORS = {
  base: 0xcabd9c,       // 广场地面
  terrace: 0xe8e0cf,    // 汉白玉须弥座（受光）
  terraceShade: 0xd2c8b0,
  wall: 0xa83f37,       // 朱红殿墙
  column: 0x9c322b,     // 红柱
  beam: 0x3f5e54,       // 彩画额枋（青绿，压暗）
  roof: 0xc1973f,       // 金色琉璃瓦顶（暗金，不亮）
  roofShade: 0xa67f33,
  dark: 0x2e2620,       // 门窗暗龛
};

function material(key) {
  if (key === 'roof' || key === 'roofShade') return { metalness: 0.25, roughness: 0.55 };
  return { metalness: 0.0, roughness: 0.85 };
}

const a = new WonderAsset({ name: 'ForbiddenCity' });

// 广场（贴地）
a.box('base', 1.30, 1.00, 0.04, 0, 0, 0.02);
// 三层汉白玉须弥座
a.box('terrace', 1.10, 0.80, 0.08, 0, 0, 0.08);
a.box('terraceShade', 0.98, 0.70, 0.07, 0, 0, 0.155);
a.box('terrace', 0.88, 0.62, 0.07, 0, 0, 0.225);
const T = 0.26;                                   // 须弥座顶

// 殿身（朱红）
a.box('wall', 0.78, 0.50, 0.24, 0, 0, T + 0.12);  // z0.26..0.50
// 前后檐红柱（南北面各一排）
for (const fy of [-0.26, 0.26]) {
  for (let i = -3; i <= 3; i += 1) a.cyl('column', 0.022, 0.026, 0.24, i * 0.115, fy, T + 0.12, 10);
}
// 门窗暗龛（南面）
for (const dx of [-0.26, 0, 0.26]) a.box('dark', 0.10, 0.03, 0.18, dx, -0.255, T + 0.10);
// 下层额枋（彩画）
a.box('beam', 0.84, 0.56, 0.035, 0, 0, T + 0.245);

// 重檐庑殿顶
a.hipRoof('roof', 0.96, 0.70, 0.11, 0.46, 0, 0, T + 0.25);     // 下层檐（出挑大）
a.box('roofShade', 0.92, 0.66, 0.018, 0, 0, T + 0.25);          // 下檐瓦口压条
// 上层墙体（clerestory）
a.box('wall', 0.66, 0.44, 0.10, 0, 0, T + 0.41);
a.box('beam', 0.70, 0.48, 0.03, 0, 0, T + 0.475);
// 上层主屋顶
a.hipRoof('roof', 0.84, 0.60, 0.17, 0.42, 0, 0, T + 0.49);      // 脊高 ~ T+0.66
// 正脊 + 两端鸱吻暗示
a.box('roofShade', 0.44, 0.035, 0.035, 0, 0, T + 0.655);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`ForbiddenCity: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
