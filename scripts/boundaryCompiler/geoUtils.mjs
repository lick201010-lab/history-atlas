export function roundCoord(value) {
  return Math.round(value * 1000) / 1000;
}

export function closeRing(points) {
  if (!Array.isArray(points) || points.length === 0) return [];
  const rounded = points.map(([lng, lat]) => [roundCoord(lng), roundCoord(lat)]);
  const first = rounded[0];
  const last = rounded.at(-1);
  if (!last || first[0] !== last[0] || first[1] !== last[1]) rounded.push([...first]);
  return rounded;
}

export function densifyRing(points, maxSegment = 1.2) {
  const ring = closeRing(points);
  if (ring.length < 2) return ring;
  const out = [];
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    out.push(current);
    const dx = next[0] - current[0];
    const dy = next[1] - current[1];
    const steps = Math.max(0, Math.ceil(Math.hypot(dx, dy) / maxSegment) - 1);
    for (let step = 1; step <= steps; step += 1) {
      const t = step / (steps + 1);
      out.push([roundCoord(current[0] + dx * t), roundCoord(current[1] + dy * t)]);
    }
  }
  out.push([...out[0]]);
  return out;
}

export function signedRingArea(ring) {
  const closed = closeRing(ring);
  let area = 0;
  for (let index = 0; index < closed.length - 1; index += 1) {
    const [lng1, lat1] = closed[index];
    const [lng2, lat2] = closed[index + 1];
    area += lng1 * lat2 - lng2 * lat1;
  }
  return area / 2;
}

export function ringArea(ring) {
  return Math.abs(signedRingArea(ring));
}

export function ensureCCW(ring) {
  const closed = closeRing(ring);
  return signedRingArea(closed) < 0 ? closed.slice().reverse() : closed;
}

export function bboxForRing(ring) {
  const coordinates = closeRing(ring);
  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);
  return {
    minLng: Math.min(...lngs),
    minLat: Math.min(...lats),
    maxLng: Math.max(...lngs),
    maxLat: Math.max(...lats),
  };
}

export function outerRingsForGeometry(geometry) {
  if (geometry?.type === 'Polygon') return [geometry.coordinates?.[0]].filter(Boolean);
  if (geometry?.type === 'MultiPolygon') {
    return (geometry.coordinates || []).map((polygon) => polygon?.[0]).filter(Boolean);
  }
  return [];
}

export function bboxForGeometry(geometry) {
  const rings = outerRingsForGeometry(geometry);
  if (!rings.length) {
    return { minLng: NaN, minLat: NaN, maxLng: NaN, maxLat: NaN };
  }
  const bboxes = rings.map(bboxForRing);
  return {
    minLng: Math.min(...bboxes.map((bbox) => bbox.minLng)),
    minLat: Math.min(...bboxes.map((bbox) => bbox.minLat)),
    maxLng: Math.max(...bboxes.map((bbox) => bbox.maxLng)),
    maxLat: Math.max(...bboxes.map((bbox) => bbox.maxLat)),
  };
}

export function isRectangleLike(ring) {
  const closed = closeRing(ring);
  if (closed.length <= 5) return true;
  const uniqueLng = new Set(closed.map(([lng]) => lng));
  const uniqueLat = new Set(closed.map(([, lat]) => lat));
  if (uniqueLng.size <= 2 && uniqueLat.size <= 2) return true;

  const bbox = bboxForRing(closed);
  const bboxArea = (bbox.maxLng - bbox.minLng) * (bbox.maxLat - bbox.minLat);
  if (bboxArea <= 0) return false;
  const fillRatio = ringArea(closed) / bboxArea;
  const nearCornerCount = closed.filter(([lng, lat]) => {
    const nearLng = Math.min(Math.abs(lng - bbox.minLng), Math.abs(lng - bbox.maxLng)) <= 0.05;
    const nearLat = Math.min(Math.abs(lat - bbox.minLat), Math.abs(lat - bbox.maxLat)) <= 0.05;
    return nearLng && nearLat;
  }).length;
  return fillRatio > 0.88 && nearCornerCount >= 4;
}

export function totalOuterVertices(geometry) {
  return outerRingsForGeometry(geometry).reduce((sum, ring) => sum + ring.length, 0);
}

