# 历史沙盘 · 路线图

记录从当前 v0.1.0 到最终完整版的推进顺序。

最终完整版的完整验收标准见 [FINAL_VERSION_SPEC.md](FINAL_VERSION_SPEC.md)。

---

## 当前状态

`v0.1.0` 已经完成上线闭环：

- 生产站点：`https://atlas.ckl.hk/`
- `npm run check` 通过
- `npm run smoke:release` 通过
- GitHub main 已推送
- `v0.1.0` 标签已建立

但这只是可上线版本，不是最终完整版。

## 已完成基础

- React + Vite 工程。
- MapLibre 3D 地形地图。
- Three.js custom layer。
- 43 个文明。
- 129 个边界 feature。
- 30 个奇观。
- 14 个 GLB 模型。
- 时间轴、文明卡、奇观卡、搜索、筛选、对比、焦点、沉浸模式。
- 阿里云 + Caddy 部署。
- 自动校验、发布烟测、部署脚本。

## 最终版未完成

- 海洋和陆地 relief 还不是最终视觉。
- F2 边界已通过 Gate，但仍是 rough-refined 历史示意边界，不是学术 GIS。
- 30 个奇观还没有全部达到 A/B 级模型。
- 文明内容缺引用和来源体系。
- 移动端还只是可用，不是最终体验。
- 性能拆包和 GLB 懒加载还没完成。
- 作品包装、SEO、公开介绍页还没完成。

---

## 最终版阶段

### F1 · 最终视觉底座

优先级：最高

目标：

- 海洋彻底干净平整。
- 陆地山脉清晰。
- 边界、地形、奇观不互相打架。
- 深色沙盘和古地图浮雕质感统一。

分工：

- Codex：验收标准、截图对比、集成。
- Claude：具体地图 paint、CSS、MapLibre 图层实现。

### F2 · 边界全面精修

状态：已通过 Gate（2026-06-06）

目标：

- 43 个文明全部至少 3 阶段。已完成。
- 边界贴合海岸线。rough-refined 标准下已完成。
- 大型内陆帝国不用粗糙凸包络。已完成到 F2 标准。
- 每批都有截图和数据校验。已完成。

分工：

- Claude / worker：批量边界数据生成。
- Codex：方法论、数据校验、浏览器验收、拒绝不合格批次。

### F3 · 奇观模型全面升级

优先级：最高

目标：

- 30 个奇观全部 A/B 级。
- 核心 10 个奇观达到 A 级。
- 不再有粗糙占位模型。

分工：

- Claude：单个 GLB 建模脚本。
- Codex：地图视角 QA、审计、截图、集成。

### F4 · 内容与来源体系

优先级：高

目标：

- 每个文明有 references。
- 每个边界有 sourceNote / accuracyNote。
- 关键事件有来源说明。
- UI 展示资料来源。

### F5 · 产品交互和移动端

优先级：高

目标：

- 手机端底部 sheet。
- 搜索、筛选、对比更自然。
- 时代节点更像故事导航。
- 文明和奇观联动更紧。

### F6 · 性能、发布和作品包装

优先级：中高

目标：

- GLB 懒加载。
- 更细拆包。
- 浏览器兼容矩阵。
- 作品介绍页。
- SEO / 分享图 / 反馈入口。

---

## 当前执行建议

F1 和 F2 已通过 Codex Gate。当前主线是 F3 landmark/model quality，同时允许 F4 来源体系 sidecar 扩展，但不能把 F3/F4 批量结果并入最终版，直到对应 Gate 通过。

执行策略：

- 主线程 Codex 只做监督、拆分、验收、集成和日志，不在主线程长期吞大文件上下文。
- F3 按 1-3 个模型一批推进，每个 worker 必须有明确 owner、write scope、forbidden scope、verification commands。
- F4 可以由 subagent 做来源字段扩展，但必须和 F3 模型写入范围隔离。
- 每个 subagent 完成后，主线程必须 wait/review，决定 accept/reject/revise，并 close/archive 该 subagent。
- `docs/CURRENT_PHASE.md` 是阶段真相来源；README 是老板视角 TODO 看板。
