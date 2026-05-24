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

- Node.js 18+，建议 Node.js 20 LTS
- Git
- Nginx

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
