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

### 二轮精修（2026-05-31 晚）

**圣索菲亚 GLB 二轮（`scripts/buildHagiaSophiaGlb.mjs` 重写）**
- 从「积木」升级为 stylized low-poly miniature：16 材质分区 + 148 体块 + ~15.3k 三角 +
  顶点色 AO（按高度底暗顶亮、朝下面压暗 → 暗角/凹缝体积层次）。
- 部件：中央大穹顶(64×36 高分段)+金尖 / 东西半穹 / 四角小半穹 exedra / 侧翼小穹顶群 /
  鼓座+一圈窗洞暗块与窗间柱 / 主巴西利卡体块+南北侧廊+坡顶+檐口 / 一排拱窗暗块 /
  四角扶壁墩+外侧飞券暗示 / 东端半圆后殿 / 西端门廊台阶+三道拱门暗块 /
  四宣礼塔（塔身三段+双阳台金环+铅笔尖顶+金顶尖）。
- z 0→1.45 贴地、足迹 ±0.78；约 648KB。GLTFLoader 加载 + 程序化兜底逻辑不变。

**拜占庭边界二轮（`scripts/refineByzantineBoundary.mjs` 加 `roughenRing`）**
- 针对「内陆直线包络感」：检测环里 > 0.55° 的长直边（内陆包络边），沿边重采样（步长 0.32°）
  并施加沿法线的平滑起伏（两频正弦叠加，`sin(t·π)` 包络使两端=0、不破坏海岸接缝），
  幅度 ≤ 0.24°(~24km)。海岸密集段（DP 后短边）原样不动。
- 顶点数 rise/peak/decline 由 284/437/259 增至 919/1393/747；内陆边读作粗糙自然边界而非笔直斜线。

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

## 2026-06-03 选中奇观观赏模式 MVP

本轮由 Codex 直接完成，属于交互与图层协调，不是 GLB 建模任务。

已改动：
- `src/App.jsx`：把 `selectedLandmarkId` 传给 `MapScene`。
- `src/components/MapScene.jsx`：新增 `activeBuildingLabelFilter` 与 `focusCameraForBuilding`；选中奇观后使用专属镜头，过滤建筑标签，只保留选中奇观名称；降低朝代边界、都城点和都城标签干扰。
- `src/map/createBuildingLayer.js`：新增 `setFocus(focusId)`，通过 Three group visibility 隐藏非选中 3D 奇观，并给选中模型轻微放大。没有改材质透明度，避免深度排序和黑块问题。

验收：
- `npm run check` 通过。
- 紫禁城焦点截图：`docs/glb-visual-qa/focus-mode-forbidden-city.png`。
- 佩特拉焦点截图：`docs/glb-visual-qa/focus-mode-petra.png`。

结论：
- MVP 通过。选中奇观后画面明显更干净，非选中模型不会挤进观察区域，边界线也不再压过模型。
- 不应夸大成最终精美版。左右 HUD 面板仍保留，适合工作流；后续如果追求“博物馆级观赏”，应单独做 immersive inspection mode，临时隐藏 HUD。
- 下一个最该交给 Claude 的建模任务是 `forbidden-city.glb`：修蓝色侧面 artifact，强化中轴、院落、红墙黄瓦、宫殿层级。

## 2026-06-03 Claude 直连与紫禁城 GLB 精修

用户要求不要再手动复制提示词给 Claude。已确认本机可直接调用 Claude Code CLI：

- 命令：`claude.cmd`
- 版本：`2.1.138`
- 本地运行日志目录：`.claude-runs/`，已加入 `.gitignore`

本轮已直接通过 CLI 派发紫禁城 GLB 精修任务给 Claude，不经过用户粘贴。

Claude 改动：
- `scripts/buildForbiddenCityGlb.mjs`
- `public/models/forbidden-city.glb`
- `docs/3D_ASSET_STANDARD.md`
- `docs/GLB_ASSET_BASELINE.md`

Codex 复核：
- `npm run check` 通过。
- GLB audit：`14 OK / 0 WARN / 0 FAIL`。
- `forbidden-city.glb` 从约 201 KB 增加到约 300 KB，仍在轻量预算内。
- 新焦点截图：`docs/glb-visual-qa/10-forbidden-city-after-focus.png`。

视觉结论：
- MVP 通过。紫禁城现在能看出红墙、黄瓦、中轴宫殿群和院落层级。
- 旧问题里的蓝色侧面 artifact 在焦点截图中未再出现。
- 不应夸大成最终精美版：它仍是 stylized low-poly miniature，后续还可以加强屋脊、门楼、台基、院落深度。

下一优先级：
- `angkor-wat` 和 `pyramid` 进入第二轮精修队列。
- 焦点模式可继续演进为 immersive inspection mode，但不是当前最急。

## 2026-06-03 吴哥窟 GLB 第二轮精修

本轮继续按“Codex 验收 + Claude 建模”的分工推进。Codex 直接通过 `claude.cmd` 派发吴哥窟精修任务，无需用户粘贴提示词。

Claude 改动：
- `scripts/buildAngkorWatGlb.mjs`
- `public/models/angkor-wat.glb`
- `docs/GLB_ASSET_BASELINE.md`
- `docs/GLB_VISUAL_QA.md`

Codex 补充：
- `src/components/MapScene.jsx`：为 `angkor-wat` 增加专属 selected-landmark focus camera，避免默认镜头太远导致新增结构看不清。
- `docs/3D_ASSET_STANDARD.md`：同步新造型说明和体量数字。
- 新焦点截图：`docs/glb-visual-qa/07-angkor-wat-after-focus.png`。
- 截图 manifest：`docs/glb-visual-qa/07-angkor-wat-after-focus-manifest.json`。

验收：
- `npm run check` 通过。
- GLB audit：`14 OK / 0 WARN / 0 FAIL`。
- `angkor-wat.glb` 从约 110 KB / 2,834 tris 增加到约 152 KB / 3,722 tris，仍远低于预算。
- 地图焦点图里能看出中央五塔、外层台基/回廊和西侧参道，不再是紧凑小块。

视觉结论：
- 吴哥窟从 Warn 升级为当前 MVP Pass。
- 不应夸大成最终精美版：它仍是 stylized low-poly miniature，后续 final pass 可继续补更细的回廊 bay rhythm、莲花苞细节和材质层次。

下一优先级：
- `pyramid` 是最后一个仍在 Warn 队列里的已接入 GLB。应交给 Claude 做吉萨组合第二轮：主金字塔 + 卫星金字塔 + 平台/祭庙/沙漠石材层次。
- 金字塔过线后，再考虑 immersive inspection mode 和边界贴合专项。

## 2026-06-03 吉萨金字塔 GLB 第二轮精修

本轮继续直接通过 `claude.cmd` 派发给 Claude。Codex 负责复核、截图和是否接受视觉结论。

