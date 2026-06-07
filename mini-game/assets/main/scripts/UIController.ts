import {
  _decorator, Canvas, Camera, Color, Component, Graphics, Label,
  Layers, Node, UITransform, Widget, color, view,
} from 'cc';
import { SandboxData } from './SandboxTypes';

const { ccclass } = _decorator;

@ccclass('UIController')
export class UIController extends Component {
  build(data: SandboxData) {
    view.setDesignResolutionSize(720, 1280, 4);

    const canvasNode = new Node('UICanvas');
    canvasNode.layer = Layers.Enum.UI_2D;
    canvasNode.setParent(this.node);
    const canvas = canvasNode.addComponent(Canvas);
    const transform = canvasNode.addComponent(UITransform);
    transform.setContentSize(720, 1280);

    const cameraNode = new Node('UICamera');
    cameraNode.layer = Layers.Enum.UI_2D;
    cameraNode.setParent(canvasNode);
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
    camera.visibility = Layers.Enum.UI_2D;
    camera.priority = 1;
    canvas.cameraComponent = camera;

    const ink = color(234, 225, 206, 255);
    const dim = color(177, 168, 148, 255);
    const card = color(19, 23, 32, 220);
    const bar = color(12, 16, 25, 235);

    const title = this.addLabel(canvasNode, `${data.civ.name} | ${data.meta.year}`, 34, ink, 650, 52, 0, 560);
    title.horizontalAlign = Label.HorizontalAlign.CENTER;

    const timeline = this.panel(canvasNode, 'Timeline', 680, 96, bar);
    timeline.setPosition(0, -560, 0);
    this.addWidget(timeline, { bottom: 40, left: 20, right: 20 });
    this.drawTimeline(timeline, data, ink, dim);

    const civCard = this.panel(canvasNode, 'CivilizationCard', 330, 210, card);
    civCard.setPosition(-175, -365, 0);
    this.addLabel(civCard, data.civ.name, 28, ink, 290, 36, -145, 75);
    this.addLabel(civCard, `Capital | ${data.civ.capital}`, 19, dim, 290, 28, -145, 35);
    this.addLabel(civCard, data.civ.summary, 18, ink, 300, 124, -145, 0);

    const primary = data.landmarks.find((item) => item.primary) || data.landmarks[0];
    const landmarkCard = this.panel(canvasNode, 'LandmarkCard', 310, 156, card);
    landmarkCard.setPosition(185, -405, 0);
    if (primary) {
      this.addLabel(landmarkCard, primary.name, 26, ink, 270, 34, -135, 48);
      this.addLabel(landmarkCard, `Built | ${primary.startYear}`, 18, dim, 270, 26, -135, 12);
      this.addLabel(landmarkCard, 'Tap to inspect the miniature landmark', 16, dim, 270, 28, -135, -23);
    }
  }

  private drawTimeline(parent: Node, data: SandboxData, ink: Color, dim: Color) {
    const graphics = parent.addComponent(Graphics);
    graphics.lineWidth = 6;
    graphics.strokeColor = color(89, 108, 137, 255);
    graphics.moveTo(-300, -8);
    graphics.lineTo(300, -8);
    graphics.stroke();

    const ratio = (data.meta.year - data.civ.startYear) / (data.civ.endYear - data.civ.startYear);
    const x = -300 + 600 * Math.max(0, Math.min(1, ratio));
    graphics.fillColor = color(167, 126, 214, 255);
    graphics.circle(x, -8, 13);
    graphics.fill();

    this.addLabel(parent, `${data.civ.startYear}`, 19, dim, 90, 28, -305, 22).horizontalAlign = Label.HorizontalAlign.CENTER;
    this.addLabel(parent, `${data.civ.endYear}`, 19, dim, 90, 28, 250, 22).horizontalAlign = Label.HorizontalAlign.CENTER;
    this.addLabel(parent, `${data.meta.year}`, 22, ink, 90, 28, x - 45, 24).horizontalAlign = Label.HorizontalAlign.CENTER;
  }

  private panel(parent: Node, name: string, width: number, height: number, fill: Color): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.addComponent(UITransform).setContentSize(width, height);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fill;
    this.roundRect(graphics, -width / 2, -height / 2, width, height, 18);
    return node;
  }

  private addLabel(parent: Node, text: string, size: number, col: Color, width: number, height: number, x: number, y: number): Label {
    const node = new Node('Label');
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    node.setPosition(x, y, 0);
    node.addComponent(UITransform).setContentSize(width, height);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = size;
    label.lineHeight = size + 5;
    label.color = col;
    label.overflow = Label.Overflow.RESIZE_HEIGHT;
    label.horizontalAlign = Label.HorizontalAlign.LEFT;
    label.verticalAlign = Label.VerticalAlign.TOP;
    return label;
  }

  private roundRect(graphics: Graphics, x: number, y: number, width: number, height: number, radius: number) {
    graphics.moveTo(x + radius, y);
    graphics.lineTo(x + width - radius, y);
    graphics.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, true);
    graphics.lineTo(x + width, y + height - radius);
    graphics.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, true);
    graphics.lineTo(x + radius, y + height);
    graphics.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, true);
    graphics.lineTo(x, y + radius);
    graphics.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, true);
    graphics.close();
    graphics.fill();
  }

  private addWidget(node: Node, opts: { top?: number; bottom?: number; left?: number; right?: number }) {
    const widget = node.addComponent(Widget);
    if (opts.top != null) { widget.isAlignTop = true; widget.top = opts.top; }
    if (opts.bottom != null) { widget.isAlignBottom = true; widget.bottom = opts.bottom; }
    if (opts.left != null) { widget.isAlignLeft = true; widget.left = opts.left; }
    if (opts.right != null) { widget.isAlignRight = true; widget.right = opts.right; }
    widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
  }
}
