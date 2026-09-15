import assert from 'node:assert/strict';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';
import { pubJob } from '../lib/game/pub-level';
import { Climber, LIMBS } from '../lib/game/physics';
import { CONTACT_REACH } from '../lib/game/climbing';
import { efficiencyBonus, BONUS_CAP } from '../lib/game/scoring';

const railway = AUSTRALIAN_JOBS.find((j) => j.id === 'signal-esky')!.level;
const others = [
  pubJob.level,
  ...AUSTRALIAN_JOBS.filter((j) => j.id !== 'signal-esky').map((j) => j.level),
];

// Only the railway opts in. Every other job keeps constant reach, its own
// discovery radius and no scoring, exactly as before this pass.
assert.equal(railway.contactReach, true);
assert.equal(railway.discoveryRadius, 260);
assert.equal(railway.moveTarget, 110);
for (const level of others) {
  assert.equal(level.contactReach, undefined, `${level.id} opted in`);
  assert.equal(level.discoveryRadius, undefined, `${level.id} discovery`);
  assert.equal(level.moveTarget, undefined, `${level.id} scoring`);
}

// Reach shrinks as limbs leave their holds, and is strictly ordered.
const g = new Climber(structuredClone(railway));
const reachWith = (held: number) => {
  g.grips = {};
  for (const limb of LIMBS.filter((l) => l !== 'leftHand').slice(0, held))
    g.grips[limb] = railway.gripPoints[0];
  return g.reach('leftHand');
};
const [one, two, three] = [reachWith(1), reachWith(2), reachWith(3)];
assert.ok(one < two && two < three, `reach must increase with contacts`);
assert.equal(three, g.baseReach('leftHand'));
assert.ok(
  Math.abs(one / three - CONTACT_REACH[1]) < 1e-9,
  'one-contact reach follows the tuning curve',
);

// An established grip is judged against anatomical reach, so shifting a limb
// never pops a hold the climber is already standing on.
assert.equal(g.baseReach('leftFoot'), 86 * (railway.playerScale ?? 1));

// A level that does not opt in is unaffected by contact count.
const plain = new Climber(structuredClone(others[0]));
plain.grips = {};
const bare = plain.reach('leftHand');
plain.grips.rightHand = others[0].gripPoints[0];
assert.equal(plain.reach('leftHand'), bare);

// Moves are counted, and the bonus slides to zero rather than cliff-edging.
assert.equal(new Climber(structuredClone(railway)).moves, 0);
assert.equal(efficiencyBonus(railway, 110), 0);
assert.equal(efficiencyBonus(railway, 130), 0);
assert.equal(efficiencyBonus(railway, 100), 20);
assert.equal(efficiencyBonus(railway, 40), BONUS_CAP);
assert.equal(efficiencyBonus(others[0], 10), 0);

console.log('PASS railway strategy pass');
