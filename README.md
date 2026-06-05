# 历史沙盘 · Historical Atlas

一个深色 HUD 风格的 3D 历史沙盘网站，把 43 个文明、111 个历史边界阶段、30 处奇观建筑和公元前 2000 年到公元 2025 年的时间轴放在同一张可交互地形地图上。

线上地址：[https://atlas.ckl.hk](https://atlas.ckl.hk)

## 当前状态

| 项 | 状态 |
| --- | --- |
| 阶段 | online milestone / F2 in progress |
| 部署 | 阿里云 ECS + Caddy 静态站点 |
| 仓库 | `lick201010-lab/history-atlas` |
| 前端 | React 18 + Vite |
| 地图 | MapLibre GL JS + raster-dem 地形 |
| 3D | Three.js custom layer |
| 数据 | 本地 JSON，无后端 |

## Final-Version TODO / 推进计划

当前线上站点 `v0.1.0` 是 **online milestone**，不是最终完整版。最终版仍在推进中：**final-version work in progress**。

| 阶段 | 状态 | 当前目标 | 下一步 | 验收 Gate |
| --- | --- | --- | --- | --- |
| F1 视觉底座 | 已完成 | 深色沙盘视觉、海洋平整、陆地 relief、边界可读性通过基础验收 | 残余远景/资源风险留到 F6 | F1 visual foundation audit passed |
| F2 边界精修 | 进行中 | 43 个文明全部升级为至少 3 阶段 rough-refined 边界 | 启动 Batch 04：晋、宋、元、清、PRC | 每批 `validate:data`、`check`、浏览器截图 QA 通过；全阶段达到 43 文明、至少 129 feature |
| F3 奇观模型 | 未完成 | 30 个奇观升级到 A/B 级模型 | 与 F2 并行开模型 worker，先补缺失再精修核心 10 个 | 核心 10 个 A 级，全部 30 个不再是粗糙占位 |
| F4 内容与来源 | 未完成 | 文明、边界、事件建立来源体系 | 数据结构稳定后补 `references`、`sourceNote`、`accuracyNote` | UI 可展示来源，关键数据有可追溯说明 |
| F5 产品交互 / 移动端 | 未完成 | 移动端、搜索、筛选、对比、故事导航升级 | 边界与内容质量稳定后做产品体验扩展 | 桌面和移动端核心路径体验通过 |
| F6 性能 / 发布 / 包装 | 未完成 | GLB 懒加载、拆包、SEO、作品包装、兼容矩阵 | 最后统一处理资源策略和公开展示 | 性能、发布烟测、SEO、分享与反馈入口通过 |

### 当前重点

当前项目处于 **F2: controlled boundary refinement**。F1 已通过 Codex Gate，但 F2-F6 均未完成，不能称为最终完整版。

### 并行分工

- 主线程 Codex：拆分批次、写任务文件、调度 subagent、审查 diff、运行校验、浏览器截图 QA、决定是否接受批次、更新日志与阶段文档。
- Claude / worker subagent：只按 `.claude-runs/*.md` 的窄范围任务执行边界数据、单个 GLB、局部 UI 实现。
- 当前 F2 阶段禁止把未验收批次说成最终完成。

### 最近下一步

1. 提交 F2 Batch 03：夏、商、周、秦、隋。
2. 启动 F2 Batch 04：`jin`、`song`、`yuan`、`qing`、`prc`。
3. 对 Batch 04 继续执行：数据生成、`validate:data`、`check`、浏览器截图 QA、Codex 审查、单独提交。
4. F3 可以并行开模型 worker，但写入范围必须和 F2 数据批次隔离。

## 快速开始

```bash
npm install
npm run dev
```

默认本地地址：

```text
http://127.0.0.1:5173/
```

## 常用命令

```bash
npm run validate:data      # 校验 dynasties / boundaries / landmarks
npm run audit:glb          # 审计 GLB 模型资产
npm run check              # 数据校验 + 边界测试 + GLB 审计 + 构建
npm run smoke:release      # 线上桌面/手机发布冒烟
npm run build              # 生产构建
npm run preview            # 本地预览 dist
npm run deploy             # 构建并部署到 atlas.ckl.hk
```

上线前至少运行：

```bash
npm run check
npm run smoke:release
```

## 功能范围

- 3D 地形地图：深色底图、山脉地形、海洋压平策略。
- 时间轴：公元前 2000 年到公元 2025 年。
- 文明数据：43 个文明/朝代，含摘要、事件、标签、影响和重要性。
- 历史边界：91 个 GeoJSON feature，部分重点文明支持兴起/鼎盛/衰落阶段。
- 奇观建筑：30 个地标，14 个重点奇观已接入 GLB 模型。
- 交互：搜索、筛选、文明卡、建筑卡、对比、锁定、地图聚焦。
- 移动端：窄屏 HUD 折叠、移动端发布冒烟通过。

## 数据规模

| 资源 | 数量 |
| --- | --- |
| 文明 / 朝代 | 43 |
| 边界 feature | 101 |
| 奇观 / 建筑 | 30 |
| GLB 覆盖模型 | 14 |
| 时代叙事段 | 8 |
| 时间轴关键节点 | 14 |

## 目录结构

```text
src/
  App.jsx
  components/
    MapScene.jsx
    InfoPanel.jsx
    LandmarkCard.jsx
    Timeline.jsx
    LayerControls.jsx
  map/
    mapStyle.js
    createBuildingLayer.js
    boundaryFocus.js
    boundaryOutlines.js
  data/
    dynasties.json
    boundaries-simplified.json
    landmarks.json
    eras.json
scripts/
  validateHistoricalData.mjs
  auditGlbAssets.mjs
  releaseSmoke.mjs
docs/
  RELEASE_READINESS_2026-06-04.md
  GLB_VISUAL_QA.md
  BOUNDARY_REFINEMENT_METHODOLOGY.md
```

## 发布证据

最新发布就绪报告：

- [docs/RELEASE_READINESS_2026-06-04.md](docs/RELEASE_READINESS_2026-06-04.md)

发布冒烟会生成：

- `docs/release-qa/release-smoke-manifest.json`
- `docs/release-qa/release-desktop-1250-maya.png`
- `docs/release-qa/release-mobile-1250-maya.png`

## 已知限制

这是一个 online milestone 历史沙盘，最终完整版仍在推进中；它也不是最终学术 GIS 地图。

- 历史边界仍是示意范围，不可作为学术边界引用。
- 地形和底图依赖第三方瓦片服务。
- MapLibre 和 Three.js 体积较大，首屏在弱网下会有延迟。
- GLB 奇观是低多边形沙盘模型，不是最终博物馆级模型。
- 引用和来源体系仍需后续补强。

详见 [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)。

## 协作原则

- Claude 适合做批量边界生成、单个 GLB 建模脚本精修。
- Codex 负责判断方案、集成、校验、浏览器验收、部署和纠偏。
- 明天上线前不做大批量新功能，只修硬阻塞问题。
