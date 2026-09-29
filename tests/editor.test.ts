import assert from 'node:assert/strict';
import { buildingEditorLevel } from '../lib/game/building-editor';
import { cameraTarget } from '../lib/game/controls';
import { parseLevel } from '../lib/game/level';
import { Climber, LIMBS } from '../lib/game/physics';
import { JumpController } from '../lib/game/jump';

const parsed = parseLevel(JSON.stringify(buildingEditorLevel));
assert.equal(parsed.id, 'building-editor');
assert.equal(parsed.gripPoints.length, 3);
assert.equal(parsed.testMode, 'jump');
assert.equal(parsed.backgroundImage, '');
assert.equal(parsed.colliders[0].role, 'ground');
const player = new Climber(structuredClone(parsed), false);
for (const limb of LIMBS)
  assert.ok(player.grips[limb], `${limb} starts attached`);
const jump = new JumpController(player);
for (let i = 0; i < 120; i++) {
  player.step();
  jump.step(1 / 60);
}
assert.equal(player.complete, false);
for (const limb of LIMBS)
  assert.ok(player.grips[limb], `${limb} stays attached`);
assert.equal(player.failed, false);

const focus = { x: 600, y: 800 };
const fitted = cameraTarget(390, 430, buildingEditorLevel, focus, 1, true);
const zoomed = cameraTarget(390, 430, buildingEditorLevel, focus, 2, true);
assert.equal(zoomed.scale, fitted.scale * 2);
assert.ok(Math.abs(focus.x * zoomed.scale + zoomed.x - 195) < 0.001);
assert.ok(Math.abs(focus.y * zoomed.scale + zoomed.y - 215) < 0.001);
const outside = { x: -500, y: -1000 };
const panned = cameraTarget(390, 430, parsed, outside, 1, true);
assert.equal(outside.x * panned.scale + panned.x, 195);
assert.equal(outside.y * panned.scale + panned.y, 215);

console.log('PASS blank building level validation and focus-aware editor zoom');
