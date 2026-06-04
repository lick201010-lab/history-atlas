import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const appUrl = process.env.RELEASE_SMOKE_URL || 'https://atlas.ckl.hk/';
const port = Number(process.env.RELEASE_SMOKE_PORT || 9361);
const root = process.cwd();
const userDataDir = path.join(root, '.claude-runs', 'chrome-release-smoke');
const outDir = path.join(root, 'docs', 'release-qa');

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
  if (msg.method === 'Network.loadingFailed') {
    failedRequests.push({
      url: msg.params?.requestId,
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

async function waitForApp(label) {
  const result = await evaluate(`new Promise((resolve) => {
    const started = Date.now();
    function check() {
      const map = window._map;
      const canvas = document.querySelector('.maplibregl-canvas');
      const slider = document.querySelector('input[type="range"]');
      const loading = document.querySelector('.map-loading');
      const ready = !!(map && canvas && slider && !loading);
      if (ready || Date.now() - started > 18000) {
        resolve({
          label: ${JSON.stringify(label)},
          title: document.title,
          url: location.href,
          ready,
          mapReady: !!map,
          canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
          slider: !!slider,
          loadingVisible: !!loading,
          viewport: { width: innerWidth, height: innerHeight },
          bodyClass: document.body.className,
          scroll: {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
          },
        });
        return;
      }
      setTimeout(check, 250);
    }
    check();
  })`);
  return result.result.value;
}

async function runViewport({ name, width, height, mobile }) {
  await cdp('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: mobile ? 2 : 1,
    mobile,
  });
  await cdp('Page.navigate', { url: appUrl });
  const ready = await waitForApp(`${name}-initial`);

  const interaction = await evaluate(`new Promise((resolve) => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      slider.value = '1250';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const status = document.querySelector('.info-status-bar');
    if (status && window.matchMedia('(max-width: 500px)').matches) status.click();

    setTimeout(() => {
      const row = document.querySelector('.dynasty-item[data-id="maya"] .dynasty-item-main');
      if (row) {
        row.scrollIntoView({ block: 'center', inline: 'nearest' });
        row.click();
      }
      setTimeout(() => {
        const territoryCard = document.querySelector('.territory-card');
        const landmarkCard = document.querySelector('.landmark-card');
        const title = document.querySelector('.territory-card .territory-name')?.textContent?.trim() || null;
        const yearText = document.querySelector('.timeline-year')?.textContent?.trim()
          || document.querySelector('.info-status-year')?.textContent?.trim()
          || document.querySelector('#year-big')?.textContent?.trim()
          || null;
        resolve({
          sliderFound: !!slider,
          mayaRowFound: !!row,
          territoryCard: !!territoryCard,
          landmarkCard: !!landmarkCard,
          loadingVisible: !!document.querySelector('.map-loading'),
          territoryTitle: title,
          yearText,
          bodyClass: document.body.className,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        });
      }, 1400);
    }, 900);
  })`);

  const audit = await evaluate(`(() => {
    const canvas = document.querySelector('.maplibregl-canvas');
    const territoryCard = document.querySelector('.territory-card');
    const rect = territoryCard?.getBoundingClientRect();
    return {
      canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
      territoryCardRect: rect ? {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      } : null,
      mapCenter: window._map?.getCenter?.().toArray?.().map((n) => Math.round(n * 1000) / 1000) || null,
      zoom: window._map ? Math.round(window._map.getZoom() * 100) / 100 : null,
      pitch: window._map?.getPitch?.() || null,
    };
  })()`);

  const screenshot = await cdp('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const screenshotPath = path.join(outDir, `release-${name}-1250-maya.png`);
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));

  return {
    name,
    ready,
    interaction: interaction.result.value,
    audit: audit.result.value,
    screenshot: screenshotPath,
  };
}

try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');

  const runs = [];
  runs.push(await runViewport({ name: 'desktop', width: 1440, height: 900, mobile: false }));
  runs.push(await runViewport({ name: 'mobile', width: 390, height: 844, mobile: true }));

  const appResponses = responses.filter((entry) => entry.url.includes('atlas.ckl.hk'));
  const badResponses = appResponses.filter((entry) => entry.status >= 400);
  const seriousConsole = consoleMessages.filter((entry) => ['error', 'assert'].includes(entry.type));
  const nonCanceledFailures = failedRequests.filter((entry) => !entry.canceled);
  const failures = [];

  for (const run of runs) {
    if (!run.ready.ready || !run.ready.mapReady || !run.ready.canvas || !run.ready.slider) {
      failures.push(`${run.name}: app did not become ready`);
    }
    if (!run.interaction.sliderFound) failures.push(`${run.name}: timeline slider missing`);
    if (!run.interaction.mayaRowFound) failures.push(`${run.name}: Maya row missing`);
    if (!run.interaction.territoryCard) failures.push(`${run.name}: territory card did not open`);
    if (run.interaction.landmarkCard) failures.push(`${run.name}: landmark card opened during civilization selection`);
    if (run.interaction.loadingVisible) failures.push(`${run.name}: loading overlay still visible`);
    if (run.interaction.territoryTitle !== '玛雅文明') {
      failures.push(`${run.name}: expected territory title 玛雅文明, got ${run.interaction.territoryTitle}`);
    }
    if (run.name === 'mobile' && run.interaction.horizontalOverflow) {
      failures.push('mobile: horizontal overflow detected');
    }
  }
  if (badResponses.length) failures.push(`bad app responses: ${badResponses.length}`);
  if (pageExceptions.length) failures.push(`page exceptions: ${pageExceptions.length}`);
  if (seriousConsole.length) failures.push(`console errors: ${seriousConsole.length}`);

  const manifest = {
    appUrl,
    generatedAt: new Date().toISOString(),
    runs,
    consoleMessages,
    seriousConsole,
    pageExceptions,
    nonCanceledFailures,
    badResponses,
    failures,
  };
  const manifestPath = path.join(outDir, 'release-smoke-manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify({
    appUrl,
    manifestPath,
    screenshots: runs.map((run) => run.screenshot),
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
