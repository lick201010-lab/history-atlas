// 吴哥窟 Angkor Wat —— 奇观资产样板（public/models/angkor-wat.glb）。
// 复用 scripts/lib/wonderKit.mjs：护城河水面 + 方形台基岛 + 引道 + 回廊外墙 + 角楼 +
//   分层须弥台（stepPyramid 截顶）+ 梅花五塔（中央高塔 + 四角塔，分层塔身 + 莲花苞顶 lathe）。
// 坐标 z=上，足迹约 ±0.65，base 贴地。运行：node scripts/buildAngkorWatGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/angkor-wat.glb', import.meta.url);

const COLORS = {
  water: 0x6b7a78,     // 护城河（暗哑水色，不亮）
  sand: 0xc9b48f,      // 砂岩台基/回廊（受光）
  sandShade: 0xb39f78, // 背光砂岩 / 层带
  tower: 0xc2ad84,     // 塔身
  lotus: 0xbcab82,     // 莲花苞顶
  dark: 0x3f3324,      // 门洞 gopura 暗
  gold: 0xc9a14e,      // 塔尖点缀
};

function material(key) {
  if (key === 'gold') return { metalness: 0.5, roughness: 0.42 };
  return { metalness: 0.0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'AngkorWat' });

// 护城河水面（贴地的方环）
for (const [sx, sy, x, y] of [[1.30, 0.16, 0, 0.57], [1.30, 0.16, 0, -0.57], [0.16, 0.98, -0.57, 0], [0.16, 0.98, 0.57, 0]]) {
  a.box('water', sx, sy, 0.03, x, y, 0.015);
}
// 台基岛
a.box('sand', 1.02, 1.02, 0.05, 0, 0, 0.025);
const ISL = 0.05;
// 西向引道（跨河，控制在足迹内）
a.box('sand', 0.26, 0.14, 0.045, -0.585, 0, ISL - 0.005);

// 回廊外墙（低）+ 四角楼 + 西门 gopura
const gw = 0.44;
for (const [sx, sy, x, y] of [[0.96, 0.05, 0, gw], [0.96, 0.05, 0, -gw], [0.05, 0.92, -gw, 0], [0.05, 0.92, gw, 0]]) {
  a.box('sand', sx, sy, 0.12, x, y, ISL + 0.06);
}
for (const [cx, cy] of [[-gw, -gw], [gw, -gw], [-gw, gw], [gw, gw]]) {
  a.stepPyramid('tower', 0.06, 0.18, 4, cx, cy, ISL, { topHalf: 0.03 });
  a.lathe('lotus', [[0.045, 0], [0.05, 0.02], [0.035, 0.05], [0.018, 0.08], [0.001, 0.1]], cx, cy, ISL + 0.18, 14);
}
a.box('dark', 0.05, 0.16, 0.10, -gw - 0.005, 0, ISL + 0.05);  // 西门洞

// 分层须弥台（庙山基座）
a.stepPyramid('sand', 0.40, 0.22, 3, 0, 0, ISL, { bandKey: 'sandShade', topHalf: 0.30 });
const TOP = ISL + 0.22;

// 梅花五塔：中央高塔 + 四角塔（分层塔身 + 莲花苞顶 + 金尖）
function lotusTower(cx, cy, baseZ, bh, total) {
  const tierH = total * 0.60;
  a.stepPyramid('tower', bh, tierH, 5, cx, cy, baseZ, { bandKey: 'sandShade', topHalf: bh * 0.52 });
  const capR = bh * 0.62, capH = total * 0.40, cz = baseZ + tierH;
  const lotus = [[0.82, 0], [1.0, 0.13], [0.9, 0.30], [0.68, 0.47], [0.46, 0.64], [0.27, 0.80], [0.11, 0.93], [0.001, 1.0]];
  a.lathe('lotus', lotus.map(([r, h]) => [r * capR, h * capH]), cx, cy, cz, 20);
  a.coneUp('gold', capR * 0.16, total * 0.10, cx, cy, cz + capH, 10);
}
lotusTower(0, 0, TOP, 0.14, 0.66);                 // 中央主塔 顶 ~0.93
for (const [cx, cy] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) {
  lotusTower(cx, cy, TOP, 0.085, 0.40);            // 四角塔
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`AngkorWat: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
