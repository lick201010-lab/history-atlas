// 佩特拉 卡兹尼神殿 Al-Khazneh —— 奇观资产样板（public/models/petra.glb）。
// 复用 scripts/lib/wonderKit.mjs：凿入崖体的立面 —— 崖体岩块（背衬）+ 下层柱廊 + 额枋 +
//   断山花 + 上层中央圆亭 tholos（锥顶 + 瓮饰）+ 两翼半山花 + 高门洞。
// 坐标 z=上，足迹约 ±0.5，base 贴地。立面朝 −x。运行：node scripts/buildPetraGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/petra.glb', import.meta.url);

const COLORS = {
  ground: 0xcdb084,
  rock: 0xbe8453,       // 玫瑰红砂岩崖体（背光）
  rockShade: 0xa46e3f,
  facade: 0xd29f6d,     // 凿出的立面（受光，较亮）
  column: 0xd6a878,     // 立柱
  dark: 0x2c211a,       // 门洞 / 龛
  gold: 0xb98a4a,
};

function material() { return { metalness: 0.0, roughness: 0.9 }; }

const a = new WonderAsset({ name: 'Petra' });

// 地面（贴地）
a.box('ground', 0.78, 1.04, 0.04, 0, 0, 0.02);
const G = 0.04;

// 崖体岩块（立面凿于其 −x 面；做两块错落更像天然崖壁）
a.box('rock', 0.44, 0.92, 0.94, 0.26, 0, G + 0.47);
a.box('rockShade', 0.30, 0.70, 0.86, 0.40, 0.10, G + 0.45);
// 立面主背墙（−x 面，略亮）
a.box('facade', 0.08, 0.74, 0.84, 0.03, 0, G + 0.42);

// ---- 下层柱廊 ----
const LX = -0.02;                         // 柱列 x
for (const y of [-0.30, -0.18, -0.06, 0.06, 0.18, 0.30]) {
  a.cyl('column', 0.032, 0.038, 0.42, LX, y, G + 0.21, 12);
  a.cyl('facade', 0.044, 0.036, 0.03, LX, y, G + 0.435, 12);   // 柱头
}
a.box('facade', 0.07, 0.74, 0.07, LX + 0.01, 0, G + 0.485);     // 下层额枋
// 下层断山花（中央留口给上层圆亭）
for (const sy of [-0.22, 0.22]) a.gable('facade', 0.28, 0.10, 0.08, LX, sy, G + 0.52, 'yz');
// 高门洞
a.box('dark', 0.05, 0.14, 0.30, LX - 0.02, 0, G + 0.16);

// ---- 上层 ----
const UZ = G + 0.52;
// 中央圆亭 tholos
a.cyl('facade', 0.13, 0.135, 0.22, -0.03, 0, UZ + 0.11, 16);
for (let i = 0; i < 6; i += 1) {
  const th = -Math.PI / 2 + (i - 2.5) * 0.34;
  a.cyl('column', 0.022, 0.024, 0.20, -0.03 + Math.cos(th) * 0.115 - 0.02, Math.sin(th) * 0.115, UZ + 0.10, 8);
}
a.coneUp('facade', 0.155, 0.12, -0.03, 0, UZ + 0.22, 16);       // 锥顶
a.cyl('gold', 0.02, 0.03, 0.06, -0.03, 0, UZ + 0.34, 10);       // 瓮饰
a.sphere('gold', 0.03, -0.03, 0, UZ + 0.40, 10);
// 两翼半山花块（断山花外侧）
for (const sy of [-1, 1]) {
  a.box('facade', 0.07, 0.18, 0.30, 0.0, sy * 0.27, UZ + 0.15);
  a.gable('facade', 0.18, 0.08, 0.07, 0.0, sy * 0.27, UZ + 0.30, 'xz');
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Petra: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
