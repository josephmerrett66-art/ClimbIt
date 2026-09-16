import { establishRest } from './rest-driver';
import assert from 'node:assert/strict';
import { Climber, LIMBS, distance } from '../lib/game/physics';
import type { Level } from '../lib/game/level';
import type { RouteCorner } from '../lib/game/campaign';

export function climbRoute(level: Level, route: RouteCorner[]) {
  // This driver validates route geometry: that the polyline, contacts,
  // colliders, objective and return zone form a route that can actually be
  // climbed and completed through ordinary begin/move/step/end gestures, with
  // fatigue live. It is deliberately run at unscaled reach.
  //
  // It cannot validate a contact-reach tier. The driver commits greedily to the
  // nearest useful hold and never reconsiders, so under contact-scaled reach its
  // pass/fail is chaotic rather than monotonic in difficulty — the drive-in
  // completes at 0.84 and falls at 0.94, the railway completes at 0.86 and falls
  // at 0.94. A pass would not mean the tier is right and a failure would not mean
  // it is too hard, so reading either would be self-deception.
  //
  // `tests/hang-spans.test.ts` is the gate for the tiers. It measures the one
  // thing a tier can actually break — a hand-only span where no foot can be
  // planted to win the reach back — and does respond monotonically.
  const driven = structuredClone(level);
  delete driven.contactReach;
  delete driven.contactForce;
  const g = new Climber(driven);
  const minima = { ...g.stamina };
  const step = g.step.bind(g);
  g.step = (dt = 1 / 60) => {
    step(dt);
    for (const limb of LIMBS)
      minima[limb] = Math.min(minima[limb], g.stamina[limb]);
  };
  for (let i = 0; i < 180; i++) g.step();
  assert.ok(g.hasHandSupport(), `${level.id}: secure spawn`);
  for (const [stage, corner] of route.slice(1).entries()) {
    const goal = { x: corner[0], y: corner[1] };
    const hanging = corner[2] === 'hang';
    if (level.fatigue) establishRest(g);
    if (
      hanging ||
      (level.fatigue &&
        ['leftFoot', 'rightFoot'].some(
          (l) =>
            g.grips[l as (typeof LIMBS)[number]] &&
            g.p[l].y < g.p.hip.y + 12 * g.scale,
        ))
    ) {
      for (const limb of ['leftFoot', 'rightFoot'] as const) {
        if (!g.grips[limb]) continue;
        for (const [dx, dy] of [
          [1, 1],
          [-1, 1],
          [1, 0],
          [-1, 0],
          [0, 1],
        ]) {
          if (!g.grips[limb]) break;
          const root = g.root(limb);
          g.begin(limb, { x: root.x + dx * 180, y: root.y + dy * 180 });
          for (let i = 0; i < (level.fatigue ? 18 : 60); i++) g.step();
          g.end();
        }
      }
    }
    for (let cycle = 0; cycle < 90 && !g.failed; cycle++) {
      for (let i = 0; i < (level.fatigue ? 18 : 60); i++) g.step();
      if (
        level.fatigue &&
        !hanging &&
        cycle % 5 === 0 &&
        Math.min(g.stamina.leftHand, g.stamina.rightHand) < 65
      )
        establishRest(g);
      const order = level.gripPoints.some((p) => p.singleLimb)
        ? [...LIMBS].sort(
            (a, b) =>
              Number(b.endsWith('Hand')) - Number(a.endsWith('Hand')) ||
              (a.endsWith('Hand')
                ? distance(g.p[b], goal) - distance(g.p[a], goal)
                : 0),
          )
        : LIMBS;
      for (const limb of order) {
        if (hanging && limb.endsWith('Foot')) continue;
        const target = {
          x: goal.x,
          y: goal.y + (limb.endsWith('Foot') ? 115 * g.scale : 0),
        };
        const candidates = level.gripPoints
          .filter(
            (p) =>
              (!hanging ||
                p.y <= Math.max(goal.y, route[stage][1]) + 6 * g.scale) &&
              g.canUse(limb, p) &&
              g.clearReach(limb, p) &&
              distance(p, g.root(limb)) <
                g.reach(limb) +
                  (level.fatigue && limb.endsWith('Hand') ? 24 : 8) * g.scale &&
              distance(p, target) < distance(g.p[limb], target) - 6 * g.scale,
          )
          .sort((a, b) => distance(a, target) - distance(b, target));
        if (!candidates[0]) continue;
        const previous = g.grips[limb];
        g.begin(limb, candidates[0]);
        for (let i = 0; i < (level.fatigue ? 18 : 60); i++) g.step();
        if (level.fatigue && !g.grabPreview()) {
          // A player can feel an overreach and try a nearer edge before letting go.
          for (const candidate of candidates.slice(1, 3)) {
            g.move(candidate);
            for (let i = 0; i < 18; i++) g.step();
            if (g.grabPreview()) break;
          }
          if (!g.grabPreview() && previous) {
            g.move(previous);
            for (let i = 0; i < 24; i++) g.step();
          }
        }
        g.end();
        for (let i = 0; i < (level.fatigue ? 12 : 35); i++) g.step();
      }
      if (process.env.TRACE && cycle % 5 === 0)
        console.log(
          'TRACE',
          stage,
          cycle,
          g.p.hip.x,
          g.p.hip.y,
          g.grips,
          g.stamina,
          g.message,
        );
      if (
        ['leftHand', 'rightHand'].every(
          (l) => distance(g.p[l], goal) < 28 * g.scale,
        )
      )
        break;
    }
    console.log(
      level.id,
      stage,
      Math.round(g.p.hip.x),
      Math.round(g.p.hip.y),
      Object.fromEntries(
        Object.entries(g.grips).map(([k, v]) => [
          k,
          [Math.round(v.x), Math.round(v.y)],
        ]),
      ),
    );
    assert.ok(!g.failed, `${level.id}: fell at corner ${stage}`);
    assert.ok(
      ['leftHand', 'rightHand'].some(
        (l) => distance(g.p[l], goal) < 55 * g.scale,
      ),
      `${level.id}: stalled at corner ${stage} (${goal.x},${goal.y})`,
    );
  }
  for (let attempt = 0; attempt < 6 && !g.complete; attempt++) {
    for (const limb of ['leftHand', 'rightHand'] as const) {
      if (g.complete) break;
      g.begin(limb, g.cat);
      for (let i = 0; i < 360; i++) g.step();
      g.end();
    }
  }
  assert.ok(g.complete, `${level.id}: supported job interaction`);
  assert.equal(g.message, level.objectives[0].successMessage);
  if (level.fatigue)
    console.log('Fatigue route', {
      seconds: g.elapsed,
      minimumStamina: minima,
      holds: level.gripPoints.length,
    });
  return g;
}
