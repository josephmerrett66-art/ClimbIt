import assert from 'node:assert/strict';
import { jumpLabLevel, boulderSections } from '../lib/game/jump-lab';
import { Climber, distance } from '../lib/game/physics';
import { jumpFor } from '../lib/game/jump';
import { BoulderPractice } from '../lib/game/practice';
import { tick } from './switchback-driver';
import { solveCircuit } from './circuit-driver';
assert.equal(boulderSections.length, 12);
assert.equal(
  jumpLabLevel.fatigue,
  true,
  'Test Area uses the same load-based stamina as campaign climbs',
);
assert.equal(
  jumpLabLevel.gripPoints.length,
  93,
  'Ninety-three intentionally placed holds across twelve problems',
);
const holds = jumpLabLevel.gripPoints;
for (let a = 0; a < holds.length; a++)
  for (let b = a + 1; b < holds.length; b++)
    assert.ok(
      distance(holds[a], holds[b]) -
        (holds[a].motion?.amplitude ?? 0) -
        (holds[b].motion?.amplitude ?? 0) >=
        40,
      `No hold clusters, even during motion: ${holds[a].id}, ${holds[b].id}`,
    );
const hanging = new Climber(structuredClone(jumpLabLevel));
const startHold = hanging.level.gripPoints.find(
  (hold) => hold.id === 'start-hands',
)!;
hanging.grips = { leftHand: startHold, rightHand: startHold };
tick(hanging, jumpFor(hanging)!, 300);
assert.ok(
  Math.min(hanging.stamina.leftHand, hanging.stamina.rightHand) < 85,
  'Hanging through a problem has a meaningful stamina cost',
);
const { g, j } = solveCircuit();
assert.equal(j.completedJumps, 11);
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
