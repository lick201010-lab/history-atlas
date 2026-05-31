---
type: prompt-library
project: 历史沙盘
updated: 2026-05-31
tags:
  - project/history-atlas
  - prompt/claude
---

# Claude 任务提示词模板

## 边界精修任务

```text
请继续做历史沙盘的边界精修，不要改 dynasties.json、landmarks.json、MapScene.jsx、mapStyle.js。

目标：
精修指定文明的 boundaries-simplified.json 边界，使其从低顶点粗糙多边形升级为 rough-refined / coastline-aware-rough。

要求：
1. 每个文明按兴起期、鼎盛期、衰落期做 3 个 feature。
2. 每个 feature 尽量 20+ 顶点。
3. 海岸线区域要尽量贴合陆地轮廓，不能用一个大凸包跨海。
4. 保持现有 GeoJSON 字段兼容。
5. 增加或保留 sourceNote / accuracyNote。
6. 不引入新前端依赖。
7. 完成后运行 npm run validate:data 和 npm run build。
8. 只提交本任务相关文件。
```

## GLB 奇观资产任务

```text
请为历史沙盘升级一个重点奇观建筑的 GLB 资产。

目标：
让建筑从程序化符号块升级为地图上可识别的精品 miniature，接近低多边形博物馆模型质感。

要求：
1. 不改变 landmarks.json。
2. 使用现有 GLB override 路径接入。
3. 坐标系必须和 createBuildingLayer 兼容：z 向上，base 贴地，xy 尺寸归一。
4. 模型体积尽量控制在 0.5MB 到 2MB。
5. 材质数量要少，适合 WebGL。
6. 保留程序化 fallback。
7. 完成后运行 npm run validate:data 和 npm run build。
8. 给出浏览器截图验收建议。
```

## 古地图清晰主题任务

```text
请优化历史沙盘的古地图/浮雕视觉主题。

目标：
接近 17 世纪航海图 + 3D 浮雕沙盘的感觉，但要比当前更清晰。

要求：
1. 海洋必须平、深、干净，不能出现山势噪声。
2. 陆地山脉要明显，但不能糊。
3. 边界线和城市点要清楚。
4. 不破坏 dark 主题。
5. 不引入新依赖。
6. 完成后 npm run build，并提供截图验收点。
```

## Codex 验收口径

Claude 做完后，Codex 应优先校验：

- `git status`
- `npm run validate:data`
- `npm run build`
- 浏览器是否有控制台错误。
- 地图、时间轴、边界、建筑是否仍可交互。
- 是否只改了任务相关文件。
- 是否需要部署或推送 GitHub。

