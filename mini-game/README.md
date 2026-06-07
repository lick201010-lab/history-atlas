# 历史沙盘 Cocos 小游戏样板（拜占庭）

这是一个独立的 Cocos Creator 3.8 技术样板，用来验证“移动端小游戏化沙盘”是否能比当前网页版本获得更好的边界、美术和触控体验。

它不是最终迁移版，也不替代当前 React + MapLibre 站点。网页项目继续作为桌面版、官网和主数据源；本目录只做 Cocos 拜占庭样板。

## 样板范围

| 项 | 内容 |
| --- | --- |
| 引擎 | Cocos Creator 3.8.8 |
| 场景 | 拜占庭帝国，公元 600 年，东地中海区域 |
| 地图 | 平整深色海洋、低浮雕陆地、平滑边界面与描边 |
| 奇观 | 圣索菲亚、帕特农神庙、罗马斗兽场 |
| 视角 | 手机竖屏优先，45 度沙盘俯视，缓慢环绕 |
| UI | 暂时关闭程序化 2D UI，优先验证 3D 沙盘主体 |

## 使用方式

### 1. 重新导出样板数据

在仓库根目录运行：

```bash
node mini-game/tools/exportByzantineData.mjs
```

脚本只读取网页主工程的 `src/data/*` 和 `public/models/*`，产物写入：

- `mini-game/assets/byzantine/data/byzantine.json`
- `mini-game/assets/landmarks/*.glb`

### 2. 用 Cocos 打开

1. 打开 Cocos Dashboard。
2. 添加项目，选择 `mini-game/`。
3. 使用 Creator 3.8.x 打开，建议 3.8.8。
4. 打开 `assets/main/Main.scene`。
5. 直接预览。`Game` 节点已经挂好 `Bootstrap` 组件，不需要手动添加。

首次打开会生成 `library/`、`temp/` 等目录，这些是本机缓存，已被 `.gitignore` 忽略。

## 验证命令

在仓库根目录：

```bash
npm run validate:data
npm run check
node mini-game/tools/exportByzantineData.mjs
```

结构性 Cocos 验证：

- `mini-game/settings/v2/packages/engine.json` 必须包含 `modules.configs.defaultConfig.includeModules`。
- `mini-game/assets/main/Main.scene` 的 `Game` 节点必须挂载 `Bootstrap`。
- Cocos 日志不能出现 `Init asset worker failed`、`n.map is not a function` 或脚本语法错误。

## 诚实边界

当前样板已经解决“能导入、能装配、脚本不乱码、数据可导出”的工程底座问题，但还没有通过真机小游戏视觉验收。后续必须在 Cocos Preview、微信开发者工具、抖音开发者工具和手机真机中对比网页版本，确认 Cocos 明显胜出后，才允许进入全量迁移。

当前 `UIController` 暂时不由 `Bootstrap` 挂载，因为 Cocos Preview 中的程序化 `Canvas/Graphics/Label` 触发了 2D batcher `localSetLayout` 运行时错误。样板下一步先验证 3D 沙盘主体；UI 后续应改为编辑器 prefab 或小游戏原生 overlay。
