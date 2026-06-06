import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const appUrl = process.env.F2_BATCH07_URL || 'http://127.0.0.1:4187/';
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
    id: 'songhai-1520',
    targetId: 'songhai',
    label: 'Songhai Askia-era Niger Bend and Sahel corridors',
    year: 1520,
    camera: { center: [1.2, 16.0], zoom: 4.25, pitch: 54, bearing: -8 },
  },
  {
    id: 'british-empire-india-1900',
    targetId: 'british-empire',
    label: 'British Empire peak around India and Indian Ocean nodes',
    year: 1900,
    camera: { center: [80.0, 20.0], zoom: 4.05, pitch: 52, bearing: -8 },
  },
  {
    id: 'british-empire-isles-1900',
    targetId: 'british-empire',
    label: 'British Empire peak around British Isles',
    year: 1900,
    camera: { center: [-2.5, 54.5], zoom: 4.35, pitch: 52, bearing: -8 },
  },
  {
    id: 'united-states-2020',
    targetId: 'united-states',
    label: 'United States modern contiguous footprint',
    year: 2020,
    camera: { center: [-98.5, 38.5], zoom: 4.05, pitch: 52, bearing: -8 },
  },
  {
    id: 'overview-global-1900',
    targetId: 'british-empire',
    label: 'Final F2 global overview at British imperial peak',
    year: 1900,
    overview: true,
    camera: { center: [18, 18], zoom: 1.75, pitch: 28, bearing: 0 },
  },
  {
    id: 'overview-world-2020',
    targetId: 'united-states',
    label: 'Final F2 global overview in modern timeline',
    year: 2020,
    overview: true,
    camera: { center: [5, 20], zoom: 1.65, pitch: 28, bearing: 0 },
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
      renderedBoundaryIds: [...new Set(rendered.map((feature) => feature.properties?.id).filter(Boolean))].slice(0, 30),
      warningText: document.querySelector('.map-warning')?.textContent?.trim() || null,
    };
  }, scene);
  const screenshot = path.join(outDir, `f2-batch07-${scene.id}.png`);
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
  if (!capture.overview && capture.audit.targetRenderedCount < 1) {
    failures.push(`${capture.id}: target ${capture.targetId} not rendered in audited map layers`);
  }
  if (capture.overview && capture.audit.renderedBoundaryIds.length < 1) {
    failures.push(`${capture.id}: no boundaries rendered in overview scene`);
  }
  if (!capture.overview && (capture.audit.zoom < 4 || capture.audit.zoom > 5)) {
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
const manifestPath = path.join(outDir, 'f2-batch07-manifest.json');
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const reportPath = path.join(outDir, 'F2_BATCH07_REPORT_2026-06-06.md');
const report = [
  '# F2 Batch07 Boundary QA',
  '',
  'Scope: `songhai`, `british-empire`, `united-states`, plus final overview scenes.',
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
  '- British Empire uses multi-part land-clipped blocks; the overview scenes intentionally zoom out below 4 to inspect global context.',
  '- Songhai uses Niger/Sahel corridor logic rather than a Sahara rectangle.',
  '- United States uses separate land-clipped contiguous, Alaska, and Hawaii components for modern coverage.',
].join('\n');
await writeFile(reportPath, `${report}\n`, 'utf8');

console.log(JSON.stringify({
  manifest: manifestPath,
  report: reportPath,
  screenshots: captures.map((capture) => capture.screenshot),
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
