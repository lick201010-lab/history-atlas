# ============================================================================
#  history-atlas · 一键部署脚本（PowerShell, Windows）
# ----------------------------------------------------------------------------
#  - 本地：npm run check（数据校验 + Vite 构建）
#  - 本地：检查 dist/index.html 存在
#  - 上传：scp -r dist/*  ->  root@47.237.181.181:/opt/history-atlas/dist/
#  - 远端：chmod -R a+rX /opt/history-atlas/dist
#  - 校验：HEAD https://atlas.ckl.hk/
#  - 校验：HEAD https://atlas.ckl.hk/<random>     (SPA fallback)
#  - 校验：GET https://atlas.ckl.hk/assets/<hashed-js/css>（所有 JS/CSS 分块）
# ----------------------------------------------------------------------------
#  本脚本永远不动 /opt/lottery-analysis；不 reload Caddy；不动 Caddyfile。
#  调用方式：npm run deploy
# ============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---- 配置 -------------------------------------------------------------------
$RemoteHost   = 'root@47.237.181.181'
$RemoteDir    = '/opt/history-atlas/dist'
$LiveUrl      = 'https://atlas.ckl.hk'
$ProjectRoot  = Resolve-Path (Join-Path $PSScriptRoot '..')
$DistDir      = Join-Path $ProjectRoot 'dist'

# ---- UTF-8 输出，避免中文乱码 -----------------------------------------------
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# ---- 工具函数 ---------------------------------------------------------------
function Write-Section($title) {
    Write-Host ''
    Write-Host ('━' * 64) -ForegroundColor DarkGray
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host ('━' * 64) -ForegroundColor DarkGray
}

function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "  · $msg" -ForegroundColor Gray  }
function Write-Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Write-Fail($msg) {
    Write-Host "  ✗ $msg" -ForegroundColor Red
    Write-Host ''
    Write-Host '部署已中止。' -ForegroundColor Red
    exit 1
}

function Require-Cmd($cmd) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if (-not $found) { Write-Fail "找不到命令：$cmd（Windows 10+ 应自带 OpenSSH + curl，请检查 PATH）" }
}

# ---- 启动横幅 ---------------------------------------------------------------
$startedAt = Get-Date
Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════════════╗' -ForegroundColor DarkCyan
Write-Host '║         history-atlas · 一键部署到 atlas.ckl.hk              ║' -ForegroundColor DarkCyan
Write-Host '╚══════════════════════════════════════════════════════════════╝' -ForegroundColor DarkCyan
Write-Info "项目目录   : $ProjectRoot"
Write-Info "远端主机   : $RemoteHost"
Write-Info "远端目录   : $RemoteDir"
Write-Info "线上地址   : $LiveUrl"
Write-Info "开始时间   : $startedAt"

# ---- 0. 检查工具 ------------------------------------------------------------
Write-Section '[0/7] 检查本地工具'
Require-Cmd 'npm'
Require-Cmd 'scp'
Require-Cmd 'ssh'
Require-Cmd 'curl'
Write-Ok 'npm / scp / ssh / curl 全部就绪'

Set-Location $ProjectRoot

# ---- 1. 数据校验 + 构建 -----------------------------------------------------
Write-Section '[1/7] 运行 npm run check（数据校验 + 生产构建）'
& npm run check
if ($LASTEXITCODE -ne 0) { Write-Fail 'npm run check 失败，先在本地修复再发版' }
Write-Ok 'npm run check 通过'

# ---- 2. 确认 dist/index.html 存在 ------------------------------------------
Write-Section '[2/7] 确认构建产物 dist/index.html'
$indexPath = Join-Path $DistDir 'index.html'
if (-not (Test-Path $indexPath)) { Write-Fail "构建产物缺失：$indexPath 不存在" }
$indexSize = (Get-Item $indexPath).Length
Write-Ok "dist/index.html 存在（$indexSize 字节）"

# 顺便列出 assets 目录里的主要文件，便于后面 asset 校验
$assetsDir = Join-Path $DistDir 'assets'
if (-not (Test-Path $assetsDir)) { Write-Fail "构建产物缺失：$assetsDir 目录不存在" }
$mainJs = Get-ChildItem $assetsDir -Filter 'index-*.js' | Select-Object -First 1
if (-not $mainJs) { Write-Fail '在 dist/assets/ 下找不到 index-*.js' }
Write-Ok "主 JS：assets/$($mainJs.Name)（$([math]::Round($mainJs.Length/1KB, 1)) KB）"
$assetFiles = Get-ChildItem $assetsDir -File | Where-Object { $_.Extension -in '.js', '.css' } | Sort-Object Name
if (-not $assetFiles.Count) { Write-Fail '在 dist/assets/ 下找不到需要校验的 JS/CSS 资源' }
Write-Info "待校验资源：$($assetFiles.Count) 个 JS/CSS 分块"

# ---- 3. 上传 dist 到服务器 --------------------------------------------------
Write-Section '[3/7] scp 上传 dist 到服务器'
Write-Info "scp -r dist/* $RemoteHost`:$RemoteDir/"

