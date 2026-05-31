// 生成圣索菲亚大教堂的低多边形 GLB 资产（public/models/hagia-sophia.glb）。
//
// 目标：比运行时的程序化"积木"明显精细 —— 中央大穹顶 + 东西半穹顶 + 多层体块 +
//   四根宣礼塔 + 拱廊/扶壁/台基 + 简单材质分色（石墙 / 台基 / 铅灰穹顶 / 宣礼塔 / 鎏金顶尖）。
//
// 坐标系与程序化 builder 一致：z = 上，足迹约 ±0.65，base 贴地（z≥0），
//   这样在 createBuildingLayer 里替换程序化体块后位置/朝向不变，模型贴地不悬空。
//
// 运行：node scripts/buildHagiaSophiaGlb.mjs

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { writeFile, mkdir } from 'node:fs/promises';

// GLTFExporter 的二进制路径用浏览器的 FileReader 把 Blob 读成 ArrayBuffer。
// Node 18+ 有全局 Blob，但没有 FileReader —— 用 Blob.arrayBuffer() 补一个最小实现。
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (typeof this.onloadend === 'function') this.onloadend();
      });
    }
  };
}

const OUT_DIR = new URL('../public/models/', import.meta.url);
const OUT = new URL('../public/models/hagia-sophia.glb', import.meta.url);

// 材质分色（在 dark 主题下各材质保留本色 → 形成明暗/色彩层次）
const COLORS = {
  podium: 0xc4b596,   // 台基（暖石）
  wall: 0xd9ccb0,     // 主体石墙
  buttress: 0xc9bb9d, // 扶壁/侧廊
  semidome: 0xcfc1a3, // 半穹顶
  drum: 0xd2c4a6,     // 鼓座
  dome: 0xaab4c0,     // 中央大穹顶（铅灰）
  minaret: 0xe6dfce,  // 宣礼塔塔身
  gold: 0xc9a14e,     // 顶尖/阳台鎏金
};

// 收集 {geometry, key} 后按材质合并，每种材质一个 mesh（少 draw call）。
const buckets = {};
function add(geometry, key, { pos = [0, 0, 0], rotX = 0, scale = [1, 1, 1] } = {}) {
  geometry.scale(scale[0], scale[1], scale[2]);
  if (rotX) geometry.rotateX(rotX);
  geometry.translate(pos[0], pos[1], pos[2]);
  (buckets[key] ||= []).push(geometry);
}

// ---- 台基（巴西利卡，东西略长）----
add(new THREE.BoxGeometry(1.34, 1.02, 0.14), 'podium', { pos: [0, 0, 0.07] });
add(new THREE.BoxGeometry(1.20, 0.90, 0.06), 'podium', { pos: [0, 0, 0.17] });

// ---- 南北侧廊（较低体块）+ 拱廊柱列（台基四周小柱，读作连拱廊）----
for (const y of [-0.40, 0.40]) {
  add(new THREE.BoxGeometry(1.02, 0.24, 0.30), 'buttress', { pos: [0, y, 0.30] });
  // 侧廊坡顶（压扁四坡）
  add(new THREE.ConeGeometry(0.20, 0.12, 4), 'wall',
    { rotX: 0, pos: [0, y, 0.51], scale: [2.6, 0.62, 1] });
}
// 连拱廊：沿东西向两排小柱
for (let i = -3; i <= 3; i += 1) {
  for (const y of [-0.52, 0.52]) {
    add(new THREE.CylinderGeometry(0.028, 0.032, 0.26, 8), 'buttress',
      { rotX: Math.PI / 2, pos: [i * 0.155, y, 0.20] });
  }
}

// ---- 中殿核心方体（承托中央穹顶的方形基座）----
add(new THREE.BoxGeometry(0.70, 0.70, 0.50), 'wall', { pos: [0, 0, 0.39] });
// 四角扶壁墩（抵御穹顶侧推力 —— 圣索菲亚的标志性厚墩）
for (const [x, y] of [[-0.33, -0.33], [0.33, -0.33], [-0.33, 0.33], [0.33, 0.33]]) {
  add(new THREE.BoxGeometry(0.14, 0.14, 0.46), 'buttress', { pos: [x, y, 0.30] });
}

