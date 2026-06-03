import * as THREE from 'three';
import maplibregl from 'maplibre-gl';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MODEL_PROFILE_KEYS, assertProfileCoverage } from './modelProfileKeys.js';

function colorToNumber(color) {
  if (typeof color === 'number') return color;
  return Number.parseInt(color.replace('#', ''), 16);
}

/* ============================================================
 * Mesh builders per landmark type. Each builder takes (material)
 * and returns an array of meshes to be added to the building group.
 * Local frame: z = up, model normalized to ~ ±0.7 in xy and 0..1 in z.
 * Scale factor is applied per-instance via mercator units, so geometry
 * units here are "relative model units", not meters.
 * ============================================================ */

function buildPyramid(mat) {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1, 4), mat);
  cone.position.z = 0.55;
  cone.rotation.y = Math.PI / 4;
  return [cone];
}

function buildPalace(mat) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.3), mat);
  base.position.z = 0.15;
  const mid = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.5), mat);
  mid.position.z = 0.55;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.6, 4), mat);
  roof.position.z = 1.1;
  roof.rotation.y = Math.PI / 4;
  return [base, mid, roof];
}

function buildArena(mat) {
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.7, 28, 1, true), mat);
  outer.rotation.x = Math.PI / 2;
  outer.position.z = 0.35;
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.5, 24, 1, true), mat);
  inner.rotation.x = Math.PI / 2;
  inner.position.z = 0.25;
  return [outer, inner];
}

function buildTemple(mat) {
  const meshes = [];
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.18), mat);
  base.position.z = 0.09;
  meshes.push(base);
  for (let i = -2; i <= 2; i += 1) {
    for (const y of [-0.35, 0.35]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 10), mat);
      col.rotation.x = Math.PI / 2;
      col.position.set(i * 0.26, y, 0.53);
      meshes.push(col);
    }
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 0.12), mat);
  roof.position.z = 0.94;
  const pediment = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.25, 3), mat);
  pediment.rotation.x = Math.PI / 2;
  pediment.position.z = 1.12;
  meshes.push(roof, pediment);
  return meshes;
}

function buildMausoleum(mat) {
  const meshes = [];
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.22), mat);
  base.position.z = 0.11;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.35), mat);
  body.position.z = 0.4;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.z = 0.58;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 8), mat);
  spire.position.z = 1.05;
  meshes.push(base, body, dome, spire);
  for (const [x, y] of [[-0.48, -0.48], [0.48, -0.48], [-0.48, 0.48], [0.48, 0.48]]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 10), mat);
    tower.rotation.x = Math.PI / 2;
    tower.position.set(x, y, 0.43);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), mat);
    cap.position.set(x, y, 0.95);
    meshes.push(tower, cap);
  }
  return meshes;
}

function buildWall(mat) {
  // Long thin wall section with crenellations.
  const meshes = [];
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.4), mat);
  body.position.z = 0.2;
  meshes.push(body);
  // Crenellations
  for (let i = -4; i <= 4; i += 1) {
    const cren = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.12), mat);
    cren.position.set(i * 0.2, 0, 0.46);
    meshes.push(cren);
  }
  // Two corner towers
  for (const x of [-0.85, 0.85]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.7), mat);
    tower.position.set(x, 0, 0.35);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.08), mat);
    cap.position.set(x, 0, 0.74);
    meshes.push(tower, cap);
  }
  return meshes;
}

function buildMosque(mat) {
  // Central dome + 2 minarets.
  const meshes = [];
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.22), mat);
  base.position.z = 0.11;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.45), mat);
  body.position.z = 0.45;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.z = 0.68;
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), mat);
  finial.position.z = 1.2;
  meshes.push(base, body, dome, finial);
  for (const x of [-0.55, 0.55]) {
    const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.0, 12), mat);
    minaret.rotation.x = Math.PI / 2;
    minaret.position.set(x, 0.55, 0.5);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 10), mat);
    cap.position.set(x, 0.55, 1.13);
    meshes.push(minaret, cap);
  }
  return meshes;
}

function buildCathedral(mat) {
  // 哥特式大教堂：中殿 + 南北侧廊 + 十字耳堂 + 陡坡顶 + 西立面双塔尖 +
  // 交叉塔小尖塔（flèche）+ 东端半圆后殿。比旧版（裸方块 + 单尖）精度高得多。
  const meshes = [];
  // 中殿（沿 X 向延伸的主体）
  const nave = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.46, 0.52), mat);
  nave.position.set(0.02, 0, 0.26);
  meshes.push(nave);
  // 南北侧廊（更低）
  for (const y of [-0.33, 0.33]) {
    const aisle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.3), mat);
    aisle.position.set(0.02, y, 0.15);
    meshes.push(aisle);
  }
  // 中殿陡坡顶（4 坡锥沿 y 压扁成长脊）
  const naveRoof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.26, 4), mat);
  naveRoof.rotation.y = Math.PI / 4;
  naveRoof.scale.set(1.0, 0.34, 1.0);
  naveRoof.position.set(0.02, 0, 0.65);
  meshes.push(naveRoof);
  // 十字耳堂（横翼）+ 其坡顶
  const transept = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.98, 0.48), mat);
  transept.position.set(0.12, 0, 0.24);
  meshes.push(transept);
  const transeptRoof = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.22, 4), mat);
  transeptRoof.rotation.y = Math.PI / 4;
  transeptRoof.scale.set(0.42, 1.0, 1.0);
  transeptRoof.position.set(0.12, 0, 0.59);
  meshes.push(transeptRoof);
  // 交叉处小尖塔（flèche）
  const fleche = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 8), mat);
  fleche.position.set(0.12, 0, 0.92);
  meshes.push(fleche);
  // 西立面双塔（高方塔 + 锥尖）
  for (const y of [-0.16, 0.16]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.96), mat);
    tower.position.set(-0.64, y, 0.48);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 4), mat);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(-0.64, y, 1.13);
    meshes.push(tower, spire);
  }
  // 东端半圆后殿（apse）
  const apse = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.42, 18), mat);
  apse.rotation.x = Math.PI / 2;
  apse.position.set(0.72, 0, 0.21);
  meshes.push(apse);
  return meshes;
}

function buildStupa(mat) {
  // Stepped square base + hemisphere + chattra (umbrella spire).
  const meshes = [];
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.16), mat);
  base.position.z = 0.08;
  const step = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.18, 24), mat);
  step.rotation.x = Math.PI / 2;
  step.position.z = 0.25;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.z = 0.34;
  const yasti = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), mat);
  yasti.rotation.x = Math.PI / 2;
  yasti.position.z = 1.0;
  meshes.push(base, step, dome, yasti);
  // Three chattra disks
  for (let i = 0; i < 3; i += 1) {
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 - i * 0.05, 0.22 - i * 0.05, 0.03, 16), mat);
    disk.rotation.x = Math.PI / 2;
    disk.position.z = 0.95 + i * 0.12;
    meshes.push(disk);
  }
  return meshes;
}

function buildCity(mat) {
  // Cluster of small boxes at varied heights.
  const meshes = [];
  const positions = [
    [-0.45, -0.4, 0.45], [-0.1, -0.55, 0.55], [0.35, -0.4, 0.4],
    [-0.55, 0.05, 0.6], [-0.15, 0.0, 0.7], [0.25, 0.1, 0.55],
    [-0.4, 0.45, 0.5], [0.05, 0.5, 0.65], [0.5, 0.4, 0.45],
  ];
  for (const [x, y, h] of positions) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, h), mat);
    box.position.set(x, y, h / 2);
    meshes.push(box);
  }
  // Outer rough wall ring (square)
  const wallMat = mat;
  const wallSegs = [
    [0, -0.75, 1.6, 0.12, 0.18],
    [0, 0.75, 1.6, 0.12, 0.18],
    [-0.75, 0, 0.12, 1.6, 0.18],
    [0.75, 0, 0.12, 1.6, 0.18],
  ];
  for (const [x, y, w, d, h] of wallSegs) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), wallMat);
    m.position.set(x, y, h / 2);
    meshes.push(m);
  }
  return meshes;
}

function buildFortress(mat) {
  // Square keep with 4 corner towers and crenellated walls.
  const meshes = [];
  const keep = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.7), mat);
  keep.position.z = 0.35;
  meshes.push(keep);
  // Walls
  for (const [x, y, w, d] of [[0, -0.65, 1.3, 0.12], [0, 0.65, 1.3, 0.12], [-0.65, 0, 0.12, 1.3], [0.65, 0, 0.12, 1.3]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, d, 0.4), mat);
    wall.position.set(x, y, 0.2);
    meshes.push(wall);
  }
  // Corner towers
  for (const [x, y] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.85, 12), mat);
    tower.rotation.x = Math.PI / 2;
    tower.position.set(x, y, 0.42);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 12), mat);
    cap.position.set(x, y, 0.95);
    meshes.push(tower, cap);
  }
  return meshes;
}

function buildObservatory(mat) {
  // Cylindrical tapered body + half-sphere dome on top.
  const meshes = [];
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.2, 16), mat);
  base.rotation.x = Math.PI / 2;
  base.position.z = 0.1;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.85, 18), mat);
  body.rotation.x = Math.PI / 2;
  body.position.z = 0.6;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.z = 1.02;
  meshes.push(base, body, dome);
  return meshes;
}

