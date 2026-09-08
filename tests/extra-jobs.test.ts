import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { EXTRA_JOBS } from '../lib/game/extra-jobs';
import { Climber, LIMBS, distance } from '../lib/game/physics';
import { parseLevel } from '../lib/game/level';

assert.equal(EXTRA_JOBS.length, 5);
assert.equal(new Set(EXTRA_JOBS.map((job) => job.id)).size, 5);
for (const job of EXTRA_JOBS) {
  assert.ok(existsSync(`public${job.image}`), `${job.id} has its own artwork`);
  assert.ok(existsSync(`app${job.href}/page.tsx`));
  assert.ok(existsSync(`github-pages${job.href}/index.html`));
  assert.deepEqual(parseLevel(JSON.stringify(job.level)), job.level);
  const rig = new Climber(structuredClone(job.level));
  for (let i = 0; i < 240; i++) rig.step();
  assert.ok(rig.hasHandSupport(), `${job.id} starts securely on its ladder`);
  for (let cycle = 0; cycle < 65 && !rig.complete; cycle++) {
    for (const limb of LIMBS) {
      if (
        limb.endsWith('Hand') &&
        distance(rig.root(limb), rig.cat) < rig.reach(limb) + 8
      ) {
        rig.begin(limb, rig.cat);
        for (let i = 0; i < 55; i++) rig.step();
        rig.end();
        if (rig.complete) break;
      }
      const next = rig.level.gripPoints
        .filter(
          (grip) =>
            distance(grip, rig.root(limb)) < rig.reach(limb) - 3 &&
            grip.y < rig.p[limb].y - 10,
        )
        .sort((a, b) => a.y - b.y)[0];
      if (!next) continue;
      rig.begin(limb, next);
      for (let i = 0; i < 55; i++) rig.step();
      rig.end();
      for (let i = 0; i < 30; i++) rig.step();
    }
  }
  assert.ok(
    rig.complete,
    `${job.id} summit reachable from spawn using limb input; hip y=${rig.p.hip.y}`,
  );
  assert.equal(rig.failed, false);
  assert.equal(rig.message, job.level.objectives[0].successMessage);
  assert.equal(rig.carrying, null);
  const unsupported = new Climber(structuredClone(job.level));
  delete unsupported.grips.leftHand;
  delete unsupported.grips.rightHand;
  assert.equal(unsupported.begin('leftFoot', { x: 600, y: 100 }), false);
  unsupported.releaseAll();
  for (let i = 0; i < 500 && !unsupported.failed; i++) unsupported.step();
  assert.equal(unsupported.complete, false);
  console.log(
    `PASS ${job.id}: artwork, routes, complete input-driven ascent, repair and hand support`,
  );
}