export function convexHull(points) {
  const unique = [...new Map(points.map(([lng, lat]) => [`${roundCoord(lng)},${roundCoord(lat)}`, [roundCoord(lng), roundCoord(lat)]])).values()]
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (unique.length <= 3) return closeRing(unique);

  const cross = (origin, a, b) => (
    (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0])
  );
  const lower = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (let index = unique.length - 1; index >= 0; index -= 1) {
    const point = unique[index];
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), point) <= 0) upper.pop();
    upper.push(point);
  }
  upper.pop();
  lower.pop();
  return closeRing([...lower, ...upper]);
}

export function polygonGeometry(ring) {
  return {
    type: 'Polygon',
    coordinates: [closeRing(ring)],
  };
}

export function multiPolygonGeometry(rings) {
  return {
    type: 'MultiPolygon',
    coordinates: rings.map((ring) => [closeRing(ring)]),
  };
}

export function featureFromPhase({ dynasty, phase, geometry, color, compiler }) {
  const compiledSourceNote = compiler?.landClipped
    ? `${phase.sourceNote} Geometry compiled offline from boundary-anchors.json and local atlas-land-110m.json land rings.`
    : phase.sourceNote;
  const compiledAccuracyNote = compiler?.landClipped
    ? `${phase.accuracyNote} Coastline-aware here means the regional envelope was intersected with local land/coast data; it remains rough historical visualization, not precise GIS territory.`
    : phase.accuracyNote;
  return {
    type: 'Feature',
    id: dynasty.id,
    properties: {
      id: dynasty.id,
      dynasty: dynasty.name,
      phase: phase.phase,
      phaseLabel: phase.phaseLabel,
      startYear: phase.startYear,
      endYear: phase.endYear,
      color,
      capital: dynasty.capital?.name,
      summary: phase.summary,
      accuracy: compiler?.landClipped ? 'coastline-aware-rough' : 'rough-refined',
      accuracyLabel: compiler?.landClipped ? 'Land-clipped rough historical range' : 'Rough historical range',
      accuracyNote: compiledAccuracyNote,
      sourceNote: compiledSourceNote,
      compiler: {
        name: 'boundaryCompiler',
        version: 2,
        mode: phase.mode,
        landClipSource: compiler?.landClipSource || null,
        landClipped: Boolean(compiler?.landClipped),
        regionCount: phase.includeRegions?.length || 0,
        regionUnion: Boolean(compiler?.regionUnion),
      },
    },
    geometry,
  };
}

function fillMask(mask, grid, rawRing) {
  const { nx, ny, lng0, lat0, cell } = grid;
  const ring = closeRing(rawRing);
  for (let j = 0; j < ny; j += 1) {
    const y = lat0 + (j + 0.5) * cell;
    const xs = [];
    for (let k = 0; k < ring.length - 1; k += 1) {
      const [x0, y0] = ring[k];
      const [x1, y1] = ring[k + 1];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        const t = (y - y0) / (y1 - y0);
        xs.push(x0 + t * (x1 - x0));
      }
    }
    xs.sort((a, b) => a - b);
    for (let index = 0; index + 1 < xs.length; index += 2) {
      let start = Math.ceil((xs[index] - lng0) / cell - 0.5);
      let end = Math.floor((xs[index + 1] - lng0) / cell - 0.5);
      start = Math.max(0, start);
      end = Math.min(nx - 1, end);
      const base = j * nx;
      for (let i = start; i <= end; i += 1) mask[base + i] = 1;
    }
  }
}

function turnScore(inDir, outDir) {
  const cross = inDir[0] * outDir[1] - inDir[1] * outDir[0];
  const dot = inDir[0] * outDir[0] + inDir[1] * outDir[1];
  if (cross < 0) return 0;
  if (dot > 0) return 1;
  if (cross > 0) return 2;
  return 3;
}

