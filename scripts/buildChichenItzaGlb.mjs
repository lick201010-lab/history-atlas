// 奇琴伊察 库库尔坎金字塔 El Castillo —— 奇观资产样板（public/models/chichen-itza.glb）· 重做版。
// 依 Codex GLB QA：旧模型面数过低、地图视角太小太简。本版补齐可识别特征：
//   · 九级截顶阶梯金字塔（stepPyramid，奇偶层换色 → 砌层明暗带）；
//   · 每级台缘暗色阴影缝（bevel/层理感）；
//   · 四面大台阶（踏步 + 两侧栏墙 alfarda，全部轴对齐，无悬空无穿透）；
//   · 顶部库库尔坎神庙（前廊蛇柱 + 四向门洞 + 檐口 + 顶饰带）。
// 复用 wonderKit；z=上；足迹约 ±0.54；base 贴地；0 贴图；纯顶点色。
// 运行：node scripts/buildChichenItzaGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/chichen-itza.glb', import.meta.url);

const COLORS = {
  plaza: 0xc7ba98,     // 广场基面
  lime: 0xd2c39c,      // 石灰岩台体（受光）
  limeShade: 0xb6a47b, // 砌层暗带（奇数层）
  seam: 0x8f7e5c,      // 台缘阴影缝
  stair: 0xcabb93,     // 台阶踏步
  rail: 0xb2a079,      // 栏墙 alfarda
  temple: 0xccbb94,    // 顶庙墙体
  templeShade: 0xb09c75,
  dark: 0x342a1d,      // 门洞 / 暗龛
  serpent: 0xc0a978,   // 蛇柱
  comb: 0xc6b187,      // 顶饰带
};
function material() { return { metalness: 0.0, roughness: 0.9 }; }

const a = new WonderAsset({ name: 'ChichenItza' });

// 广场基面（贴地）
a.box('plaza', 1.10, 1.10, 0.04, 0, 0, 0.02);
const G = 0.04;

// 九级截顶阶梯金字塔
const BH = 0.46, PH = 0.50, TH = 0.13, LAYERS = 9;
a.stepPyramid('lime', BH, PH, LAYERS, 0, 0, G, { bandKey: 'limeShade', topHalf: TH });
const TOP = G + PH;
const faceHalf = (i) => BH + (TH - BH) * (i / LAYERS);

// 每级台缘的暗色阴影缝（四边一圈，制造层理/bevel）
for (let i = 1; i < LAYERS; i += 1) {
  const fh = faceHalf(i);
  const z = G + PH * (i / LAYERS);
  a.box('seam', 2 * fh + 0.016, 0.016, 0.012, 0, -fh, z);
  a.box('seam', 2 * fh + 0.016, 0.016, 0.012, 0, fh, z);
  a.box('seam', 0.016, 2 * fh + 0.016, 0.012, -fh, 0, z);
  a.box('seam', 0.016, 2 * fh + 0.016, 0.012, fh, 0, z);
}

// 四面大台阶（踏步 + 两侧栏墙，全部轴对齐）
function stairway(axis, sign) {
  const N = 12, W = 0.24;
  const uBot = sign * (BH + 0.005), uTop = sign * TH;
  for (let i = 0; i <= N; i += 1) {
    const f = i / N;
    const u = uBot + (uTop - uBot) * f;
    const z = G + (TOP - G) * f;
    if (axis === 'x') a.box('stair', 0.06, W, 0.05, u, 0, z + 0.02);
    else a.box('stair', W, 0.06, 0.05, 0, u, z + 0.02);
    for (const s of [-1, 1]) {
      if (axis === 'x') a.box('rail', 0.06, 0.035, 0.085, u, s * (W / 2 + 0.01), z + 0.03);
      else a.box('rail', 0.035, 0.06, 0.085, s * (W / 2 + 0.01), u, z + 0.03);
    }
  }
}
stairway('x', -1);
stairway('x', 1);
stairway('y', -1);
stairway('y', 1);

// 顶部库库尔坎神庙
a.box('templeShade', 0.32, 0.32, 0.03, 0, 0, TOP + 0.015);          // 庙台
a.box('temple', 0.27, 0.25, 0.16, 0, 0, TOP + 0.11);                // 庙身
// 北面（−x）前廊：蛇柱 + 宽门洞
a.box('dark', 0.05, 0.15, 0.12, -0.135, 0, TOP + 0.09);
for (const sy of [-0.055, 0.055]) a.cyl('serpent', 0.018, 0.021, 0.12, -0.12, sy, TOP + 0.09, 8);
// 其余三面小门洞
a.box('dark', 0.05, 0.07, 0.09, 0.135, 0, TOP + 0.075);
for (const sx of [-0.05, 0.05]) a.box('dark', 0.07, 0.05, 0.09, sx, 0.125, TOP + 0.075);
// 檐口 + 顶饰带
a.box('templeShade', 0.31, 0.29, 0.028, 0, 0, TOP + 0.20);          // 出挑檐口
a.box('comb', 0.27, 0.25, 0.03, 0, 0, TOP + 0.228);                 // 顶饰带
a.box('comb', 0.22, 0.04, 0.05, 0, 0, TOP + 0.258);                 // 屋脊矮饰

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`ChichenItza: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
