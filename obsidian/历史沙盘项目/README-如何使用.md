---
type: readme
project: 历史沙盘
updated: 2026-05-31
tags:
  - project/history-atlas
  - obsidian/readme
---

# 如何在 Obsidian 使用这个笔记包

当前没有在 `Documents` 或桌面下找到已有 Obsidian vault，所以我先把项目笔记整理到了这里：

```text
C:\Users\Yvette\Documents\历史网站\obsidian\历史沙盘项目
```

## 方式一：直接作为一个 Obsidian Vault 打开

1. 打开 Obsidian。
2. 选择 `Open folder as vault`。
3. 选择：

```text
C:\Users\Yvette\Documents\历史网站\obsidian\历史沙盘项目
```

4. 打开 `00-索引.md`。

## 方式二：同步到你已有的 Obsidian Vault

如果你已经有一个 Obsidian vault，但它不在 `Documents` 或桌面下，把 vault 路径告诉 Codex，例如：

```text
D:\ObsidianVault
```

然后让 Codex 把本目录复制或同步到：

```text
D:\ObsidianVault\历史沙盘项目
```

## 笔记结构

- `00-索引.md`：总入口。
- `01-项目总览.md`：项目是什么、当前阶段、关键文件。
- `02-产品目标与视觉方向.md`：视觉路线和用户认可的目标形态。
- `03-技术架构.md`：React、Vite、MapLibre、Three.js、Caddy 的结构。
- `04-数据体系.md`：dynasties、boundaries、landmarks、eras。
- `05-地图与边界渲染.md`：地形、海洋、边界、拜占庭边界问题。
- `06-3D建筑与资产管线.md`：Three.js、GLB、圣索菲亚模型、后续资产管线。
- `07-部署与运维.md`：阿里云、Caddy、部署脚本。
- `08-GitHub与协作分工.md`：GitHub、Claude/Codex 分工。
- `09-已完成里程碑.md`：项目已经完成了什么。
- `10-当前问题与风险.md`：视觉、边界、模型、性能、数据可信度风险。
- `11-下一步路线图.md`：后续阶段安排。
- `12-Claude任务提示词模板.md`：后续给 Claude 的任务模板。

## 后续维护原则

- 每完成一个大阶段，更新 `09-已完成里程碑.md` 和 `11-下一步路线图.md`。
- 每发现一个长期问题，更新 `10-当前问题与风险.md`。
- 每形成新的 Claude 任务，放到 `12-Claude任务提示词模板.md`。
- 每次上线或部署变化，同步更新 `07-部署与运维.md`。

