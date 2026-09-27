import assert from 'node:assert/strict';
import { jumpLabLevel, boulderSections } from '../lib/game/jump-lab';
import { Climber, distance } from '../lib/game/physics';
import { jumpFor } from '../lib/game/jump';
import { BoulderPractice } from '../lib/game/practice';
import { tick } from './switchback-driver';
import { solveCircuit } from './circuit-driver';
assert.equal(boulderSections.length, 5);
assert.equal(
  jumpLabLevel.gripPoints.length,
  35,
  'Seven deliberately spaced holds per section',
);
for (let i = 0; i < 5; i++) {
  const section = jumpLabLevel.gripPoints.slice(i * 7, i * 7 + 7);
  for (let a = 0; a < section.length; a++)
    for (let b = a + 1; b < section.length; b++)
      assert.ok(distance(section[a], section[b]) >= 40, 'No hold clusters');
}
const { g, j } = solveCircuit();
assert.equal(j.completedJumps, 4);
assert.ok(
  g.complete,
  'Complete all climbs and jumps through normal input, without teleporting',
);
const shortcut = new Climber(structuredClone(jumpLabLevel));
const sj = jumpFor(shortcut)!;
const final = shortcut.level.gripPoints.find(
  (h) => h.id === shortcut.level.boulderFinish,
)!;
shortcut.grips = { leftHand: final, rightHand: final };
tick(shortcut, sj, 120);
assert.equal(shortcut.complete, false);
const start = new Climber(structuredClone(jumpLabLevel));
const jump = jumpFor(start)!;
tick(start, jump, 60);
const practice = new BoulderPractice();
practice.capture(start);
const original = start.p.hip.x;
start.p.hip.x += 100;
const restored = practice.restore()!;
assert.ok(restored);
assert.equal(restored.p.hip.x, original);
tick(restored, jumpFor(restored)!, 30);
assert.ok(Number.isFinite(restored.p.hip.x));
console.log(
  'PASS: sparse route, continuous climb/jump solution, finish gate and practice restore',
);
