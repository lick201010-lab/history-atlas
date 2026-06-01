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

## GitHub 基线

- 仓库：`https://github.com/lick201010-lab/history-atlas.git`
- 当前本地分支：`main`
- 最近提交集中在：
  - 边界与圣索菲亚精修
  - Obsidian 项目笔记引入
  - 协作原则固化
  - 核心奇观 GLB 样板加入

## 当前协作原则

`AGENT.md` 已明确写下最重要的一条：

> Codex 不是附和者，而是项目协作者。如果用户方向、技术判断、部署方式、视觉决策有问题，必须直接指出并给证据。

这条原则应视为长期有效，不是一次性备注。

## Claude / Codex 分工建议

### Claude 更适合做

- 大批量实现
- 批量数据补全
- 边界生成脚本扩展
- 多个 builder / GLB 脚本的生产性实现
- 大范围视觉试验

### Codex 更适合做

- 验收和复核
- 读取当前工作树并判断真实状态
- 小范围补漏和修正
- 部署事实校对
- 文档与项目笔记沉淀
- 给 Claude 写下一步任务模板

## 当前工作树协作现实

截至 2026-05-31 本地仓库是 dirty 的：

- `src/App.jsx`
- `src/components/MapScene.jsx`
- `src/map/mapStyle.js`
- `src/styles.css`
- `src/map/smoothBoundaries.js`

这意味着：

- 本地状态不等于 GitHub 最新提交状态
- 线上状态也不等于当前本地视觉状态
- 文档必须显式区分“已提交”和“未提交”

## Git 工作习惯

- 开始前先看 `git status`
- 不回滚不是自己做的改动
- 尽量只提交自己本次任务涉及的文件
- 大改完先 `npm run check`
- 部署前先确认本地状态是否真要上生产

## 当前要避免的协作错误

- 把未提交本地视觉实验写成“已上线事实”
- 为了追求一致性回滚用户或 Claude 的工作
- 在 dirty worktree 下盲目 `git pull`
- 让“看起来差不多”的描述替代真实命令和文件证据

## 当前对 Obsidian 笔记的协作建议

- 项目内 `obsidian/历史沙盘项目` 作为可版本化、可审计的笔记源
- 外部 vault 作为消费侧副本
- 大阶段完成后优先更新：
  - [[09-已完成里程碑]]
  - [[10-当前问题与风险]]
  - [[11-下一步路线图]]
  - [[12-Claude任务提示词模板]]

## 相关笔记

- [[07-部署与运维]]
- [[09-已完成里程碑]]
- [[12-Claude任务提示词模板]]
