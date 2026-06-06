import { readFile, writeFile } from 'node:fs/promises';
import {
  clipBlocksToLand,
  convexHull,
  densifyRing,
  extractLandRings,
  featureFromPhase,
  geometryFromRings,
  ringArea,
} from './geoUtils.mjs';
import { REGION_PRESETS } from './regionPresets.mjs';

const DATA_DIR = new URL('../../src/data/', import.meta.url);
const LAND_SOURCE_FILE = 'atlas-land-110m.json';
const LAND_CLIP_SOURCE = `local:${LAND_SOURCE_FILE}`;
const HULL_DENSIFY_DEGREES = 0.7;
const OUTPUT_DENSIFY_DEGREES = 0.55;

const AVOID_REGION_BBOXES = {
  japan: [{ minLng: 128, minLat: 29, maxLng: 147, maxLat: 46 }],
  korea: [{ minLng: 124, minLat: 33, maxLng: 131, maxLat: 43.8 }],
  taiwan: [{ minLng: 119.7, minLat: 21.6, maxLng: 122.4, maxLat: 25.6 }],
  'southeast-asia-islands': [{ minLng: 95, minLat: -11, maxLng: 142, maxLat: 15 }],
  'aegean-islands': [{ minLng: 23, minLat: 35, maxLng: 29, maxLat: 40 }],
  'arabian-desert-deep': [{ minLng: 36.2, minLat: 16, maxLng: 46.5, maxLat: 28.7 }],
  'western-desert-deep': [{ minLng: 18, minLat: 15, maxLng: 27.9, maxLat: 32 }],
  'levant-interior': [{ minLng: 36.2, minLat: 29, maxLng: 41, maxLat: 37 }],
};

const CLIP_OPTIONS = {
  cell: 0.08,
  minRingArea: 0.38,
  maxRings: 28,
};

function parseIds(argv) {
  const idsFlag = argv.find((arg) => arg === '--ids' || arg.startsWith('--ids='));
  if (!idsFlag) return [];
  if (idsFlag.includes('=')) {
    return idsFlag.split('=').slice(1).join('=').split(',').map((id) => id.trim()).filter(Boolean);
  }
  const value = argv[argv.indexOf(idsFlag) + 1] || '';
  return value.split(',').map((id) => id.trim()).filter(Boolean);
}

async function readJson(name) {
  return readFile(new URL(name, DATA_DIR), 'utf8').then(JSON.parse);
}

function resolveRegions(phase) {
  return phase.includeRegions.map((regionId) => {
    const preset = REGION_PRESETS[regionId];
    if (!preset) throw new Error(`Unknown region preset "${regionId}" in phase "${phase.phaseLabel}"`);
    return preset;
  });
}

function avoidBboxesForPhase(phase) {
  return (phase.avoidRegions || []).flatMap((regionId) => AVOID_REGION_BBOXES[regionId] || []);
}

function ensureMinimumVertices(rings, geometryType) {
  const target = geometryType === 'Polygon' ? 44 : 84;
  let next = rings.map((ring) => densifyRing(ring, OUTPUT_DENSIFY_DEGREES));
  let total = next.reduce((sum, ring) => sum + ring.length, 0);
  let step = OUTPUT_DENSIFY_DEGREES;
  while (total < target && step > 0.08) {
    step *= 0.65;
    next = next.map((ring) => densifyRing(ring, step));
    total = next.reduce((sum, ring) => sum + ring.length, 0);
  }
  return next;
}

function clipEnvelopeBlocks(blocks, phase, landRings) {
  const rings = clipBlocksToLand(blocks, landRings, {
    ...CLIP_OPTIONS,
    avoidBboxes: avoidBboxesForPhase(phase),
    minRingArea: phase.minRingArea || CLIP_OPTIONS.minRingArea,
    maxRings: phase.maxRings || CLIP_OPTIONS.maxRings,
  });
  if (!rings.length) {
    throw new Error(`${phase.phaseLabel}: no land rings survived clipping`);
  }
  return rings;
}

