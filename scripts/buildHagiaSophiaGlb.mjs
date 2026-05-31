// 生成圣索菲亚大教堂的 stylized low-poly GLB 资产（public/models/hagia-sophia.glb）。
//
// 目标：博物馆微缩模型质感的奇观，而非简单程序方块。包含 ——
//   中央大穹顶（顶金尖）+ 东西半穹顶 + 四角小半穹（exedra）+ 侧翼小穹顶群 +
//   四根高细宣礼塔（塔身/双阳台环/分层尖顶）+ 主巴西利卡体块 + 南北侧廊 +
//   东端半圆后殿 + 四角扶壁墩 + 拱窗/拱廊暗块 + 鼓座窗墩一圈 + 檐口线 +
//   台基与西端门廊台阶。16 个材质分区 + 顶点色 AO（底暗顶亮、朝下面压暗）增强体积层次。
//
// 坐标系与程序化 builder 一致：z = 上，足迹约 ±0.7，base 贴地（z≥0），
//   故在 createBuildingLayer 里替换程序化体块后位置/朝向/贴地不变。
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

// 16 个材质分区（dark 主题下各保留本色 → 明暗/色彩层次；顶点色 AO 再叠一层体积感）
const COLORS = {
  podium: 0xb9a988,     // 台基（暖石，偏深）
  stair: 0xc6b794,      // 门廊台阶
  wall: 0xdbcfb4,       // 主体石墙（受光）
  wallShade: 0xc3b596,  // 背光墙/侧廊
  arch: 0x7c6a4e,       // 拱窗/门洞/拱廊暗块（深褐 → 立体凹陷感）
  buttress: 0xccbe9f,   // 扶壁墩
  cornice: 0xe6dcc4,    // 檐口/墙垛（最浅）
  apse: 0xcabd9e,       // 东端后殿
  semidome: 0xcdbf9f,   // 东西半穹顶
  exedra: 0xc7b896,     // 四角小半穹
  drum: 0xd3c6a8,       // 中央穹顶鼓座
  dome: 0xa9b4c0,       // 中央大穹顶（铅灰）
  smallDome: 0x9fb0bc,  // 侧翼小穹顶群
  minaret: 0xe7e0cf,    // 宣礼塔身（浅）
  minaretCap: 0x8f8064, // 宣礼塔尖顶（深）
  gold: 0xc9a14e,       // 金顶尖/球/阳台环
};

// 收集 {geometry, key} 后按材质合并，每种材质一个 mesh（少 draw call）。
const buckets = {};
function pushGeom(geometry, key) { (buckets[key] ||= []).push(geometry); }

function addBox(key, sx, sy, sz, x, y, z) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.translate(x, y, z);
  pushGeom(g, key);
}
// 轴向沿 z 的柱体（rotateX 把默认 y 轴立起来）
function addCyl(key, rTop, rBot, h, x, y, z, seg = 24) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  pushGeom(g, key);
}
function coneUp(r, h, x, y, z, seg) {
  const g = new THREE.ConeGeometry(r, h, seg);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z + h / 2);
  return g;
}
function addConeUp(key, r, h, x, y, z, seg = 24) { pushGeom(coneUp(r, h, x, y, z, seg), key); }
// 半球穹顶：底在 z，向上鼓起；scaleZ 压扁
function addDome(key, r, x, y, z, scaleZ = 1, segW = 32, segH = 18) {
  const g = new THREE.SphereGeometry(r, segW, segH, 0, Math.PI * 2, 0, Math.PI / 2);
  g.scale(1, 1, scaleZ);
  // SphereGeometry 默认 y 为极轴；旋转使极轴朝 +z
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  pushGeom(g, key);
}
function addSphere(key, r, x, y, z, seg = 14) {
  const g = new THREE.SphereGeometry(r, seg, seg);
  g.translate(x, y, z);
  pushGeom(g, key);
}

// ============================================================
// 台基 + 西端门廊台阶
// ============================================================
addBox('podium', 1.42, 1.08, 0.10, 0, 0, 0.05);
addBox('podium', 1.28, 0.96, 0.06, 0, 0, 0.13);
// 西端入口台阶（三级）
addBox('stair', 0.10, 0.74, 0.04, -0.72, 0, 0.02);
addBox('stair', 0.10, 0.66, 0.04, -0.66, 0, 0.06);
addBox('stair', 0.12, 0.60, 0.04, -0.60, 0, 0.10);
// 西端门廊（narthex）低体块 + 三道拱门暗块
addBox('wallShade', 0.16, 0.80, 0.34, -0.56, 0, 0.30);
for (const y of [-0.22, 0, 0.22]) addBox('arch', 0.06, 0.12, 0.20, -0.485, y, 0.24);

