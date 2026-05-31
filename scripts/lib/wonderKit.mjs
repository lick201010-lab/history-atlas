// 奇观 GLB 资产管线 —— 可复用工具箱（scripts/lib/wonderKit.mjs）
//
// 设计目标：把「一次性手写几何堆叠」升级为「参数化、可复用、零贴图」的资产管线。
// 任何一座奇观（圣索菲亚、斗兽场、帕特农……）都用同一套原语 + 同一条导出/优化流程：
//   1) 用 WonderAsset 的参数化原语（体块 / 倾斜板 / 柱体 / 锥 / 球壳穹顶 / 旋转面穹顶 /
//      拱廊）搭出体量；每个原语按「材质分区 key」归桶。
//   2) 导出阶段按 key 合并几何（每材质一个 mesh，少 draw call）、计算法线、
//      叠加顶点色 AO（底暗顶亮、朝下面压暗），再合并重复顶点做轻量优化。
//   3) 全程顶点着色、零贴图 → GLB 体积小、无大贴图、无外部资源、无授权风险
//      （几何 100% 原创程序化生成）。
//
// 坐标约定（与 createBuildingLayer 程序化 builder 一致）：z = 上，足迹约 ±0.7，
//   base 贴地（z≥0）。在 createBuildingLayer 里替换程序化体块后位置/朝向/贴地不变。

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { writeFile, mkdir } from 'node:fs/promises';

// GLTFExporter 二进制路径用浏览器 FileReader 把 Blob 读成 ArrayBuffer。
// Node 18+ 有全局 Blob 但没有 FileReader —— 用 Blob.arrayBuffer() 补一个最小实现。
export function ensureFileReaderPolyfill() {
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
}

