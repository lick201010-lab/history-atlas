# 拜占庭样板场景说明

## 场景目标

公元 600 年的拜占庭帝国，聚焦东地中海、巴尔干、安纳托利亚与埃及周边区域。目标是验证 Cocos 是否能做出更像“手机小游戏沙盘”的画面：海洋平整、边界顺滑、奇观可观赏、触控视角稳定。

## 场景结构

运行时由 `Bootstrap` 程序化生成：

```text
Main.scene
└─ Game (Bootstrap)
   ├─ MainCamera (Camera + SandboxCamera)
   ├─ MainLight (DirectionalLight)
   ├─ Sandbox
   │  ├─ Ocean
   │  ├─ Land
   │  ├─ Boundary
   │  ├─ hagia-sophia
   │  ├─ parthenon
   │  └─ colosseum
   └─ UICanvas
```

## 数据来源

`assets/byzantine/data/byzantine.json` 由 `tools/exportByzantineData.mjs` 从主工程导出：

- 文明：`src/data/dynasties.json` 中的 `byzantine`
- 边界：`src/data/boundaries-simplified.json` 中命中公元 600 年的拜占庭阶段
- 奇观：`src/data/landmarks.json` 中的 `hagia-sophia`、`parthenon`、`colosseum`
- 模型：`public/models/*.glb`

## 投影与视觉策略

- 使用本地等距投影，把经纬度转为 Cocos XZ 平面坐标。
- 海洋是独立平面，不使用 DEM，因此不会出现海底山脉。
- 陆地是轻微低浮雕，不追求真实地形，只服务沙盘观感。
- 边界先做 Chaikin 平滑，再生成填充面和描边带，避免网页版本里的锯齿与多层乱线。
- GLB 加载后做 X 轴校正，保证模型底部朝地面。

## 当前限制

这是样板，不是完整小游戏：

- 只包含拜占庭一个年份和三个奇观点。
- 没有微信/抖音平台 adapter。
- 没有分包加载策略。
- 还没有手机真机性能数据。
