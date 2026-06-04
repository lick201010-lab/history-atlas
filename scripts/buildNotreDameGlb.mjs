// 巴黎圣母院 —— 奇观资产样板（public/models/notre-dame.glb）· 精修版（对齐圣索菲亚细节档）。
// 复用 scripts/lib/wonderKit.mjs：拉丁十字中殿 + 侧廊单坡顶 + 高侧窗带 + 多道飞扶壁（墩+斜券+小尖塔）+
//   西立面双塔（钟层尖券 + 角扶壁 + 顶女儿墙 + 角尖塔）+ 国王廊连拱 + 玫瑰窗及辐射窗棂 +
//   三道深凹尖券门（多层券线）+ 中央尖塔 flèche（八棱 + 卷叶 + 灯亭）+ 东端后殿放射窗。
// 坐标 z=上，足迹约 ±0.6，base 贴地。运行：node scripts/buildNotreDameGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/notre-dame.glb', import.meta.url);

const COLORS = {
  base: 0xc6b99a, stone: 0xcabd9c, stoneShade: 0xb3a786, trim: 0xd7ccb2,
  roof: 0x69736d, spire: 0x59625d, dark: 0x2c2822, rose: 0x3a3550, gold: 0xc9a14e,
};
function material(key) {
  if (key === 'gold') return { metalness: 0.5, roughness: 0.42 };
  return { metalness: 0.0, roughness: 0.85 };
}
const a = new WonderAsset({ name: 'NotreDame' });
const G = 0.05;

// 地面
a.box('base', 1.22, 0.62, 0.05, 0, 0, 0.025);

// 中殿主体 + 陡坡顶
a.box('stone', 0.92, 0.30, 0.42, 0.04, 0, G + 0.21);
a.gable('roof', 0.32, 0.20, 0.92, 0.04, 0, G + 0.42, 'yz');
a.box('spire', 0.94, 0.024, 0.02, 0.04, 0, G + 0.61);            // 屋脊
// 高侧窗带（中殿上层，南北面）
for (const wy of [-0.155, 0.155]) {
  a.windowBand('rose', 'trim', { normal: 'y', wallPos: wy, from: -0.34, to: 0.42, count: 9, z: G + 0.24, w: 0.03, h: 0.15, depth: 0.02, capH: 0.018 });
}

// 侧廊（两侧低矮 + 单坡顶 + 窗带）
for (const s of [-1, 1]) {
  a.box('stoneShade', 0.90, 0.10, 0.26, 0.04, s * 0.205, G + 0.13);
  a.boxRotX('roof', 0.90, 0.13, 0.02, 0.04, s * 0.205, G + 0.32, -s * 0.5);
  a.windowBand('rose', 'trim', { normal: 'y', wallPos: s * 0.258, from: -0.32, to: 0.40, count: 8, z: G + 0.06, w: 0.028, h: 0.14, depth: 0.018, capH: 0.016 });
}

// 飞扶壁（每侧 5 道：扶壁墩 + 斜飞券 + 墩顶小尖塔）
for (const s of [-1, 1]) {
  for (let i = 0; i < 5; i += 1) {
    const bx = -0.30 + i * 0.18;
    a.box('stoneShade', 0.045, 0.05, 0.30, bx, s * 0.30, G + 0.14);
    a.boxRotX('stone', 0.035, 0.16, 0.028, bx, s * 0.235, G + 0.30, s * 0.62);   // 斜飞券
    a.coneUp('spire', 0.022, 0.08, bx, s * 0.30, G + 0.29, 6);                    // 墩顶小尖塔
  }
}

// 翼厅 transept（十字横臂）+ 坡顶 + 山墙玫瑰
a.box('stone', 0.20, 0.58, 0.40, 0.14, 0, G + 0.20);
a.gable('roof', 0.22, 0.16, 0.58, 0.14, 0, G + 0.40, 'xz');
for (const s of [-1, 1]) a.cyl('rose', 0.06, 0.06, 0.02, 0.14, s * 0.295, G + 0.30, 16);
// 东端后殿 chevet + 放射状窗
a.cyl('stone', 0.16, 0.17, 0.36, 0.52, 0, G + 0.18, 18);
a.cyl('roof', 0.10, 0.16, 0.12, 0.52, 0, G + 0.54, 18);
for (let i = 0; i < 7; i += 1) {
  const th = -Math.PI / 2 + (i - 3) * 0.4;
  a.box('rose', 0.03, 0.02, 0.18, 0.52 + Math.cos(th) * 0.16, Math.sin(th) * 0.16, G + 0.18);
}

