// 吴哥窟 Angkor Wat —— 奇观资产样板（public/models/angkor-wat.glb）· 重做版。
// 依 Codex GLB QA：旧模型太紧凑、缺引道/回廊围合感。本版补齐可识别特征：
//   · 矩形护城河（四边水面，中心岛内坐庙宇）；
//   · 西向长引道（跨河石桥 + 两侧栏柱暗示 naga balustrade）；
//   · 双重回廊外墙（外层 + 内层矩形围合，四面门塔 gopura，西主门最大）；
//   · 内层须弥台（stepPyramid 三层收分）；
//   · 梅花五塔：中央高塔 + 四角塔（分层塔身 + 莲花苞顶 lathe + 金尖），高度层级清晰；
//   · 十字形塔间连廊。
// 复用 wonderKit；z=上；足迹约 ±0.68；base 贴地；0 贴图；纯顶点色。
// 运行：node scripts/buildAngkorWatGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/angkor-wat.glb', import.meta.url);

const COLORS = {
  water: 0x5b7068,       // 护城河（暗绿灰）
  sand: 0xc9b48f,        // 砂岩台基/回廊（受光）
  sandShade: 0xb39f78,   // 背光砂岩 / 砌层暗带
  tower: 0xc2ad84,       // 塔身（暖砂岩）
  lotus: 0xbcab82,       // 莲花苞顶
  dark: 0x3f3324,        // 门洞暗块
  gold: 0xc9a14e,        // 塔尖金饰
  causeway: 0xcfbb98,    // 引道/桥面（稍亮于台基）
  rail: 0xa8946a,        // 引道栏柱（深砂岩）
};

function material(key) {
  if (key === 'gold') return { metalness: 0.5, roughness: 0.40 };
  if (key === 'water') return { metalness: 0.04, roughness: 0.62 };
  return { metalness: 0.0, roughness: 0.88 };
}

const a = new WonderAsset({ name: 'AngkorWat' });

// ============================================================
// 尺寸参数
// ============================================================
const MOAT_OUTER = 0.66;       // 护城河外边半宽
const MOAT_W = 0.07;           // 护城河宽
const ISLE_HALF = MOAT_OUTER - MOAT_W;  // 台基岛半宽 = 0.59
const ISLE_Z = 0.04;           // 岛面高度（贴水面上）
const GW1 = ISLE_HALF - 0.06;  // 外层回廊半宽 = 0.53
const GW2 = GW1 - 0.11;        // 内层回廊半宽 = 0.42

// ============================================================
// 1. 矩形护城河（四边，低贴水面）
// ============================================================
const MOAT_CENTER = MOAT_OUTER - MOAT_W / 2;  // 河段中心距 = 0.625
const MOAT_LEN = MOAT_OUTER * 2 + 0.04;       // 长边总长（略超出，保证角部接合）
const MOAT_INNER_LEN = ISLE_HALF * 2 + 0.04;  // 短边（东西侧）长度

for (const [sx, sy, x, y] of [
  [MOAT_LEN, MOAT_W, 0,  MOAT_CENTER],     // 北河
  [MOAT_LEN, MOAT_W, 0, -MOAT_CENTER],     // 南河
  [MOAT_W, MOAT_INNER_LEN, -MOAT_CENTER, 0], // 西河
  [MOAT_W, MOAT_INNER_LEN,  MOAT_CENTER, 0], // 东河
]) {
  a.box('water', sx, sy, 0.025, x, y, 0.0125);
}

// ============================================================
// 2. 台基岛（矩形，略高于水面）
// ============================================================
a.box('sand', ISLE_HALF * 2, ISLE_HALF * 2, ISLE_Z, 0, 0, ISLE_Z / 2);

// ============================================================
// 3. 西向长引道（跨护城河石桥 + 两侧栏柱）
// ============================================================
const CAUSEWAY_X = -(ISLE_HALF + MOAT_OUTER) / 2;  // 引道中心 x ≈ -0.625
const CAUSEWAY_LEN = MOAT_OUTER - ISLE_HALF + 0.09; // 从岛内到河外 ≈ 0.16
const CAUSEWAY_Y = 0.06;

a.box('causeway', CAUSEWAY_LEN, CAUSEWAY_Y * 2, 0.035, CAUSEWAY_X, 0, ISLE_Z - 0.004);
// 两侧栏柱（简化为 4 对矮柱，暗示 naga balustrade 节奏）
for (const sy of [-1, 1]) {
  for (let i = -2; i <= 2; i += 1) {
    const px = CAUSEWAY_X + i * 0.038;
    a.box('rail', 0.022, 0.022, 0.065, px, sy * (CAUSEWAY_Y + 0.016), ISLE_Z + 0.02);
  }
}

// ============================================================
// 4. 外层回廊（矩形围合，四面连续廊墙）+ 四角角楼
// ============================================================
const G1_Z = ISLE_Z;  // 外层回廊基面

for (const [sx, sy, x, y] of [
  [GW1 * 2, 0.055, 0,  GW1],     // 北廊
  [GW1 * 2, 0.055, 0, -GW1],     // 南廊
  [0.055, GW1 * 2 + 0.01, -GW1, 0],  // 西廊
  [0.055, GW1 * 2 + 0.01,  GW1, 0],  // 东廊
]) {
  a.box('sand', sx, sy, 0.16, x, y, G1_Z + 0.08);
}

