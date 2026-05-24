import * as THREE from 'three';
import maplibregl from 'maplibre-gl';

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
  // Long nave + central transept + spire.
  const meshes = [];
  const nave = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.5), mat);
  nave.position.z = 0.25;
  const transept = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.45), mat);
  transept.position.z = 0.22;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 0.12), mat);
  roof.position.z = 0.56;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.85, 6), mat);
  spire.position.z = 1.05;
  // Two square towers at one end
  const towerL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.85), mat);
  towerL.position.set(-0.62, -0.1, 0.42);
  const towerR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.85), mat);
  towerR.position.set(-0.62, 0.1, 0.42);
  meshes.push(nave, transept, roof, spire, towerL, towerR);
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

function buildDefault(mat) {
  // Simple stepped cube fallback for unknown types.
  const base = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.3), mat);
  base.position.z = 0.15;
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.4), mat);
  top.position.z = 0.5;
  return [base, top];
}

export function createBuildingLayer(landmarks) {
  return {
    id: 'buildings-3d',
    type: 'custom',
    renderingMode: '3d',
    _needsAnimTick: false,
    layerVisible: true,

    onAdd(map, gl) {
      this.map = map;
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffe8c0, 1);
      dir.position.set(0.4, -0.7, 1).normalize();
      this.scene.add(dir);
      const blue = new THREE.DirectionalLight(0x6090ff, 0.4);
      blue.position.set(0, 0.7, 0.5).normalize();
      this.scene.add(blue);

      this.meshes = {};
      landmarks.forEach((building) => {
        const group = this.makeMesh(building);
        const merc = maplibregl.MercatorCoordinate.fromLngLat([building.lng, building.lat], 0);
        const scale = merc.meterInMercatorCoordinateUnits();
        const sizeMeters = 260000;
        group.position.set(merc.x, merc.y, merc.z);
        group.scale.set(scale * sizeMeters, scale * sizeMeters, scale * sizeMeters);
        group.rotation.x = Math.PI / 2;
        group.userData = building;
        group.userData.mercatorScale = scale;
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
      if (!this.map) return 260000;
      const zoom = this.map.getZoom();
      if (zoom <= 3.5) return 220000;
      if (zoom >= 6) return 60000;
      const t = (zoom - 3.5) / 2.5;
      return 220000 + (60000 - 220000) * t;
    },

    updateScale() {
      if (!this.meshes) return;
      const sizeMeters = this.getSizeMeters();
      Object.values(this.meshes).forEach((mesh) => {
        const scale = mesh.userData.mercatorScale * sizeMeters;
        mesh.scale.set(scale, scale, scale);
      });
      if (this.map) this.map.triggerRepaint();
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

      const builder = BUILDERS[building.type] || buildDefault;
      for (const mesh of builder(mat)) group.add(mesh);

      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.28, 48), ringMat);
      ring.position.z = 0.01;
      group.add(ring);

      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(1.05, 48),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, side: THREE.DoubleSide }),
      );
      disc.position.z = 0.005;
      group.add(disc);

      const beamMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.10,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.30, 5, 12, 1, true), beamMat);
      beam.rotation.x = Math.PI / 2;
      beam.position.z = 3;
      group.add(beam);

      group.userData.ring = ring;
      group.userData.beam = beam;
      return group;
    },

    render(gl, matrix) {
      if (!this.layerVisible) return;
      const projection = new THREE.Matrix4().fromArray(matrix);
      this.camera.projectionMatrix = projection;
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
    },

    setYear(year) {
      const visible = [];
      for (const building of landmarks) {
        const mesh = this.meshes?.[building.id];
        if (!mesh) continue;
        const inRange = year >= building.startYear && year <= building.endYear;
        mesh.visible = inRange;
        if (inRange) visible.push(building);
      }
      if (this.map) this.map.triggerRepaint();
      return visible;
    },

    setLayerVisible(visible) {
      this.layerVisible = visible;
      if (this.map) this.map.triggerRepaint();
    },

    dispose() {
      if (!this.renderer) return;
      this.renderer.dispose();
    },
  };
}