// ============================================================
// 主巴西利卡体块 + 南北侧廊 + 拱窗
// ============================================================
addBox('wall', 0.80, 0.76, 0.54, 0, 0, 0.43);          // 中殿主墙
addBox('cornice', 0.86, 0.82, 0.04, 0, 0, 0.71);        // 中殿檐口
for (const y of [-0.42, 0.42]) {
  addBox('wallShade', 1.06, 0.22, 0.36, 0, y, 0.31);    // 南北侧廊
  addBox('cornice', 1.10, 0.26, 0.03, 0, y, 0.50);      // 侧廊檐口
  // 侧廊坡顶（压扁四坡锥）
  addConeUp('wallShade', 0.20, 0.10, 0, y, 0.51, 4);
  // 侧廊一排拱窗暗块
  for (let i = -4; i <= 4; i += 1) {
    addBox('arch', 0.045, 0.04, 0.16, i * 0.105, y - Math.sign(y) * 0.115, 0.30);
  }
}
// 中殿一排高拱窗（南北面）
for (const y of [-0.40, 0.40]) {
  for (let i = -2; i <= 2; i += 1) addBox('arch', 0.05, 0.03, 0.22, i * 0.16, y, 0.50);
}

// ============================================================
// 四角扶壁墩（抵御穹顶侧推力 —— 圣索菲亚标志性厚墩）
// ============================================================
for (const [x, y] of [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]]) {
  addBox('buttress', 0.15, 0.15, 0.56, x, y, 0.34);
  addConeUp('cornice', 0.12, 0.08, x, y, 0.62, 4); // 墩顶小帽
}
// 外侧扶壁飞券暗示（南北各两道斜墩）
for (const y of [-0.55, 0.55]) {
  for (const x of [-0.22, 0.22]) addBox('buttress', 0.10, 0.10, 0.40, x, y, 0.26);
}

// ============================================================
// 东端半圆后殿（apse）
// ============================================================
addCyl('apse', 0.26, 0.28, 0.40, 0.50, 0, 0.30, 20);
addDome('apse', 0.26, 0.50, 0, 0.50, 0.7, 20, 12);

// ============================================================
// 东西半穹顶 + 其下拱墙
// ============================================================
for (const sgn of [-1, 1]) {
  addBox('wall', 0.18, 0.62, 0.44, sgn * 0.46, 0, 0.36);            // 半穹下拱墙
  addDome('semidome', 0.34, sgn * 0.37, 0, 0.50, 0.74, 30, 18);     // 半穹
}

// ============================================================
// 四角小半穹（exedra）—— 半穹两侧的小型半圆龛
// ============================================================
for (const [x, y] of [[-0.50, -0.22], [-0.50, 0.22], [0.50, -0.22], [0.50, 0.22]]) {
  addDome('exedra', 0.17, x, y, 0.40, 0.78, 20, 12);
}

// ============================================================
// 侧翼小穹顶群（南北附属建筑顶部）
// ============================================================
for (const [x, y] of [[-0.20, -0.50], [0.20, -0.50], [-0.20, 0.50], [0.20, 0.50]]) {
  addCyl('drum', 0.10, 0.105, 0.06, x, y, 0.50, 16);
  addDome('smallDome', 0.11, x, y, 0.55, 0.85, 20, 12);
}

// ============================================================
// 中央穹顶：鼓座 + 一圈窗墩/窗洞 + 大穹顶 + 金尖
// ============================================================
addCyl('drum', 0.38, 0.40, 0.20, 0, 0, 0.72, 40);
const drumWin = 20;
for (let i = 0; i < drumWin; i += 1) {
  const a = (i / drumWin) * Math.PI * 2;
  const c = Math.cos(a), s = Math.sin(a);
  addBox('arch', 0.035, 0.035, 0.15, c * 0.40, s * 0.40, 0.72);   // 窗洞暗块
  const a2 = ((i + 0.5) / drumWin) * Math.PI * 2;
  addBox('cornice', 0.03, 0.03, 0.18, Math.cos(a2) * 0.41, Math.sin(a2) * 0.41, 0.72); // 窗间柱
}
addCyl('cornice', 0.42, 0.42, 0.03, 0, 0, 0.83, 40);               // 鼓座顶檐
addDome('dome', 0.40, 0, 0, 0.84, 0.82, 64, 36);                   // 中央大穹顶（高分段）
// 穹顶金尖
addSphere('gold', 0.045, 0, 0, 0.84 + 0.40 * 0.82, 16);
addConeUp('gold', 0.03, 0.14, 0, 0, 0.84 + 0.40 * 0.82 + 0.02, 12);

