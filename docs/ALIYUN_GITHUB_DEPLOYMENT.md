# 阿里云与 GitHub 同步部署指南

本项目后续默认按“GitHub 保存源码，阿里云服务器拉取并部署”的方式维护。

## 推荐工作流

1. 本地或 AI 修改代码。
2. 运行质量检查：

   ```bash
   npm run check
   ```

3. 提交到 Git：

   ```bash
   git add .
   git commit -m "Update history atlas"
   git push
   ```

4. 登录阿里云服务器拉取最新代码：

   ```bash
   cd /var/www/history-atlas
   git pull
   npm ci
   npm run build
   ```

5. Nginx 指向 `dist/` 目录提供静态站点。

## GitHub 仓库建议

建议仓库名：

```text
history-atlas
```

首次关联远程仓库：

```bash
git remote add origin git@github.com:<your-name>/history-atlas.git
git branch -M main
git push -u origin main
```

如果使用 HTTPS：

```bash
git remote add origin https://github.com/<your-name>/history-atlas.git
git branch -M main
git push -u origin main
```

## 应提交的内容

- `src/`
- `scripts/`
- `docs/`
- `README.md`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `index.html`
- `.gitignore`
- `prototype/`，如需保留原型历史

## 不建议提交的内容

- `node_modules/`
- `dist/`
- `*.log`
- `manim_demo/media/`
- `manim_demo/__pycache__/`
- Manim 中间视频分片和缓存

当前 `.gitignore` 已忽略上述生成物。`manim_demo/` 下的最终视频或脚本是否保留，由项目需要决定。

## 阿里云服务器准备

服务器需要：

- 操作系统：**Ubuntu 22.04 LTS**（也可用 Alibaba Cloud Linux 3 / CentOS Stream）
- **Node.js 20 LTS**（NodeSource 或 nvm 安装）
- **Nginx 1.18+**
- **Git 2.x**

一次性环境安装示例（Ubuntu 22.04 root）：

```bash
apt update
apt install -y git nginx curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v && npm -v
nginx -v
```

示例目录：

```bash
/var/www/history-atlas
```

部署命令：

```bash
cd /var/www
git clone git@github.com:<your-name>/history-atlas.git
cd history-atlas
npm ci
npm run check
```

## Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/history-atlas/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

更新配置后：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 两种部署模式

### 模式 A（推荐）：服务器拉源码 + 服务器构建

适合服务器能正常访问 GitHub 与 npm registry。

```bash
cd /var/www/history-atlas
git pull
npm ci
npm run build     # 产物落在 /var/www/history-atlas/dist
sudo systemctl reload nginx
```

Nginx 的 `root` 直接指向仓库内的 `dist/`，不需要再拷贝文件。

### 模式 B：本地构建 + 上传 dist

适合服务器在国内网络下访问 GitHub / npm 慢，或不想在生产机装 Node 的场景。

本地：

```bash
npm run check                                    # 校验数据 + 构建
# 仅同步 dist 目录到服务器（注意末尾的 /，让 rsync 同步目录内容而不是目录本身）
rsync -avz --delete dist/ \
  user@your-server:/var/www/history-atlas/dist/
```

如果没有 rsync，也可以用 scp：

```bash
scp -r dist/* user@your-server:/var/www/history-atlas/dist/
```

服务器侧只需 Nginx + dist 目录，无需 Node / npm。

## 反向代理后端 API（可选，未来用）

如果后续在同一台机器上跑一个后端服务（例如 Node/Express 监听 `127.0.0.1:8080`，提供 `/api/...`），把 `server` 块改成：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/history-atlas/dist;
    index index.html;

    # 后端 API 走反向代理
    location /api/ {
        proxy_pass         http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # SPA fallback：未匹配到的路径全部回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

前端代码里通过 `VITE_API_BASE_URL=/api` 拼请求路径，开发与生产共用同一个相对前缀。

## HTTPS 证书（绑定域名后）

阿里云控制台已经把域名解析到服务器后，用 Let's Encrypt + certbot 一键签发：

```bash
apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo systemctl reload nginx
```

certbot 会自动改 Nginx 配置加上 443 listen、自动跳 80→443、自动注册续期 cron。验证：

```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

如果用阿里云自家的免费 SSL（域名服务里申请），下载下来的 `.pem` + `.key` 放到例如 `/etc/nginx/ssl/`，然后手工写 443 server 块：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/nginx/ssl/your-domain.pem;
    ssl_certificate_key /etc/nginx/ssl/your-domain.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /var/www/history-atlas/dist;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

`阿里云安全组` 记得放行 443 入站。

## 阿里云安全组与防火墙

控制台 → ECS → 安全组 → 入方向规则，至少放行：

| 协议 | 端口范围 | 授权对象 | 用途 |
|---|---|---|---|
| TCP | 22 | 你自己的 IP | SSH |
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |

服务器内的 `ufw`（Ubuntu）也要放行：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 外部网络依赖

当前地图仍依赖外部瓦片：

- CARTO dark basemap
- AWS elevation terrarium DEM tiles
- MapLibre glyphs

因此阿里云服务器部署后，用户浏览器仍需要能访问这些瓦片来源。后续如果要做更稳定的国内访问，应考虑自建瓦片或替换为国内可访问的地图服务。

## 发布前检查

每次发布前运行：

```bash
npm run check
```

浏览器手动验收：

- 地图能打开。
- 时间轴可拖动。
- 建筑列表不为 0。
- 搜索文明可打开信息卡。
- 筛选可展开并清除。
- 事件点击可定位文明。
- 对比最多 2 个。
