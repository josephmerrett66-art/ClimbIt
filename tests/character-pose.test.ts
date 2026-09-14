import assert from 'node:assert/strict';
import { characterPose } from '../lib/game/character-pose';
import { Climber, LIMBS } from '../lib/game/physics';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';

const g = new Climber(structuredClone(AUSTRALIAN_JOBS[0].level));
const first = characterPose(g);
for (const p of Object.values(g.p)) p.x += 8 * g.scale;
g.elapsed += 1 / 60;
const physical = JSON.stringify(g.p);
const next = characterPose(g);
assert.ok(
  next.hip.x > first.hip.x && next.hip.x < g.p.hip.x,
  'Body follows with a short ease',
);
for (const limb of LIMBS)
  assert.deepEqual(
    next[limb],
    { x: g.p[limb].x, y: g.p[limb].y },
    'Contacts stay exact',
  );
assert.equal(JSON.stringify(g.p), physical, 'Rendering must not alter physics');
assert.deepEqual(
  characterPose(g),
  next,
  'Drawing a paused frame does not creep',
);
for (let i = 0; i < 120; i++) {
  g.elapsed += 1 / 60;
  const pose = characterPose(g);
  for (const side of ['left', 'right'])
    for (const hand of [true, false]) {
      const root = pose[side + (hand ? 'Shoulder' : 'Hip')];
      const end = pose[side + (hand ? 'Hand' : 'Foot')];
      const joint = pose[side + (hand ? 'Elbow' : 'Knee')];
      const dx = end.x - root.x,
        dy = end.y - root.y;
      const sign = (side === 'left' ? -1 : 1) * (hand ? 1 : -1);
      assert.ok(
        ((joint.x - root.x) * -dy + (joint.y - root.y) * dx) * sign >= 0,
        'Hinges retain their bend direction',
      );
    }
}
assert.ok(Math.abs(characterPose(g).hip.x - g.p.hip.x) < 0.001, 'Pose settles');
g.elapsed += 1;
assert.deepEqual(
  characterPose(g).hip,
  { x: g.p.hip.x, y: g.p.hip.y },
  'Resume without stale pose',
);
console.log(
  'PASS connected character pose: exact contacts, smooth follow, stable hinges and no physics mutation',
);
