# 阶段复盘 · Retrospectives

> 每个大阶段做完后追加一条。
> 每条三段：**做了什么** / **踩了什么坑** / **下次应该怎么做**。
> 目的：让下一轮（人或 LLM）少走弯路；具体某一类工作的操作菜谱写在专项 MD（如 `BOUNDARY_REFINEMENT_METHODOLOGY.md`）。

---

## R-5 · 海岸贴合样板边界（5 civ × 3 phase，2026-05）

### 做了什么
- 把 5 个样板文明（Tang / Rome / Caliphates / Mughal / Maya）的"人工矩形多边形"升级为基于 Natural Earth 50m 海岸线裁剪的 MultiPolygon。
- 每个 civ 拆 rise / peak / decline 三段，含中文 metadata。
- 新写生成器 `scripts/generateCoastAwareBoundaries.mjs`（Sutherland-Hodgman + Douglas-Peucker + 自适应密集化）。
- 验证器允许 MultiPolygon + 新 accuracy `coastline-aware-rough`，加上顶点数门槛（Polygon ≥40 / MultiPolygon ≥80）。
- MapScene 渲染表达式扩展为同时承认 `rough-refined` 和 `coastline-aware-rough`。
- 沉淀 `docs/BOUNDARY_REFINEMENT_METHODOLOGY.md`：剩余 38 个文明的菜谱。

### 踩了什么坑
1. **Sutherland-Hodgman 必须 convex clip** — 我的 envelopes 在某些顶点是凹的，导致罗马 peak 只画出欧洲不画 N 非洲。修复：生成器先做 convex hull。
2. **GitHub raw 限流 429** — 改用 jsdelivr 镜像。
3. **CW vs CCW** — envelope 写成 CW 让 Sutherland-Hodgman 输出 0 多边形。修复：shoelace 自动 reverse。
4. **Douglas-Peucker 把密集化的顶点全删** — 内陆区只剩 9 顶点。修复：DP 后再 densify（兜底）。
5. **验证器阈值与生成器目标错位** — 罗马 rise 71 < 80。修复：生成器内部目标改为 `Polygon ≥40 / MultiPolygon ≥80`。
6. **唐 peak envelope 东缘 132°E 圈进九州** — 修到 127°E。
7. **MapScene 不认新 accuracy** — 描边变暗。修复：`ifRefined` 接受两种值。

详见 `BOUNDARY_REFINEMENT_METHODOLOGY.md §9`。

### 下次应该怎么做
1. **写依赖经典算法的脚本前，先列输入约束**（凸 / CCW / 闭合 / 简化和密集化的关系）。这一条的代价：~3 轮重跑、~8 分钟。
2. **跨文件约束常量（如顶点数门槛）抽到共享模块**。当前生成器和验证器各自硬编 40 / 80，未来加新 accuracy tier 还会再错。
3. **新增 accuracy / phase / category 字段时，前端渲染 + 后端验证 + 生成器三方同步**。当前是把 7 个相关改动散布在 4 个文件，应当 grep `'rough-refined'` 找全。
4. **envelope 在写完后必做"对着维基地图核对一遍"**，不要凭印象。每个 5 分钟。
5. **批量浏览器验证用同一个 eval 完成**（5 个 jumpTo + screenshot 串在一起），不要每个 civ 都 reload 一次。

### 数据上的成果
- 边界 feature：从 50 个（38 非样板 + 12 旧样板）增到 53 个（38 非样板 + 15 样板，3 phase × 5 civ）
- 样板顶点：从平均 ~25 涨到 47–443（按 civ 大小分布）
- 视觉：5 个样板第一次真正贴合现代海岸线，海洋本体不再被填色

### 工作量
- 实际：~3.5 小时
- 按方法论估算：~1.5 小时
- 浪费：~2 小时 trial-and-error

---

<!-- 模板（每次新批次追加）

## R-N · 标题（年-月）

### 做了什么

### 踩了什么坑

### 下次应该怎么做

### 数据上的成果

### 工作量

-->
