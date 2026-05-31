# 文明星图 — 平面地图眼校工作记录

> 本文件是会话进度快照，便于续接。记录"做了什么、为什么、还差什么"。
> 最近更新：2026-05-31

## 背景

线上是 dark 主题历史文明星图（https://atlas.ckl.hk）。此前曾从 MapLibre 平面地图试验改为 globe.gl 3D 地球，后用户决定**弃用 3D 地球、回退平面地图**。2026-05-31 已移除 `globe.gl` 依赖、`GlobeScene.jsx` 与地球贴图资源，当前只保留 MapLibre 平面地图作为主线。

## 长期约束（不变）

- 所有视觉改动**严格限定 dark 主题**；**atlas 主题冻结**（观感须与冻结前一致）。主题钩子 `body[data-theme="dark"|"atlas"]`。atlas 切换按钮已注释冻结，仅能手改 localStorage 进入。
- **不手改三份数据 JSON**：`dynasties.json` / `boundaries-simplified.json` / `landmarks.json`。运行时内存变换允许。
- 不引入新依赖；保持 MapLibre v4；不再保留 `globe.gl`/`GlobeScene.jsx` 地球线。
- 不破坏交互：点击出卡 / 锁定 / 对比 / 搜索 / 建筑 tooltip+卡片 / 时间轴拖动 / 阶段指示 / hover / flyTo / 山脉视角 / 重置视角。
- 每步 `npm run build` 通过；`npm run validate:data` 确认数据未动。
- **预览标签页 RAF 冻结**（`document.hidden:true`），MapLibre 渲染不出来 → 我无法自校 WebGL，必须靠用户真实浏览器硬刷新眼校。

## 用户三诉求（本轮）

1. **地图右边过不去** —— 镜头要能往右看到地图右缘；最右地区被右侧信息面板挡住。
2. **朝代边界线丑** —— 不圆滑、像低多边形折线、很廉价。
3. **奇观模型太丑** —— 要像参考图（圣索菲亚大教堂，有穹顶/塔的精细建模），颜色可简单但模型精度要有。

## 已完成的改动（按文件）

### `src/components/MapScene.jsx`
- **镜头自由度**：`maxPitch 75→82`；`renderWorldCopies:false`（单世界不重复）；
  **明确不加 `maxBounds`**——高 pitch 下 MapLibre 为把视锥地面足迹塞进 bounds 会强制
  `zoom 22` / center 推到角落 → **黑屏**（已两次复现：tight bounds + pitch55、generous
  bounds [[-300,-140],[300,140]] 也黑，疑似 lat>85 在 Mercator 发散）。已彻底删除。
- **右侧 padding（解决"右边过不去/被面板挡"）**：`map.on('load'|'resize', applyViewportPadding)`，
  宽屏右 padding 360px、窄屏按比例。把有效视口内缩到面板左缘，平移约束放宽，世界可向左推、
  最右地区移出面板。**无投影/黑屏风险**（不是 maxBounds）。
- **边界平滑接入**：`import { smoothBoundaryCollection }`；在 addSource 与 boundaries
  setData effect 两处都包一层 `smoothBoundaryCollection(...)`。
- **边界线层 layout**：给 `-glow`/`-casing`/`-line`/`-hover` 四个 line 层加
  `layout: { 'line-join':'round', 'line-cap':'round' }`，让平滑后顶点无缝。
- （上一轮）新增 `dynasty-territory-casing` 深色衬底层，已接入年份 setFilter / 可见性 effect /
  初始化 setVisibility 三处；主题切换 `map.resize()`。

### `src/map/smoothBoundaries.js`（新建）
- 运行时 **Chaikin 角点切割**平滑面要素（Polygon/MultiPolygon）的环；
  按顶点数自适应迭代（≤12→3 次、≤40→2、≤160→1、更多→0 不动）；
  保留 properties；WeakMap 缓存。**不改数据 JSON**。

### `src/map/mapStyle.js`（上一轮边界四合一画风）
- `THEME_PRESETS.dark.boundary`：柔填充回归 `fillOpacityRefined/Plain = 0.12/0.06`；
  `lineOpacityRefined/Plain = 0.96/0.5`；`lineDash:[1,0]`（dark 实线）。
