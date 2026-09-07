import assert from 'node:assert/strict';
import { Climber, LIMBS, distance } from '../lib/game/physics';
import { catLevel, parseLevel } from '../lib/game/level';
const g = new Climber(structuredClone(catLevel));
for (let i = 0; i < 300; i++) g.step();
assert.ok(
  Object.values(g.p).every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
);
console.log('Settled', g.p.hip, Object.keys(g.grips));
// Input-driven ascent: move each endpoint onto the next reachable grip.
for (let cycle = 0; cycle < 35 && !g.collected; cycle++) {
  for (const limb of LIMBS) {
    if (
      limb.endsWith('Hand') &&
      distance(g.root(limb), g.cat) < g.reach(limb) + 8
    ) {
      g.begin(limb, g.cat);
      for (let i = 0; i < 60; i++) g.step();
      g.end();
      if (g.collected) break;
    }
    const root = g.root(limb),
      curr = g.p[limb];
    const options = catLevel.gripPoints
      .filter((p) => distance(p, root) < g.reach(limb) - 3 && p.y < curr.y - 12)
      .sort((a, b) => a.y - b.y);
    const target = options[0];
    if (!target) continue;
    g.begin(limb, target);
    for (let i = 0; i < 55; i++) g.step();
    g.end();
    for (let i = 0; i < 40; i++) g.step();
  }
}
console.log('Climbed', g.p.hip, g.grips);
assert.ok(
  g.p.hip.y < 450,
  'Climb must gain at least 400 world units with limb input',
);

for (let cycle = 0; cycle < 20 && !g.collected; cycle++) {
  for (const limb of LIMBS) {
    if (
      limb.endsWith('Hand') &&
      distance(g.root(limb), g.cat) < g.reach(limb) + 10
    ) {
      g.begin(limb, g.cat);
      for (let i = 0; i < 60; i++) g.step();
      g.end();
      if (g.collected) break;
    }
    const root = g.root(limb),
      curr = g.p[limb];
    const targets = g.level.gripPoints
      .filter(
        (p) =>
          distance(p, root) < g.reach(limb) + 3 &&
          p.x > curr.x + 12 &&
          p.y < 400,
      )
      .sort((a, b) => b.x - a.x);
    if (!targets[0]) continue;
    g.begin(limb, targets[0]);
    for (let i = 0; i < 60; i++) g.step();
    g.end();
    for (let i = 0; i < 40; i++) g.step();
  }
}
console.log('Traversed', g.p.hip, g.collected, g.grips);
assert.ok(g.collected, 'Reach and collect actual cat with a hand');

// Return along the branch, then descend the trunk using the remaining three limbs.
for (let cycle = 0; cycle < 55 && !g.complete; cycle++) {
  for (const limb of LIMBS.filter((l) => l !== g.carrying)) {
    const root = g.root(limb),
      curr = g.p[limb];
    const left = g.p.hip.x > 675;
    const options = g.level.gripPoints
      .filter(
        (p) =>
          distance(p, root) < g.reach(limb) + 6 &&
          (left
            ? p.x < curr.x - 10 && p.y < 420
            : p.y > curr.y + 10 && p.x > 560 && p.x < 680),
      )
      .sort((a, b) => (left ? a.x - b.x : b.y - a.y));
    if (!options[0]) continue;
    g.begin(limb, options[0]);
    for (let i = 0; i < 65; i++) g.step();
    g.end();
    for (let i = 0; i < 45; i++) g.step();
  }
}
console.log('Returned', g.p.hip, g.complete, g.grips);
assert.ok(g.complete, 'Three-limb descent must reach the actual return zone');
const falling = new Climber(structuredClone(catLevel));
for (const p of Object.values(falling.p)) {
  p.y -= 400;
  p.py -= 400;
}
falling.ropeLength = distance(falling.p.hip, catLevel.ropeAnchors[0]) + 65;
falling.releaseAll();
for (let i = 0; i < 500; i++) falling.step();
assert.ok(
  distance(falling.p.hip, catLevel.ropeAnchors[0]) < falling.ropeLength + 3,
);
g.releaseAll();
for (let i = 0; i < 500; i++) g.step();
assert.ok(
  distance(g.p.hip, catLevel.ropeAnchors[0]) < g.ropeLength + 3,
  'Rope limits a fall',
);
for (const b of g.bones.filter((b) => b.stiffness === 1)) {
  assert.ok(
    distance(g.p[b.a], g.p[b.b]) < b.length + 8,
    'Bones retain finite reach',
  );
}
const roundTrip = parseLevel(JSON.stringify(catLevel));
assert.deepEqual(roundTrip, catLevel);
assert.throws(() => parseLevel('{"version":1}'));
const carrier = new Climber(structuredClone(catLevel));
carrier.cat.x = carrier.p.leftHand.x;
carrier.cat.y = carrier.p.leftHand.y;
carrier.begin('leftHand', carrier.cat);
carrier.end();
assert.equal(carrier.carrying, 'leftHand');
assert.equal(carrier.begin('leftHand', { x: 0, y: 0 }), false);
assert.equal(carrier.complete, false);
carrier.step();
assert.equal(carrier.complete, true);
console.log(
  'PASS physics reach, ascent, rope, carry, return trigger, JSON round trip and rejection',
);
