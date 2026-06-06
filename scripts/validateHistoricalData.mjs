import { readFile } from 'node:fs/promises';
import { MODEL_PROFILE_KEYS } from '../src/map/modelProfileKeys.js';
import { REGION_PRESETS } from './boundaryCompiler/regionPresets.mjs';

const DATA_DIR = new URL('../src/data/', import.meta.url);
const CODE_DIR = new URL('../src/map/', import.meta.url);
const SAMPLE_IDS = new Set(['tang', 'roman-republic-empire', 'islamic-caliphates', 'mughal', 'maya']);
const F4_SOURCE_PILOT_IDS = new Set(['tang', 'roman-republic-empire', 'islamic-caliphates', 'mughal', 'maya']);
const F2_BATCH_01_IDS = new Set(['byzantine', 'ottoman', 'mongol-empire', 'aztec', 'inca']);
const F2_BATCH_02_IDS = new Set([
  'greek-city-states',
  'assyrian',
  'babylon',
  'carolingian',
  'holy-roman-empire',
]);
const F2_BATCH_03_IDS = new Set(['xia', 'shang', 'zhou', 'qin', 'sui']);
const F2_BATCH_04_IDS = new Set(['jin', 'song', 'yuan', 'qing', 'prc']);
const F2_BATCH_05_IDS = new Set(['han', 'ming', 'egypt-new-kingdom', 'achaemenid', 'sasanian']);
const F2_FINAL_COVERAGE_IDS = new Set([
  'srivijaya',
  'joseon',
  'yamato-japan',
  'ghana',
  'mali',
  'songhai',
  'british-empire',
  'united-states',
]);
const COMPILER_ANCHOR_IDS = new Set([...F2_BATCH_05_IDS, ...F2_FINAL_COVERAGE_IDS]);
const SAMPLE_PHASES = new Set(['rise', 'peak', 'decline']);

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

  if (F4_SOURCE_PILOT_IDS.has(dynasty.id)) {
    validateDynastySources(dynasty, errors);
  }
}

function validateReference(reference, referenceIds, prefix, errors) {
  if (!reference || typeof reference !== 'object') {
    fail(errors, `${prefix} has invalid reference`);
    return;
  }
  if (!isNonEmptyString(reference.id)) {
    fail(errors, `${prefix} reference missing id`);
  } else if (referenceIds.has(reference.id)) {
    fail(errors, `${prefix} duplicate reference id:${reference.id}`);
  } else {
    referenceIds.add(reference.id);
  }
  if (!isNonEmptyString(reference.title)) fail(errors, `${prefix} reference:${reference.id || 'unknown'} missing title`);
  if (!(
    isNonEmptyString(reference.author)
    || isNumber(reference.year)
    || isNonEmptyString(reference.url)
    || isNonEmptyString(reference.note)
  )) {
    fail(errors, `${prefix} reference:${reference.id || 'unknown'} needs author, year, url, or note`);
  }
}

function validateDynastySources(dynasty, errors) {
  const prefix = `dynasty:${dynasty?.id || 'unknown'}`;
  if (!isNonEmptyString(dynasty.sourceNote)) fail(errors, `${prefix} F4 source pilot missing sourceNote`);
  if (!Array.isArray(dynasty.references) || dynasty.references.length === 0) {
    fail(errors, `${prefix} F4 source pilot must include references`);
  }

  const referenceIds = new Set();
  for (const reference of dynasty.references || []) validateReference(reference, referenceIds, prefix, errors);

  for (const event of dynasty.events || []) {
    const hasEventSourceNote = isNonEmptyString(event.sourceNote);
    const hasReferenceIds = Array.isArray(event.referenceIds) && event.referenceIds.length > 0;
    if (!hasEventSourceNote && !hasReferenceIds) {
      fail(errors, `${prefix} event:${event.title || event.year || 'unknown'} needs sourceNote or referenceIds`);
    }
    for (const referenceId of event.referenceIds || []) {
      if (!referenceIds.has(referenceId)) {
        fail(errors, `${prefix} event:${event.title || event.year || 'unknown'} references missing id:${referenceId}`);
      }
    }
  }
}

const SAMPLE_ACCURACY_VALUES = new Set(['rough-refined', 'coastline-aware-rough']);

