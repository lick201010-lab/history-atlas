import {
  _decorator, AssetManager, Camera, Component, DirectionalLight,
  JsonAsset, Layers, Node, Vec3, assetManager, color,
} from 'cc';
import { SandboxData } from './SandboxTypes';
import { SandboxCamera } from './SandboxCamera';
import { buildBoundary, buildLand, buildOcean, getRingsBounds } from './SandboxBuilder';
import { LandmarkLoader } from './LandmarkLoader';

const { ccclass } = _decorator;

@ccclass('Bootstrap')
export class Bootstrap extends Component {
  async start() {
    this.setupLights();
    const camera = this.setupCamera();

    const sandbox = new Node('Sandbox');
    sandbox.setParent(this.node);
    buildOcean(sandbox);

    try {
      const byzantineBundle = await this.loadBundle('byzantine');
      const data = await this.loadJson(byzantineBundle, 'data/byzantine');
      buildLand(sandbox, data.boundary.rings);
      buildBoundary(sandbox, data.boundary.rings, data.civ.color);
      this.frameScene(camera, data);

      const landmarkBundle = await this.loadBundle('landmarks');
      const loader = this.node.addComponent(LandmarkLoader);
      await loader.place(sandbox, landmarkBundle, data.landmarks);

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

  private setupCamera(): SandboxCamera {
    const cameraNode = new Node('MainCamera');
    cameraNode.setParent(this.node);
    const camera = cameraNode.addComponent(Camera);
    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = color(9, 15, 24, 255);
    camera.near = 0.1;
    camera.far = 2000;
    camera.fov = 32;
    camera.visibility = Layers.Enum.DEFAULT;

    const controller = cameraNode.addComponent(SandboxCamera);
    controller.target = new Vec3(-1, 0, 3);
    controller.distance = 40;
    controller.pitch = 48;
    controller.autoOrbitSpeed = 0.35;
    return controller;
  }

  private frameScene(camera: SandboxCamera, data: SandboxData) {
    const bounds = getRingsBounds(data.boundary.rings);
    const landmarkPoints = data.landmarks.map((landmark) => ({
      x: landmark.x,
      z: landmark.z,
    }));

    for (const point of landmarkPoints) {
      bounds.minX = Math.min(bounds.minX, point.x);
      bounds.maxX = Math.max(bounds.maxX, point.x);
      bounds.minZ = Math.min(bounds.minZ, point.z);
      bounds.maxZ = Math.max(bounds.maxZ, point.z);
    }

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const width = bounds.maxX - bounds.minX;
    const depth = bounds.maxZ - bounds.minZ;
    const distance = Math.max(20, Math.min(34, Math.max(width, depth) * 1.08));
    camera.configure(new Vec3(centerX, 0.05, centerZ), distance, 52, 0.35);
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
