import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const appUrl = process.env.F2_BATCH04_URL || 'http://127.0.0.1:4184/';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(process.cwd(), 'docs', 'boundary-qa');
const require = createRequire(process.env.CODEX_NODE_MODULES
  ? path.join(process.env.CODEX_NODE_MODULES, 'package.json')
  : import.meta.url);

let chromium;
try {
  const playwrightPackage = process.env.CODEX_NODE_MODULES
    ? path.join(process.env.CODEX_NODE_MODULES, 'playwright')
    : 'playwright';
  ({ chromium } = require(playwrightPackage));
} catch (error) {
  throw new Error('Playwright is required for this local QA script. Run with CODEX_NODE_MODULES pointing to the Codex bundled node_modules.');
}

const scenes = [
  {
    id: 'jin-280',
    targetId: 'jin',
    label: 'Jin peak after Western Jin unified China',
    year: 280,
    camera: { center: [113.5, 32.8], zoom: 4.35, pitch: 55, bearing: -8 },
  },
  {
    id: 'song-1160',
    targetId: 'song',
    label: 'Song Southern Song south-of-Yangtze phase',
    year: 1160,
    camera: { center: [113.6, 29.2], zoom: 4.45, pitch: 55, bearing: -8 },
  },
  {
    id: 'yuan-1300',
    targetId: 'yuan',
    label: 'Yuan peak China, Mongolia, Xiyu, Tibet, coast outline',
    year: 1300,
    camera: { center: [105.2, 38.3], zoom: 4.0, pitch: 54, bearing: -10 },
  },
  {
    id: 'qing-1765',
    targetId: 'qing',
    label: 'Qing peak Xinjiang, Mongolia, Northeast, Tibet, coast outline',
    year: 1765,
    camera: { center: [105.6, 38.8], zoom: 4.0, pitch: 54, bearing: -10 },
  },
  {
    id: 'prc-2020',
    targetId: 'prc',
    label: 'PRC contemporary China and contested-range illustrative outline',
    year: 2020,
    camera: { center: [105.5, 35.2], zoom: 4.05, pitch: 54, bearing: -9 },
  },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const consoleMessages = [];
const pageErrors = [];
const failedRequests = [];

page.on('console', (message) => {
  consoleMessages.push({ type: message.type(), text: message.text() });
});
page.on('pageerror', (error) => {
  pageErrors.push({ message: error.message, stack: error.stack });
});
page.on('requestfailed', (request) => {
  failedRequests.push({
    url: request.url(),
    failure: request.failure()?.errorText || 'unknown',
  });
});

await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => {
  const map = window._map;
  return Boolean(map && document.querySelector('.maplibregl-canvas') && document.querySelector('input[type="range"]') && map.getSource?.('dynasty-boundaries'));
}, { timeout: 60000 });

