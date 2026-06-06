import {
  _decorator, AssetManager, Camera, ClearFlagBit, Component, DirectionalLight,
  JsonAsset, Layers, Node, Vec3, assetManager, color,
} from 'cc';
import { SandboxData } from './SandboxTypes';
import { SandboxCamera } from './SandboxCamera';
import { buildBoundary, buildLand, buildOcean } from './SandboxBuilder';
import { LandmarkLoader } from './LandmarkLoader';
import { UIController } from './UIController';

const { ccclass } = _decorator;

@ccclass('Bootstrap')
export class Bootstrap extends Component {
  async start() {
    this.setupLights();
    this.setupCamera();

    const sandbox = new Node('Sandbox');
    sandbox.setParent(this.node);
    buildOcean(sandbox);
    buildLand(sandbox);

    try {
      const byzantineBundle = await this.loadBundle('byzantine');
      const data = await this.loadJson(byzantineBundle, 'data/byzantine');
      buildBoundary(sandbox, data.boundary.rings, data.civ.color);

      const landmarkBundle = await this.loadBundle('landmarks');
      const loader = this.node.addComponent(LandmarkLoader);
      await loader.place(sandbox, landmarkBundle, data.landmarks);

      const ui = this.node.addComponent(UIController);
      ui.build(data);
      console.log(`[Bootstrap] ready: ${data.civ.name} ${data.meta.year}`);
    } catch (error) {
      console.error('[Bootstrap] failed to build sandbox:', error);
    }
  }

  private setupLights() {
    const lightNode = new Node('MainLight');
    lightNode.setParent(this.node);
    lightNode.setRotationFromEuler(-55, -35, 0);
    const light = lightNode.addComponent(DirectionalLight);
    light.color = color(255, 246, 228, 255);
    light.illuminance = 80000;
  }

  private setupCamera() {
    const cameraNode = new Node('MainCamera');
    cameraNode.setParent(this.node);
    const camera = cameraNode.addComponent(Camera);
    camera.clearFlags = ClearFlagBit.ALL;
    camera.clearColor = color(9, 15, 24, 255);
    camera.near = 0.1;
    camera.far = 2000;
    camera.fov = 32;
    camera.visibility = Layers.Enum.DEFAULT;

    const controller = cameraNode.addComponent(SandboxCamera);
    controller.target = new Vec3(-1, 0, 3);
    controller.distance = 40;
    controller.pitch = 48;
    controller.autoOrbitSpeed = 2.0;
  }

  private loadBundle(name: string): Promise<AssetManager.Bundle> {
    return new Promise((resolve, reject) => {
      assetManager.loadBundle(name, (err, bundle) => {
        if (err || !bundle) {
          reject(err || new Error(`Bundle not found: ${name}`));
          return;
        }
        resolve(bundle);
      });
    });
  }

  private loadJson(bundle: AssetManager.Bundle, path: string): Promise<SandboxData> {
    return new Promise((resolve, reject) => {
      bundle.load(path, JsonAsset, (err, asset) => {
        if (err || !asset) {
          reject(err || new Error(`JSON not found: ${path}`));
          return;
        }
        resolve((asset as JsonAsset).json as SandboxData);
      });
    });
  }
}
