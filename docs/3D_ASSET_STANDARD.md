# 奇观 3D 资产标准（history-atlas）

本规范定义历史沙盘里「奇观 / 名胜建筑」3D 资产的统一制作标准。所有资产经可复用管线
`scripts/lib/wonderKit.mjs` 程序化生成 → 导出 GLB → 运行时由
`src/map/createBuildingLayer.js` 加载，替换程序化兜底体块。

> 设计原则：**程序化、参数化、零贴图、几何 100% 原创**。无第三方模型/贴图依赖，
> 无版权风险；体积小、draw call 可控；风格统一服从历史沙盘。

---

## 1. 命名与路径

| 项 | 规则 | 示例 |
| --- | --- | --- |
| 生成脚本 | `scripts/build<Name>Glb.mjs`（驼峰） | `buildParthenonGlb.mjs` |
| GLB 输出 | `public/models/<kebab-id>.glb` | `public/models/taj-mahal.glb` |
| 运行时路径 | `${BASE_URL}models/<file>.glb`（见 `ID_GLB_OVERRIDES`） | — |
| 接入键 | **必须等于 `landmarks.json` 中该名胜的 `id`** | `pyramid` → `great-pyramid.glb` |

注意：文件名可与 landmark `id` 不同（如 `pyramid` 用 `great-pyramid.glb`），但
`ID_GLB_OVERRIDES` / `ID_GLB_ORIENTATION_OVERRIDES` 的**键必须是 landmark `id`**，否则不生效。

---

## 2. 坐标轴 / 朝向

- 本地坐标系 **z = 上**（与程序化 builder 一致）。
- 模型 **正面朝 −x**（西），长轴一般沿 x。
- GLB 经 three 的 GLTFExporter/GLTFLoader 往返后，加载到 MapLibre 自定义图层需校正竖直轴：
  在 `ID_GLB_ORIENTATION_OVERRIDES` 中统一加 `GLB_ORIENT_ZUP = { x: -π/2 }`。
  **凡用 wonderKit 以 z-up 导出的资产都套用它，不要省略。**

---

## 3. 贴地标准

- 模型**最低点 z = 0**（base 贴地，不允许悬空，也不允许负 z 沉入地面）。
- 每个资产应有一块贴地的基面 / 台基 / 沙地（z 从 0 起）。
- 验收用脚本日志里的 `z a..b`：**a 必须 ≈ 0.00**。

---

## 4. 缩放标准

- 水平足迹（footprint）控制在约 **±0.7**（直径 ~1.4）。圆/椭圆类按长半轴 ≤ ~0.66。
- 高度按真实比例但收敛在 **0.6 ~ 1.5** 区间（塔类可到 ~1.5，神庙/金字塔更扁）。
- 统一足迹 → 运行时共用 `group.scale`（`sizeMeters`），**无需逐模型缩放覆写**。
  仅当某资产明显偏大/偏小时，才在 createBuildingLayer 做最小缩放修正。

---

## 5. GLB 体积 / 性能限制

| 指标 | 目标 | 硬上限 |
| --- | --- | --- |
| GLB 体积 | < 1.5 MB | ≤ 3 MB |
| 三角面 | 2k ~ 20k | ≤ ~35k |
| 材质数 | ≤ ~16（每材质 1 draw call） | — |
| 贴图 | **0 张**（纯顶点色） | 禁止引入大贴图 |

管线优化：按材质合并几何（每材质一个 mesh）+ 末尾 `mergeVertices` 合并重复顶点。
导出后用 GLB 头校验 `images=0 / textures=0`。

---

## 6. 材质 / 视觉风格

- 历史沙盘风：**石材米白、暖灰、砂岩、陶土、暗金点缀**；不过亮、不写实、低反光。
- `MeshStandardMaterial` + `vertexColors`：石材 `metalness 0 / roughness ~0.85+`；
  铅/穹顶 `roughness ~0.5`；金饰 `metalness ~0.5 / roughness ~0.4`（点缀用，勿大面积）。
- 顶点色 AO：底暗顶亮 + 朝下面压暗，制造体积层次（管线 `applyVertexAO` 自动叠加）。
- 低多边形但精致：**近景能看出结构层次，远景能识别轮廓**。

---

## 7. 验收 / 截图角度

1. 命令行：`node scripts/build<Name>Glb.mjs` → 看日志 `mats / parts / tris / z / KB`。
2. 资产审计：`npm run audit:glb` 无 FAIL；需要刷新基线表时运行 `npm run audit:glb -- --write`。
3. 数据与构建：`npm run validate:data` + `npm run build` 全过。
3. 浏览器实机（预览标签 RAF 冻结，须真实浏览器硬刷新）：
   - 推荐相机：`zoom 4~5`、`pitch ~55°`、缓慢环绕 `bearing`。
   - 截图角度：①正面平视（看主立面/柱廊/拱券）；②约 45° 俯瞰（看穹顶/屋顶/平台对称）；
     ③贴地低角（确认 base 贴地、无悬空）。
   - 截图存仓库根目录，命名 `<id>-qa.png`（如 `parthenon-qa.png`）。
