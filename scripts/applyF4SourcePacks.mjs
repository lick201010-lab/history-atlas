import { readFile, writeFile } from 'node:fs/promises';

const DATA_DIR = new URL('../src/data/', import.meta.url);
const PACK_DIR = new URL('../.claude-runs/', import.meta.url);

const DYNASTY_PACKS = [
  'f4-batch04-west-eurasia-source-pack.json',
  'f4-batch05-asia-source-pack.json',
  'f4-batch06-americas-africa-source-pack.json',
  'f4-batch07-europe-modern-source-pack.json',
];

const LANDMARK_PACKS = [
  'f4-landmark-references-source-pack.json',
];

function fail(message) {
  throw new Error(message);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function readJson(url) {
  return JSON.parse(await readFile(url, 'utf8'));
}

function validateReference(reference, owner) {
  if (!reference || typeof reference !== 'object') fail(`${owner} has invalid reference`);
  if (!hasText(reference.id)) fail(`${owner} reference missing id`);
  if (!hasText(reference.title)) fail(`${owner} reference:${reference.id} missing title`);
  if (!(
    hasText(reference.author)
    || typeof reference.year === 'number'
    || hasText(reference.url)
    || hasText(reference.note)
  )) {
    fail(`${owner} reference:${reference.id} needs author, year, url, or note`);
  }
}

function applyDynastyPack(dynasties, pack, packName) {
  if (!Array.isArray(pack.dynasties)) fail(`${packName} missing dynasties[]`);

  const dynastyById = new Map(dynasties.map((dynasty) => [dynasty.id, dynasty]));
  for (const entry of pack.dynasties) {
    const dynasty = dynastyById.get(entry.id);
    if (!dynasty) fail(`${packName} references unknown dynasty:${entry.id}`);
    if (!hasText(entry.sourceNote)) fail(`${packName}:${entry.id} missing sourceNote`);
    if (!Array.isArray(entry.references) || entry.references.length === 0) {
      fail(`${packName}:${entry.id} missing references`);
    }
    if (!Array.isArray(entry.eventUpdates)) fail(`${packName}:${entry.id} missing eventUpdates[]`);

    const referenceIds = new Set();
    for (const reference of entry.references) {
      validateReference(reference, `${packName}:${entry.id}`);
      if (referenceIds.has(reference.id)) fail(`${packName}:${entry.id} duplicate reference:${reference.id}`);
      referenceIds.add(reference.id);
    }

    const eventKey = (event) => `${event.year}::${event.title}`;
    const updatesByKey = new Map(entry.eventUpdates.map((event) => [eventKey(event), event]));
    for (const event of dynasty.events || []) {
      const key = eventKey(event);
      const update = updatesByKey.get(key);
      if (!update) fail(`${packName}:${entry.id} missing update for event ${key}`);
      if (!hasText(update.detail)) fail(`${packName}:${entry.id}:${key} missing detail`);
      if (!hasText(update.type)) fail(`${packName}:${entry.id}:${key} missing type`);
      if (!Array.isArray(update.referenceIds) || update.referenceIds.length === 0) {
        fail(`${packName}:${entry.id}:${key} missing referenceIds`);
      }
      for (const referenceId of update.referenceIds) {
        if (!referenceIds.has(referenceId)) {
          fail(`${packName}:${entry.id}:${key} references missing local id:${referenceId}`);
        }
      }
    }

    if (updatesByKey.size !== (dynasty.events || []).length) {
      fail(`${packName}:${entry.id} has extra or duplicate event updates`);
    }

    dynasty.sourceNote = entry.sourceNote;
    dynasty.references = entry.references;
    dynasty.events = dynasty.events.map((event) => {
      const update = updatesByKey.get(eventKey(event));
      return {
        ...event,
        type: update.type,
        detail: update.detail,
        referenceIds: update.referenceIds,
      };
    });
  }
}

function applyLandmarkPack(landmarks, pack, packName) {
  if (!Array.isArray(pack.landmarks)) fail(`${packName} missing landmarks[]`);

  const landmarkById = new Map(landmarks.map((landmark) => [landmark.id, landmark]));
  for (const entry of pack.landmarks) {
    const landmark = landmarkById.get(entry.id);
    if (!landmark) fail(`${packName} references unknown landmark:${entry.id}`);
    if (!Array.isArray(entry.references) || entry.references.length === 0) {
      fail(`${packName}:${entry.id} missing references`);
    }
    const referenceIds = new Set();
    for (const reference of entry.references) {
      validateReference(reference, `${packName}:${entry.id}`);
      if (referenceIds.has(reference.id)) fail(`${packName}:${entry.id} duplicate reference:${reference.id}`);
      referenceIds.add(reference.id);
    }
    landmark.references = entry.references;
  }

  const updatedCount = pack.landmarks.filter((entry) => landmarkById.has(entry.id)).length;
  if (updatedCount !== landmarks.length) {
    fail(`${packName} must include every landmark exactly once (${updatedCount}/${landmarks.length})`);
  }
}

const dynastiesUrl = new URL('dynasties.json', DATA_DIR);
const landmarksUrl = new URL('landmarks.json', DATA_DIR);
const dynasties = await readJson(dynastiesUrl);
const landmarks = await readJson(landmarksUrl);

for (const packName of DYNASTY_PACKS) {
  const pack = await readJson(new URL(packName, PACK_DIR));
  applyDynastyPack(dynasties, pack, packName);
}

for (const packName of LANDMARK_PACKS) {
  const pack = await readJson(new URL(packName, PACK_DIR));
  applyLandmarkPack(landmarks, pack, packName);
}

await writeFile(dynastiesUrl, `${JSON.stringify(dynasties, null, 2)}\n`, 'utf8');
await writeFile(landmarksUrl, `${JSON.stringify(landmarks, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  appliedDynastyPacks: DYNASTY_PACKS,
  appliedLandmarkPacks: LANDMARK_PACKS,
  dynasties: dynasties.length,
  landmarks: landmarks.length,
}, null, 2));