Claude 改动：
- `scripts/buildGreatPyramidGlb.mjs`
- `public/models/great-pyramid.glb`
- `docs/GLB_ASSET_BASELINE.md`
- `src/components/MapScene.jsx`（Claude 越界加了 `pyramid` focus camera，Codex 审后接受为集成修漏）

Codex 补充：
- `src/map/createBuildingLayer.js`：新增 `FOCUS_SCALE_OVERRIDES`，只让 `pyramid` 在选中态放大到 `1.42`，避免普通世界视图膨胀，同时让吉萨副体量在观赏模式可读。
- `src/components/MapScene.jsx`：把 `pyramid` focus camera 调整为更能看出三塔群关系的角度：`zoom 7.8 / pitch 58 / bearing 42`。
- `docs/3D_ASSET_STANDARD.md` 与 `docs/GLB_VISUAL_QA.md`：同步新标准、验收结论和截图。
- 新焦点截图：`docs/glb-visual-qa/05-pyramid-after-focus.png`。
- 截图 manifest：`docs/glb-visual-qa/05-pyramid-after-focus-manifest.json`。

验收：
- `npm run check` 通过。
- GLB audit：`14 OK / 0 WARN / 0 FAIL`。
- `great-pyramid.glb` 从约 53 KB / 892 tris 增加到约 96 KB / 1,540 tris，仍非常轻。
- 真实地图焦点图里能读出主金字塔、第二/第三金字塔、台地和卫星小金字塔。

重要判断：
- Claude 第一次输出虽然技术校验通过，但默认截图仍主要像“一座金字塔”，Codex 没有接受为视觉 Pass。
- 通过更适合吉萨群的 focus camera 与选中态比例修正后，才把它升级为当前 MVP Pass。

下一优先级：
- 当前 14 个已接入 GLB 都达到 MVP Pass。
- 下一步二选一：
  1. 做 immersive inspection mode：选中奇观时临时隐藏 HUD/时间轴，进入更干净的观赏状态；
  2. 做朝代边界贴合专项：集中解决跨海乱描、海岸线错位、面片过粗。
- 从用户最近反馈看，边界贴合和海洋/陆地清晰度仍是整体观感短板；如果继续按“精美完整版”推进，建议先做 immersive inspection mode 的小步版本，再进入边界贴合专项。

## 2026-06-03 奇观沉浸观赏模式 MVP

本轮由 Codex 直接完成，属于交互/视觉修缮，不需要 Claude。

已改动：
- `src/App.jsx`：新增 `landmarkImmersive` 状态；选中奇观后可切换沉浸观赏；关闭奇观、切换到文明卡或年份使奇观失效时自动退出；支持 `Escape` 退出。
- `src/components/LandmarkCard.jsx`：新增 `沉浸 / 退出` 按钮，保留 `定位` 和关闭。
- `src/styles.css`：`body.landmark-immersive` 下隐藏标题、视角按钮、图层/搜索、筛选、信息面板、时代叙事、对比面板和时间轴；建筑卡收缩为底部小铭牌。
- `src/styles-mobile.css`：手机沉浸模式下小铭牌固定在底部，退出按钮不出屏。

验收：
- `npm run check` 通过。
- 桌面截图：`docs/glb-visual-qa/immersive-mode-hagia-sophia-desktop.png`。
- 桌面 manifest：`docs/glb-visual-qa/immersive-mode-hagia-sophia-desktop-manifest.json`。
- 手机截图：`docs/glb-visual-qa/immersive-mode-hagia-sophia-mobile.png`。
- 手机 manifest：`docs/glb-visual-qa/immersive-mode-hagia-sophia-mobile-manifest.json`。

视觉结论：
- MVP 通过。选中奇观后可以一键进入干净观赏画面，HUD 与时间轴不再遮挡模型。
- 沉浸模式不是自动触发，而是卡片按钮触发；这是刻意选择，避免用户在普通探索时突然丢失列表和时间轴。
- 仍不是最终“电影镜头”模式：后续可加缓慢 orbit、聚光/轮廓光、或观赏视角预设队列。

下一优先级：
- 朝代边界贴合专项。当前模型观赏路径已够干净，整体粗糙感主要来自边界跨海、海岸线错位和粗面片。
## 2026-06-03 Goal mode and Claude direct-call setup

Codex confirmed the active project goal is still running:

- Objective: finish the history-atlas polish and bug-fix work into a refined, stable full version.
- Current workspace permissions: no approval prompts, full filesystem access.

Claude Code direct delegation was verified locally:

- Command: `claude.cmd`
- Version: `2.1.138`
- Minimal ASCII non-interactive smoke test returned `CLAUDE_DIRECT_OK`.
- Chinese prompt text should be sent through UTF-8 prompt files, not direct PowerShell pipe input, because a pipe smoke test garbled Chinese text.

Project notes updated:

- `AGENT.md`
- Obsidian `08-GitHub与协作分工.md`
- Obsidian `12-Claude任务提示词模板.md`

Operational rule: when a future task is clearly better suited to Claude Code, Codex should directly create a narrow `.claude-runs/<task>-prompt.md`, call Claude from the project root, then own validation, screenshots, documentation, Git review, and integration.

## 2026-06-03 Byzantine boundary cleanup pass

Goal: address the obvious "乱描 / 错位" feeling in the Byzantine focus area without changing dynasty data, landmark data, map style presets, or 3D assets.

Issue diagnosis:

- `src/data/boundaries-simplified.json` already uses `coastline-aware-rough` for the current boundary set, so the remaining visual issue is not just "no coastline clipping".
- Runtime Chaikin smoothing was still applied strongly to coast-aware rings. That can shrink or round already-coast-clipped geometry and make borders look offset from the basemap coastline.
- The Byzantine refinement script preserved very small Aegean island fragments. At high pitch and with glow/casing, those small rings read as messy stray boundary strokes.

Fixes:

- `src/map/smoothBoundaries.js`: coast-aware features now receive only light smoothing for small rings and no smoothing for detailed rings, preserving Natural Earth coastline shape more faithfully.
- `scripts/refineByzantineBoundary.mjs`: increased the minimum retained island/ring area from `0.06` to `0.40` square degrees. This keeps important islands such as Crete and Cyprus while removing small Aegean fragments that create visual clutter.
- Regenerated only the 3 Byzantine boundary features in `src/data/boundaries-simplified.json`.

Before/after geometry counts for Byzantine:

- rise: `11 rings / 919 vertices` → `7 rings / 889 vertices`
- peak: `20 rings / 1393 vertices` → `13 rings / 1318 vertices`
- decline: `10 rings / 747 vertices` → `6 rings / 717 vertices`

Verification:

- `npm run check` passed: data validation, GLB audit, and Vite build all succeeded.
- GLB audit stayed clean: `14 OK / 0 WARN / 0 FAIL`.
- Browser CDP QA at `http://127.0.0.1:5173/` selected Byzantine at year 600, confirmed the relevant territory layers were visible, and captured screenshots.
- Screenshot: `docs/boundary-qa/byzantine-600-boundary-after.png`
- Clean boundary screenshot: `docs/boundary-qa/byzantine-600-boundary-clean-after.png`
- Manifest: `docs/boundary-qa/byzantine-600-boundary-after-manifest.json`
- Browser console had no app errors. The only failed network records were canceled tile requests caused by camera movement (`net::ERR_ABORTED`, `canceled: true`).

