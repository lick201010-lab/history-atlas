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
  plaza: 0xc8b78e,      // 广场基面
  lime: 0xddc996,       // 石灰岩台体（受光）
  limeShade: 0xac9363,  // 砌层暗带（奇数层）
  seam: 0x5e4a2f,       // 台缘阴影缝
  stair: 0xf0d9a1,      // 台阶踏步，高亮保证地图视角可读
  stairShade: 0x80653d, // 楼梯踏步阴影
  rail: 0xb99f6b,       // 栏墙 alfarda
  temple: 0xd8bd82,     // 顶庙墙体
  templeShade: 0x8b7046,
  dark: 0x24190f,       // 门洞 / 暗龛
  serpent: 0xe0c27f,    // 蛇柱
  comb: 0xc8a96f,       // 顶饰带
};
function material() { return { metalness: 0.0, roughness: 0.9 }; }

const a = new WonderAsset({ name: 'ChichenItza' });

// 广场基面（贴地）
a.box('plaza', 1.38, 1.38, 0.04, 0, 0, 0.02);
const G = 0.04;

// 九级截顶阶梯金字塔
const BH = 0.64, PH = 0.70, TH = 0.18, LAYERS = 9;
a.stepPyramid('lime', BH, PH, LAYERS, 0, 0, G, { bandKey: 'limeShade', topHalf: TH });
const TOP = G + PH;
const faceHalf = (i) => BH + (TH - BH) * (i / LAYERS);

// 每级台缘的暗色阴影缝（四边一圈，制造层理/bevel）
for (let i = 1; i < LAYERS; i += 1) {
  const fh = faceHalf(i);
  const z = G + PH * (i / LAYERS);
  a.box('seam', 2 * fh + 0.026, 0.026, 0.018, 0, -fh, z);
  a.box('seam', 2 * fh + 0.026, 0.026, 0.018, 0, fh, z);
  a.box('seam', 0.026, 2 * fh + 0.026, 0.018, -fh, 0, z);
  a.box('seam', 0.026, 2 * fh + 0.026, 0.018, fh, 0, z);
}

// 四面大台阶（踏步 + 两侧栏墙，全部轴对齐）
function stairway(axis, sign) {
  const N = 15, W = 0.36;
  const uBot = sign * (BH + 0.005), uTop = sign * TH;
  for (let i = 0; i <= N; i += 1) {
    const f = i / N;
    const u = uBot + (uTop - uBot) * f;
    const z = G + (TOP - G) * f;
    if (axis === 'x') {
      a.box(i % 2 ? 'stairShade' : 'stair', 0.078, W, 0.062, u, 0, z + 0.026);
      a.box('stair', 0.084, 0.045, 0.07, u, 0, z + 0.034);
    } else {
      a.box(i % 2 ? 'stairShade' : 'stair', W, 0.078, 0.062, 0, u, z + 0.026);
      a.box('stair', 0.045, 0.084, 0.07, 0, u, z + 0.034);
    }
    for (const s of [-1, 1]) {
      if (axis === 'x') a.box('rail', 0.084, 0.045, 0.11, u, s * (W / 2 + 0.016), z + 0.045);
      else a.box('rail', 0.045, 0.084, 0.11, s * (W / 2 + 0.016), u, z + 0.045);
    }
  }
}
stairway('x', -1);
stairway('x', 1);
stairway('y', -1);
stairway('y', 1);

// 顶部库库尔坎神庙
a.box('templeShade', 0.42, 0.42, 0.04, 0, 0, TOP + 0.02);           // 庙台
a.box('temple', 0.35, 0.32, 0.21, 0, 0, TOP + 0.145);               // 庙身
// 北面（−x）前廊：蛇柱 + 宽门洞
a.box('dark', 0.07, 0.20, 0.16, -0.175, 0, TOP + 0.13);
for (const sy of [-0.075, 0.075]) a.cyl('serpent', 0.024, 0.028, 0.17, -0.153, sy, TOP + 0.13, 8);
// 其余三面小门洞
a.box('dark', 0.065, 0.10, 0.12, 0.175, 0, TOP + 0.11);
for (const sx of [-0.07, 0.07]) {
  a.box('dark', 0.10, 0.065, 0.12, sx, 0.16, TOP + 0.11);
  a.box('dark', 0.10, 0.065, 0.12, sx, -0.16, TOP + 0.11);
}
// 檐口 + 顶饰带
a.box('templeShade', 0.41, 0.38, 0.036, 0, 0, TOP + 0.268);         // 出挑檐口
a.box('comb', 0.35, 0.32, 0.04, 0, 0, TOP + 0.306);                 // 顶饰带
a.box('comb', 0.28, 0.06, 0.07, 0, 0, TOP + 0.362);                 // 屋脊矮饰

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`ChichenItza: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
