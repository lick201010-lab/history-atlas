// 吉萨金字塔群 —— 奇观资产（public/models/great-pyramid.glb）· 重做版。
// 依 Codex GLB QA：旧模型缺少 Giza-specific 辨识度（缺高原台地 / 卫星金字塔 / 暖色石料高光）。
// 本版补齐：
//   · 吉萨石灰岩高原台地（隆起的基座平台，暖沙色，区别于沙漠平地）；
//   · 胡夫金字塔（主塔，20 级砌石带 + 镀金顶石 + 北面入口暗洞）；
//   · 卡夫拉金字塔（16 级砌石带 + 顶部白色覆面石残留——吉萨标志性特征）；
//   · 门卡乌拉金字塔（10 级砌石带）；
//   · 6 座王后小型卫星金字塔（胡夫东侧 3 座 + 门卡乌拉南侧 3 座）；
//   · 胡夫葬祭庙（东侧长方形石构庭院）；
//   · 卡夫拉葬祭庙 + 参道（长堤道）+ 河谷神殿 + 狮身人面像低体量暗示；
//   · 散布的马斯塔巴墓（低矮长方形石墓）。
// 复用 wonderKit；z=上；足迹约 ±0.72；base 贴地（zMin=0）；0 贴图；纯顶点色。
// 运行：node scripts/buildGreatPyramidGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/great-pyramid.glb', import.meta.url);

const COLORS = {
  plateau: 0xd4bb8c,      // 吉萨高原台地（暖沙漠石灰岩）
  limestone: 0xe2cfa0,     // 石灰岩砌块（受光面，暖米白）
  limestoneBand: 0xb99b68, // 砌层暗带（暖砂岩阴影）
  courseLine: 0x8f7246,    // 远景可读的石层腰线
  casingWhite: 0xf0e4c8,   // 卡夫拉覆面石残留（亮白石灰岩）
  temple: 0xcbb280,        // 葬祭庙/神殿石构（暖砂岩）
  gold: 0xc9a14e,          // 镀金顶石 pyramidion（暖暗金）
  dark: 0x3a2f1e,          // 入口暗洞
  shadow: 0x241c12,        // 深阴影
  causeway: 0xd4bd96,      // 堤道/参道路面（稍亮砂岩）
  sphinxBody: 0xd0b882,    // 狮身人面像体量（暖石）
  sphinxTrim: 0xaa8d57,    // 狮身人面像爪/头巾暗边
  mastaba: 0xbfa575,       // 马斯塔巴墓（稍暗砂岩）
};

function material(key) {
  if (key === 'gold') return { metalness: 0.55, roughness: 0.38 };
  if (key === 'casingWhite') return { metalness: 0.02, roughness: 0.78 };
  return { metalness: 0.0, roughness: 0.90 };
}

const a = new WonderAsset({ name: 'GreatPyramid' });

// ============================================================
// 吉萨高原台地 —— 隆起的沙漠石灰岩基座
// ============================================================
const PLAT_Z = 0.025;
a.box('plateau', 1.44, 1.38, 0.05, 0, 0, PLAT_Z);
// 台地四边缓坡（削角过渡，模拟自然岩崖与沙漠的衔接）
for (const [ex, ey, sx, sy] of [
  [-0.72, 0, 0.08, 1.38],
  [0.72, 0, 0.08, 1.38],
  [0, -0.69, 1.44, 0.08],
  [0, 0.69, 1.44, 0.08],
]) {
  a.box('plateau', sx, sy, 0.03, ex, ey, 0.015);
}

const G = 0.05; // 金字塔从台地面起算（台面顶 = 0.05）

function courseRings(cx, cy, baseHalf, height, count, baseZ, { inset = 0.012 } = {}) {
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 1);
    const half = baseHalf * (1 - t) + 0.015;
    const z = baseZ + height * t;
    const thick = 0.008;
    a.box('courseLine', half * 2, thick, thick, cx, cy - half - inset, z);
    a.box('courseLine', half * 2, thick, thick, cx, cy + half + inset, z);
    a.box('courseLine', thick, half * 2, thick, cx - half - inset, cy, z);
    a.box('courseLine', thick, half * 2, thick, cx + half + inset, cy, z);
  }
}

function mastabaCluster(originX, originY, rows, cols, dx, dy) {
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = originX + c * dx + (r % 2) * dx * 0.25;
      const y = originY + r * dy;
      a.box('mastaba', 0.058, 0.038, 0.024, x, y, G + 0.012);
      a.box('courseLine', 0.046, 0.006, 0.006, x, y - 0.018, G + 0.028);
    }
  }
}

// ============================================================
// 胡夫金字塔（大金字塔）—— 最大，最北，20 级砌石带
// ============================================================
const KX = -0.08, KY = -0.12;
a.stepPyramid('limestone', 0.40, 0.57, 20, KX, KY, G, { bandKey: 'limestoneBand' });
a.stepPyramid('gold', 0.04, 0.06, 2, KX, KY, G + 0.54);          // 镀金顶石
a.box('dark', 0.075, 0.025, 0.13, KX, KY - 0.405, G + 0.075);     // 北面入口暗洞
a.box('shadow', 0.12, 0.018, 0.035, KX, KY - 0.418, G + 0.025);   // 入口阴影台阶
courseRings(KX, KY, 0.40, 0.57, 7, G);

