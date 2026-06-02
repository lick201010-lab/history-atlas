---
type: prompt-library
project: 历史沙盘
updated: 2026-06-02
tags:
  - project/history-atlas
  - prompt/claude
---

# Claude 任务提示词模板

这些模板基于当前项目状态整理，默认前提：

- 项目主线是 MapLibre 平面地图。
- dark 主题是当前主线，atlas 主题冻结。
- 当前真实数据规模：43 个文明、89 个边界 feature、30 个地标、14 个 GLB 重点奇观。
- GitHub 与阿里云部署链路已经打通。
- 不能把未验证状态写成已上线事实。

## 1. 边界精修批次任务

```text
请继续为 history-atlas 做重点文明边界精修。

约束：
1. 不改 dynasties.json、landmarks.json、部署脚本、Caddy 文档。
2. 优先遵循 docs/BOUNDARY_REFINEMENT_METHODOLOGY.md。
3. 目标是让指定文明从粗示意边界升级为更可信的 rough-refined 或 coastline-aware-rough。
4. 重要文明优先按 rise / peak / decline 分 phase。
5. 必须保留或补全 sourceNote、accuracyNote、phaseLabel。
6. 不引入新前端依赖。
7. 修改完成后运行 npm run validate:data 和 npm run build。
8. 只改本任务相关文件。

输出时请说明：
- 改了哪些文明
- 每个文明现在是几段 feature
- 哪些区域用了 coastline-aware 裁切
- 还有哪些边界仍明显粗糙
```

## 2. 重点奇观 GLB 任务

```text
请为 history-atlas 升级一个重点奇观资产，目标是让地图视角下的轮廓辨识度显著提升。

约束：
1. 使用现有 scripts/lib/wonderKit.mjs 和 docs/3D_ASSET_STANDARD.md 作为标准。
2. 不改 landmarks.json 的结构。
3. 接入现有 createBuildingLayer.js 的 GLB override 机制。
4. 坐标系必须兼容当前地图：z 向上，base 贴地，足迹归一。
5. 材质数量要克制，禁止引入大贴图。
6. 保留程序化 fallback。
7. 修改完成后运行 npm run validate:data、npm run audit:glb 和 npm run build。
8. 对照 docs/GLB_ASSET_BASELINE.md 说明该资产是否 OK / WARN / FAIL。

输出时请说明：
- 资产文件名
- 大致体积
- 主要造型部件
- 与旧版本相比具体提升了什么
- 建议如何截图验收
```

## 3. dark 主题地图视觉任务

```text
请继续优化 history-atlas 的 dark 主题地图观感，但不要碰 atlas 主题的既有观感。

目标：
让地图像一张被装裱的文明星图卡，边界更清晰、海陆更分明、HUD 不挡核心信息。

约束：
1. 只在 dark 主题改动视觉主逻辑。
2. atlas 主题只能做兼容，不能重画风格。
3. 不引入新依赖。
4. 不改部署链路。
5. 必须考虑 MapLibre 容器 resize、高 pitch、右侧信息面板遮挡等问题。
6. 修改完成后至少跑 npm run build。

输出时请说明：
- 改动是结构层、样式层还是渲染参数层
- 为什么这样改比单纯加特效更合理
- 需要 Codex 在真实浏览器重点验收哪些点
```

## 4. 文档口径统一任务

```text
请统一 history-atlas 当前文档中的数据规模和状态口径。

重点：
1. 检查 README、docs、obsidian 项目笔记里是否仍保留旧数字或旧阶段判断。
2. 以当前本地项目状态为准，例如 43 文明、89 边界 feature、30 地标、14 GLB 重点奇观、当前主线主题。
3. 明确区分“已提交事实”和“待验证/待上线状态”。
4. 不修改应用源代码。

输出时请列出：
- 发现了哪些口径冲突
- 统一成了什么说法
- 哪些内容仍需要人工确认
```

## 5. Codex 验收口径

Claude 交付后，Codex 应优先检查：

- `git status`
- `git diff --stat`
- `npm run validate:data`
- `npm run audit:glb`（如果涉及 GLB / 建筑资产）
- `npm run build`
- 任务是否只改了相关文件
- 是否把实验状态误写成已上线事实
- 是否需要真实浏览器截图才能确认

## 6. 什么时候不该继续让 Claude 直接写代码

以下情况更适合先由 Codex 验收或澄清，再决定是否继续实现：

- 用户反馈“看起来还是不行”，但没有指出具体现场。
- 当前问题更像部署状态不一致，而不是代码缺失。
- 当前分支已经 dirty，存在大量未提交 UI 实验。
- 文档和真实数据口径明显漂移。
- 需要判断“应该做什么”而不是“执行一个明确任务”。
