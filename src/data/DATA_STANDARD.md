# 历史沙盘数据标准

这个文件记录当前 MVP 的数据写法，后续扩展文明时优先按这个标准补齐。

## 样板文明

样板文明目前只精修 5 个：

- 唐朝：`tang`
- 罗马共和国/帝国：`roman-republic-empire`
- 阿拉伯哈里发：`islamic-caliphates`
- 莫卧儿帝国：`mughal`
- 玛雅文明：`maya`

这 5 个文明是后续扩展数据的参考模板。

## `dynasties.json`

每个文明至少需要：

- `id`：稳定英文短 id，必须和边界数据一致。
- `name` / `nameEn`：中文名和英文名。
- `startYear` / `endYear`：数字年份，公元前用负数。
- `capital`：包含 `lat`、`lng`、`name`。
- `color`：地图与信息卡使用的主题色。
- `region`：区域标签。
- `summary`：正式文明档案式简介，不写口号。
- `relatedLandmarks`：关联 `landmarks.json` 里的 id。
- `events`：关键事件数组。

样板文明还必须包含：

- `tags`：3-6 个主题标签，例如 `["帝国", "贸易", "城市"]`。
- `importance`：1-5 分，表示此文明在世界历史叙事中的权重。
- `legacy`：历史影响，说明制度、文化、宗教、城市、技术或区域格局上的长期遗产。
- `events` 至少 5 条。

## `boundaries-simplified.json`

每个边界是一个 GeoJSON `Feature`，`properties.id` 必须对应 `dynasties.json` 的 `id`。

MVP 阶段允许粗略，但需要：

- `geometry.type` 使用 `Polygon`。
- 坐标环必须闭合，最后一个点等于第一个点。
- `summary` 说明这个边界表达什么。
- `accuracyNote` 明确这是示意边界，不代表精确历史疆域。

样板文明还必须包含：

- 非矩形的自然粗略多边形。
- `sourceNote`：说明边界绘制依据和示意性质。
- `accuracy: "rough-refined"`。
- `accuracyLabel: "样板粗略多边形"`。

## 校验命令

修改历史数据后运行：

```bash
npm run validate:data
```

完整交付前运行：

```bash
npm run validate:data
npm run build
```
