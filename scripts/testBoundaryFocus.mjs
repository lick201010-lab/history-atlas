import assert from 'node:assert/strict';
import {
  boundaryOpacityExpression,
  buildFocusIds,
  isFocusActive,
} from '../src/map/boundaryFocus.js';

assert.deepEqual(
  buildFocusIds({ selectedId: 'mongol-empire', hoveredId: 'ottoman', compareIds: ['mongol-empire', 'sasanian'] }),
  ['mongol-empire', 'ottoman', 'sasanian'],
);

assert.deepEqual(
  buildFocusIds({ selectedId: null, hoveredId: '', compareIds: [null, 'maya', 'maya'] }),
  ['maya'],
);

assert.equal(isFocusActive([]), false);
assert.equal(isFocusActive(['maya']), true);

const base = boundaryOpacityExpression({
  focusIds: [],
  refined: 0.45,
  plain: 0.22,
  mutedRefined: 0.08,
  mutedPlain: 0.04,
});

assert.deepEqual(base, [
  'case',
  ['in', ['get', 'accuracy'], ['literal', ['rough-refined', 'coastline-aware-rough']]],
  0.45,
  0.22,
]);

const focused = boundaryOpacityExpression({
  focusIds: ['mongol-empire', 'ottoman'],
  refined: 0.45,
  plain: 0.22,
  mutedRefined: 0.08,
  mutedPlain: 0.04,
});

assert.deepEqual(focused, [
  'case',
  ['in', ['get', 'id'], ['literal', ['mongol-empire', 'ottoman']]],
  [
    'case',
    ['in', ['get', 'accuracy'], ['literal', ['rough-refined', 'coastline-aware-rough']]],
    0.45,
    0.22,
  ],
  [
    'case',
    ['in', ['get', 'accuracy'], ['literal', ['rough-refined', 'coastline-aware-rough']]],
    0.08,
    0.04,
  ],
]);

console.log('Boundary focus expression tests passed.');