- `applyBoundaryPaint` dark 分支：glow/casing/line 的 `line-width` 改 zoom 插值（随缩放加粗）；
  line `line-blur:0.25`（更锐）；casing 近黑藏蓝 `#03070e`。**atlas 分支 casing `line-opacity:0`**（冻结）。

### `src/map/createBuildingLayer.js`（模型升级·试点）
- **升级通用 `buildCathedral`**：旧版是"裸方块+单尖、无穹顶"→ 新版哥特式：
  中殿+南北侧廊+十字耳堂+陡坡顶（4 坡锥压扁成长脊）+西立面双塔尖+交叉小尖塔 flèche+东端半圆后殿。
  巴黎圣母院、威斯敏斯特同步受益。
- **新增 `buildProfileHagiaSophia`**（圣索菲亚专属，对应参考图）：巴西利卡主体+南北侧廊+
  中殿核心+东西半穹顶+中央大穹顶（鼓座+扁半球+顶尖）+四角奥斯曼宣礼塔。
- **代码侧 id 覆写** `ID_PROFILE_OVERRIDES = { 'hagia-sophia': buildProfileHagiaSophia }`，
  在 `makeMesh` 选模型时优先级最高：① id 覆写 → ② modelProfile → ③ type 通用 → ④ 兜底。
  **未改 `landmarks.json`**，独立于 `PROFILES`/`MODEL_PROFILE_KEYS`（不触发 assertProfileCoverage）。

### 精细化样板 1：拜占庭边界 + 圣索菲亚 GLB（2026-05-31 本轮）

**目标 A — 拜占庭边界海岸贴合（`scripts/refineByzantineBoundary.mjs` 新建）**
- 问题根因：原 byzantine 三阶段虽标 `coastline-aware-rough`，但每阶段只用**一个凸包络**裁
  Natural Earth 陆地 → 凸包把希腊/安纳托利亚/黎凡特/埃及用直线弦连起来 →「粗线跨海压过去」。
- 解法：每阶段改用**一组按陆块拆分的凸子包络**（安纳托利亚 / 巴尔干-希腊 / 黎凡特 / 埃及尼罗 /
  昔兰尼加 / 塞浦路斯 / 克里特 / 爱琴小岛；peak 另加意大利 / 西西里 / 撒丁科西嘉 / 北非 / 南西班牙 /
  巴利阿里；decline 改为巴尔干 / 安纳托利亚 / 塞浦路斯 / 克里特 / 南意大利 / 西西里）。切割线落在海上，
  裁出的每块各自贴合海岸，不再连成跨海整片。
- 复用 `generateCoastAwareBoundaries.mjs` 的 Sutherland-Hodgman / 凸包 / Douglas-Peucker /
  densify / loadNaturalEarth；`DP_EPS=0.10`、`MIN_RING_AREA=0.06 度²`（留住克里特/塞浦路斯/罗德/莱斯沃斯，
  去掉极小碎屑）；按质心+面积去重相邻包络重复裁出的同一岛。
- 只重写 `boundaries-simplified.json` 里 3 个 `byzantine` feature（rise 11 块 / peak 20 块 / decline 10 块），
  其余 86 个不动；保留 `accuracy:'coastline-aware-rough'`、color `#9b59b6`、capital 君士坦丁堡；
  `accuracyNote/sourceNote` 标注「coastline-clipped 粗历史范围」。**未手改 dynasties/landmarks JSON。**

**目标 B — 圣索菲亚 GLB 资产管线（`scripts/buildHagiaSophiaGlb.mjs` 新建 + `createBuildingLayer.js` 接线）**
- `buildHagiaSophiaGlb.mjs`：用 three 程序化建出更精细的圣索菲亚（台基 + 南北侧廊 + 连拱廊柱列 +
  中殿核心 + 四角扶壁墩 + 东西半穹顶 + 鼓座窗墩 + 中央大穹顶 + 鎏金顶尖 + 四宣礼塔阳台尖顶），
  8 种材质分色（台基/石墙/扶壁/半穹顶/鼓座/铅灰穹顶/宣礼塔/鎏金），按材质合并后用 GLTFExporter 导出
  `public/models/hagia-sophia.glb`（约 216KB，~5485 顶点）。坐标系与程序化 builder 一致（z 上、足迹 ±0.7、
  base 贴地 z≥0）。Node 里给 GLTFExporter 补了最小 `FileReader` polyfill（用 `Blob.arrayBuffer()`）。
