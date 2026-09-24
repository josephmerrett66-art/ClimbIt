import assert from 'node:assert/strict';
import { jumpLabLevel } from '../lib/game/jump-lab';
import { JumpController } from '../lib/game/jump';
import { Climber } from '../lib/game/physics';
import type { Grip, Level } from '../lib/game/level';

// The Gantry is authored against numbers, not against the eye, so the numbers
// are what this checks. The properties below are the level's design: if an edit
// breaks one of them the route stops being the route, usually silently.

const level = jumpLabLevel;
const SCALE = level.playerScale ?? 1;
const CATCH = 64 * SCALE;
const LEG_MAX = 84 * SCALE;
const hold = (id: string) => level.gripPoints.find((g) => g.id === id)!;
const pads = level.gripPoints.filter((g) => g.jumpTarget);
const feet = level.gripPoints.filter((g) => g.use === 'foot');

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// The take-off arc from `jump.ts`, re-derived rather than imported, so that a
// change to the mechanic shows up here as a failure instead of quietly moving
// every span in the level.
function closestApproach(from: Grip, to: Grip, power = 1) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const speed = 10.5 * SCALE;
  const frames = clamp(Math.abs(dx) / speed, 9, 30);
  const vx = Math.sign(dx || 1) * speed * power;
  const vy =
    clamp(
      (dy - 10 * SCALE - (0.42 * frames * frames) / 2) / frames,
      -14 * SCALE,
      -4 * SCALE,
    ) * power;
  let x = 0;
  let y = 0;
  let best = Infinity;
  let peak = 0;
  let inRange = 0;
  for (let f = 0; f < 140; f++) {
    x += vx;
    y += vy + 0.42 * f;
    const d = Math.hypot(x - dx, y - dy);
    if (d <= CATCH) inRange++;
    best = Math.min(best, d);
    peak = Math.max(peak, -y);
    if (y > 600 * SCALE) break;
  }
  return { best, peak, window: inRange, catchable: best <= CATCH };
}

// A pad can launch only if a boot can reach something from it. The hip hangs
// 35–115px under a matched pair of hands; anywhere in that band counts.
function canPlantFrom(pad: Grip) {
  return feet.some((f) => {
    for (let hipY = pad.y + 35; hipY <= pad.y + 115; hipY += 4)
      for (let hipX = pad.x - 45; hipX <= pad.x + 45; hipX += 5) {
        const shoulder = Math.hypot(hipX - pad.x, hipY - 44 * SCALE - pad.y);
        if (shoulder > 77 * SCALE) continue;
        const sideHip = hipX + (f.x >= hipX ? 11 : -11) * SCALE;
        if (Math.hypot(sideHip - f.x, hipY - 2 * SCALE - f.y) <= LEG_MAX)
          return true;
      }
    return false;
  });
}

// ---------------------------------------------------------------------------
// The grammar: nine pads, and every other hand hold is a single-limb notch.
// This is the property the whole level rests on — an ordinary matchable hold
// beside a foothold is an unintended launch pad, and that is how the first
// draft let a dyno skip the opening two sections.
{
  const hands = level.gripPoints.filter((g) => g.use === 'hand');
  const matchable = hands.filter((g) => !g.singleLimb);
  assert.deepEqual(
    matchable.map((g) => g.id).sort(),
    pads.map((g) => g.id).sort(),
    'every matchable hand hold must be a beacon, and every beacon matchable',
  );
  assert.equal(pads.length, 9, 'the lab is authored around nine pads');
  assert.ok(
    hands.length - matchable.length > pads.length * 2,
    'the connective route should be notches, not a handful of them',
  );
}

// ---------------------------------------------------------------------------
// No duplicate holds, and no two same-kind holds close enough to steal each
// other's click. A notch sitting on a pad silently disables hand matching.
{
  const ids = level.gripPoints.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate grip ids');
  for (let i = 0; i < level.gripPoints.length; i++)
    for (let j = i + 1; j < level.gripPoints.length; j++) {
      const a = level.gripPoints[i];
      const b = level.gripPoints[j];
      if (a.use !== b.use) continue;
      assert.ok(
        Math.hypot(a.x - b.x, a.y - b.y) >= 12,
        `${a.id} and ${b.id} are close enough to be the same hold`,
      );
    }
  for (const g of level.gripPoints)
    assert.ok(
      g.x > 15 && g.x < level.worldWidth - 15 && g.y > 15 && g.y < 1440,
      `${g.id} is outside the playable world`,
    );
}

// ---------------------------------------------------------------------------
// The route: the six jumps the level is built from, and nothing else.
const ROUTE: [string, string][] = [
  ['pad-roof', 'land-roof'],
  ['land-roof', 'land-high'],
  ['pad-fork', 'trap-beacon'],
  ['pad-fork', 'land-right'],
  ['land-right', 'land-summit'],
  ['pad-launch', 'land-ledge'],
];
// Reversals are legal and rarely worth the moves: each one lands somewhere the
// route already passes through, so none of them skips a section or strands a
// climber. `land-summit->land-ledge` is the one genuine shortcut — a hard dyno
// that buys the summit ladder for a move, which is the efficiency bonus doing
// its job rather than a hole in the design.
const ALLOWED = new Set([
  ...ROUTE.map(([a, b]) => `${a}->${b}`),
  'land-roof->pad-roof',
  'land-summit->land-right',
  'land-summit->land-ledge',
  'land-ledge->pad-launch',
]);

