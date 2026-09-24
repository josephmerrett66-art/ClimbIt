import { distance, type Climber, type Limb } from './physics';
import type { Point } from './level';

export type SmokePuff = Point & { age: number; phase: number };

export class CigaretteMoment {
  puffs: SmokePuff[] = [];
  smoking = false;
  private emission = 0;

  constructor(public g: Climber) {}

  toggle() {
    const g = this.g;
    if (g.complete || g.failed) return;
    if (g.cigaretteHand) {
      if (g.drag?.limb === g.cigaretteHand) g.end(true);
      g.cigaretteHand = null;
      this.smoking = false;
      g.message = 'Dart out. Back to the climb.';
      return;
    }
    if (g.racketHand) {
      g.message = 'Put the racket away before lighting a dart.';
      return;
    }
    if (g.drag || g.carrying) {
      g.message = 'Finish your reach before lighting a dart.';
      return;
    }
    const hand: Limb = g.grips.leftHand ? 'rightHand' : 'leftHand';
    const support = hand === 'leftHand' ? 'rightHand' : 'leftHand';
    if (!g.grips[support]) {
      g.message = 'Secure your other hand before lighting a dart.';
      return;
    }
    g.cigaretteHand = hand;
    delete g.grips[hand];
    g.message = 'Dart lit. Drag that hand to your mouth for a smoke.';
  }

  tip(): Point {
    const g = this.g;
    const handName = g.cigaretteHand ?? 'rightHand';
    const hand = g.p[handName];
    const elbow = g.p[handName.replace('Hand', 'Elbow')];
    const d = Math.max(0.001, distance(hand, elbow));
    return {
      x: hand.x + ((hand.x - elbow.x) / d) * 11 * g.scale,
      y: hand.y + ((hand.y - elbow.y) / d) * 11 * g.scale,
    };
  }

  step(dt: number) {
    const g = this.g;
    const s = g.scale;
    this.puffs = this.puffs
      .map((puff) => ({
        ...puff,
        age: puff.age + dt,
        x: puff.x + Math.sin(puff.phase + puff.age * 4) * 4 * s * dt,
        y: puff.y - (15 + puff.age * 8) * s * dt,
      }))
      .filter((puff) => puff.age < 1.8);
    if (!g.cigaretteHand || g.complete || g.failed) {
      this.smoking = false;
      return;
    }
    const tip = this.tip();
    this.smoking = distance(tip, g.p.head) < 24 * s;
    if (!this.smoking) {
      this.emission = 0;
      return;
    }
    this.emission -= dt;
    if (this.emission <= 0) {
      this.puffs.push({
        x: tip.x,
        y: tip.y - 2 * s,
        age: 0,
        phase: g.elapsed * 7,
      });
      this.emission = 0.075;
    }
  }
}

const moments = new WeakMap<Climber, CigaretteMoment>();
export const existingCigaretteFor = (g: Climber) => moments.get(g) ?? null;
export function cigaretteFor(g: Climber) {
  let moment = moments.get(g);
  if (!moment) {
    moment = new CigaretteMoment(g);
    moments.set(g, moment);
  }
  return moment;
}
