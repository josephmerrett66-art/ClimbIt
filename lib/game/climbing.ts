import type { Climber, Limb } from './physics';
import type { Point } from './level';

// Opal prototype tuning. Rates are stamina points/second; loads are estimated
// fractions of body weight, amplified by awkward reach. No input jitter.
export const CLIMBING = {
  handMax: 100,
  footMax: 100,
  handDrain: 7.5,
  footDrain: 0.85,
  recovery: 7,
  lightRecovery: 5,
  minimumLoad: 0.14,
  loadSensitivity: 1.25,
  fresh: 70,
  tired: 45,
  critical: 25,
  failing: 10,
  failure: 0,
  tremble: 1.5,
  discoveryRadius: 190,
  fadeSeconds: 0.22,
};
export const clamp = (n: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, n));
const limbs: Limb[] = ['leftHand', 'rightHand', 'leftFoot', 'rightFoot'];
export const emptyLoads = () => ({
  leftHand: 0,
  rightHand: 0,
  leftFoot: 0,
  rightFoot: 0,
});

// Verlet's constraint corrections include artificial muscle support, so treating
// them as measured forces is misleading. Estimate support from COM projection,
// leg direction and extension instead. A foot above the pelvis cannot unload arms.
export function estimateLoads(g: Climber) {
  const loads = emptyLoads();
  const hip = g.p.hip,
    s = g.scale;
  const feet = limbs.filter((l) => l.endsWith('Foot') && g.grips[l]);
  const hands = limbs.filter((l) => l.endsWith('Hand') && g.grips[l]);
  const qualities = feet.map((l) => {
    const p = g.grips[l]!;
    const below = clamp((p.y - hip.y) / (45 * s));
    const lateral = clamp(1 - Math.abs(p.x - hip.x) / (100 * s));
    const extension =
      Math.hypot(p.x - g.root(l).x, p.y - g.root(l).y) / g.reach(l);
    return below * lateral * clamp((1.22 - extension) / 0.3);
  });
  const quality = qualities.reduce((a, b) => a + b, 0);
  // Two boots on exactly the same spot are still a single narrow stance.
  const spread =
    feet.length === 2
      ? Math.hypot(
          g.grips[feet[0]]!.x - g.grips[feet[1]]!.x,
          g.grips[feet[0]]!.y - g.grips[feet[1]]!.y,
        ) / s
      : 0;
  const capacity = feet.length === 2 && spread > 12 ? 0.96 : 0.73;
  const footSupport = Math.min(capacity, quality * 0.64);
  feet.forEach((l, i) => {
    loads[l] =
      (quality ? (footSupport * qualities[i]) / quality : 0) +
      (1 - qualities[i]) * 0.2;
  });
  const weights = hands.map((l) => {
    const p = g.grips[l]!;
    return 1 / (1 + Math.abs(p.x - hip.x) / (65 * s));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  hands.forEach((l, i) => {
    const p = g.grips[l]!;
    const extension =
      Math.hypot(p.x - g.root(l).x, p.y - g.root(l).y) / g.reach(l);
    loads[l] =
      (((1 - footSupport) * weights[i]) / total) *
      (1 + Math.max(0, extension - 0.8) * 0.8);
  });
  // Feet holding a body with no hand support still carry load, never free recovery.
  if (!hands.length && feet.length)
    feet.forEach((l) => (loads[l] = Math.max(loads[l], 1 / feet.length)));
  return loads;
}
export function tickFatigue(g: Climber, dt: number) {
  g.loads = estimateLoads(g);
  for (const l of limbs) {
    const load = g.loads[l],
      hand = l.endsWith('Hand');
    const max = hand ? CLIMBING.handMax : CLIMBING.footMax;
    const rate = !g.grips[l]
      ? CLIMBING.recovery
      : load < CLIMBING.minimumLoad
        ? CLIMBING.lightRecovery * (1 - load / CLIMBING.minimumLoad)
        : -(hand ? CLIMBING.handDrain : CLIMBING.footDrain) *
          Math.pow(load, CLIMBING.loadSensitivity);
    g.stamina[l] = clamp(g.stamina[l] + rate * dt, 0, max);
    if (
      g.grips[l] &&
      load >= CLIMBING.minimumLoad &&
      g.stamina[l] <= CLIMBING.failure
    ) {
      delete g.grips[l];
      g.gripStrain[l] = 0;
      g.message = `${l.replace(/([A-Z])/g, ' $1').toLowerCase()} exhausted — grip lost. Get your feet underneath you.`;
    }
  }
}
export function tickDiscovery(g: Climber, dt: number) {
  const radius = CLIMBING.discoveryRadius * g.scale;
  const body = {
    x: (g.p.hip.x + g.p.neck.x) / 2,
    y: (g.p.hip.y + g.p.neck.y) / 2,
  };
  for (const hold of g.level.gripPoints) {
    const d = Math.hypot(hold.x - body.x, hold.y - body.y);
    const limb = g.drag?.limb ?? g.selectedLimb;
    const reachable =
      limb &&
      (limb.endsWith('Hand') || g.hasHandSupport()) &&
      g.canUse(limb, hold) &&
      g.clearReach(limb, hold) &&
      Math.hypot(hold.x - g.root(limb).x, hold.y - g.root(limb).y) <=
        g.reach(limb) + 8 * g.scale;
    const target =
      d < radius ? (reachable ? 0.68 : 0.25 + 0.3 * clamp(1 - d / radius)) : 0;
    const previous = g.holdVisibility[hold.id] ?? 0;
    g.holdVisibility[hold.id] =
      previous +
      (target - previous) * (1 - Math.exp(-dt / CLIMBING.fadeSeconds));
  }
}
export function fatigueTint(hex: string, stamina: number) {
  const amount = clamp((CLIMBING.fresh - stamina) / CLIMBING.fresh) * 0.65;
  const heat = clamp((CLIMBING.tired - stamina) / CLIMBING.tired);
  const target = [231 - 9 * heat, 155 - 86 * heat, 55 - 13 * heat];
  const rgb = [1, 3, 5].map((n, i) =>
    Math.round(
      parseInt(hex.slice(n, n + 2), 16) * (1 - amount) + target[i] * amount,
    ),
  );
  return `rgb(${rgb.join(',')})`;
}
export function tremblingJoint(g: Climber, limb: Limb, point: Point): Point {
  const amplitude =
    clamp((CLIMBING.critical - g.stamina[limb]) / CLIMBING.critical) *
    CLIMBING.tremble *
    g.scale;
  const phase = limbs.indexOf(limb) * 1.7;
  return {
    x: point.x + Math.sin(g.elapsed * 37 + phase) * amplitude,
    y: point.y + Math.sin(g.elapsed * 43 + phase) * amplitude * 0.55,
  };
}

export function fatigueStage(stamina: number) {
  if (stamina >= CLIMBING.fresh) return 'fresh';
  if (stamina >= CLIMBING.tired) return 'warm';
  if (stamina >= CLIMBING.critical) return 'tired';
  if (stamina >= CLIMBING.failing) return 'critical';
  return 'failing';
}
