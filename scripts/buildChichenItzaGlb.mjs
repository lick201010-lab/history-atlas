// 奇琴伊察 库库尔坎金字塔 El Castillo —— 奇观资产样板（public/models/chichen-itza.glb）。
// 复用 scripts/lib/wonderKit.mjs：九级截顶阶梯金字塔（stepPyramid topHalf）+ 正面大台阶
//   （treads + 坡道 + 栏墙 alfarda）+ 顶部库库尔坎神庙（门洞 + 顶饰 roof comb）+ 广场基面。
// 坐标 z=上，足迹约 ±0.53，base 贴地。运行：node scripts/buildChichenItzaGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/chichen-itza.glb', import.meta.url);

const COLORS = {
  plaza: 0xcabd9c,    // 广场基面
  lime: 0xcdbd98,     // 石灰岩台体（受光）
  limeShade: 0xb6a47b,// 台阶层阴影带
  stair: 0xc6b48f,    // 大台阶
  temple: 0xc9b894,   // 顶庙
  dark: 0x3f3324,     // 门洞 / 暗龛
  comb: 0xbfa97f,     // 屋顶饰带 roof comb
};

function material() { return { metalness: 0.0, roughness: 0.9 }; }

const a = new WonderAsset({ name: 'ChichenItza' });

// 广场基面（贴地）
a.box('plaza', 1.08, 1.08, 0.04, 0, 0, 0.02);
const G = 0.04;

// 九级截顶阶梯金字塔
const BH = 0.46, PH = 0.50, TH = 0.13;     // 底半宽 / 总高 / 顶台半宽
a.stepPyramid('lime', BH, PH, 9, 0, 0, G, { bandKey: 'limeShade', topHalf: TH });
const TOP = G + PH;                          // 顶台面 z

// 顶部神庙
a.box('temple', 0.24, 0.24, 0.14, 0, 0, TOP + 0.07);
a.box('temple', 0.27, 0.27, 0.025, 0, 0, TOP + 0.152);   // 庙顶板
a.box('dark', 0.03, 0.09, 0.10, -0.12, 0, TOP + 0.05);   // 西向门洞
a.box('comb', 0.035, 0.20, 0.07, 0.04, 0, TOP + 0.20);   // 屋脊饰 roof comb

// 正面（−x）大台阶：坡道 + 踏步 + 两侧栏墙
const xBot = -BH, zBot = G, xTop = -TH, zTop = TOP;
const run = xTop - xBot, rise = zTop - zBot;             // 0.33 / 0.50
const rampLen = Math.hypot(run, rise);
const ang = Math.atan2(rise, run);
// 坡道底（填实，避免踏步间漏空）；boxRotY 让 +x 端升高 → ry = -(π/2 - ang)... 用 bbox 校准过：
a.boxRotY('stair', rampLen, 0.20, 0.03, (xBot + xTop) / 2, 0, (zBot + zTop) / 2, -(Math.PI / 2 - ang));
// 踏步
const N = 11;
for (let i = 0; i <= N; i += 1) {
  const f = i / N;
  a.box('stair', 0.05, 0.18, 0.045, xBot + run * f, 0, zBot + rise * f + 0.02);
}
// 两侧栏墙 alfarda
for (const sy of [-0.115, 0.115]) {
  a.boxRotY('limeShade', rampLen, 0.04, 0.07, (xBot + xTop) / 2, sy, (zBot + zTop) / 2 + 0.02, -(Math.PI / 2 - ang));
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`ChichenItza: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
