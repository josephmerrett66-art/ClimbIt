import assert from 'node:assert/strict';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { JumpController } from '../lib/game/jump';
import { Climber, distance } from '../lib/game/physics';
import type { Level } from '../lib/game/level';

// Stage the climber hanging off a pad with both hands matched and one boot
// planted — the stance every launch in the lab is made from. The ground is
// deliberately not a launch position any more, so a dyno test has to start by
// putting the body somewhere a dyno is legal.
function onPad(level: Level, padId: string, footId: string) {
  const g = new Climber(structuredClone(level), false);
  const pad = g.level.gripPoints.find((p) => p.id === padId)!;
  const boot = g.level.gripPoints.find((p) => p.id === footId)!;
  const dx = pad.x - g.p.leftHand.x;
  const dy = pad.y - g.p.leftHand.y;
  for (const p of Object.values(g.p)) {
    p.x += dx;
    p.px += dx;
    p.y += dy;
    p.py += dy;
  }
  g.grips = { leftHand: pad, rightHand: pad, leftFoot: boot };
  for (let i = 0; i < 180; i++) g.step();
  return g;
}

const target = jumpLabLevel.gripPoints.find((h) => h.id === 'land-roof')!;

// ---------------------------------------------------------------------------
// The staged body mechanics: coil, drive, lead hand, trailing limbs, one-handed
// catch. This is the original mechanic test, re-pointed at the rebuilt lab.
const game = onPad(jumpLabLevel, 'pad-roof', 'pad-roof-f1');
const jump = new JumpController(game);

assert.equal(jump.select(target), 'selected');
assert.equal(jump.startCharge(), true);
const standingHipY = game.p.hip.y;

for (let frame = 0; frame < 70; frame++) {
  game.step();
  jump.step(1 / 60);
}

assert.equal(jump.state, 'charging');
assert.ok(
  game.p.hip.y > standingHipY + 18 * game.scale,
  `the loaded stance should visibly lower the hips (moved ${(game.p.hip.y - standingHipY).toFixed(1)}px)`,
);
assert.equal(jump.release(), true);

for (let frame = 0; frame < 18; frame++) {
  if ((jump.state as string) === 'airborne') break;
  game.step();
  jump.step(1 / 60);
}

assert.equal(jump.state, 'airborne');
assert.equal(Object.keys(game.grips).length, 0);

const targetDirection = {
  x: target.x - game.p.hip.x,
  y: target.y - game.p.hip.y,
};
const targetLength = Math.hypot(targetDirection.x, targetDirection.y);
const projectVelocity = (name: string) => {
  const p = game.p[name];
  return (
    ((p.x - p.px) * targetDirection.x + (p.y - p.py) * targetDirection.y) /
    targetLength
  );
};
const leadHand = target.x >= game.p.hip.x ? 'rightHand' : 'leftHand';
const trailingHand = leadHand === 'rightHand' ? 'leftHand' : 'rightHand';
const handLead = projectVelocity(leadHand);
assert.ok(
  handLead > projectVelocity('hip'),
  'the catching hand should leave take-off moving ahead of the hips',
);
assert.ok(
  projectVelocity(trailingHand) < handLead,
  'the spare arm should trail rather than holding the same rigid flight pose',
);

let caught = false;
let closest = Infinity;
for (let frame = 0; frame < 90 && !game.failed; frame++) {
  game.step();
  jump.step(1 / 60);
  const handDistance = Math.min(
    distance(game.p.leftHand, target),
    distance(game.p.rightHand, target),
  );
  closest = Math.min(closest, handDistance);
  if (handDistance <= 64 * game.scale) {
    caught = jump.tryCatch(target);
    if (caught) break;
  }
}

assert.equal(
  caught,
  true,
  'the hands only came within ' + closest.toFixed(1) + 'px',
);
assert.ok(game.grips.leftHand || game.grips.rightHand);
assert.equal(
  Object.keys(game.grips).length,
  1,
  'the leading hand catches while the spare arm and legs remain free to swing',
);

// ---------------------------------------------------------------------------
// The launch gates. A jump needs both hands matched on one pad and a boot down,
// and the lab's whole grammar rests on the first of those refusing a notch.
{
  const g = onPad(jumpLabLevel, 'pad-roof', 'pad-roof-f1');
  const j = new JumpController(g);
  const grip = (id: string) => g.level.gripPoints.find((h) => h.id === id)!;
  const pad = grip('pad-roof');
  const boot = grip('pad-roof-f1');
  const notch = grip('return-3');
  assert.equal(
    notch.singleLimb,
    true,
    'the connective holds must be single-limb or they become launch pads',
  );
  assert.equal(j.select(target), 'selected');

  // Hands split across two holds: no launch, however good the stance.
  g.grips = { leftHand: pad, rightHand: notch, leftFoot: boot };
  assert.equal(j.startCharge(), false, 'unmatched hands must refuse to coil');

  // Hands matched, boots off: still no launch.
  g.grips = { leftHand: pad, rightHand: pad };
  assert.equal(j.startCharge(), false, 'a launch with no boot down must refuse');

  g.grips = { leftHand: pad, rightHand: pad, leftFoot: boot };
  assert.equal(
    j.startCharge(),
    true,
    'matched hands and a planted boot should load',
  );
}

// ---------------------------------------------------------------------------
// Committing to a beacon the mechanic cannot reach teaches nothing, so
// selection refuses it rather than letting the flight discover it.
{
  const g = onPad(jumpLabLevel, 'pad-roof', 'pad-roof-f1');
  const j = new JumpController(g);
  const far = g.level.gripPoints.find((h) => h.id === 'land-ledge')!;
  assert.equal(
    j.select(far),
    'none',
    'a beacon most of a wall away must not be selectable',
  );
  assert.equal(j.target, null);
  assert.equal(j.select(target), 'selected');
}

console.log(
  'PASS dyno coils deeply, drives through the feet, leads with one hand, ' +
    'trails the spare limbs, catches within anatomical reach, and refuses to ' +
    'load from unmatched hands, bare feet or an unreachable beacon',
);