// ============================================================
// 四根宣礼塔（细高 + 双阳台环 + 分层尖顶 + 金顶尖）
// ============================================================
for (const [x, y] of [[-0.62, -0.48], [0.62, -0.48], [-0.62, 0.48], [0.62, 0.48]]) {
  addCyl('minaret', 0.050, 0.064, 0.66, x, y, 0.39, 16);   // 第一段塔身
  addCyl('gold', 0.078, 0.078, 0.045, x, y, 0.72, 16);     // 第一阳台环
  addCyl('minaret', 0.044, 0.050, 0.24, x, y, 0.86, 16);   // 第二段
  addCyl('gold', 0.060, 0.060, 0.035, x, y, 0.99, 16);     // 第二阳台环
  addCyl('minaret', 0.038, 0.042, 0.10, x, y, 1.06, 16);   // 第三段（短）
  addConeUp('minaretCap', 0.052, 0.30, x, y, 1.11, 16);    // 铅笔尖顶
  addSphere('gold', 0.022, x, y, 1.43, 10);                // 金顶尖
}

// ============================================================
// 合并 + 顶点色 AO + 导出
// ============================================================

function smooth01(t) { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); }

// 按高度做 AO 灰度：底暗顶亮；朝下的面再压暗，制造暗角/凹缝体积感。
function applyVertexAO(geom, zMin, zMax) {
  const pos = geom.attributes.position;
  const nrm = geom.attributes.normal;
  const n = pos.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) {
    const z = pos.getZ(i);
    let v = 0.52 + 0.48 * smooth01((z - zMin) / (zMax - zMin));
    if (nrm) {
      const nz = nrm.getZ(i);
      if (nz < -0.15) v *= 0.74;        // 朝下面（檐下/出挑底）压暗
      else if (nz > 0.6) v *= 1.04;     // 朝上面略提亮
    }
    v = Math.max(0, Math.min(1, v));
    col[i * 3] = v; col[i * 3 + 1] = v; col[i * 3 + 2] = v;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

// 全模型 z 范围
let zMin = Infinity, zMax = -Infinity;
for (const geoms of Object.values(buckets)) {
  for (const g of geoms) {
    g.computeBoundingBox();
    zMin = Math.min(zMin, g.boundingBox.min.z);
    zMax = Math.max(zMax, g.boundingBox.max.z);
  }
}

const scene = new THREE.Scene();
scene.name = 'HagiaSophia';
let parts = 0;
let triangles = 0;
for (const [key, geoms] of Object.entries(buckets)) {
  parts += geoms.length;
  const merged = mergeGeometries(geoms, false);
  if (!merged) throw new Error(`merge failed for ${key}`);
  merged.computeVertexNormals();
  applyVertexAO(merged, zMin, zMax);
  const idx = merged.getIndex();
  triangles += (idx ? idx.count : merged.attributes.position.count) / 3;
  const material = new THREE.MeshStandardMaterial({
    color: COLORS[key],
    vertexColors: true,
    metalness: key === 'gold' ? 0.55 : 0.0,
    roughness: key === 'gold' ? 0.38 : key === 'dome' || key === 'smallDome' ? 0.5 : 0.85,
  });
  material.name = key;
  const mesh = new THREE.Mesh(merged, material);
  mesh.name = `part-${key}`;
  scene.add(mesh);
}

console.log(`Built Hagia Sophia: ${Object.keys(buckets).length} materials, ${parts} parts, ~${Math.round(triangles)} triangles, z ${zMin.toFixed(2)}..${zMax.toFixed(2)}`);

await mkdir(OUT_DIR, { recursive: true });
const exporter = new GLTFExporter();
exporter.parse(
  scene,
  async (result) => {
    const buf = Buffer.from(result);
    await writeFile(OUT, buf);
    console.log(`Wrote ${(buf.length / 1024).toFixed(1)} KB → ${new URL(OUT).pathname}`);
  },
  (err) => { console.error('GLTF export error:', err); process.exit(1); },
  { binary: true, onlyVisible: false },
);
