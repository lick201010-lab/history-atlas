// 罗马斗兽场 —— 奇观资产样板（public/models/colosseum.glb）。
// 复用 scripts/lib/wonderKit.mjs：椭圆环形结构 —— 多层连拱外立面 + 一圈保存较好的
//   内环走廊 + 仅约 40% 弧段仍立的高大四层立面（其余坍塌 → 遗迹感、参差顶沿）+
//   阶梯观众席 cavea + 中央竞技场地面。坐标 z=上，足迹约椭圆 ±0.66/±0.52，base 贴地。
// 运行：node scripts/buildColosseumGlb.mjs

import { WonderAsset } from './lib/wonderKit.mjs';

const OUT = new URL('../public/models/colosseum.glb', import.meta.url);

const COLORS = {
  travertine: 0xd8c9a6, // 外立面石灰华（受光）
  wallShade: 0xc3b187,  // 内环/背光墙
  arch: 0x4a3d2a,       // 拱券洞口（暗）
  seating: 0xcbbb95,    // 观众席 cavea
  arena: 0xcdb07a,      // 竞技场沙地
  ruin: 0xbfae84,       // 残破顶石
};

function material() { return { metalness: 0.0, roughness: 0.9 }; }

const a = new WonderAsset({ name: 'Colosseum' });

const N = 46;            // 环向分段数
const TH = 0.075;        // 墙厚
const TWO_PI = Math.PI * 2;
const ia = 0.585, ib = 0.455;   // 内环走廊椭圆
const oa = 0.66, ob = 0.52;     // 外立面椭圆
function rnd(i) { const x = Math.sin(i * 12.9898 + 1.7) * 43758.5453; return x - Math.floor(x); }

// 一段拱券 bay：切向墙段 + 嵌入的暗色拱洞
function bay(aE, bE, i, z, h, wallKey) {
  const th = (i / N) * TWO_PI;
  const px = aE * Math.cos(th), py = bE * Math.sin(th);
  const tan = Math.atan2(bE * Math.cos(th), -aE * Math.sin(th));
  const nth = ((i + 1) / N) * TWO_PI;
  const chord = Math.hypot(aE * Math.cos(nth) - px, bE * Math.sin(nth) - py) * 1.2;
  a.boxRotZ(wallKey, chord, TH, h, px, py, z + h / 2, tan);
  a.boxRotZ('arch', chord * 0.52, TH * 1.25, h * 0.6, px, py, z + h * 0.46, tan); // 拱洞暗块
}

// 连续基座环（z0 贴地，承托环墙，消除悬空）
a.ellipseRing(oa + 0.012, ob + 0.012, N, 0, TH * 1.7, 1.3, () => ({ height: 0.055, key: 'wallShade' }));
// 竞技场地面（贴地）+ 中央暗格（hypogeum 暗示）
a.cyl('arena', 0.31, 0.32, 0.06, 0, 0, 0.03, 40);
a.box('arch', 0.42, 0.20, 0.012, 0, 0, 0.061);

// 观众席 cavea：自竞技场向外升起的同心椭圆阶梯
a.ellipseRing(0.335, 0.265, 42, 0.05, 0.05, 1.25, () => ({ height: 0.12, key: 'seating' })); // 隔墙 podium
for (let s = 0; s < 3; s += 1) {
  a.ellipseRing(0.40 + s * 0.075, 0.31 + s * 0.062, 44, 0.05, 0.055, 1.25,
    () => ({ height: 0.11 + s * 0.07, key: 'seating' }));
}

// 内环走廊（全周保存）：三层连拱 + 层间束带
const innerTiers = [{ z: 0.05, h: 0.15 }, { z: 0.205, h: 0.15 }, { z: 0.36, h: 0.135 }];
for (let i = 0; i < N; i += 1) {
  for (let t = 0; t < innerTiers.length; t += 1) {
    const { z, h } = innerTiers[t];
    // 顶层（阁楼）参差残破：部分开间降低或缺失
    if (t === 2) {
      const r = rnd(i);
      if (r < 0.30) continue;                 // 缺失
      bay(ia, ib, i, z, h * (0.55 + 0.45 * r), 'ruin');
      continue;
    }
    bay(ia, ib, i, z, h, t === 0 ? 'wallShade' : 'travertine');
  }
}
// 内环层间束带（檐线）
for (const z of [0.20, 0.355]) {
  a.ellipseRing(ia, ib, N, z, TH * 1.15, 1.2, () => ({ height: 0.022, key: 'travertine' }));
}

// 外立面：仅约 40% 弧段仍立（四层），其余坍塌。两端高度收尖做断口。
const outerTiers = [{ z: 0.05, h: 0.15 }, { z: 0.205, h: 0.15 }, { z: 0.36, h: 0.14 }, { z: 0.50, h: 0.11 }];
const standA = 0.55, standB = 0.97;          // 站立弧段（归一化 i/N）
for (let i = 0; i < N; i += 1) {
  const f = i / N;
  if (f <= standA || f >= standB) continue;
  // 断口处高度渐收（端部只剩低层）
  const edge = Math.min(f - standA, standB - f) / 0.10;
  const maxTier = Math.max(1, Math.min(outerTiers.length, Math.round(0.5 + edge * outerTiers.length)));
  for (let t = 0; t < maxTier; t += 1) {
    const { z, h } = outerTiers[t];
    bay(oa, ob, i, z, t === maxTier - 1 ? h * (0.6 + 0.4 * rnd(i + 7)) : h,
      t === outerTiers.length - 1 ? 'ruin' : 'travertine');
  }
}
// 外立面层间束带（仅站立弧段）
for (const z of [0.20, 0.355, 0.50]) {
  a.ellipseRing(oa, ob, N, z, TH * 1.1, 1.2, (i) => {
    const f = i / N;
    return (f > standA && f < standB) ? { height: 0.024, key: 'travertine' } : null;
  });
}

const stats = await a.exportGlb(OUT, { colors: COLORS, material, weld: true });
console.log(`Colosseum: ${stats.materials} mats, ${stats.parts} parts, ~${stats.triangles} tris, z ${stats.zMin.toFixed(2)}..${stats.zMax.toFixed(2)}, ${(stats.bytes / 1024).toFixed(1)} KB`);