function buildMonument(mat) {
  // Tall slender obelisk on a square plinth.
  const meshes = [];
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.2), mat);
  plinth.position.z = 0.1;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 1.1, 4), mat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 0.78;
  const pyramidion = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 4), mat);
  pyramidion.position.z = 1.42;
  pyramidion.rotation.y = Math.PI / 4;
  meshes.push(plinth, shaft, pyramidion);
  return meshes;
}

function buildZiggurat(mat) {
  // Three-step rectangular ziggurat.
  const meshes = [];
  const sizes = [
    [1.3, 0.95, 0.3, 0.15],
    [0.95, 0.7, 0.3, 0.45],
    [0.6, 0.45, 0.3, 0.75],
  ];
  for (const [w, d, h, z] of sizes) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), mat);
    step.position.z = z;
    meshes.push(step);
  }
  return meshes;
}

const BUILDERS = {
  pyramid: buildPyramid,
  palace: buildPalace,
  arena: buildArena,
  temple: buildTemple,
  mausoleum: buildMausoleum,
  wall: buildWall,
  mosque: buildMosque,
  cathedral: buildCathedral,
  stupa: buildStupa,
  city: buildCity,
  fortress: buildFortress,
  observatory: buildObservatory,
  monument: buildMonument,
  ziggurat: buildZiggurat,
};

/* ============================================================
 * 重点建筑专属 procedural model（modelProfile 驱动）
 * 5 个样板建筑使用更具识别度的轮廓，与同 type 的其他建筑区分。
 * ============================================================ */

// 吉萨金字塔：尖锐 4 面锥体 + 3 级隐约可见的阶梯轮廓 + 略大基座
function buildProfileGizaPyramid(mat) {
  const meshes = [];
  // 主体高耸 4 面锥（不旋转底面，让 4 个尖角朝正轴线，与方位呼应）
  const main = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.35, 4), mat);
  main.position.z = 0.675;
  main.rotation.y = Math.PI / 4;
  meshes.push(main);
  // 一圈极薄的腰线，暗示石灰岩外饰层与核心阶梯结构的分界
  const belt = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.03, 4), mat);
  belt.position.z = 0.42;
  belt.rotation.y = Math.PI / 4;
  meshes.push(belt);
  // 微小的方形底座（巨大的卡纳克石灰岩平台暗示）
  const podium = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.08), mat);
  podium.position.z = 0.04;
  meshes.push(podium);
  return meshes;
}

// 罗马斗兽场：椭圆环状外墙（拱券两层）+ 明显内圈空洞 + 部分外墙缺口暗示遗址感
function buildProfileColosseum(mat) {
  const meshes = [];
  // 外圈高墙（两层叠合，模拟拱券双层结构）
  const outerLower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.55, 36, 1, true), mat);
  outerLower.rotation.x = Math.PI / 2;
  outerLower.position.z = 0.27;
  outerLower.scale.set(1.25, 1, 1); // 椭圆压扁
  meshes.push(outerLower);
  const outerUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.9, 0.35, 36, 1, true), mat);
  outerUpper.rotation.x = Math.PI / 2;
  outerUpper.position.z = 0.72;
  outerUpper.scale.set(1.25, 1, 1);
  meshes.push(outerUpper);
  // 中圈矮墙（一段塌陷过的中庭结构）
  const middle = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.32, 28, 1, true), mat);
  middle.rotation.x = Math.PI / 2;
  middle.position.z = 0.16;
  middle.scale.set(1.25, 1, 1);
  meshes.push(middle);
  // 内圈细一圈，模拟竞技场地面分界
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.06, 24, 1, true), mat);
  inner.rotation.x = Math.PI / 2;
  inner.position.z = 0.03;
  inner.scale.set(1.25, 1, 1);
  meshes.push(inner);
  return meshes;
}

// 帕特农神庙：宽长方形台基 + 长边密集柱列（8x17 的近似低模） + 两端三角山墙
function buildProfileParthenon(mat) {
  const meshes = [];
  // 三层台基（krepidoma）—— 长方形长宽比 ~2.3:1（接近真实 30x70m）
  for (let i = 0; i < 3; i += 1) {
    const inset = i * 0.04;
    const t = new THREE.Mesh(new THREE.BoxGeometry(1.7 - inset, 0.78 - inset, 0.06), mat);
    t.position.z = 0.03 + i * 0.06;
    meshes.push(t);
  }
  // 柱廊：长边 9 根 × 2 排，短边各 2 根 × 2 排（用一圈柱模拟围柱式）
  const columnH = 0.75;
  const columnZ = 0.21 + columnH / 2;
  // 长边（南/北）
  for (let i = 0; i < 9; i += 1) {
    const x = -0.7 + (i * 1.4) / 8;
    for (const y of [-0.32, 0.32]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, columnH, 10), mat);
      col.rotation.x = Math.PI / 2;
      col.position.set(x, y, columnZ);
      meshes.push(col);
    }
  }
  // 短边（东/西）内圈两根
  for (const x of [-0.7, 0.7]) {
    for (const y of [-0.12, 0.12]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, columnH, 10), mat);
      col.rotation.x = Math.PI / 2;
      col.position.set(x, y, columnZ);
      meshes.push(col);
    }
  }
  // 楣枋（柱头横梁）
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.78, 0.08), mat);
  architrave.position.z = columnZ + columnH / 2 + 0.04;
  meshes.push(architrave);
  // 屋面（很薄的盖板）
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.84, 0.04), mat);
  roof.position.z = architrave.position.z + 0.06;
  meshes.push(roof);
  // 两端三角山墙（pediment）—— 用 Shape + ExtrudeGeometry，
  // 三角形横截面 (apex 向 +Z)，沿 y 方向挤出建筑宽度 0.78。
  const pedShape = new THREE.Shape();
  pedShape.moveTo(-0.40, 0);
  pedShape.lineTo(0.40, 0);
  pedShape.lineTo(0, 0.22);
  pedShape.lineTo(-0.40, 0);
  const pedimentGeo = new THREE.ExtrudeGeometry(pedShape, {
    depth: 0.78,
    bevelEnabled: false,
    curveSegments: 1,
  });
  // ExtrudeGeometry 默认沿 +Z 挤出，需要旋转让深度沿 +Y（建筑宽度方向）。
  pedimentGeo.rotateX(-Math.PI / 2);
  // 居中：挤出后 z(local) 范围是 [0, 0.78]，平移 -0.39 让其关于 y 对称。
  pedimentGeo.translate(0, -0.39, 0);
  // 现在三角横截面位于 XZ 平面（apex 在 +Z），沿 Y 挤出。两端各放一个。
  for (const x of [-0.79, 0.79]) {
    const ped = new THREE.Mesh(pedimentGeo, mat);
    ped.position.set(x, 0, roof.position.z + 0.02);
    // 让三角面朝外：默认面已朝 ±Y，三角形横截面朝 ±X 自然显示
    // 因为我们绕 Y 排列，正面（朝 +X 或 -X 即建筑短边）就是观众视角
    meshes.push(ped);
  }
  return meshes;
}

// 泰姬陵：方形台座 + 主体陵 + 中央洋葱穹顶 + 4 角宣礼塔（带球冠）+ 倒影池暗示
function buildProfileTajmahal(mat) {
  const meshes = [];
  // 大理石平台（chabutra）
  const platform = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.14), mat);
  platform.position.z = 0.07;
  meshes.push(platform);
  // 主陵方体（带切角效果用第二层稍小立方体叠加）
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.42), mat);
  body.position.z = 0.35;
  meshes.push(body);
  // 主陵高出的"伊万拱门"凸起（每面一个浅浮雕）
  for (const [dx, dy, rot] of [[0.43, 0, 0], [-0.43, 0, 0], [0, 0.43, Math.PI / 2], [0, -0.43, Math.PI / 2]]) {
    const iwan = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.3), mat);
    iwan.position.set(dx, dy, 0.36);
    iwan.rotation.z = rot;
    meshes.push(iwan);
  }
  // 中央洋葱穹顶（球 + 上方收紧 + 顶冠）
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.6), mat);
  dome.position.z = 0.65;
  meshes.push(dome);
  // 穹顶收紧（"洋葱"特征：底部一段细脖）
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 16), mat);
  neck.rotation.x = Math.PI / 2;
  neck.position.z = 0.58;
  meshes.push(neck);
  // 顶冠尖塔（finial）
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 10), mat);
  finial.position.z = 1.02;
  meshes.push(finial);
  // 4 个伴顶小亭（chhatri）—— 主穹顶四周小圆顶
  for (const [x, y] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) {
    const chhatriBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 10), mat);
    chhatriBase.rotation.x = Math.PI / 2;
    chhatriBase.position.set(x, y, 0.6);
    const chhatriDome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    chhatriDome.position.set(x, y, 0.7);
    meshes.push(chhatriBase, chhatriDome);
  }
  // 4 角宣礼塔（minaret）—— 高细塔 + 顶冠
  for (const [x, y] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
    const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.0, 12), mat);
    minaret.rotation.x = Math.PI / 2;
    minaret.position.set(x, y, 0.5);
    const minBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    minBulb.position.set(x, y, 1.02);
    const minCap = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), mat);
    minCap.position.set(x, y, 1.16);
    meshes.push(minaret, minBulb, minCap);
  }
  return meshes;
}

