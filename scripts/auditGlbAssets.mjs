import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODELS_DIR = path.join(ROOT, 'public', 'models');
const BUILDING_LAYER = path.join(ROOT, 'src', 'map', 'createBuildingLayer.js');
const LANDMARKS_PATH = path.join(ROOT, 'src', 'data', 'landmarks.json');
const REPORT_PATH = path.join(ROOT, 'docs', 'GLB_ASSET_BASELINE.md');

const TARGET_KB = 1536;
const HARD_KB = 3072;
const TARGET_TRIANGLES = 20000;
const HARD_TRIANGLES = 35000;
const MIN_Z_TOLERANCE = -0.01;

function parseObjectBlock(source, name) {
  const start = source.indexOf(`const ${name} = {`);
  if (start === -1) throw new Error(`Cannot find ${name} in createBuildingLayer.js`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`Cannot parse ${name} block`);
}

function parseGlbOverrides(source) {
  const block = parseObjectBlock(source, 'ID_GLB_OVERRIDES');
  const entries = [];
  const re = /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$-]*))\s*:\s*`\$\{GLB_BASE\}([^`]+)`\s*,?\s*$/gm;
  let match = re.exec(block);
  while (match) {
    const id = match[1] || match[2] || match[3];
    entries.push({ id, file: match[4].split('?')[0] });
    match = re.exec(block);
  }
  return entries;
}

function parseOrientationOverrides(source) {
  const block = parseObjectBlock(source, 'ID_GLB_ORIENTATION_OVERRIDES');
  const ids = new Set();
  const re = /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$-]*))\s*:\s*GLB_ORIENT_ZUP\s*,?\s*$/gm;
  let match = re.exec(block);
  while (match) {
    ids.add(match[1] || match[2] || match[3]);
    match = re.exec(block);
  }
  return ids;
}

function readJsonChunk(buffer, file) {
  if (buffer.length < 20) throw new Error(`${file}: too small to be a GLB`);
  if (buffer.toString('utf8', 0, 4) !== 'glTF') throw new Error(`${file}: invalid GLB magic`);
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`${file}: unsupported GLB version ${version}`);
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) {
    throw new Error(`${file}: declared length ${declaredLength} differs from file length ${buffer.length}`);
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + chunkLength;
    if (dataEnd > buffer.length) throw new Error(`${file}: chunk overflows file`);
    if (chunkType === 0x4e4f534a) {
      return JSON.parse(buffer.toString('utf8', dataStart, dataEnd).trim());
    }
    offset = dataEnd;
  }
  throw new Error(`${file}: missing JSON chunk`);
}

function getPrimitiveStats(json) {
  let primitives = 0;
  let vertices = 0;
  let triangles = 0;
  const bounds = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };

  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      primitives += 1;
      const posIndex = primitive.attributes?.POSITION;
      const pos = Number.isInteger(posIndex) ? json.accessors?.[posIndex] : null;
      if (pos) {
        vertices += pos.count || 0;
        for (let i = 0; i < 3; i += 1) {
          if (Array.isArray(pos.min)) bounds.min[i] = Math.min(bounds.min[i], pos.min[i]);
          if (Array.isArray(pos.max)) bounds.max[i] = Math.max(bounds.max[i], pos.max[i]);
        }
      }

      const mode = primitive.mode ?? 4;
      if (mode === 4) {
        const indexAccessor = Number.isInteger(primitive.indices) ? json.accessors?.[primitive.indices] : null;
        if (indexAccessor?.count) triangles += indexAccessor.count / 3;
        else if (pos?.count) triangles += pos.count / 3;
      }
    }
  }

  for (let i = 0; i < 3; i += 1) {
    if (bounds.min[i] === Infinity) bounds.min[i] = null;
    if (bounds.max[i] === -Infinity) bounds.max[i] = null;
  }

  return { primitives, vertices, triangles: Math.round(triangles), bounds };
}

async function inspectGlb(file) {
  const fullPath = path.join(MODELS_DIR, file);
  const buffer = await readFile(fullPath);
  const json = readJsonChunk(buffer, file);
  const primitiveStats = getPrimitiveStats(json);
  const sizeKb = buffer.length / 1024;
  const maxAbsX = Math.max(Math.abs(primitiveStats.bounds.min[0] ?? 0), Math.abs(primitiveStats.bounds.max[0] ?? 0));
  const maxAbsY = Math.max(Math.abs(primitiveStats.bounds.min[1] ?? 0), Math.abs(primitiveStats.bounds.max[1] ?? 0));
  const footprint = Math.max(maxAbsX, maxAbsY);

  return {
    file,
    sizeBytes: buffer.length,
    sizeKb,
    generator: json.asset?.generator || '',
    nodes: json.nodes?.length || 0,
    meshes: json.meshes?.length || 0,
    primitives: primitiveStats.primitives,
    materials: json.materials?.length || 0,
    images: json.images?.length || 0,
    textures: json.textures?.length || 0,
    accessors: json.accessors?.length || 0,
    vertices: primitiveStats.vertices,
    triangles: primitiveStats.triangles,
    min: primitiveStats.bounds.min,
    max: primitiveStats.bounds.max,
    minZ: primitiveStats.bounds.min[2],
    maxZ: primitiveStats.bounds.max[2],
    footprint,
  };
}

function classify(row) {
  const errors = [];
  const warnings = [];

  if (!row.mapped) errors.push('not mapped');
  if (!row.exists) errors.push('missing file');
  if (!row.orientation) errors.push('missing z-up orientation override');
  if (row.images > 0 || row.textures > 0) errors.push('contains image/texture payload');
  if (row.sizeKb > HARD_KB) errors.push('over hard size budget');
  else if (row.sizeKb > TARGET_KB) warnings.push('over target size');
  if (row.triangles > HARD_TRIANGLES) errors.push('over hard triangle budget');
  else if (row.triangles > TARGET_TRIANGLES) warnings.push('over target triangle count');
  if (typeof row.minZ === 'number' && row.minZ < MIN_Z_TOLERANCE) errors.push('negative z below ground');
  if (typeof row.footprint === 'number' && row.footprint > 1.2) warnings.push('wide footprint; check map-scale overlap');
  if (row.triangles > 0 && row.triangles < 600) warnings.push('very low triangle count; check silhouette quality');

  return { errors, warnings, status: errors.length ? 'FAIL' : warnings.length ? 'WARN' : 'OK' };
}

function fmtKb(value) {
  return `${Math.round(value).toLocaleString('en-US')} KB`;
}

function fmtNumber(value) {
  return Math.round(value).toLocaleString('en-US');
}

function fmtCoord(value) {
  if (value === null || value === undefined) return '-';
  return Number(value).toFixed(3);
}

function makeReport(rows, summary) {
  const lines = [];
  lines.push('# GLB Asset Baseline');
  lines.push('');
  lines.push('Generated from the local repository with `npm run audit:glb -- --write`.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Landmark GLB overrides: ${summary.mappedCount}`);
  lines.push(`- GLB files in public/models: ${summary.fileCount}`);
  lines.push(`- Passing without warnings: ${summary.okCount}`);
  lines.push(`- Warnings: ${summary.warnCount}`);
  lines.push(`- Failures: ${summary.failCount}`);
  lines.push(`- Total GLB weight: ${fmtKb(summary.totalKb)}`);
  lines.push('');
  lines.push('## Budget');
  lines.push('');
  lines.push(`- Target file size: < ${TARGET_KB / 1024} MB; hard limit: <= ${HARD_KB / 1024} MB.`);
  lines.push(`- Target triangles: <= ${TARGET_TRIANGLES.toLocaleString('en-US')}; hard limit: <= ${HARD_TRIANGLES.toLocaleString('en-US')}.`);
  lines.push('- Images/textures are not allowed; this project uses vertex colors and simple materials.');
  lines.push('- Every GLB override must also have a z-up orientation override in `createBuildingLayer.js`.');
  lines.push('- `minZ` should be >= -0.01 so the base does not sink visibly into the map.');
  lines.push('');
  lines.push('## Current Assets');
  lines.push('');
  lines.push('| Status | id | file | size | triangles | vertices | materials | tex/img | minZ | maxZ | footprint | notes |');
  lines.push('| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const row of rows) {
    const notes = [...row.errors, ...row.warnings].join('; ') || '-';
    lines.push([
      row.status,
      `\`${row.id}\``,
      row.file ? `\`${row.file}\`` : '-',
      row.exists ? fmtKb(row.sizeKb) : '-',
      row.exists ? fmtNumber(row.triangles) : '-',
      row.exists ? fmtNumber(row.vertices) : '-',
      row.exists ? row.materials : '-',
      row.exists ? `${row.textures}/${row.images}` : '-',
      row.exists ? fmtCoord(row.minZ) : '-',
      row.exists ? fmtCoord(row.maxZ) : '-',
      row.exists ? fmtCoord(row.footprint) : '-',
      notes,
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }
  lines.push('');
  lines.push('## How To Use This Baseline');
  lines.push('');
  lines.push('1. Run `npm run audit:glb` after changing any GLB script, model file, or `createBuildingLayer.js` override.');
  lines.push('2. Run `npm run audit:glb -- --write` when the baseline table itself should be refreshed.');
  lines.push('3. Treat `WARN` rows as visual QA candidates. They are not build blockers, but they should be screenshot-tested before more GLBs are added.');
  lines.push('4. Treat `FAIL` rows as blockers before deployment.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const shouldWrite = process.argv.includes('--write');
  const [source, landmarks, files] = await Promise.all([
    readFile(BUILDING_LAYER, 'utf8'),
    readFile(LANDMARKS_PATH, 'utf8').then(JSON.parse),
    readdir(MODELS_DIR),
  ]);

  const glbFiles = files.filter((file) => file.endsWith('.glb')).sort();
  const landmarkIds = new Set(landmarks.map((item) => item.id));
  const mapped = parseGlbOverrides(source);
  const orientationIds = parseOrientationOverrides(source);
  const mappedByFile = new Map(mapped.map((item) => [item.file, item]));
  const mappedById = new Map(mapped.map((item) => [item.id, item]));
  const modelStats = new Map();

  for (const file of glbFiles) {
    modelStats.set(file, await inspectGlb(file));
  }

  const rows = [];
  for (const item of mapped) {
    const stats = modelStats.get(item.file);
    const row = {
      id: item.id,
      file: item.file,
      mapped: true,
      exists: Boolean(stats),
      orientation: orientationIds.has(item.id),
      landmarkExists: landmarkIds.has(item.id),
      ...(stats || {}),
    };
    if (!row.landmarkExists) row.errors = ['landmark id not found'];
    rows.push(row);
  }

  for (const file of glbFiles) {
    if (!mappedByFile.has(file)) {
      rows.push({
        id: '(unmapped)',
        file,
        mapped: false,
        exists: true,
        orientation: false,
        ...modelStats.get(file),
      });
    }
  }

  for (const row of rows) {
    const verdict = classify(row);
    row.errors = [...(row.errors || []), ...verdict.errors];
    row.warnings = verdict.warnings;
    row.status = row.errors.length ? 'FAIL' : verdict.status;
  }

  rows.sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return a.id.localeCompare(b.id);
  });

  const summary = {
    mappedCount: mappedById.size,
    fileCount: glbFiles.length,
    okCount: rows.filter((row) => row.status === 'OK').length,
    warnCount: rows.filter((row) => row.status === 'WARN').length,
    failCount: rows.filter((row) => row.status === 'FAIL').length,
    totalKb: [...modelStats.values()].reduce((sum, item) => sum + item.sizeKb, 0),
  };
  const report = makeReport(rows, summary);
  if (shouldWrite) await writeFile(REPORT_PATH, report, 'utf8');

  console.log(`GLB asset audit: ${summary.okCount} OK, ${summary.warnCount} WARN, ${summary.failCount} FAIL`);
  console.log(`Overrides: ${summary.mappedCount}; files: ${summary.fileCount}; total: ${fmtKb(summary.totalKb)}`);
  for (const row of rows) {
    const notes = [...(row.errors || []), ...(row.warnings || [])].join('; ');
    console.log(`${row.status.padEnd(4)} ${row.id.padEnd(18)} ${String(row.file).padEnd(24)} ${row.exists ? fmtKb(row.sizeKb).padStart(8) : 'missing '} ${notes}`);
  }
  if (shouldWrite) console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}`);

  if (summary.failCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
