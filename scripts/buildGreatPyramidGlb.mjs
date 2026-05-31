// 吉萨金字塔 —— 奇观资产样板（public/models/great-pyramid.glb）。
// 复用 scripts/lib/wonderKit.mjs：主金字塔（胡夫）+ 两座较小金字塔（卡夫拉/门卡乌拉）+
//   三座王后小金字塔 + 祭庙基座 mastaba + 入口暗洞 + 沙漠基面。
//   stepPyramid 以分层方台叠出砌石层次（奇数层换色 → 砌层带）。
// 坐标 z=上，足迹约 ±0.65，base 贴地。运行：node scripts/buildGreatPyramidGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/great-pyramid.glb', import.meta.url);

const COLORS = {
  sand: 0xd5bd86,       // 沙漠基面
  stone: 0xd9c08a,      // 石灰岩砌块（受光）
  stoneShade: 0xc6ac76, // 砌层带（暗）
  temple: 0xcbb079,     // 祭庙 / 神庙基座
  arch: 0x4a3d2a,       // 入口暗洞
  gold: 0xc9a14e,       // 镀金顶石 pyramidion
};

function material(key) {
  if (key === 'gold') return { metalness: 0.5, roughness: 0.4 };
  return { metalness: 0.0, roughness: 0.92 };
}

const a = new WonderAsset({ name: 'GreatPyramid' });

// 沙漠基面（底面贴地）
a.box('sand', 1.42, 1.34, 0.04, 0, 0, 0.02);
const G = 0.04;

// 主金字塔（胡夫）
const MX = -0.12, MY = -0.10;
a.stepPyramid('stone', 0.44, 0.64, 16, MX, MY, G, { bandKey: 'stoneShade' });
a.stepPyramid('gold', 0.05, 0.07, 2, MX, MY, G + 0.57);          // 镀金顶石
a.box('arch', 0.05, 0.06, 0.10, MX, MY - 0.45, G + 0.05);        // 北面入口暗洞

// 第二金字塔（卡夫拉）
a.stepPyramid('stone', 0.27, 0.42, 13, 0.36, 0.20, G, { bandKey: 'stoneShade' });
// 第三金字塔（门卡乌拉）
a.stepPyramid('stone', 0.15, 0.22, 9, 0.34, 0.52, G, { bandKey: 'stoneShade' });

// 三座王后小金字塔
for (const qx of [0.16, 0.30, 0.44]) {
  a.stepPyramid('stoneShade', 0.05, 0.08, 4, qx, -0.46, G);
}

// 祭庙基座 mastaba（主金字塔东侧低矮石台）+ 神庙小台
a.box('temple', 0.22, 0.16, 0.06, 0.20, -0.06, G + 0.03);
a.box('temple', 0.14, 0.10, 0.045, 0.30, -0.18, G + 0.0225);
a.box('temple', 0.10, 0.30, 0.035, -0.46, 0.02, G + 0.0175);     // 河谷神庙/甬道暗示

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`GreatPyramid: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