// 长安宫殿（含明清紫禁城样式继承）：宽石台基 + 殿身 + 双层东亚歇山顶 + 鸱吻
function buildProfileChanganPalace(mat) {
  const meshes = [];
  // 大型石台基（汉白玉须弥座暗示，2 层）
  const baseLower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.18), mat);
  baseLower.position.z = 0.09;
  const baseUpper = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.9, 0.10), mat);
  baseUpper.position.z = 0.23;
  meshes.push(baseLower, baseUpper);
  // 殿身（带柱廊感的窄高方块）
  const hall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.40), mat);
  hall.position.z = 0.48;
  meshes.push(hall);
  // 殿身柱列（横向 5 根可见柱）
  for (let i = 0; i < 5; i += 1) {
    const x = -0.5 + (i * 1.0) / 4;
    for (const y of [-0.34, 0.34]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.38, 8), mat);
      col.rotation.x = Math.PI / 2;
      col.position.set(x, y, 0.48);
      meshes.push(col);
    }
  }
  // 第一层歇山顶（下层屋顶）：方锥宽于殿身，水平挑檐感
  const roofLowerEave = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.85, 0.04), mat);
  roofLowerEave.position.z = 0.70;
  meshes.push(roofLowerEave);
  const roofLower = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.22, 4), mat);
  roofLower.rotation.y = Math.PI / 4;
  roofLower.position.z = 0.83;
  roofLower.scale.set(1.0, 0.6, 1.0); // 沿 y 压扁，做成长方形歇山
  meshes.push(roofLower);
  // 上层小殿（重檐结构）
  const upperHall = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.22), mat);
  upperHall.position.z = 1.0;
  meshes.push(upperHall);
  // 上层歇山顶
  const roofUpperEave = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 0.035), mat);
  roofUpperEave.position.z = 1.13;
  meshes.push(roofUpperEave);
  const roofUpper = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.20, 4), mat);
  roofUpper.rotation.y = Math.PI / 4;
  roofUpper.position.z = 1.25;
  roofUpper.scale.set(1.0, 0.55, 1.0);
  meshes.push(roofUpper);
  // 屋脊鸱吻（两端各一个上翘小尖）
  for (const x of [-0.45, 0.45]) {
    const chi = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.10, 4), mat);
    chi.rotation.x = Math.PI / 2;
    chi.rotation.z = Math.PI / 4;
    chi.position.set(x, 0, 1.36);
    meshes.push(chi);
  }
  return meshes;
}

/* ============================================================
 * 第二批 profile：明清紫禁城 / 长城 / 麦加禁寺 / 吴哥窟 / 婆罗浮屠
 * 与第一批一致的局部坐标系（xy ~ ±0.7，z 0~1.3）。
 * ============================================================ */

// 紫禁城：长方形红墙围合 + 4 角角楼 + 中轴 3 大殿（重檐金顶）
function buildProfileForbiddenCity(mat) {
  const meshes = [];
  // 外城墙（红墙）：四条围合矩形 + 角楼
  const wallH = 0.16;
  const wallZ = wallH / 2;
  // 四面墙
  for (const [w, d, x, y] of [
    [1.7, 0.06, 0, -0.55], // 南
    [1.7, 0.06, 0, 0.55],  // 北
    [0.06, 1.16, -0.85, 0], // 西
    [0.06, 1.16, 0.85, 0],  // 东
  ]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, d, wallH), mat);
    wall.position.set(x, y, wallZ);
    meshes.push(wall);
  }
  // 4 角角楼（黄顶小阁）
  for (const [x, y] of [[-0.85, -0.55], [0.85, -0.55], [-0.85, 0.55], [0.85, 0.55]]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), mat);
    tower.position.set(x, y, 0.14);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.10, 4), mat);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(x, y, 0.33);
    meshes.push(tower, cap);
  }
  // 中轴台基（三大殿共用的"工"形大平台）
  const platform = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.10), mat);
  platform.position.z = 0.21;
  meshes.push(platform);
  // 三大殿（太和殿、中和殿、保和殿）—— y 方向排成一列
  const halls = [
    { y: 0.34, w: 0.42, d: 0.22, h: 0.20, roofH: 0.16 }, // 太和（最高）
    { y: 0.00, w: 0.34, d: 0.18, h: 0.16, roofH: 0.12 }, // 中和（最小）
    { y: -0.34, w: 0.40, d: 0.22, h: 0.18, roofH: 0.14 }, // 保和
  ];
  for (const h of halls) {
    const hall = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.d, h.h), mat);
    hall.position.set(0, h.y, 0.26 + h.h / 2);
    // 重檐：一层挑檐 + 一层屋顶方锥
    const eave = new THREE.Mesh(new THREE.BoxGeometry(h.w + 0.06, h.d + 0.06, 0.03), mat);
    eave.position.set(0, h.y, 0.26 + h.h + 0.015);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(h.w * 0.55, h.roofH, 4), mat);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, h.d / h.w * 1.1, 1);
    roof.position.set(0, h.y, 0.26 + h.h + 0.04 + h.roofH / 2);
    meshes.push(hall, eave, roof);
  }
  return meshes;
}

// 万里长城：蜿蜒墙段（4 节连续墙片，方向有偏角）+ 顶部垛口 + 2 烽火台
function buildProfileGreatWall(mat) {
  const meshes = [];
  // 4 节墙片，模拟"S 形"曲折山脊走向
  const segments = [
    { x: -0.7, y: -0.3, angle: 0.20, len: 0.55, h: 0.34 },
    { x: -0.18, y: -0.05, angle: -0.15, len: 0.55, h: 0.36 },
    { x: 0.34, y: 0.15, angle: 0.25, len: 0.55, h: 0.34 },
    { x: 0.78, y: 0.45, angle: -0.10, len: 0.45, h: 0.32 },
  ];
  for (const s of segments) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(s.len, 0.14, s.h), mat);
    body.rotation.z = s.angle;
    body.position.set(s.x, s.y, s.h / 2);
    meshes.push(body);
    // 墙顶垛口（沿长度方向 4 个凹凸）
    for (let i = 0; i < 4; i += 1) {
      const cren = new THREE.Mesh(new THREE.BoxGeometry(s.len / 8, 0.14, 0.07), mat);
      cren.rotation.z = s.angle;
      const along = (i - 1.5) * (s.len / 4);
      cren.position.set(s.x + along * Math.cos(s.angle), s.y + along * Math.sin(s.angle), s.h + 0.035);
      meshes.push(cren);
    }
  }
  // 两个烽火台（更高的方形塔）
  for (const [x, y] of [[-0.45, -0.15], [0.6, 0.32]]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.55), mat);
    tower.position.set(x, y, 0.275);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.06), mat);
    cap.position.set(x, y, 0.58);
    meshes.push(tower, cap);
  }
  return meshes;
}

// 麦加禁寺：方形大院 + 中央黑色克尔白立方体 + 多座宣礼塔环绕
function buildProfileMeccaHaram(mat) {
  const meshes = [];
  // 大院围墙（方形）
  const courtSize = 1.5;
  for (const [w, d, x, y] of [
    [courtSize, 0.05, 0, -courtSize / 2],
    [courtSize, 0.05, 0, courtSize / 2],
    [0.05, courtSize, -courtSize / 2, 0],
    [0.05, courtSize, courtSize / 2, 0],
  ]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, d, 0.20), mat);
    wall.position.set(x, y, 0.10);
    meshes.push(wall);
  }
  // 院内地面（高一点的浅色平台）
  const floor = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.42, 0.03), mat);
  floor.position.z = 0.015;
  meshes.push(floor);
  // 中央克尔白（小立方体，刻意做小）—— 用一个单独颜色更深的材质
  const kaabaMat = new THREE.MeshPhongMaterial({
    color: 0x1a1612,
    emissive: 0x0a0806,
    emissiveIntensity: 0.2,
    shininess: 18,
  });
  const kaaba = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), kaabaMat);
  kaaba.position.z = 0.14;
  meshes.push(kaaba);
  // 4-7 座宣礼塔围绕（这里布 7 根，对应实际禁寺宣礼塔数量）
  const minaretSpots = [
    [-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75],
    [0, -0.78], [-0.78, 0.05], [0.78, 0.05],
  ];
  for (const [x, y] of minaretSpots) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.0, 10), mat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(x, y, 0.50);
    const balcony = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 10), mat);
    balcony.rotation.x = Math.PI / 2;
    balcony.position.set(x, y, 0.85);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 10), mat);
    cap.position.set(x, y, 1.06);
    meshes.push(shaft, balcony, cap);
  }
  return meshes;
}