4. 检查项：加载成功 / 站立贴地 / 无倒置 / 无明显穿模破面 / 控制台无报错。

---

## 8. 后续批量扩展规则

1. **先复用 wonderKit 原语**，不要每个模型从零手写重复 Three 几何：
   `box / boxRotZ / boxRotX / boxRotY / cyl(thetaStart) / coneUp / dome / latheDome /
   lathe / sphere / arcade / gable / hipRoof / stepPyramid(topHalf) / ellipseRing`。
   注：零贴图资产，导出管线统一剥除 uv，仅保留 position/normal（自定义无 uv 几何亦可混桶）。
   缺的形体先**沉淀为 wonderKit 原语**再用（利于下一个奇观复用）。
2. 新资产模板（照搬本批任一脚本）：定义 `COLORS` + `material(key)` → 用原语搭体量 →
   `await a.exportGlb(OUT, { colors, material, weld: true })`。
3. 接入两处映射（`createBuildingLayer.js`）：`ID_GLB_OVERRIDES`（路径）+
   `ID_GLB_ORIENTATION_OVERRIDES`（`GLB_ORIENT_ZUP`）。键 = landmark `id`。
4. 不改 `dynasties.json / boundaries-simplified.json / landmarks.json / MapScene.jsx /
   mapStyle.js`；createBuildingLayer 只允许最小的路径/姿态/缩放/材质接入修改。
5. 每批提交前跑 `validate:data` + `audit:glb` + `build`，并核对四项验收。
6. 批量节奏：先做代表类型样板验证标准，再成批扩展；单批控制数量，逐个日志核对体积/贴地。

---

## 9. 当前已实现资产

> 自动审计结果以 [GLB_ASSET_BASELINE.md](GLB_ASSET_BASELINE.md) 为准；本节用于解释造型意图。

| id | 文件 | 建模要点 | 体积 / 面数 |
| --- | --- | --- | --- |
| `hagia-sophia` | hagia-sophia.glb | 中央旋转面大穹顶 + 半穹 + 四尖塔 + 扶壁 + 侧廊单坡顶 | ~0.89 MB / ~19k |
| `parthenon` | parthenon.glb | 三级基座 + 8×17 满周柱列 + 三陇板中楣 + 三角山墙坡顶 + acroteria（精修） | ~0.40 MB / ~7.4k |
| `colosseum` | colosseum.glb | 椭圆多层连拱 + 部分坍塌立面（遗迹）+ 阶梯观众席 + 竞技场 | ~0.83 MB / ~9k |
| `tajmahal` | taj-mahal.glb | 八角主体 + 四面尖拱 iwan + 洋葱穹顶 + 四塔 + 四小亭 + 红砂岩侧翼 | ~0.44 MB / ~12k |
| `pyramid` | great-pyramid.glb | 主金字塔 + 两座小金字塔 + 王后小金字塔 + 祭庙基座，分层砌石带 | ~0.06 MB / ~0.9k |
| `great-wall` | great-wall.glb | 蜿蜒翻山城墙（夯土填方 + 砖墙 + 交错垛口）+ 三座敌楼 | ~0.13 MB / ~1.3k |
| `angkor-wat` | angkor-wat.glb | 护城河 + 台基岛 + 引道 + 回廊角楼 + 须弥台 + 梅花五塔（莲花苞顶） | ~0.13 MB / ~2.8k |
| `stonehenge` | stonehenge.glb | 外圈立石+楣石（部分残缺）+ 内马蹄三石塔 + 中央祭坛 + 草土堆 | ~0.06 MB / ~0.7k |
| `chichen-itza` | chichen-itza.glb | 九级截顶阶梯金字塔 + 正面大台阶（坡道/踏步/栏墙）+ 顶庙 + roof comb | ~0.04 MB / ~0.4k |
| `forbidden-city` | forbidden-city.glb | 须弥座（栏杆+御路）+ 周匝檐柱 + 斗栱带 + 棂格门窗 + 重檐庑殿顶（鸱吻/走兽）（精修） | ~0.20 MB / ~2.9k |
| `notre-dame` | notre-dame.glb | 中殿+侧廊高侧窗带 + 多道飞扶壁 + 双塔（钟层/角扶壁/尖塔）+ 国王廊 + 玫瑰窗棂 + 深券门 + flèche（精修） | ~0.24 MB / ~3.5k |
| `borobudur` | borobudur.glb | 五层方形曼陀罗台基（佛龛）+ 三层圆台 + 同心环列钟形舍利塔 + 中央大塔 | ~0.61 MB / ~18.6k |
| `petra` | petra.glb | 崖体凹龛（峡壁/岩檐前凸制造进深）+ 凸出两层立面：下层柱廊+断山花、上层圆亭 tholos+两翼（精修，去竖板感） | ~0.11 MB / ~1.8k |
| `red-fort` | red-fort.glb | 红砂岩雉堞城墙 + 四角棱堡 + 拉合尔门（双塔+chhatri 群）+ 内庭白大理石殿亭（替换旧红色兜底块） | ~0.43 MB / ~13.2k |
