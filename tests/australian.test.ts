import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';
import { parseLevel } from '../lib/game/level';
import { Climber } from '../lib/game/physics';
import { climbRoute } from './route-driver';
assert.equal(AUSTRALIAN_JOBS.length, 8);
assert.equal(new Set(AUSTRALIAN_JOBS.map((j) => j.image)).size, 8);
for (const job of AUSTRALIAN_JOBS) {
  if (process.env.JOB && process.env.JOB !== job.href.slice(1)) continue;
  assert.ok(existsSync(`public${job.image}`));
  assert.deepEqual(
    parseLevel(JSON.stringify(job.level)),
    JSON.parse(JSON.stringify(job.level)),
  );
  assert.ok(job.route.some((p) => p[2] === 'hang'));
  assert.ok(existsSync(`app${job.href}/page.tsx`));
  assert.ok(existsSync(`github-pages${job.href}/index.html`));
  const support = new Climber(structuredClone(job.level));
  delete support.grips.leftHand;
  delete support.grips.rightHand;
  assert.equal(
    support.begin('leftFoot', support.cat),
    false,
    'Feet cannot climb without hand support',
  );
  for (const p of Object.values(support.p)) {
    p.y -= 200;
    p.py -= 200;
  }
  support.releaseAll();
  for (let i = 0; i < 500 && !support.failed; i++) support.step();
  assert.ok(support.failed);
  assert.equal(support.complete, false);
  const tap = new Climber(structuredClone(job.level));
  for (let i = 0; i < 180; i++) tap.step();
  const hand = tap.grips.leftHand ?? tap.grips.rightHand!;
  const limb = tap.grips.leftHand ? 'leftHand' : 'rightHand';
  tap.cat.x = hand.x;
  tap.cat.y = hand.y;
  tap.begin(limb, hand);
  tap.end();
  assert.equal(tap.complete, false, 'Brief contact cannot complete a job');
  assert.ok(
    tap.grips[limb],
    'Incomplete interaction still catches a valid hold',
  );
  climbRoute(job.level, job.route);
  console.log(`PASS ${job.name}`);
}
