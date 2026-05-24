# 历史沙盘 · 路线图

记录已完成阶段与下一阶段候选方向，方便决策"先做哪个"。

---

## MVP 已完成（v0.1.0）

### 阶段 1：视觉与技术原型（prototype/index.html）
- 单文件 HTML，MapLibre 3D 地形 + Three.js custom layer 验证
- 5 个低模建筑、星空、云层、时间轴雏形

### 阶段 2：React + Vite 工程化
- 拆组件、模块化、Vite 构建链
- StateManagement 用 React 原生 hooks

### 阶段 3：视觉精修
- 信息卡分级、HUD 容器、暗角、金色滚动条
- 1280×720 布局收敛

### 阶段 4：数据扩展
- 文明从 5 → 43，每个补全 summary/events/tags/importance/legacy
- 边界从 5 矩形 → 43 粗略多边形，全部 rough-refined
- 建筑从 5 → 30，跨 14 个 type、跨 10 个区域

### 阶段 5：时间叙事
- 8 个时代档案
- 事件浮现（±30 年窗口、最多 5 条）
- 文明兴衰徽章
- 时间轴 14 个关键节点

### 阶段 6：地图交互深化
- 文明锁定 / 解锁
- 最多 2 个文明对比 + 第 3 个触发轻提示
- 区域 / 标签筛选 + 清除
- 事件点击 → 文明定位 + 自动锁定
- 搜索文明 → 飞行 + 开卡

### 阶段 7：视觉性能与信息降噪
- z-index 分层修正、面板互相让位
- 默认元素去发光、激活态强对比
- 文本截断、滚动条统一、紧凑响应式

### 阶段 8：发布与稳定性（当前）
- README / ACCEPTANCE / KNOWN_ISSUES / ROADMAP
- `npm run check` 一键校验

---

## 下一阶段候选

按优先级降序排列，每项独立成 milestone，方便取舍。

### M1 · 数据来源与引用体系（学术化第一步）
**为什么**：当前所有文本都是"无引用"的编辑判断，无法作为教学/研究素材。

**做什么**：
- 给 dynasty / event / boundary 加 `references: [{title, url, kind}]` 字段
- 不破坏现有 schema，validator 检测 references 存在性但不强制
- UI 在信息卡 footer 增加"参考来源"折叠区
- 至少为 5 个 sample 文明补全 ≥3 条引用

**改动范围**：data + InfoPanel JSX + validator + CSS

---

### M2 · 更精细的历史边界
**为什么**：单一多边形无法表达朝代不同时期的版图变化。

**做什么**：
- 重构 boundaries schema 为时间分段：
  ```json
  { "id": "tang", "segments": [
    { "startYear": 618, "endYear": 660, "ring": [...] },
    { "startYear": 660, "endYear": 755, "ring": [...] },
    { "startYear": 755, "endYear": 907, "ring": [...] }
  ]}
  ```
- MapScene 根据当前 year 选合适 segment 渲染
- 为 5 个 sample 文明先做 3 段切片，验证体验
- 添加 `disputed: true` 区域支持

**改动范围**：data schema + MapScene 渲染 + validator + 文档

---

### M3 · 更多建筑（landmarks 50 → 100）
**为什么**：当前 30 个建筑分散在 10 个区域，单个区域还是稀疏。

**做什么**：
- 补到 50–60 个，覆盖更多类型：
  - 港口（港口型 city builder）
  - 桥梁（bridge builder）
  - 灯塔（lighthouse builder）
  - 中国塔（pagoda builder，区别于 stupa）
  - 玛雅球场（ballcourt）
- 为每种新 type 写独立 mesh builder
- 改用 Three.js `InstancedMesh` 渲染相同 type 的多个实例

**改动范围**：landmarks.json + createBuildingLayer.js + 数据校验脚本

---

### M4 · 数据编辑器
**为什么**：让历史研究者直接修改 JSON，不必碰代码。

**做什么**：
- 新建 `/admin` 路由（同一 Vite 工程）
- 文明编辑：表单 + 实时 JSON 预览 + 校验报错
- 边界编辑：地图上点选拖动顶点
- 导出按钮：把当前内存中的数据保存为 .json 文件下载
- 不写后端，纯前端 + File System Access API（可选）

**改动范围**：新增 ~3 个组件 + 路由配置

---

### M5 · 性能拆包
**为什么**：当前 bundle 1.5 MB，弱网首屏慢。

**做什么**：
- MapLibre 动态 import（`/admin` 不需要 MapLibre 时不加载）
- Three.js 动态 import（建筑图层关闭时不加载）
- `manualChunks`：把 react/react-dom 拆为 vendor chunk、把 data JSON 拆为独立 chunk
- 目标：首屏 < 200 KB（gzip）

**改动范围**：vite.config.js + App.jsx 用 `<Suspense>` 包子组件

---

### M6 · 部署
**为什么**：让别人能看到。

**做什么**：
- Cloudflare Pages 或 Vercel 一键托管 `dist/`
- 自定义域名（可选）
- 加 robots.txt 与 OG meta（让分享卡片显示首屏截图）
- GitHub Actions 跑 `npm run check` on PR

**改动范围**：deploy 配置 + 一个截图

---

### M7 · 移动端优化
**为什么**：当前移动竖屏布局拥挤。

**做什么**：
- 信息卡改"底部 drawer"形式
- 文明列表改"侧边 sheet"
- 触屏 hover 替代：长按显示节点 tip
- 时间轴改成更大触摸目标
- 测试 iOS Safari + Android Chrome

**改动范围**：styles.css 媒体查询 + 部分组件结构

---

### M8 · 富文本时代叙事
**为什么**：当前每个时代是 1 段 summary，信息密度低。

**做什么**：
- eras.json 增加 sections（政治 / 文化 / 经济 / 宗教）
- 每个 section 一段短文 + 关键标签
- EraNarrative 改为可滚动的多段视图

**改动范围**：eras schema + EraNarrative 组件

---

### M9 · 多语言（i18n）
**为什么**：英文世界看不懂当前中文 UI。

**做什么**：
- 提取 UI 字符串到 `i18n/zh.json` / `i18n/en.json`
- 右上角加语言切换
- 数据 JSON 的 `name / nameEn` 已经预留了双语，但 summary/legacy/events 没有
- 先做 UI i18n，数据 i18n 留后

**改动范围**：新增 utils/i18n.js + 全组件改字符串引用

---

### M10 · "故事模式"动画
**为什么**：当前是探索式，没有引导。

**做什么**：
- 预设几条"剧情线"（如"丝绸之路 800 年"）
- 自动播放：缓慢推进时间轴 + 自动飞行 + 旁白浮层
- 用户可暂停 / 跳过

**改动范围**：新增 StoryMode 组件 + 数据 stories.json

---

## 优先级矩阵

| 维度 | 学术性 | 体验 | 工程 |
|---|---|---|---|
| **高** | M1 引用 / M2 边界分段 | M3 建筑 / M10 故事 | M5 拆包 / M6 部署 |
| **中** | M8 富文本叙事 | M7 移动端 | M4 数据编辑器 |
| **低** | — | M9 多语言 | — |

建议下一站：**M6 部署**（先让别人能看到，闭环验证）+ **M1 引用体系**（学术化基础设施）并行。