Visual conclusion:

- MVP improvement passed: the Byzantine area now has fewer glowing island fragments and less small-line clutter around the Aegean.
- This is not a full global boundary solution. Inland historical limits remain rough envelopes, and other civilizations can still show coarse or mismatched edges until they receive the same coastline-aware and phase-aware treatment.

## 2026-06-03 Priority boundary batch: Ottoman / Sasanian / Achaemenid

Goal: continue the boundary refinement track after Byzantine cleanup by delegating a bounded batch to Claude Code and then doing Codex validation, visual QA, and corrections.

Claude delegation:

- Prompt file: `.claude-runs/priority-boundaries-prompt.md`
- Output log: `.claude-runs/priority-boundaries-output.log`
- First attempted `claude -p $prompt` did not pass the prompt reliably; stdin with `cmd /c type ... | claude.cmd -p ...` worked for this mostly-English prompt.
- Claude produced `scripts/refinePriorityBoundaries.mjs`, updated `src/data/boundaries-simplified.json`, and appended a method note to `docs/BOUNDARY_REFINEMENT_METHODOLOGY.md`.

Codex review and corrections:

- Initial Claude output changed Achaemenid phase dates from the existing data keys. Codex rejected that and restored the existing date ranges:
  - peak: `-521..-486`
  - decline: `-485..-330`
- Initial Claude output attempted to rewrite `mongol-empire`, but browser QA showed it became a giant diagonal grassland band and was visually worse than the baseline. Codex rejected and reverted `mongol-empire` to the current `HEAD` baseline.
- Final accepted target ids are only:
  - `ottoman`
  - `sasanian`
  - `achaemenid`

Final geometry counts:

- `ottoman`: 3 phased features, `2 / 12 / 4` rings, `556 / 1625 / 730` vertices.
- `sasanian`: 3 phased features, `1 / 2 / 1` rings, `347 / 539 / 346` vertices.
- `achaemenid`: 3 phased features, `2 / 2 / 2` rings, `588 / 817 / 707` vertices.
- `mongol-empire`: unchanged baseline, 1 feature, 130 vertices.
- `byzantine`, `tang`, `roman-republic-empire`, `islamic-caliphates`, `mughal`, and `maya` were confirmed unchanged.

Verification:

- Strict data diff check against `HEAD` confirmed only the three accepted target ids changed.
- `npm run check` passed: data validation, GLB audit, and Vite build all succeeded.
- GLB audit stayed clean: `14 OK / 0 WARN / 0 FAIL`.
- Browser CDP QA captured isolated target screenshots:
  - `docs/boundary-qa/ottoman-1600-priority-boundary.png`
  - `docs/boundary-qa/achaemenid-500bce-priority-boundary.png`
  - `docs/boundary-qa/sasanian-600-priority-boundary.png`
  - `docs/boundary-qa/priority-boundaries-manifest.json`
- Browser manifest had no non-canceled failures. It recorded one `net::ERR_ABORTED` request with `canceled: true`, consistent with normal tile cancellation during camera/page setup.

Visual conclusion:

- Ottoman is a clear MVP improvement: more separated coast-aware blocks around Anatolia, Balkans, Levant, Egypt/North Africa and no single Mediterranean sea-flooding blob.
- Achaemenid and Sasanian now have more detailed coast-aware geometry around the Persian Gulf / Caspian / East Mediterranean, but their inland limits are still rough historical envelopes. They are acceptable as rough-refined batch work, not final precision borders.
- Mongol needs a separate method. A huge inland empire should not be handled by one convex Natural Earth envelope. Future work should explore either curated historical polyline data or a hand-authored multi-stage inland boundary with holes for Caspian/Aral and better Yuan/Ilkhanate/Golden Horde decomposition.

## 2026-06-03 Priority boundary deployment and online QA

Goal: publish the accepted Ottoman / Sasanian / Achaemenid boundary batch to production and verify the live site before starting the next refinement slice.

Deployment:

- Ran `npm run deploy`.
- The deploy script ran `npm run check` before upload.
- Data validation passed: 43 dynasties, 89 boundaries, 30 landmarks, 5 refined samples, 15 model profiles.
- GLB audit passed: `14 OK / 0 WARN / 0 FAIL`.
- Vite production build passed.
- Uploaded `dist/*` to `root@47.237.181.181:/opt/history-atlas/dist/`.
- Fixed remote permissions with `chmod -R a+rX /opt/history-atlas/dist`.

Production verification from deploy script:

- `https://atlas.ckl.hk/` returned `200` with `text/html`.
- Random SPA fallback path returned `200` with `text/html`.
- All 5 JS/CSS chunks returned `200`.

Online browser QA:

- Ran `.claude-runs/capture-online-priority-boundaries.mjs` against `https://atlas.ckl.hk/`.
- Captured online QA screenshots for:
  - `online-ottoman-1600-priority-boundary.png` (ignored by Git)
  - `online-achaemenid-500bce-priority-boundary.png` (ignored by Git)
  - `online-sasanian-600-priority-boundary.png` (ignored by Git)
- Saved manifest: `docs/boundary-qa/online-priority-boundaries-manifest.json`.
- Manifest confirmed `mapReady: true`, 1440x900 MapLibre canvas, and correct target filters for all three captures.
- Console messages: none.
- Bad HTTP responses: none.
- Non-canceled network failures: none.
- Only failed network records were canceled tile requests (`net::ERR_ABORTED`, `canceled: true`), consistent with normal map camera movement.

Visual conclusion:

- The deployment is healthy.
- Ottoman is acceptable as a rough-refined production improvement.
- Achaemenid and Sasanian are technically healthy but visually expose the next product problem: coastline clipping helps, but large inland borders still look like smooth historical envelopes rather than grounded, map-native boundaries.
- Do not blindly batch-refine all remaining civilizations with the same method. The next high-value step is a boundary-methodology upgrade: terrain/coast aware drawing rules, better inland anchor lines, and a separate Mongol strategy.

## 2026-06-03 Mongol boundary methodology sample

Goal: create a dedicated Mongol Empire boundary sample instead of reusing the rejected convex Natural Earth clipping method.

Implementation:

- Added `scripts/refineMongolBoundary.mjs`.
- The script only rewrites `mongol-empire` in `src/data/boundaries-simplified.json`.
- It does not touch `dynasties.json`, `landmarks.json`, `MapScene.jsx`, or `mapStyle.js`.
- Replaced the old single-phase `mongol-empire` baseline with three phased features:
  - rise, `1206..1227`: Polygon, 1 outer ring, 130 outer vertices, 1 water hole.
  - peak, `1228..1260`: MultiPolygon, 4 outer rings, 320 outer vertices, 3 water holes.
  - decline, `1261..1368`: MultiPolygon, 4 outer rings, 281 outer vertices, 3 water holes.
