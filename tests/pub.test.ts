import assert from 'node:assert/strict';
import { Climber, LIMBS, distance } from '../lib/game/physics';
import { pubLevel } from '../lib/game/pub-level';
const g = new Climber(structuredClone(pubLevel));
for (let i = 0; i < 180; i++) g.step();
console.log('spawn', g.p.hip, Object.keys(g.grips));
const waypoints = [
  { x: 300, y: 630 },
  { x: 824, y: 630 },
  { x: 775, y: 418 },
  { x: 316, y: 418 },
  { x: 316, y: 206 },
  { x: 1195, y: 206 },
];
for (const [stage, goal] of waypoints.entries()) {
  if (stage === 1 || stage === 3) {
    for (const limb of ['leftFoot', 'rightFoot'] as const) {
      g.begin(limb, { x: g.p[limb].x - 100, y: g.p[limb].y });
      for (let i = 0; i < 60; i++) g.step();
      g.end();
    }
  }
  for (let cycle = 0; cycle < 60; cycle++) {
    for (let settle = 0; settle < 60; settle++) g.step();
    for (const limb of LIMBS) {
      if ((stage === 1 || stage === 3) && limb.endsWith('Foot')) continue;
      const target = {
        x: goal.x,
        y: goal.y + (limb.endsWith('Foot') ? 95 : 0),
      };
      const candidates = g.level.gripPoints
        .filter(
          (p) =>
            g.canUse(limb, p) &&
            (!(stage === 1 || stage === 3) || p.y <= goal.y + 6) &&
            distance(p, g.root(limb)) < g.reach(limb) + 8 * g.scale &&
            distance(p, target) < distance(g.p[limb], target) - 8,
        )
        .sort((a, b) => distance(a, target) - distance(b, target));

      if (!candidates[0]) continue;
      g.begin(limb, candidates[0]);
      for (let i = 0; i < 60; i++) g.step();
      g.end();
      for (let i = 0; i < 35; i++) g.step();
    }
    if (['leftHand', 'rightHand'].every((l) => distance(g.p[l], goal) < 24))
      break;
  }
  console.log(
    'stage',
    stage,
    g.p.hip.x,
    g.p.hip.y,
    Object.fromEntries(
      Object.entries(g.grips).map(([k, v]) => [k, [v.x, v.y]]),
    ),
  );
  assert.ok(
    ['leftHand', 'rightHand'].some((l) => distance(g.p[l], goal) < 55),
    `Reach stage ${stage}`,
  );
  assert.equal(g.failed, false);
}
for (let attempt = 0; attempt < 6 && !g.complete; attempt++) {
  for (const limb of ['leftHand', 'rightHand'] as const) {
    g.begin(limb, g.cat);
    for (let i = 0; i < 150; i++) g.step();
    g.end();
  }
}
console.log(g.complete, g.message, g.repairProgress);
assert.ok(g.complete, 'Recover the keys from a stable one-handed position');

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
