import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  bboxForGeometry,
  isRectangleLike,
  outerRingsForGeometry,
  ringArea,
  totalOuterVertices,
} from './boundaryCompiler/geoUtils.mjs';

const DATA_DIR = new URL('../src/data/', import.meta.url);
const OUT_DIR = path.join(process.cwd(), 'docs', 'boundary-qa');
const MANIFEST_PATH = path.join(OUT_DIR, 'boundary-quality-manifest.json');
const REQUIRED_PHASES = new Set(['rise', 'peak', 'decline']);
const COMPILER_REQUIRED_IDS = new Set([
  'han',
  'ming',
  'egypt-new-kingdom',
  'achaemenid',
  'sasanian',
  'srivijaya',
  'joseon',
  'yamato-japan',
  'ghana',
  'mali',
  'songhai',
  'british-empire',
  'united-states',
]);
const HIGH_RISK_EMPIRES = new Set(['achaemenid', 'sasanian', 'british-empire', 'united-states', 'ghana', 'mali', 'songhai']);

const MAX_BBOX_BY_ID = {
  han: { width: 60, height: 31 },
  ming: { width: 42, height: 31 },
  'egypt-new-kingdom': { width: 24, height: 27 },
  achaemenid: { width: 62, height: 30 },
  sasanian: { width: 58, height: 30 },
  srivijaya: { width: 18, height: 16 },
  joseon: { width: 9, height: 11 },
  'yamato-japan': { width: 15, height: 12 },
  ghana: { width: 13, height: 10 },
  mali: { width: 23, height: 13 },
  songhai: { width: 18, height: 14 },
  'british-empire': { width: 300, height: 115 },
  'united-states': { width: 105, height: 57 },
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function bboxSize(bbox) {
  return {
    width: bbox.maxLng - bbox.minLng,
    height: bbox.maxLat - bbox.minLat,
  };
}

function compactBbox(bbox) {
  return {
    minLng: Number(bbox.minLng.toFixed(3)),
    minLat: Number(bbox.minLat.toFixed(3)),
    maxLng: Number(bbox.maxLng.toFixed(3)),
    maxLat: Number(bbox.maxLat.toFixed(3)),
  };
}

function hasCompiledEvidence(feature) {
  const compiler = feature.properties?.compiler;
  return compiler?.name === 'boundaryCompiler'
    && compiler.version >= 2
    && compiler.landClipped === true
    && compiler.landClipSource === 'local:atlas-land-110m.json';
}

function largeRingRatio(geometry) {
  const rings = outerRingsForGeometry(geometry);
  if (!rings.length) return 0;
  const areas = rings.map((ring) => ringArea(ring));
  const total = areas.reduce((sum, area) => sum + area, 0);
  return total > 0 ? Math.max(...areas) / total : 0;
}

function bboxFillRatio(geometry) {
  const rings = outerRingsForGeometry(geometry);
  if (!rings.length) return 0;
  const bbox = bboxForGeometry(geometry);
  const bboxArea = (bbox.maxLng - bbox.minLng) * (bbox.maxLat - bbox.minLat);
  if (!Number.isFinite(bboxArea) || bboxArea <= 0) return 0;
  const totalArea = rings.reduce((sum, ring) => sum + ringArea(ring), 0);
  return totalArea / bboxArea;
}

function auditFeature(feature, failures, warnings) {
  const id = feature.properties?.id || feature.id || 'unknown';
  const phase = feature.properties?.phase || 'unknown';
  const prefix = `${id}:${phase}`;
  const geometry = feature.geometry;
  const rings = outerRingsForGeometry(geometry);
  const compiler = feature.properties?.compiler;

  if (!isNonEmptyString(feature.properties?.sourceNote)) failures.push(`${prefix} missing sourceNote`);
  if (!isNonEmptyString(feature.properties?.accuracyNote)) failures.push(`${prefix} missing accuracyNote`);
  if (!rings.length) failures.push(`${prefix} has no outer rings`);
  if (COMPILER_REQUIRED_IDS.has(id)) {
    if (feature.properties?.accuracy !== 'coastline-aware-rough') {
      failures.push(`${prefix} expected coastline-aware-rough after compiler repair`);
    }
    if (!hasCompiledEvidence(feature)) {
      failures.push(`${prefix} claims compiler-managed coastline-aware output but lacks boundaryCompiler v2 local land-clipping evidence`);
    }
  } else if (feature.properties?.compiler && !hasCompiledEvidence(feature)) {
    failures.push(`${prefix} has compiler metadata without valid local land-clipping evidence`);
  }

  for (const ring of rings) {
    if (isRectangleLike(ring) && ringArea(ring) >= 0.2) failures.push(`${prefix} has rectangle-like outer ring`);
  }

  const vertexCount = totalOuterVertices(geometry);
  if (COMPILER_REQUIRED_IDS.has(id) && geometry?.type === 'Polygon' && vertexCount < 40) {
    failures.push(`${prefix} Polygon needs at least 40 outer vertices (got ${vertexCount})`);
  }
  if (COMPILER_REQUIRED_IDS.has(id) && geometry?.type === 'MultiPolygon' && vertexCount < 80) {
    failures.push(`${prefix} MultiPolygon needs at least 80 outer vertices (got ${vertexCount})`);
  }
  if (!COMPILER_REQUIRED_IDS.has(id) && vertexCount < 21) {
    failures.push(`${prefix} has low vertex output (got ${vertexCount})`);
  }

  const bbox = bboxForGeometry(geometry);
  const { width, height } = bboxSize(bbox);
  if (Number.isFinite(width) && Number.isFinite(height)) {
    const limit = MAX_BBOX_BY_ID[id];
    if (limit && (width > limit.width || height > limit.height)) {
      failures.push(`${prefix} oversized bbox ${width.toFixed(1)}x${height.toFixed(1)} exceeds ${limit.width}x${limit.height}`);
    }
    if (HIGH_RISK_EMPIRES.has(id) && compiler?.mode === 'multi-region' && compiler?.regionUnion !== true) {
      failures.push(`${prefix} multi-region high-risk empire lacks union-before-land-trace evidence`);
    }
    if (HIGH_RISK_EMPIRES.has(id) && bboxFillRatio(geometry) > 0.72 && width > 30 && height > 14) {
      failures.push(`${prefix} fills too much of its bbox and still reads as a broad slab`);
    }
    if (HIGH_RISK_EMPIRES.has(id) && compiler?.regionUnion !== true && largeRingRatio(geometry) > 0.92 && width > 35) {
      failures.push(`${prefix} reads as one dominant diagonal band without union repair evidence`);
    }
    if (['han', 'ming'].includes(id) && bbox.minLng < 70) {
      warnings.push(`${prefix} extends unusually far west for China batch`);
    }
  }

  return {
    id,
    phase,
    geometryType: geometry?.type,
    vertices: vertexCount,
    rings: rings.length,
    bbox: compactBbox(bbox),
    compiler: feature.properties?.compiler || null,
  };
}

async function main() {
  const [dynasties, boundaries] = await Promise.all([
    readFile(new URL('dynasties.json', DATA_DIR), 'utf8').then(JSON.parse),
    readFile(new URL('boundaries-simplified.json', DATA_DIR), 'utf8').then(JSON.parse),
  ]);
  const features = boundaries.features || [];
  const targetIds = dynasties.map((dynasty) => dynasty.id);
  const failures = [];
  const warnings = [];
  const audited = [];

  for (const id of targetIds) {
    const selected = features
      .filter((feature) => (feature.properties?.id || feature.id) === id)
      .sort((a, b) => a.properties.startYear - b.properties.startYear);
    if (selected.length !== 3) {
      failures.push(`${id} must have exactly 3 features (got ${selected.length})`);
      continue;
    }

    const phases = new Set(selected.map((feature) => feature.properties?.phase));
    for (const phase of REQUIRED_PHASES) {
      if (!phases.has(phase)) failures.push(`${id} missing ${phase} phase`);
    }
    audited.push(...selected.map((feature) => auditFeature(feature, failures, warnings)));
  }

  const manifest = {
    status: failures.length ? 'fail' : 'pass',
    generatedAt: new Date().toISOString(),
    targetIds,
    compilerRequiredIds: [...COMPILER_REQUIRED_IDS],
    auditedFeatureCount: audited.length,
    failures,
    warnings,
    features: audited,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ ...manifest, manifestPath: MANIFEST_PATH }, null, 2));
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