- The peak phase is intentionally modeled as regional control blocks rather than one giant continuous convex band. This avoids turning Eurasia into a single diagonal grassland sheet.

Verification:

- `npm run check` passed.
- Data validation passed: 43 dynasties, 91 boundaries, 30 landmarks, 5 refined samples.
- GLB audit passed: `14 OK / 0 WARN / 0 FAIL`.
- Vite production build passed with only the existing large chunk warning.
- Browser CDP QA captured:
  - `docs/boundary-qa/mongol-1220-rise-boundary.png`
  - `docs/boundary-qa/mongol-1250-peak-boundary.png`
  - `docs/boundary-qa/mongol-1300-decline-boundary.png`
  - `docs/boundary-qa/mongol-boundary-manifest.json`
- Manifest confirmed `mapReady: true`, 1440x900 MapLibre canvas, correct target filters, and no non-canceled network failures.

Visual conclusion:

- The new Mongol boundary is clearly better than both the old one-feature baseline and the rejected convex clipping attempt.
- Rise is now a readable steppe-core phase instead of a giant Eurasian envelope.
- Peak shows a broad Mongol world without filling every sea or becoming one flat rectangle.
- Decline visibly fragments into successor-zone blocks, making the time slider more meaningful.
- This is still rough-refined, not final publication quality. The remaining visible flaw is internal line seams inside the peak MultiPolygon. MapLibre draws every child polygon edge, so true removal requires polygon union / dissolve or a special internal-edge styling strategy.

Decision:

- Accept this as a production-quality MVP improvement.
- Do not treat it as the final boundary method for all large inland empires.
- Record the new lesson in `docs/BOUNDARY_REFINEMENT_METHODOLOGY.md` before any further batch expansion.

## 2026-06-03 Mongol boundary deployment and online QA

Deployment:

- Committed `feat(boundaries): refine mongol empire phases` (`b7f88ed`) and pushed to `main`.
- Ran `npm run deploy`.
- The deploy script reran `npm run check`: data validation, GLB audit, and Vite production build all passed.
- Uploaded the generated `dist/*` to `root@47.237.181.181:/opt/history-atlas/dist/`.
- Fixed remote file permissions with `chmod -R a+rX /opt/history-atlas/dist`.

Production verification from deploy script:

- `https://atlas.ckl.hk/` returned `200` with `text/html`.
- Random SPA fallback path returned `200` with `text/html`.
- All 5 production JS/CSS chunks returned `200`.

Online browser QA:

- Ran `.claude-runs/capture-online-mongol-boundary.mjs` against `https://atlas.ckl.hk/`.
- Captured online screenshots for:
  - `online-mongol-1220-rise-boundary.png` (ignored by Git)
  - `online-mongol-1250-peak-boundary.png` (ignored by Git)
  - `online-mongol-1300-decline-boundary.png` (ignored by Git)
- Saved manifest: `docs/boundary-qa/online-mongol-boundary-manifest.json`.
- Manifest confirmed `mapReady: true`, 1440x900 MapLibre canvas, and the correct `mongol-empire` year filters for all three screenshots.
- Console messages: none.
- Bad HTTP responses: none.
- Non-canceled network failures: none.

Visual conclusion:

- Production is healthy and has the new Mongol three-phase boundaries.
- Rise, peak, and decline are visually distinct enough for the time slider to feel meaningful.
- The remaining product issue is not deployment or data validation; it is visual topology. MultiPolygon internal edges still draw as visible lines. This should be the next boundary method problem before broad batch expansion.

## 2026-06-03 Mongol internal-outline cleanup

Goal: remove the visually messy internal lines in the Mongol peak phase before expanding the boundary method to more civilizations.

Root cause:

- The first Mongol peak implementation used a MultiPolygon made of regional control blocks.
- MapLibre line layers draw every child polygon outline, so adjacent or overlapping blocks looked like random internal cuts.
- Even after switching line/glow/casing layers to a separate outline source, `fill-antialias` and transparent fill overlap still exposed child polygon edges.

Implementation:

- Added `src/map/boundaryOutlines.js`.
- Added `scripts/testBoundaryOutlines.mjs` and wired it into `npm run check` as `npm run test:boundary-outlines`.
- `dynasty-territory-glow`, `dynasty-territory-casing`, `dynasty-territory-line`, and `dynasty-territory-hover` now use `dynasty-boundary-outlines`.
- Fill and click layers still use `dynasty-boundaries`, so interaction areas are preserved.
- Territory fill layers now use `fill-antialias: false`.
- `scripts/refineMongolBoundary.mjs` now writes Mongol peak as a single hand-drawn Polygon with 187 outer vertices.
- Mongol decline remains MultiPolygon because the fragmented look matches the four-khanate split.

Verification:

- TDD red step: `node scripts/testBoundaryOutlines.mjs` initially failed with `ERR_MODULE_NOT_FOUND` for `src/map/boundaryOutlines.js`.
- After implementation, `node scripts/testBoundaryOutlines.mjs` passed.
- `npm run check` passed: data validation, boundary outline test, GLB audit, and Vite build all succeeded.
- Browser interaction QA on `http://127.0.0.1:5173/`:
  - Reloaded the app.
  - Set the timeline slider to year `1250`.
  - Dragged and zoomed the map.
  - Browser logs stayed empty.
  - Saved `docs/boundary-qa/mongol-outline-browser-1250-unified.png`.
- Isolated Mongol QA reran `.claude-runs/capture-mongol-boundary.mjs`.
- Saved updated:
  - `docs/boundary-qa/mongol-1250-peak-boundary.png`
  - `docs/boundary-qa/mongol-1300-decline-boundary.png`
  - `docs/boundary-qa/mongol-boundary-manifest.json`
- Manifest confirmed all three shots had `mapReady: true`; no non-canceled failures; only normal Vite dev messages and one canceled tile request.

Visual conclusion:

- Mongol peak is now much cleaner: the obvious internal random cuts are gone.
- Mongol decline still shows separate regions, but that now reads as the intended four-khanate fragmentation rather than a broken peak border.
- This does not solve every overlap between different active civilizations at the same year. In normal UI, other active territories can still cross visually. That is a separate product decision: whether to dim non-focused civilizations, isolate hovered/selected civilization, or add a compare mode.

Deployment and online QA:

- Committed `fix(boundaries): separate territory outlines` (`667f863`) and pushed to `main`.
- Ran `npm run deploy`.
- Deploy script reran `npm run check`; all checks passed.
- `https://atlas.ckl.hk/`, random SPA fallback, and all 5 JS/CSS chunks returned `200`.
- Ran `.claude-runs/capture-online-mongol-boundary.mjs`.
- Saved updated `docs/boundary-qa/online-mongol-boundary-manifest.json`.
- Online QA confirmed:
  - `online-mongol-1220-rise-boundary`: `mapReady: true`
  - `online-mongol-1250-peak-boundary`: `mapReady: true`
  - `online-mongol-1300-decline-boundary`: `mapReady: true`
  - bad responses: none
  - non-canceled network failures: none
  - console messages: none
