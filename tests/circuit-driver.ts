import { Climber, LIMBS, distance } from '../lib/game/physics';
import { JumpController } from '../lib/game/jump';
import { jumpLabLevel, boulderSections } from '../lib/game/jump-lab';
import { tick, copy, recover } from './switchback-driver';
import { establishRest } from './rest-driver';
export function climb(g: Climber, j: JumpController, index: number) {
  const holds = g.level.gripPoints.filter(
    (h) =>
      h.id.startsWith(`section-${index}-`) ||
      h.id === (index ? `landing-${index}` : 'start-hands'),
  );
  const finish = holds.find((h) => h.surface === 'rest')!;
  let beam = [{ g, j, path: [] as string[] }];
  const seen = new Set<string>();
  for (let depth = 0; depth < 26; depth++) {
    const next: typeof beam = [];
    for (const state of beam) {
      if (
        state.g.grips.leftHand?.id === finish.id &&
        state.g.grips.rightHand?.id === finish.id &&
        (state.g.grips.leftFoot || state.g.grips.rightFoot)
      )
        return state;
      if (index >= 10) {
        for (const limb of ['leftFoot', 'rightFoot'] as const) {
          if (!state.g.grips[limb]) continue;
          const c = copy(state.g, state.j);
          c.g.begin(limb, { x: c.g.p.hip.x, y: c.g.p.hip.y });
          tick(c.g, c.j, 24);
          c.g.end();
          tick(c.g, c.j, 12);
          if (!c.g.failed && !c.g.grips[limb])
            next.push({ ...c, path: [...state.path, `release:${limb}`] });
        }
      }
      for (const limb of LIMBS)
        for (const hold of holds) {
          if (
            state.g.grips[limb]?.id === hold.id ||
            !state.g.canUse(limb, hold) ||
            distance(state.g.p[limb], hold) > 175
          )
            continue;
          const c = copy(state.g, state.j);
          if (!c.g.begin(limb, hold)) continue;
          tick(c.g, c.j, 36);
          c.g.end();
          tick(c.g, c.j, 12);
          if (c.g.failed || c.g.grips[limb]?.id !== hold.id) continue;
          const key =
            LIMBS.map((l) => c.g.grips[l]?.id ?? '-').join(',') +
            ':' +
            Math.round(c.g.p.hip.x / 12) +
            ',' +
            Math.round(c.g.p.hip.y / 12);
          if (seen.has(key)) continue;
          seen.add(key);
          next.push({ ...c, path: [...state.path, `${limb}:${hold.id}`] });
        }
    }
    const score = (s: (typeof beam)[number]) =>
      distance(s.g.p.leftHand, finish) +
      distance(s.g.p.rightHand, finish) +
      0.2 * distance(s.g.p.hip, { x: finish.x, y: finish.y + 75 }) -
      Object.keys(s.g.grips).length * 14;
    next.sort((a, b) => score(a) - score(b));
    beam = next.slice(0, 18);
    if (!beam.length) break;
  }
  throw Error(`Climb ${index} unsolved`);
}
export function solveCircuit() {
  let g = new Climber(structuredClone(jumpLabLevel)),
    j = new JumpController(g);
  tick(g, j, 60);
  for (let index = 0; index < boulderSections.length; index++) {
    if (index >= 10) establishRest(g);
    const solved = climb(g, j, index);
    g = solved.g;
    j = solved.j;
    console.log('CLIMBED', index, solved.path);
    if (index === boulderSections.length - 1) break;
    const target = g.level.gripPoints.find(
      (h) => h.id === `landing-${index + 1}`,
    )!;
    let result: ReturnType<typeof copy> | undefined;
    for (let charge = 24; charge <= 70 && !result; charge += 2) {
      const launch = copy(g, j);
      if (launch.j.select(target) !== 'selected' || !launch.j.startCharge())
        continue;
      tick(launch.g, launch.j, charge);
      launch.j.release();
      tick(launch.g, launch.j, 17);
      for (let f = 0; f < 100 && !launch.g.failed; f++) {
        tick(launch.g, launch.j);
        if (launch.j.catchCue !== 'ready') continue;
        const c = copy(launch.g, launch.j);
        if (c.j.pressGrab() && recover(c.g, c.j, target.id)) {
          result = c;
          console.log('JUMP', index, charge, f);
          break;
        }
      }
    }
    if (!result) throw Error('Jump ' + index + ' unsolved');
    g = result.g;
    j = result.j;
  }
  tick(g, j, 240);
  if (!g.complete) throw Error('Finish not controlled');
  console.log('FULL CONTINUOUS RUN PASS');
  return { g, j };
}
