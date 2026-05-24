# 历史沙盘 · 已知问题

记录当前 MVP 阶段已知但暂未处理的限制与风险，方便后续优先级排序。

---

## 1. 打包体积偏大

- 主 bundle `index.js` 约 **1.5 MB**（gzip ~420 KB）
- 主要来源：MapLibre GL JS (~700 KB)、Three.js (~600 KB)
- Vite 构建有警告："Some chunks are larger than 500 kB after minification"
- **影响**：首屏加载在弱网下会有可察觉延迟
- **缓解方案（未做）**：
  - 把 MapLibre 与 Three 通过 dynamic `import()` 拆出懒加载 chunk
  - 配置 `build.rollupOptions.output.manualChunks` 把第三方拆为单独 vendor chunk
  - 走 CDN 引入 maplibre-gl / three（HTML 直链）

---

## 2. 地形与底图依赖外部瓦片网络

- 底图：CARTO Dark `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`
- 地形 DEM：AWS `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`
- **影响**：
  - 离线 / 内网环境无法加载底图与地形，只剩 UI 框
  - 第三方瓦片源若变更 URL 或限速，应用会受影响
  - 没有缓存策略，刷新会重新请求
- **缓解方案（未做）**：
  - 自建瓦片服务（mbtiles + tileserver-gl）
  - 提供"离线模式占位底图"配置项

---

## 3. 历史边界仍是粗略示意

- 43 个 boundary 全部是手绘 6–12 顶点的多边形，覆盖 `accuracy: rough-refined`
- **不能用作学术地图**：朝代不同时期版图变化、附庸国/羁縻州、海上势力都未表达
- 多个文明边界叠在同一年时只是简单覆盖，没有 dispute / overlap 表达
- **影响**：仅适合作为"地缘感受"，不可作为史料引用
- **缓解方案（未做）**：
  - 引入历史 GIS 库（如 Cambridge Historical GIS 数据）
  - 让每个朝代有按时间段切换的多个 boundary（startYear / endYear 分段）
  - 加 `disputed: true` 字段处理重叠区

---

## 4. 3D 建筑是符号化低模

- 30 个建筑用 Three.js 基础几何体（Box / Cone / Cylinder / Sphere）拼出 14 种 type
- **不是真实建模**：长城是带 9 段垛口的短墙片段、紫禁城与长安宫殿共用 palace 形态
- 没有材质贴图、没有阴影、没有 GLTF
- 不同建筑共用同一 mesh builder 时只是颜色不同
- **缓解方案（未做）**：
  - 为每个 landmark 单独的 procedural builder（如紫禁城三大殿排列）
  - 引入轻量 GLB 模型（每个 < 200 KB），lazy-load
  - 加阴影 / 法线贴图

---

## 5. 数据来源还需要学术化

- `events` / `legacy` / `tags` / `importance` 都是基于公共知识与编辑判断手写
- 没有 citation 字段，没有史料链接
- summary 中可能存在演绎成分（如"塑造了…的长期想象"）
- **影响**：不适合作为教学或研究素材
- **缓解方案（未做）**：
  - 给每个 event 加 `sourceCitation` 字段
  - 给每个 dynasty 加 `references` 列表（书籍 / 论文 / 维基）
  - importance 改为可争议字段，加 `importanceRationale`

---

## 6. 小屏幕仍需进一步优化

- 已实现：1280×720 桌面，max-width 760px 媒体查询折叠
- 仍存在的问题：
  - 移动竖屏（375×812）下信息卡 + 信息面板 + 时间轴会争抢空间
  - 触屏没有 dedicated 手势（双指旋转 OK，但没有"长按 = 锁定"等便利）
  - 时间轴节点 hover tip 在触屏上不易触发
- **缓解方案（未做）**：
  - 移动端切换为"抽屉式"信息卡（从底部滑出）
  - 用 tap 替代 hover 显示节点标签
  - 文明列表移到底部 sheet

---

## 7. React 渲染轻微问题

- `App.jsx` 的 year-change useEffect 用 ESLint disable 关掉 `react-hooks/exhaustive-deps`，因为我们故意只在 year 变化时关卡片
- MapScene 中的多个 `useRef` 持有 React state 拷贝（dynastiesRef / boundariesRef），是 maplibre 事件回调闭包稳定性的妥协，不是 idiomatic React
- 没有 React StrictMode（main.jsx 没启用），双重渲染下的 MapLibre 多次 mount 行为未测试

---

## 8. 性能边界

- 30 个 Three.js mesh + 43 个 GeoJSON 边界 + 时间轴 14 节点 hover：典型笔记本 60fps
- 极端情况：
  - 大量切换图层 + 拖动时间轴极快时偶有 1–2 帧丢
  - building layer 的 zoom 监听器每帧调 `triggerRepaint`，已节流但仍 hot
- **未做**：requestAnimationFrame 性能 profiler、Three.js InstancedMesh 替换分散 mesh

---

## 9. 浏览器与设备兼容

- 已测：Chromium 130+（Edge / Chrome）
- 未充分测试：
  - Firefox（CSS `backdrop-filter` 行为略不同）
  - Safari（WebGL 2 / mix-blend-mode）
  - 老设备 / 集成显卡（Three custom layer + raster-dem 同时可能卡顿）
- 不支持 IE，未考虑

---

## 10. 文案与可访问性

- 中文为主，英文仅作为副标题（titleEn）
- 没有 a11y 角色完整审查（部分按钮已加 aria-label，但截图测试未走过屏幕阅读器）
- 没有键盘导航（除原生 `<button>` / `<input>` 默认行为外）
- 没有 high-contrast mode

---

## 优先级建议

| 等级 | 项 |
|---|---|
| P0 已知不阻塞发版 | 1（体积）/ 7（hooks）/ 8（性能边界）/ 9（兼容） |
| P1 影响学术性 | 3（边界精度）/ 5（来源） |
| P1 影响表现力 | 4（建筑建模） |
| P2 影响新场景 | 6（移动端）/ 10（可访问性） |
| 长期 | 2（自建瓦片） |
