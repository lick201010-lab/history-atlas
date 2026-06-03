# 边界精修方法论 · Boundary Refinement Methodology

> **目标读者**：未来给剩余 38 个非样板文明（或新文明）做"海岸贴合"边界的人 — 包括人和 LLM。
>
> **目标效果**：照着这份文档走，第一次跑就出对的结果，**不再 trial-and-error**。

---

## 0. 一句话流程

```
为每个 (civId, phase) 写一段凸包络 → 生成器跑一次 → npm run check → 浏览器验收
```

不要跳步、不要省检查。跳步的代价见 [§9 历史教训](#9-历史教训跳过过哪些前提踩过哪些坑)。

---

## 1. 前置条件 checklist（写代码前先打勾）

- [ ] **目标 civ 是否在 `src/data/dynasties.json` 里？** 没有就先加 dynasty 条目（id / name / nameEn / startYear / endYear / capital / color），生成器只生成 boundary，不会自动建 dynasty。
- [ ] **目标 civ 是否需要分 3 phase？** 样板必须 `rise / peak / decline` 三段；非样板可以一段。
- [ ] **当前网络能否拉 jsdelivr？** 生成器依赖 `cdn.jsdelivr.net/gh/martynafford/natural-earth-geojson@master/50m/physical/ne_50m_land.json`。第一次拉完会缓存到 `scripts/.cache/`，之后离线也行。
- [ ] **是否打算改 MapScene？** 默认不要。新 accuracy 值如果不在 MapScene 的 `ifRefined` 表达式里，描边会变暗。当前接受 `rough-refined` 和 `coastline-aware-rough`，要加第三种需同步改 `src/components/MapScene.jsx`。

---

## 2. 数据 schema（生成器输出格式）

每个样板 feature：

```jsonc
{
  "type": "Feature",
  "id": "tang",                      // dynasty id
  "properties": {
    "id": "tang",
    "dynasty": "唐朝",                // 中文显示名
    "phase": "peak",                  // rise / peak / decline
    "phaseLabel": "盛唐 · 安西诸镇",   // 中文 phase 显示名
    "startYear": 661,
    "endYear": 755,
    "color": "#e67e22",
    "capital": "长安",
    "summary": "武周、玄宗治下安西四镇...",  // 1–2 句历史描述
    "accuracy": "coastline-aware-rough",   // 必须是这个值
    "accuracyLabel": "海岸贴合粗多边形",
    "accuracyNote": "沿海部分由 Natural Earth 50m 海岸线裁剪...",
    "sourceNote": "使用 Natural Earth 50m land 数据与人工绘制的历史势力包络..."
  },
  "geometry": {
    "type": "MultiPolygon",           // 或 "Polygon"，跨海一定用 MultiPolygon
    "coordinates": [[[ [lng, lat], ... ]], ...]
  }
}
```

### 顶点数硬要求（validator 卡）

| geometry.type | 最小顶点（含闭合点）|
|---|---|
| Polygon | **≥ 40** |
| MultiPolygon（外环总和）| **≥ 80** |

不够会被 `npm run validate:data` 报错。生成器自带"达不到就自动密集化"的兜底（见 §5 步骤 3），通常不用手工干预。

### 非样板 feature 的字段

不需要 `phase / phaseLabel / sourceNote`；`accuracy` 可以是 `rough`（旧矩形）或 `rough-refined`（旧人工凸多边形）。本方法论也可以用于把它们升级成 `coastline-aware-rough`，只是不强制三段。

---

## 3. 凸包络（envelope）怎么画

**envelope 是你给生成器的唯一手动输入**，决定边界的最终形状。

### 3.1 设计原则

| 原则 | 解释 |
|---|---|
| **凸** | Sutherland-Hodgman 要求 clip 多边形必须凸。生成器会自动 `convexHull()` 包一层，但你写得越接近凸，convex hull 损失的细节越少 |
| **CCW** | 生成器自动 normalize 为 CCW（shoelace 检测）。不用人工保证 |
| **必须越过海岸线** | envelope 必须**包住**你想保留的陆地 + **延伸进海洋**，让 clip 沿海岸线切。envelope 在内陆切的地方就是边界的内陆边 |
| **不要太松** | envelope 越大，clipping 会把更多陆地（含其他大陆/岛屿）带进来，可能产生意外的远地碎片 |
| **顶点稀疏 OK** | envelope 6–14 个顶点足够；生成器会沿边按 1.5° 步长自动密集化 |

### 3.2 实际例子（看图说话）

**罗马 peak**（围绕地中海）：

```
                ●(-12,52)               ●(-4,58)
            ●(-14,38)                          ●(16,55)
                                                       ●(30,50)
                                                            ●(42,46)
                                                                ●(50,40)
                                                                ●(50,32)
                                                            ●(42,28)
                                                       ●(32,24)
                                                  ●(22,26)
                                            ●(10,26)
                                       ●(-3,28)
                                  ●(-10,22)
```

包络外沿伸进大西洋（西边）、撒哈拉沙漠（南边）、波斯北边（东边）、北海（北边）。**它故意越过海岸线** — 让 Natural Earth land 的 clipping 沿真正的海岸走。

**唐 peak** 同理 — 西边伸进塔克拉玛干 / 西伯利亚，东边收紧到 127°E（**不**到 130°E，避免圈住日本九州）。

### 3.3 envelope 常见错误

| 错误 | 现象 | 排查 |
|---|---|---|
| 东 / 西边太远 | 包住了不该有的岛 / 大陆（如唐圈了日本，罗马圈了乌克兰） | 对照维基地图核对该 phase 的最远控制点 |
| 在某个顶点凹进去 | 生成器的 convex hull 自动包成凸，**损失你画的那个凹细节** | 如果你的"凹"是有意义的，要拆成两个 envelope 分别 clip 后 union（当前生成器不支持，需扩展） |
| 完全在内陆 | clipping 完全没有海岸线 → 输出几乎就是 envelope 本身 | OK，自动密集化兜底，不影响过校验。但视觉上看不出"海岸贴合" |
| 顶点序写成 CW | 生成器自动 reverse 为 CCW，**没问题** | 不用担心方向 |

### 3.4 收集历史势力范围的建议来源

1. **Wikipedia 文明专项 infobox 地图**（"At greatest extent" / "in 117 AD" 等）
2. **谭其骧《中国历史地图集》** — 中国朝代专用
3. **DK Atlas / Penguin Atlas of Ancient History** — 西方文明
4. **Natural Earth + 一张通用历史地图叠加**对照
5. **Wikimedia Commons 的 SVG 历史地图**

不要要求学术精确 — 这是沙盘级，envelope 凑出"大致包络历史势力"就够。

---

## 4. Sutherland-Hodgman + Douglas-Peucker 的关键参数

这些是生成器内部的常量，**默认值已经为 5 个样板调优**，新文明大概率不用动。但出问题时知道改哪里：

| 常量（在 `scripts/generateCoastAwareBoundaries.mjs`）| 默认 | 作用 |
|---|---|---|
| `DOUGLAS_PEUCKER_EPS` | `0.18`（度 ≈ 20 km）| 简化强度。越小越保留细节、顶点越多；越大越平滑 |
| `MIN_RING_AREA_SQDEG` | `0.40` | 小于这个面积的剪裁碎片直接丢（约 < 50×50 km 的小岛 / 沙嘴） |
| `densifyRing` step | `1.5`（envelope 预处理）/ 自适应（输出兜底）| envelope 预处理用 1.5°；输出顶点不足时自动调小到 ≥0.10° |
| 坐标精度 | `1000`（即保留 3 位小数 ≈ 110 m）| 减少 JSON 体积。Round-trip 时不损失视觉精度 |

### 什么时候要调

- **海岸细节太糊** → 降 `DOUGLAS_PEUCKER_EPS` 到 0.10 或 0.05（输出文件会更大）
- **小岛被过度过滤** → 降 `MIN_RING_AREA_SQDEG` 到 0.10
- **大陆主轮廓被过度过滤** → 检查 envelope 是否凸 / 是否覆盖到大陆主体

---

## 5. 生成器使用流程（每个新批次 5 步）

### 步骤 1：在 `ENVELOPES` 加凸包络

```js
// scripts/generateCoastAwareBoundaries.mjs
const ENVELOPES = {
  // ...existing...
  'persian-achaemenid:peak': [
    [50, 25], [60, 22], [72, 25], [78, 32], [75, 40],
    [62, 45], [48, 42], [42, 35], [44, 28], [50, 25],
  ],
};
```

### 步骤 2：在 `META` 加该 phase 的中文 metadata

```js
const META = {
  'persian-achaemenid:peak': {
    phaseLabel: '阿契美尼德 · 大流士鼎盛',
    startYear: -522, endYear: -486,
    summary: '大流士一世扩展至印度河、色雷斯、利比亚...',
  },
};
```

### 步骤 3：在 `COMMON` 加 civ 通用属性（如果新 civ）

```js
const COMMON = {
  // ...
  'persian-achaemenid': {
    dynasty: '阿契美尼德波斯',
    color: '#9b59b6',
    capital: '帕萨尔加德 / 波斯波利斯 / 苏萨',
  },
};
```

### 步骤 4：在 `SAMPLE_IDS` 加入（如果是新样板）

```js
const SAMPLE_IDS = new Set([
  'tang', 'roman-republic-empire', 'islamic-caliphates', 'mughal', 'maya',
  'persian-achaemenid',  // ← 新加
]);
```

**同时在 `scripts/validateHistoricalData.mjs` 的 `SAMPLE_IDS` 也加上** — 两边必须同步，否则验证器认不出。

### 步骤 5：跑生成器 + 验证 + 看图

```bash
node scripts/generateCoastAwareBoundaries.mjs
npm run check
npm run dev    # 浏览器看 zoom 3–5 是否符合预期
```

输出会打印每个 (civ, phase) 的多边形数 + 顶点数，照下面验收：

| 期望 | 不期望 |
|---|---|
| polygons ≥ 1 | "no rings survived clipping" → envelope 与 Natural Earth land 不相交，检查包络是否真的包了陆地 |
| Polygon 顶点 ≥ 40 / MultiPolygon 总 ≥ 80 | 不够会被 `npm run check` 拒绝（生成器自带兜底，理论不会触发）|
| 总顶点 < 500 | 太多说明 DP eps 太小，可以适当调大到 0.25 |

---

## 6. validator 行为速查

`scripts/validateHistoricalData.mjs` 对 boundary 的关键检查：

| 检查 | 触发条件 | 错误信息 |
|---|---|---|
| geometry type | 不是 `Polygon` 或 `MultiPolygon` | `geometry must be Polygon or MultiPolygon` |
| 闭合 ring | 第一点 !== 最后点 | `polygon ring must be closed` |
| 坐标合法 | lng 不在 [-180,180] / lat 不在 [-90,90] | `has invalid coordinate` |
| sample sourceNote | 是 sample 但 sourceNote 为空 | `sample must include sourceNote` |
| sample accuracy | 不是 `rough-refined` / `coastline-aware-rough` | `sample accuracy must be one of: ...` |
| sample phase | 不在 {rise, peak, decline} | `sample phase must be rise, peak, or decline` |
| sample phaseLabel | 为空 | `sample must include phaseLabel` |
| sample 非矩形 | 任一外环只有 2 个独立 lng / 2 个独立 lat | `sample boundary should not be rectangle-like` |
| 顶点数 | coastline-aware Polygon < 40 / MultiPolygon < 80 | `coastline-aware MultiPolygon needs ≥80 total vertices` |

---

## 7. MapScene 渲染兼容性

`src/components/MapScene.jsx` 的 `ifRefined` 表达式当前接受：

```js
'in', ['get', 'accuracy'], ['literal', ['rough-refined', 'coastline-aware-rough']]
```

未来如果引入新 accuracy 值（如 `borders-precise`），**必须**同步把它加入这个数组，否则 MapScene 会把它当占位渲染（fill 0.05、line 0.4、虚线、低 glow）。

修改文件：`src/components/MapScene.jsx` 第 186–192 行。

---

## 8. 跨海文明的 MultiPolygon 拆分

Sutherland-Hodgman 把一个凸 envelope 与 Natural Earth 多个陆地 ring 求交后，每个有交集的陆地块输出为 MultiPolygon 的一个外环。所以：

- **罗马 peak** envelope 包了欧洲 + N 非洲 + 黎凡特 + 巴尔干 → 生成器自动输出 10 个 polygon（每个对应一个陆地块）
- **莫卧儿 peak** envelope 完全在印度次大陆内 → 1 个 polygon（整个次大陆）
- **玛雅** envelope 全在尤卡坦地区，单一陆地块 → 1 个 polygon

**不要手工拆 envelope**。让生成器的剪裁去自动拆。

如果某个 civ 实际控制的两块土地相距太远（如英帝国 = 不列颠 + 印度 + 加勒比 + 澳洲 + 加拿大），需要写多个 envelope，分别 clip 后合并 MultiPolygon。**生成器当前不支持这种"多 envelope per phase"**，未来需要扩展为接受数组。

---

## 9. 历史教训（跳过过哪些前提、踩过哪些坑）

这一节专门记录第一次做 5 个样板时踩的坑。**下一次照着方法论走，不应该再踩。**

### 9.1 没认识到 Sutherland-Hodgman 必须 convex clip
- **症状**：罗马 peak 只画出欧洲，缺 N 非洲和黎凡特
- **根因**：envelope 在 v1 处微凹（v0-v1-v2 不是左转）
- **修复**：生成器在 clipping 前先做 convex hull
- **教训**：写依赖经典算法的脚本前，先列每个算法的输入约束

### 9.2 envelope 方向（CW vs CCW）的纠结
- **症状**：哈里发 rise / peak 输出 0 多边形
- **根因**：envelope 顶点序是 CW，Sutherland-Hodgman 把 inside / outside 搞反了
- **修复**：shoelace 检测 + 自动 reverse 为 CCW
- **教训**：方向问题不应该让人脑去推导，写一个 normalize 函数自动处理

### 9.3 Douglas-Peucker 把密集化后的顶点全删了
- **症状**：莫卧儿 / 玛雅小区域只剩 9–13 顶点
- **根因**：先密集化再 DP，DP 把直线上的中间点都判定为冗余删了
- **修复**：DP 之后再判断顶点不够时再密集化（兜底）
- **教训**：DP 是"简化"，densify 是"加点"，不能同时用 — 要么 DP 后 densify，要么不 DP 直接 densify

### 9.4 GitHub raw 限流
- **症状**：第一次拉 Natural Earth 50m → HTTP 429
- **修复**：换 jsdelivr 镜像 `cdn.jsdelivr.net/gh/martynafford/...`
- **教训**：拉公共数据集时默认走 CDN（jsdelivr / unpkg），不要直走 raw.githubusercontent

### 9.5 验证器阈值与生成器目标错位
- **症状**：罗马 rise 71 顶点 < 80（验证器要求 MultiPolygon ≥ 80）
- **修复**：生成器的"自动密集化兜底"阈值改为 `Polygon ≥ 40 / MultiPolygon ≥ 80`，与验证器一致
- **教训**：跨脚本的"约束常量"应当抽到共享文件，让两边都 import；目前还没做（待办）

### 9.6 唐 peak envelope 东缘到 132°E 圈进九州
- **症状**：日本被画进唐朝
- **修复**：envelope 东缘收紧到 127°E
- **教训**：每条 envelope 边都要照着维基地图核对，不能凭印象

### 9.7 MapScene 表达式不认新 accuracy
- **症状**：coastline-aware-rough 的描边和填色显著比 rough-refined 暗
- **修复**：MapScene `ifRefined` 改为接受两种 accuracy 值
- **教训**：新增 accuracy 字段时，前端渲染逻辑要同步更新；这两步应当配对完成

### 9.8 巨大内陆帝国不适合单凸包络裁剪
- **症状**：蒙古帝国用一个横跨欧亚的凸 envelope 裁剪 Natural Earth 后，虽然可以过滤离岛碎片，但视觉上变成一整块斜切梯形，zoom 4–5 很不精致
- **根因**：Sutherland-Hodgman 的凸裁剪适合沿海帝国或中等区域；对蒙古这种大面积内陆草原帝国，凸包约束会消灭历史边界的凹凸和方向变化
- **修复**：蒙古改用手工草原带外轮廓，并给里海添加 Polygon hole；长边再做 deterministic roughen，避免填海和大直线
- **教训**：沿海/跨海文明优先用 Natural Earth clipping；巨大内陆帝国应优先用手工历史外轮廓 + 必要水体 hole，而不是一个超大凸包络

---

## 10. 下一批应该怎么做

**推荐顺序**（按"先做能消除最多视觉混乱的"）：

### 第一批：与已精修样板相邻的文明（消除"精致 vs 粗糙"层差）

唐的邻居：高句丽 / 渤海 / 吐蕃 / 日本（大和→平安）
罗马的邻居：帕提亚 / 萨珊 / 拜占庭（拜占庭已是 sample？检查一下）
莫卧儿的邻居：朱罗 / 笈多 / 维查耶那加尔
哈里发的邻居：拜占庭 / 法蒂玛 / 萨曼

### 第二批：其他"重要"文明（按 importance 5 排序）

参见 `dynasties.json` 中 importance 字段。

### 第三批：其他全部

---

## 11. 工作量预估

按本方法论：

| 任务 | 单 civ 时间 |
|---|---|
| 查历史势力范围 + 起草 envelope | 10 分钟 |
| 写 envelope 数组 + meta + 加 SAMPLE_IDS | 5 分钟 |
| 跑生成器 + 验证 + 浏览器抽查 | 3 分钟 |
| **合计** | **≈ 20 分钟 / civ** |

剩余 38 个 civ × 20 分钟 = **约 12.5 小时**。
按 5 个 civ 一个批次、约 100 分钟一批，分 8 批做完。

---

## 12. 维护清单（每次精修后更新）

- [ ] `scripts/generateCoastAwareBoundaries.mjs` 的 `ENVELOPES` / `META` / `COMMON` 加新条目
- [ ] `scripts/validateHistoricalData.mjs` 的 `SAMPLE_IDS` 同步加入
- [ ] `src/data/boundaries-simplified.json` 跑生成器后自动更新
- [ ] `npm run check` 通过
- [ ] 浏览器 zoom 3–5 抽查该 civ 的鼎盛年份
- [ ] 把本次踩到的新坑（如果有）追加到本文档 §9
- [ ] commit message 用 `feat(boundaries):` 前缀，注明 civ 数量

---

## 13. 一个完整的例子（假设要给波斯 Achaemenid 做样板）

```bash
# 1. 编辑 scripts/generateCoastAwareBoundaries.mjs
#    加 ENVELOPES['persian-achaemenid:rise/peak/decline']
#    加 META['persian-achaemenid:rise/peak/decline']
#    加 COMMON['persian-achaemenid']
#    SAMPLE_IDS 加 'persian-achaemenid'

# 2. 编辑 scripts/validateHistoricalData.mjs
#    SAMPLE_IDS 加 'persian-achaemenid'

# 3. 运行
node scripts/generateCoastAwareBoundaries.mjs
# 期望看到 3 行新输出：
#   persian-achaemenid:rise: N polygon(s), V vertices
#   persian-achaemenid:peak: ...
#   persian-achaemenid:decline: ...

npm run check
# 期望通过

npm run dev
# 浏览器开 5176（worktree）或 5175（主分支），拖时间轴到 Achaemenid 鼎盛年份
# 看边界是否符合期望

# 4. commit
git add scripts/ src/data/boundaries-simplified.json
git commit -m "feat(boundaries): add coastline-aware boundary for persian-achaemenid"
```

如果浏览器看到不对（如圈进了印度次大陆全部），回到步骤 1 改 envelope，重跑。

---

## 附：方法论文档自身的维护

每次按本流程跑完一批新文明，**回到 §9 看是否有新的坑应该补**。如果遇到本文档没覆盖的情况，加进 §9，让下一个人少走弯路。

文档的价值不是"准确" — 是"减少 trial-and-error"。
