import { Climber, distance, type Limb } from '../lib/game/physics';
import { JumpController } from '../lib/game/jump';
import { jumpLabLevel } from '../lib/game/jump-lab';

export const tick = (g: Climber, j: JumpController, n = 1) => {
  for (let i = 0; i < n; i++) { g.step(); j.step(1 / 60); }
};
export function copy(g: Climber, j: JumpController) {
  const next = Object.assign(new Climber(structuredClone(g.level)), structuredClone(g));
  const jump = Object.assign(new JumpController(next), j, { game: next });
  return { g: next, j: jump };
}
export function recover(g: Climber, j: JumpController, padId: string) {
  const pad = g.level.gripPoints.find(h => h.id === padId)!;
  // All recovery uses the same begin/move/end reach and grip checks as play.
  for (const limb of ['leftHand', 'rightHand'] as Limb[]) {
    if (g.grips[limb]) continue;
    g.begin(limb, pad);
    tick(g, j, 24);
    g.end();
  }
  const feet = g.level.gripPoints.filter(h => h.use === 'foot' && distance(h, pad) < 175)
    .sort((a,b) => distance(a,pad)-distance(b,pad));
  for (const foot of feet) {
    const limbs = (['leftFoot','rightFoot'] as Limb[]).sort((a,b) => distance(g.p[a],foot)-distance(g.p[b],foot));
    for (const limb of limbs) {
      g.begin(limb, foot);
      tick(g,j,30);
      g.end();
      if (g.grips[limb]) break;
    }
    if (g.grips.leftFoot || g.grips.rightFoot) break;
  }
  tick(g,j,30);
  return !g.failed && g.grips.leftHand?.id === padId && g.grips.rightHand?.id === padId &&
    Boolean(g.grips.leftFoot || g.grips.rightFoot);
}
export function solve() {
  let g = new Climber(structuredClone(jumpLabLevel));
  let j = new JumpController(g);
  tick(g,j,60);
  const results: { name: string; charge: number; frame: number; window: number }[] = [];
  for (const stage of jumpLabLevel.jumpCourse!) {
    let solution: ReturnType<typeof copy> | undefined;
    let closest = Infinity;
    for (let charge = 24; charge <= 70 && !solution; charge += 4) {
      const launch = copy(g,j);
      const target = launch.g.level.gripPoints.find(h=>h.id===stage.hold)!;
      launch.j.select(target);
      if (!launch.j.startCharge()) continue;
      tick(launch.g,launch.j,charge);
      launch.j.release();
      tick(launch.g,launch.j,17);
      let window = 0;
      for (let f=0; f<100 && !launch.g.failed; f++) {
        tick(launch.g,launch.j);
        const d = Math.min(distance(launch.g.p.leftHand,target), distance(launch.g.p.rightHand,target));
        closest = Math.min(closest,d);
        if (launch.j.catchCue !== 'ready') continue;
        window++;
        const candidate = copy(launch.g,launch.j);
        if (!candidate.j.pressGrab()) continue;
        if (recover(candidate.g,candidate.j,target.id)) {
          solution = candidate;
          results.push({name:stage.name,charge,frame:f,window});
          break;
        }
      }
    }
    if (!solution) throw Error(stage.name + ': no recoverable jump; closest ' + closest.toFixed(1));
    g=solution.g; j=solution.j;
  }
  tick(g,j,100);
  return {g,j,results};
}