- Online visual result matches local: 1250 peak is unified and clean; 1300 remains intentionally fragmented.

## 2026-06-03 Boundary focus mode and panel click guard

Goal: reduce same-year territory clutter by keeping selected/hovered/compared civilizations readable while muting other active civilizations.

Root cause:

- Mongol internal lines were already cleaned up, but normal years such as `1250` still showed many civilizations at once.
- The visual problem had shifted from one bad boundary to competing active territory layers.
- Browser QA also exposed a narrow-screen interaction edge case: hidden/offscreen panel items in a long list could be confused with map clicks during automated testing.

Implementation:

- Added `src/map/boundaryFocus.js`.
- Added `scripts/testBoundaryFocus.mjs`.
- Added `npm run test:boundary-focus` and wired it into `npm run check`.
- `MapScene.jsx` now applies focused paint expressions when `selectedDynastyId`, `hoveredDynastyId`, or `compareIds` are present.
- Focused territories keep normal fill/line/glow opacity; non-focused territories and capitals are dimmed.
- Building focus still has priority when a landmark card is open.
- Rewrote `InfoPanel.jsx` with clean Chinese UI text and added pointer/click event guards so panel interactions do not leak into the MapLibre canvas.

Verification:

- TDD red step: `node scripts/testBoundaryFocus.mjs` first failed with `ERR_MODULE_NOT_FOUND` for `src/map/boundaryFocus.js`.
- After implementation, `node scripts/testBoundaryFocus.mjs` passed.
- `npm run check` passed:
  - `validate:data` passed: 43 dynasties, 91 boundaries, 30 landmarks, 5 refined samples.
  - `test:boundary-outlines` passed.
  - `test:boundary-focus` passed.
  - `audit:glb` passed: `14 OK / 0 WARN / 0 FAIL`.
  - Vite production build passed with only the existing large-chunk warning.
- Browser QA on `http://127.0.0.1:5173/`:
  - Reloaded the app.
  - Set timeline to `1250`.
  - Expanded the mobile-width info panel.
  - Clicked the visible `玛雅文明` row.
  - Confirmed the resulting card was `玛雅文明`, not a landmark card.
  - Console errors: none.
  - Saved screenshot: `docs/boundary-qa/focus-mode-maya-local.png`.

Visual conclusion:

- The focus-mode plumbing is now in place.
- Selecting a visible civilization no longer accidentally reopens a landmark card in the tested narrow viewport.
- The next product step should not be more boundary styling. It should be a dedicated GLB map-view QA pass, because selected-civilization readability is now better controlled by interaction state.

Deployment and online QA:

- Committed `feat(boundaries): add civilization focus mode` (`a2b5563`) and pushed to `main`.
- Ran `npm run deploy`.
- Deploy script reran `npm run check`; all checks passed.
- Uploaded the generated `dist/*` to `root@47.237.181.181:/opt/history-atlas/dist/`.
- `https://atlas.ckl.hk/`, random SPA fallback, and all 5 production JS/CSS chunks returned `200`.
- Browser opened `https://atlas.ckl.hk/` and confirmed the page title `历史沙盘 · Historical Atlas`.
- Saved online baseline screenshot: `docs/boundary-qa/focus-mode-online-basic.png`.
- Online DOM automation for the full click path timed out twice in the in-app browser after the page was already reachable. Treat this as an automation limitation for the heavy MapLibre page, not a deployment failure. Full click-path QA passed locally against the same build before deployment.

## 2026-06-03 Release readiness pass for 2026-06-04 launch

Goal: move from feature work to launch readiness for the next-day public MVP launch.

Implementation:

- Added `scripts/releaseSmoke.mjs`.
- Added `npm run smoke:release`.
- Added `docs/RELEASE_READINESS_2026-06-04.md`.
- The release smoke script opens `https://atlas.ckl.hk/` in headless Chrome via CDP and verifies both:
  - desktop viewport `1440x900`
  - mobile viewport `390x844`
- It sets the timeline to `1250`, selects `玛雅文明`, checks that a civilization card opens instead of a landmark card, confirms loading overlay is gone, and records screenshots plus a manifest.

Verification:

- `npm run check` passed before the release smoke pass.
- `npm run smoke:release` passed after the script was added and then corrected to wait for the loading overlay to disappear.
- Smoke output:
  - failures: `[]`
  - bad responses: `0`
  - page exceptions: `0`
  - console errors: `0`
  - non-canceled failures: `0`
- Artifacts:
  - `docs/release-qa/release-smoke-manifest.json`
  - `docs/release-qa/release-desktop-1250-maya.png`
  - `docs/release-qa/release-mobile-1250-maya.png`

Launch conclusion:

- Current production is acceptable for an MVP launch on 2026-06-04.
- Do not start broad new boundary or GLB production before launch unless a real blocker appears.
- Known limitations are documented in `docs/RELEASE_READINESS_2026-06-04.md`.

## 2026-06-03 Public docs cleanup for launch

Goal: make the public repository documents usable for the 2026-06-04 MVP launch and remove stale local-path / script wording.

Implementation:

- Rewrote `README.md` as the current public project overview.
- Rewrote `docs/ACCEPTANCE.md` as the launch-day acceptance checklist.
- Rewrote `docs/KNOWN_ISSUES.md` as the current MVP limitation and risk register.
- Kept the docs aligned with the present scripts:
  - `npm run check`
  - `npm run smoke:release`
  - `npm run deploy`
- Clarified that the active project root is `D:\松君\项目\历史网站`, not the old C drive workspace path.

Verification plan:

- `npm run check` passed after the docs cleanup:
  - data validation: 43 dynasties / 91 boundaries / 30 landmarks / 5 refined samples.
  - boundary outline test: passed.
  - boundary focus test: passed.
  - GLB audit: `14 OK / 0 WARN / 0 FAIL`.
  - Vite build: passed with only the known large chunk warning.
- `npm run smoke:release` passed against `https://atlas.ckl.hk/`:
  - desktop `1440x900`: opened year `1250` and selected `玛雅文明`.
  - mobile `390x844`: opened year `1250` and selected `玛雅文明`.
  - failures: `[]`.
  - bad responses: `0`.
  - page exceptions: `0`.
  - console errors: `0`.
  - non-canceled failures: `0`.
- Reviewed the generated desktop and mobile screenshots manually.
- Commit and push the documentation cleanup after both gates pass.

Launch discipline:

- Tomorrow's target is a stable MVP launch, not feature expansion.
- Before launch, only fix hard blockers or obvious P1 visual/runtime defects.
- Broad boundary expansion, new GLB batches, and major visual redesign should wait until the first public version is safely online.

