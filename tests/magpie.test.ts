import assert from 'node:assert/strict';
import { Climber } from '../lib/game/physics';
import { pubLevel } from '../lib/game/pub-level';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';
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
bird.phase = 'dive';
bird.bird = { ...stationaryTip };
bird.velocity = { x: 0, y: 0 };
bird.step(1 / 60);
assert.equal(
  bird.phase,
  'dive',
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
attack.phase = 'dive';
attack.bird = { ...h.p.neck };
attack.step(0);
assert.equal(Object.keys(h.grips).length, 3);
attack.step(0);
assert.equal(Object.keys(h.grips).length, 3, 'One hit per pass');
// The bird circles its territory instead of sitting on a roof waiting, and it
// never announces itself. Reading the flight is the only warning there is.
const circling = make(),
  patrol = new MagpieEncounter(circling);
circling.grips = { leftHand: hold('nearby') };
circling.p.hip.x = patrol.perch.x - 900;
circling.p.hip.y = patrol.perch.y;
const start = { ...patrol.bird };
patrol.step(1 / 60);
assert.equal(patrol.phase, 'patrol', 'Out of range the bird is still flying');
for (let i = 0; i < 120; i++) patrol.step(1 / 60);
assert.ok(
  distanceBetween(start, patrol.bird) > 1,
  'Patrol keeps the bird moving',
);
assert.ok(
  distanceBetween(patrol.perch, patrol.bird) < 260 * circling.scale,
  'Patrol stays over its own territory',
);

// Coming into range closes it into a tighter orbit around the climber.
circling.p.hip.x = patrol.perch.x - 250;
circling.p.hip.y = patrol.perch.y;
patrol.step(1 / 60);
assert.equal(
  patrol.phase,
  'stalk',
  'It closes in rather than posting a notice',
);
assert.equal(patrol.armed, false, 'An encounter opens with the harmless pass');

const advance = (until: string, seconds: number) => {
  for (let i = 0; i < seconds * 60 && patrol.phase !== until; i++)
    patrol.step(1 / 60);
};
advance('feint', 4);
assert.equal(
  patrol.phase,
  'feint',
  'The first pass is the one that cannot hurt',
);
assert.equal(patrol.armed, true, 'The next pass is now the committed one');
advance('dive', 6);
assert.equal(
  patrol.phase,
  'dive',
  'The pass after the warning is the real one',
);
assert.equal(patrol.passes, 2, 'Exactly one warning pass precedes the dive');

// The warning pass flies through the climber without touching them.
const harmless = make(),
  feint = new MagpieEncounter(harmless);
harmless.grips = {
  leftHand: hold('a'),
  rightHand: hold('b'),
  leftFoot: hold('c'),
  rightFoot: hold('d'),
};
feint.phase = 'feint';
feint.bird = { ...harmless.p.neck };
feint.step(0);
assert.equal(
  Object.keys(harmless.grips).length,
  4,
  'The warning pass cannot knock a grip loose',
);

h.failed = true;
const snapshot = JSON.stringify(attack.bird);
attack.step(1);
assert.equal(JSON.stringify(attack.bird), snapshot);

// The railway bird perches on the station roof ridge, above the exposed awning
// traverse. It must be out of range at the spawn and at the tower finish, so it
// commits while the climber is hand-only across the middle of the route.
const railwayLevel = AUSTRALIAN_JOBS.find((j) => j.id === 'signal-esky')!.level;
const railway = new Climber(structuredClone(railwayLevel));
const railwayBird = magpieFor(railway)!;
assert.ok(railwayBird, 'The railway has a magpie');
assert.equal(Math.round(railwayBird.perch.x), 888);
railway.grips = {
  leftHand: { id: 'x', x: railway.p.leftHand.x, y: railway.p.leftHand.y },
};
railwayBird.step(1 / 60);
assert.equal(railwayBird.phase, 'patrol', 'Circling quietly at the spawn');
const scene = (x: number, y: number) => ({
  x: (x * 1600) / 1586,
  y: (y * 1000) / 992,
});
const finish = scene(1493, 208);
railway.p.hip.x = finish.x;
railway.p.hip.y = finish.y;
railwayBird.step(1 / 60);
assert.equal(
  railwayBird.phase,
  'patrol',
  'Circling quietly at the tower finish',
);
const traverse = scene(814, 470);
railway.p.hip.x = traverse.x;
railway.p.hip.y = traverse.y;
railwayBird.step(1 / 60);
assert.equal(
  railwayBird.phase,
  'stalk',
  'Closes in over the exposed awning traverse',
);

const other = make();
other.level.id = 'not-pub';
assert.equal(magpieFor(other), null);
console.log(
  'PASS draggable racket, no auto-grab, swept interception, defeat, single hit, patrol/stalk/feint/dive pattern and job scope',
);

function distanceBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
