import { Climber, distance } from '../lib/game/physics';
import type { Grip, Level } from '../lib/game/level';

// Contact-scaled reach only takes an option away that the player can put back:
// plant a foot and the reach returns. The exception is a hand-only span, where
// there is nowhere to put a foot and the climber is stuck at single-contact
// reach for the whole traverse. That is the one place a reach tier can make a
// route impossible rather than merely harder, so it is the thing worth testing.
//
// The route driver cannot answer this. Its greedy hold choice makes its
// pass/fail chaotic rather than monotonic in difficulty — the drive-in
// completes at 0.84 and falls at 0.94 — so it reports neither feasibility nor
// difficulty for this mechanic. This measures the move directly instead.

// Hang the climber from `from` with one hand and try to catch `to` with the
// other, through the ordinary controls and the live solver.
export function canCross(level: Level, from: Grip, to: Grip) {
  const g = new Climber(structuredClone(level), false);
  const dx = from.x - g.p.leftHand.x,
    dy = from.y - g.p.leftHand.y;
  for (const p of Object.values(g.p)) {
    p.x += dx;
    p.px += dx;
    p.y += dy;
    p.py += dy;
  }
  g.grips = { leftHand: from };
  // Let the body settle into a hang before committing the free hand.
  for (let i = 0; i < 150; i++) g.step();
  if (!g.grips.leftHand) return false;
  g.begin('rightHand', to);
  for (let i = 0; i < 60; i++) {
    g.move(to);
    g.step();
  }
  g.end();
  return g.grips.rightHand?.id === to.id;
}

// Hanging from `from`, can a boot find anything? If it can, the climber is not
// stranded there at all: planting a foot restores the reach the tier took away.
export function canPlantFoot(level: Level, from: Grip) {
  const g = new Climber(structuredClone(level), false);
  const dx = from.x - g.p.leftHand.x,
    dy = from.y - g.p.leftHand.y;
  for (const p of Object.values(g.p)) {
    p.x += dx;
    p.px += dx;
    p.y += dy;
    p.py += dy;
  }
  g.grips = { leftHand: from };
  for (let i = 0; i < 150; i++) g.step();
  if (!g.grips.leftHand) return false;
  const targets = level.gripPoints
    .filter((p) => p.use !== 'hand' && p.id !== from.id)
    .sort((a, b) => distance(a, g.p.hip) - distance(b, g.p.hip))
    .slice(0, 4);
  for (const target of targets) {
    g.begin('rightFoot', target);
    for (let i = 0; i < 40; i++) {
      g.move(target);
      g.step();
    }
    g.end();
    if (g.grips.rightFoot?.id === target.id) return true;
  }
  return false;
}

export type SpanCheck = {
  from: Grip;
  to: Grip;
  gap: number;
  crossable: boolean;
};

// A climber is stranded only if, hanging from a hand-only contact, the free
// hand can reach no other contact at all. Requiring both directions is too
// strict: on a traverse you pass the trailing hand rather than reaching
// cross-body, so one workable neighbour is enough to keep moving.
export function strandedContacts(level: Level, limit = 110) {
  const checks = checkHangSpans(level, limit);
  const byContact = new Map<string, boolean>();
  for (const check of checks) {
    byContact.set(
      check.from.id,
      (byContact.get(check.from.id) ?? false) || check.crossable,
    );
    // Crossing is symmetric: the same two holds, the other hand leading.
    byContact.set(
      check.to.id,
      (byContact.get(check.to.id) ?? false) || check.crossable,
    );
  }
  return [...byContact.entries()]
    .filter(([, ok]) => !ok)
    .map(([id]) => level.gripPoints.find((p) => p.id === id)!)
    .filter((grip) => !canPlantFoot(level, grip))
    .map((grip) => grip.id);
}

export function checkHangSpans(level: Level, limit = 110): SpanCheck[] {
  const usable = level.gripPoints.filter((p) => p.use !== 'foot');
  const handOnly = level.gripPoints.filter((p) => p.use === 'hand');
  const results: SpanCheck[] = [];
  const seen = new Set<string>();
  for (const from of handOnly) {
    for (const side of [-1, 1]) {
      // A player picks the best hold on that side, not the closest one, so
      // give the check the same few options before calling a contact blocked.
      const options = usable
        .filter(
          (p) =>
            p.id !== from.id &&
            Math.sign(p.x - from.x) === side &&
            distance(p, from) > 4 &&
            distance(p, from) <= limit,
        )
        .sort((a, b) => distance(a, from) - distance(b, from))
        .slice(0, 3);
      if (!options.length) continue;
      const key = from.id + '>' + side;
      if (seen.has(key)) continue;
      seen.add(key);
      const hit = options.find((to) => canCross(level, from, to));
      results.push({
        from,
        to: hit ?? options[0],
        gap: distance(from, hit ?? options[0]),
        crossable: Boolean(hit),
      });
    }
  }
  return results;
}