function validateBoundary(feature, dynastyIds, requiredPhaseIds, errors) {
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
  const geomType = feature.geometry?.type;
  if (geomType !== 'Polygon' && geomType !== 'MultiPolygon') {
    fail(errors, `${prefix} geometry must be Polygon or MultiPolygon`);
  }

  // 收集所有 outer rings 用于一致性校验
  const outerRings = [];
  if (geomType === 'Polygon') {
    outerRings.push(feature.geometry.coordinates?.[0]);
  } else if (geomType === 'MultiPolygon') {
    for (const poly of feature.geometry.coordinates || []) {
      outerRings.push(poly?.[0]);
    }
  }
  if (outerRings.length === 0) fail(errors, `${prefix} has no outer ring`);

  for (const ring of outerRings) {
    if (!hasClosedRing(ring)) fail(errors, `${prefix} polygon ring must be closed`);
    for (const point of ring || []) {
      const [lng, lat] = point || [];
      if (!isNumber(lng) || !isNumber(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        fail(errors, `${prefix} has invalid coordinate`);
      }
    }
  }

  if (requiredPhaseIds.has(id)) {
    const accuracy = feature.properties?.accuracy;
    if (!isNonEmptyString(feature.properties?.sourceNote)) fail(errors, `${prefix} sample must include sourceNote`);
    if (!SAMPLE_ACCURACY_VALUES.has(accuracy)) {
      fail(errors, `${prefix} sample accuracy must be one of: ${[...SAMPLE_ACCURACY_VALUES].join(', ')}`);
    }
    if (!SAMPLE_PHASES.has(feature.properties?.phase)) fail(errors, `${prefix} sample phase must be rise, peak, or decline`);
    if (!isNonEmptyString(feature.properties?.phaseLabel)) fail(errors, `${prefix} sample must include phaseLabel`);
    // 矩形过滤：任一外环都不能是矩形
    for (const ring of outerRings) if (isRectangleLike(ring)) fail(errors, `${prefix} sample boundary should not be rectangle-like`);
    // 顶点要求：coastline-aware-rough 收紧到 ≥40 单环 / ≥80 总（MultiPolygon）
    if (COMPILER_ANCHOR_IDS.has(id)) {
    const totalVerts = outerRings.reduce((s, r) => s + (r?.length || 0), 0);
    if (accuracy === 'coastline-aware-rough') {
      if (geomType === 'Polygon' && (outerRings[0]?.length || 0) < 40) {
        fail(errors, `${prefix} coastline-aware Polygon needs ≥40 vertices (got ${outerRings[0]?.length})`);
      }
      if (geomType === 'MultiPolygon' && totalVerts < 80) {
        fail(errors, `${prefix} coastline-aware MultiPolygon needs ≥80 total vertices (got ${totalVerts})`);
      }
    } else {
      // 兼容旧 rough-refined sample
      if ((outerRings[0]?.length || 0) < 21) fail(errors, `${prefix} sample boundary needs at least 20 vertices plus closure`);
    }
    }
  }
}

function validateSampleBoundaryPhases(features, dynastyById, requiredPhaseIds, errors) {
  if (features.length < requiredPhaseIds.size * 3) {
    fail(errors, `F2 full gate requires at least ${requiredPhaseIds.size * 3} boundary features (got ${features.length})`);
  }

  for (const id of requiredPhaseIds) {
    const dynasty = dynastyById.get(id);
    const sampleFeatures = features
      .filter((feature) => (feature.properties?.id || feature.id) === id)
      .sort((a, b) => a.properties.startYear - b.properties.startYear);

    if (sampleFeatures.length !== 3) {
      fail(errors, `boundary:${id} sample must have exactly 3 phased features`);
      continue;
    }

    const phases = new Set(sampleFeatures.map((feature) => feature.properties?.phase));
    for (const phase of SAMPLE_PHASES) {
      if (!phases.has(phase)) fail(errors, `boundary:${id} sample missing ${phase} phase`);
    }

    if (dynasty) {
      if (sampleFeatures[0].properties.startYear !== dynasty.startYear) {
        fail(errors, `boundary:${id} phased boundaries must start at dynasty startYear`);
      }
      if (sampleFeatures.at(-1).properties.endYear !== dynasty.endYear) {
        fail(errors, `boundary:${id} phased boundaries must end at dynasty endYear`);
      }
    }

    for (let index = 1; index < sampleFeatures.length; index += 1) {
      const previous = sampleFeatures[index - 1].properties;
      const current = sampleFeatures[index].properties;
      if (current.startYear !== previous.endYear + 1) {
        fail(errors, `boundary:${id} phased boundaries must be contiguous`);
      }
    }
  }
}

function validateBoundaryAnchors(anchors, errors) {
  if (!anchors || typeof anchors !== 'object') {
    fail(errors, 'boundary-anchors.json must be an object');
    return;
  }
  if (!Array.isArray(anchors.civilizations)) {
    fail(errors, 'boundary-anchors.json civilizations must be an array');
    return;
  }

  const anchorById = new Map(anchors.civilizations.map((anchor) => [anchor.id, anchor]));
  for (const id of COMPILER_ANCHOR_IDS) {
    const anchor = anchorById.get(id);
    const prefix = `boundary-anchor:${id}`;
    if (!anchor) {
      fail(errors, `${prefix} missing anchor civilization`);
      continue;
    }
    if (!Array.isArray(anchor.phases)) {
      fail(errors, `${prefix} phases must be an array`);
      continue;
    }
    const phases = new Set(anchor.phases.map((phase) => phase.phase));
    for (const requiredPhase of SAMPLE_PHASES) {
      if (!phases.has(requiredPhase)) fail(errors, `${prefix} missing ${requiredPhase} phase`);
    }
    if (anchor.phases.length !== 3) fail(errors, `${prefix} must have exactly 3 phases`);

    for (const phase of anchor.phases) {
      const phasePrefix = `${prefix}:${phase.phase || 'unknown'}`;
      if (!SAMPLE_PHASES.has(phase.phase)) fail(errors, `${phasePrefix} phase must be rise, peak, or decline`);
      if (!isNonEmptyString(phase.phaseLabel)) fail(errors, `${phasePrefix} missing phaseLabel`);
      if (!isNumber(phase.startYear) || !isNumber(phase.endYear)) {
        fail(errors, `${phasePrefix} startYear/endYear must be numbers`);
      } else if (phase.startYear > phase.endYear) {
        fail(errors, `${phasePrefix} startYear is after endYear`);
      }
      if (!isNonEmptyString(phase.summary)) fail(errors, `${phasePrefix} missing summary`);
      if (!isNonEmptyString(phase.mode)) fail(errors, `${phasePrefix} missing mode`);
      if (!Array.isArray(phase.includeRegions) || phase.includeRegions.length === 0) {
        fail(errors, `${phasePrefix} includeRegions must be a non-empty array`);
      }
      for (const regionId of phase.includeRegions || []) {
        if (!REGION_PRESETS[regionId]) fail(errors, `${phasePrefix} references unknown region preset:${regionId}`);
      }
      if (!isNonEmptyString(phase.sourceNote)) fail(errors, `${phasePrefix} missing sourceNote`);
      if (!isNonEmptyString(phase.accuracyNote)) fail(errors, `${phasePrefix} missing accuracyNote`);
    }
  }
}

function hasQuestionMarkRun(str) {
  // Catches encoding-broken text like "???" / "？？？" (≥3 consecutive question marks).
  return /\?{3,}|？{3,}/.test(str);
}

// 单一可信来源：从 src/map/modelProfileKeys.js 导入。
// 代码（createBuildingLayer.js）在加载期会检查 PROFILES 与该清单一致。
const ALLOWED_MODEL_PROFILES = new Set(MODEL_PROFILE_KEYS);

function validateLandmark(landmark, dynastyIds, errors) {
  const prefix = `landmark:${landmark?.id || 'unknown'}`;
  if (!isNonEmptyString(landmark.id)) fail(errors, `${prefix} missing id`);
  if (!isNonEmptyString(landmark.name)) fail(errors, `${prefix} missing name`);
  if (!isNumber(landmark.lng) || !isNumber(landmark.lat)) fail(errors, `${prefix} must include numeric lng/lat`);
  if (!isNumber(landmark.startYear) || !isNumber(landmark.endYear)) fail(errors, `${prefix} must include numeric startYear/endYear`);
  if (isNumber(landmark.startYear) && isNumber(landmark.endYear) && landmark.startYear > landmark.endYear) {
    fail(errors, `${prefix} startYear is after endYear`);
  }
  if (!isNonEmptyString(landmark.summary)) {
    fail(errors, `${prefix} missing summary`);
  } else if (hasQuestionMarkRun(landmark.summary)) {
    fail(errors, `${prefix} summary contains consecutive question marks (encoding issue?)`);
  }
  if (!isNonEmptyString(landmark.sourceNote)) {
    fail(errors, `${prefix} missing sourceNote`);
  } else if (hasQuestionMarkRun(landmark.sourceNote)) {
    fail(errors, `${prefix} sourceNote contains consecutive question marks (encoding issue?)`);
  }
  if (!isNonEmptyString(landmark.region)) {
    fail(errors, `${prefix} missing region`);
  } else if (hasQuestionMarkRun(landmark.region)) {
    fail(errors, `${prefix} region contains consecutive question marks (encoding issue?)`);
  }
  if (!Number.isInteger(landmark.importance) || landmark.importance < 1 || landmark.importance > 5) {
    fail(errors, `${prefix} importance must be an integer from 1 to 5`);
  }
  if (!Array.isArray(landmark.relatedDynastyIds)) {
    fail(errors, `${prefix} relatedDynastyIds must be an array`);
  }
  for (const dynastyId of landmark.relatedDynastyIds || []) {
    if (!dynastyIds.has(dynastyId)) fail(errors, `${prefix} relatedDynastyIds references missing dynasty:${dynastyId}`);
  }
  if (landmark.modelProfile !== undefined) {
    if (!isNonEmptyString(landmark.modelProfile) || !ALLOWED_MODEL_PROFILES.has(landmark.modelProfile)) {
      fail(errors, `${prefix} modelProfile must be one of: ${[...ALLOWED_MODEL_PROFILES].join(', ')}`);
    }
  }
  if (landmark.modelScale !== undefined) {
    if (!isNumber(landmark.modelScale) || landmark.modelScale <= 0 || landmark.modelScale > 3) {
      fail(errors, `${prefix} modelScale must be a positive number ≤ 3`);
    }
  }
}

/**
 * Cross-check: every MODEL_PROFILE_KEYS entry must appear as a key inside
 * the PROFILES object literal in createBuildingLayer.js. We do this with a
 * lightweight source scan (no eval, no DOM imports) so the validator can
 * run in pure Node without pulling in Three.js / MapLibre.
 */
async function validateProfileCodeBinding(errors) {
  const source = await readFile(new URL('createBuildingLayer.js', CODE_DIR), 'utf8');
  const match = source.match(/const PROFILES = \{([\s\S]*?)\};/);
  if (!match) {
    fail(errors, 'createBuildingLayer.js: cannot locate PROFILES literal');
    return;
  }
  const block = match[1];
  for (const key of MODEL_PROFILE_KEYS) {
    // Accept both bare identifiers (key:) and quoted keys ('key':).
    const ident = /^[A-Za-z_$][\w$]*$/.test(key);
    const re = ident
      ? new RegExp(`(^|[\\s,{])${key}\\s*:`, 'm')
      : new RegExp(`['"\`]${key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}['"\`]\\s*:`);
    if (!re.test(block)) {
      fail(errors, `createBuildingLayer.js PROFILES is missing key for "${key}"`);
    }
  }
}

async function main() {
  const [dynasties, boundaries, landmarks, boundaryAnchors] = await Promise.all([
    readFile(new URL('dynasties.json', DATA_DIR), 'utf8').then(JSON.parse),
    readFile(new URL('boundaries-simplified.json', DATA_DIR), 'utf8').then(JSON.parse),
    readFile(new URL('landmarks.json', DATA_DIR), 'utf8').then(JSON.parse),
    readFile(new URL('boundary-anchors.json', DATA_DIR), 'utf8').then(JSON.parse),
  ]);

  const errors = [];
  const dynastyIds = new Set(dynasties.map((dynasty) => dynasty.id));
  const dynastyById = new Map(dynasties.map((dynasty) => [dynasty.id, dynasty]));
  const requiredPhaseIds = new Set(dynastyIds);
  const landmarkIds = new Set(landmarks.map((landmark) => landmark.id));
  const boundaryIds = new Set(boundaries.features.map((feature) => feature.properties?.id || feature.id));

  for (const landmark of landmarks) validateLandmark(landmark, dynastyIds, errors);
  for (const dynasty of dynasties) validateDynasty(dynasty, landmarkIds, errors);
  for (const feature of boundaries.features || []) validateBoundary(feature, dynastyIds, requiredPhaseIds, errors);
  validateSampleBoundaryPhases(boundaries.features || [], dynastyById, requiredPhaseIds, errors);
  validateBoundaryAnchors(boundaryAnchors, errors);

  await validateProfileCodeBinding(errors);

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
  console.log(`F2 phased boundary ids: ${requiredPhaseIds.size}`);
  console.log(`Model profiles (code+data): ${MODEL_PROFILE_KEYS.length} (${landmarks.filter((l) => l.modelProfile).length} landmarks linked)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
