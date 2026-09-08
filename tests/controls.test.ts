import assert from 'node:assert/strict';
import {
  START_ZOOM,
  cameraTarget,
  selectLimb,
  dragTarget,
} from '../lib/game/controls';
import { catLevel, churchLevel, towerLevel } from '../lib/game/level';
import { EXTRA_JOBS } from '../lib/game/extra-jobs';
import { Climber } from '../lib/game/physics';

for (const level of [
  catLevel,
  churchLevel,
  towerLevel,
  ...EXTRA_JOBS.map((j) => j.level),
]) {
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1440, 900],
  ]) {
    for (const focus of [level.playerSpawn, level.objectives[0]]) {
      const v = cameraTarget(width, height, level, focus, START_ZOOM, false);
      const b = level.cameraBounds;
      assert.equal(v.scale, Math.max(width / b.width, height / b.height) * 1.6);
      assert.ok(
        b.x * v.scale + v.x <= 0.001 &&
          (b.x + b.width) * v.scale + v.x >= width - 0.001,
      );
      assert.ok(
        b.y * v.scale + v.y <= 0.001 &&
          (b.y + b.height) * v.scale + v.y >= height - 0.001,
      );
      assert.ok(
        focus.x * v.scale + v.x >= 0 && focus.x * v.scale + v.x <= width,
      );
      assert.ok(
        focus.y * v.scale + v.y >= 0 && focus.y * v.scale + v.y <= height,
      );
    }
  }
}
const rig = new Climber(structuredClone(catLevel));
for (const scale of [0.8, 1.6, 2.4]) {
  const near = { x: rig.p.leftHand.x - 40 / scale, y: rig.p.leftHand.y };
  assert.equal(selectLimb(rig, near, scale, true, null), 'leftHand');
  assert.equal(selectLimb(rig, near, scale, false, null), null);
}
const pointer = { x: 100, y: 800 };
const endpoint = { ...rig.p.leftHand };
const offset = { x: endpoint.x - pointer.x, y: endpoint.y - pointer.y };
assert.equal(selectLimb(rig, pointer, 1.6, true, 'leftHand'), 'leftHand');
assert.deepEqual(dragTarget(pointer, offset), { x: endpoint.x, y: endpoint.y });
assert.deepEqual(dragTarget({ x: pointer.x + 20, y: pointer.y - 30 }, offset), {
  x: endpoint.x + 20,
  y: endpoint.y - 30,
});
const hold = rig.grips.leftHand!;
rig.begin('leftHand', hold);
for (let i = 0; i < 30; i++) rig.step();
rig.cat.x = rig.p.leftHand.x;
rig.cat.y = rig.p.leftHand.y;
rig.end(true);
assert.ok(rig.grips.leftHand, 'Interrupted gesture keeps a reachable grip');
assert.equal(
  rig.collected,
  false,
  'Cancellation must not complete an objective',
);
assert.equal(rig.p.leftHand.px, rig.p.leftHand.x);
assert.equal(rig.p.leftHand.py, rig.p.leftHand.y);
rig.carrying = 'leftHand';
assert.notEqual(
  selectLimb(rig, rig.p.leftHand, 1.6, true, 'leftHand'),
  'leftHand',
);
console.log(
  'PASS camera framing at three viewport sizes on all eight maps, touch hit targets, relative drag, carrying exclusion and safe cancellation',
);
