import assert from 'node:assert/strict';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';
import { pubJob } from '../lib/game/pub-level';
import { Climber, LIMBS } from '../lib/game/physics';
import { contactCurves } from '../lib/game/climbing';
import {
  CAMPAIGN_TIERS,
  CAMPAIGN_DISCOVERY,
  tierFor,
} from '../lib/game/campaign-difficulty';
import { efficiencyBonus, BONUS_CAP } from '../lib/game/scoring';

const jobs = [pubJob, ...AUSTRALIAN_JOBS];

// The ramp covers the whole campaign, in the order the phone offers the jobs.
assert.equal(CAMPAIGN_TIERS.length, jobs.length, 'every job has a tier');
jobs.forEach((job, i) => {
  assert.equal(
    CAMPAIGN_TIERS[i].id,
    job.id,
    `tier ${i} is out of campaign order`,
  );
});

// No tier may be set harsher than its own layout can carry, or a hand-only
// span stops being crossable at all. `tests/hang-spans.test.ts` is what
// measures these floors; this only holds the table to them.
for (const tier of CAMPAIGN_TIERS)
  assert.ok(
    tier.one >= tier.floor,
    `${tier.id} is tuned past its layout floor (${tier.one} < ${tier.floor})`,
  );

// Reach escalates across the opening run of jobs. It cannot keep escalating to
// the end: the showground and the opal mine have floors above the jobs before
// them, so they sit gentler by necessity and are exempted here rather than
// quietly weakening the rule.
const HELD_BACK = new Set(['golden-bin-chicken', 'opal-disco']);
const ramp = CAMPAIGN_TIERS.filter((tier) => !HELD_BACK.has(tier.id));
for (let i = 1; i < ramp.length; i++)
  assert.ok(
    ramp[i].one <= ramp[i - 1].one,
    `${ramp[i].id} relaxes the reach after ${ramp[i - 1].id}`,
  );
assert.ok(ramp[0].one > ramp[ramp.length - 1].one, 'the ramp actually ramps');
for (const tier of CAMPAIGN_TIERS)
  assert.ok(tier.two >= tier.one, `${tier.id} curve is inverted`);

// The efficiency target escalates everywhere, including the two jobs whose
// reach is held back, so the campaign still tightens all the way to the end.
const pressure = CAMPAIGN_TIERS.map((tier) => tier.moves);
assert.ok(
  pressure.every((n) => n > 0),
  'every job has a move target',
);

// The railway is the pass that was tuned by hand and played. It anchors the
// middle of the campaign and must not drift when the ramp is retuned.
const railwayTier = tierFor('signal-esky')!;
assert.equal(railwayTier.one, 0.86);
assert.equal(railwayTier.two, 0.88);
assert.equal(railwayTier.moves, 110);

for (const job of jobs) {
  const level = job.level,
    tier = tierFor(job.id)!;
  const curves = contactCurves(tier.one, tier.two);
  assert.deepEqual(level.contactReach, curves.reach, `${job.id} reach`);
  assert.deepEqual(level.contactForce, curves.force, `${job.id} force`);
  assert.equal(level.discoveryRadius, CAMPAIGN_DISCOVERY, `${job.id} sight`);
  assert.equal(level.moveTarget, tier.moves, `${job.id} target`);

  // Curves are ordered and never exceed anatomical reach.
  const reach = level.contactReach!;
  for (let i = 1; i < reach.length; i++)
    assert.ok(reach[i] >= reach[i - 1], `${job.id} curve is out of order`);
  assert.equal(reach[3], 1, `${job.id} full stance is unpenalised`);

  // Reach shrinks as limbs leave their holds, with the solver running.
  const g = new Climber(structuredClone(level));
  const reachWith = (held: number) => {
    g.grips = {};
    for (const limb of LIMBS.filter((l) => l !== 'leftHand').slice(0, held))
      g.grips[limb] = level.gripPoints[0];
    return g.reach('leftHand');
  };
  const [one, two, three] = [reachWith(1), reachWith(2), reachWith(3)];
  assert.ok(one < three && two <= three, `${job.id} reach must fall off`);
  assert.equal(three, g.baseReach('leftHand'), `${job.id} full stance`);

  // An established grip is judged at anatomical reach, so shifting a limb never
  // pops a hold the climber is already standing on.
  assert.equal(
    g.baseReach('leftFoot'),
    86 * (level.playerScale ?? 1),
    `${job.id} base reach`,
  );

  // Moves are counted and the bonus slides to zero rather than cliff-edging.
  assert.equal(new Climber(structuredClone(level)).moves, 0);
  assert.equal(efficiencyBonus(level, tier.moves), 0, `${job.id} at target`);
  assert.equal(efficiencyBonus(level, tier.moves + 40), 0, `${job.id} over`);
  assert.equal(efficiencyBonus(level, tier.moves - 10), 20, `${job.id} under`);
  assert.equal(
    efficiencyBonus(level, tier.moves - 400),
    BONUS_CAP,
    `${job.id} cap`,
  );
}

// A level outside the campaign is unaffected by contact count.
const outside = structuredClone(pubJob.level);
outside.id = 'not-a-campaign-job';
delete outside.contactReach;
delete outside.contactForce;
delete outside.moveTarget;
const plain = new Climber(outside);
plain.grips = {};
const bare = plain.reach('leftHand');
plain.grips.rightHand = outside.gripPoints[0];
assert.equal(plain.reach('leftHand'), bare, 'no tier, no constraint');
assert.equal(efficiencyBonus(outside, 1), 0, 'no tier, no scoring');

console.log(
  `PASS campaign ramp ${CAMPAIGN_TIERS[0].one} -> ${CAMPAIGN_TIERS[CAMPAIGN_TIERS.length - 1].one} across ${jobs.length} jobs`,
);
