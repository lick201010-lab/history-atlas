# 最终视觉底座审计 · 2026-06-03

目标：启动最终完整版 F1，不再把当前版本视为最终视觉。此次审计聚焦海洋、陆地 relief、边界层级、奇观可读性和 HUD 干扰。

## 审计命令

```bash
npm run audit:visual-foundation
```

本轮本地构建地址：

```text
http://127.0.0.1:4173/
```

## 自动结果

- failures: `[]`
- bad responses: `0`
- page exceptions: `0`
- console errors: `0`
- non-canceled failures: `0`

截图：

- `docs/visual-qa/foundation-himalaya-relief.png`
- `docs/visual-qa/foundation-open-ocean-flatness.png`
- `docs/visual-qa/foundation-mediterranean-boundary-readability.png`
- `docs/visual-qa/foundation-central-america-readability.png`
- `docs/visual-qa/visual-foundation-manifest.json`

## 本轮已修

### 1. 地图瓦片慢提示误报

问题：

- 原逻辑在地图跳转或瓦片短暂取消时容易显示“地图瓦片加载较慢”横幅。
- 该横幅会直接破坏最终作品感，尤其在固定视觉审计截图里非常明显。

修复：

- 忽略 abort / cancel 类型的正常请求。
- 地图已就绪后延迟 5 秒再判断是否需要提示。
- 地图进入 idle 后自动清空提示。

结论：

- 本地视觉审计截图中该横幅已不再误出现。
- 真实瓦片长期失败仍会提示，不是完全隐藏错误。

### 2. 新增视觉底座审计脚本

新增：

- `scripts/visualFoundationAudit.mjs`
- `npm run audit:visual-foundation`

固定审计镜头：

| id | 用途 |
| --- | --- |
| `himalaya-relief` | 检查山脉 relief 清晰度和地形瓦片稳定性 |
| `open-ocean-flatness` | 检查海洋是否平整、干净 |
| `mediterranean-boundary-readability` | 检查多文明边界、地形和奇观是否互相抢视觉 |
| `central-america-readability` | 检查中美洲海岸、文明边界和信息层可读性 |

脚本改进：

- 使用原生 input value setter 触发 React 受控时间轴，避免只改 DOM 不改 app state。
- 等待 `map.areTilesLoaded()` 或超时再截图。
- manifest 记录 `yearStable`、`tilesStable`、`warningVisible`。

## 当前视觉结论

### 通过

- 海洋整体已经比早期版本平整，不再大面积出现“海里有山”。
- 喜马拉雅 relief 有明显地形力量，具备 3D 沙盘基础。
- 选中文明、奇观和 HUD 在大部分场景下可读。
- 手机/桌面关键路径此前已通过发布烟测。

### 未达最终版

- `himalaya-relief` 仍能看到明显的地形/瓦片切片感，局部出现深色三角接缝。
- 地中海多文明叠加时，紫色/青色边界仍偏“开发图层荧光线”，不像精制历史地图。
- relief 纹理细节偏噪，在部分区域压过文明边界。
- 奇观模型在地图中可识别，但与地形/边界/HUD 的视觉层级还没有最终统一。
- 桌面 HUD 仍偏工作台感，不是最终作品化观赏界面。

## 下一步 F1 任务

下一步应交给 Claude 做一个受控视觉 pass，不做大范围数据或模型扩张。

目标：

1. 减少地形/瓦片切片感。
2. 保持陆地山脉起伏，但降低白噪声式 relief。
3. 让海洋更像稳定深水面，而不是被地形/瓦片边界切割。
4. 降低非焦点文明边界的荧光感。
5. 保留当前 dark 沙盘主风格，不切换到模糊古地图主题。

Codex 验收：

- `npm run check`
- `npm run audit:visual-foundation`
- 手工看四张 foundation 截图
- 必要时再跑 `npm run smoke:release`

## 不做的事

- 不换地图引擎。
- 不批量重做 43 个文明边界。
- 不批量新增 GLB。
- 不为了古地图感牺牲清晰度。

## 线上复核 · 2026-06-03

线上地址：

```text
https://atlas.ckl.hk/
```

命令：

```bash
npm run smoke:release
npm run audit:visual-foundation
```

自动结果：

- release smoke failures: `[]`
- visual foundation failures: `[]`
- bad responses: `0`
- page exceptions: `0`
- console errors: `0`
- non-canceled failures: `0`

复核结论：

- 线上版本已经同步 `MapScene` 的瓦片提示误报修复，四张 foundation 截图里不再出现中心警告横幅。
- `open-ocean-flatness` 基本达到“海洋平、深、干净”的当前基线，但水面质感仍未达到最终作品级。
- `himalaya-relief` 仍有强地形起伏，但能看到明显地形/瓦片切片感，尤其远景暗色楔形区域不应作为最终视觉接受。
- `mediterranean-boundary-readability` 暴露出边界线层级偏荧光、偏开发调试图层的问题，后续 F1 必须先修这个层级，再继续批量精修边界。
- 当前版本可作为线上里程碑和审计起点，不是最终完整版。
