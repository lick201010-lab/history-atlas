import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const appUrl = process.env.VISUAL_FOUNDATION_URL || 'https://atlas.ckl.hk/';
const port = Number(process.env.VISUAL_FOUNDATION_PORT || 9362);
const root = process.cwd();
const userDataDir = path.join(root, '.claude-runs', 'chrome-visual-foundation');
const outDir = path.join(root, 'docs', 'visual-qa');

const scenes = [
  {
    id: 'himalaya-relief',
    label: 'Himalaya relief clarity',
    year: 700,
    camera: { center: [86.9, 28.2], zoom: 5.05, pitch: 65, bearing: -35 },
    waitMs: 9000,
  },
  {
    id: 'open-ocean-flatness',
    label: 'Open ocean flatness',
    year: 1250,
    camera: { center: [145, 8], zoom: 3.35, pitch: 62, bearing: -20 },
    waitMs: 7000,
  },
  {
    id: 'mediterranean-boundary-readability',
    label: 'Mediterranean terrain and boundary readability',
    year: 600,
    camera: { center: [28.5, 38.7], zoom: 4.25, pitch: 58, bearing: 28 },
    waitMs: 8000,
  },
  {
    id: 'central-america-readability',
    label: 'Central America coast and territory readability',
    year: 1250,
    camera: { center: [-89.1, 17.3], zoom: 4.75, pitch: 58, bearing: 0 },
    waitMs: 7000,
  },
];

await mkdir(userDataDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const chromeProc = spawn(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`);
  return res.json();
}

async function waitForCdp() {
  for (let i = 0; i < 80; i += 1) {
    try {
      await getJson(`http://127.0.0.1:${port}/json/version`);
      return;
    } catch {
      await sleep(250);
    }
  }
  throw new Error('Chrome CDP did not start');
}

