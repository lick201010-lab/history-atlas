import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const appUrl = process.env.F4_CONTENT_URL || 'http://127.0.0.1:4174/';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = Number(process.env.F4_CONTENT_CDP_PORT || 9248);
const outDir = path.join(process.cwd(), 'docs', 'content-qa');
const userDataDir = path.join(process.cwd(), '.claude-runs', 'cdp-f4-content-ui');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    this.consoleMessages = [];
    this.pageExceptions = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', (event) => reject(new Error(event.message || 'CDP websocket error')), { once: true });
      this.ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.method === 'Runtime.consoleAPICalled') {
          this.consoleMessages.push({
            type: message.params.type,
            text: message.params.args?.map((arg) => arg.value || arg.description || '').join(' '),
          });
        }
        if (message.method === 'Runtime.exceptionThrown') {
          this.pageExceptions.push(message.params.exceptionDetails);
        }
        if (message.id && this.pending.has(message.id)) {
          const { resolve: complete, reject: fail } = this.pending.get(message.id);
          this.pending.delete(message.id);
          if (message.error) fail(new Error(`${message.error.message}: ${message.error.data || ''}`));
          else complete(message.result || {});
        }
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

async function screenshot(client, filename) {
  const result = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const screenshotPath = path.join(outDir, filename);
  await writeFile(screenshotPath, Buffer.from(result.data, 'base64'));
  return screenshotPath;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await rm(userDataDir, { recursive: true, force: true });
  await mkdir(userDataDir, { recursive: true });

  const edge = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'about:blank',
  ], { stdio: 'ignore' });

  const client = new CdpClient(await waitForCdpTarget());
  await client.connect();
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Network.enable');
  await client.send('Page.navigate', { url: appUrl });

  const failures = [];
  const manifest = {
    appUrl,
    generatedAt: new Date().toISOString(),
    screenshots: [],
    audits: {},
  };

  await evaluate(client, `new Promise((resolve, reject) => {
    const started = Date.now();
    function check() {
      if (window._map && document.querySelector('.maplibregl-canvas') && document.querySelector('input[type="range"]')) {
        resolve(true);
        return;
      }
      if (Date.now() - started > 60000) reject(new Error('Map UI did not become ready'));
      else setTimeout(check, 250);
    }
    check();
  })`);

  manifest.audits.maya = await evaluate(client, `(async () => {
    const slider = document.querySelector('input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(slider, '1250');
    else slider.value = '1250';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 900));
    const row = document.querySelector('.dynasty-item[data-id="maya"] .dynasty-item-main');
    row?.scrollIntoView({ block: 'center', inline: 'nearest' });
    row?.click();
    await new Promise((resolve) => setTimeout(resolve, 1300));
    const card = document.querySelector('.territory-card');
    const text = card?.textContent || '';
    return {
      cardFound: Boolean(card),
      title: document.querySelector('.territory-card .territory-name')?.textContent?.trim() || null,
      hasEventSources: text.includes('来源'),
      hasBoundaryAccuracy: text.includes('边界精度'),
      hasReferenceList: Boolean(document.querySelector('.territory-reference-list')),
      textLength: text.length,
    };
  })()`);
  await evaluate(client, `(() => {
    const scroller = document.querySelector('.territory-card-inner') || document.querySelector('.territory-card');
    if (scroller) scroller.scrollTop = Math.round(scroller.scrollHeight * 0.55);
    return true;
  })()`);
  await sleep(300);
  manifest.screenshots.push(await screenshot(client, 'f4-desktop-maya-sources.png'));

  manifest.audits.landmark = await evaluate(client, `(async () => {
    const slider = document.querySelector('input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(slider, '1000');
    else slider.value = '1000';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 900));
    const item = document.querySelector('#building-list .item[data-id="hagia-sophia"]');
    item?.scrollIntoView({ block: 'center', inline: 'nearest' });
    item?.click();
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const card = document.querySelector('.landmark-card');
    const text = card?.textContent || '';
    return {
      itemFound: Boolean(item),
      cardFound: Boolean(card),
      title: document.querySelector('.landmark-card .landmark-name')?.textContent?.trim() || null,
      hasSourceNote: Boolean(document.querySelector('.landmark-source')),
      hasReferences: Boolean(document.querySelector('.landmark-reference-list')),
      textLength: text.length,
    };
  })()`);
  await evaluate(client, `(() => {
    const scroller = document.querySelector('.landmark-card');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
    return true;
  })()`);
  await sleep(300);
  manifest.screenshots.push(await screenshot(client, 'f4-desktop-hagia-sophia-references.png'));

  if (!manifest.audits.maya.cardFound) failures.push('Maya territory card was not opened');
  if (!manifest.audits.maya.hasEventSources) failures.push('Maya card did not show event sources');
  if (!manifest.audits.maya.hasBoundaryAccuracy) failures.push('Maya card did not show boundary accuracy');
  if (!manifest.audits.maya.hasReferenceList) failures.push('Maya card did not show reference list');
  if (!manifest.audits.landmark.itemFound) failures.push('Hagia Sophia list item was not found');
  if (!manifest.audits.landmark.cardFound) failures.push('Hagia Sophia landmark card was not opened');
  if (!manifest.audits.landmark.hasSourceNote) failures.push('Landmark card did not show source note');
  if (!manifest.audits.landmark.hasReferences) failures.push('Landmark card did not show references');

  const consoleErrors = client.consoleMessages.filter((message) => message.type === 'error');
  if (consoleErrors.length) failures.push(`Console errors: ${consoleErrors.length}`);
  if (client.pageExceptions.length) failures.push(`Page exceptions: ${client.pageExceptions.length}`);

  manifest.failures = failures;
  manifest.consoleErrors = consoleErrors;
  manifest.pageExceptions = client.pageExceptions;

  await writeFile(path.join(outDir, 'f4-content-ui-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  client.close();
  edge.kill();

  console.log(JSON.stringify(manifest, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
