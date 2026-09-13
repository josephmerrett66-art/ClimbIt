import assert from 'node:assert/strict';
import { storyMessages, debtPayment } from '../lib/game/story';
const state = {
  debt: 12000,
  completedJobs: [] as string[],
  lifetimeEarnings: 0,
};
assert.equal(storyMessages(state).length, 4);
const first = storyMessages({ ...state, completedJobs: ['pub'] });
assert.ok(first.some((m) => m.id === 'first-clear'));
assert.ok(!first.some((m) => m.id === 'first-payment'));
assert.ok(
  !storyMessages({ ...state, completedJobs: ['pub', 'pub', 'pub'] }).some(
    (m) => m.id === 'three-jobs',
  ),
);
const earned = storyMessages({
  ...state,
  completedJobs: ['a', 'b', 'c', 'd', 'e'],
});
assert.ok(earned.some((m) => m.id === 'five-jobs'));
assert.ok(!earned.some((m) => m.id === 'first-payment'));
const paid = storyMessages({ ...state, debt: 6000 });
assert.ok(paid.some((m) => m.id === 'first-payment'));
assert.ok(paid.some((m) => m.id === 'half-paid'));
assert.ok(!paid.some((m) => m.id === 'debt-clear'));
const ending = storyMessages({ ...state, debt: 0 });
assert.ok(ending.some((m) => m.id === 'debt-clear'));
assert.equal(new Set(ending.map((m) => m.id)).size, ending.length);
console.log(
  'PASS opening, unique job milestones, repayment milestones and debt-cleared ending',
);

assert.equal(debtPayment(180, 12000, ''), 180);
assert.equal(debtPayment(180, 12000, '50'), 50);
assert.equal(debtPayment(180, 12000, '9999'), 180);
assert.equal(debtPayment(180, 30, '100'), 30);
assert.equal(debtPayment(180, 12000, '-5'), 0);
assert.equal(debtPayment(180, 12000, 'nope'), 0);
console.log('PASS partial repayment, balance/debt caps and invalid amounts');