await waitForCdp();
const target = await getJson(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(appUrl)}`, { method: 'PUT' });
const ws = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
const consoleMessages = [];
const pageExceptions = [];
const failedRequests = [];
const responses = [];
const requests = new Map();

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    consoleMessages.push({
      type: msg.params.type,
      text: msg.params.args?.map((arg) => arg.value || arg.description || '').join(' '),
    });
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    pageExceptions.push({
      text: msg.params.exceptionDetails?.text,
      description: msg.params.exceptionDetails?.exception?.description,
    });
  }
  if (msg.method === 'Network.requestWillBeSent') {
    requests.set(msg.params.requestId, msg.params.request?.url || '');
  }
  if (msg.method === 'Network.loadingFailed') {
    failedRequests.push({
      url: requests.get(msg.params.requestId) || msg.params.requestId,
      errorText: msg.params.errorText,
      canceled: msg.params.canceled,
    });
  }
  if (msg.method === 'Network.responseReceived') {
    const { response } = msg.params;
    responses.push({
      url: response.url,
      status: response.status,
      mimeType: response.mimeType,
    });
  }
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});

await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

function cdp(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression, options = {}) {
  return cdp('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression,
    ...options,
  });
}

async function waitForApp() {
  const result = await evaluate(`new Promise((resolve) => {
    const started = Date.now();
    function check() {
      const map = window._map;
      const canvas = document.querySelector('.maplibregl-canvas');
      const slider = document.querySelector('input[type="range"]');
      const loading = document.querySelector('.map-loading');
      const ready = !!(map && canvas && slider && !loading);
      if (ready || Date.now() - started > 20000) {
        resolve({
          title: document.title,
          url: location.href,
          ready,
          mapReady: !!map,
          canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
          slider: !!slider,
          loadingVisible: !!loading,
          viewport: { width: innerWidth, height: innerHeight },
          bodyClass: document.body.className,
          theme: document.body.dataset.theme || document.documentElement.dataset.theme || null,
        });
        return;
      }
      setTimeout(check, 250);
    }
    check();
  })`);
  return result.result.value;
}

async function setScene(scene) {
  const result = await evaluate(`new Promise((resolve) => {
    const scene = ${JSON.stringify(scene)};
    const expectedYearText = scene.year < 0 ? '公元前 ' + Math.abs(scene.year) : '公元 ' + scene.year;
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(slider, String(scene.year));
      else slider.value = String(scene.year);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (window._map) {
      window._map.jumpTo(scene.camera);
      window._map.resize();
    }
    const started = Date.now();
    function finish() {
      const tilesStable = window._map?.areTilesLoaded?.() ?? false;
      const timelineYear = document.querySelector('#year-display')?.textContent?.trim() || null;
      const infoYear = document.querySelector('#year-big')?.textContent?.trim() || null;
      const yearStable = timelineYear === expectedYearText && infoYear === expectedYearText;
      if ((tilesStable && yearStable) || Date.now() - started > (scene.waitMs || 7000)) {
        resolve({
          expectedYearText,
          timelineYear,
          infoYear,
          yearStable,
          canvasCount: document.querySelectorAll('canvas').length,
          mapCenter: window._map?.getCenter?.().toArray?.().map((n) => Math.round(n * 1000) / 1000) || null,
          zoom: window._map ? Math.round(window._map.getZoom() * 100) / 100 : null,
          pitch: window._map ? Math.round(window._map.getPitch() * 100) / 100 : null,
          bearing: window._map ? Math.round(window._map.getBearing() * 100) / 100 : null,
          tilesStable,
          loadingVisible: !!document.querySelector('.map-loading'),
          warningVisible: !!document.querySelector('.map-warning'),
          warningText: document.querySelector('.map-warning')?.textContent?.trim() || null,
        });
      } else {
        setTimeout(finish, 250);
      }
    }
    finish();
  })`);
  return result.result.value;
}

try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  await cdp('Page.navigate', { url: appUrl });

  const ready = await waitForApp();
  const captures = [];

  for (const scene of scenes) {
    const audit = await setScene(scene);
    const screenshot = await cdp('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const screenshotPath = path.join(outDir, `foundation-${scene.id}.png`);
    await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    captures.push({
      ...scene,
      audit,
      screenshot: screenshotPath,
    });
  }

  const appResponses = responses.filter((entry) => entry.url.includes('atlas.ckl.hk'));
  const badResponses = appResponses.filter((entry) => entry.status >= 400);
  const seriousConsole = consoleMessages.filter((entry) => ['error', 'assert'].includes(entry.type));
  const nonCanceledFailures = failedRequests.filter((entry) => !entry.canceled);
  const failures = [];

  if (!ready.ready || !ready.mapReady || !ready.canvas || !ready.slider) {
    failures.push('app did not become ready');
  }
  if (badResponses.length) failures.push(`bad app responses: ${badResponses.length}`);
  if (pageExceptions.length) failures.push(`page exceptions: ${pageExceptions.length}`);
  if (seriousConsole.length) failures.push(`console errors: ${seriousConsole.length}`);
  if (nonCanceledFailures.length) failures.push(`non-canceled network failures: ${nonCanceledFailures.length}`);

  const manifest = {
    appUrl,
    generatedAt: new Date().toISOString(),
    ready,
    captures,
    consoleMessages,
    seriousConsole,
    pageExceptions,
    nonCanceledFailures,
    badResponses,
    failures,
  };
  const manifestPath = path.join(outDir, 'visual-foundation-manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify({
    appUrl,
    manifestPath,
    screenshots: captures.map((capture) => capture.screenshot),
    failures,
    badResponses: badResponses.length,
    pageExceptions: pageExceptions.length,
    consoleErrors: seriousConsole.length,
    nonCanceledFailures: nonCanceledFailures.length,
  }, null, 2));

  if (failures.length) process.exitCode = 1;
} finally {
  try { ws.close(); } catch {}
  chromeProc.kill();
}