// ---- 东西两座半穹顶（紧贴中央穹顶，略低）----
for (const sgn of [-1, 1]) {
  add(new THREE.SphereGeometry(0.33, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2), 'semidome',
    { scale: [1, 1, 0.72], pos: [sgn * 0.36, 0, 0.46] });
  // 半穹顶下的拱形墙面
  add(new THREE.BoxGeometry(0.20, 0.60, 0.40), 'wall', { pos: [sgn * 0.46, 0, 0.34] });
}

// ---- 中央穹顶鼓座 + 一圈窗墩 ----
add(new THREE.CylinderGeometry(0.37, 0.39, 0.18, 36), 'drum',
  { rotX: Math.PI / 2, pos: [0, 0, 0.70] });
// 鼓座窗间柱（40 扇窗的简化：一圈小柱）
const winN = 16;
for (let i = 0; i < winN; i += 1) {
  const a = (i / winN) * Math.PI * 2;
  add(new THREE.BoxGeometry(0.03, 0.03, 0.16), 'wall',
    { pos: [Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0.70] });
}

// ---- 中央大穹顶（招牌扁半球）----
add(new THREE.SphereGeometry(0.39, 40, 22, 0, Math.PI * 2, 0, Math.PI / 2), 'dome',
  { scale: [1, 1, 0.82], pos: [0, 0, 0.78] });
// 穹顶顶尖（鎏金）
add(new THREE.SphereGeometry(0.04, 12, 10), 'gold', { pos: [0, 0, 0.78 + 0.39 * 0.82] });
add(new THREE.ConeGeometry(0.025, 0.12, 10), 'gold', { pos: [0, 0, 0.78 + 0.39 * 0.82 + 0.09] });

// ---- 四角宣礼塔（细高 + 阳台环 + 铅笔尖顶）----
for (const [x, y] of [[-0.60, -0.46], [0.60, -0.46], [-0.60, 0.46], [0.60, 0.46]]) {
  add(new THREE.CylinderGeometry(0.045, 0.058, 1.04, 16), 'minaret',
    { rotX: Math.PI / 2, pos: [x, y, 0.52] });
  add(new THREE.CylinderGeometry(0.072, 0.072, 0.045, 16), 'gold',
    { rotX: Math.PI / 2, pos: [x, y, 0.88] });
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.10, 16), 'minaret',
    { rotX: Math.PI / 2, pos: [x, y, 0.95] });
  add(new THREE.ConeGeometry(0.06, 0.30, 16), 'gold', { pos: [x, y, 1.18] });
}

// ---- 组装 scene：每种材质合并成一个 mesh ----
const scene = new THREE.Scene();
scene.name = 'HagiaSophia';
for (const [key, geoms] of Object.entries(buckets)) {
  const merged = mergeGeometries(geoms, false);
  if (!merged) throw new Error(`merge failed for ${key}`);
  merged.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: COLORS[key],
    metalness: key === 'gold' ? 0.5 : 0.0,
    roughness: key === 'dome' ? 0.55 : key === 'gold' ? 0.4 : 0.85,
  });
  material.name = key;
  const mesh = new THREE.Mesh(merged, material);
  mesh.name = `part-${key}`;
  scene.add(mesh);
}

const totalVerts = Object.values(buckets)
  .flat()
  .reduce((s, g) => s + (g.attributes.position?.count || 0), 0);
console.log(`Built Hagia Sophia: ${scene.children.length} material groups, ~${totalVerts} vertices`);

await mkdir(OUT_DIR, { recursive: true });
const exporter = new GLTFExporter();
exporter.parse(
  scene,
  async (result) => {
    const buf = Buffer.from(result);
    await writeFile(OUT, buf);
    console.log(`Wrote ${(buf.length / 1024).toFixed(1)} KB → ${new URL(OUT).pathname}`);
  },
  (err) => {
    console.error('GLTF export error:', err);
    process.exit(1);
  },
  { binary: true, onlyVisible: false },
);