function traceBoundary(mask, nx, ny) {
  const filled = (i, j) => i >= 0 && i < nx && j >= 0 && j < ny && mask[j * nx + i] === 1;
  const edges = [];
  const tailMap = new Map();
  const addEdge = (ax, ay, bx, by) => {
    const edgeIndex = edges.length;
    edges.push({ ax, ay, bx, by, used: false });
    const key = `${ax},${ay}`;
    const list = tailMap.get(key) || [];
    list.push(edgeIndex);
    tailMap.set(key, list);
  };

  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      if (mask[j * nx + i] !== 1) continue;
      if (!filled(i - 1, j)) addEdge(i, j + 1, i, j);
      if (!filled(i + 1, j)) addEdge(i + 1, j, i + 1, j + 1);
      if (!filled(i, j - 1)) addEdge(i, j, i + 1, j);
      if (!filled(i, j + 1)) addEdge(i + 1, j + 1, i, j + 1);
    }
  }

  const loops = [];
  for (let firstEdge = 0; firstEdge < edges.length; firstEdge += 1) {
    if (edges[firstEdge].used) continue;
    const loop = [];
    let edgeIndex = firstEdge;
    let guard = 0;
    while (edgeIndex !== -1 && !edges[edgeIndex].used) {
      const edge = edges[edgeIndex];
      edge.used = true;
      loop.push([edge.ax, edge.ay]);
      const candidates = tailMap.get(`${edge.bx},${edge.by}`) || [];
      const inDir = [edge.bx - edge.ax, edge.by - edge.ay];
      let best = -1;
      let bestScore = Infinity;
      for (const candidate of candidates) {
        if (edges[candidate].used) continue;
        const next = edges[candidate];
        const score = turnScore(inDir, [next.bx - next.ax, next.by - next.ay]);
        if (score < bestScore) {
          best = candidate;
          bestScore = score;
        }
      }
      edgeIndex = best;
      guard += 1;
      if (guard > edges.length + 10) break;
    }
    if (loop.length >= 3) {
      loop.push([loop[0][0], loop[0][1]]);
      loops.push(loop);
    }
  }
  return loops;
}

function perpDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lenSq = dx * dx + dy * dy;
  const rawT = lenSq > 0 ? ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lenSq : 0;
  const t = Math.max(0, Math.min(1, rawT));
  const cx = start[0] + t * dx;
  const cy = start[1] + t * dy;
  return Math.hypot(point[0] - cx, point[1] - cy);
}

export function douglasPeucker(points, epsilon) {
  if (points.length < 3) return points.slice();
  let maxDistance = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points.at(-1);
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = perpDistance(points[index], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = index;
    }
  }
  if (maxDistance < epsilon) return [first, last];
  const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
  const right = douglasPeucker(points.slice(maxIndex), epsilon);
  return [...left.slice(0, -1), ...right];
}

function chaikinClosed(ring, iterations) {
  if (iterations <= 0 || ring.length < 4) return closeRing(ring);
  let points = closeRing(ring).slice(0, -1);
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = [];
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const following = points[(index + 1) % points.length];
      next.push([
        current[0] * 0.75 + following[0] * 0.25,
        current[1] * 0.75 + following[1] * 0.25,
      ]);
      next.push([
        current[0] * 0.25 + following[0] * 0.75,
        current[1] * 0.25 + following[1] * 0.75,
      ]);
    }
    points = next;
  }
  points.push([...points[0]]);
  return points;
}

function centroidForRing(ring) {
  const closed = closeRing(ring);
  let lng = 0;
  let lat = 0;
  for (const point of closed.slice(0, -1)) {
    lng += point[0];
    lat += point[1];
  }
  const count = Math.max(1, closed.length - 1);
  return [lng / count, lat / count];
}

function intersectsBbox(a, b) {
  return a.minLng <= b.maxLng && a.maxLng >= b.minLng && a.minLat <= b.maxLat && a.maxLat >= b.minLat;
}

export function extractLandRings(landGeojson) {
  const rings = [];
  const pushRing = (points) => {
    const bbox = bboxForRing(points);
    rings.push({ points, bbox });
  };
  for (const feature of landGeojson.features || []) {
    const geometry = feature.geometry;
    if (geometry?.type === 'Polygon') {
      pushRing(geometry.coordinates[0]);
    } else if (geometry?.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates || []) pushRing(polygon[0]);
    }
  }
  return rings;
}

