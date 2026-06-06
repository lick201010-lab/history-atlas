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
      holder.setPosition(landmark.x * WORLD_SCALE, 0.18, landmark.z * WORLD_SCALE);
      const scale = landmark.primary ? 0.9 : 0.55;
      holder.setScale(scale, scale, scale);

      if (prefab) {
        const model = instantiate(prefab);
        model.setParent(holder);
        model.setRotationFromEuler(GLB_PITCH_FIX, 0, 0);
        model.setPosition(0, 0, 0);
      } else {
        this.createPlaceholder(holder, landmark.primary);
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

  private createPlaceholder(parent: Node, primary: boolean) {
    const node = new Node('FallbackModel');
    node.setParent(parent);
    node.setPosition(0, 0.2, 0);
    node.setScale(primary ? 1.3 : 0.8, primary ? 0.7 : 0.45, primary ? 0.9 : 0.6);

    const renderer = node.addComponent(MeshRenderer);
    renderer.mesh = utils.createMesh(primitives.box({ width: 1.2, height: 0.5, length: 0.8 }));

    const material = new Material();
    material.initialize({ effectName: 'builtin-standard' });
    material.setProperty('mainColor', primary ? new Color(196, 145, 88, 255) : new Color(166, 148, 112, 255));
    material.setProperty('roughness', 0.9);
    renderer.material = material;
  }
}
