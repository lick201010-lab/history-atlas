# 历史沙盘 · Historical Atlas

一个深色 HUD 风格的交互式历史沙盘，把全球 43 个文明、30 处奇观建筑、跨越公元前 2000 年到公元 2025 年的时空叙事呈现在一张 3D 地形地图上。

| | |
|---|---|
| **仓库** | https://github.com/lick201010-lab/history-atlas |
| **生产域名** | https://atlas.ckl.hk |
| **部署目标** | 阿里云 ECS（Ubuntu 24.04 LTS）+ **Caddy v2** 自动 HTTPS，与 lottery 共用一台机 |
| **部署模式** | 本地 Windows `npm run check` + `scp` 上传 `dist/` 到 `/opt/history-atlas/dist/` |
| **当前阶段** | MVP 原型 · 数据样板 · 部署准备 |
| **状态** | 可本地运行、可校验数据、可构建发布 |

## 命令速查

```bash
npm install            # 一次性安装依赖
npm run dev            # 本地开发 (默认 http://127.0.0.1:5173/)
npm run validate:data  # 校验 dynasties / boundaries / landmarks
npm run build          # 生产构建到 dist/
npm run preview        # 预览构建产物
npm run check          # = validate:data + build，发版前一条命令打底
```

部署到阿里云：见 [docs/ALIYUN_GITHUB_DEPLOYMENT.md](docs/ALIYUN_GITHUB_DEPLOYMENT.md)
日常 Git 工作流：见 [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)

---

## 当前功能

| 维度 | 能力 |
|---|---|
| 地图 | MapLibre GL 4 + raster-dem 3D 地形、可旋转可俯仰、山脉视角按钮 |
| 时间 | 公元前 2000 ~ 公元 2025 时间轴；14 个关键年份节点；时代叙事自动跟随当前年份 |
| 文明 | 43 个文明、每个含 summary / events ≥5 / tags / importance / legacy |
| 边界 | 43 个 rough-refined 粗略多边形，5 个样板更亮、其余更弱 |
| 建筑 | 30 个 Three.js 低模 3D 建筑，14 种 type（palace/pyramid/temple/mosque/stupa/...）；按年份显隐 |
| 信息卡 | 文明档案：分级 meta + 标签胶囊 + 5 颗菱形重要性 + legacy 引用 + 关键节点时间线 + 关联建筑 + 边界精度脚注 |
| 交互深化 | 锁定文明、最多对比 2 个、区域/标签筛选、事件→文明定位、搜索文明/建筑 |
| 氛围 | 双层星空（远景闪烁 + 近景慢漂移）、双层云、全局暗角、深色金蓝色调 |
| 性能 | requestAnimationFrame 节流、build 缓存 staticCanvas、文档隐藏暂停 |
| 响应式 | 桌面 1280×720 起，小屏面板自动折叠/收窄 |

---

## 技术栈

- **React 18** + **Vite 7** — 工程与构建
- **MapLibre GL JS 4.7** — 矢量地图 + raster-dem 地形
- **Three.js 0.160** — 自定义 3D 图层（custom layer）渲染建筑
- 纯原生 JS：无 Redux / 无 D3 / 无 Tailwind / 无 Remotion / 无 UI 库
- 数据：本地 JSON 文件，无后端、无网络请求（除地图瓦片）

---

## 目录结构

```
历史网站/
├── index.html                  Vite 入口
├── package.json
├── vite.config.js
├── README.md                   本文件
├── docs/
│   ├── ACCEPTANCE.md           发布前验收清单
│   ├── KNOWN_ISSUES.md         已知问题
│   └── ROADMAP.md              路线图
├── scripts/
│   ├── validateHistoricalData.mjs   数据校验
│   ├── expandDynasties.mjs          一次性补全文明字段（已执行）
│   ├── expandBoundaries.mjs         一次性精修边界（已执行）
│   └── linkLandmarks.mjs            一次性关联建筑（已执行）
├── prototype/
│   └── index.html              第一期单文件原型（保留）
└── src/
    ├── main.jsx
    ├── App.jsx                 编排中心
    ├── styles.css              全局 HUD 样式
    ├── components/
    │   ├── MapScene.jsx        MapLibre + 边界图层 + 信息卡渲染
    │   ├── Starfield.jsx       Canvas 星空（远景/近景两层）
    │   ├── CloudLayer.jsx      CSS 漂移云层
    │   ├── Timeline.jsx        时间轴 + 关键节点标记
    │   ├── EraNarrative.jsx    时代叙事 + 事件浮现
    │   ├── InfoPanel.jsx       右侧文明 / 建筑列表
    │   ├── LayerControls.jsx   图层开关 + 搜索
    │   ├── FilterPanel.jsx     区域 / 标签筛选
    │   └── ComparePanel.jsx    最多 2 个文明对比
    ├── map/
    │   ├── mapStyle.js         MapLibre style + 地形开关
    │   └── createBuildingLayer.js  Three.js custom layer + 14 种 mesh builder
    ├── utils/
    │   ├── formatYear.js       公元前 / 公元 格式化
    │   ├── narrative.js        时代查找 / 事件邻近 / 兴衰判定
    │   └── buildCard.js        文明档案合成
    └── data/
        ├── dynasties.json      43 个文明
        ├── boundaries-simplified.json   43 个边界（GeoJSON）
        ├── landmarks.json      30 个建筑
        └── eras.json           8 个时代
```