function buildGrid(blocks, cell, padding) {
  const bboxes = blocks.map(bboxForRing);
  const minLng = Math.floor(Math.min(...bboxes.map((bbox) => bbox.minLng)) - padding);
  const minLat = Math.floor(Math.min(...bboxes.map((bbox) => bbox.minLat)) - padding);
  const maxLng = Math.ceil(Math.max(...bboxes.map((bbox) => bbox.maxLng)) + padding);
  const maxLat = Math.ceil(Math.max(...bboxes.map((bbox) => bbox.maxLat)) + padding);
  const nx = Math.max(1, Math.round((maxLng - minLng) / cell));
  const ny = Math.max(1, Math.round((maxLat - minLat) / cell));
  return { nx, ny, lng0: minLng, lat0: minLat, lngMax: maxLng, latMax: maxLat, cell };
}

function bboxContainsPoint(bbox, point) {
  return point[0] >= bbox.minLng && point[0] <= bbox.maxLng && point[1] >= bbox.minLat && point[1] <= bbox.maxLat;
}

function applyAvoidMasks(mask, grid, avoidBboxes) {
  if (!avoidBboxes.length) return;
  for (let j = 0; j < grid.ny; j += 1) {
    const lat = grid.lat0 + (j + 0.5) * grid.cell;
    for (let i = 0; i < grid.nx; i += 1) {
      if (mask[j * grid.nx + i] !== 1) continue;
      const lng = grid.lng0 + (i + 0.5) * grid.cell;
      if (avoidBboxes.some((bbox) => bboxContainsPoint(bbox, [lng, lat]))) {
        mask[j * grid.nx + i] = 0;
      }
    }
  }
}

export function clipBlocksToLand(blocks, landRings, options = {}) {
  const {
    avoidBboxes = [],
    cell = 0.08,
    padding = 1,
    minRingArea = 0.35,
    preSimplify = 0.024,
    simplify = 0.055,
    smoothingIterations = 1,
    maxRings = 24,
  } = options;
  if (!blocks.length) return [];

  const grid = buildGrid(blocks, cell, padding);
  const gridBbox = {
    minLng: grid.lng0,
    minLat: grid.lat0,
    maxLng: grid.lngMax,
    maxLat: grid.latMax,
  };

  const envelopeMask = new Uint8Array(grid.nx * grid.ny);
  for (const block of blocks) fillMask(envelopeMask, grid, block);

  const landMask = new Uint8Array(grid.nx * grid.ny);
  for (const landRing of landRings) {
    if (!intersectsBbox(gridBbox, landRing.bbox)) continue;
    fillMask(landMask, grid, landRing.points);
  }

  const clippedMask = new Uint8Array(grid.nx * grid.ny);
  for (let index = 0; index < clippedMask.length; index += 1) {
    clippedMask[index] = envelopeMask[index] & landMask[index];
  }
  applyAvoidMasks(clippedMask, grid, avoidBboxes);

  const loops = traceBoundary(clippedMask, grid.nx, grid.ny);
  const rings = [];
  for (const loop of loops) {
    let ring = loop.map(([i, j]) => [grid.lng0 + i * grid.cell, grid.lat0 + j * grid.cell]);
    if (Math.abs(signedRingArea(ring)) < minRingArea) continue;
    if (signedRingArea(ring) < 0) continue;
    const centroid = centroidForRing(ring);
    if (avoidBboxes.some((bbox) => bboxContainsPoint(bbox, centroid))) continue;
    ring = douglasPeucker(closeRing(ring), preSimplify);
    ring = chaikinClosed(ring, smoothingIterations);
    ring = douglasPeucker(closeRing(ring), simplify);
    if (ring.length < 4) continue;
    ring = ensureCCW(ring).map(([lng, lat]) => [roundCoord(lng), roundCoord(lat)]);
    if (ringArea(ring) < minRingArea) continue;
    rings.push(ring);
  }

  rings.sort((a, b) => ringArea(b) - ringArea(a));
  return rings.slice(0, maxRings);
}

export function geometryFromRings(rings) {
  const closed = rings.map((ring) => closeRing(ring));
  if (closed.length === 1) return polygonGeometry(closed[0]);
  return multiPolygonGeometry(closed);
}
