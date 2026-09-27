import assert from 'node:assert/strict';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { Climber, distance } from '../lib/game/physics';
import { JumpController } from '../lib/game/jump';
import { solve, tick } from './switchback-driver';

const pads = jumpLabLevel.gripPoints.filter(
  (h) => h.jumpTarget || h.id === 'start-hands',
);
assert.equal(pads.length, 7, 'six jumps plus the starting hold');
assert.ok(
  jumpLabLevel.gripPoints.length > 30,
  'the jump line must include full climbing sections',
);
for (const stage of jumpLabLevel.jumpCourse!) {
  const launch = jumpLabLevel.gripPoints.find(
    (hold) => hold.id === stage.launch,
  );
  const target = jumpLabLevel.gripPoints.find((hold) => hold.id === stage.hold);
  assert.ok(
    launch && launch.surface === 'launch',
    `${stage.name} needs a LOAD pad`,
  );
  assert.ok(target?.jumpTarget, `${stage.name} needs a landing beacon`);
  assert.ok(
    distance(launch!, target!) > 220,
    `${stage.name} must require a jump`,
  );
}
const handHolds = jumpLabLevel.gripPoints.filter((hold) => hold.use === 'hand');
const hasClimbingLink = (fromId: string, toId: string) => {
  const seen = new Set([fromId]);
  const queue = [fromId];
  while (queue.length) {
    const currentId = queue.shift()!;
    const current = handHolds.find((hold) => hold.id === currentId)!;
    if (current.id === toId) return true;
    for (const next of handHolds) {
      if (
        !seen.has(next.id) &&
        !next.jumpTarget &&
        distance(current, next) <= 84
      ) {
        seen.add(next.id);
        queue.push(next.id);
      }
    }
  }
  return false;
};
for (let index = 0; index < jumpLabLevel.jumpCourse!.length - 1; index++) {
  const landing = jumpLabLevel.jumpCourse![index].hold;
  const nextLaunch = jumpLabLevel.jumpCourse![index + 1].launch!;
  assert.ok(
    hasClimbingLink(landing, nextLaunch),
    `${landing} must connect to ${nextLaunch} as a climb`,
  );
}
const { g, j, results } = solve();
assert.equal(j.completedJumps, 6);
assert.equal(
  g.complete,
  true,
  'a continuous run must recover each catch and control the finish',
);
console.table(results);

// Merely teleporting to the finish without linking the jumps must not clear.
const shortcut = new Climber(structuredClone(jumpLabLevel));
const controller = new JumpController(shortcut);
const finish = shortcut.level.gripPoints.find((h) => h.id === 'jump-red')!;
shortcut.grips = { leftHand: finish, rightHand: finish };
tick(shortcut, controller, 100);
assert.equal(shortcut.complete, false);
assert.equal(
  controller.select(finish),
  'none',
  'matching a held pad must remain a limb interaction',
);
console.log(
  'PASS: all six jumps, foot recoveries and controlled finish; shortcuts do not clear the run',
);
