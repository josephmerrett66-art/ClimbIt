import assert from 'node:assert/strict';
import { Climber, LIMBS, distance } from '../lib/game/physics';
import { pubLevel } from '../lib/game/pub-level';
import { climbRoute } from './route-driver';
climbRoute(pubLevel, [
  [196, 916],
  [234, 610],
  [410, 610, 'hang'],
  [590, 610, 'hang'],
  [810, 610, 'hang'],
  [790, 450],
  [430, 450, 'hang'],
  [460, 280],
  [645, 224],
]);

const rules = new Climber(structuredClone(pubLevel));
const handOnly = pubLevel.gripPoints.find((p) => p.use === 'hand')!;
const footOnly = pubLevel.gripPoints.find((p) => p.use === 'foot')!;
assert.equal(rules.canUse('leftFoot', handOnly), false);
assert.equal(rules.canUse('leftHand', footOnly), false);
rules.level.colliders.push({
  id: 'test-obstruction',
  type: 'rect',
  x: rules.root('leftHand').x + 10,
  y: 0,
  x2: rules.root('leftHand').x + 20,
  y2: 1000,
});
assert.equal(
  rules.clearReach('leftHand', {
    x: rules.root('leftHand').x + 40,
    y: rules.root('leftHand').y,
  }),
  false,
);
const fall = new Climber(structuredClone(pubLevel));
for (const p of Object.values(fall.p)) {
  p.x = 1450;
  p.px = 1450;
  p.y -= 300;
  p.py -= 300;
}
fall.releaseAll();
for (let i = 0; i < 500 && !fall.failed; i++) fall.step();
assert.ok(fall.failed);
assert.equal(fall.complete, false);
console.log(
  'PASS pub traverses, corner transitions, supported key pickup, hold types, blocked reach and ground fall',
);
