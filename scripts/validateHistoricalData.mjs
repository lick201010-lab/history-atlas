import { readFile } from 'node:fs/promises';

const DATA_DIR = new URL('../src/data/', import.meta.url);
const SAMPLE_IDS = new Set(['tang', 'roman-republic-empire', 'islamic-caliphates', 'mughal', 'maya']);

function fail(errors, message) {
  errors.push(message);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasClosedRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return Array.isArray(first)
    && Array.isArray(last)
    && first.length === 2
    && last.length === 2
    && first[0] === last[0]
    && first[1] === last[1];
}

function isRectangleLike(ring) {
  if (!Array.isArray(ring)) return false;
  const uniqueLng = new Set(ring.map((point) => point?.[0]));
  const uniqueLat = new Set(ring.map((point) => point?.[1]));
  return uniqueLng.size <= 2 && uniqueLat.size <= 2;
}

function validateDynasty(dynasty, landmarkIds, errors) {
  const prefix = `dynasty:${dynasty?.id || 'unknown'}`;

  if (!isNonEmptyString(dynasty.id)) fail(errors, `${prefix} missing id`);
  if (!isNonEmptyString(dynasty.name)) fail(errors, `${prefix} missing name`);
  if (!isNonEmptyString(dynasty.nameEn)) fail(errors, `${prefix} missing nameEn`);
  if (!isNumber(dynasty.startYear) || !isNumber(dynasty.endYear)) {
    fail(errors, `${prefix} startYear/endYear must be numbers`);
  } else if (dynasty.startYear > dynasty.endYear) {
    fail(errors, `${prefix} startYear is after endYear`);
  }

  if (!dynasty.capital || !isNumber(dynasty.capital.lat) || !isNumber(dynasty.capital.lng)) {
    fail(errors, `${prefix} capital must include numeric lat/lng`);
  }
  if (!isNonEmptyString(dynasty.capital?.name)) fail(errors, `${prefix} missing capital.name`);
  if (!isNonEmptyString(dynasty.color)) fail(errors, `${prefix} missing color`);
  if (!isNonEmptyString(dynasty.region)) fail(errors, `${prefix} missing region`);
  if (!isNonEmptyString(dynasty.summary)) fail(errors, `${prefix} missing summary`);
  if (!Array.isArray(dynasty.events) || dynasty.events.length === 0) fail(errors, `${prefix} must include events`);
  if (!Array.isArray(dynasty.relatedLandmarks)) fail(errors, `${prefix} relatedLandmarks must be an array`);

  for (const landmarkId of dynasty.relatedLandmarks || []) {
    if (!landmarkIds.has(landmarkId)) fail(errors, `${prefix} relatedLandmarks references missing landmark:${landmarkId}`);
  }

  for (const event of dynasty.events || []) {
    if (!isNumber(event.year) || !isNonEmptyString(event.title)) {
      fail(errors, `${prefix} has invalid event`);
    }
  }

  if (SAMPLE_IDS.has(dynasty.id)) {
    if (dynasty.events.length < 5) fail(errors, `${prefix} sample must include at least 5 events`);
    if (!Array.isArray(dynasty.tags) || dynasty.tags.length < 3) fail(errors, `${prefix} sample must include tags`);
    if (!Number.isInteger(dynasty.importance) || dynasty.importance < 1 || dynasty.importance > 5) {
      fail(errors, `${prefix} sample importance must be an integer from 1 to 5`);
    }
    if (!isNonEmptyString(dynasty.legacy)) fail(errors, `${prefix} sample must include legacy`);
  }
}

