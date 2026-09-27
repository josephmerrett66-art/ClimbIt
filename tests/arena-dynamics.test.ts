import assert from 'node:assert/strict';
import { Climber } from '../lib/game/physics';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { BoulderPractice } from '../lib/game/practice';

const game = new Climber(jumpLabLevel);
const moving = game.level.gripPoints.find((h) => h.motion)!;
const originalX = moving.x;
for (let i = 0; i < 60; i++) game.step();
assert.notEqual(moving.x, originalX, 'Unoccupied landing moves');
assert.ok(Math.abs(moving.x - originalX) <= moving.motion!.amplitude);
assert.equal(
  jumpLabLevel.gripPoints.find((h) => h.id === moving.id)!.x,
  originalX,
  'Motion never changes the level template',
);

const practice = new BoulderPractice();
const cracked = game.level.gripPoints.find((h) => h.crumbleAfter)!;
game.holdWear[cracked.id] = 2;
practice.capture(game);
const savedStamina = { ...game.stamina };
game.holdWear[cracked.id] = 4;
game.stamina.leftHand = 1;
const restored = practice.restore()!;
assert.equal(restored.holdWear[cracked.id], 2, 'Practice restores saved wear');
assert.deepEqual(restored.stamina, savedStamina);

// Put a cracked surface at the supported starting hold to isolate its timer
// from reach/overextension. Wear is per surface, even with both hands on it.
const fixture = structuredClone(jumpLabLevel);
const entry = fixture.gripPoints.find((h) => h.id === 'start-hands')!;
entry.crumbleAfter = 0.5;
const fragile = new Climber(fixture);
for (let i = 0; i < 20; i++) fragile.step();
assert.ok(!fragile.brokenHolds[entry.id]);
for (let i = 0; i < 15; i++) fragile.step();
assert.ok(
  fragile.brokenHolds[entry.id],
  'Sustained loading breaks the surface',
);
assert.ok(!Object.values(fragile.grips).some((h) => h.id === entry.id));
assert.equal(
  fragile.canUse('leftHand', entry),
  false,
  'Broken holds cannot be caught again',
);
assert.deepEqual(
  new Climber(fixture).brokenHolds,
  {},
  'Restart restores the arena',
);

const railFixture = structuredClone(jumpLabLevel);
const railEntry = railFixture.gripPoints.find((h) => h.id === 'start-hands')!;
railEntry.motion = { amplitude: 18, period: 6 };
const rail = new Climber(railFixture);
for (let i = 0; i < 30; i++) rail.step();
assert.equal(
  rail.grips.leftHand!.x,
  railEntry.x,
  'Occupied rail locks for recovery',
);
const restFixture = structuredClone(jumpLabLevel);
const restEntry = restFixture.gripPoints.find((h) => h.id === 'landing-3')!;
restFixture.playerSpawn = { x: restEntry.x, y: restEntry.y + 95 };
const rest = new Climber(restFixture);
for (let i = 0; i < 60; i++) rest.step();
rest.stamina.leftHand = rest.stamina.rightHand = 40;
for (let i = 0; i < 180; i++) rest.step();
assert.ok(
  rest.stamina.leftHand > 40 && rest.stamina.rightHand > 40,
  'The two-foot rest pocket physically unloads and recovers both arms',
);
console.log(
  'PASS moving landing, locked catch, persistent wear, breakage, restart and practice',
);