- `createBuildingLayer.js`：`import GLTFLoader`；`ID_GLB_OVERRIDES = { 'hagia-sophia': BASE_URL+'models/hagia-sophia.glb' }`；
  单例 `gltfLoader`。`makeMesh` 命中覆写时先出**程序化模型**（立即可见 + 兜底），再 `loadGlbBody` 异步加载；
  成功则移除程序化体块、换上 GLB（材质打 `role='body'`/`baseColor`/`atlasColor` 钩子，套用当前主题），
  **失败则保留程序化模型**。GLB 与程序化同坐标系故贴地不变。`setTheme` 存 `this._themeKey` 供异步替换后套用。
- `vite.config.js`：`optimizeDeps.include` 加 `GLTFLoader.js`（dev 单 three 实例，避免 multiple instances 警告）。

### `src/App.jsx` / `src/styles.css`（更早）
- 已移除 `USE_GLOBE` 与 `GlobeScene` 分支；`.map-frame` 星图卡装裱框（仅 dark 可见，四角角标 + 罗盘）；
  `body[data-theme="dark"] #map` 内缩 + 发光边框。

## 验证状态
- `npm run build` 通过；`npm run validate:data` 通过（43 朝代 / 89 边界 / 30 地标，数据未动）。
- 2026-05-31：移除 `globe.gl` 后重新验证通过；主业务 chunk 从约 1.88MB 回落到约 635KB。
- 2026-05-31（拜占庭+GLB 轮）：`validate:data` 通过（43/89/30，5 refined samples，15 model profiles）；
  `npm run build` 通过；`public/models/hagia-sophia.glb`（216KB）已生成并被复制进 `dist/models/`。
  **仍待用户实机眼校**：拜占庭 600 年视角边界是否贴合安纳托利亚/巴尔干/地中海岸、海洋未被涂成陆地；
  圣索菲亚是否显示穹顶/宣礼塔复合体块；控制台无报错。
- **用户实机眼校：仍"好像不行"**（2026-05-31）。具体哪一项不行、什么现象，待用户进一步反馈
  （是又黑屏？还是右边仍过不去？还是边界/模型没变化？）。

## 模型现状参考（排查用）
- 30 个地标：15 个有 `modelProfile`（高精度 profile），15 个无 → 走通用 `BUILDERS[type]`。
- 无 profile 的 15 个按 type：
  - cathedral：圣索菲亚（已加 id 覆写）、巴黎圣母院、威斯敏斯特（已随通用 cathedral 升级）
  - mosque：杰内大清真寺；temple：天坛、科纳克太阳神庙；pyramid：特奥蒂瓦坎、麦罗埃金字塔群
  - ziggurat：乌尔金字形神塔；stupa：桑奇大塔；fortress：德里红堡、大津巴布韦
  - city：佩特拉古城；monument：伊什塔尔门；observatory：瞻星台
- 选模型逻辑在 `createBuildingLayer.js` `makeMesh`（约 1455 行附近）。
- 模型局部坐标系：xy ~ ±0.7，z 0~1.3；按材质角色 `mergeByMaterial` 合并砍 draw call。

## 待办 / 下一步
1. **定位"还是不行"**：请用户说明现象（黑屏？右缘仍到不了？边界/模型无变化？是否硬刷新清缓存？）。
   - 若黑屏 → 检查 padding 是否意外触发约束；可临时移除 padding 二分排查。
   - 若边界没变圆 → 确认 `smoothBoundaryCollection` 是否真的命中（boundaries 数据结构是否 FeatureCollection）。
   - 若模型没变 → 确认 `building.id` 字段名是否为 `id`（覆写按 id 命中）；硬刷新清 three 缓存。
2. 模型试点（圣索菲亚 + 哥特 cathedral）若获认可 → 推广到其余通用 builder（mosque/temple/pyramid/
   ziggurat/stupa/observatory/city/monument/fortress）到同精度。
3. 全绿后：交互回归 + atlas 冻结校验（临时切 localStorage）→ 用户签字 → `npm run deploy`
   （Windows scp glob bug 时在 bash 手工等效执行）。

## 关键排查事实
- 预览看不到地图是**已知限制**（RAF 冻结），不代表代码坏。只信用户真实浏览器。
- `window._map` 是调试句柄。
- 黑屏几乎都与 `maxBounds` + 高 pitch 有关；当前已无 maxBounds。