const captures = [];
for (const scene of scenes) {
  const audit = await page.evaluate(async (nextScene) => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(slider, String(nextScene.year));
      else slider.value = String(nextScene.year);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 450));

    const targetSelector = `.dynasty-item[data-id="${nextScene.targetId}"]`;
    const targetNode = document.querySelector(targetSelector);
    const targetButton = targetNode?.querySelector('.dynasty-item-main');
    if (targetButton) {
      targetButton.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    window._map.jumpTo(nextScene.camera);
    window._map.resize();
    const started = Date.now();
    await new Promise((resolve) => {
      function check() {
        if (window._map.areTilesLoaded?.() || Date.now() - started > 8000) resolve();
        else setTimeout(check, 250);
      }
      check();
    });
    const layers = [
      'dynasty-territory-fill',
      'dynasty-territory-glow',
      'dynasty-territory-casing',
      'dynasty-territory-line',
      'dynasty-territory-selected-fill',
    ].filter((layerId) => window._map.getLayer(layerId));
    const rendered = window._map.queryRenderedFeatures({ layers }) || [];
    const ids = [...new Set(rendered.map((feature) => feature.properties?.id).filter(Boolean))].slice(0, 20);
    const targetRenderedFeatures = rendered.filter((feature) => feature.properties?.id === nextScene.targetId);
    const activeListIds = [...document.querySelectorAll('.dynasty-item[data-id]')]
      .map((node) => node.getAttribute('data-id'))
      .filter(Boolean);
    return {
      mapCenter: window._map.getCenter().toArray().map((n) => Math.round(n * 1000) / 1000),
      zoom: Math.round(window._map.getZoom() * 100) / 100,
      pitch: Math.round(window._map.getPitch() * 100) / 100,
      bearing: Math.round(window._map.getBearing() * 100) / 100,
      tilesLoaded: window._map.areTilesLoaded?.() ?? false,
      activeListIds,
      targetActiveInPanel: activeListIds.includes(nextScene.targetId),
      targetSelectedInPanel: Boolean(document.querySelector(`${targetSelector}.is-selected`)),
      targetRenderedCount: targetRenderedFeatures.length,
      renderedBoundaryIds: ids,
      warningText: document.querySelector('.map-warning')?.textContent?.trim() || null,
    };
  }, scene);
  const screenshot = path.join(outDir, `f2-batch04-${scene.id}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  captures.push({ ...scene, audit, screenshot });
}

await browser.close();

const seriousConsole = consoleMessages.filter((message) => ['error', 'assert'].includes(message.type));
const nonCanceledFailures = failedRequests.filter((request) => !/net::ERR_ABORTED/.test(request.failure));
const failures = [];

if (pageErrors.length) failures.push(`page errors: ${pageErrors.length}`);
if (seriousConsole.length) failures.push(`console errors: ${seriousConsole.length}`);
if (nonCanceledFailures.length) failures.push(`request failures: ${nonCanceledFailures.length}`);
for (const capture of captures) {
  if (!capture.audit.targetActiveInPanel) {
    failures.push(`${capture.id}: target ${capture.targetId} not active in panel`);
  }
  if (!capture.audit.targetSelectedInPanel) {
    failures.push(`${capture.id}: target ${capture.targetId} was not selected before capture`);
  }
  if (capture.audit.targetRenderedCount < 1) {
    failures.push(`${capture.id}: target ${capture.targetId} not rendered in audited map layers`);
  }
  if (capture.audit.zoom < 4 || capture.audit.zoom > 5) {
    failures.push(`${capture.id}: zoom ${capture.audit.zoom} outside required 4-5 range`);
  }
}

const manifest = {
  appUrl,
  generatedAt: new Date().toISOString(),
  captures,
  consoleMessages,
  pageErrors,
  failedRequests,
  failures,
};
const manifestPath = path.join(outDir, 'f2-batch04-manifest.json');
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const reportPath = path.join(outDir, `f2-batch04-report-${new Date().toISOString().slice(0, 10)}.md`);
const report = [
  '# F2 Batch04 Boundary QA',
  '',
  'Scope: `jin`, `song`, `yuan`, `qing`, `prc`.',
  '',
  `App URL: ${appUrl}`,
  `Generated: ${manifest.generatedAt}`,
  '',
  '## Result',
  '',
  `- failures: ${JSON.stringify(failures)}`,
  '',
  '## Screenshots',
  '',
  ...captures.map((capture) => `- ${capture.id}: \`${path.relative(process.cwd(), capture.screenshot).replaceAll('\\', '/')}\` (zoom ${capture.audit.zoom})`),
  '',
  '## Notes',
  '',
  '- Boundaries are rough-refined illustrative ranges, not academic GIS borders.',
  '- Song QA uses the Southern Song phase to verify that north China is not fully painted through 1127-1279.',
  '- Yuan/Qing/PRC screenshots are zoom 4-5 views of large outlines; full extents still require panning at this zoom.',
].join('\n');
await writeFile(reportPath, `${report}\n`, 'utf8');

console.log(JSON.stringify({
  manifest: manifestPath,
  report: reportPath,
  screenshots: captures.map((capture) => capture.screenshot),
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