---

## 本地启动

```bash
cd C:/Users/Yvette/Documents/历史网站
npm install
npm run dev
```

默认监听 `http://127.0.0.1:5173/`。Vite 启动后浏览器打开即看到完整沙盘。

> 注意：地图底图与地形瓦片来自 carto-cdn 与 amazonaws elevation-tiles，首次加载需要外网。

---

## 数据校验

```bash
npm run validate:data
```

校验内容：
- 43 个 dynasty 字段完整、年份合法、relatedLandmarks 仅引用 landmarks.json 存在的 id
- 43 个 boundary 是闭合 polygon、坐标在 [-180, 180] / [-90, 90] 内
- 5 个 sample 必须有 sourceNote、accuracy = `rough-refined`、ring ≥ 7 顶点、非矩形
- 30 个 landmark id/name/lng/lat/startYear/endYear 合法且 start ≤ end

---

## 构建

```bash
npm run build          # 产物输出到 dist/
npm run preview        # 本地预览构建结果
npm run check          # = validate:data && build，一条命令打底
```

构建产物：~83 KB CSS（gzip 13 KB）+ ~1.5 MB JS（gzip 420 KB，主要是 MapLibre + Three）。

---

## 当前数据规模

| 资源 | 数量 |
|---|---|
| 文明（dynasties） | 43（5 个 sample / 38 个常规） |
| 边界（boundaries） | 43，全部 rough-refined 多边形 |
| 建筑（landmarks） | 30，14 种 type，覆盖中国/中东/印度/地中海/中美/南美/非洲/欧洲/东南亚/朝鲜 |
| 时代（eras） | 8，从青铜时代到现代国家与全球体系 |
| 时间轴节点 | 14 个关键年份 |

---

## 已知限制

详见 [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)，速览：
- 主 bundle 较大（MapLibre + Three 是主体）
- 地形 / 底图依赖外部瓦片
- 边界仅是粗略示意，不是学术级历史地图
- 3D 建筑是符号化低模，不是真实建模
- 移动端可用但不是优先目标

---

## 后续路线图

详见 [docs/ROADMAP.md](docs/ROADMAP.md)。重点候选：
- 数据来源与引用体系（每条 event / boundary 加 citation）
- 更精细的历史边界（手工绘制多边形或引入 GeoJSON 库）
- 数据编辑器（让历史研究者直接编辑 JSON）
- 性能拆包（MapLibre / Three 动态 import）
- 部署到静态托管（Cloudflare Pages / Vercel）
- 移动端布局重排

---

## 许可与致谢

- 地图底图：CARTO Dark — © OpenStreetMap contributors © CARTO
- 地形 DEM：AWS Open Data — Terrain Tiles
- 项目代码与数据为原型阶段产物，**不构成历史学术参考**

历史信息以 MVP 数据为主，欢迎史料引用的修正与补全。
---

## GitHub 同步与阿里云部署

本项目源码托管在 GitHub，生产环境是阿里云 ECS `47.237.181.181`，与 lottery 共用 Caddy。
`atlas.ckl.hk` 由 Caddy 自动签发 Let's Encrypt 证书，无需 certbot / Nginx。

- 部署完整说明：[docs/ALIYUN_GITHUB_DEPLOYMENT.md](docs/ALIYUN_GITHUB_DEPLOYMENT.md)
  涵盖：Caddyfile 追加块、DNS 配置、本地构建 + scp 上传、验收命令、资源估算、故障排查、Nginx/certbot 旧方案（仅作附录参考）
- 日常 Git 工作流：[docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
- 环境变量模板：[.env.example](.env.example)（复制成 `.env.local` 后修改；`.env*` 已被 `.gitignore` 排除）

每次发布只跑两条命令：

```bash
# 1. 本地构建（含数据校验）
npm run check

# 2. 上传到生产
scp -r dist/* root@47.237.181.181:/opt/history-atlas/dist/
```

服务器侧 Caddy 直接读 `/opt/history-atlas/dist/`，新文件秒级生效，**无需 git pull、无需 reload**。
只有改 Caddyfile（增加路由、改子域）才需要登录服务器 `caddy validate` + `systemctl reload caddy`。

