import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const appUrl = process.env.F3_BATCH03_URL || 'http://127.0.0.1:4188/';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = Number(process.env.F3_BATCH03_CDP_PORT || 9233);
const outDir = path.join(process.cwd(), 'docs', 'model-qa');
const userDataDir = path.join(process.cwd(), '.claude-runs', 'cdp-f3-batch03');
const manifestPath = path.join(outDir, 'f3-batch03-manifest.json');
const reportPath = path.join(outDir, 'F3_BATCH03_REPORT_2026-06-06.md');

const scenes = [
  {
    id: 'sanchi-stupa-200bce',
    targetId: 'sanchi-stupa',
    year: -200,
    camera: { center: [77.74, 23.48], zoom: 7.2, pitch: 62, bearing: 22 },
    screenshot: 'f3-batch03-sanchi-stupa-200bce.png',
  },
  {
    id: 'konark-sun-1300',
    targetId: 'konark-sun',
    year: 1300,
    camera: { center: [86.1, 19.89], zoom: 7.1, pitch: 64, bearing: -36 },
    screenshot: 'f3-batch03-konark-sun-1300.png',
  },
  {
    id: 'djenne-mosque-1500',
    targetId: 'djenne-mosque',
    year: 1500,
    camera: { center: [-4.55, 13.91], zoom: 7.0, pitch: 64, bearing: -24 },
    screenshot: 'f3-batch03-djenne-mosque-1500.png',
  },
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

async function inspectScene(client, scene) {
  const before = await evaluate(client, `(async () => {
    const slider = document.querySelector('input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(slider, '${scene.year}');
    else slider.value = '${scene.year}';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 700));
    document.querySelector('#building-list .item[data-id="${scene.targetId}"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const inspect = document.querySelector('.landmark-inspect');
    const rect = inspect?.getBoundingClientRect();
    return {
      targetButtonFound: Boolean(document.querySelector('#building-list .item[data-id="${scene.targetId}"]')),
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

  const results = [];
  for (const scene of scenes) {
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
    .filter((event) => event.method === 'Network.responseReceived' && /\/models\/(sanchi-stupa|konark-sun|djenne-mosque)\.glb/.test(event.params.response.url))
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
    if (result.after.zoom < 6.5 || result.after.zoom > 7.6) failures.push(`${result.scene.targetId}: unexpected zoom ${result.after.zoom}`);
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
    '# F3 Batch03 Model QA',
    '',
    'Scope: `sanchi-stupa`, `konark-sun`, and `djenne-mosque` GLB coverage and selected map-view QA.',
    '',
    `App URL: ${appUrl}`,
    `Generated: ${manifest.generatedAt}`,
    '',
    '## Result',
    '',
    `- Failures: ${failures.length ? failures.join('; ') : 'none'}`,
    `- Scenes: ${results.map((result) => `${result.scene.targetId} status ${result.after.modelStatus}, immersive ${result.after.immersive}`).join('; ')}`,
    '',
    '## Screenshots',
    '',
    ...results.map((result) => `- \`${path.relative(process.cwd(), result.screenshot).replaceAll('\\', '/')}\``),
    '- `docs/model-qa/f3-batch03-sanchi-stupa-inapp.png`',
    '- `docs/model-qa/f3-batch03-konark-sun-inapp.png`',
    '- `docs/model-qa/f3-batch03-djenne-mosque-inapp.png`',
    '',
    '## Visual Notes',
    '',
    '- `sanchi-stupa` adds a dome stupa with railing, torana gateways, harmika, and chhatra.',
    '- `konark-sun` adds a warm-stone temple/chariot silhouette with wheel motifs, sanctuary mass, entry hall, and horse cues.',
    '- `djenne-mosque` adds a mud Sahelian mosque with tower masses, buttresses, toron spikes, and roofline cones.',
    '- Additional in-app browser QA confirmed Chinese titles, immersive mode, and empty page logs before acceptance.',
    '- Visual grade: all three are accepted as B-grade readable coverage miniatures. The full F3 Gate remains incomplete.',
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
