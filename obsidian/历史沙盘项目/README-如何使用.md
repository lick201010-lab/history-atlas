---
type: readme
project: 历史沙盘
updated: 2026-05-31
tags:
  - project/history-atlas
  - obsidian/readme
---

# 如何使用这套笔记

当前这套笔记有两个位置：

- 项目内可版本化源：`D:\松君\项目\历史网站\obsidian\历史沙盘项目`
- 外部 Obsidian 目标目录：`D:\松君\文件库\松君\history-atlas`

推荐把项目内目录视为“可追踪源”，把外部目录视为“日常阅读副本”。

## 打开方式

### 方式一：直接把项目内目录作为 vault 打开

1. 打开 Obsidian
2. 选择 `Open folder as vault`
3. 打开：

```text
D:\松君\项目\历史网站\obsidian\历史沙盘项目
```

4. 从 `00-索引.md` 开始

### 方式二：在已有 vault 中阅读

如果已有自己的总 vault，则把这套笔记作为子目录放到：

```text
D:\松君\文件库\松君\history-atlas
```

## 这套笔记适合解决什么问题

- 快速判断当前项目真实阶段
- 回看最近边界 / GLB / dark 主题视觉工作的上下文
- 给 Claude 准备下一阶段任务
- 在部署前核对“本地状态”和“线上事实”是否一致

## 笔记结构

- `00-索引.md`：总入口和当前状态快照
- `01-项目总览.md`：项目定位、阶段、关键事实
- `02-产品目标与视觉方向.md`：dark / atlas / 地图风格判断
- `03-技术架构.md`：React、MapLibre、Three、数据、部署结构
- `04-数据体系.md`：当前数据规模与字段结构
- `05-地图与边界渲染.md`：边界方法、MapLibre 视口和视觉层策略
- `06-3D建筑与资产管线.md`：程序化 builder、wonderKit、GLB 样板
- `07-部署与运维.md`：Aliyun + Caddy + deploy 事实
- `08-GitHub与协作分工.md`：Claude / Codex 分工和 git 习惯
- `09-已完成里程碑.md`：已经完成到哪一步
- `10-当前问题与风险.md`：当前最值得警惕的问题
- `11-下一步路线图.md`：建议推进顺序
- `12-Claude任务提示词模板.md`：给 Claude 的现成模板

## 维护建议

- 项目状态有明显变化时，先改项目内笔记，再同步外部 vault
- 大阶段完成后至少更新：
  - `09-已完成里程碑.md`
  - `10-当前问题与风险.md`
  - `11-下一步路线图.md`
- 如果只是一次会话快照，优先写进 `WORK_LOG.md`
- 如果是长期原则，优先固化到 Obsidian 和 `AGENT.md`

## 当前这次更新的边界

- 已读取并整理：README、AGENT、WORK_LOG、docs、git log、git status、`src/data` 计数、当前未提交工作树
- 未修改应用源码
- 未执行部署
