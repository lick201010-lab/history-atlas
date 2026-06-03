const cache = new WeakMap();

function isOutlineGeometry(geometry) {
  return geometry
    && (geometry.type === 'Polygon'
      || geometry.type === 'MultiPolygon'
      || geometry.type === 'LineString'
      || geometry.type === 'MultiLineString')
    && Array.isArray(geometry.coordinates);
}

function outlineGeometryForFeature(feature) {
  const override = feature?.properties?.outlineGeometry;
  if (isOutlineGeometry(override)) return override;
  return feature?.geometry;
}

export function createBoundaryOutlineCollection(collection) {
  if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    return collection;
  }
  const cached = cache.get(collection);
  if (cached) return cached;

  const result = {
    ...collection,
    features: collection.features.map((feature) => ({
      ...feature,
      geometry: outlineGeometryForFeature(feature),
    })),
  };

  cache.set(collection, result);
  return result;
}