{
  for (const [from, to] of ROUTE) {
    const r = closestApproach(hold(from), hold(to));
    assert.ok(
      r.catchable,
      `${from} -> ${to} is not catchable at full charge (misses by ${r.best.toFixed(1)}px)`,
    );
    assert.ok(
      r.window >= 8,
      `${from} -> ${to} gives only ${r.window} frames to tap the catch; ` +
        'under 8 is execution trivia rather than a puzzle',
    );
  }

  // The one that matters most: no jump exists that the design did not intend.
  const launchers = pads.filter(canPlantFrom);
  const strays: string[] = [];
  for (const a of launchers)
    for (const b of pads) {
      if (a.id === b.id) continue;
      if (!closestApproach(a, b).catchable) continue;
      if (!ALLOWED.has(`${a.id}->${b.id}`)) strays.push(`${a.id} -> ${b.id}`);
    }
  assert.deepEqual(strays, [], 'unintended jumps skip sections of the route');
}

// ---------------------------------------------------------------------------
// The two pads that must NOT be able to launch, for two different reasons.
{
  assert.equal(
    canPlantFrom(hold('land-high')),
    false,
    'the blind catch must strand the boots — that is the section',
  );
  assert.equal(
    canPlantFrom(hold('trap-beacon')),
    false,
    'the fork stops being a decision if its dead end can launch again',
  );
  // ...and the rest must.
  for (const id of [
    'pad-roof',
    'land-roof',
    'pad-fork',
    'land-right',
    'land-summit',
    'pad-launch',
    'land-ledge',
  ])
    assert.ok(canPlantFrom(hold(id)), `${id} has no foothold in leg range`);
}

// ---------------------------------------------------------------------------
// The roof crawl. The section only exists if full charge is blocked and a
// middling charge is not, so both halves are asserted.
{
  const from = hold('pad-roof');
  const to = hold('land-roof');
  const roof = level.colliders.find((c) => c.id === 'roof-slab')!;
  const clearance = from.y - roof.y;

  const full = closestApproach(from, to, 1);
  assert.ok(
    full.peak > clearance,
    `full charge peaks ${full.peak.toFixed(1)}px up and the slab is at ` +
      `${clearance}px, so nothing forces the player off the meter — ` +
      'lower the slab',
  );

  const fitting = [0.78, 0.82, 0.86].filter((p) => {
    const r = closestApproach(from, to, p);
    return r.catchable && r.peak < clearance;
  });
  assert.ok(
    fitting.length > 0,
    'no charge both clears the slab and reaches the beacon; the span is impossible',
  );

  assert.ok(
    roof.x > Math.min(from.x, to.x) && roof.x2 < Math.max(from.x, to.x),
    'the slab must sit between the launch and the landing',
  );
  for (const g of level.gripPoints)
    assert.ok(
      !(g.x > roof.x - 14 && g.x < roof.x2 + 14 && Math.abs(g.y - roof.y) < 16),
      `${g.id} is buried in the roof slab`,
    );
}

// ---------------------------------------------------------------------------
// The carry. The return line has to be walkable one-handed, because the tool
// permanently occupies a hand and a single hand can never match a pad.
{
  const line = [
    'land-ledge',
    'return-1',
    'return-2',
    'return-3',
    'return-4',
    'return-5',
    'pad-launch',
  ].map(hold);
  const oneHanded = 78 * SCALE * (level.contactReach?.[1] ?? 1);
  for (let i = 1; i < line.length; i++) {
    const step = Math.hypot(
      line[i].x - line[i - 1].x,
      line[i].y - line[i - 1].y,
    );
    assert.ok(
      step <= oneHanded,
      `${line[i - 1].id} -> ${line[i].id} is ${step.toFixed(1)}px, beyond the ` +
        `${oneHanded.toFixed(1)}px a single contact reaches`,
    );
  }
  for (const g of line.slice(1, -1))
    assert.equal(g.singleLimb, true, `${g.id} must stay a notch`);

  const objective = level.objectives[0];
  assert.equal(objective.type, 'carry', 'the tool has to be carried, not fixed');
  assert.ok(
    Math.hypot(objective.x - hold('land-ledge').x, objective.y - hold('land-ledge').y) <
      110,
    'the tool must be collectable from a stance on the ledge beacon',
  );
  const zone = level.completionTrigger;
  const launch = hold('pad-launch');
  assert.ok(
    launch.x > zone.x &&
      launch.x < zone.x + zone.width &&
      launch.y + 85 > zone.y &&
      launch.y + 85 < zone.y + zone.height,
    'the return zone must sit where a climber hanging off the last pad is',
  );
}

// ---------------------------------------------------------------------------
// Finally, the live engine: the opening stance must actually form, and it must
// not be a launch position.
{
  const g = new Climber(structuredClone(level as Level), false);
  for (let i = 0; i < 120; i++) g.step();
  assert.ok(g.grips.leftHand && g.grips.rightHand, 'both hands should spawn on holds');
  assert.ok(g.grips.leftFoot && g.grips.rightFoot, 'both boots should spawn on holds');
  assert.notEqual(
    g.grips.leftHand!.id,
    g.grips.rightHand!.id,
    'the ground must not be a launch position',
  );
  assert.equal(g.failed, false, 'the climber should not fall off the start');

  // The nearest beacon is selectable from the ground — the refusal has to come
  // from the stance, not from the target being out of reach, or the opening
  // would teach the wrong rule.
  const j = new JumpController(g);
  assert.equal(j.select(hold('pad-roof')), 'selected');
  assert.equal(
    j.startCharge(),
    false,
    'the opening stance is two separate notches and must refuse to load',
  );
}

console.log(
  `PASS The Gantry: ${level.gripPoints.length} holds, ${pads.length} beacons, ` +
    `${ROUTE.length} authored jumps, no unintended ones, roof slab forces the ` +
    'charge meter, and the carry line is one-handed throughout',
);