// 吴哥窟：方形护城河 + 三层基座 + 中央高塔（莲苞顶）+ 4 角小塔（quincunx）
function buildProfileAngkorWat(mat) {
  const meshes = [];
  // 护城河：用一圈低矮的"凹"框代表（4 段薄长条）
  const moatColor = new THREE.MeshBasicMaterial({
    color: 0x3a5a78,
    transparent: true,
    opacity: 0.5,
  });
  const moatSize = 1.6;
  for (const [w, d, x, y] of [
    [moatSize, 0.08, 0, -moatSize / 2],
    [moatSize, 0.08, 0, moatSize / 2],
    [0.08, moatSize, -moatSize / 2, 0],
    [0.08, moatSize, moatSize / 2, 0],
  ]) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, d, 0.02), moatColor);
    seg.position.set(x, y, 0.01);
    meshes.push(seg);
  }
  // 三层基座（依次缩小）
  const tiers = [
    { w: 1.2, d: 1.2, h: 0.10, z: 0.05 },
    { w: 0.95, d: 0.95, h: 0.10, z: 0.15 },
    { w: 0.72, d: 0.72, h: 0.10, z: 0.25 },
  ];
  for (const t of tiers) {
    const tier = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.d, t.h), mat);
    tier.position.z = t.z + t.h / 2 - 0.05;
    meshes.push(tier);
  }
  // 中央高塔（莲苞顶）—— 由 cylinder + cone 堆叠形成"竹笋形"
  const centerBase = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.30, 0.20), mat);
  centerBase.position.z = 0.40;
  meshes.push(centerBase);
  const centerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.35, 12), mat);
  centerShaft.rotation.x = Math.PI / 2;
  centerShaft.position.z = 0.67;
  const centerBulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), mat);
  centerBulb.position.z = 0.83;
  const centerTip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.20, 8), mat);
  centerTip.position.z = 1.0;
  meshes.push(centerShaft, centerBulb, centerTip);
  // 4 角小塔（quincunx）
  for (const [x, y] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.14), mat);
    base.position.set(x, y, 0.37);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 10), mat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(x, y, 0.55);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mat);
    bulb.position.set(x, y, 0.66);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.10, 8), mat);
    tip.position.set(x, y, 0.74);
    meshes.push(base, shaft, bulb, tip);
  }
  return meshes;
}

// 婆罗浮屠：方形三层台 + 圆形三层台 + 中央主塔 + 圆台上散布的小钟塔
// 调优：把整体垂直比例拉高（base 缩小、tier 高度加大），让从俯视到斜视都能看出阶梯塔形。
function buildProfileBorobudur(mat) {
  const meshes = [];
  // 下三层方台（依次缩小、加高）
  const squareTiers = [
    { size: 1.20, h: 0.18 },
    { size: 1.00, h: 0.16 },
    { size: 0.82, h: 0.14 },
  ];
  let z = 0;
  for (const t of squareTiers) {
    const tier = new THREE.Mesh(new THREE.BoxGeometry(t.size, t.size, t.h), mat);
    tier.position.z = z + t.h / 2;
    meshes.push(tier);
    z += t.h;
  }
  // 上三层圆台（更高、收窄）
  const roundTiers = [
    { r: 0.52, h: 0.12 },
    { r: 0.40, h: 0.12 },
    { r: 0.28, h: 0.12 },
  ];
  for (const t of roundTiers) {
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r + 0.025, t.h, 24), mat);
    tier.rotation.x = Math.PI / 2;
    tier.position.z = z + t.h / 2;
    meshes.push(tier);
    z += t.h;
  }
  // 中央主塔（半球 + 锥顶）—— 抬高到上圆台之上
  const mainDome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  mainDome.position.z = z + 0.04;
  const mainSpire = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 8), mat);
  mainSpire.position.z = z + 0.34;
  meshes.push(mainDome, mainSpire);
  // 圆台上散布的小钟塔（perforated stupas）—— 两圈共 14 个
  function smallStupa(x, y, zPos) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.06, 8), mat);
    base.rotation.x = Math.PI / 2;
    base.position.set(x, y, zPos);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    bell.position.set(x, y, zPos + 0.06);
    return [base, bell];
  }
  // 圆台 1 顶上一圈、圆台 2 顶上一圈
  const ringSpec = [
    { count: 8, r: 0.48, zRel: -0.12 }, // 第 1 圆台外缘
    { count: 6, r: 0.36, zRel: 0 },     // 第 2 圆台外缘
  ];
  for (const ring of ringSpec) {
    for (let i = 0; i < ring.count; i += 1) {
      const a = (i / ring.count) * Math.PI * 2;
      const x = Math.cos(a) * ring.r;
      const y = Math.sin(a) * ring.r;
      meshes.push(...smallStupa(x, y, z + ring.zRel));
    }
  }
  return meshes;
}

/* ============================================================
 * 第三批 profile：兵马俑 / 马丘比丘 / 巨石阵 / 波斯波利斯 / 奇琴伊察
 * ============================================================ */

// 秦始皇兵马俑：3 个长方形俑坑 + 坑内陶俑方阵 + 一端小封土堆
function buildProfileTerracottaArmy(mat) {
  const meshes = [];
  // 浅色封土堆（最东端，象征秦陵）
  const mound = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.28, 6), mat);
  mound.position.set(-0.78, 0, 0.14);
  mound.rotation.y = Math.PI / 6;
  meshes.push(mound);
  // 3 个长方形俑坑：1 号坑最大（最长），2/3 号坑较小，并列向东延伸
  const pits = [
    { x: 0.3, y: -0.32, w: 1.0, d: 0.30 }, // 1 号坑（步兵主阵，最大）
    { x: 0.30, y: 0.10, w: 0.60, d: 0.20 }, // 2 号坑（车兵、骑兵混编）
    { x: 0.30, y: 0.38, w: 0.40, d: 0.16 }, // 3 号坑（指挥部）
  ];
  for (const p of pits) {
    // 坑壁（薄边框）
    const wallH = 0.10;
    for (const [w, d, dx, dy] of [
      [p.w, 0.025, 0, -p.d / 2],
      [p.w, 0.025, 0, p.d / 2],
      [0.025, p.d, -p.w / 2, 0],
      [0.025, p.d, p.w / 2, 0],
    ]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, d, wallH), mat);
      wall.position.set(p.x + dx, p.y + dy, wallH / 2);
      meshes.push(wall);
    }
    // 坑内陶俑方阵：按 cols × rows 排列小立方体
    const figW = 0.018;
    const figH = 0.07;
    const cols = Math.floor((p.w - 0.08) / 0.06);
    const rows = Math.floor((p.d - 0.06) / 0.06);
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < rows; j += 1) {
        const fx = p.x - p.w / 2 + 0.06 + (i * (p.w - 0.12)) / Math.max(1, cols - 1);
        const fy = p.y - p.d / 2 + 0.04 + (j * (p.d - 0.08)) / Math.max(1, rows - 1);
        const fig = new THREE.Mesh(new THREE.BoxGeometry(figW, figW, figH), mat);
        fig.position.set(fx, fy, figH / 2);
        meshes.push(fig);
      }
    }
  }
  return meshes;
}

// 马丘比丘：山尖背景 + 阶梯农田（4 层细长条）+ 山顶石屋群
function buildProfileMachuPicchu(mat) {
  const meshes = [];
  // 背景两座山尖（华纳比丘 + 马丘比丘）—— 后移并加高，让山尖在阶梯之后清晰可见
  const peakA = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.85, 6), mat);
  peakA.position.set(-0.22, -0.55, 0.425);
  peakA.rotation.y = Math.PI / 7;
  const peakB = new THREE.Mesh(new THREE.ConeGeometry(0.30, 0.62, 6), mat);
  peakB.position.set(0.36, -0.52, 0.31);
  peakB.rotation.y = -Math.PI / 6;
  meshes.push(peakA, peakB);
  // 阶梯农田（4 条细长平台沿 y 方向逐级升高）
  for (let i = 0; i < 4; i += 1) {
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.05), mat);
    const z = 0.06 + i * 0.06;
    const y = 0.45 - i * 0.16;
    terrace.position.set(0, y, z);
    meshes.push(terrace);
  }
  // 山顶石屋群（散布在山间平台上）
  const houseSpots = [
    [-0.30, 0.05, 0.42], [-0.10, 0.12, 0.45], [0.10, 0.05, 0.43],
    [0.30, 0.10, 0.42], [-0.20, -0.05, 0.40], [0.18, -0.05, 0.42],
    [0.00, 0.20, 0.48],
  ];
  for (const [x, y, z] of houseSpots) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.10), mat);
    wall.position.set(x, y, z);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.06, 4), mat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x, y, z + 0.08);
    meshes.push(wall, roof);
  }
  // 中央祭坛石（intihuatana）—— 山顶小圆台
  const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 8), mat);
  altar.rotation.x = Math.PI / 2;
  altar.position.set(0, 0.35, 0.32);
  meshes.push(altar);
  return meshes;
}

// 巨石阵：草地圆台 + 外圈立石（圆周分布）+ 内圈 5 座三石塔 + 中央祭坛石
function buildProfileStonehenge(mat) {
  const meshes = [];
  // 草地圆台（浅灰色暗示土堆 henge）
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.04, 32), mat);
  platform.rotation.x = Math.PI / 2;
  platform.position.z = 0.02;
  meshes.push(platform);
  // 外圈 16 块立石（sarsen circle）—— 16 根直立条
  const outerR = 0.72;
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    const x = Math.cos(a) * outerR;
    const y = Math.sin(a) * outerR;
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.42), mat);
    stone.position.set(x, y, 0.21 + 0.02);
    stone.rotation.z = a;
    meshes.push(stone);
  }
  // 外圈横梁（lintel）—— 围一圈，做成稍粗的环
  const lintel = new THREE.Mesh(new THREE.TorusGeometry(outerR, 0.045, 6, 32), mat);
  lintel.position.z = 0.45;
  meshes.push(lintel);
  // 内圈 5 座三石塔（trilithon horseshoe）—— 马蹄形排列
  const trilithons = [
    { angle: -Math.PI / 2, h: 0.55, w: 0.14 },
    { angle: -Math.PI / 2 + 0.7, h: 0.52, w: 0.13 },
    { angle: -Math.PI / 2 - 0.7, h: 0.52, w: 0.13 },
    { angle: -Math.PI / 2 + 1.4, h: 0.48, w: 0.12 },
    { angle: -Math.PI / 2 - 1.4, h: 0.48, w: 0.12 },
  ];
  const innerR = 0.30;
  for (const t of trilithons) {
    const cx = Math.cos(t.angle) * innerR;
    const cy = Math.sin(t.angle) * innerR;
    const gap = 0.10;
    // 两根立柱
    for (const sign of [-1, 1]) {
      const px = cx + Math.cos(t.angle + Math.PI / 2) * gap * sign;
      const py = cy + Math.sin(t.angle + Math.PI / 2) * gap * sign;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(t.w, 0.10, t.h), mat);
      pillar.position.set(px, py, 0.04 + t.h / 2);
      pillar.rotation.z = t.angle;
      meshes.push(pillar);
    }
    // 顶部横梁
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.06), mat);
    beam.position.set(cx, cy, 0.04 + t.h + 0.03);
    beam.rotation.z = t.angle;
    meshes.push(beam);
  }
  // 中央祭坛石
  const altar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.08), mat);
  altar.position.z = 0.08;
  meshes.push(altar);
  return meshes;
}