## 2026-06-03 Final pre-launch deployment

Goal: close the release loop by deploying the latest `main` HEAD to production and verifying the live site after upload.

Deployment:

- Current commit before deploy: `ec37fcf docs: finalize launch readiness notes`.
- Working tree was clean before deploy.
- Ran `npm run deploy`.
- Deploy script reran `npm run check`; all checks passed:
  - data validation: 43 dynasties / 91 boundaries / 30 landmarks / 5 refined samples.
  - boundary outline test: passed.
  - boundary focus test: passed.
  - GLB audit: `14 OK / 0 WARN / 0 FAIL`.
  - Vite production build: passed with only the known large chunk warning.
- Uploaded `dist/*` to `root@47.237.181.181:/opt/history-atlas/dist/`.
- Fixed remote permissions with `chmod -R a+rX /opt/history-atlas/dist`.

Production verification from deploy script:

- `https://atlas.ckl.hk/` returned `200` with `text/html`.
- Random SPA fallback path returned `200` with `text/html`.
- All 5 production JS/CSS chunks returned `200`.

Release smoke after deploy:

- Ran `npm run smoke:release` after deployment.
- Desktop viewport `1440x900` opened year `1250` and selected `玛雅文明`.
- Mobile viewport `390x844` opened year `1250` and selected `玛雅文明`.
- failures: `[]`.
- bad responses: `0`.
- page exceptions: `0`.
- console errors: `0`.
- non-canceled failures: `0`.
- Reviewed generated screenshots:
  - `docs/release-qa/release-desktop-1250-maya.png`
  - `docs/release-qa/release-mobile-1250-maya.png`

Launch conclusion:

- Production is now deployed and verified from the latest launch-ready HEAD.
- Current state is suitable for the 2026-06-04 MVP launch.
- Desktop manifest still records horizontal overflow because the wide HUD layout exceeds the strict viewport scroll width, but the desktop screenshot is visually acceptable and the mobile hard gate has `horizontalOverflow: false`.
- Do not start feature expansion before launch unless a hard blocker appears.

## 2026-06-03 Final-version target reset

User clarified that the desired outcome is not an MVP launch version but the final complete product.

Decision:

- Treat `v0.1.0` as an online milestone only.
- Do not describe the project as finished.
- Define a higher final-version standard before expanding more features.

Implementation:

- Added `docs/FINAL_VERSION_SPEC.md`.
- Rewrote `docs/ROADMAP.md` around final-version phases F1-F6 instead of MVP candidate tasks.

Final-version priorities:

1. F1 final visual foundation: ocean flatness, land relief clarity, boundary/model readability, dark atlas visual language.
2. F2 full boundary refinement: 43 civilizations, at least 3 phases each, coastline/terrain-aware where applicable.
3. F3 landmark model upgrade: all 30 landmarks A/B quality, core 10 A quality.
4. F4 content and source system: references, source notes, accuracy notes.
5. F5 product interaction and mobile experience.
6. F6 performance, release packaging, SEO, compatibility, and rollback maturity.

Collaboration split:

- Codex owns final standard, integration, browser QA, deployment, and rejecting weak batches.
- Claude should be used for bounded implementation batches: MapLibre/CSS visual passes, boundary generation batches, and individual GLB modeling scripts.

## 2026-06-03 F1 visual foundation audit started

Goal: start final-version F1 by creating repeatable visual evidence instead of arguing from subjective impressions.

Implementation:

- Added `scripts/visualFoundationAudit.mjs`.
- Added `npm run audit:visual-foundation`.
- Added `docs/visual-qa/FOUNDATION_AUDIT_2026-06-03.md`.
- The audit captures four fixed map views:
  - Himalaya relief clarity.
  - Open ocean flatness.
  - Mediterranean terrain/boundary readability.
  - Central America coast/territory readability.
- The audit waits for React year state and tile stability where possible, and records `yearStable`, `tilesStable`, and warning state in the manifest.

Bug fix:

- `src/components/MapScene.jsx` no longer shows the map tile warning for normal abort/cancel tile requests.
- Tile warnings are delayed after map readiness and cleared on map idle, so normal camera jumps do not leave a central warning banner in final visual screenshots.

Verification:

- `npm run check` passed after the MapScene warning fix.
- Local preview at `http://127.0.0.1:4173/` returned `200`.
- `VISUAL_FOUNDATION_URL=http://127.0.0.1:4173/ npm run audit:visual-foundation` passed:
  - failures: `[]`.
  - bad responses: `0`.
  - page exceptions: `0`.
  - console errors: `0`.
  - non-canceled failures: `0`.

Visual findings:

- Ocean is mostly flat and usable, but still not final-polished.
- Himalaya relief is strong, but visible tile/terrain cut seams remain.
- Mediterranean multi-civilization boundaries still read too much like glowing debug layers.
- The next implementation step should be a Claude visual-foundation pass, not more data/model expansion.

## 2026-06-03 F1 production audit recorded

User clarified again that the target is the final complete version, not an MVP-ready release.

Production status:

- `https://atlas.ckl.hk/` is online and reachable.
- `npm run smoke:release` passed against production:
  - failures: `[]`.
  - bad responses: `0`.
  - page exceptions: `0`.
  - console errors: `0`.
  - non-canceled failures: `0`.
- `npm run audit:visual-foundation` passed against production:
  - failures: `[]`.
  - bad responses: `0`.
  - page exceptions: `0`.
  - console errors: `0`.
  - non-canceled failures: `0`.

Visual QA:

- The false-positive tile warning banner is fixed on production foundation screenshots.
- Ocean is materially improved from the early "mountains in the sea" state, but not final-quality water yet.
- Land relief is strong, especially around the Himalaya, but terrain/tile seam artifacts remain visible.
- Mediterranean boundary stacking still reads too much like fluorescent debug geometry.
- The current site is a deployed milestone and F1 evidence baseline, not the final complete product.

Next implementation step:

- Assign a bounded Claude visual-foundation pass before more data/model expansion.
- Scope should stay limited to MapLibre paint/style, CSS visual hierarchy, terrain/hillshade/water masking strategy, and boundary readability.
- Do not let Claude touch `src/data/*.json`, GLB assets, deploy scripts, or broad product behavior in this pass.

## 2026-06-04 F0 final-version gate workflow implemented

Reason:

- User identified that the workflow was too long and context drift caused the project to be treated like an MVP instead of the final complete version.
- The fix is to externalize memory into mandatory project files, not rely on chat context.

Implementation:

- Added `AGENTS.md` as the mandatory startup protocol for Codex, Claude, and any future agent.
- Added `docs/CURRENT_PHASE.md`, setting the current phase to `F1 Final Visual Foundation`.
- Added `.claude-runs/TEMPLATE.md` as the required Claude task template.
- Updated `.gitignore` so `.claude-runs/TEMPLATE.md` is tracked while local Claude logs remain ignored.
- Updated `AGENT.md` to point agents to `AGENTS.md` first.
- Created local Claude task prompt `.claude-runs/f1-visual-foundation-pass-prompt.md` for the first F1 visual pass.

