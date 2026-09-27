import assert from 'node:assert/strict';
import { Climber } from '../lib/game/physics';
import { JumpController } from '../lib/game/jump';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { tickFatigue } from '../lib/game/climbing';
import { climb } from './circuit-driver';
import { tick } from './switchback-driver';
import { canPlantFoot } from './hang-driver';

for (const index of [10, 11]) {
  const level = structuredClone(jumpLabLevel);
  const entry = level.gripPoints.find((h) => h.id === `landing-${index}`)!;
  level.playerSpawn = { x: entry.x, y: entry.y + 95 };
  const g = new Climber(level);
  const j = new JumpController(g);
  tick(g, j, 60);
  const result = climb(g, j, index);
  assert.ok(!result.g.failed);
  assert.ok(result.g.grips.leftFoot || result.g.grips.rightFoot);
  const middle = level.gripPoints.find(
    (h) => h.id === `section-${index}-hand-3`,
  )!;
  assert.equal(
    canPlantFoot(level, middle),
    false,
    'No reachable footholds beneath the centre of the shuffle',
  );
  console.log('SHUFFLE', index, result.path);
}
const fatigueLevel = structuredClone(jumpLabLevel);
fatigueLevel.playerSpawn = { x: 500, y: 1045 };
const loaded = new Climber(fatigueLevel);
const hold = loaded.level.gripPoints.find((h) => h.id === 'landing-10')!;
loaded.grips = { leftHand: hold };
// Compare identical geometry with and without the authored stamina pressure.
const ordinary = Object.assign(
  Object.create(Climber.prototype),
  structuredClone(loaded),
) as Climber;
ordinary.grips.leftHand!.hangingDrain = 1;
tickFatigue(loaded, 0.1);
tickFatigue(ordinary, 0.1);
assert.ok(
  Math.abs(
    (100 - loaded.stamina.leftHand) / (100 - ordinary.stamina.leftHand) - 1.5,
  ) < 0.001,
);
console.log(
  'PASS two shuffle routes, foot-free centres and 50% stronger hanging drain',
);
