import assert from 'node:assert/strict';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';
import { Climber, LIMBS } from '../lib/game/physics';
import {
  estimateLoads,
  tickFatigue,
  tickDiscovery,
  tremblingJoint,
} from '../lib/game/climbing';
const level = AUSTRALIAN_JOBS.find((j) => j.id === 'opal-disco')!.level;
const fixture = () => {
  const g = new Climber(structuredClone(level));
  g.grips = {};
  const pose: Record<string, [number, number]> = {
    hip: [500, 500],
    neck: [500, 460],
    leftHip: [489, 500],
    rightHip: [511, 500],
    leftShoulder: [483, 460],
    rightShoulder: [517, 460],
  };
  for (const [name, [x, y]] of Object.entries(pose))
    Object.assign(g.p[name], { x, y, px: x, py: y });
  return g;
};
const attach = (g: Climber, l: (typeof LIMBS)[number], x: number, y: number) =>
  (g.grips[l] = { id: l, x, y });
const one = fixture();
attach(one, 'leftHand', 483, 410);
const singleLoad = estimateLoads(one).leftHand;
const two = fixture();
attach(two, 'leftHand', 483, 410);
attach(two, 'rightHand', 517, 410);
assert.ok(estimateLoads(two).leftHand < singleLoad * 0.6);
const resting = fixture();
attach(resting, 'leftHand', 483, 410);
attach(resting, 'rightHand', 517, 410);
attach(resting, 'leftFoot', 480, 550);
attach(resting, 'rightFoot', 520, 550);
assert.ok(estimateLoads(resting).leftHand < 0.14);
resting.stamina.leftHand = 40;
tickFatigue(resting, 2);
assert.ok(resting.stamina.leftHand > 40);
assert.ok(resting.stamina.leftFoot < 100, 'Supporting feet still work');
const awkward = fixture();
attach(awkward, 'leftHand', 483, 410);
attach(awkward, 'rightHand', 517, 410);
attach(awkward, 'leftFoot', 450, 480);
attach(awkward, 'rightFoot', 550, 480);
assert.ok(estimateLoads(awkward).leftHand > 0.4);
awkward.stamina.leftHand = 40;
tickFatigue(awkward, 2);
assert.ok(awkward.stamina.leftHand < 40);
two.stamina.leftHand = 0.001;
two.stamina.rightHand = 80;
tickFatigue(two, 1 / 60);
assert.equal(two.grips.leftHand, undefined);
assert.ok(two.grips.rightHand);
assert.equal(two.failed, false);
assert.ok(estimateLoads(two).rightHand > 0.9);
const remaining = two.stamina.rightHand;
tickFatigue(two, 1);
assert.ok(two.stamina.leftHand > 0);
assert.ok(two.stamina.rightHand < remaining);
const a = fixture(),
  b = fixture();
attach(a, 'leftHand', 483, 410);
attach(b, 'leftHand', 483, 410);
tickFatigue(a, 2);
for (let i = 0; i < 120; i++) tickFatigue(b, 1 / 60);
assert.ok(Math.abs(a.stamina.leftHand - b.stamina.leftHand) < 1e-8);
const near = { id: 'near', x: 600, y: 480 },
  far = { id: 'far', x: 1200, y: 100 };
a.level.gripPoints = [near, far];
tickDiscovery(a, 1);
assert.ok(a.holdVisibility.near > 0.1, 'Idle body discovers next holds');
assert.equal(a.holdVisibility.far, 0);
assert.equal(
  a.reachableHold('leftHand', near, 30),
  undefined,
  'Discovery does not expand reach',
);
const before = a.holdVisibility.near;
a.p.hip.x = 1200;
a.p.neck.x = 1200;
tickDiscovery(a, 1 / 60);
assert.ok(
  a.holdVisibility.near > 0 && a.holdVisibility.near < before,
  'Smooth fade',
);
a.stamina.leftHand = 1;
a.elapsed = 1;
const original = structuredClone(a.p.leftElbow);
assert.notDeepEqual(tremblingJoint(a, 'leftHand', a.p.leftElbow), original);
assert.deepEqual(a.p.leftElbow, original, 'Tremble never changes physics');
for (const job of AUSTRALIAN_JOBS.filter((j) => j.id !== 'opal-disco')) {
  const g = new Climber(job.level);
  for (let i = 0; i < 240; i++) g.step();
  assert.equal(g.stamina.leftHand, 100);
  assert.equal(g.level.fatigue, undefined);
}
console.log(
  'PASS load sharing, rest geometry, independent failure, recovery, time partition, body discovery, render-only tremble and other-job isolation',
);

const footFailure = fixture();
attach(footFailure, 'leftHand', 483, 410);
attach(footFailure, 'leftFoot', 480, 550);
attach(footFailure, 'rightFoot', 520, 550);
footFailure.stamina.leftFoot = 0.001;
tickFatigue(footFailure, 1 / 60);
assert.equal(footFailure.grips.leftFoot, undefined);
assert.ok(footFailure.grips.rightFoot && footFailure.grips.leftHand);
const reveal = fixture();
const usable = { id: 'usable', x: 483, y: 410, use: 'hand' as const };
reveal.level.gripPoints = [usable];
tickDiscovery(reveal, 1);
const idle = reveal.holdVisibility.usable;
reveal.selectedLimb = 'leftHand';
tickDiscovery(reveal, 1);
assert.ok(reveal.holdVisibility.usable > idle);
reveal.selectedLimb = 'leftFoot';
tickDiscovery(reveal, 1);
assert.ok(
  reveal.holdVisibility.usable < 0.6,
  'Selecting a foot does not promise a hand-only hold',
);
console.log('PASS independent boot failure and selected-limb discovery');