# 用 cmd.exe 包一层，让 scp 的星号在 Windows 不被 PowerShell 提前展开
$scpCmd = "scp -r `"$DistDir\*`" `"$RemoteHost`:$RemoteDir/`""
& cmd.exe /c $scpCmd
if ($LASTEXITCODE -ne 0) { Write-Fail 'scp 上传失败，检查 SSH key、远端目录是否存在 /opt/history-atlas/dist' }
Write-Ok 'dist 全部文件已上传'

# ---- 4. 修复远端权限 --------------------------------------------------------
Write-Section '[4/7] 修复远端文件权限（chmod -R a+rX）'
Write-Info "ssh $RemoteHost 'chmod -R a+rX $RemoteDir'"
& ssh $RemoteHost "chmod -R a+rX $RemoteDir"
if ($LASTEXITCODE -ne 0) { Write-Fail '远端 chmod 失败' }
Write-Ok '远端权限已修复（所有用户可读 / 目录可遍历）'

# ---- 5. 验收：首页 ---------------------------------------------------------
Write-Section '[5/7] 校验线上首页'
$homeUrl = "$LiveUrl/"
Write-Info "curl -I $homeUrl"
$homeProbe = & curl.exe -sS -o NUL -w '%{http_code}|%{content_type}' -I --max-time 15 "$homeUrl" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "无法访问 $homeUrl（curl 返回非零）" }
$parts = $homeProbe -split '\|'
$homeStatus = $parts[0]
$homeCtype  = if ($parts.Count -gt 1) { $parts[1] } else { '' }
Write-Info "HTTP $homeStatus  Content-Type: $homeCtype"
if ($homeStatus -ne '200') { Write-Fail "首页 HTTP 状态非 200（实际：$homeStatus）" }
if ($homeCtype -notmatch 'text/html') { Write-Warn "首页 Content-Type 不是 text/html（$homeCtype）" }
Write-Ok '首页 200 OK'

# ---- 6. 验收：SPA fallback --------------------------------------------------
Write-Section '[6/7] 校验 SPA fallback（随机路径应回退到 index.html）'
$randomPath = '/__check_' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$fallbackUrl = "$LiveUrl$randomPath"
Write-Info "curl -I $fallbackUrl"
$fbProbe = & curl.exe -sS -o NUL -w '%{http_code}|%{content_type}' -I --max-time 15 "$fallbackUrl" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "无法访问 $fallbackUrl" }
$parts = $fbProbe -split '\|'
$fbStatus = $parts[0]
$fbCtype  = if ($parts.Count -gt 1) { $parts[1] } else { '' }
Write-Info "HTTP $fbStatus  Content-Type: $fbCtype"
if ($fbStatus -ne '200') { Write-Fail "SPA fallback 失败：HTTP $fbStatus（Caddyfile 里 try_files {path} /index.html 配置是否生效？）" }
if ($fbCtype -notmatch 'text/html') { Write-Warn "SPA fallback Content-Type 不是 HTML（$fbCtype）" }
Write-Ok 'SPA fallback 200 OK，未匹配路径回退到 index.html'

# ---- 7. 验收：assets ------------------------------------------------------
Write-Section '[7/7] 校验线上 assets'
foreach ($asset in $assetFiles) {
    $assetUrl = "$LiveUrl/assets/$($asset.Name)"
    Write-Info "curl $assetUrl"
    $asProbe = & curl.exe -sS -o NUL -w '%{http_code}|%{content_type}|%{size_download}' --max-time 30 -H 'Accept-Encoding: gzip' "$assetUrl" 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Fail "无法访问 $assetUrl" }
    $parts = $asProbe -split '\|'
    $asStatus = $parts[0]
    $asCtype  = if ($parts.Count -gt 1) { $parts[1] } else { '' }
    $asSize   = if ($parts.Count -gt 2) { [int]$parts[2] } else { 0 }
    Write-Info "$($asset.Name) → HTTP $asStatus  Content-Type: $asCtype  Size: $asSize bytes"
    if ($asStatus -ne '200') { Write-Fail "资源访问失败：$($asset.Name) HTTP $asStatus" }
    if ($asset.Extension -eq '.js' -and $asCtype -notmatch 'javascript') {
        Write-Warn "$($asset.Name) Content-Type 异常（$asCtype）"
    }
    if ($asset.Extension -eq '.css' -and $asCtype -notmatch 'text/css') {
        Write-Warn "$($asset.Name) Content-Type 异常（$asCtype）"
    }
}
Write-Ok "线上 JS/CSS 资源全部 200 OK（$($assetFiles.Count) 个）"

# ---- 完成横幅 --------------------------------------------------------------
$elapsed = (Get-Date) - $startedAt
Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════════════╗' -ForegroundColor Green
Write-Host '║                       部署完成 ✓                             ║' -ForegroundColor Green
Write-Host '╚══════════════════════════════════════════════════════════════╝' -ForegroundColor Green
Write-Host ''
Write-Info "线上地址 : $LiveUrl"
Write-Info "总耗时   : $([math]::Round($elapsed.TotalSeconds, 1)) 秒"
Write-Host ''
Write-Host '建议手动验收：' -ForegroundColor Cyan
Write-Host '  - 浏览器打开 ' -NoNewline; Write-Host $LiveUrl -ForegroundColor Yellow
Write-Host '  - 拖动时间轴、点击边界、检查信息卡、加入对比'
Write-Host '  - 按 docs/ACCEPTANCE.md 走完整清单'
Write-Host ''
