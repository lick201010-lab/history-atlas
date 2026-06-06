import { readFile } from 'node:fs/promises';

const DATA_DIR = new URL('../src/data/', import.meta.url);

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function localReferenceIds(dynasty) {
  return new Set((dynasty.references || []).map((reference) => reference.id).filter(Boolean));
}

function eventReady(event, referenceIds) {
  const refs = event.referenceIds || [];
  return hasText(event.detail)
    && hasText(event.type)
    && (hasText(event.sourceNote) || refs.length > 0)
    && refs.every((id) => referenceIds.has(id));
}

const [dynasties, boundaries, landmarks] = await Promise.all([
  readFile(new URL('dynasties.json', DATA_DIR), 'utf8').then(JSON.parse),
  readFile(new URL('boundaries-simplified.json', DATA_DIR), 'utf8').then(JSON.parse),
  readFile(new URL('landmarks.json', DATA_DIR), 'utf8').then(JSON.parse),
]);

const dynastyRows = dynasties.map((dynasty) => {
  const referenceIds = localReferenceIds(dynasty);
  const events = dynasty.events || [];
  const readyEvents = events.filter((event) => eventReady(event, referenceIds));
  return {
    id: dynasty.id,
    name: dynasty.name,
    hasSourceNote: hasText(dynasty.sourceNote),
    referenceCount: dynasty.references?.length || 0,
    eventCount: events.length,
    readyEventCount: readyEvents.length,
    ready: hasText(dynasty.sourceNote)
      && hasItems(dynasty.references)
      && events.length > 0
      && readyEvents.length === events.length,
  };
});

const summary = {
  dynastySourceReady: dynastyRows.filter((row) => row.ready).length,
  dynastyTotal: dynasties.length,
  dynastyReferences: dynastyRows.reduce((sum, row) => sum + row.referenceCount, 0),
  eventSourceReady: dynastyRows.reduce((sum, row) => sum + row.readyEventCount, 0),
  eventTotal: dynastyRows.reduce((sum, row) => sum + row.eventCount, 0),
  boundarySourceReady: (boundaries.features || []).filter((feature) => (
    hasText(feature.properties?.sourceNote) && hasText(feature.properties?.accuracyNote)
  )).length,
  boundaryTotal: boundaries.features?.length || 0,
  landmarkSourceReady: landmarks.filter((landmark) => hasText(landmark.sourceNote)).length,
  landmarkReferenceReady: landmarks.filter((landmark) => hasItems(landmark.references)).length,
  landmarkTotal: landmarks.length,
};

const missingDynasties = dynastyRows
  .filter((row) => !row.ready)
  .map((row) => ({
    id: row.id,
    name: row.name,
    sourceNote: row.hasSourceNote,
    references: row.referenceCount,
    readyEvents: `${row.readyEventCount}/${row.eventCount}`,
  }));

console.log(JSON.stringify({ summary, missingDynasties }, null, 2));

if (process.argv.includes('--strict') && summary.dynastySourceReady !== summary.dynastyTotal) {
  process.exitCode = 1;
}
