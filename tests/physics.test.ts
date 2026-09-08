import assert from 'node:assert/strict';
import { Climber, LIMBS, distance } from '../lib/game/physics';
import {
  catLevel,
  churchLevel,
  parseLevel,
  towerLevel,
} from '../lib/game/level';
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
          p.x <= g.cat.x + 10 &&
          p.y < 400,
      )
      .sort((a, b) => distance(a, g.cat) - distance(b, g.cat));
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
            ? (!g.grips[limb] || p.x < curr.x - 10) && p.y < 420
            : (!g.grips[limb] || p.y > curr.y + 10) && p.x > 560 && p.x < 680),
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
falling.releaseAll();
for (let i = 0; i < 500 && !falling.failed; i++) falling.step();
assert.equal(falling.failed, true, 'An unanchored fall must fail the job');
assert.ok(
  falling.p.hip.y > 700,
  'Gravity must carry the climber down without a rope constraint',
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
  'PASS physics reach, ascent, gravity fall failure, carry, return trigger, JSON round trip and rejection',
);

// Deliberately invert the knees, then check the one-way hinge under rotation.
for (const rotation of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const rig = new Climber(structuredClone(catLevel));
  for (const side of ['left', 'right']) {
    const hip = rig.p[side + 'Hip'],
      foot = rig.p[side + 'Foot'],
      knee = rig.p[side + 'Knee'];
    const dx = foot.x - hip.x,
      dy = foot.y - hip.y,
      d = Math.hypot(dx, dy),
      nx = -dy / d,
      ny = dx / d;
    const b = (knee.x - hip.x) * nx + (knee.y - hip.y) * ny;
    knee.x -= 2 * b * nx;
    knee.y -= 2 * b * ny;
  }
  const origin = { ...rig.p.hip };
  for (const p of Object.values(rig.p)) {
    const x = p.x - origin.x,
      y = p.y - origin.y;
    p.x = origin.x + x * Math.cos(rotation) - y * Math.sin(rotation);
    p.y = origin.y + x * Math.sin(rotation) + y * Math.cos(rotation);
    p.px = p.x;
    p.py = p.y;
  }
  const lengths = ['left', 'right'].map((s) => [
    distance(rig.p[s + 'Hip'], rig.p[s + 'Knee']),
    distance(rig.p[s + 'Knee'], rig.p[s + 'Foot']),
  ]);
  rig.constrainKnees();
  for (const [i, side] of ['left', 'right'].entries()) {
    const hip = rig.p[side + 'Hip'],
      foot = rig.p[side + 'Foot'],
      knee = rig.p[side + 'Knee'];
    const cross =
      (foot.x - hip.x) * (knee.y - hip.y) - (foot.y - hip.y) * (knee.x - hip.x);
    assert.ok(
      cross * (side === 'left' ? 1 : -1) > 0,
      'Knees keep their anatomical bend side when rotated',
    );
    assert.ok(
      Math.abs(distance(hip, knee) - lengths[i][0]) < 0.001,
      'Hinge preserves thigh length',
    );
    assert.ok(
      Math.abs(distance(knee, foot) - lengths[i][1]) < 0.001,
      'Hinge preserves shin length',
    );
  }
}
const sandbox = new Climber(structuredClone(catLevel), false);
sandbox.cat.x = sandbox.p.leftHand.x;
sandbox.cat.y = sandbox.p.leftHand.y;
sandbox.begin('leftHand', sandbox.cat);
sandbox.end();
sandbox.step();
assert.equal(
  sandbox.complete,
  false,
  'Focused climb continues without a results screen',
);
console.log(
  'PASS one-way knee hinges, rotation, segment lengths, and continuous climbing mode',
);

// Elbows use the same one-way hinge rule and retain both arm segment lengths.
for (const rotation of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const rig = new Climber(structuredClone(catLevel));
  for (const side of ['left', 'right']) {
    const shoulder = rig.p[side + 'Shoulder'],
      hand = rig.p[side + 'Hand'],
      elbow = rig.p[side + 'Elbow'];
    const dx = hand.x - shoulder.x,
      dy = hand.y - shoulder.y,
      d = Math.hypot(dx, dy),
      nx = -dy / d,
      ny = dx / d;
    const bend = (elbow.x - shoulder.x) * nx + (elbow.y - shoulder.y) * ny;
    elbow.x -= 2 * bend * nx;
    elbow.y -= 2 * bend * ny;
  }
  const origin = { ...rig.p.hip };
  for (const p of Object.values(rig.p)) {
    const x = p.x - origin.x,
      y = p.y - origin.y;
    p.x = origin.x + x * Math.cos(rotation) - y * Math.sin(rotation);
    p.y = origin.y + x * Math.sin(rotation) + y * Math.cos(rotation);
    p.px = p.x;
    p.py = p.y;
  }
  const lengths = ['left', 'right'].map((side) => [
    distance(rig.p[side + 'Shoulder'], rig.p[side + 'Elbow']),
    distance(rig.p[side + 'Elbow'], rig.p[side + 'Hand']),
  ]);
  rig.constrainElbows();
  for (const [i, side] of ['left', 'right'].entries()) {
    const shoulder = rig.p[side + 'Shoulder'],
      hand = rig.p[side + 'Hand'],
      elbow = rig.p[side + 'Elbow'];
    const cross =
      (hand.x - shoulder.x) * (elbow.y - shoulder.y) -
      (hand.y - shoulder.y) * (elbow.x - shoulder.x);
    assert.ok(
      cross * (side === 'left' ? -1 : 1) > 0,
      'Elbows keep their anatomical bend side when rotated',
    );
    assert.ok(
      Math.abs(distance(shoulder, elbow) - lengths[i][0]) < 0.001,
      'Hinge preserves upper-arm length',
    );
    assert.ok(
      Math.abs(distance(elbow, hand) - lengths[i][1]) < 0.001,
      'Hinge preserves forearm length',
    );
  }
}
console.log('PASS one-way elbow hinges, rotation, and arm segment lengths');

