import assert from 'node:assert/strict';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { Climber } from '../lib/game/physics';
import { JumpController } from '../lib/game/jump';
import { tick } from './switchback-driver';

const g = new Climber(structuredClone(jumpLabLevel));
const j = new JumpController(g);
tick(g,j,60);
const target = g.level.gripPoints.find(h=>h.id==='jump-cyan')!;
assert.equal(j.select(target),'selected');
const contacts = {...g.grips};
delete g.grips.rightHand;
assert.equal(j.startCharge(),false);
g.grips = {leftHand:contacts.leftHand,rightHand:contacts.rightHand};
assert.equal(j.startCharge(),false);
g.grips = contacts;
assert.equal(j.startCharge(),true);
const hip = g.p.hip.y;
tick(g,j,68);
assert.ok(g.p.hip.y > hip + 18*g.scale,'visible compression');
assert.equal(j.release(),true);
tick(g,j,17);
assert.equal(j.state,'airborne');
assert.equal(Object.keys(g.grips).length,0);
assert.equal(j.select(target),'none','the moving hold is not the catch control');
assert.equal(j.pressGrab(),false,'an early button press must not teleport the hand');
assert.equal(j.grabQueued,true,'a slightly early grab is buffered');
for (let f=0;f<90;f++) {
  tick(g,j);
  if (j.state === 'caught') break;
}
assert.equal(j.state,'caught','the buffered press catches when the hand enters the window');
assert.equal(Object.keys(g.grips).length,1);
assert.equal(j.completedJumps,1);
console.log('PASS: support gates, compressed load, readable Grab input and single-hand landing');
