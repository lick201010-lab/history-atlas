import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const appUrl = process.env.F2_BATCH06_URL || 'http://127.0.0.1:4186/';
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
} catch {
  throw new Error('Playwright is required for this local QA script. Run with CODEX_NODE_MODULES pointing to the Codex bundled node_modules.');
}

const scenes = [
  {
    id: 'srivijaya-900',
    targetId: 'srivijaya',
    label: 'Srivijaya peak land-clipped island and strait network',
    year: 900,
    camera: { center: [104.5, -1.0], zoom: 4.35, pitch: 54, bearing: -8 },
  },
  {
    id: 'joseon-1500',
    targetId: 'joseon',
    label: 'Joseon mature Korean Peninsula footprint',
    year: 1500,
    camera: { center: [127.7, 38.2], zoom: 4.45, pitch: 54, bearing: -8 },
  },
  {
    id: 'yamato-japan-800',
    targetId: 'yamato-japan',
    label: 'Yamato/Ritsuryo main-island network',
    year: 800,
    camera: { center: [136.8, 36.0], zoom: 4.35, pitch: 54, bearing: -8 },
  },
  {
    id: 'ghana-900',
    targetId: 'ghana',
    label: 'Ghana Sahel and Senegal corridor',
    year: 900,
    camera: { center: [-9.3, 15.4], zoom: 4.5, pitch: 54, bearing: -8 },
  },
  {
    id: 'mali-1350',
    targetId: 'mali',
    label: 'Mali peak upper Niger, Senegambia, and Niger Bend corridors',
    year: 1350,
    camera: { center: [-6.4, 13.8], zoom: 4.25, pitch: 54, bearing: -8 },
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

page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
page.on('pageerror', (error) => pageErrors.push({ message: error.message, stack: error.stack }));
page.on('requestfailed', (request) => {
  failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || 'unknown' });
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
      renderedBoundaryIds: [...new Set(rendered.map((feature) => feature.properties?.id).filter(Boolean))].slice(0, 20),
      warningText: document.querySelector('.map-warning')?.textContent?.trim() || null,
    };
  }, scene);
  const screenshot = path.join(outDir, `f2-batch06-${scene.id}.png`);
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
  if (!capture.audit.targetActiveInPanel) failures.push(`${capture.id}: target ${capture.targetId} not active in panel`);
  if (!capture.audit.targetSelectedInPanel) failures.push(`${capture.id}: target ${capture.targetId} was not selected before capture`);
  if (capture.audit.targetRenderedCount < 1) failures.push(`${capture.id}: target ${capture.targetId} not rendered in audited map layers`);
  if (capture.audit.zoom < 4 || capture.audit.zoom > 5) failures.push(`${capture.id}: zoom ${capture.audit.zoom} outside required 4-5 range`);
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
const manifestPath = path.join(outDir, 'f2-batch06-manifest.json');
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const reportPath = path.join(outDir, 'F2_BATCH06_REPORT_2026-06-06.md');
const report = [
  '# F2 Batch06 Boundary QA',
  '',
  'Scope: `srivijaya`, `joseon`, `yamato-japan`, `ghana`, `mali`.',
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
  '- Boundaries are rough historical visualization, not academic GIS borders.',
  '- Srivijaya and Yamato/Joseon are land-clipped with local atlas-land-110m evidence to avoid ocean fills.',
  '- Ghana and Mali are corridor-style Sahel/Niger/Senegal outlines rather than rectangles.',
].join('\n');
await writeFile(reportPath, `${report}\n`, 'utf8');

console.log(JSON.stringify({
  manifest: manifestPath,
  report: reportPath,
  screenshots: captures.map((capture) => capture.screenshot),
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
