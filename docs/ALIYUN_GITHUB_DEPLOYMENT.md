# 阿里云部署指南（Caddy + atlas.ckl.hk）

> 本文档对应**真实生产环境**：
> - 阿里云 ECS（公网 IP `47.237.181.181`）
> - 操作系统 Ubuntu 24.04.2 LTS
> - 已运行 **Caddy v2.11.3**（管 `ckl.hk` / `www.ckl.hk` / `yicai.ckl.hk` / `api.ckl.hk`）
> - 已运行 **lottery-analysis**（`/opt/lottery-analysis/`，前端在 `frontend/dist`，后端 FastAPI 监听 `:8000`）
> - 服务器内存 894 MB（可用 ~467 MB）—— **不建议在服务器上构建**
>
> history-atlas 作为第二个静态站复用同一台机器，挂在子域 **`atlas.ckl.hk`**，部署目录 **`/opt/history-atlas/dist`**。
> 走 Caddy 自动 HTTPS，不安装 Nginx，不使用 certbot。

---

## 部署模型

```
浏览器
  │
  ▼
47.237.181.181:443 ─── Caddy ─── ckl.hk        → redir → www
                          ├── www.ckl.hk        → /opt/lottery-analysis/frontend/dist   (lottery)
                          ├── yicai.ckl.hk      → /opt/lottery-analysis/frontend/dist   (lottery 副域)
                          ├── api.ckl.hk        → reverse_proxy localhost:8000          (lottery 后端)
                          └── atlas.ckl.hk      → /opt/history-atlas/dist               (本项目)
```

新加 history-atlas **不动 lottery 任何配置**，只在 Caddyfile 末尾追加一个 site block。

---

## 一次性初始化（部署前只做一次）

### 1. DNS 加 A 记录

在 ckl.hk 域名厂商控制台加：

```
主机记录: atlas
记录类型: A
记录值:   47.237.181.181
TTL:      600
```

DNS 生效后用 `dig atlas.ckl.hk +short` 应该返回 `47.237.181.181`。

### 2. 服务器创建目录

```bash
ssh root@47.237.181.181
mkdir -p /opt/history-atlas/dist
chown -R root:root /opt/history-atlas
```

### 3. 追加 Caddyfile 块

```bash
sudo nano /etc/caddy/Caddyfile
```

在文件末尾追加（不要动现有 4 个 block）：

```caddy
atlas.ckl.hk {
    root * /opt/history-atlas/dist
    file_server
    try_files {path} /index.html
    encode gzip zstd
}
```

要点：
- `try_files {path} /index.html` 是 **SPA fallback**，任何未匹配到的路径回退到 index.html（history-atlas 当前只有 `/` 一个路由，但未来加路由时已就绪）
- `encode gzip zstd` 让 Caddy 在响应时压缩。当前入口 JS gzip 后约 43 KB，MapLibre / Three 独立分块可被浏览器长期缓存。
- 不需要写 `tls` —— Caddy 默认开 ACME，DNS 解析就绪后**首次访问会自动向 Let's Encrypt 签证书**

