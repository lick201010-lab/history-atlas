import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const appUrl = process.env.F3_CORE10_URL || 'http://127.0.0.1:4188/';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = Number(process.env.F3_CORE10_CDP_PORT || 9237);
const outDir = path.join(process.cwd(), 'docs', 'model-qa');
const userDataDir = path.join(process.cwd(), '.claude-runs', 'cdp-f3-core10');
const manifestPath = path.join(outDir, 'f3-core10-manifest.json');
const reportPath = path.join(outDir, 'F3_CORE10_REVIEW_2026-06-06.md');

const scenes = [
  { id: 'hagia-sophia-1000', targetId: 'hagia-sophia', year: 1000, camera: { center: [28.98, 41.01], zoom: 6.8, pitch: 64, bearing: -18 }, screenshot: 'f3-core10-hagia-sophia-1000.png' },
  { id: 'forbidden-city-1600', targetId: 'forbidden-city', year: 1600, camera: { center: [116.39, 39.92], zoom: 7.45, pitch: 63, bearing: -35 }, screenshot: 'f3-core10-forbidden-city-1600.png' },
  { id: 'angkor-wat-1200', targetId: 'angkor-wat', year: 1200, camera: { center: [103.87, 13.41], zoom: 7.55, pitch: 62, bearing: -32 }, screenshot: 'f3-core10-angkor-wat-1200.png' },
  { id: 'pyramid-2000bce', targetId: 'pyramid', year: -2000, camera: { center: [31.13, 29.98], zoom: 8.1, pitch: 58, bearing: 42 }, screenshot: 'f3-core10-pyramid-2000bce.png' },
  { id: 'colosseum-100', targetId: 'colosseum', year: 100, camera: { center: [12.49, 41.89], zoom: 6.8, pitch: 64, bearing: -28 }, screenshot: 'f3-core10-colosseum-100.png' },
  { id: 'parthenon-400bce', targetId: 'parthenon', year: -400, camera: { center: [23.73, 37.97], zoom: 7.2, pitch: 64, bearing: -28 }, screenshot: 'f3-core10-parthenon-400bce.png' },
  { id: 'tajmahal-1700', targetId: 'tajmahal', year: 1700, camera: { center: [78.04, 27.17], zoom: 7.3, pitch: 62, bearing: -26 }, screenshot: 'f3-core10-tajmahal-1700.png' },
  { id: 'chichen-itza-900', targetId: 'chichen-itza', year: 900, camera: { center: [-88.57, 20.68], zoom: 7.75, pitch: 62, bearing: 26 }, screenshot: 'f3-core10-chichen-itza-900.png' },
  { id: 'great-wall-1600', targetId: 'great-wall', year: 1600, camera: { center: [116.02, 40.36], zoom: 7.55, pitch: 66, bearing: -38 }, screenshot: 'f3-core10-great-wall-1600.png' },
  { id: 'petra-100', targetId: 'petra', year: 100, camera: { center: [35.45, 30.33], zoom: 8.05, pitch: 62, bearing: 80 }, screenshot: 'f3-core10-petra-100.png' },
];

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

async function navigateAndWaitForApp(client) {
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
}

