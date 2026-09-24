import assert from 'node:assert/strict';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { Climber, distance } from '../lib/game/physics';
import { JumpController } from '../lib/game/jump';
import { solve, tick } from './switchback-driver';

const pads = jumpLabLevel.gripPoints.filter(h => h.use === 'hand');
assert.equal(pads.length, 7, 'six jumps plus the starting hold');
for (let i = 1; i < pads.length; i++)
  assert.ok(distance(pads[i-1],pads[i]) > 220, 'gaps must require a jump');
assert.equal(jumpLabLevel.gripPoints.length, 15, 'no interpolated hold ladders');
const {g,j,results} = solve();
assert.equal(j.completedJumps, 6);
assert.equal(g.complete, true, 'a continuous run must recover each catch and control the finish');
console.table(results);

// Merely teleporting to the finish without linking the jumps must not clear.
const shortcut = new Climber(structuredClone(jumpLabLevel));
const controller = new JumpController(shortcut);
const finish = shortcut.level.gripPoints.find(h=>h.id==='jump-red')!;
shortcut.grips = {leftHand:finish,rightHand:finish};
tick(shortcut,controller,100);
assert.equal(shortcut.complete,false);
assert.equal(controller.select(finish),'none','matching a held pad must remain a limb interaction');
console.log('PASS: all six jumps, foot recoveries and controlled finish; shortcuts do not clear the run');
