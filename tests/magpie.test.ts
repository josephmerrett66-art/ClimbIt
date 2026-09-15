import assert from 'node:assert/strict';
import { Climber } from '../lib/game/physics';
import { pubLevel } from '../lib/game/pub-level';
import { MagpieEncounter, magpieFor } from '../lib/game/magpie';
const make = () => new Climber(structuredClone(pubLevel));
const g = make(),
  bird = new MagpieEncounter(g);
const hold = (id: string) => ({ id, x: g.p.leftHand.x, y: g.p.leftHand.y });
g.grips = { leftHand: hold('l'), rightHand: hold('r'), leftFoot: hold('f') };
bird.equip();
assert.equal(g.racketHand, 'rightHand');
assert.ok(g.grips.leftHand && !g.grips.rightHand);
assert.equal(g.begin('rightHand', g.p.rightHand), false);
bird.strike();
const stamina = g.stamina.rightHand;
bird.strike();
assert.equal(g.stamina.rightHand, stamina, 'Cooldown prevents repeated swings');
bird.phase = 'swoop';
bird.bird = { ...bird.racketTip() };
bird.velocity = { x: 0, y: 0 };
bird.step(0);
assert.equal(bird.phase, 'falling', 'Racket intercept wins before body hit');
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
attack.phase = 'warning';
attack.time = 0;
attack.step(1);
assert.equal(attack.phase, 'warning');
attack.step(0.61);
assert.equal(attack.phase, 'swoop');
h.failed = true;
const snapshot = JSON.stringify(attack.bird);
attack.step(1);
assert.equal(JSON.stringify(attack.bird), snapshot);
const other = make();
other.level.id = 'not-pub';
assert.equal(magpieFor(other), null);
console.log(
  'PASS racket support, cooldown, interception, defeat, single hit, warning and job scope',
);