function geometryFromPhase(phase, landRings) {
  const regions = resolveRegions(phase);
  let rings;

  if (phase.mode === 'regional-hull') {
    const hull = densifyRing(convexHull(regions.flatMap((region) => region.ring)), HULL_DENSIFY_DEGREES);
    rings = clipEnvelopeBlocks([hull], phase, landRings);
  } else if (phase.mode === 'multi-region') {
    const blocks = regions.map((region) => densifyRing(convexHull(region.ring), HULL_DENSIFY_DEGREES));
    rings = clipEnvelopeBlocks(blocks, phase, landRings);
    rings.sort((a, b) => ringArea(b) - ringArea(a));
    rings = rings.slice(0, phase.maxRings || CLIP_OPTIONS.maxRings);
  } else {
    throw new Error(`Unsupported boundary anchor mode "${phase.mode}"`);
  }

  const type = rings.length === 1 ? 'Polygon' : 'MultiPolygon';
  const finalRings = ensureMinimumVertices(rings, type);
  return geometryFromRings(finalRings);
}

function compileCivilization({ dynasty, anchor, landRings }) {
  return anchor.phases
    .slice()
    .sort((a, b) => a.startYear - b.startYear)
    .map((phase) => {
      const geometry = geometryFromPhase(phase, landRings);
      return featureFromPhase({
        dynasty,
        phase,
        geometry,
        color: dynasty.color,
        compiler: {
          landClipped: true,
          landClipSource: LAND_CLIP_SOURCE,
          regionUnion: phase.mode === 'multi-region',
        },
      });
    });
}

async function main() {
  const selectedIds = parseIds(process.argv.slice(2));
  if (selectedIds.length === 0) {
    throw new Error('Pass one or more ids with --ids han,ming or --ids=han,ming');
  }

  const [dynasties, anchors, boundaries, land] = await Promise.all([
    readJson('dynasties.json'),
    readJson('boundary-anchors.json'),
    readJson('boundaries-simplified.json'),
    readJson(LAND_SOURCE_FILE),
  ]);

  const landRings = extractLandRings(land);
  if (!landRings.length) throw new Error(`${LAND_SOURCE_FILE} did not contain land rings`);

  const dynastyById = new Map(dynasties.map((dynasty) => [dynasty.id, dynasty]));
  const anchorById = new Map((anchors.civilizations || []).map((anchor) => [anchor.id, anchor]));
  const compiled = [];

  for (const id of selectedIds) {
    const dynasty = dynastyById.get(id);
    const anchor = anchorById.get(id);
    if (!dynasty) throw new Error(`No dynasty found for id "${id}"`);
    if (!anchor) throw new Error(`No boundary anchors found for id "${id}"`);
    const features = compileCivilization({ dynasty, anchor, landRings });
    compiled.push(...features);
    console.log(`compiled ${id}: ${features.length} phase feature(s) from ${LAND_CLIP_SOURCE}`);
  }

  const selected = new Set(selectedIds);
  const compiledById = new Map();
  for (const feature of compiled) {
    const id = feature.properties?.id;
    if (!compiledById.has(id)) compiledById.set(id, []);
    compiledById.get(id).push(feature);
  }

  const replaced = new Set();
  const nextFeatures = [];
  for (const feature of boundaries.features || []) {
    const id = feature.properties?.id || feature.id;
    if (!selected.has(id)) {
      nextFeatures.push(feature);
      continue;
    }
    if (!replaced.has(id)) {
      nextFeatures.push(...compiledById.get(id));
      replaced.add(id);
    }
  }
  for (const id of selectedIds) {
    if (!replaced.has(id)) nextFeatures.push(...compiledById.get(id));
  }

  const nextBoundaries = {
    ...boundaries,
    features: nextFeatures,
  };

  await writeFile(new URL('boundaries-simplified.json', DATA_DIR), `${JSON.stringify(nextBoundaries, null, 2)}\n`, 'utf8');
  console.log(`wrote ${compiled.length} compiled feature(s); total features: ${nextBoundaries.features.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
