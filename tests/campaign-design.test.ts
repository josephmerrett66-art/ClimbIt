import assert from 'node:assert/strict';
import { AUSTRALIAN_JOBS, AUSTRALIAN_SPECS } from '../lib/game/australian-jobs';
import { pubJob } from '../lib/game/pub-level';
import { makeClimb } from '../lib/game/campaign';
import { Climber, distance } from '../lib/game/physics';
import { CLIMBING, tickFatigue } from '../lib/game/climbing';
import plans from '../lib/game/campaign-contacts.json';
import routes from '../lib/game/australian-routes.json';

assert.ok(CLIMBING.handDrain >= 9.5 && CLIMBING.recovery <= 5.5);
assert.ok(CLIMBING.footDrain >= 1.1);
for (const job of [pubJob, ...AUSTRALIAN_JOBS]) {
  const l = job.level;
  assert.equal(l.fatigue, true);
  assert.equal(
    new Set(l.gripPoints.map((p) => `${p.x},${p.y}`)).size,
    l.gripPoints.length,
  );
  for (const p of l.gripPoints)
    assert.ok(
      p.x >= 0 && p.y >= 0 && p.x <= l.worldWidth && p.y <= l.worldHeight,
    );
  if (job.id !== 'pub-keys') {
    const spec = AUSTRALIAN_SPECS.find((s) => s.id === job.id)!;
    const baseline = makeClimb({
      ...spec,
      ...routes[spec.slug as keyof typeof routes],
    } as any);
    assert.ok(
      l.gripPoints.length < baseline.level.gripPoints.length * 0.65,
      `${job.name}: substantial intentional thinning`,
    );
    console.log(
      job.name,
      baseline.level.gripPoints.length,
      '→',
      l.gripPoints.length,
    );
  }
  const restPoints =
    job.id === 'pub-keys'
      ? [[410, 610]]
      : job.id === 'opal-disco'
        ? [[385, 563]]
        : plans[job.href.slice(1) as keyof typeof plans].rests;
  const normalize = (x: number, y: number) =>
    job.id === 'pub-keys'
      ? { x, y }
      : { x: (x * 1600) / 1586, y: (y * 1000) / 992 };
  let workingRests = 0;
  for (const [x, y] of restPoints) {
    const hand = l.gripPoints.find(
      (p) => distance(p, normalize(x, y)) < 1 && p.use !== 'foot',
    );
    const left = l.gripPoints.find(
      (p) => distance(p, normalize(x, y + 92)) < 1 && p.use !== 'hand',
    );
    const right = l.gripPoints.find(
      (p) => distance(p, normalize(x, y + 130)) < 1 && p.use !== 'hand',
    );
    if (!hand || !left || !right) continue;
    const g = new Climber({ ...l, playerSpawn: normalize(x, y + 47) });
    g.grips = {
      leftHand: hand,
      rightHand: hand,
      leftFoot: left,
      rightFoot: right,
    };
    for (let i = 0; i < 120; i++) g.step();
    g.stamina.leftHand = g.stamina.rightHand = 30;
    for (let i = 0; i < 600; i++) g.step();
    if (
      g.stamina.leftHand > 40 &&
      g.stamina.rightHand > 40 &&
      Object.keys(g.grips).length === 4
    )
      workingRests++;
  }
  assert.ok(
    workingRests > 0,
    `${job.name}: at least one proven natural resting stance`,
  );
}
// Under the previous rates a 10-second one-hand load used 75 stamina. It now
// uses 95, and releasing a limb for five seconds restores only 27.5 points.
const g = new Climber(AUSTRALIAN_JOBS[0].level);
g.grips = {
  leftHand: { id: 'loaded', x: g.root('leftHand').x, y: g.root('leftHand').y },
};
tickFatigue(g, 10);
assert.ok(g.stamina.leftHand <= 5.01);
delete g.grips.leftHand;
tickFatigue(g, 5);
assert.ok(g.stamina.leftHand <= 32.51);
console.log(
  'PASS all jobs: sparse contacts, efficient rests, shared discovery/fatigue and harsher rates',
);
