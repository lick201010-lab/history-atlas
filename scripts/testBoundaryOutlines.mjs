import assert from 'node:assert/strict';
import { createBoundaryOutlineCollection } from '../src/map/boundaryOutlines.js';

const originalOverride = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'sample-empire',
      properties: {
        id: 'sample-empire',
        startYear: 1200,
        endYear: 1300,
        color: '#16a085',
        outlineGeometry: {
          type: 'Polygon',
          coordinates: [
            [[0, 0], [4, 0], [4, 2], [0, 2], [0, 0]],
          ],
        },
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
          [[[2, 0], [4, 0], [4, 2], [2, 2], [2, 0]]],
        ],
      },
    },
  ],
};

const outlined = createBoundaryOutlineCollection(originalOverride);
assert.equal(outlined.type, 'FeatureCollection');
assert.equal(outlined.features.length, 1);
assert.equal(outlined.features[0].properties.id, 'sample-empire');
assert.deepEqual(outlined.features[0].geometry, originalOverride.features[0].properties.outlineGeometry);
assert.deepEqual(originalOverride.features[0].geometry.type, 'MultiPolygon');

const originalFallback = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'plain-empire', startYear: 1, endYear: 2 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[10, 10], [12, 10], [12, 12], [10, 12], [10, 10]],
        ],
      },
    },
  ],
};

const fallback = createBoundaryOutlineCollection(originalFallback);
assert.deepEqual(fallback.features[0].geometry, originalFallback.features[0].geometry);

console.log('Boundary outline collection tests passed.');