// ============================================================
// 卡夫拉金字塔 —— 次大，西南，顶部保留白色覆面石（Giza 标志）
// ============================================================
const KFX = 0.28, KFY = 0.18;
a.stepPyramid('limestone', 0.26, 0.40, 16, KFX, KFY, G, { bandKey: 'limestoneBand' });
// 顶部覆面石残留
a.stepPyramid('casingWhite', 0.06, 0.08, 4, KFX, KFY, G + 0.34, { topHalf: 0.02 });
courseRings(KFX, KFY, 0.26, 0.40, 4, G, { inset: 0.008 });

// ============================================================
// 门卡乌拉金字塔 —— 最小，最西南
// ============================================================
const MKX = 0.22, MKY = 0.48;
a.stepPyramid('limestone', 0.15, 0.22, 10, MKX, MKY, G, { bandKey: 'limestoneBand' });
courseRings(MKX, MKY, 0.15, 0.22, 3, G, { inset: 0.006 });

// ============================================================
// 王后/卫星小金字塔
// ============================================================
// 胡夫东侧三座
for (const qx of [0.16, 0.29, 0.42]) {
  a.stepPyramid('limestoneBand', 0.06, 0.085, 5, qx, -0.47, G);
}
// 门卡乌拉南侧三座
for (const qx of [0.06, 0.16, 0.26]) {
  a.stepPyramid('limestoneBand', 0.048, 0.072, 4, qx, 0.63, G);
}

// ============================================================
// 胡夫葬祭庙 —— 主塔东侧长方形石构（围院 + 内殿）
// ============================================================
a.box('temple', 0.24, 0.18, 0.06, 0.18, -0.06, G + 0.03);
a.box('temple', 0.16, 0.12, 0.045, 0.28, -0.14, G + 0.0225);
a.box('dark', 0.08, 0.06, 0.04, 0.20, -0.06, G + 0.04);          // 内院暗示
a.box('courseLine', 0.27, 0.014, 0.012, 0.18, -0.155, G + 0.068);
a.box('courseLine', 0.014, 0.18, 0.012, 0.31, -0.06, G + 0.068);

// ============================================================
// 卡夫拉葬祭庙 + 参道 + 河谷神殿 + 狮身人面像
// ============================================================
a.box('temple', 0.18, 0.14, 0.05, 0.44, 0.24, G + 0.025);        // 葬祭庙
a.boxRotZ('causeway', 0.34, 0.052, 0.03, 0.58, 0.18, G + 0.015, -0.26); // 参道（向东延伸）
a.boxRotZ('courseLine', 0.35, 0.008, 0.008, 0.58, 0.205, G + 0.035, -0.26);
a.box('temple', 0.12, 0.12, 0.04, 0.70, 0.18, G + 0.02);         // 河谷神殿
// 狮身人面像 —— 卧狮低体量 + 抬头暗示
a.box('sphinxBody', 0.22, 0.07, 0.045, 0.58, 0.035, G + 0.022);  // 狮身
a.box('sphinxTrim', 0.11, 0.018, 0.018, 0.51, -0.012, G + 0.055);
a.box('sphinxTrim', 0.11, 0.018, 0.018, 0.51, 0.082, G + 0.055);
a.box('sphinxBody', 0.052, 0.052, 0.07, 0.45, 0.035, G + 0.058); // 头部
a.box('sphinxTrim', 0.072, 0.018, 0.032, 0.445, 0.035, G + 0.09);
a.box('shadow', 0.006, 0.05, 0.018, 0.419, 0.035, G + 0.066);

// ============================================================
// 散布的马斯塔巴墓（低矮长方形石墓，增加吉萨墓群氛围）
// ============================================================
for (const [mx, my] of [
  [0.44, -0.34], [0.48, -0.26], [0.46, -0.18],
  [-0.40, -0.42], [-0.34, -0.40], [-0.28, -0.42],
  [0.42, 0.56], [0.48, 0.58],
  [-0.44, 0.12], [-0.48, 0.18],
  [0.54, 0.40], [0.56, 0.46],
]) {
  a.box('mastaba', 0.06, 0.04, 0.025, mx, my, G + 0.0125);
}
mastabaCluster(-0.48, -0.52, 2, 4, 0.085, 0.07);
mastabaCluster(0.44, 0.48, 2, 3, 0.075, 0.07);

// 河谷神庙/甬道暗示（连接主塔东南侧的仪式通道）
a.boxRotZ('temple', 0.11, 0.32, 0.03, -0.45, 0.03, G + 0.015, 0.18);
a.box('shadow', 0.05, 0.12, 0.012, -0.45, 0.03, G + 0.036);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
const kb = (stats.bytes / 1024).toFixed(1);
console.log(`GreatPyramid: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${kb} KB`);
