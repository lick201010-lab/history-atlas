import { _decorator, Component, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('SandboxCamera')
export class SandboxCamera extends Component {
  @property(Vec3)
  target = new Vec3(0, 0, 2);

  @property
  distance = 32;

  @property
  pitch = 48;

  @property
  autoOrbitSpeed = 2.0;

  private yaw = -22;

  start() {
    this.apply();
  }

  update(dt: number) {
    if (this.autoOrbitSpeed !== 0) {
      this.yaw += this.autoOrbitSpeed * dt;
      this.apply();
    }
  }

  private apply() {
    const pitchR = (this.pitch * Math.PI) / 180;
    const yawR = (this.yaw * Math.PI) / 180;
    const horizontal = this.distance * Math.cos(pitchR);
    const y = this.distance * Math.sin(pitchR);
    const x = this.target.x + horizontal * Math.sin(yawR);
    const z = this.target.z + horizontal * Math.cos(yawR);

    this.node.setPosition(x, this.target.y + y, z);
    this.node.lookAt(this.target);
  }
}