const body = new Climber(structuredClone(catLevel));
assert.equal(body.root('leftFoot'), body.p.leftHip);
assert.equal(body.root('rightFoot'), body.p.rightHip);
for (const particle of [
  'leftShoulder',
  'rightShoulder',
  'leftHip',
  'rightHip',
]) {
  assert.ok(
    body.bones.some(
      (bone) =>
        (bone.a === particle && ['neck', 'hip'].includes(bone.b)) ||
        (bone.b === particle && ['neck', 'hip'].includes(bone.a)),
    ),
    `${particle} must be physically connected to the torso`,
  );
}
console.log('PASS shoulders and hips connect limbs to the physical torso');

const assisted = new Climber(structuredClone(catLevel));
const assistedLimb = LIMBS.find((limb) => assisted.grips[limb]);
assert.ok(assistedLimb, 'Test rig starts on at least one hold');
const assistedGrip = assisted.grips[assistedLimb];
assert.ok(assistedGrip);
const assistedCursor = { x: assistedGrip.x + 28, y: assistedGrip.y };
const expectedGrip = assisted.nearest(assistedCursor, 38);
assert.ok(expectedGrip, 'Cursor is inside the attraction radius of a hold');
assisted.begin(assistedLimb, assisted.p[assistedLimb]);
assisted.move(assistedCursor);
for (let i = 0; i < 45; i++) assisted.step();
assisted.end();
assert.equal(
  assisted.grips[assistedLimb]?.id,
  expectedGrip.id,
  'A nearby reachable hold attracts and catches the dragged limb',
);
console.log('PASS nearby-hold attraction and catch');

const church = new Climber(structuredClone(churchLevel));
for (let i = 0; i < 240; i++) church.step();
for (let cycle = 0; cycle < 48 && !church.complete; cycle++) {
  for (const limb of LIMBS) {
    if (
      limb.endsWith('Hand') &&
      distance(church.root(limb), church.cat) < church.reach(limb) + 8
    ) {
      church.begin(limb, church.cat);
      for (let i = 0; i < 55; i++) church.step();
      church.end();
      if (church.complete) break;
    }
    const root = church.root(limb),
      endpoint = church.p[limb],
      next = church.level.gripPoints
        .filter(
          (grip) =>
            distance(grip, root) < church.reach(limb) - 3 &&
            grip.y < endpoint.y - 10,
        )
        .sort((a, b) => a.y - b.y)[0];
    if (!next) continue;
    church.begin(limb, next);
    for (let i = 0; i < 55; i++) church.step();
    church.end();
    for (let i = 0; i < 30; i++) church.step();
  }
}
assert.ok(church.complete, 'Church route reaches and straightens the cross');
assert.equal(church.carrying, null, 'Repair objective leaves both hands free');
console.log('PASS church climb and cross-straightening objective');

const tower = new Climber(structuredClone(towerLevel));
for (let i = 0; i < 240; i++) tower.step();
for (let cycle = 0; cycle < 52 && !tower.complete; cycle++) {
  for (const limb of LIMBS) {
    if (
      limb.endsWith('Hand') &&
      distance(tower.root(limb), tower.cat) < tower.reach(limb) + 8
    ) {
      tower.begin(limb, tower.cat);
      for (let i = 0; i < 55; i++) tower.step();
      tower.end();
      if (tower.complete) break;
    }
    const root = tower.root(limb),
      endpoint = tower.p[limb],
      next = tower.level.gripPoints
        .filter(
          (grip) =>
            distance(grip, root) < tower.reach(limb) - 3 &&
            grip.y < endpoint.y - 10,
        )
        .sort((a, b) => a.y - b.y)[0];
    if (!next) continue;
    tower.begin(limb, next);
    for (let i = 0; i < 55; i++) tower.step();
    tower.end();
    for (let i = 0; i < 30; i++) tower.step();
  }
}
console.log('Tower ascent', tower.p.hip, tower.grips, tower.complete);
assert.ok(tower.complete, 'Tower route reaches and replaces the summit bulb');
assert.equal(tower.carrying, null, 'Bulb replacement leaves both hands free');
console.log('PASS tower climb and summit light replacement');

const treeScaleRig = new Climber(structuredClone(catLevel));
const churchScaleRig = new Climber(structuredClone(churchLevel));
const towerScaleRig = new Climber(structuredClone(towerLevel));
assert.equal(treeScaleRig.scale, 1);
assert.equal(churchScaleRig.scale, 0.82);
assert.equal(towerScaleRig.scale, 0.62);
assert.ok(
  towerScaleRig.bones[0].length < churchScaleRig.bones[0].length &&
    churchScaleRig.bones[0].length < treeScaleRig.bones[0].length,
  'Skeleton, reach and collision body scale with each background',
);
assert.equal(towerScaleRig.reach('leftHand'), 78 * 0.62);
console.log('PASS per-level player scale changes the complete physics body');

const widestNearestHoldGap = (level: typeof churchLevel) =>
  Math.max(
    ...level.gripPoints.map((grip, index) =>
      Math.min(
        ...level.gripPoints
          .filter((_, otherIndex) => otherIndex !== index)
          .map((other) => distance(grip, other)),
      ),
    ),
  );
assert.ok(
  widestNearestHoldGap(churchLevel) <= 24,
  'Church hold density follows its smaller player scale',
);
assert.ok(
  widestNearestHoldGap(towerLevel) <= 18,
  'Tower hold density follows its smaller player scale',
);
console.log('PASS per-level hold density scales with the climber');
