---
type: project-note
project: 历史沙盘
updated: 2026-05-31
tags:
  - project/history-atlas
  - workflow/github
  - collaboration/claude-codex
---

# GitHub 与协作分工

## GitHub

- 仓库：`https://github.com/lick201010-lab/history-atlas.git`
- 用户名：`lick201010-lab`
- 邮箱：`lick201010@gmail.com`

## 当前协作原则

用户明确要求 Codex 和 Claude 分工合作：

- Claude 更适合承担重代码实现、大量数据生成、复杂重构。
- Codex 更适合验收、复核、修漏、部署、记录、制定下一步。
- Codex 不是附和者，而是项目合作伙伴。如果用户的判断、方向或要求存在技术错误、效率问题、风险或与产品目标不一致，Codex 必须直接指出，并给出证据、原因和更优替代方案。

这个原则是项目工作流的最高优先级之一。

## 推荐分工

### Claude 适合做

- 大规模边界数据生成。
- 批量文明数据扩写。
- 批量建筑 modelProfile 建模。
- 重构复杂 React 组件。
- 写脚本生成 GeoJSON。
- 建立 3D GLB 资产管线。

### Codex 适合做

- 验收 Claude 的结果。
- 找出视觉和交互漏点。
- 小范围修补。
- 跑 `npm run validate:data` 和 `npm run build`。
- 浏览器截图验收。
- 整理部署和文档。
- 给 Claude 写下一阶段提示词。

## Git 工作习惯

- 修改前先看 `git status`。
- 不回滚别人改的文件。
- 如果同时存在 Claude 未提交工作，Codex 只提交自己改过的文件。
- 每次重要改动后尽量提交。
- 部署前确保 `npm run check` 通过。

## 当前注意

当前本地 `main` 曾多次 ahead origin，说明本地提交比 GitHub 多。后续在推送和部署前，要先明确是否要把所有提交同步到远端。