// 波斯波利斯：大型石台基 + 万国门双柱 + 阿帕达纳大殿柱列方阵
function buildProfilePersepolis(mat) {
  const meshes = [];
  // 巨型石台基（露台）
  const terrace = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.1, 0.18), mat);
  terrace.position.z = 0.09;
  meshes.push(terrace);
  // 万国门（Gate of All Nations）—— 西侧两根高大圆柱 + 顶部牛首横梁
  const gateColH = 0.95;
  for (const x of [-0.78, -0.62]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, gateColH, 12), mat);
    col.rotation.x = Math.PI / 2;
    col.position.set(x, 0, 0.18 + gateColH / 2);
    // 柱头（双头公牛 capital，简化为方块）
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.10), mat);
    capital.position.set(x, 0, 0.18 + gateColH + 0.05);
    meshes.push(col, capital);
  }
  const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.16, 0.05), mat);
  gateLintel.position.set(-0.70, 0, 0.18 + gateColH + 0.16);
  meshes.push(gateLintel);
  // 阿帕达纳大殿（Apadana）—— 6 × 6 柱列方阵（共 36 根柱，实际为 72 但低模简化）
  const apadanaColH = 0.85;
  const apadanaZ = 0.18 + apadanaColH / 2;
  const cols = 6;
  const rows = 6;
  const spanX = 0.70;
  const spanY = 0.70;
  const ox = 0.15;
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      const x = ox + (i - (cols - 1) / 2) * (spanX / (cols - 1));
      const y = (j - (rows - 1) / 2) * (spanY / (rows - 1));
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.030, apadanaColH, 8), mat);
      col.rotation.x = Math.PI / 2;
      col.position.set(x, y, apadanaZ);
      meshes.push(col);
    }
  }
  // 阿帕达纳屋顶（薄板，方阵正上方）—— 表达大殿顶盖
  const apadanaRoof = new THREE.Mesh(new THREE.BoxGeometry(spanX + 0.16, spanY + 0.16, 0.04), mat);
  apadanaRoof.position.set(ox, 0, 0.18 + apadanaColH + 0.04);
  meshes.push(apadanaRoof);
  return meshes;
}

// 奇琴伊察 库库尔坎金字塔：9 层方形阶梯 + 一条阶梯通道 + 顶部小神庙
function buildProfileChichenItza(mat) {
  const meshes = [];
  // 9 层方形阶梯（每层等高、等宽递减）
  const totalTiers = 9;
  const baseSize = 1.10;
  const topSize = 0.36;
  const tierH = 0.08;
  for (let i = 0; i < totalTiers; i += 1) {
    const t = i / (totalTiers - 1);
    const size = baseSize + (topSize - baseSize) * t;
    const tier = new THREE.Mesh(new THREE.BoxGeometry(size, size, tierH), mat);
    tier.position.z = tierH / 2 + i * tierH;
    meshes.push(tier);
  }
  // 一条阶梯通道（北侧），从底贯穿到顶
  const totalH = totalTiers * tierH;
  const stair = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, totalH), mat);
  // 沿 y 正向（北侧）斜靠在金字塔外侧
  stair.rotation.x = -Math.PI / 8; // 倾斜 ~22.5°
  stair.position.set(0, baseSize / 2 + 0.04, totalH / 2 - 0.02);
  meshes.push(stair);
  // 顶部小神庙（box + 三角顶）
  const templeBase = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.30, 0.16), mat);
  templeBase.position.z = totalH + 0.08;
  const templeRoof = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.05), mat);
  templeRoof.position.z = totalH + 0.18;
  meshes.push(templeBase, templeRoof);
  // 入口柱（小庙正面两根）
  for (const x of [-0.10, 0.10]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.025, 0.10, 8), mat);
    col.rotation.x = Math.PI / 2;
    col.position.set(x, 0.13, totalH + 0.06);
    meshes.push(col);
  }
  return meshes;
}

/* ============================================================
 * 按 landmark id 的代码侧模型覆写（不改 landmarks.json）
 * 某些名建筑虽与同 type 共享通用模型，但有极强识别度的招牌轮廓，
 * 单独给一份高精度 procedural model。仅按 id 命中，独立于 PROFILES/
 * MODEL_PROFILE_KEYS 体系（不触发 assertProfileCoverage）。
 * ============================================================ */

// 圣索菲亚大教堂：长方形巴西利卡主体 + 招牌中央大穹顶（鼓座 + 扁半球）+
// 东西两座半穹顶 + 四角奥斯曼细高宣礼塔（铅笔尖顶）。对应用户参考图 3。
function buildProfileHagiaSophia(mat) {
  const meshes = [];
  // 巴西利卡台基（东西略长）
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.95, 0.12), mat);
  base.position.z = 0.06;
  meshes.push(base);
  // 南北侧廊（较低体块）
  for (const y of [-0.40, 0.40]) {
    const aisle = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.26), mat);
    aisle.position.set(0, y, 0.20);
    meshes.push(aisle);
  }
  // 中殿核心方体（承托中央大穹顶的方形基座）
  const naveCore = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.64, 0.42), mat);
  naveCore.position.z = 0.31;
  meshes.push(naveCore);
  // 东西两座半穹顶（紧贴中央穹顶，略低）
  for (const sgn of [-1, 1]) {
    const semi = new THREE.Mesh(
      new THREE.SphereGeometry(0.31, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    semi.scale.set(1, 1, 0.72);
    semi.position.set(sgn * 0.34, 0, 0.42);
    meshes.push(semi);
  }
  // 中央穹顶鼓座（drum）
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.37, 0.16, 32), mat);
  drum.rotation.x = Math.PI / 2;
  drum.position.z = 0.56;
  meshes.push(drum);
  // 中央大穹顶（招牌扁半球）
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.scale.set(1, 1, 0.8);
  dome.position.z = 0.62;
  meshes.push(dome);
  // 穹顶顶尖
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.13, 10), mat);
  finial.position.z = 0.62 + 0.37 * 0.8 + 0.02;
  meshes.push(finial);
  // 四角宣礼塔（奥斯曼加建，细高 + 阳台环 + 铅笔尖顶 —— 圣索菲亚标志）
  for (const [x, y] of [[-0.56, -0.42], [0.56, -0.42], [-0.56, 0.42], [0.56, 0.42]]) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.0, 14), mat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(x, y, 0.5);
    const balcony = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 14), mat);
    balcony.rotation.x = Math.PI / 2;
    balcony.position.set(x, y, 0.84);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 14), mat);
    cap.position.set(x, y, 1.13);
    meshes.push(shaft, balcony, cap);
  }
  return meshes;
}

const ID_PROFILE_OVERRIDES = {
  'hagia-sophia': buildProfileHagiaSophia,
};

// 招牌建筑的 GLB 资产（代码侧映射，不改 landmarks.json）。
// 命中时：先按程序化模型出图（保证立即可见 + 失败兜底），随后异步加载 GLB，
// 成功则用 GLB 替换该建筑的程序化体块；加载失败则保留程序化模型。
const GLB_BASE = `${import.meta.env?.BASE_URL ?? '/'}models/`;
const ID_GLB_OVERRIDES = {
  'hagia-sophia': `${GLB_BASE}hagia-sophia.glb`,
  parthenon: `${GLB_BASE}parthenon.glb`,
  colosseum: `${GLB_BASE}colosseum.glb`,
  tajmahal: `${GLB_BASE}taj-mahal.glb`,
  pyramid: `${GLB_BASE}great-pyramid.glb`,
  'great-wall': `${GLB_BASE}great-wall.glb`,
  'angkor-wat': `${GLB_BASE}angkor-wat.glb`,
  stonehenge: `${GLB_BASE}stonehenge.glb`,
  'chichen-itza': `${GLB_BASE}chichen-itza.glb`,
  'forbidden-city': `${GLB_BASE}forbidden-city.glb`,
  'notre-dame': `${GLB_BASE}notre-dame.glb`,
  borobudur: `${GLB_BASE}borobudur.glb`,
  petra: `${GLB_BASE}petra.glb`,
  'red-fort': `${GLB_BASE}red-fort.glb`,
};

