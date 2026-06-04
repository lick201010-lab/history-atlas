// 帕特农神庙 —— 奇观资产样板（public/models/parthenon.glb）· 精修版（对齐圣索菲亚细节档）。
// 复用 scripts/lib/wonderKit.mjs：三级基座 crepidoma + 周柱式多立克柱廊（8×17 满柱列，柱础/
//   柱头/abacus）+ 额枋 + 三陇板 triglyph 中楣 + 出挑檐口 + 内殿 cella（前廊柱 + 门洞）+
//   三角山墙坡顶（gable 棱柱两端即三角楣）+ 屋角/脊端 acroteria 饰。
// 坐标 z=上，足迹约 ±0.62，base 贴地。运行：node scripts/buildParthenonGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/parthenon.glb', import.meta.url);

const COLORS = {
  base: 0xcfc3a6, column: 0xe4dac2, capital: 0xeee4cf, entab: 0xd6caae,
  frieze: 0xcabd9c, cella: 0xc6b896, arch: 0x3f3324, roof: 0xb0794a, orn: 0xe0d4ba,
};
function material(key) {
  if (key === 'roof') return { metalness: 0.0, roughness: 0.92 };
  return { metalness: 0.0, roughness: 0.85 };
}
const a = new WonderAsset({ name: 'Parthenon' });

// 三级基座
a.box('base', 1.42, 0.74, 0.050, 0, 0, 0.025);
a.box('base', 1.34, 0.68, 0.045, 0, 0, 0.0725);
a.box('base', 1.26, 0.62, 0.045, 0, 0, 0.1175);
const STY = 0.14, CH = 0.40, colTop = STY + CH;   // 柱顶 0.54

// 内殿 cella（naos）
a.box('cella', 0.82, 0.34, 0.40, 0, 0, STY + 0.20);
a.box('cella', 0.86, 0.38, 0.03, 0, 0, STY + 0.415);
a.box('arch', 0.04, 0.16, 0.27, -0.41, 0, STY + 0.155);            // 西门洞
a.colonnade('column', 'capital', { axis: 'y', from: -0.12, to: 0.12, count: 2, fixed: -0.34, baseZ: STY, h: 0.36, rBot: 0.03, rTop: 0.026, capR: 0.04, capH: 0.024 }); // 前廊柱

// 周柱式多立克柱廊（长边 17 根 / 短边内侧 6 根，含柱础与柱头）
const cOpt = { h: CH, rBot: 0.034, rTop: 0.028, capR: 0.046, capH: 0.026, baseH: 0.018, seg: 14 };
a.colonnade('column', 'capital', { ...cOpt, axis: 'x', from: -0.585, to: 0.585, count: 17, fixed: -0.265, baseZ: STY });
a.colonnade('column', 'capital', { ...cOpt, axis: 'x', from: -0.585, to: 0.585, count: 17, fixed: 0.265, baseZ: STY });
a.colonnade('column', 'capital', { ...cOpt, axis: 'y', from: -0.19, to: 0.19, count: 6, fixed: -0.585, baseZ: STY });
a.colonnade('column', 'capital', { ...cOpt, axis: 'y', from: -0.19, to: 0.19, count: 6, fixed: 0.585, baseZ: STY });

// 檐部：额枋 + 三陇板中楣 + 出挑檐口
a.box('entab', 1.30, 0.60, 0.05, 0, 0, colTop + 0.055);            // 额枋 z0.56..0.61
a.box('frieze', 1.28, 0.58, 0.045, 0, 0, colTop + 0.102);          // 中楣底 z0.605..0.65
// 三陇板 triglyph（沿四边一圈竖块）
for (let i = 0; i < 18; i += 1) {
  const x = -0.585 + i * (1.17 / 17);
  a.box('entab', 0.022, 0.02, 0.044, x, -0.295, colTop + 0.102);
  a.box('entab', 0.022, 0.02, 0.044, x, 0.295, colTop + 0.102);
}
for (let i = 0; i < 9; i += 1) {
  const y = -0.27 + i * (0.54 / 8);
  a.box('entab', 0.02, 0.022, 0.044, -0.595, y, colTop + 0.102);
  a.box('entab', 0.02, 0.022, 0.044, 0.595, y, colTop + 0.102);
}
a.box('entab', 1.38, 0.66, 0.032, 0, 0, colTop + 0.14);            // 出挑檐口 z0.665..0.70
const EAVE = colTop + 0.156;

// 三角山墙坡顶（两端三角面 = 东西三角楣 pediment）
a.gable('roof', 0.70, 0.135, 1.40, 0, 0, EAVE, 'yz');
a.box('entab', 1.42, 0.04, 0.022, 0, 0, EAVE - 0.004);            // 檐口压条
// acroteria（脊端与檐角小饰）
for (const x of [-0.70, 0.70]) {
  a.coneUp('orn', 0.03, 0.06, x, 0, EAVE + 0.138, 8);             // 脊端顶饰
  for (const y of [-0.33, 0.33]) a.box('orn', 0.03, 0.03, 0.05, x, y, EAVE + 0.01);  // 檐角饰
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Parthenon: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
