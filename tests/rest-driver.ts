import { Climber, distance, type Limb } from '../lib/game/physics';

// Read the same visible contact geometry a player can discover, then move
// each boot through the normal controls. No pose/grip/stamina assignment.
export function establishRest(g: Climber) {
  if (!g.level.fatigue || !g.hasHandSupport()) return false;
  const feet: Limb[] = ['leftFoot', 'rightFoot'];
  for (let pass = 0; pass < 2; pass++) {
    for (const limb of feet) {
      const other = limb === 'leftFoot' ? 'rightFoot' : 'leftFoot';
      const target = { x: g.p.hip.x, y: g.p.hip.y + 52 * g.scale };
      const candidates = g.level.gripPoints
        .filter(
          (p) =>
            g.canUse(limb, p) &&
            g.clearReach(limb, p) &&
            p.y > g.p.hip.y + 15 * g.scale &&
            distance(g.root(limb), p) < g.reach(limb) + 8 * g.scale &&
            (!g.grips[other] || distance(g.grips[other]!, p) > 15 * g.scale),
        )
        .sort((a, b) => distance(a, target) - distance(b, target));
      const hold = candidates[0];
      if (!hold || g.grips[limb]?.id === hold.id) continue;
      g.begin(limb, hold);
      for (let i = 0; i < 18; i++) g.step();
      g.end();
      for (let i = 0; i < 24; i++) g.step();
    }
  }
  for (let i = 0; i < 45; i++) g.step();
  let rested = false;
  // Stop when the stance is no longer efficient; waiting cannot refill loaded arms.
  for (
    let i = 0;
    i < 2400 &&
    !g.failed &&
    Math.min(g.stamina.leftHand, g.stamina.rightHand) < 90;
    i++
  ) {
    if (g.loads.leftHand >= 0.14 || g.loads.rightHand >= 0.14) break;
    g.step();
    rested = true;
  }
  return rested;
}
