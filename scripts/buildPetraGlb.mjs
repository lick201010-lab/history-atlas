// 佩特拉 卡兹尼神殿 Al-Khazneh —— 奇观资产样板（public/models/petra.glb）· 精修版。
// 修「竖板感」：把立面凿进崖体的「凹龛」里 —— 左右峡壁与顶部岩檐向前凸出框住立面，
//   柱列/圆亭明显凸出于立面背墙形成进深；两层式（下层柱廊+断山花，上层中央圆亭 tholos+两翼）。
// 复用 scripts/lib/wonderKit.mjs。立面朝 −x，坐标 z=上，足迹约 ±0.46，base 贴地。
// 运行：node scripts/buildPetraGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/petra.glb', import.meta.url);

const COLORS = {
  ground: 0xcdb084,
  rock: 0xbe8453,       // 崖体（背光峡壁）
  rockShade: 0xa46e3f,
  facade: 0xd9a877,     // 凿出的立面背墙（受光，较亮）
  column: 0xdcb084,     // 立柱
  cap: 0xe7c79b,        // 柱头
  dark: 0x2c211a,       // 门洞 / 龛
  gold: 0xb98a4a,
};
function material() { return { metalness: 0.0, roughness: 0.9 }; }
const a = new WonderAsset({ name: 'Petra' });
const G = 0.04;

// 地面
a.box('ground', 0.80, 1.04, 0.04, 0, 0, 0.02);

// ---- 崖体「凹龛」框架（立面凿于其中，靠左右与顶岩前凸制造进深，避免竖板感）----
a.box('rock', 0.30, 0.92, 0.95, 0.32, 0, G + 0.475);              // 背崖（最深）
a.box('rock', 0.22, 0.30, 0.95, 0.06, -0.42, G + 0.475);          // 左峡壁（前凸）
a.box('rockShade', 0.22, 0.30, 0.95, 0.06, 0.42, G + 0.475);      // 右峡壁
a.box('rock', 0.26, 0.80, 0.14, 0.10, 0, G + 0.90);               // 顶部岩檐
a.box('rockShade', 0.16, 0.42, 0.30, 0.16, -0.20, G + 0.86);      // 崖体粗糙错块
a.box('facade', 0.06, 0.66, 0.86, 0.10, 0, G + 0.45);             // 立面背墙（凹于峡壁）

// ---- 下层柱廊（z0.04..0.46）柱身明显凸出背墙 ----
const LX = -0.04;
a.colonnade('column', 'cap', { axis: 'y', from: -0.27, to: 0.27, count: 6, fixed: LX, baseZ: G, h: 0.40, rBot: 0.034, rTop: 0.03, capR: 0.046, capH: 0.03, baseH: 0.022, seg: 12 });
a.box('facade', 0.07, 0.70, 0.065, LX + 0.02, 0, G + 0.45);       // 下层额枋
// 强分层横檐（凸出，强化两层读法）
a.box('cap', 0.11, 0.72, 0.045, LX - 0.01, 0, G + 0.49);
// 高门洞（深凹）+ 门楣小山花
a.box('dark', 0.10, 0.13, 0.30, LX + 0.02, 0, G + 0.15);
a.gable('cap', 0.15, 0.07, 0.06, LX, 0, G + 0.30, 'yz');
// 两侧壁龛 + 立像
for (const sy of [-0.17, 0.17]) {
  a.box('dark', 0.05, 0.07, 0.18, LX + 0.01, sy, G + 0.13);
  a.box('cap', 0.02, 0.022, 0.11, LX - 0.01, sy, G + 0.135);      // 龛中立像
}
// 下层断山花（中央留口给上层圆亭）
for (const sy of [-0.21, 0.21]) a.gable('facade', 0.26, 0.10, 0.08, LX, sy, G + 0.50, 'yz');

// ---- 上层（z0.50..0.86）----
const UZ = G + 0.52;
// 中央圆亭 tholos（明显前凸）
a.cyl('facade', 0.125, 0.13, 0.22, -0.06, 0, UZ + 0.11, 16);
for (let i = 0; i < 6; i += 1) {
  const th = -Math.PI / 2 + (i - 2.5) * 0.36;
  a.cyl('column', 0.02, 0.022, 0.20, -0.06 + Math.cos(th) * 0.115, Math.sin(th) * 0.115, UZ + 0.10, 8);
}
a.coneUp('facade', 0.15, 0.13, -0.06, 0, UZ + 0.22, 16);          // 锥顶
a.cyl('gold', 0.022, 0.032, 0.06, -0.06, 0, UZ + 0.35, 10);       // 瓮饰座
a.sphere('gold', 0.032, -0.06, 0, UZ + 0.42, 10);                 // 瓮
// 两翼（断山花外侧：各 2 柱 + 半山花，略退后）
for (const sy of [-1, 1]) {
  a.colonnade('column', 'cap', { axis: 'y', from: sy * 0.20, to: sy * 0.30, count: 2, fixed: 0.0, baseZ: UZ, h: 0.24, rBot: 0.024, rTop: 0.021, capR: 0.032, capH: 0.022, baseH: 0.016, seg: 8 });
  a.box('facade', 0.05, 0.16, 0.05, 0.0, sy * 0.27, UZ + 0.27);
  a.gable('facade', 0.18, 0.08, 0.06, 0.0, sy * 0.27, UZ + 0.30, 'xz');
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Petra: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