// ---- 西立面 ----
const FX = -0.44;
a.box('stone', 0.10, 0.46, 0.62, FX, 0, G + 0.31);
// 三道深凹尖券门（多层券线）
for (const dy of [-0.15, 0, 0.15]) {
  const w = dy === 0 ? 0.13 : 0.10;
  a.box('dark', 0.06, w, 0.20, FX - 0.035, dy, G + 0.10);
  a.gable('dark', w, 0.07, 0.06, FX - 0.035, dy, G + 0.20, 'yz');
  a.gable('trim', w + 0.03, 0.09, 0.04, FX - 0.02, dy, G + 0.20, 'yz');   // 券线
}
// 国王廊（一排连拱小龛 + 立像）
for (let i = -6; i <= 6; i += 1) {
  a.box('stone', 0.02, 0.02, 0.06, FX - 0.05, i * 0.034, G + 0.30);
  a.box('dark', 0.015, 0.018, 0.05, FX - 0.052, i * 0.034, G + 0.345);
}
a.box('trim', 0.05, 0.46, 0.02, FX - 0.02, 0, G + 0.385);
// 玫瑰窗 + 辐射窗棂
a.cyl('rose', 0.095, 0.095, 0.03, FX - 0.045, 0, G + 0.46, 24);
a.cyl('trim', 0.115, 0.115, 0.018, FX - 0.04, 0, G + 0.46, 24);
for (let i = 0; i < 16; i += 1) {
  const th = (i / 16) * Math.PI * 2;
  a.box('trim', 0.02, 0.012, 0.012, FX - 0.06, Math.cos(th) * 0.07, G + 0.46 + Math.sin(th) * 0.07);
}
a.box('stoneShade', 0.06, 0.52, 0.05, FX, 0, G + 0.585);          // 顶连廊横饰带

// 双塔（钟层尖券 + 角扶壁 + 女儿墙 + 角尖塔）
for (const ty of [-0.17, 0.17]) {
  a.box('stone', 0.155, 0.155, 0.80, FX, ty, G + 0.40);
  for (const f of [-1, 1]) {                                       // 钟层高尖券
    a.box('dark', 0.03, 0.05, 0.24, FX - f * 0.06, ty, G + 0.46);
    a.box('dark', 0.05, 0.03, 0.24, FX, ty - f * 0.06, G + 0.46);
  }
  for (const cx of [-0.07, 0.07]) for (const cy of [-0.07, 0.07]) {  // 角扶壁
    a.box('stoneShade', 0.025, 0.025, 0.84, FX + cx, ty + cy, G + 0.42);
    a.coneUp('spire', 0.022, 0.09, FX + cx, ty + cy, G + 0.84, 6);   // 角尖塔
  }
  a.box('stoneShade', 0.17, 0.17, 0.03, FX, ty, G + 0.82);          // 顶女儿墙
}

// 中央尖塔 flèche（八棱 + 灯亭 + 卷叶饰 + 金尖）
a.cyl('stone', 0.06, 0.07, 0.06, 0.12, 0, G + 0.45, 8);            // 基座灯亭
for (let i = 0; i < 8; i += 1) {
  const th = (i / 8) * Math.PI * 2;
  a.cyl('stone', 0.01, 0.012, 0.10, 0.12 + Math.cos(th) * 0.05, Math.sin(th) * 0.05, G + 0.50, 6);
}
a.coneUp('spire', 0.055, 0.36, 0.12, 0, G + 0.52, 8);
for (let i = 0; i < 4; i += 1) {                                    // 卷叶 crockets
  const z = G + 0.60 + i * 0.07;
  for (let j = 0; j < 4; j += 1) { const th = j * Math.PI / 2; a.box('spire', 0.018, 0.018, 0.018, 0.12 + Math.cos(th) * (0.04 - i * 0.008), Math.sin(th) * (0.04 - i * 0.008), z); }
}
a.cyl('spire', 0.012, 0.018, 0.06, 0.12, 0, G + 0.87, 8);
a.sphere('gold', 0.016, 0.12, 0, G + 0.92, 8);

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`NotreDame: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