export function smooth01(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export class WonderAsset {
  constructor({ name = 'Wonder' } = {}) {
    this.name = name;
    this.buckets = {}; // key -> [BufferGeometry]
  }

  push(geometry, key) {
    (this.buckets[key] ||= []).push(geometry);
  }

  // ---- 参数化原语 ---------------------------------------------------------
  box(key, sx, sy, sz, x, y, z) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    g.translate(x, y, z);
    this.push(g, key);
  }

  boxRotZ(key, sx, sy, sz, x, y, z, rz) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    g.rotateZ(rz);
    g.translate(x, y, z);
    this.push(g, key);
  }

  // 绕 x 轴倾斜的薄板（做单坡屋面：沿 x 铺满、沿 y 倾斜）
  boxRotX(key, sx, sy, sz, x, y, z, rx) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    g.rotateX(rx);
    g.translate(x, y, z);
    this.push(g, key);
  }

  // 绕 y 轴倾斜的板（做沿 x 升起的坡道/大台阶斜面）
  boxRotY(key, sx, sy, sz, x, y, z, ry) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    g.rotateY(ry);
    g.translate(x, y, z);
    this.push(g, key);
  }

  // 轴向沿 z 的柱体；thetaStart 可让低边数多边形（如 8 边八角体）的平面朝向坐标轴
  cyl(key, rTop, rBot, h, x, y, z, seg = 24, thetaStart = 0) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, false, thetaStart);
    g.rotateX(Math.PI / 2);
    g.translate(x, y, z);
    this.push(g, key);
  }

  // 顶点朝上的锥（base 在 z）
  coneUp(key, r, h, x, y, z, seg = 24) {
    const g = new THREE.ConeGeometry(r, h, seg);
    g.rotateX(Math.PI / 2);
    g.translate(x, y, z + h / 2);
    this.push(g, key);
  }

  // 半球壳穹顶（球面段）：底在 z，向上鼓起；scaleZ 压扁
  dome(key, r, x, y, z, scaleZ = 1, segW = 32, segH = 18) {
    const g = new THREE.SphereGeometry(r, segW, segH, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(1, 1, scaleZ);
    g.rotateX(Math.PI / 2);
    g.translate(x, y, z);
    this.push(g, key);
  }

  // 旋转面穹顶（LatheGeometry）：用可调侧影曲线（微 ogee 拜占庭穹顶轮廓）绕轴旋成，
  //   比纯半球更有「鼓身 + 略尖顶冠」的层次。crownPow>1 收尖顶冠，basePow<1 让基部更饱满。
  latheDome(key, r, x, y, z, scaleZ = 1, seg = 48, { rings = 16, basePow = 0.92, crownPow = 1.12 } = {}) {
    const pts = [];
    for (let i = 0; i <= rings; i += 1) {
      const t = i / rings;                 // 0 基部 -> 1 顶冠
      const ang = t * (Math.PI / 2);
      const rr = Math.pow(Math.cos(ang), basePow) * r;
      const hh = Math.pow(Math.sin(ang), crownPow) * r * scaleZ;
      pts.push(new THREE.Vector2(Math.max(rr, 1e-4), hh));
    }
    const g = new THREE.LatheGeometry(pts, seg);
    g.rotateX(Math.PI / 2);                // 旋转轴 Y -> Z（向上）
    g.translate(x, y, z);
    this.push(g, key);
  }

  sphere(key, r, x, y, z, seg = 14) {
    const g = new THREE.SphereGeometry(r, seg, seg);
    g.translate(x, y, z);
    this.push(g, key);
  }

  // 拱廊：沿 y 排一列「拱洞暗块 + 顶部半圆拱」，做出柱廊/连拱层次。
  //   面朝 ±x（face=±1），墙体外表面在 xWall，开洞嵌入 depth。
  arcade(keyVoid, keyArch, { face = 1, xWall, ys, z, w, h, depth, arch = true, seg = 8 }) {
    for (const y of ys) {
      // 拱洞竖向暗块（凹陷感）
      this.box(keyVoid, depth, w, h, xWall + face * depth * 0.5, y, z + h / 2);
      if (arch) {
        // 顶部半圆拱（半圆柱，轴向沿 x）
        const g = new THREE.CylinderGeometry(w / 2, w / 2, depth, seg, 1, false, 0, Math.PI);
        g.rotateZ(Math.PI / 2);            // 让半圆开口朝下、轴向沿 x
        g.rotateX(Math.PI / 2);
        g.translate(xWall + face * depth * 0.5, y, z + h);
        this.push(g, keyArch);
      }
    }
  }

  // 通用旋转面：给定侧影点列 profile=[[r,h],...]（h 从 0 向上），绕竖轴旋成壳体。
  //   洋葱穹顶等「先鼓后收」的非单调轮廓用它（latheDome 只能单调收分）。
  lathe(key, profile, x, y, z, seg = 48) {
    const pts = profile.map(([r, h]) => new THREE.Vector2(Math.max(r, 1e-4), h));
    const g = new THREE.LatheGeometry(pts, seg);
    g.rotateX(Math.PI / 2);                 // 旋转轴 Y -> Z（向上）
    g.translate(x, y, z);
    this.push(g, key);
  }

  // 三角山墙 / 楔形棱柱：等腰三角形截面（底宽 w、顶高 h），沿厚度方向 d 挤出。
  //   plane='yz' → 底沿 Y、顶尖朝上 Z、厚度沿 X（朝 ±X 的山墙；d=进深时也可当沿 X 的坡屋顶，
  //     此时两端三角面即山花/三角楣）。plane='xz' → 底沿 X、顶尖朝上 Z、厚度沿 Y。
  gable(key, w, h, d, x, y, z, plane = 'yz') {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(0, h);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);               // 居中厚度
    g.rotateX(Math.PI / 2);                  // 顶尖 Y->Z(上)，厚度 Z->Y；底仍沿 X
    if (plane === 'yz') g.rotateZ(Math.PI / 2); // 底 X->Y，厚 Y->X；顶尖仍沿 Z
    g.translate(x, y, z);
    this.push(g, key);
  }

  // 阶梯金字塔：由若干层方台（4 边棱台）自下而上收分叠成，显出石材层次。
  //   baseHalf = 底层「面」半宽（朝 ±x/±y 为平面），height 总高，layers 层数。
  //   topHalf>0 → 截顶平台金字塔（中美洲阶梯庙/截顶塔/阶梯塔身用）；=0 → 收到尖顶。
  //   bandKey 给奇数层换色 → 砌层带感。twist 让方形面朝向坐标轴。
  stepPyramid(key, baseHalf, height, layers, x, y, z, { bandKey = null, twist = Math.PI / 4, topHalf = 0 } = {}) {
    const layerH = height / layers;
    const Rb = baseHalf * Math.SQRT2, Rt = topHalf * Math.SQRT2;   // 角半径
    for (let i = 0; i < layers; i += 1) {
      const rBot = Rb + (Rt - Rb) * (i / layers);
      const rTop = Rb + (Rt - Rb) * ((i + 1) / layers);
      const g = new THREE.CylinderGeometry(Math.max(rTop, 1e-4), rBot, layerH, 4, 1, false, twist);
      g.rotateX(Math.PI / 2);
      g.translate(x, y, z + layerH * (i + 0.5));
      this.push(g, (bandKey && i % 2 === 1) ? bandKey : key);
    }
  }

  // 椭圆环墙：沿椭圆 (a,b) 铺一圈切向墙段，可被调用者按角度决定高度/层级（做斗兽场环）。
  //   callback(i, theta, px, py, tangent) -> { height, key } | null（返回 null 跳过该段）。
  ellipseRing(a, b, n, z, thickness, segLenScale, fn) {
    for (let i = 0; i < n; i += 1) {
      const th = (i / n) * Math.PI * 2;
      const px = a * Math.cos(th);
      const py = b * Math.sin(th);
      const tangent = Math.atan2(b * Math.cos(th), -a * Math.sin(th));
      const spec = fn(i, th, px, py, tangent);
      if (!spec) continue;
      const next = ((i + 1) / n) * Math.PI * 2;
      const nx = a * Math.cos(next), ny = b * Math.sin(next);
      const chord = Math.hypot(nx - px, ny - py) * segLenScale;
      this.boxRotZ(spec.key, chord, thickness, spec.height, px, py, z + spec.height / 2, tangent);
    }
  }

  // ---- 顶点色 AO ----------------------------------------------------------
  static applyVertexAO(geom, zMin, zMax) {
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

  // ---- 合并 + 优化 + 导出 GLB --------------------------------------------
  // colors: { key: hex }；material(key) -> { metalness, roughness }
  async exportGlb(outUrl, { colors, material, weld = true }) {
    ensureFileReaderPolyfill();

    // 全模型 z 范围（AO 用）
    let zMin = Infinity, zMax = -Infinity;
    for (const geoms of Object.values(this.buckets)) {
      for (const g of geoms) {
        g.computeBoundingBox();
        zMin = Math.min(zMin, g.boundingBox.min.z);
        zMax = Math.max(zMax, g.boundingBox.max.z);
      }
    }

    const scene = new THREE.Scene();
    scene.name = this.name;
    let parts = 0;
    let triangles = 0;
    let weldedVerts = 0;
    let totalVerts = 0;
    for (const [key, geoms] of Object.entries(this.buckets)) {
      parts += geoms.length;
      // 仅保留 position/normal/uv 三件套，确保各原语属性集一致可合并。
      const keep = ['position', 'normal', 'uv'];
      for (const g of geoms) {
        for (const name of Object.keys(g.attributes)) if (!keep.includes(name)) g.deleteAttribute(name);
      }
      // mergeGeometries 要求「索引存在性」一致。同桶若混了索引几何（Box/Cyl）与
      // 非索引几何（Extrude/gable），仅在这种混合时统一去索引；否则保持索引以利顶点共享、控体积。
      const allIndexed = geoms.every((g) => g.index);
      const noneIndexed = geoms.every((g) => !g.index);
      const toMerge = (allIndexed || noneIndexed) ? geoms : geoms.map((g) => (g.index ? g.toNonIndexed() : g));
      let merged = mergeGeometries(toMerge, false);
      if (!merged) throw new Error(`merge failed for ${key}`);
      merged.computeVertexNormals();
      WonderAsset.applyVertexAO(merged, zMin, zMax);
      // 轻量优化：合并完全重合（位置+法线+色一致）的顶点；不改变外观（硬边因法线不同保留）。
      if (weld) {
        const before = merged.attributes.position.count;
        try {
          const w = mergeVertices(merged, 1e-4);
          weldedVerts += before - w.attributes.position.count;
          totalVerts += before;
          merged = w;
        } catch { totalVerts += before; }
      } else {
        totalVerts += merged.attributes.position.count;
      }
      const idx = merged.getIndex();
      triangles += (idx ? idx.count : merged.attributes.position.count) / 3;

      const m = (material ? material(key) : {}) || {};
      const mat = new THREE.MeshStandardMaterial({
        color: colors[key],
        vertexColors: true,
        metalness: m.metalness ?? 0.0,
        roughness: m.roughness ?? 0.85,
      });
      mat.name = key;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.name = `part-${key}`;
      scene.add(mesh);
    }

    await mkdir(new URL('./', outUrl), { recursive: true });
    const exporter = new GLTFExporter();
    const buffer = await new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => resolve(Buffer.from(result)),
        (err) => reject(err),
        { binary: true, onlyVisible: false },
      );
    });
    await writeFile(outUrl, buffer);

    const stats = {
      materials: Object.keys(this.buckets).length,
      parts,
      triangles: Math.round(triangles),
      weldedVerts,
      totalVerts,
      zMin, zMax,
      bytes: buffer.length,
    };
    return stats;
  }
}
