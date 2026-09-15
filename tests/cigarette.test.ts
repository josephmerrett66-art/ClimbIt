import assert from 'node:assert/strict';
import { Climber } from '../lib/game/physics';
import { pubLevel } from '../lib/game/pub-level';
import { CigaretteMoment, cigaretteFor } from '../lib/game/cigarette';

const g = new Climber(structuredClone(pubLevel));
const support = { id: 'support', x: g.p.leftHand.x, y: g.p.leftHand.y };
g.grips = { leftHand: support, rightHand: { ...support, id: 'released' } };
const moment = new CigaretteMoment(g);
moment.toggle();
assert.equal(g.cigaretteHand, 'rightHand');
assert.ok(
  g.grips.leftHand && !g.grips.rightHand,
  'One supporting hand remains',
);
assert.equal(g.begin('rightHand', g.p.rightHand), true);
assert.equal(
  g.canUse('rightHand', support),
  false,
  'Dart hand cannot grab holds',
);

const s = g.scale;
g.p.rightElbow.x = g.p.head.x - 20 * s;
g.p.rightElbow.y = g.p.head.y;
g.p.rightHand.x = g.p.head.x - 11 * s;
g.p.rightHand.y = g.p.head.y;
const stamina = { ...g.stamina };
moment.step(1 / 60);
assert.equal(moment.smoking, true);
assert.equal(moment.puffs.length, 1, 'Smoke begins only at the mouth');
assert.deepEqual(g.stamina, stamina, 'Smoking gives no stamina effect');
const firstY = moment.puffs[0].y;
moment.step(0.1);
assert.ok(moment.puffs[0].y < firstY, 'Smoke rises smoothly');
g.p.rightHand.y += 60 * s;
moment.step(0.1);
assert.equal(moment.smoking, false, 'Smoke stops away from the mouth');
g.end();
assert.ok(!g.grips.rightHand, 'Dart hand cannot attach on release');

moment.toggle();
assert.equal(g.cigaretteHand, null);
const noSupport = new Climber(structuredClone(pubLevel));
noSupport.releaseAll();
const unavailable = cigaretteFor(noSupport);
unavailable.toggle();
assert.equal(
  noSupport.cigaretteHand,
  null,
  'Lighting requires one secure hand',
);
noSupport.grips.leftHand = support;
noSupport.racketHand = 'rightHand';
unavailable.toggle();
assert.equal(
  noSupport.cigaretteHand,
  null,
  'Racket and dart cannot be equipped together',
);

console.log(
  'PASS draggable dart, mouth smoke, rising trail, no stamina effect, support and prop exclusion',
);
