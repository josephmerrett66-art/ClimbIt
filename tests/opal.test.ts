import assert from 'node:assert/strict';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';
import { Climber } from '../lib/game/physics';
import { makeClimb } from '../lib/game/campaign';
import { AUSTRALIAN_SPECS } from '../lib/game/australian-jobs';
import routes from '../lib/game/australian-routes.json';
const level = AUSTRALIAN_JOBS.find((j) => j.id === 'opal-disco')!.level;
const g = new Climber({
  ...level,
  playerSpawn: { x: (385 * 1600) / 1586, y: (610 * 1000) / 992 },
});
const find = (x: number, y: number) =>
  level.gripPoints.find(
    (p) =>
      Math.abs(p.x - (x * 1600) / 1586) < 1 &&
      Math.abs(p.y - (y * 1000) / 992) < 1,
  )!;
g.grips = {
  leftHand: find(385, 563),
  rightHand: find(385, 563),
  leftFoot: find(385, 655),
  rightFoot: find(385, 693),
};
g.stamina.leftHand = 30;
g.stamina.rightHand = 30;
for (let i = 0; i < 600; i++) g.step();
assert.ok(
  g.stamina.leftHand > 45 && g.stamina.rightHand > 45,
  'Actual lower landing stance rests both arms',
);
assert.ok(
  g.stamina.leftFoot < 99 && g.stamina.rightFoot < 99,
  'Rest requires foot work',
);
assert.equal(Object.keys(g.grips).length, 4);
const oldCount = makeClimb({
  ...AUSTRALIAN_SPECS.find((s) => s.id === 'opal-disco')!,
  ...routes['opal-mine'],
} as any).level.gripPoints.length;
assert.ok(level.gripPoints.length < oldCount * 0.5);
assert.equal(
  new Set(level.gripPoints.map((p) => `${p.x},${p.y}`)).size,
  level.gripPoints.length,
);
console.log(
  'PASS natural landing rest and sparse unique holds',
  oldCount,
  level.gripPoints.length,
);
