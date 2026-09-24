import assert from 'node:assert/strict';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { JumpController } from '../lib/game/jump';
import { Climber, distance } from '../lib/game/physics';

const game = new Climber(structuredClone(jumpLabLevel));
const jump = new JumpController(game);
const target = jumpLabLevel.gripPoints.find(
  (hold) => hold.id === 'jump-cyan',
)!;

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
    ((p.x - p.px) * targetDirection.x +
      (p.y - p.py) * targetDirection.y) /
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
console.log(
  'PASS dyno coils deeply, drives through the feet, leads with one hand, trails the spare limbs and catches within anatomical reach',
);
