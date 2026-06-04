const cache = new WeakMap();

function isSamePoint(a, b) {
  return a?.[0] === b?.[0] && a?.[1] === b?.[1];
}

function chaikinRing(ring, iterations) {
  let points = ring.slice();

  if (points.length > 1 && isSamePoint(points[0], points[points.length - 1])) {
    points = points.slice(0, -1);
  }

  if (points.length < 4) return ring.slice();

  for (let pass = 0; pass < iterations; pass += 1) {
    const next = new Array(points.length * 2);

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const following = points[(index + 1) % points.length];

      next[index * 2] = [
        current[0] * 0.75 + following[0] * 0.25,
        current[1] * 0.75 + following[1] * 0.25,
      ];
      next[index * 2 + 1] = [
        current[0] * 0.25 + following[0] * 0.75,
        current[1] * 0.25 + following[1] * 0.75,
      ];
    }

    points = next;
  }

  points.push(points[0].slice());
  return points;
}

function iterationsForRing(ring) {
  const count = ring.length;
  if (count <= 12) return 3;
  if (count <= 40) return 2;
  if (count <= 160) return 1;
  return 0;
}

function smoothPolygon(coordinates) {
  return coordinates.map((ring) => chaikinRing(ring, iterationsForRing(ring)));
}

function smoothGeometry(geometry) {
  if (!geometry) return geometry;

  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: smoothPolygon(geometry.coordinates) };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) => smoothPolygon(polygon)),
    };
  }

  return geometry;
}

export function smoothBoundaryCollection(collection) {
  if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    return collection;
  }

  const cached = cache.get(collection);
  if (cached) return cached;

  const result = {
    ...collection,
    features: collection.features.map((feature) => ({
      ...feature,
      geometry: smoothGeometry(feature.geometry),
    })),
  };

  cache.set(collection, result);
  return result;
}
