import {
  Color, Material, Mesh, MeshRenderer, Node, gfx, primitives, utils,
} from 'cc';
import { WORLD_SCALE } from './SandboxTypes';

function makeMaterial(effectName: string, mainColor: Color, transparent = false): Material {
  const mat = new Material();
  mat.initialize({ effectName });
  mat.setProperty('mainColor', mainColor);
  if (effectName === 'builtin-standard') {
    mat.setProperty('roughness', 0.92);
    mat.setProperty('metallic', 0.0);
  }
  if (transparent) {
    mat.overridePipelineStates({
      blendState: {
        targets: [{
          blend: true,
          blendSrc: gfx.BlendFactor.SRC_ALPHA,
          blendDst: gfx.BlendFactor.ONE_MINUS_SRC_ALPHA,
        }],
      },
      depthStencilState: {
        depthTest: true,
        depthWrite: false,
      },
    });
  }
  return mat;
}

function addMesh(parent: Node, name: string, mesh: Mesh, mat: Material, y: number): Node {
  const node = new Node(name);
  node.setParent(parent);
  node.setPosition(0, y, 0);
  const renderer = node.addComponent(MeshRenderer);
  renderer.mesh = mesh;
  renderer.material = mat;
  return node;
}

export function buildOcean(parent: Node): Node {
  const geo = primitives.plane({ width: 84, length: 84, widthSegments: 1, lengthSegments: 1 });
  const mesh = utils.createMesh(geo);
  const mat = makeMaterial('builtin-unlit', new Color(14, 35, 58, 255));
  return addMesh(parent, 'Ocean', mesh, mat, -0.08);
}

export function buildLand(parent: Node): Node {
  const size = 60;
  const segments = 44;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let z = 0; z <= segments; z++) {
    for (let x = 0; x <= segments; x++) {
      const px = -size / 2 + (size * x) / segments;
      const pz = -size / 2 + (size * z) / segments;
      const ridge =
        Math.sin((px + 9) * 0.33) * Math.cos((pz - 2) * 0.25) +
        Math.sin((px - pz) * 0.18) * 0.55;
      const falloff = Math.max(0, 1 - Math.hypot(px * 0.045, pz * 0.038));
      const py = Math.max(0, ridge) * 0.42 * falloff;
      positions.push(px, py, pz);
      normals.push(0, 1, 0);
    }
  }

  const row = segments + 1;
  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const a = z * row + x;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const mesh = utils.createMesh({ positions, normals, indices });
  const mat = makeMaterial('builtin-standard', new Color(88, 99, 78, 255));
  return addMesh(parent, 'ReliefLand', mesh, mat, 0);
}

export function buildBoundary(parent: Node, rings: number[][][], colorHex: string): Node {
  const root = new Node('Boundary');
  root.setParent(parent);
  const base = hexToColor(colorHex);
  const fill = new Color(base.r, base.g, base.b, 118);
  const edge = new Color(Math.min(255, base.r + 70), Math.min(255, base.g + 60), Math.min(255, base.b + 80), 225);

  for (const rawRing of rings) {
    const ring = rawRing.map((p) => [p[0] * WORLD_SCALE, p[1] * WORLD_SCALE]);
    const fillMesh = buildFill(ring);
    if (fillMesh) {
      addMesh(root, 'Fill', fillMesh, makeMaterial('builtin-unlit', fill, true), 0.12);
    }
    const lineMesh = buildRibbon(ring, 0.13);
    if (lineMesh) {
      addMesh(root, 'Edge', lineMesh, makeMaterial('builtin-unlit', edge, true), 0.16);
    }
  }
  return root;
}

function buildFill(ring: number[][]): Mesh | null {
  if (ring.length < 3) return null;
  const normalized = polygonArea(ring) < 0 ? ring.slice().reverse() : ring.slice();
  const positions: number[] = [];
  const normals: number[] = [];
  for (const point of normalized) {
    positions.push(point[0], 0, point[1]);
    normals.push(0, 1, 0);
  }
  const indices = earClip(normalized);
  return indices.length >= 3 ? utils.createMesh({ positions, normals, indices }) : null;
}

function polygonArea(ring: number[][]): number {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function earClip(ring: number[][]): number[] {
  const indices = ring.map((_, i) => i);
  const triangles: number[] = [];
  let guard = 0;

  while (indices.length > 3 && guard++ < ring.length * ring.length) {
    let clipped = false;
    for (let i = 0; i < indices.length; i++) {
      const i0 = indices[(i - 1 + indices.length) % indices.length];
      const i1 = indices[i];
      const i2 = indices[(i + 1) % indices.length];
      const a = ring[i0];
      const b = ring[i1];
      const c = ring[i2];
      const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (cross <= 0) continue;

      let containsPoint = false;
      for (const j of indices) {
        if (j === i0 || j === i1 || j === i2) continue;
        if (pointInTriangle(ring[j], a, b, c)) {
          containsPoint = true;
          break;
        }
      }
      if (containsPoint) continue;

      triangles.push(i0, i1, i2);
      indices.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }

  if (indices.length === 3) {
    triangles.push(indices[0], indices[1], indices[2]);
  }
  return triangles;
}

function pointInTriangle(p: number[], a: number[], b: number[], c: number[]): boolean {
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function sign(p: number[], a: number[], b: number[]) {
  return (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
}

function buildRibbon(ring: number[][], width: number): Mesh | null {
  if (ring.length < 3) return null;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const half = width / 2;

  for (let i = 0; i < ring.length; i++) {
    const prev = ring[(i - 1 + ring.length) % ring.length];
    const cur = ring[i];
    const next = ring[(i + 1) % ring.length];
    let nx = next[1] - prev[1];
    let nz = -(next[0] - prev[0]);
    const len = Math.hypot(nx, nz) || 1;
    nx /= len;
    nz /= len;
    positions.push(cur[0] + nx * half, 0, cur[1] + nz * half);
    positions.push(cur[0] - nx * half, 0, cur[1] - nz * half);
    normals.push(0, 1, 0, 0, 1, 0);
  }

  for (let i = 0; i < ring.length; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = ((i + 1) % ring.length) * 2;
    const d = ((i + 1) % ring.length) * 2 + 1;
    indices.push(a, c, b, b, c, d);
  }

  return utils.createMesh({ positions, normals, indices });
}

export function hexToColor(hex: string): Color {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return new Color(r, g, b, 255);
}
