import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.join('docs', 'visual-qa', 'f1-visual-manifest.json');
const requiredCaptures = new Set([
  'f1-world-frame.png',
  'f1-open-ocean.png',
  'f1-mediterranean-boundaries.png',
  'f1-mobile.png',
]);

function fail(message) {
  console.error(`Visual foundation audit failed: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(manifestPath)) {
  fail(`missing ${manifestPath}`);
  process.exit();
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const captures = Array.isArray(manifest.captures) ? manifest.captures : [];
const seriousConsole = Array.isArray(manifest.seriousConsole) ? manifest.seriousConsole : [];

if (seriousConsole.length > 0) {
  fail(`serious console messages: ${seriousConsole.length}`);
}

for (const fileName of requiredCaptures) {
  const capture = captures.find((item) => item.fileName === fileName);
  if (!capture) {
    fail(`missing capture entry ${fileName}`);
    continue;
  }

  if (!fs.existsSync(capture.path)) {
    fail(`missing capture file ${capture.path}`);
  }

  if (!capture.audit?.canvas) {
    fail(`${fileName} has no MapLibre canvas`);
  }

  if (capture.audit?.bodyTheme !== 'dark') {
    fail(`${fileName} expected dark theme, got ${capture.audit?.bodyTheme || 'none'}`);
  }

  if (capture.audit?.warningText) {
    fail(`${fileName} still has a blocking map warning`);
  }

  if (!capture.audit?.mapRect?.width || !capture.audit?.mapRect?.height) {
    fail(`${fileName} missing map rect`);
  }
}

const mobile = captures.find((item) => item.fileName === 'f1-mobile.png');
if (mobile) {
  const infoRect = mobile.audit?.infoRect;
  if (!infoRect || infoRect.width > mobile.width || infoRect.x < 0) {
    fail('mobile info panel overflows the viewport');
  }
}

if (!process.exitCode) {
  console.log('Visual foundation audit passed.');
  console.log(`Captures: ${captures.map((item) => item.fileName).join(', ')}`);
}
