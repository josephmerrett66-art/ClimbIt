import assert from 'node:assert/strict';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';
import { pubJob } from '../lib/game/pub-level';
import { Climber, LIMBS } from '../lib/game/physics';
import { parseLevel } from '../lib/game/level';
for (const job of [pubJob, ...AUSTRALIAN_JOBS]) {
  const narrowHands = job.level.gripPoints.filter(
    (p) => p.singleLimb && p.use === 'hand',
  );
  const narrowFeet = job.level.gripPoints.filter(
    (p) => p.singleLimb && p.use === 'foot',
  );
  assert.ok(
    narrowHands.length >= 2 && narrowFeet.length >= 2,
    `${job.name}: hand sequence and foot transfer`,
  );
  const g = new Climber(structuredClone(job.level));
  const hold = { ...narrowHands[0], x: g.p.leftHand.x, y: g.p.leftHand.y };
  g.level.gripPoints = [hold];
  g.grips = { rightHand: hold };
  assert.equal(g.canUse('leftHand', hold), false);
  assert.equal(
    g.canUse('rightHand', hold),
    true,
    'Current owner may use its grip',
  );
  g.begin('leftHand', hold);
  assert.equal(
    g.grabPreview(),
    undefined,
    'Occupied notch never promises a snap',
  );
  g.end();
  assert.equal(g.grips.leftHand, undefined);
  assert.equal(g.grips.rightHand, hold);
  assert.match(g.message, /occupied/);
  delete g.grips.rightHand;
  assert.equal(
    g.canUse('leftHand', hold),
    true,
    'Vacating a contact opens it immediately',
  );
  const wide = { ...hold, singleLimb: false };
  g.grips.rightHand = wide;
  assert.equal(
    g.canUse('leftHand', wide),
    true,
    'Wide edges retain hand matching',
  );
  const foot = narrowFeet[0];
  g.grips = { leftFoot: foot };
  assert.equal(
    g.canUse('rightFoot', foot),
    false,
    'Boot transfers need distinct footing',
  );
}
const bad = structuredClone(AUSTRALIAN_JOBS[0].level) as any;
bad.gripPoints[0].singleLimb = 'yes';
assert.throws(() => parseLevel(JSON.stringify(bad)), /grip/);
const opal = AUSTRALIAN_JOBS.find((j) => j.id === 'opal-disco')!;
assert.equal(
  opal.level.gripPoints.find((p) => p.id === 'opal-firstRest-0')!.use,
  undefined,
  'Lower post allows a hand recovery catch',
);
console.log(
  'PASS all nine route moments: occupied snap rejection, ownership, release, wide hand matching, distinct boots, import validation and recovery contact',
);

const aim = new Climber(structuredClone(AUSTRALIAN_JOBS[0].level));
const oldEdge = {
  id: 'old-focus',
  x: aim.p.leftHand.x,
  y: aim.p.leftHand.y,
  use: 'hand' as const,
};
const nextEdge = {
  ...oldEdge,
  id: 'next-focus',
  x: oldEdge.x + 17 * aim.scale,
};
aim.level.gripPoints = [oldEdge, nextEdge];
aim.begin('leftHand', oldEdge);
aim.gripFocus = oldEdge;
aim.move(nextEdge);
aim.step();
assert.equal(
  aim.gripFocus?.id,
  'next-focus',
  'Deliberate aim overrides the old close-contact magnet',
);
console.log('PASS close-contact aim without extending grab reach');