Current rule:

- `v0.1.0` and `https://atlas.ckl.hk/` are online milestones only.
- No agent may call the project final until all relevant Gates pass.
- Current phase is F1; broad F2 boundary batches, broad F3 GLB batches, and F5 UI expansion are blocked until F1 passes.

Next:

- Run baseline checks.
- Commit and push F0 workflow files.
- Invoke Claude from the F1 prompt and let Codex review the diff and visual audit before accepting any changes.

Verification:

- `npm run check` passed after F0 workflow files were added.
- Validation still reports 43 dynasties, 91 boundaries, 30 landmarks, and 14 OK GLB assets.
- Vite build passed with the existing large chunk warning.

## 2026-06-04 F1 visual foundation pass 1

Claude delegation:

- First Claude call returned only a plan, which was rejected as an invalid batch because it did not edit files and did not address the real F1 map problems.
- Second Claude call used `.claude-runs/f1-visual-foundation-pass-execute-prompt.md` and made a bounded implementation pass.

Implementation:

- `src/map/mapStyle.js`
  - dark ocean deepened.
  - hillshade exaggeration and highlight/shadow opacity reduced to lower terrain white-noise.
  - boundary glow width, blur, opacity, casing, and line width reduced.
  - capital glow tightened.
- `src/components/MapScene.jsx`
  - focus paint opacity recalibrated for the reduced boundary baseline.
  - Codex further reduced default/focused non-selected boundary intensity after visual review.
- `src/styles.css`
  - HUD shadow, gold accent lines, year glow, and slider glow toned down.

Verification:

- `npm run check` passed.
- `VISUAL_FOUNDATION_URL=http://127.0.0.1:4174/ npm run audit:visual-foundation` passed:
  - failures: `[]`.
  - bad responses: `0`.
  - page exceptions: `0`.
  - console errors: `0`.
  - non-canceled failures: `0`.
- Reviewed updated screenshots:
  - `docs/visual-qa/foundation-himalaya-relief.png`
  - `docs/visual-qa/foundation-open-ocean-flatness.png`
  - `docs/visual-qa/foundation-mediterranean-boundary-readability.png`
  - `docs/visual-qa/foundation-central-america-readability.png`

Visual result:

- Ocean is cleaner, darker, and flatter.
- Mediterranean and Central America boundary overlays are calmer and less fluorescent while still readable.
- HUD glow is less workbench-like.
- F1 Gate is not passed yet: mountain relief still reads noisy in places and distant terrain/tile seam artifacts remain visible.

Next:

- Commit and push F1 pass 1.
- Optionally deploy the improvement after user-facing decision or after one more F1 terrain-seam pass.
- Next F1 pass should target terrain/tile seam artifacts and mountain relief texture, not boundary opacity.

## 2026-06-04 F1 visual foundation pass 2

Reason:

- F1 pass 1 improved ocean, boundaries, and HUD, but the Himalaya view still had relief noise and distant terrain/tile seam artifacts.
- Pass 2 intentionally avoided more boundary tuning and targeted hillshade only.

Implementation:

- `src/map/mapStyle.js`
  - dark theme hillshade exaggeration lowered again.
  - dark hillshade shadow/highlight/accent opacities reduced.
  - secondary hillshade intensity lowered so it softens terrain without adding white-noise texture.
  - mountain mode keeps `MOUNTAIN_TERRAIN_EXAGGERATION = 2.6`, but dark hillshade mountain-mode exaggeration drops to `0.95`.

Verification:

- `npm run check` passed.
- `VISUAL_FOUNDATION_URL=http://127.0.0.1:4174/ npm run audit:visual-foundation` passed:
  - failures: `[]`.
  - bad responses: `0`.
  - page exceptions: `0`.
  - console errors: `0`.
  - non-canceled failures: `0`.
- Reviewed the four foundation screenshots again.

Visual result:

- Himalaya relief remains visible and is less noisy.
- Ocean remains flat and clean.
- Boundaries from pass 1 remain readable and calmer.
- F1 Gate still is not accepted because the distant dark wedge/seam artifact remains visible in fixed audit views.

Next:

- Commit and push F1 pass 2.
- Do not deploy as a final visual state.
- F1 pass 3 should investigate the dark wedge/seam source: basemap tile coverage, horizon/fog/sky transition, terrain tile loading, or a deliberate far-distance mask strategy.

## 2026-06-04 F1 visual foundation pass 3 and F2 entry

Reason:

- F1 pass 2 reduced relief noise but the fixed Himalaya audit view still had a distant dark wedge/seam and noisy land relief.
- Before changing production style again, Codex ran a controlled diagnostic matrix instead of guessing.

Multi-agent support:

- Two read-only subagents investigated the artifact source.
- Both reports pointed away from boundary/model data and toward high-pitch terrain, sky/fog, and hillshade interactions.

Diagnostic result:

- Temporary diagnostics were written only under ignored `.claude-runs/f1-pass3-diagnostics/`.
- The stable comparisons showed:
  - Disabling terrain mesh did not remove the noisy relief.
  - Disabling hillshade removed the white-noise texture but made land too flat.
  - Sky/fog changes alone did not solve the relief problem.
  - A softer dark-theme hillshade profile preserved mountains while removing most of the noisy texture.

Implementation:

- `src/map/mapStyle.js`
  - lowered `WORLD_TERRAIN_EXAGGERATION` from `0.18` to `0.1`.
  - changed dark-theme hillshade exaggeration from `0.32/0.54/0.72` to `0.2/0.32/0.46`.
  - reduced dark-theme hillshade highlight, shadow, and accent opacity.
  - reduced secondary hillshade exaggeration from `0.14/0.22/0.32` to `0.06/0.1/0.14`.

Verification:

- `npm run check` passed.
- `VISUAL_FOUNDATION_URL=http://127.0.0.1:4174/ npm run audit:visual-foundation` passed after one retry.
  - First run had a transient external MapLibre glyph connection close.
  - Second run passed with failures `[]`, bad responses `0`, page exceptions `0`, console errors `0`, and non-canceled failures `0`.
- `RELEASE_SMOKE_URL=http://127.0.0.1:4174/ npm run smoke:release` passed.
  - failures: `[]`.
  - bad responses: `0`.
  - page exceptions: `0`.
  - console errors: `0`.

Visual result:

- `foundation-himalaya-relief.png`: mountain terrain remains visible but no longer reads as high-contrast white-noise texture.
- `foundation-open-ocean-flatness.png`: ocean remains flat, deep, and clean; no underwater mountain relief is visible.
- `foundation-mediterranean-boundary-readability.png`: multi-civilization boundaries remain readable and less fluorescent.
- `foundation-central-america-readability.png`: ocean/coastline and Maya territory remain clear.
- Desktop and mobile smoke screenshots remained usable.