function validateBoundary(feature, dynastyIds, errors) {
  const id = feature?.properties?.id || feature?.id || 'unknown';
  const prefix = `boundary:${id}`;

  if (feature?.type !== 'Feature') fail(errors, `${prefix} must be a GeoJSON Feature`);
  if (!dynastyIds.has(id)) fail(errors, `${prefix} has no matching dynasty`);
  if (!isNumber(feature.properties?.startYear) || !isNumber(feature.properties?.endYear)) {
    fail(errors, `${prefix} startYear/endYear must be numbers`);
  }
  if (!isNonEmptyString(feature.properties?.dynasty)) fail(errors, `${prefix} missing dynasty label`);
  if (!isNonEmptyString(feature.properties?.summary)) fail(errors, `${prefix} missing summary`);
  if (!isNonEmptyString(feature.properties?.accuracyNote)) fail(errors, `${prefix} missing accuracyNote`);
  if (feature.geometry?.type !== 'Polygon') fail(errors, `${prefix} geometry must be Polygon`);

  const ring = feature.geometry?.coordinates?.[0];
  if (!hasClosedRing(ring)) fail(errors, `${prefix} polygon ring must be closed`);

  for (const point of ring || []) {
    const [lng, lat] = point || [];
    if (!isNumber(lng) || !isNumber(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      fail(errors, `${prefix} has invalid coordinate`);
    }
  }

  if (SAMPLE_IDS.has(id)) {
    if (!isNonEmptyString(feature.properties?.sourceNote)) fail(errors, `${prefix} sample must include sourceNote`);
    if (feature.properties?.accuracy !== 'rough-refined') fail(errors, `${prefix} sample accuracy must be rough-refined`);
    if (isRectangleLike(ring)) fail(errors, `${prefix} sample boundary should not be rectangle-like`);
    if ((ring?.length || 0) < 7) fail(errors, `${prefix} sample boundary needs a more natural ring`);
  }
}

function validateLandmark(landmark, errors) {
  const prefix = `landmark:${landmark?.id || 'unknown'}`;
  if (!isNonEmptyString(landmark.id)) fail(errors, `${prefix} missing id`);
  if (!isNonEmptyString(landmark.name)) fail(errors, `${prefix} missing name`);
  if (!isNumber(landmark.lng) || !isNumber(landmark.lat)) fail(errors, `${prefix} must include numeric lng/lat`);
  if (!isNumber(landmark.startYear) || !isNumber(landmark.endYear)) fail(errors, `${prefix} must include numeric startYear/endYear`);
  if (isNumber(landmark.startYear) && isNumber(landmark.endYear) && landmark.startYear > landmark.endYear) {
    fail(errors, `${prefix} startYear is after endYear`);
  }
}

async function main() {
  const [dynasties, boundaries, landmarks] = await Promise.all([
    readFile(new URL('dynasties.json', DATA_DIR), 'utf8').then(JSON.parse),
    readFile(new URL('boundaries-simplified.json', DATA_DIR), 'utf8').then(JSON.parse),
    readFile(new URL('landmarks.json', DATA_DIR), 'utf8').then(JSON.parse),
  ]);

  const errors = [];
  const dynastyIds = new Set(dynasties.map((dynasty) => dynasty.id));
  const landmarkIds = new Set(landmarks.map((landmark) => landmark.id));
  const boundaryIds = new Set(boundaries.features.map((feature) => feature.properties?.id || feature.id));

  for (const landmark of landmarks) validateLandmark(landmark, errors);
  for (const dynasty of dynasties) validateDynasty(dynasty, landmarkIds, errors);
  for (const feature of boundaries.features || []) validateBoundary(feature, dynastyIds, errors);

  for (const id of SAMPLE_IDS) {
    if (!dynastyIds.has(id)) fail(errors, `sample dynasty missing:${id}`);
    if (!boundaryIds.has(id)) fail(errors, `sample boundary missing:${id}`);
  }

  if (errors.length > 0) {
    console.error(`Historical data validation failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log('Historical data validation passed.');
  console.log(`Dynasties: ${dynasties.length}`);
  console.log(`Boundaries: ${boundaries.features.length}`);
  console.log(`Landmarks: ${landmarks.length}`);
  console.log(`Refined samples: ${SAMPLE_IDS.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
