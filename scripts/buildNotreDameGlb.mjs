// 巴黎圣母院 —— 奇观资产样板（public/models/notre-dame.glb）。
// 复用 scripts/lib/wonderKit.mjs：拉丁十字平面（中殿 + 翼厅）+ 陡坡屋顶 + 西立面双塔
//   （平顶 + 角小尖塔）+ 玫瑰窗 + 三尖券门洞 + 十字交叉处中央尖塔 flèche + 飞扶壁。
// 坐标 z=上，足迹约 ±0.55，base 贴地。运行：node scripts/buildNotreDameGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/notre-dame.glb', import.meta.url);

const COLORS = {
  base: 0xc6b99a,
  stone: 0xcabd9c,      // 石灰岩（受光）
  stoneShade: 0xb3a786,
  roof: 0x69736d,       // 铅/石板屋顶（暗灰绿）
  spire: 0x59625d,      // 尖塔
  dark: 0x2c2822,       // 门洞/窗
  rose: 0x3a3550,       // 玫瑰窗（暗靛）
  gold: 0xc9a14e,
};

function material(key) {
  if (key === 'gold') return { metalness: 0.5, roughness: 0.42 };
  return { metalness: 0.0, roughness: 0.85 };
}

const a = new WonderAsset({ name: 'NotreDame' });

// 地面（贴地）
a.box('base', 1.22, 0.60, 0.05, 0, 0, 0.025);
const G = 0.05;

// 中殿主体（长轴沿 x，西立面在 −x）
a.box('stone', 0.92, 0.34, 0.40, 0.04, 0, G + 0.20);     // z0.05..0.45
a.gable('roof', 0.36, 0.20, 0.92, 0.04, 0, G + 0.40, 'yz'); // 陡坡顶（两端三角）
// 翼厅 transept（十字横臂）
a.box('stone', 0.22, 0.58, 0.36, 0.12, 0, G + 0.18);
a.gable('roof', 0.24, 0.16, 0.58, 0.12, 0, G + 0.36, 'xz');
// 后殿 chevet（东端半圆）
a.cyl('stone', 0.17, 0.18, 0.34, 0.50, 0, G + 0.17, 16);

// 西立面（−x 端，高于中殿）
const FX = -0.44;
a.box('stone', 0.10, 0.46, 0.60, FX, 0, G + 0.30);        // 立面墙 z0.05..0.65
a.box('stoneShade', 0.06, 0.50, 0.05, FX, 0, G + 0.60);   // 立面顶横饰带（连塔廊）
// 玫瑰窗（朝 −x 的暗色圆盘）
a.cyl('rose', 0.095, 0.095, 0.03, FX - 0.045, 0, G + 0.40, 20);
// 三尖券门洞
for (const dy of [-0.15, 0, 0.15]) {
  a.box('dark', 0.05, 0.10, 0.18, FX - 0.03, dy, G + 0.10);
  a.gable('dark', 0.10, 0.06, 0.05, FX - 0.03, dy, G + 0.19, 'yz');
}

// 双塔（平顶 + 角小尖塔）
for (const ty of [-0.17, 0.17]) {
  a.box('stone', 0.15, 0.15, 0.78, FX, ty, G + 0.39);     // 塔身 z0.05..0.83
  a.box('dark', 0.04, 0.06, 0.22, FX - 0.04, ty, G + 0.42); // 钟层尖券窗
  a.box('stoneShade', 0.17, 0.17, 0.03, ty < 0 ? FX : FX, ty, G + 0.80); // 塔顶女儿墙
  for (const cx of [-0.055, 0.055]) for (const cy of [-0.055, 0.055]) {
    a.coneUp('spire', 0.022, 0.07, FX + cx, ty + cy, G + 0.81, 6); // 角小尖塔 pinnacle
  }
}

// 中央交叉塔 flèche
a.coneUp('spire', 0.055, 0.34, 0.12, 0, G + 0.50, 8);
a.cyl('spire', 0.012, 0.018, 0.06, 0.12, 0, G + 0.85, 8);
a.sphere('gold', 0.016, 0.12, 0, G + 0.90, 8);

// 飞扶壁（中殿两侧斜撑 + 扶壁墩）
for (const sy of [-1, 1]) {
  for (const bx of [0.0, 0.2, 0.36]) {
    a.box('stoneShade', 0.04, 0.05, 0.30, bx, sy * 0.30, G + 0.14);          // 扶壁墩
    a.boxRotX('stoneShade', 0.035, 0.18, 0.03, bx, sy * 0.24, G + 0.34, sy * 0.5); // 斜撑券
  }
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`NotreDame: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
