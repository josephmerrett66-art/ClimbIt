import assert from 'node:assert/strict';
import { buildingEditorLevel } from '../lib/game/building-editor';
import { cameraTarget } from '../lib/game/controls';
import { parseLevel } from '../lib/game/level';

const parsed = parseLevel(JSON.stringify(buildingEditorLevel));
assert.equal(parsed.id, 'building-editor');
assert.equal(parsed.gripPoints.length, 0);
assert.equal(parsed.colliders[0].role, 'ground');

const focus = { x: 600, y: 800 };
const fitted = cameraTarget(390, 430, buildingEditorLevel, focus, 1, true);
const zoomed = cameraTarget(390, 430, buildingEditorLevel, focus, 2, true);
assert.equal(zoomed.scale, fitted.scale * 2);
assert.ok(Math.abs(focus.x * zoomed.scale + zoomed.x - 195) < 0.001);
assert.ok(Math.abs(focus.y * zoomed.scale + zoomed.y - 215) < 0.001);

console.log('PASS blank building level validation and focus-aware editor zoom');