async function inspectScene(client, scene) {
  const prepared = await evaluate(client, `(async () => {
    const slider = document.querySelector('input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(slider, '${scene.year}');
    else slider.value = '${scene.year}';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const target = document.querySelector('#building-list .item[data-id="${scene.targetId}"]');
    target?.scrollIntoView({ block: 'center', inline: 'nearest' });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const rect = target?.getBoundingClientRect();
    return {
      targetButtonFound: Boolean(target),
      buttonRect: rect ? {
        centerX: Math.round((rect.left + rect.width / 2) * 10) / 10,
        centerY: Math.round((rect.top + rect.height / 2) * 10) / 10,
      } : null,
    };
  })()`);

  if (prepared.buttonRect) {
    await clickPoint(client, prepared.buttonRect.centerX, prepared.buttonRect.centerY);
    await sleep(1800);
  }

  const before = await evaluate(client, `(async () => {
    const inspect = document.querySelector('.landmark-inspect');
    const rect = inspect?.getBoundingClientRect();
    return {
      targetButtonFound: Boolean(document.querySelector('#building-list .item[data-id="${scene.targetId}"]')),
      buttonRect: ${JSON.stringify(prepared.buttonRect)},
      inspectButtonFound: Boolean(inspect),
      inspectRect: rect ? {
        centerX: Math.round((rect.left + rect.width / 2) * 10) / 10,
        centerY: Math.round((rect.top + rect.height / 2) * 10) / 10,
      } : null,
    };
  })()`);

  if (before.inspectRect) {
    await clickPoint(client, before.inspectRect.centerX, before.inspectRect.centerY);
    await sleep(700);
  }

  const after = await evaluate(client, `(async () => {
    if (window._map) {
      window._map.jumpTo(${JSON.stringify(scene.camera)});
      window._map.resize();
    }
    await new Promise((resolve) => setTimeout(resolve, 2600));
    const modelStatus = await fetch(new URL('models/${scene.targetId}.glb', location.href).href, { cache: 'no-store' })
      .then((response) => response.status)
      .catch(() => 0);
    const map = window._map;
    return {
      bodyClass: document.body.className,
      cardOpen: Boolean(document.querySelector('.landmark-card')),
      immersive: document.body.classList.contains('landmark-immersive'),
      title: document.querySelector('.landmark-name')?.textContent?.trim() || null,
      modelStatus,
      mapCenter: map ? map.getCenter().toArray().map((n) => Math.round(n * 1000) / 1000) : null,
      zoom: map ? Math.round(map.getZoom() * 100) / 100 : null,
      pitch: map ? Math.round(map.getPitch() * 100) / 100 : null,
      bearing: map ? Math.round(map.getBearing() * 100) / 100 : null,
      warningText: document.querySelector('.map-warning')?.textContent?.trim() || null,
    };
  })()`);

  const screenshotResult = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const screenshotPath = path.join(outDir, scene.screenshot);
  await writeFile(screenshotPath, Buffer.from(screenshotResult.data, 'base64'));
  return { scene, before, after, screenshot: screenshotPath };
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

  const results = [];
  for (const scene of scenes) {
    await navigateAndWaitForApp(client);
    results.push(await inspectScene(client, scene));
  }

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
    .filter((event) => event.method === 'Network.responseReceived' && /\/models\/(hagia-sophia|forbidden-city|angkor-wat|great-pyramid|colosseum|parthenon|taj-mahal|chichen-itza|great-wall|petra)\.glb/.test(event.params.response.url))
    .map((event) => ({ url: event.params.response.url, status: event.params.response.status }));

  const seriousConsole = consoleMessages.filter((message) => ['error', 'assert'].includes(message.type));
  const seriousLogs = logEntries.filter((entry) => ['error'].includes(entry.level));
  const glbWarnings = [...consoleMessages, ...logEntries]
    .filter((entry) => String(entry.text || '').includes('[buildings] GLB load failed'));

  const failures = [];
  for (const result of results) {
    if (!result.before.targetButtonFound) failures.push(`${result.scene.targetId}: building button missing`);
    if (!result.before.inspectButtonFound) failures.push(`${result.scene.targetId}: inspect button missing`);
    if (!result.after.cardOpen) failures.push(`${result.scene.targetId}: landmark card not open`);
    if (!result.after.immersive) failures.push(`${result.scene.targetId}: immersive mode not active`);
    if (result.after.modelStatus !== 200) failures.push(`${result.scene.targetId}: GLB status ${result.after.modelStatus}`);
  }
  if (pageErrors.length) failures.push(`page exceptions: ${pageErrors.length}`);
  if (seriousConsole.length) failures.push(`console errors: ${seriousConsole.length}`);
  if (seriousLogs.length) failures.push(`browser log errors: ${seriousLogs.length}`);
  if (glbWarnings.length) failures.push(`GLB load warnings: ${glbWarnings.length}`);

  const manifest = {
    appUrl,
    generatedAt: new Date().toISOString(),
    results,
    modelResponses,
    consoleMessages,
    logEntries,
    pageErrors,
    failures,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const report = [
    '# F3 Core 10 Model Regrade',
    '',
    'Scope: fixed map-view QA screenshots for the F3 core 10 landmarks.',
    '',
    `App URL: ${appUrl}`,
    `Generated: ${manifest.generatedAt}`,
    '',
    '## Mechanical Result',
    '',
    `- Failures: ${failures.length ? failures.join('; ') : 'none'}`,
    `- Scenes: ${results.map((result) => `${result.scene.targetId} status ${result.after.modelStatus}, immersive ${result.after.immersive}`).join('; ')}`,
    '',
    '## Screenshots',
    '',
    ...results.map((result) => `- \`${path.relative(process.cwd(), result.screenshot).replaceAll('\\', '/')}\``),
    '',
    '## Visual Grade Notes',
    '',
    '- Mechanical pass is not A-grade acceptance.',
    '- Codex must inspect the screenshots and assign A/B/rework labels before F3 can pass.',
    '- F3 full Gate remains incomplete until all core 10 pass A-grade map-view review.',
  ].join('\n');
  await writeFile(reportPath, `${report}\n`, 'utf8');

  console.log(JSON.stringify({
    manifest: manifestPath,
    report: reportPath,
    screenshots: results.map((result) => result.screenshot),
    failures,
  }, null, 2));

  if (failures.length) process.exitCode = 1;
} finally {
  client?.close();
  edge.kill();
}
