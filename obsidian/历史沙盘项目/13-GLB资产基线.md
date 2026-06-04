---
type: project-note
project: 历史沙盘
updated: 2026-06-02
tags:
  - project/history-atlas
  - assets/3d
  - qa/baseline
---

# GLB 资产基线

## 为什么要有这页

历史沙盘已经不只是“程序化小积木建筑”阶段。当前已有 14 个重点奇观 GLB 覆写，如果不建立审计基线，后续很容易出现三类问题：

- 文档还写 5 个 GLB，但代码里已经有 14 个。
- Claude 或 Codex 新增模型时忘记接 orientation，导致建筑倒放。
- 文件存在但未映射，或者映射存在但服务器缺文件。

因此当前以自动审计为准。

## 当前审计命令

```bash
npm run audit:glb
npm run audit:glb -- --write
```

`npm run check` 已经包含：

```bash
npm run validate:data && npm run audit:glb && npm run build
```

## 当前结果

2026-06-02 本地审计：

- GLB override：14
- `public/models/*.glb`：14
- OK：13
- WARN：1
- FAIL：0
- 总体积：约 4.18 MB

WARN：

- `chichen-itza`：三角面偏低，需地图视角截图判断轮廓是否太粗。

## 已接入 GLB 的奇观

- 圣索菲亚大教堂：`hagia-sophia`
- 帕特农神庙：`parthenon`
- 罗马斗兽场：`colosseum`
- 泰姬陵：`tajmahal`
- 吉萨金字塔：`pyramid`
- 万里长城：`great-wall`
- 吴哥窟：`angkor-wat`
- 巨石阵：`stonehenge`
- 奇琴伊察：`chichen-itza`
- 紫禁城：`forbidden-city`
- 巴黎圣母院：`notre-dame`
- 婆罗浮屠：`borobudur`
- 佩特拉：`petra`
- 德里红堡：`red-fort`

## 接下来给 Claude 的最佳任务

不要一次性让 Claude 再做 30 个。更合理的是：

1. 先对 14 个 GLB 做地图视角截图 QA。
2. 找出 3 个最不合格的资产。
3. 先精修一个高优先级资产，确认细节档位和体积预算。
4. 再批量复制方法。

目前最自然的候选是 `chichen-itza`，因为自动审计已提示它三角面明显偏低。

## 相关文件

- `docs/GLB_ASSET_BASELINE.md`
- `scripts/auditGlbAssets.mjs`
- `src/map/createBuildingLayer.js`
- `public/models/`
- [[06-3D建筑与资产管线]]
- [[11-下一步路线图]]