// 招牌建筑姿态覆写（弧度）。只修正模型在地图上的摆放，不改历史数据。
// 圣索菲亚 GLB 来自本地程序化导出，加载到 MapLibre custom layer 后需要校正竖直轴，
// 否则会像躺倒一样把底部/侧底部朝向镜头，而不是让底面贴地。
// 全部经 wonderKit 以 z-up 导出，经同一 GLTF 往返后需校正竖直轴（与圣索菲亚一致）。
const GLB_ORIENT_ZUP = { x: -Math.PI / 2, y: 0, z: 0 };
const ID_GLB_ORIENTATION_OVERRIDES = {
  'hagia-sophia': GLB_ORIENT_ZUP,
  parthenon: GLB_ORIENT_ZUP,
  colosseum: GLB_ORIENT_ZUP,
  tajmahal: GLB_ORIENT_ZUP,
  pyramid: GLB_ORIENT_ZUP,
  'great-wall': GLB_ORIENT_ZUP,
  'angkor-wat': GLB_ORIENT_ZUP,
  stonehenge: GLB_ORIENT_ZUP,
  'chichen-itza': GLB_ORIENT_ZUP,
  'forbidden-city': GLB_ORIENT_ZUP,
  'notre-dame': GLB_ORIENT_ZUP,
  borobudur: GLB_ORIENT_ZUP,
  petra: GLB_ORIENT_ZUP,
  'red-fort': GLB_ORIENT_ZUP,
};

// 单例 GLTF 加载器（所有招牌建筑共用）。
const gltfLoader = new GLTFLoader();

const PROFILES = {
  palace: buildProfileChanganPalace,
  pyramid: buildProfileGizaPyramid,
  colosseum: buildProfileColosseum,
  parthenon: buildProfileParthenon,
  tajmahal: buildProfileTajmahal,
  'forbidden-city': buildProfileForbiddenCity,
  'great-wall': buildProfileGreatWall,
  'mecca-haram': buildProfileMeccaHaram,
  'angkor-wat': buildProfileAngkorWat,
  borobudur: buildProfileBorobudur,
  'terracotta-army': buildProfileTerracottaArmy,
  'machu-picchu': buildProfileMachuPicchu,
  stonehenge: buildProfileStonehenge,
  persepolis: buildProfilePersepolis,
  'chichen-itza': buildProfileChichenItza,
};

// 模块加载期断言：PROFILES 的 key 必须与 MODEL_PROFILE_KEYS 完全对齐。
// 任一边漏掉或多写都会立即抛错，防止 landmarks.json 与代码静默漂移。
assertProfileCoverage(PROFILES);

const ALLOWED_PROFILES = MODEL_PROFILE_KEYS;
export { ALLOWED_PROFILES };

const FOCUS_SCALE_OVERRIDES = {
  // Low, compound sites need a little more selected-state scale so their
  // secondary masses stay readable in the map camera without bloating every
  // landmark in normal world view.
  pyramid: 1.42,
};

function buildDefault(mat) {
  // Simple stepped cube fallback for unknown types.
  const base = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.3), mat);
  base.position.z = 0.15;
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.4), mat);
  top.position.z = 0.5;
  return [base, top];
}

/* ============================================================
 * 年代演变 + 植被（M2/M3）辅助
 * ============================================================ */

// 两个颜色数字按 t 插值，返回 hex 数字。
function lerpColorNum(aNum, bNum, t) {
  const a = new THREE.Color(aNum);
  const b = new THREE.Color(bNum);
  return a.lerp(b, t).getHex();
}

// 按建造起始年代给建筑一个时代色调（远古砂岩 → 古典石灰岩 → 中古陶土 →
// 近世暖石 → 近现代冷灰），只在 atlas 主题以低比例混入建筑本色，
// 让拖动时间轴时能"感到"建筑随年代演变，同时保留各文明的识别色。
const ERA_BANDS = [
  { before: -800, color: 0xb08d57 }, // 远古
  { before: 200, color: 0xcdbb98 }, // 古典
  { before: 1300, color: 0xa9745a }, // 中古
  { before: 1750, color: 0xb5854a }, // 近世
  { before: Infinity, color: 0x9aa1a6 }, // 近现代
];
function eraColorNum(startYear) {
  for (const band of ERA_BANDS) if (startYear < band.before) return band.color;
  return 0x9aa1a6;
}

// 适合放树丛的生态区（温带/热带/季风），其余（沙漠/干旱）不放树。
const GROVE_REGIONS = new Set([
  '东亚', '南亚', '中美洲', '安第斯', '东南亚', '西欧', '地中海', '东地中海', '南部非洲',
]);

// 稳定的字符串散列 → [0,1)，让每个站点的树丛分布固定可复现。
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

// 低多边形树丛：在建筑足迹外圈散布若干风格化小树（针叶锥 / 阔叶团）。
// 材质 role='tree'，setTheme 时按主题显隐（仅 atlas 显示）。
function buildGrove(building) {
  const meshes = [];
  const seed = hashSeed(building.id);
  const n = 5;
  for (let i = 0; i < n; i += 1) {
    const ang = (i / n) * Math.PI * 2 + seed * 6.283;
    const rad = 0.98 + ((i * 0.27 + seed) % 1) * 0.30;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    const sc = 0.8 + ((i * 0.5 + seed) % 1) * 0.5;
    const trunkH = 0.13 * sc;
    const trunkMat = new THREE.MeshPhongMaterial({
      color: 0x5a4324, transparent: true, opacity: 1, shininess: 4,
    });
    trunkMat.userData = { role: 'tree' };
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, trunkH, 6), trunkMat);
    trunk.rotation.x = Math.PI / 2;
    trunk.position.set(x, y, trunkH / 2);
    meshes.push(trunk);

    const canopyHex = lerpColorNum(0x4f6b34, 0x728c46, (i * 0.33 + seed) % 1);
    const canMat = new THREE.MeshPhongMaterial({
      color: canopyHex, transparent: true, opacity: 1, shininess: 3,
      emissive: 0x0b1206, emissiveIntensity: 0.15,
    });
    canMat.userData = { role: 'tree' };
    const broad = ((i + Math.floor(seed * 3)) % 2) === 0;
    const can = broad
      ? new THREE.Mesh(new THREE.IcosahedronGeometry(0.11 * sc, 0), canMat)
      : new THREE.Mesh(new THREE.ConeGeometry(0.10 * sc, 0.26 * sc, 7), canMat);
    can.position.set(x, y, trunkH + (broad ? 0.09 : 0.13) * sc);
    meshes.push(can);
  }
  return meshes;
}

// 会形成聚落的"都城/城邑"类型：宫殿 / 城邑 / 要塞 / 长城。
// 这些站点在足迹外圈散布低多边形民居簇，营造"人居中心"的烟火气。
const SETTLEMENT_TYPES = new Set(['palace', 'city', 'fortress', 'wall']);

// 民居土墙 / 夯土 / 木构的暖色基调，按 seed 选取后再混入时代色。
const HOUSE_COLORS = [0x9c7b50, 0x8a6a45, 0xb08a5c, 0x7d6648, 0xa67c52];

// 民居簇（M4）：在都城类建筑足迹外圈散布若干风格化小屋（坡顶 / 平顶土屋）。
// 比树丛更靠外（半径 1.45~2.0），围合成一圈聚落。材质 role='house'，
// 只在 atlas 主题显示；颜色按建造年代混入时代色，让不同时期的都城气质有别。
function buildHamlet(building) {
  const meshes = [];
  const baseSeed = hashSeed(`${building.id}:hamlet`);
  const n = building.importance >= 5 ? 9 : 6;
  const eraHex = eraColorNum(building.startYear);
  for (let i = 0; i < n; i += 1) {
    const s = hashSeed(`${building.id}:h${i}`);
    const ang = (i / n) * Math.PI * 2 + baseSeed * 6.283 + (s - 0.5) * 0.7;
    const rad = 1.45 + ((i * 0.31 + s) % 1) * 0.55; // 1.45 .. 2.0
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    const sc = 0.7 + ((i * 0.4 + s) % 1) * 0.5;
    const facing = ang + (s - 0.5) * 1.4;

    const baseColor = HOUSE_COLORS[Math.floor(s * 997) % HOUSE_COLORS.length];
    const atlasColor = lerpColorNum(baseColor, eraHex, 0.30);
    const mat = new THREE.MeshPhongMaterial({
      color: atlasColor, transparent: true, opacity: 1, shininess: 5,
      emissive: 0x140d06, emissiveIntensity: 0.12,
    });
    mat.userData = { role: 'house' };

    const wallH = 0.11 * sc;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15 * sc, 0.12 * sc, wallH), mat);
    body.position.set(x, y, wallH / 2);
    body.rotation.z = facing;
    meshes.push(body);

    // 三分之一为平顶夯土屋，其余为四坡顶小屋。
    const flat = (Math.floor(s * 5) % 3) === 0;
    if (flat) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.17 * sc, 0.14 * sc, 0.03 * sc), mat);
      roof.position.set(x, y, wallH + 0.015 * sc);
      roof.rotation.z = facing;
      meshes.push(roof);
    } else {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.115 * sc, 0.10 * sc, 4), mat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(x, y, wallH + 0.05 * sc);
      meshes.push(roof);
    }
  }
  return meshes;
}

