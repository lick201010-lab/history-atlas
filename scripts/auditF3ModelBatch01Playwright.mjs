import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const appUrl = process.env.F3_BATCH01_URL || 'http://127.0.0.1:4188/';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = Number(process.env.F3_BATCH01_CDP_PORT || 9231);
const outDir = path.join(process.cwd(), 'docs', 'model-qa');
const userDataDir = path.join(process.cwd(), '.claude-runs', 'cdp-f3-batch01');
const screenshotPath = path.join(outDir, 'f3-batch01-persepolis-500bce-immersive.png');
const manifestPath = path.join(outDir, 'f3-batch01-manifest.json');
const reportPath = path.join(outDir, 'F3_BATCH01_REPORT_2026-06-06.md');

const scene = {
  id: 'persepolis-500bce',
  targetId: 'persepolis',
  year: -500,
  camera: { center: [52.89, 29.94], zoom: 7.0, pitch: 64, bearing: -24 },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('error', reject);
  });
}

async function waitForCdpTarget() {
  const deadline = Date.now() + 30000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const targets = await fetchJson(`http://127.0.0.1:${debugPort}/json`);
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`Could not connect to Edge CDP target on port ${debugPort}: ${lastError?.message || 'timeout'}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', (event) => reject(new Error(event.message || 'CDP websocket error')), { once: true });
      this.ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.id && this.pending.has(message.id)) {
          const { resolve: complete, reject: fail } = this.pending.get(message.id);
          this.pending.delete(message.id);
          if (message.error) fail(new Error(`${message.error.message}: ${message.error.data || ''}`));
          else complete(message.result || {});
          return;
        }
        this.events.push(message);
      });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.ws?.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result.result?.value;
}

async function clickPoint(client, x, y) {
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

await mkdir(outDir, { recursive: true });
await rm(userDataDir, { recursive: true, force: true });

const edge = spawn(chromePath, [
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--disable-extensions',
  '--window-size=1440,900',
  appUrl,
], { stdio: 'ignore' });

let client;
try {
  const wsUrl = await waitForCdpTarget();
  client = new CdpClient(wsUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Log.enable');
  await client.send('Network.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send('Page.navigate', { url: appUrl });

  await evaluate(client, `new Promise((resolve, reject) => {
    const started = Date.now();
    function check() {
      if (document.querySelector('.maplibregl-canvas') && document.querySelector('input[type="range"]')) {
        resolve(true);
        return;
      }
      if (Date.now() - started > 60000) {
        reject(new Error('Map UI did not become ready'));
        return;
      }
      setTimeout(check, 250);
    }
    check();
  })`);

  const firstAudit = await evaluate(client, `(async () => {
    const slider = document.querySelector('input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(slider, '${scene.year}');
    else slider.value = '${scene.year}';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 700));

    const targetButton = document.querySelector('#building-list .item[data-id="${scene.targetId}"]');
    targetButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const inspect = document.querySelector('.landmark-inspect');
    const close = document.querySelector('.landmark-card-actions .territory-close');
    const inspectRect = inspect?.getBoundingClientRect();
    const closeRect = close?.getBoundingClientRect();
    const rectToObject = (rect) => rect ? ({
      left: Math.round(rect.left * 10) / 10,
      top: Math.round(rect.top * 10) / 10,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      centerX: Math.round((rect.left + rect.width / 2) * 10) / 10,
      centerY: Math.round((rect.top + rect.height / 2) * 10) / 10,
    }) : null;
    return {
      targetButtonFound: Boolean(targetButton),
      inspectButtonFound: Boolean(inspect),
      inspectRect: rectToObject(inspectRect),
      closeRect: rectToObject(closeRect),
      closeOverlapsInspectCenter: Boolean(inspectRect && closeRect &&
        inspectRect.left + inspectRect.width / 2 >= closeRect.left &&
        inspectRect.left + inspectRect.width / 2 <= closeRect.right &&
        inspectRect.top + inspectRect.height / 2 >= closeRect.top &&
        inspectRect.top + inspectRect.height / 2 <= closeRect.bottom),
    };
  })()`);

  if (firstAudit.inspectRect) {
    await clickPoint(client, firstAudit.inspectRect.centerX, firstAudit.inspectRect.centerY);
    await sleep(700);
  }

  const finalAudit = await evaluate(client, `(async () => {
    if (window._map) {
      window._map.jumpTo(${JSON.stringify(scene.camera)});
      window._map.resize();
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const modelStatus = await fetch(new URL('models/persepolis.glb', location.href).href, { cache: 'no-store' })
      .then((response) => response.status)
      .catch(() => 0);
    const map = window._map;
    const title = document.querySelector('.landmark-name')?.textContent?.trim() || null;
    const computed = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      return getComputedStyle(element).opacity;
    };
    return {
      bodyClass: document.body.className,
      cardOpen: Boolean(document.querySelector('.landmark-card')),
      immersive: document.body.classList.contains('landmark-immersive'),
      title,
      modelStatus,
      mapCenter: map ? map.getCenter().toArray().map((n) => Math.round(n * 1000) / 1000) : null,
      zoom: map ? Math.round(map.getZoom() * 100) / 100 : null,
      pitch: map ? Math.round(map.getPitch() * 100) / 100 : null,
      bearing: map ? Math.round(map.getBearing() * 100) / 100 : null,
      timelineOpacity: computed('.timeline'),
      infoPanelOpacity: computed('.info-panel'),
      warningText: document.querySelector('.map-warning')?.textContent?.trim() || null,
    };
  })()`);

  const screenshotResult = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(screenshotPath, Buffer.from(screenshotResult.data, 'base64'));

  const consoleMessages = client.events
    .filter((event) => event.method === 'Runtime.consoleAPICalled')
    .map((event) => ({
      type: event.params.type,
      text: (event.params.args || []).map((arg) => arg.value || arg.description || '').join(' '),
    }));
  const logEntries = client.events
    .filter((event) => event.method === 'Log.entryAdded')
    .map((event) => event.params.entry);
  const pageErrors = client.events
    .filter((event) => event.method === 'Runtime.exceptionThrown')
    .map((event) => event.params.exceptionDetails);
  const modelResponses = client.events
    .filter((event) => event.method === 'Network.responseReceived' && event.params.response.url.includes('/models/persepolis.glb'))
    .map((event) => ({ url: event.params.response.url, status: event.params.response.status }));
  const modelFailures = client.events
    .filter((event) => event.method === 'Network.loadingFailed' && event.params?.requestId)
    .map((event) => event.params)
    .filter((event) => modelResponses.some((response) => response.requestId === event.requestId));

  const seriousConsole = consoleMessages.filter((message) => ['error', 'assert'].includes(message.type));
  const seriousLogs = logEntries.filter((entry) => ['error'].includes(entry.level));
  const glbWarnings = [...consoleMessages, ...logEntries]
    .filter((entry) => String(entry.text || '').includes('[buildings] GLB load failed for persepolis'));

  const failures = [];
  if (!firstAudit.targetButtonFound) failures.push('persepolis building button was not available for -500');
  if (!firstAudit.inspectButtonFound) failures.push('landmark inspect button was not found');
  if (firstAudit.closeOverlapsInspectCenter) failures.push('close button overlaps the inspect button center');
  if (!finalAudit.cardOpen) failures.push('landmark card did not remain open after inspect click');
  if (!finalAudit.immersive) failures.push('immersive inspection mode did not activate after real pointer click');
  if (finalAudit.modelStatus !== 200) failures.push(`persepolis.glb fetch status ${finalAudit.modelStatus}`);
  if (pageErrors.length) failures.push(`page exceptions: ${pageErrors.length}`);
  if (seriousConsole.length) failures.push(`console errors: ${seriousConsole.length}`);
  if (seriousLogs.length) failures.push(`browser log errors: ${seriousLogs.length}`);
  if (glbWarnings.length) failures.push('persepolis GLB load warning');
  if (modelFailures.length) failures.push('persepolis GLB network failure');
  if (finalAudit.zoom < 6.5 || finalAudit.zoom > 7.5) failures.push(`unexpected zoom ${finalAudit.zoom}`);

  const manifest = {
    appUrl,
    generatedAt: new Date().toISOString(),
    scene,
    firstAudit,
    finalAudit,
    modelResponses,
    consoleMessages,
    logEntries,
    pageErrors,
    screenshot: screenshotPath,
    failures,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const report = [
    '# F3 Batch01 Model QA',
    '',
    'Scope: `persepolis` GLB coverage and selected map-view QA.',
    '',
    `App URL: ${appUrl}`,
    `Generated: ${manifest.generatedAt}`,
    '',
    '## Result',
    '',
    `- Failures: ${failures.length ? failures.join('; ') : 'none'}`,
    `- Model fetch status: ${finalAudit.modelStatus}`,
    `- Immersive mode: ${finalAudit.immersive}`,
    `- Real click overlap check: ${firstAudit.closeOverlapsInspectCenter ? 'failed' : 'passed'}`,
    `- Map view: center ${finalAudit.mapCenter?.join(', ')}, zoom ${finalAudit.zoom}, pitch ${finalAudit.pitch}, bearing ${finalAudit.bearing}`,
    '',
    '## Screenshot',
    '',
    `- \`${path.relative(process.cwd(), screenshotPath).replaceAll('\\', '/')}\``,
    '',
    '## Visual Notes',
    '',
    '- Batch01 adds a Persepolis miniature with terrace, stairs, Gate of All Nations, Apadana columns, palace slabs, and relief bands.',
    '- The model is accepted as F3 Batch01 GLB coverage only. The full F3 Gate remains incomplete until all 30 landmarks are A/B-grade.',
  ].join('\n');
  await writeFile(reportPath, `${report}\n`, 'utf8');

  console.log(JSON.stringify({
    manifest: manifestPath,
    report: reportPath,
    screenshots: [screenshotPath],
    failures,
  }, null, 2));

  if (failures.length) process.exitCode = 1;
} finally {
  client?.close();
  edge.kill();
}
