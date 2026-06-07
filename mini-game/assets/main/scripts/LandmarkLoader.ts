import {
  _decorator, AssetManager, Color, Component, Material, MeshRenderer, Node,
  Prefab, instantiate, primitives, utils,
} from 'cc';
import { LandmarkData, WORLD_SCALE } from './SandboxTypes';

const { ccclass } = _decorator;
const GLB_PITCH_FIX = -90;

@ccclass('LandmarkLoader')
export class LandmarkLoader extends Component {
  async place(parent: Node, bundle: AssetManager.Bundle, landmarks: LandmarkData[]) {
    for (const landmark of landmarks) {
      const prefabName = landmark.glb.replace(/\.glb$/i, '');
      const prefab = await this.loadPrefab(bundle, prefabName);
      const holder = new Node(landmark.id);
      holder.setParent(parent);
      holder.setPosition(landmark.x * WORLD_SCALE, 0.24, landmark.z * WORLD_SCALE);
      const scale = landmark.primary ? 1.75 : 1.05;
      holder.setScale(scale, scale, scale);

      if (prefab) {
        const model = instantiate(prefab);
        model.setParent(holder);
        model.setRotationFromEuler(GLB_PITCH_FIX, 0, 0);
        model.setPosition(0, 0, 0);
      } else {
        this.createPlaceholder(holder, landmark);
        console.warn(`[LandmarkLoader] prefab not found: ${prefabName}, using placeholder`);
      }
    }
  }

  private loadPrefab(bundle: AssetManager.Bundle, name: string): Promise<Prefab | null> {
    return new Promise((resolve) => {
      bundle.load(name, Prefab, (err, prefab) => {
        resolve(err ? null : prefab as Prefab);
      });
    });
  }

  private createPlaceholder(parent: Node, landmark: LandmarkData) {
    const node = new Node('FallbackModel');
    node.setParent(parent);
    node.setPosition(0, 0, 0);
    node.setRotationFromEuler(0, landmark.id === 'colosseum' ? 12 : -8, 0);

    if (landmark.id === 'hagia-sophia') {
      this.createHagiaSophia(node);
      return;
    }
    if (landmark.id === 'parthenon') {
      this.createParthenon(node);
      return;
    }
    if (landmark.id === 'colosseum') {
      this.createColosseum(node);
      return;
    }
    this.addBox(node, 'Mass', 1.2, 0.5, 0.8, 0, 0.25, 0, this.stone(landmark.primary));
  }

  private createHagiaSophia(parent: Node) {
    const wall = this.stone(true);
    const roof = this.roof();
    this.addBox(parent, 'Nave', 1.65, 0.45, 1.05, 0, 0.23, 0, wall);
    this.addBox(parent, 'DomeDrum', 0.9, 0.34, 0.9, 0, 0.64, 0, wall);
    this.addBox(parent, 'Dome', 1.08, 0.22, 1.08, 0, 0.94, 0, roof);
    this.addBox(parent, 'FrontApse', 0.42, 0.34, 0.62, 0, 0.5, -0.82, wall);
    this.addBox(parent, 'RearApse', 0.42, 0.34, 0.62, 0, 0.5, 0.82, wall);
    const towerPositions = [
      [-0.9, -0.62], [0.9, -0.62], [-0.9, 0.62], [0.9, 0.62],
    ];
    for (const [x, z] of towerPositions) {
      this.addBox(parent, 'Minaret', 0.14, 1.1, 0.14, x, 0.72, z, wall);
      this.addBox(parent, 'MinaretCap', 0.2, 0.18, 0.2, x, 1.36, z, roof);
    }
  }

  private createParthenon(parent: Node) {
    const stone = this.stone(false);
    this.addBox(parent, 'Stylobate', 1.65, 0.12, 0.92, 0, 0.06, 0, stone);
    this.addBox(parent, 'Roof', 1.78, 0.18, 1.02, 0, 0.76, 0, this.roof());
    for (let i = 0; i < 8; i++) {
      const x = -0.68 + i * 0.195;
      this.addBox(parent, 'ColumnFront', 0.06, 0.62, 0.06, x, 0.41, -0.42, stone);
      this.addBox(parent, 'ColumnBack', 0.06, 0.62, 0.06, x, 0.41, 0.42, stone);
    }
  }

  private createColosseum(parent: Node) {
    const stone = this.stone(false);
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * 0.75;
      const z = Math.sin(angle) * 0.48;
      const block = this.addBox(parent, 'Arcade', 0.12, 0.55, 0.09, x, 0.3, z, stone);
      block.setRotationFromEuler(0, -(angle * 180) / Math.PI, 0);
    }
    this.addBox(parent, 'ArenaFloor', 1.08, 0.08, 0.6, 0, 0.08, 0, this.sand());
  }

  private addBox(parent: Node, name: string, width: number, height: number, length: number, x: number, y: number, z: number, material: Material): Node {
    const node = new Node(name);
    node.setParent(parent);
    node.setPosition(x, y, z);
    const renderer = node.addComponent(MeshRenderer);
    renderer.mesh = utils.createMesh(primitives.box({ width, height, length }));
    renderer.material = material;
    return node;
  }

  private stone(primary: boolean): Material {
    return this.material(primary ? new Color(194, 151, 96, 255) : new Color(185, 166, 128, 255));
  }

  private roof(): Material {
    return this.material(new Color(143, 111, 76, 255));
  }

  private sand(): Material {
    return this.material(new Color(132, 105, 75, 255));
  }

  private material(color: Color): Material {
    const material = new Material();
    material.initialize({ effectName: 'builtin-standard' });
    material.setProperty('mainColor', color);
    material.setProperty('roughness', 0.86);
    material.setProperty('metallic', 0.0);
    return material;
  }
}