// 四角角楼（小塔，较矮，做回廊角部收束）
for (const [cx, cy] of [[-GW1, -GW1], [GW1, -GW1], [-GW1, GW1], [GW1, GW1]]) {
  a.stepPyramid('tower', 0.052, 0.15, 4, cx, cy, G1_Z, { topHalf: 0.028 });
  a.lathe('lotus', [
    [0.038, 0], [0.044, 0.018], [0.030, 0.042], [0.016, 0.068], [0.001, 0.088],
  ], cx, cy, G1_Z + 0.15, 14);
}

// ============================================================
// 5. 四向门塔 gopura（西主门最大 > 东门 > 南北小门）
// ============================================================
function gopura(x, y, halfW, halfD, h, keyOverride) {
  const k = keyOverride || 'sand';
  a.box(k, halfW * 2, halfD * 2, h, x, y, G1_Z + h / 2);
  a.box('dark', halfW * 0.42, halfD * 1.1, h * 0.50, x, y, G1_Z + h * 0.26);
  // 顶冠小莲花
  a.lathe('lotus', [
    [halfW * 0.82, 0], [halfW * 0.90, 0.012], [halfW * 0.56, 0.035],
    [halfW * 0.28, 0.058], [0.001, 0.075],
  ], x, y, G1_Z + h, 14);
}

gopura(-GW1 - 0.02, 0, 0.050, 0.08, 0.26, 'sand');   // 西门（主入口，最大）
gopura( GW1 + 0.02, 0, 0.038, 0.06, 0.20, 'sand');   // 东门
gopura(0, -GW1 - 0.02, 0.032, 0.05, 0.16, 'sand');   // 南门
gopura(0,  GW1 + 0.02, 0.032, 0.05, 0.16, 'sand');   // 北门

// ============================================================
// 6. 内层回廊（第二重矩形围合，更高、更内收）
// ============================================================
const G2_Z = G1_Z + 0.16;

for (const [sx, sy, x, y] of [
  [GW2 * 2, 0.050, 0,  GW2],
  [GW2 * 2, 0.050, 0, -GW2],
  [0.050, GW2 * 2 + 0.01, -GW2, 0],
  [0.050, GW2 * 2 + 0.01,  GW2, 0],
]) {
  a.box('sand', sx, sy, 0.13, x, y, G2_Z + 0.065);
}

// ============================================================
// 7. 内层须弥台（庙山基座，三层收分，中央平台）
// ============================================================
a.stepPyramid('sand', 0.34, 0.22, 3, 0, 0, G2_Z, { bandKey: 'sandShade', topHalf: 0.24 });
const TOP_Z = G2_Z + 0.22;

// ============================================================
// 8. 梅花五塔（中央高塔 + 四角较低塔）+ 十字连廊
// ============================================================

// 十字形塔间连廊（连接中央塔与四角塔，以及四角塔之间）
for (const sgn of [-1, 1]) {
  a.box('sand', 0.28, 0.04, 0.06, sgn * 0.11, 0, TOP_Z + 0.03);     // 东西连廊
  a.box('sand', 0.04, 0.28, 0.06, 0, sgn * 0.11, TOP_Z + 0.03);     // 南北连廊
}

// 塔函数：分层塔身 + 莲花苞顶 + 金尖
function lotusTower(cx, cy, baseZ, baseHalf, totalH) {
  const tierH = totalH * 0.56;
  a.stepPyramid('tower', baseHalf, tierH, 5, cx, cy, baseZ, {
    bandKey: 'sandShade', topHalf: baseHalf * 0.46,
  });
  const capR = baseHalf * 0.68;
  const capH = totalH * 0.44;
  const cz = baseZ + tierH;
  const lotusProfile = [
    [0.78, 0], [1.0, 0.11], [0.90, 0.25], [0.68, 0.42],
    [0.46, 0.60], [0.28, 0.77], [0.12, 0.91], [0.001, 1.0],
  ];
  a.lathe('lotus', lotusProfile.map(([r, h]) => [r * capR, h * capH]), cx, cy, cz, 22);
  a.coneUp('gold', capR * 0.13, totalH * 0.08, cx, cy, cz + capH, 10);
}

// 中央主塔（更高、更粗，绝对优势）
lotusTower(0, 0, TOP_Z, 0.15, 0.72);

// 四角塔（明显更矮）
const CORNER_DIST = 0.225;
for (const [cx, cy] of [
  [-CORNER_DIST, -CORNER_DIST], [CORNER_DIST, -CORNER_DIST],
  [-CORNER_DIST,  CORNER_DIST], [CORNER_DIST,  CORNER_DIST],
]) {
  lotusTower(cx, cy, TOP_Z, 0.082, 0.40);
}

// ============================================================
// 导出
// ============================================================
const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(
  `AngkorWat: ${stats.materials} mats, ${stats.parts} parts, ` +
  `~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ` +
  `${(stats.bytes / 1024).toFixed(1)} KB`,
);