// 平滑插值（smoothstep），用于建筑出现/消失时的缩放渐变。
function smoothstep(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/* ============================================================
 * 几何合并（Part B）：把每个建筑 group 内成百上千的小网格按"材质角色"
 * 合并成极少数网格，砍掉 draw call。合并前先把每个网格的局部变换烘焙进
 * 几何（updateMatrix → applyMatrix4），再按材质 / 顶点色归并。
 *   - 动画作用于 group.scale，合并网格仍是 group 子节点，动画不受影响。
 *   - setTheme 按 material.userData.role 遍历，合并后每个 role 只剩一个材质。
 *   - 拾取用 map.project 距离判定，与几何合并无关。
 * 任何一次合并若返回 null（属性不一致），回退为未合并网格，绝不让建筑变空。
 * ============================================================ */

// 克隆网格几何并烘焙其局部变换；含索引时转为 non-indexed 以便统一合并。
function bakedGeometry(mesh) {
  mesh.updateMatrix();
  let geo = mesh.geometry.clone();
  geo.applyMatrix4(mesh.matrix);
  if (geo.index) geo = geo.toNonIndexed();
  return geo;
}

// 把一组网格按"材质实例"分组，各组烘焙后合并为一个网格并保留原材质
// （role / baseColor / atlasColor 都在材质 userData 上，原样保留）。
// 多数 body 网格共享同一 mat，少数 profile（克尔白 / 护城河）有专属材质。
function mergeByMaterial(meshes) {
  const groups = new Map();
  for (const mesh of meshes) {
    if (!groups.has(mesh.material)) groups.set(mesh.material, []);
    groups.get(mesh.material).push(mesh);
  }
  const out = [];
  for (const [material, groupMeshes] of groups) {
    const geos = groupMeshes.map(bakedGeometry);
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (merged) {
      out.push(new THREE.Mesh(merged, material));
      if (geos.length > 1) for (const g of geos) g.dispose();
    } else {
      // 合并失败：回退为原始网格（已带各自局部变换）。
      for (const g of geos) g.dispose();
      for (const m of groupMeshes) out.push(m);
    }
  }
  return out;
}

// 把一组各自带 material.color 的网格烘焙为单一顶点色网格：
// 每个网格的 material.color 写入 color 顶点属性，合并后用一个 vertexColors 材质。
// 失败返回 null，由调用方回退为原始网格。
function mergeVertexColored(meshes, material) {
  const geos = [];
  for (const mesh of meshes) {
    const geo = bakedGeometry(mesh);
    const c = mesh.material.color;
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geos.push(geo);
  }
  const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
  if (geos.length > 1) for (const g of geos) g.dispose();
  if (!merged) return null;
  return new THREE.Mesh(merged, material);
}

export function createBuildingLayer(landmarks) {
  return {
    id: 'buildings-3d',
    type: 'custom',
    renderingMode: '3d',
    _needsAnimTick: false,
    layerVisible: true,
    focusId: null,
    // 底图就绪门控：底图瓦片绘出前不渲染建筑，避免首屏"建筑悬浮在黑色虚空"的中间态。
    _baseReady: false,

    onAdd(map, gl) {
      this.map = map;
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // 光照按主题在 setTheme 里调强度：dark 需要更强的明暗对比让低模剪影清晰，
      // atlas 维持原来的柔光（冻结观感）。这里存引用，初值给 dark。
      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffe8c0, 1.25);
      dir.position.set(0.4, -0.7, 1).normalize();
      this.scene.add(dir);
      const fill = new THREE.DirectionalLight(0xffd6a0, 0.10);
      fill.position.set(0, 0.7, 0.5).normalize();
      this.scene.add(fill);
      this.ambientLight = ambient;
      this.dirMain = dir;
      this.dirFill = fill;

      this.meshes = {};
      landmarks.forEach((building) => {
        const group = this.makeMesh(building);
        const merc = maplibregl.MercatorCoordinate.fromLngLat([building.lng, building.lat], 0);
        const scale = merc.meterInMercatorCoordinateUnits();
        const sizeMeters = 260000;
        group.position.set(merc.x, merc.y, merc.z);
        group.rotation.x = Math.PI / 2;
        group.userData = building;
        group.userData.mercatorScale = scale;
        group.userData.baseScale = scale * sizeMeters;
        group.userData.animFactor = 1; // 当前缩放系数 0..1
        group.userData.animTarget = 1; // 目标（1 显示 / 0 隐藏）
        group.scale.set(scale * sizeMeters, scale * sizeMeters, scale * sizeMeters);
        group.visible = true;
        this.scene.add(group);
        this.meshes[building.id] = group;
      });

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      this.renderer.autoClear = false;
      this.updateScale();
      map.on('zoom', () => this.updateScale());
    },

    getSizeMeters() {
      if (!this.map) return 150000;
      const zoom = this.map.getZoom();
      // World view still needs readable "game pieces", but close-up views must
      // shrink aggressively so nearby landmarks (Beijing: Forbidden City /
      // Temple of Heaven / Great Wall) do not overlap into one false megamodel.
      if (zoom <= 3.5) return 120000;
      if (zoom < 6) {
        const t = (zoom - 3.5) / 2.5;
        return 120000 + (42000 - 120000) * t;
      }
      if (zoom >= 8) return 16000;
      const t = (zoom - 6) / 2;
      return 42000 + (16000 - 42000) * t;
    },

    updateScale() {
      if (!this.meshes) return;
      const sizeMeters = this.getSizeMeters();
      Object.values(this.meshes).forEach((mesh) => {
        mesh.userData.baseScale = mesh.userData.mercatorScale * sizeMeters;
        this.applyScale(mesh);
      });
      if (this.map) this.map.triggerRepaint();
    },

    // 应用最终缩放 = 基础缩放(随 zoom) × 出现/消失渐变系数。
    applyScale(mesh) {
      const base = mesh.userData.baseScale
        ?? (mesh.userData.mercatorScale * this.getSizeMeters());
      const f = smoothstep(mesh.userData.animFactor ?? 1);
      const focusBoost = this.focusId && mesh.userData.id === this.focusId
        ? (FOCUS_SCALE_OVERRIDES[mesh.userData.id] ?? 1.18)
        : 1;
      const s = base * f * focusBoost;
      mesh.scale.set(s, s, s);
    },

    updateMeshVisibility(mesh) {
      const target = mesh.userData.animTarget ?? 1;
      const animFactor = mesh.userData.animFactor ?? 1;
      const activeByYear = target === 1 || animFactor > 0;
      const activeByFocus = !this.focusId || mesh.userData.id === this.focusId;
      mesh.visible = activeByYear && activeByFocus;
    },

    // 每帧推进出现/消失动画；全部到位后停止触发重绘（不空转）。
    stepAnim() {
      if (!this.meshes) return;
      const step = 0.14;
      let any = false;
      for (const mesh of Object.values(this.meshes)) {
        const f = mesh.userData.animFactor ?? 1;
        const t = mesh.userData.animTarget ?? 1;
        if (f === t) continue;
        let nf = f + Math.sign(t - f) * step;
        if (t > f && nf >= t) nf = t;
        if (t < f && nf <= t) nf = t;
        mesh.userData.animFactor = nf;
        this.applyScale(mesh);
        this.updateMeshVisibility(mesh);
        if (nf !== t) {
          any = true;
        }
      }
      this._animating = any;
      if (any && this.map) this.map.triggerRepaint();
    },

    makeMesh(building) {
      const group = new THREE.Group();
      const color = colorToNumber(building.color);
      const mat = new THREE.MeshPhongMaterial({
        color,
        emissive: 0x332211,
        emissiveIntensity: 0.45,
        shininess: 35,
        transparent: false,
      });
      mat.userData.role = 'body';
      mat.userData.baseColor = color;
      // atlas 主题用的"年代色调"：本色与时代色混 28%。
      mat.userData.atlasColor = lerpColorNum(color, eraColorNum(building.startYear), 0.28);

      // 选模型优先级：① 按 id 的代码侧覆写（招牌名建筑，如圣索菲亚）→
      // ② modelProfile 专属轮廓（重点样板建筑）→ ③ 按 type 通用模型 → ④ 兜底。
      // 主体网格按材质合并（多数共享 mat，少数 profile 有专属材质），砍掉 draw call。
      const overrideBuilder = ID_PROFILE_OVERRIDES[building.id] || null;
      const profileBuilder = building.modelProfile ? PROFILES[building.modelProfile] : null;
      const builder = overrideBuilder || profileBuilder || BUILDERS[building.type] || buildDefault;
      const bodyMeshes = mergeByMaterial(builder(mat));
      for (const merged of bodyMeshes) group.add(merged);

      // 招牌建筑：异步加载 GLB 替换程序化体块（失败则保留程序化兜底）。
      const glbUrl = ID_GLB_OVERRIDES[building.id];
      if (glbUrl) this.loadGlbBody(group, bodyMeshes, glbUrl, building);

      // 植被（M2）：温带/热带站点在足迹外圈放低多边形树丛（沙漠/干旱区跳过）。
      // 各树本色烘焙进顶点色，合并成单一 role='tree' 网格。
      if (GROVE_REGIONS.has(building.region)) {
        const treeMeshes = buildGrove(building);
        const treeMat = new THREE.MeshPhongMaterial({
          color: 0xffffff, vertexColors: true, transparent: true, opacity: 1,
          shininess: 3, emissive: 0x0b1206, emissiveIntensity: 0.12,
        });
        treeMat.userData = { role: 'tree' };
        const mergedTree = mergeVertexColored(treeMeshes, treeMat);
        if (mergedTree) {
          group.add(mergedTree);
          for (const m of treeMeshes) m.material.dispose();
        } else {
          treeMat.dispose();
          for (const m of treeMeshes) group.add(m);
        }
      }

      // 民居簇（M4）：都城/城邑/要塞/长城类站点散布聚落小屋。
      // 各屋时代色烘焙进顶点色，合并成单一 role='house' 网格。
      if (SETTLEMENT_TYPES.has(building.type)) {
        const houseMeshes = buildHamlet(building);
        const houseMat = new THREE.MeshPhongMaterial({
          color: 0xffffff, vertexColors: true, transparent: true, opacity: 1,
          shininess: 5, emissive: 0x140d06, emissiveIntensity: 0.12,
        });
        houseMat.userData = { role: 'house' };
        const mergedHouse = mergeVertexColored(houseMeshes, houseMat);
        if (mergedHouse) {
          group.add(mergedHouse);
          for (const m of houseMeshes) m.material.dispose();
        } else {
          houseMat.dispose();
          for (const m of houseMeshes) group.add(m);
        }
      }

      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.045,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      ringMat.userData = { role: 'aura', baseOpacity: 0.045 };
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.88, 0.98, 48), ringMat);
      ring.position.z = 0.01;
      group.add(ring);

      const discMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.012, side: THREE.DoubleSide, depthWrite: false,
      });
      discMat.userData = { role: 'aura', baseOpacity: 0.012 };
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.86, 48), discMat);
      disc.position.z = 0.005;
      group.add(disc);

      const beamMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.018,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      beamMat.userData = { role: 'beam', baseOpacity: 0.018 };
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 2.2, 12, 1, true), beamMat);
      beam.rotation.x = Math.PI / 2;
      beam.position.z = 1.5;
      group.add(beam);

      group.userData.ring = ring;
      group.userData.beam = beam;
      group.userData.bodyMeshes = bodyMeshes;
      return group;
    },

    /**
     * 异步加载招牌建筑的 GLB，成功后用它替换程序化体块（auras/beam/ring 保留）。
     * 失败（404 / 解析错误 / WebGL 限制）则什么都不做 —— 程序化模型继续显示，作兜底。
     * GLB 与程序化模型同坐标系（z 上、足迹 ±0.7、base 贴地），故替换后位置/朝向/贴地不变。
     */
    loadGlbBody(group, proceduralMeshes, url, building) {
      gltfLoader.load(
        url,
        (gltf) => {
          const root = gltf.scene || gltf.scenes?.[0];
          if (!root) return;
          const orientation = ID_GLB_ORIENTATION_OVERRIDES[building.id];
          if (orientation) {
            root.rotation.x += orientation.x ?? 0;
            root.rotation.y += orientation.y ?? 0;
            root.rotation.z += orientation.z ?? 0;
          }
          // 给 GLB 材质打上主题钩子：dark 保留 GLB 本色（材质分色层次），
          // atlas 用年代色调；role='body' 让 setTheme 一并处理自发光/高光。
          root.traverse((o) => {
            if (!o.isMesh || !o.material) return;
            o.castShadow = false;
            o.receiveShadow = false;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of mats) {
              m.userData = m.userData || {};
              m.userData.role = 'body';
              const hex = m.color ? m.color.getHex() : 0xffffff;
              m.userData.baseColor = hex;
              m.userData.atlasColor = lerpColorNum(hex, eraColorNum(building.startYear), 0.28);
            }
          });
          // 移除程序化体块（释放几何；共享的 body 材质留给 GC，避免误伤其它引用）。
          for (const m of proceduralMeshes) {
            group.remove(m);
            if (m.geometry) m.geometry.dispose();
          }
          group.add(root);
          group.userData.bodyMeshes = [root];
          group.userData.glbLoaded = true;
          // 把当前主题套用到新材质，并触发重绘。
          this.setTheme(this._themeKey || 'dark');
          if (this.map) this.map.triggerRepaint();
        },
        undefined,
        (err) => {
          // 兜底：保留程序化模型。
          // eslint-disable-next-line no-console
          console.warn(`[buildings] GLB load failed for ${building.id}, keeping procedural model.`, err);
        },
      );
    },

    /**
     * 切换主题：dark = 沙盘金色发光；atlas = 陶土 / 木雕，光环和光柱大幅压暗。
     * 不重建几何，只调材质属性。
     */
    setTheme(themeKey) {
      this._themeKey = themeKey;
      const atlas = themeKey === 'atlas';
      // 光照随主题：dark 强对比（剪影清晰）、atlas 柔光（冻结观感）。
      if (this.ambientLight) this.ambientLight.intensity = atlas ? 0.7 : 0.5;
      if (this.dirMain) this.dirMain.intensity = atlas ? 1.0 : 1.25;
      if (this.dirFill) this.dirFill.intensity = atlas ? 0.12 : 0.10;
      const visit = (object) => {
        if (object.material) {
          const mats = Array.isArray(object.material) ? object.material : [object.material];
          for (const m of mats) {
            const role = m.userData?.role;
            if (role === 'body') {
              object.visible = true;
              if (atlas) {
                m.emissive?.setHex(0x1a1208);
                m.emissiveIntensity = 0.12;
                m.shininess = 8;
                // 年代色调（仅 atlas）
                if (m.userData.atlasColor != null) m.color?.setHex(m.userData.atlasColor);
              } else {
                // dark：降低自发光、提高高光锐度，让面与面有明暗分界（不再发糊）。
                m.emissive?.setHex(0x2a1c0e);
                m.emissiveIntensity = 0.32;
                m.shininess = 48;
                if (m.userData.baseColor != null) m.color?.setHex(m.userData.baseColor);
              }
              m.needsUpdate = true;
            } else if (role === 'aura' || role === 'beam') {
              // dark 下也把光环/光柱压一档，避免光晕盖过建筑本体把它糊成光团。
              const base = m.userData.baseOpacity ?? m.opacity;
              m.opacity = role === 'beam'
                ? (atlas ? base * 0.12 : base * 0.22)
                : (atlas ? base * 0.30 : base * 0.6);
              m.needsUpdate = true;
            } else if (role === 'tree' || role === 'house') {
              // 树丛与民居只在 atlas 显示。dark 下必须真正隐藏，
              // 只把 opacity 设为 0 仍可能写入深度，造成建筑旁出现大片遮挡色块。
              object.visible = atlas;
              m.opacity = atlas ? 1 : 0;
              m.depthWrite = atlas;
              m.needsUpdate = true;
            }
          }
        }
        if (object.children) for (const c of object.children) visit(c);
      };
      if (this.scene) visit(this.scene);
      if (this.map) this.map.triggerRepaint();
    },

    render(gl, matrix) {
      if (!this.layerVisible || !this._baseReady) return;
      if (this._animating) this.stepAnim();
      const projection = new THREE.Matrix4().fromArray(matrix);
      this.camera.projectionMatrix = projection;
      this.renderer.resetState();
      // MapLibre terrain and fill layers can leave depth values that cut across
      // landmark meshes at steep pitch. Clear only depth here so buildings keep
      // their own internal 3D depth while rendering cleanly above the map skin.
      this.renderer.clearDepth();
      this.renderer.render(this.scene, this.camera);
    },

    setYear(year) {
      const visible = [];
      const first = !this._initialized;
      this._initialized = true;
      let any = false;
      for (const building of landmarks) {
        const mesh = this.meshes?.[building.id];
        if (!mesh) continue;
        const inRange = year >= building.startYear && year <= building.endYear;
        if (inRange) visible.push(building);
        const target = inRange ? 1 : 0;
        if (first) {
          // 首帧不做生长动画，直接到位。
          mesh.userData.animTarget = target;
          mesh.userData.animFactor = target;
          this.applyScale(mesh);
          this.updateMeshVisibility(mesh);
        } else if (mesh.userData.animTarget !== target) {
          mesh.userData.animTarget = target;
          if (target === 1) {
            // 从一个较小尺寸"长出来"
            if ((mesh.userData.animFactor ?? 1) >= 1) mesh.userData.animFactor = 0.45;
          }
          any = true;
        }
        this.updateMeshVisibility(mesh);
        if (mesh.userData.animFactor !== mesh.userData.animTarget) any = true;
      }
      this._animating = any;
      if (this.map) this.map.triggerRepaint();
      return visible;
    },

    setLayerVisible(visible) {
      this.layerVisible = visible;
      if (this.map) this.map.triggerRepaint();
    },

    setFocus(focusId) {
      this.focusId = focusId || null;
      if (this.meshes) {
        for (const mesh of Object.values(this.meshes)) {
          this.applyScale(mesh);
          this.updateMeshVisibility(mesh);
        }
      }
      if (this.map) this.map.triggerRepaint();
    },

    // 底图瓦片就绪后调用：放行渲染，并让当前可见建筑"长出来"而非硬弹出。
    setBaseReady(ready = true) {
      if (this._baseReady === ready) return;
      this._baseReady = ready;
      if (ready && this.meshes) {
        let any = false;
        for (const mesh of Object.values(this.meshes)) {
          if (mesh.userData.animTarget === 1) {
            mesh.userData.animFactor = 0.4;
            this.updateMeshVisibility(mesh);
            any = true;
          }
        }
        if (any) this._animating = true;
      }
      if (this.map) this.map.triggerRepaint();
    },

    dispose() {
      // 遍历场景释放几何与材质（renderer.dispose 只释放渲染器自身资源）。
      if (this.scene) {
        this.scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) m.dispose();
          }
        });
      }
      if (this.renderer) this.renderer.dispose();
    },
  };
}