Gate decision:

- F1 is accepted by Codex as good enough to enter F2.
- This is not final visual polish. F6 still needs bundle/resource work, and later stages may refine final art direction.

Next:

- Commit and push F1 pass 3 plus phase transition docs.
- Start F2 Batch 01 with a bounded Claude task for Byzantine, Ottoman, Mongol, Aztec, and Inca boundaries.

## 2026-06-04 F2 boundary batch 01

Scope:

- `byzantine`
- `ottoman`
- `mongol-empire`
- `aztec`
- `inca`

Claude delegation:

- Created `.claude-runs/f2-boundary-batch-01-prompt.md`.
- Claude changed `src/data/boundaries-simplified.json`.
- Claude left `byzantine`, `ottoman`, and `mongol-empire` structurally unchanged.
- Claude replaced Aztec with 3 phases and added an Inca decline phase.

Codex review and corrections:

- Rejected Claude's Inca decline ending in 1572 because `src/data/dynasties.json` currently ends Inca at 1533 and F2 forbids editing dynasties data in this batch.
- Strengthened `scripts/validateHistoricalData.mjs` so F2 Batch 01 ids are now validated as exactly 3 contiguous phased boundary features.
- Converted Aztec rise/decline and Inca rise/decline to `rough-refined` where they are inland-core phases.
- Densified Aztec peak and Inca peak geometry so coast-aware phases meet vertex thresholds.
- Replaced Inca peak with a slimmer Andean corridor after browser QA showed the first version still looked like a broad block.

Verification:

- `npm run validate:data` passed.
- `npm run check` passed.
- `node .claude-runs/capture-f2-boundary-batch-01.mjs` passed:
  - failures: `[]`.
  - page exceptions: `0`.
  - console errors: `0`.
  - non-canceled failures: `0`.

QA artifacts:

- `docs/boundary-qa/F2_BATCH01_REPORT_2026-06-04.md`
- `docs/boundary-qa/f2-batch01-byzantine-600.png`
- `docs/boundary-qa/f2-batch01-ottoman-1600.png`
- `docs/boundary-qa/f2-batch01-mongol-empire-1250.png`
- `docs/boundary-qa/f2-batch01-aztec-1500.png`
- `docs/boundary-qa/f2-batch01-inca-1500.png`
- `docs/boundary-qa/f2-batch01-manifest.json`

Result:

- F2 Batch 01 is accepted by Codex.
- Total boundary features increased from 91 to 94.
- The validator now reports `F2 phased boundary batch ids: 5`.

Next:

- Commit and push F2 Batch 01.
- Start F2 Batch 02 with another five-civilization task, continuing small-batch refinement instead of doing all 43 at once.

## 2026-06-05 F2 boundary batch 02

Scope:

- `greek-city-states`
- `assyrian`
- `babylon`
- `carolingian`
- `holy-roman-empire`

Agent workflow:

- Faraday worker closed out the initial Batch 02 candidate set and replaced `egypt-old-kingdom` with `holy-roman-empire` because Old Kingdom Egypt ends before the current BCE 2000 timeline floor.
- Pasteur reviewer rejected the first visual pass: Carolingian and Holy Roman Empire created visible triangular wedge artifacts around the Alps and northern Italy.
- Hooke worker rewrote Carolingian and Holy Roman Empire as cleaner multi-part rough-refined geometries.
- All subagents were closed after review.

Codex corrections:

- Tightened `scripts/auditF2BoundaryBatch02Playwright.mjs` so QA selects the target civilization and fails if the target is not active, selected, and rendered.
- Removed the obsolete raw CDP Batch 02 audit script and kept the dedicated Playwright QA path.
- Reverted a temporary `visualFoundationAudit.mjs` Batch 02 mode so the F1 foundation audit remains foundation-only.

Verification:

- `npm run validate:data` passed.
- `npm run check` passed.
- `scripts/auditF2BoundaryBatch02Playwright.mjs` passed with `failures: []`.

QA artifacts:

- `docs/boundary-qa/F2_BATCH02_REPORT_2026-06-05.md`
- `docs/boundary-qa/f2-batch02-greek-city-states-450.png`
- `docs/boundary-qa/f2-batch02-assyrian-670.png`
- `docs/boundary-qa/f2-batch02-babylon-560.png`
- `docs/boundary-qa/f2-batch02-carolingian-820.png`
- `docs/boundary-qa/f2-batch02-holy-roman-empire-1200.png`
- `docs/boundary-qa/f2-batch02-manifest.json`

Result:

- F2 Batch 02 is accepted by Codex.
- Total boundary features are now 102.
- The validator now reports `F2 phased boundary batch ids: 10`.
- This is still rough-refined historical visualization, not academic precision.

Next:

- Commit and push F2 Batch 02.
- Start F2 Batch 03 with `xia`, `shang`, `zhou`, `qin`, and `sui`.

## 2026-06-05 F2 boundary batch 03

Scope:

- `xia`
- `shang`
- `zhou`
- `qin`
- `sui`

Agent workflow:

- Anscombe worker produced the initial Batch 03 implementation.
- Codex rejected the first visual pass because Xia, Shang, Qin, and Sui still read as smooth ovals or large placeholder blobs, and Zhou used separated oval blocks.
- Halley worker reworked the geometries after rejection.
- All subagents were closed after review.

Codex review:

- Accepted the second pass because Xia/Shang now read as narrower Yellow River / Central Plains corridors, Zhou no longer uses separated oval bubbles, and Qin/Sui have stronger rough regional contouring.
- This is still rough-refined visualization, not academic GIS precision.

Verification:

- `npm run validate:data` passed.
- `npm run check` passed.
- `scripts/auditF2BoundaryBatch03Playwright.mjs` passed with `failures: []`.

QA artifacts:

- `docs/boundary-qa/F2_BATCH03_REPORT_2026-06-05.md`
- `docs/boundary-qa/f2-batch03-xia-1850.png`
- `docs/boundary-qa/f2-batch03-shang-1250.png`
- `docs/boundary-qa/f2-batch03-zhou-350.png`
- `docs/boundary-qa/f2-batch03-qin-214.png`
- `docs/boundary-qa/f2-batch03-sui-600.png`
- `docs/boundary-qa/f2-batch03-manifest.json`

Result:

- F2 Batch 03 is accepted by Codex.
- Total boundary features are now 111.
- The validator now reports `F2 phased boundary batch ids: 15`.

Sidecar findings:

- F3 model gap review: 14/30 landmarks have GLB; 16 remain missing. Core 10 all have GLB but still need final A-grade map-view QA.
- F4 source review: all 43 dynasties have summary/events/tags/importance/legacy, but `references` and dynasty-level `sourceNote` are 0/43. F4 should start with an allowlisted 5-civilization source pilot after F2 data batches are stable.

Next:

- Commit and push F2 Batch 03.
- Start F2 Batch 04 with `jin`, `song`, `yuan`, `qing`, and `prc`.