### 4. 校验并重载 Caddy

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
# 验证 atlas.ckl.hk 已被 Caddy 接管
caddy fmt /etc/caddy/Caddyfile        # 可选：格式化
journalctl -u caddy -n 30 --no-pager  # 看是否签证书成功
```

`reload` 是热加载，如果新配置语法错，Caddy 会拒绝并继续用旧配置，**不会拖垮 lottery**。

---

## 日常更新流程（推荐：`npm run deploy` 一键部署）

服务器内存只够跑 lottery 后端 + Caddy，**不要在服务器上 `npm run build`**。所有构建在本地 Windows 完成，由 `scripts/deploy.ps1` 自动完成构建 → 上传 → 权限 → 线上校验。

### 一条命令完成全部步骤

```powershell
cd C:/Users/Yvette/Documents/历史网站
npm run deploy
```

脚本（`scripts/deploy.ps1`）按顺序做这些事，**任一步失败立即中止**：

| 步骤 | 动作 |
|---|---|
| 0/7 | 检查本地工具 npm / scp / ssh / curl 是否就绪 |
| 1/7 | `npm run check`（数据校验 + Vite 构建） |
| 2/7 | 确认 `dist/index.html` 与 `dist/assets/index-*.js` 存在，并收集所有 JS/CSS 分块 |
| 3/7 | `scp -r dist/* root@47.237.181.181:/opt/history-atlas/dist/` |
| 4/7 | `ssh root@47.237.181.181 'chmod -R a+rX /opt/history-atlas/dist'` |
| 5/7 | `curl -I https://atlas.ckl.hk/` → 期望 200 + text/html |
| 6/7 | `curl -I https://atlas.ckl.hk/<random>` → 期望 200（验证 SPA fallback） |
| 7/7 | 逐个校验 `dist/assets` 下所有线上 JS/CSS 分块 → 期望 200 + 正确 Content-Type |

### 脚本明确不做的事

- **不动 `/opt/lottery-analysis`**（lottery 项目不受影响）
- **不动 `/etc/caddy/Caddyfile`**（除非你手动改并 reload）
- **不 reload Caddy**（Caddy 直接读静态目录，新文件秒级生效，不需要 reload）
- **不删服务器上的多余文件**（scp 是覆盖式，不删旧文件；如需"完全同步"用 rsync `--delete`，不在脚本里）
- **不在服务器上跑 npm**（避免 OOM）

### 手动应急流程（脚本坏了时退路）

如果 `npm run deploy` 因网络 / SSH key / PowerShell 策略问题跑不起来，手工 3 步：

```bash
cd C:/Users/Yvette/Documents/历史网站
npm run check
scp -r dist/* root@47.237.181.181:/opt/history-atlas/dist/
ssh root@47.237.181.181 'chmod -R a+rX /opt/history-atlas/dist'
```

### Caddyfile 改动（不在 deploy 脚本里）

只有以下场景需要登录服务器，**这一步刻意不自动化，避免误 reload**：
- 增加新子域 / 新路由
- 改 SPA fallback 规则
- 改 gzip / cache 头

操作：
```bash
ssh root@47.237.181.181
sudo nano /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

---

## 验收清单

部署后逐条过：

```bash
# 1. DNS 解析正确
dig atlas.ckl.hk +short                       # → 47.237.181.181

# 2. HTTPS 握手 + 自动签发的证书签发方
curl -v https://atlas.ckl.hk 2>&1 | grep -E 'subject|issuer|HTTP/'

# 3. 拉首页
curl -s https://atlas.ckl.hk | head -10       # → 应见 <!DOCTYPE html>

# 4. SPA fallback 正常
curl -I https://atlas.ckl.hk/some/random/path # → 200 (而不是 404)

# 5. gzip 生效（任选一个线上 JS 文件）
curl -sI -H 'Accept-Encoding: gzip' https://atlas.ckl.hk/assets/index-*.js | grep -i content-encoding

# 6. Caddy 日志无错
journalctl -u caddy -n 50 --no-pager | grep -i error
```

浏览器打开 `https://atlas.ckl.hk/`，按 `docs/ACCEPTANCE.md` 走一遍交互。

---

## 资源开销估算

| 资源 | 当前 lottery 占用 | history-atlas 增量 | 余量 |
|---|---|---|---|
| 磁盘 | 238 MB (`/opt/lottery-analysis`) | ~5 MB（dist 总大小，gzip 后更小） | 23 GB 剩余 → 充裕 |
| 内存 | 426 MB / 894 MB（含 FastAPI 104 MB）| 0 MB（静态站运行时无内存）| 充裕 |
| CPU | 几乎空闲 | 仅响应静态请求 | 充裕 |
| 端口 | Caddy 占 80/443、uvicorn 占 8000 | 共用 Caddy 80/443 | 无冲突 |

结论：复用现机完全够用，**无需新开 ECS**。

---

## 故障排查

| 症状 | 原因 / 检查 |
|---|---|
| 浏览器打开 `atlas.ckl.hk` 提示证书无效 / 不安全 | DNS 还没生效；或刚刚追加 Caddyfile 还没 reload；或 Let's Encrypt 限流。等 1-2 分钟看 `journalctl -u caddy` |
| 返回 404 | `/opt/history-atlas/dist/` 为空，或 `dist/index.html` 不存在。检查 `ls /opt/history-atlas/dist/` |
| 返回 502 | 不应出现（静态站无后端）。如果出现，说明 Caddy reload 后 site block 没注册成功，再 `caddy validate` |
| `scp` 提示 permission denied | SSH key 没对，或目标目录没写权限。`ssh root@47.237.181.181 ls -la /opt/history-atlas/` 检查 |
| 首页 200 但路由跳转 404 | `try_files {path} /index.html` 漏写。再确认 Caddyfile 有这一行 |
| 改了配置后 Caddy 拒绝 reload | `caddy validate` 先跑，会指出语法错误的行号 |
| 想看 Caddy 究竟在用哪个证书 | `ls /var/lib/caddy/.local/share/caddy/certificates/acme-v02.api.letsencrypt.org-directory/atlas.ckl.hk/` |

---

## 外部网络依赖（与 lottery 共享）

当前地图仍依赖外部瓦片，这部分跟服务器无关，是浏览器直连：

- CARTO dark basemap（`a.basemaps.cartocdn.com`）
- AWS elevation terrarium DEM tiles（`s3.amazonaws.com/elevation-tiles-prod`）
- MapLibre glyphs：当前没有文字图层，生产 style 不再声明 glyphs，避免无效字体请求

国内访问可能偶有延迟。如果将来需要稳定的国内访问，要做的是：
1. 自建瓦片服务（mbtiles + tileserver-gl）放在另一台机
2. 或者切换到高德/腾讯等国内地图源

不在本阶段处理。

---

## 安全组（阿里云控制台）

服务器是 lottery 共用的，安全组应该已经配好：
- TCP 22（SSH） — 限制到你的 IP
- TCP 80（HTTP）— 0.0.0.0/0
- TCP 443（HTTPS）— 0.0.0.0/0

**添加 atlas 子域不需要再开任何端口**。

服务器内的 ufw 状态（看而不改）：

```bash
sudo ufw status
```

---

## 附录 A · 备选方案：服务器构建（不推荐）

当前内存不够，不能用。但记录下来以备未来扩容到 ≥ 2 GB 后启用。

```bash
ssh root@47.237.181.181
git clone https://github.com/lick201010-lab/history-atlas.git /opt/history-atlas-src
cd /opt/history-atlas-src
npm ci
npm run build
ln -sfn /opt/history-atlas-src/dist /opt/history-atlas/dist   # 用软链替代 scp
```

或者临时加 swap 后跑：

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
```

不在当前阶段执行。

---

## 附录 B · Nginx + certbot 旧方案（仅供参考）

之前文档草拟过 Nginx + certbot 路径，**实际服务器没用 Nginx**，所以这一节作为历史/迁移参考保留：

```nginx
# /etc/nginx/sites-available/atlas.ckl.hk
server {
    listen 80;
    server_name atlas.ckl.hk;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name atlas.ckl.hk;
    ssl_certificate     /etc/letsencrypt/live/atlas.ckl.hk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/atlas.ckl.hk/privkey.pem;
    root /opt/history-atlas/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d atlas.ckl.hk
```

**如果未来要从 Caddy 切回 Nginx**，需要：
1. 停 Caddy（`systemctl stop caddy && systemctl disable caddy`）
2. 装 Nginx，把 ckl.hk / www / yicai / api / atlas 全部迁过去
3. certbot 重新签证书（Caddy 已签的不能直接复用）

风险很大，**不建议折腾**。Caddy 自动 HTTPS + 零配置 SPA fallback 是更省心的选择。

---

## 文档与流程索引

- 项目总览：[README.md](../README.md)
- 验收清单：[docs/ACCEPTANCE.md](ACCEPTANCE.md)
- Git 日常：[docs/GIT_WORKFLOW.md](GIT_WORKFLOW.md)
- 已知问题：[docs/KNOWN_ISSUES.md](KNOWN_ISSUES.md)
- 路线图：[docs/ROADMAP.md](ROADMAP.md)
- 环境变量模板：[.env.example](../.env.example)
