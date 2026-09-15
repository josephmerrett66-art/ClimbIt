import assert from 'node:assert/strict';
import { Climber } from '../lib/game/physics';
import { pubLevel } from '../lib/game/pub-level';
import { MagpieEncounter, magpieFor, sweptContact } from '../lib/game/magpie';
const make = () => new Climber(structuredClone(pubLevel));
const g = make(),
  bird = new MagpieEncounter(g);
const hold = (id: string) => ({ id, x: g.p.leftHand.x, y: g.p.leftHand.y });
g.grips = { leftHand: hold('l'), rightHand: hold('r'), leftFoot: hold('f') };
bird.equip();
assert.equal(g.racketHand, 'rightHand');
assert.ok(g.grips.leftHand && !g.grips.rightHand);
assert.equal(g.begin('rightHand', g.p.rightHand), true);
assert.equal(g.canUse('rightHand', hold('test')), false);
bird.step(1 / 60);
const stationaryTip = bird.racketTip();
bird.phase = 'swoop';
bird.bird = { ...stationaryTip };
bird.velocity = { x: 0, y: 0 };
bird.step(1 / 60);
assert.equal(
  bird.phase,
  'swoop',
  'A stationary racket is not an automatic shield',
);
const before = bird.racketTip();
g.p.rightHand.x += 12 * g.scale;
const after = bird.racketTip();
bird.bird = { x: (before.x + after.x) / 2, y: (before.y + after.y) / 2 };
bird.step(1 / 60);
assert.equal(
  bird.phase,
  'falling',
  'Dragging the hand through the bird hits it',
);
g.end();
assert.ok(!g.grips.rightHand, 'Racket hand cannot attach on release');
assert.equal(g.drag, null);
assert.ok(
  sweptContact(
    { x: -100, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    10,
  ),
  'Fast swipe collision',
);
assert.ok(
  !sweptContact(
    { x: -100, y: 50 },
    { x: 100, y: 50 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    10,
  ),
  'Miss stays a miss',
);
for (let i = 0; i < 300; i++) bird.step(1 / 60);
assert.equal(bird.phase, 'defeated');
bird.equip();
assert.equal(g.racketHand, null);
const h = make(),
  attack = new MagpieEncounter(h);
h.grips = {
  leftHand: hold('a'),
  rightHand: hold('b'),
  leftFoot: hold('c'),
  rightFoot: hold('d'),
};
attack.phase = 'swoop';
attack.bird = { ...h.p.neck };
attack.step(0);
assert.equal(Object.keys(h.grips).length, 3);
attack.step(0);
assert.equal(Object.keys(h.grips).length, 3, 'One hit per pass');
const approach = make(),
  perched = new MagpieEncounter(approach);
approach.grips = { leftHand: hold('nearby') };
const initialPerch = { ...perched.bird };
perched.step(30);
assert.equal(
  perched.phase,
  'waiting',
  'Bird waits at its map perch while distant',
);
assert.deepEqual(
  perched.bird,
  initialPerch,
  'Bird does not spawn beside the player',
);
approach.p.hip.x = perched.perch.x - 250;
approach.p.hip.y = perched.perch.y;
perched.step(1 / 60);
assert.equal(
  perched.phase,
  'warning',
  'Climbing near the perch alerts the bird',
);
assert.deepEqual(
  perched.bird,
  initialPerch,
  'Alert begins from the visible perch',
);
perched.step(1.51);
assert.equal(
  perched.phase,
  'approach',
  'Bird visibly takes off before its dive',
);
const takeoff = { ...perched.bird };
perched.step(0.5);
assert.equal(perched.phase, 'approach');
assert.ok(
  distanceBetween(takeoff, perched.bird) > 1,
  'Approach moves gradually',
);
assert.ok(
  distanceBetween(takeoff, perched.bird) < 60,
  'Approach does not teleport beside the player',
);
perched.step(1.61);
assert.equal(perched.phase, 'swoop', 'Damaging dive starts after the approach');
attack.phase = 'warning';
attack.time = 0;
attack.step(1);
assert.equal(attack.phase, 'warning');
attack.step(0.61);
assert.equal(attack.phase, 'approach');
h.failed = true;
const snapshot = JSON.stringify(attack.bird);
attack.step(1);
assert.equal(JSON.stringify(attack.bird), snapshot);
const other = make();
other.level.id = 'not-pub';
assert.equal(magpieFor(other), null);
console.log(
  'PASS draggable racket, no auto-grab, swept interception, defeat, single hit, warning and job scope',
);

function distanceBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
