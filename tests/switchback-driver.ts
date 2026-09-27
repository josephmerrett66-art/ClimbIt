import { Climber, distance, type Limb } from '../lib/game/physics';
import { JumpController } from '../lib/game/jump';

export const tick = (g: Climber, j: JumpController, n = 1) => {
  for (let i = 0; i < n; i++) {
    g.step();
    j.step(1 / 60);
  }
};
export function copy(g: Climber, j: JumpController) {
  const next = Object.assign(
    new Climber(structuredClone(g.level)),
    structuredClone(g),
  );
  const jump = Object.assign(new JumpController(next), j, { game: next });
  return { g: next, j: jump };
}
export function recover(g: Climber, j: JumpController, padId: string) {
  const pad = g.level.gripPoints.find((h) => h.id === padId)!;
  // All recovery uses the same begin/move/end reach and grip checks as play.
  for (const limb of ['leftHand', 'rightHand'] as Limb[]) {
    if (g.grips[limb]) continue;
    g.begin(limb, pad);
    tick(g, j, 24);
    g.end();
  }
  const feet = g.level.gripPoints
    .filter((h) => h.use === 'foot' && distance(h, pad) < 175)
    .sort((a, b) => distance(a, pad) - distance(b, pad));
  for (const foot of feet) {
    const limbs = (['leftFoot', 'rightFoot'] as Limb[]).sort(
      (a, b) => distance(g.p[a], foot) - distance(g.p[b], foot),
    );
    for (const limb of limbs) {
      g.begin(limb, foot);
      tick(g, j, 30);
      g.end();
      if (g.grips[limb]) break;
    }
    if (g.grips.leftFoot || g.grips.rightFoot) break;
  }
  tick(g, j, 30);
  return (
    !g.failed &&
    g.grips.leftHand?.id === padId &&
    g.grips.rightHand?.id === padId &&
    Boolean(g.grips.leftFoot || g.grips.rightFoot)
  );
}
