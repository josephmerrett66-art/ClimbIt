import assert from 'node:assert/strict';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { Climber, distance } from '../lib/game/physics';
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
assert.equal(j.tryCatch(target),false,'an early tap must not teleport the hand');
let caught = false;
for (let f=0;f<90;f++) {
  tick(g,j);
  const d=Math.min(distance(g.p.leftHand,target),distance(g.p.rightHand,target));
  if(d <= target.radius! +20*g.scale && j.tryCatch(target)){caught=true;break;}
}
assert.equal(caught,true);
assert.equal(Object.keys(g.grips).length,1);
assert.equal(j.completedJumps,1);
console.log('PASS: support gates, compressed load, narrow catch and single-hand landing');
