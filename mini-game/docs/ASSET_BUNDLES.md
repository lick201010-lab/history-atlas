# Cocos Asset Bundle 说明

## 目标

小游戏版本不能一次性加载全部 43 个文明和 30 个奇观。样板阶段先验证最小 bundle 结构，为后续微信/抖音小游戏分包做准备。

## 当前 bundle

| Bundle | 内容 | 用途 |
| --- | --- | --- |
| main | `Main.scene` 与核心脚本 | 启动场景和运行时代码 |
| byzantine | `data/byzantine.json` | 拜占庭样板数据 |
| landmarks | 三个 GLB：圣索菲亚、帕特农、斗兽场 | 样板奇观模型 |

## 后续全量策略

通过样板后，建议按区域拆包：

- `region-mediterranean`
- `region-east-asia`
- `region-south-asia`
- `region-americas`
- `region-africa`

主包只保留启动场景、基础 UI、低清底图和必要 shader。文明数据、高清贴图和奇观模型放入区域 bundle 或远程资源。

## 验收重点

- 当前年份/区域之外的模型不能被提前加载。
- bundle 加载失败时必须给用户可见提示。
- 微信和抖音两端都要验证分包路径。
