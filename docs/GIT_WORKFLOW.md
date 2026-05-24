# Git 日常工作流

本项目的源码托管在 GitHub：
**https://github.com/lick201010-lab/history-atlas**

服务器侧从同一个仓库 `git pull` 拉取最新代码后构建。日常维护遵循下面的简化流程即可。

---

## 1. 每次开始工作前

```bash
cd C:/Users/Yvette/Documents/历史网站
git status        # 看看本地是否有未提交改动
git pull          # 拉远端最新（如果有别处推过）
```

如果 `git status` 显示有未提交改动而你又要 `git pull`，先 `git stash` 一下。

---

## 2. 改完代码后保存

```bash
git status                        # 确认改动文件清单合理
git add .                         # 或者按文件添加 git add src/...
git commit -m "简短中文/英文消息"   # 提交本地
git push                          # 推到 GitHub
```

提交前如果想跑一次质量检查：

```bash
npm run check
```

`check = validate:data + build`，通过后再 commit / push 比较稳。

---

## 3. 拉取最新代码（本地或服务器）

```bash
git pull
```

如果远端历史已经被 rebase 或 force-push 过，可能需要：

```bash
git fetch origin
git reset --hard origin/main      # 危险操作，会丢本地未提交改动，确认后再用
```

---

## 4. 提交信息约定（轻量）

不强制规范，但建议带前缀方便回看：

| 前缀 | 含义 | 示例 |
|---|---|---|
| `feat:` | 新功能 | `feat: 加入文明对比面板` |
| `fix:` | bug 修复 | `fix: 信息卡在 1280×720 与时间轴重叠` |
| `refactor:` | 重构无功能变化 | `refactor: 把 boundaryCard 上提到 App` |
| `docs:` | 文档 | `docs: 补充阿里云部署文档` |
| `style:` | 样式 / CSS | `style: 降低非激活态发光` |
| `data:` | 数据扩展 / 校订 | `data: dynasties 补全 38 个 legacy` |
| `chore:` | 工程杂项 | `chore: 加 .env.example` |

---

## 5. 不要提交的内容

`.gitignore` 已经覆盖了下面这些，**任何时候都不要手动 `git add -f` 它们**：

- `node_modules/` — 体积大、由 `package-lock.json` 决定，重装即可
- `dist/` — 构建产物，跑 `npm run build` 重生成
- `*.log` — Vite 与脚本的日志
- `.env`、`.env.local`、`.env.*.local` — **真实密钥**绝不入库
- `react-*-validation.png` — 早期手测截图
- `manim_demo/` — 离线生成的视频实验

只有 `.env.example`（不含真实值）应该被提交。

---

## 6. 分支策略（当前 MVP 阶段保持简单）

- `main` 是唯一长期分支，**始终保持可运行**（pull 下来就能 `npm run check` 通过）
- 大改动可以临时开 `feat/xxx` 或 `refactor/xxx` 分支，做完合并回 main
- 现阶段不需要 `develop` / `release` 流程

合并流程示意：

```bash
git checkout -b feat/timeline-ticks
# ... 改代码 ...
npm run check
git add . && git commit -m "feat: 时间轴关键节点"
git push -u origin feat/timeline-ticks
# 在 GitHub 网页上发 PR，自审后合并到 main
git checkout main && git pull
git branch -d feat/timeline-ticks
```

---

## 7. 部署到服务器（本地构建 + scp 上传 dist）

生产服务器是 `root@47.237.181.181`（阿里云 ECS，Ubuntu 24.04，跑 Caddy v2.11.3），
**只有 894 MB 内存，不在服务器上跑 `npm run build`**。所有构建在本地完成后用 scp/rsync 推到 `/opt/history-atlas/dist/`：

```bash
# 本地：构建 + 上传
cd C:/Users/Yvette/Documents/历史网站
npm run check                                              # 校验数据 + 构建
scp -r dist/* root@47.237.181.181:/opt/history-atlas/dist/ # 推送静态产物
```

Caddy 直接读这个目录，**新文件上传后立即生效**，不需要 reload。

只有改了 Caddyfile（如增加路由、改子域）才需要登录服务器：

```bash
ssh root@47.237.181.181
nano /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

详细部署流程：[docs/ALIYUN_GITHUB_DEPLOYMENT.md](ALIYUN_GITHUB_DEPLOYMENT.md)。

> 不推荐在服务器上 `git pull && npm run build`。当前内存余量约 467 MB，Vite + Rollup 打包峰值可能 600 MB+，会触发 OOM 影响 lottery 后端。

---

## 8. 常见救急

| 场景 | 操作 |
|---|---|
| 想撤回最后一次未推送的 commit | `git reset --soft HEAD~1` |
| 想完全丢弃未提交改动 | `git checkout .`（危险，确认后用）|
| 误 push 了密钥 | 立刻轮换密钥 + `git filter-repo` 清史 + force push |
| 仓库太大想瘦身 | `git gc --aggressive --prune=now` |
| 同一文件改坏了想回上一版 | `git checkout HEAD -- path/to/file` |

---

## 9. 记得做的事

- 每次推送前跑 `npm run check`
- 每次大改后跑一遍 `docs/ACCEPTANCE.md` 的手测清单
- 真实密钥只放 `.env.local`，不放 README、不放 commit message、不放截图
- `main` 推坏了 = 服务器下次 pull 就坏了，谨慎推送
