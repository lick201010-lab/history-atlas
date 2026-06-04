// 泰姬陵 —— 奇观资产样板（public/models/taj-mahal.glb）。
// 复用 scripts/lib/wonderKit.mjs：对称基座/平台 + 八角主体 + 四面尖拱 iwan +
//   鼓座 + 洋葱主穹顶（lathe 非单调轮廓）+ 四角小亭 chhatri + 四座细长尖塔 +
//   两侧红砂岩侧翼建筑（清真寺/答辩厅）。坐标 z=上，足迹约 ±0.65，base 贴地。
// 运行：node scripts/buildTajMahalGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/taj-mahal.glb', import.meta.url);

const COLORS = {
  terrace: 0xd9cdb4,   // 下层砂石台
  plinth: 0xe6ded0,    // 大理石平台
  body: 0xece6d7,      // 白大理石主体
  drum: 0xe2dac8,      // 鼓座
  dome: 0xefe8d9,      // 象牙白洋葱穹顶
  iwan: 0x473c2e,      // 尖拱凹龛（暗）
  minaret: 0xe6dfce,   // 尖塔身
  minaretCap: 0x8f8064,
  chhatri: 0xe6ded0,   // 小亭
  side: 0xa9603f,      // 红砂岩侧翼
  sideDome: 0xb0683f,
  gold: 0xc9a14e,
};

function material(key) {
  if (key === 'gold') return { metalness: 0.55, roughness: 0.4 };
  if (key === 'dome' || key === 'sideDome') return { metalness: 0.0, roughness: 0.55 };
  return { metalness: 0.0, roughness: 0.85 };
}

const a = new WonderAsset({ name: 'TajMahal' });

// 对称基座（底面贴地）
a.box('terrace', 1.40, 1.20, 0.05, 0, 0, 0.025);        // 下层砂石台 z0..0.05
a.box('plinth', 0.98, 0.98, 0.07, 0, 0, 0.085);          // 大理石平台 z0.05..0.12
const P = 0.12;

// 八角主体（thetaStart=π/8 使四个主面朝坐标轴）
a.cyl('body', 0.40, 0.40, 0.42, 0, 0, P + 0.21, 8, Math.PI / 8);  // z0.12..0.54
a.box('plinth', 0.84, 0.84, 0.03, 0, 0, P + 0.435);              // 主体压顶檐

// 四面尖拱 iwan（矩形凹龛 + 尖顶 gable）
const apo = 0.40 * Math.cos(Math.PI / 8);   // 主面到中心距 ~0.37
function iwan(face) {
  if (face === 'x') {
    for (const s of [-1, 1]) {
      a.box('iwan', 0.05, 0.22, 0.30, s * (apo - 0.005), 0, P + 0.15);
      a.gable('iwan', 0.22, 0.10, 0.06, s * (apo - 0.005), 0, P + 0.30, 'yz');
    }
  } else {
    for (const s of [-1, 1]) {
      a.box('iwan', 0.22, 0.05, 0.30, 0, s * (apo - 0.005), P + 0.15);
      a.gable('iwan', 0.22, 0.10, 0.06, 0, s * (apo - 0.005), P + 0.30, 'xz');
    }
  }
}
iwan('x');
iwan('y');

// 鼓座 + 洋葱主穹顶（lathe：先鼓后收的非单调轮廓）
a.cyl('drum', 0.22, 0.24, 0.10, 0, 0, P + 0.48, 24);    // z0.55..0.65
const onion = [
  [0.200, 0.000], [0.235, 0.050], [0.255, 0.105], [0.260, 0.160],
  [0.245, 0.215], [0.205, 0.270], [0.150, 0.315], [0.092, 0.350],
  [0.050, 0.385], [0.022, 0.420], [0.001, 0.450],
];
a.lathe('dome', onion, 0, 0, P + 0.53, 48);             // 底 z0.65，顶 ~1.10
// 顶尖金饰
a.cyl('gold', 0.009, 0.018, 0.12, 0, 0, P + 0.98, 10);
a.sphere('gold', 0.030, 0, 0, P + 1.115, 12);           // ~1.235

// 四角小亭 chhatri（鼓座四周）
for (const [cx, cy] of [[-0.30, -0.30], [0.30, -0.30], [-0.30, 0.30], [0.30, 0.30]]) {
  a.cyl('chhatri', 0.075, 0.080, 0.10, cx, cy, P + 0.49, 8);
  a.latheDome('chhatri', 0.085, cx, cy, P + 0.54, 1.05, 18);
  a.sphere('gold', 0.018, cx, cy, P + 0.66, 10);
}

// 四座细长尖塔（基座站在下层台 z0.05）
for (const [x, y] of [[-0.58, -0.50], [0.58, -0.50], [-0.58, 0.50], [0.58, 0.50]]) {
  a.cyl('minaret', 0.046, 0.054, 0.10, x, y, 0.10, 12);   // 基座
  a.cyl('minaret', 0.030, 0.044, 0.44, x, y, 0.37, 16);   // 第一段 z0.15..0.59
  a.cyl('gold', 0.050, 0.050, 0.022, x, y, 0.605, 16);    // 阳台环
  a.cyl('minaret', 0.026, 0.034, 0.20, x, y, 0.71, 16);   // 第二段 z0.61..0.81
  a.cyl('gold', 0.044, 0.044, 0.020, x, y, 0.825, 16);    // 阳台环
  a.cyl('minaret', 0.022, 0.028, 0.06, x, y, 0.865, 16);  // 第三段
  a.latheDome('chhatri', 0.052, x, y, 0.895, 1.1, 16);    // 顶亭穹
  a.sphere('gold', 0.018, x, y, 0.965, 10);               // 金顶尖
}

// 两侧红砂岩侧翼建筑（清真寺 / 答辩厅 jawab）
for (const s of [-1, 1]) {
  const x = s * 0.60;
  a.box('side', 0.18, 0.62, 0.26, x, 0, 0.05 + 0.13);     // 主体 z0.05..0.31
  a.box('side', 0.20, 0.66, 0.03, x, 0, 0.05 + 0.275);    // 压檐
  a.box('iwan', 0.05, 0.16, 0.18, x - s * 0.085, 0, 0.05 + 0.10); // 朝内拱门暗洞
  a.latheDome('sideDome', 0.12, x, 0, 0.05 + 0.29, 0.9, 24);      // 中央小穹
  for (const dy of [-0.22, 0.22]) a.latheDome('sideDome', 0.05, x, dy, 0.05 + 0.29, 0.95, 14);
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`TajMahal: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
