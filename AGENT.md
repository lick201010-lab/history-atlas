# Agent Operating Notes

## Default Work Habit

For this project, every troubleshooting or delivery task should follow this loop:

1. Verify the current state before changing anything.
2. Identify the most likely cause with evidence.
3. Apply the smallest safe fix.
4. Re-verify after the fix.
5. Record any follow-up work that would make the setup more reliable.

When the issue touches deployment, networking, GitHub, Aliyun, Caddy, DNS, or local browser access, include the exact evidence gathered: command results, reachable/unreachable domains, active ports, and the final working URL.

## Current Deployment Preference

- Use GitHub as the source repository.
- Use the existing Aliyun server when practical.
- Prefer Caddy on the current server; do not introduce Nginx unless the user explicitly decides to migrate.
- Prefer local Windows build plus uploading `dist/` for this project because the current server has limited memory.

## Network Troubleshooting Note

If Google, Aliyun OAuth, or other login pages fail while the user says VPN is enabled:

1. Check whether the target domain resolves.
2. Check whether direct HTTPS works.
3. Check whether the local proxy port is listening, usually `127.0.0.1:7890` for Clash Verge.
4. Test the same target through the proxy.
5. If proxy test works but direct browser access fails, enable the Windows current-user proxy:

   ```powershell
   Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyEnable -Type DWord -Value 1
   Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -Name ProxyServer -Type String -Value '127.0.0.1:7890'
   ```

6. Re-test the target URL.

WinHTTP proxy sync may require administrator permission. Browser access usually only needs the current-user proxy setting.

## Incident Record: atlas.ckl.hk First Deployment

Date: 2026-05-25

Goal: deploy the local Vite history-atlas build to the existing Aliyun server used by the lottery project.

Verification before changes:

- DNS for `atlas.ckl.hk` resolved to `47.237.181.181` from local DNS, Google DNS, and Cloudflare DNS.
- `npm run check` passed locally: data validation passed and Vite production build completed.
- SSH to `root@47.237.181.181` succeeded.
- `/etc/caddy/Caddyfile` had no existing `atlas.ckl.hk` block.

Fix/deployment performed:

- Created `/opt/history-atlas/dist` on the server.
- Backed up `/etc/caddy/Caddyfile`.
- Added a dedicated Caddy site block:

  ```caddy
  atlas.ckl.hk {
      root * /opt/history-atlas/dist
      file_server
      try_files {path} /index.html
      encode gzip zstd
  }
  ```

- Uploaded local `dist/` with `scp`.
- Fixed static file permissions with `chmod -R a+rX /opt/history-atlas/dist`.
- Ran `caddy validate --config /etc/caddy/Caddyfile`.
- Reloaded Caddy with `systemctl reload caddy`.

Verification after changes:

- `https://atlas.ckl.hk` returned `200 OK`.
- Production HTML returned `<!doctype html>`.
- SPA fallback path returned `200 OK`.
- JS and CSS assets returned `200 OK`.
- Caddy logs showed Let's Encrypt authorization finalized and certificate obtained successfully for `atlas.ckl.hk`.

Follow-up improvement:

- `scp -r dist/*` leaves old hashed asset files on the server. This is acceptable for early MVP use because the static bundle is small. Later, replace it with `rsync --delete` or a small deployment script.

## Incident Record: Deploy Script Validation

Date: 2026-05-25

Goal: add and validate `npm run deploy` for local Windows deployment to `atlas.ckl.hk`.

Verification before accepting the script:

- Confirmed the script only targets `/opt/history-atlas/dist`.
- Confirmed it does not touch `/opt/lottery-analysis`.
- Confirmed it does not edit or reload Caddy.
- Ran the script for real instead of only reading it.

Issue found:

- The first run uploaded files successfully but failed during the curl homepage check.
- Root cause: PowerShell passed `$null` poorly to native `curl.exe -o`, which made curl argument parsing unstable.

Fix applied:

- Replaced `-o $null` with `-o NUL`.
- Quoted URL variables passed to `curl.exe`.

Verification after fix:

- `npm run deploy` completed successfully.
- Local `npm run check` passed during the deploy.
- `scp` upload succeeded.
- Remote `chmod -R a+rX /opt/history-atlas/dist` succeeded.
- `https://atlas.ckl.hk/` returned `200`.
- Random SPA fallback path returned `200`.
- Main JS asset returned `200`.

PowerShell note:

- For native Windows commands, prefer explicit Windows null output `NUL` over PowerShell `$null` when passing arguments to executables like `curl.exe`.
