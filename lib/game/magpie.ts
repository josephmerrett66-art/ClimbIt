import { LIMBS, distance, type Climber, type Limb } from './physics';
import type { Point } from './level';
export class MagpieEncounter {
  phase: 'waiting' | 'warning' | 'swoop' | 'escape' | 'falling' | 'defeated' =
    'waiting';
  time = 0;
  cooldown = 5;
  swing = 0;
  recovery = 0;
  hits = 0;
  bird: Point = { x: 0, y: 0 };
  velocity: Point = { x: 0, y: 0 };
  direction = -1;
  rotation = 0;
  constructor(public g: Climber) {}
  equip() {
    const g = this.g;
    if (g.complete || g.failed) return;
    if (g.racketHand) {
      g.racketHand = null;
      this.swing = 0;
      return;
    }
    if (g.drag || g.carrying) {
      g.message = 'Finish your reach before taking out the racket.';
      return;
    }
    const hand: Limb = g.grips.leftHand ? 'rightHand' : 'leftHand';
    if (!g.grips[hand === 'leftHand' ? 'rightHand' : 'leftHand']) {
      g.message = 'Secure your other hand before taking out the racket.';
      return;
    }
    g.racketHand = hand;
    delete g.grips[hand];
    g.message = 'Racket out. Time your swing as the magpie comes close.';
  }
  strike() {
    const g = this.g;
    if (!g.racketHand || this.recovery > 0 || g.complete || g.failed) return;
    if (g.stamina[g.racketHand] < 6) {
      g.message = 'Too tired to swing. Put the racket away and rest.';
      return;
    }
    g.stamina[g.racketHand] -= 6;
    this.swing = 0.32;
    this.recovery = 0.8;
  }
  racketTip(): Point {
    const g = this.g,
      hand = g.p[g.racketHand ?? 'rightHand'];
    const angle = this.swing > 0 ? -2.5 + (1 - this.swing / 0.32) * 3.4 : -1.2;
    return {
      x: hand.x + Math.cos(angle) * 38 * g.scale,
      y: hand.y + Math.sin(angle) * 38 * g.scale,
    };
  }
  step(dt: number) {
    const g = this.g,
      s = g.scale;
    if (g.complete || g.failed) return;
    this.time += dt;
    this.swing = Math.max(0, this.swing - dt);
    this.recovery = Math.max(0, this.recovery - dt);
    if (g.racketHand) {
      const hand = g.p[g.racketHand],
        root = g.root(g.racketHand);
      const side = g.racketHand === 'leftHand' ? -1 : 1;
      const angle =
        this.swing > 0 ? -1.7 + (1 - this.swing / 0.32) * 1.3 : -0.8;
      const target = {
        x: root.x + Math.cos(angle) * 46 * s * side,
        y: root.y + Math.sin(angle) * 46 * s,
      };
      const ease = 1 - Math.exp(-18 * dt);
      hand.x += (target.x - hand.x) * ease;
      hand.y += (target.y - hand.y) * ease;
      hand.px = hand.x;
      hand.py = hand.y;
    }
    if (this.phase === 'defeated') return;
    if (this.phase === 'waiting') {
      this.cooldown -= dt;
      if (
        this.cooldown <= 0 &&
        g.p.hip.y < g.level.playerSpawn.y - 35 * s &&
        g.hasHandSupport()
      ) {
        this.phase = 'warning';
        this.time = 0;
        this.direction = this.hits % 2 === 0 ? -1 : 1;
        this.bird = {
          x: g.p.neck.x - this.direction * 150 * s,
          y: g.p.neck.y - 70 * s,
        };
        g.message = 'MAGPIE! Secure your feet, dodge, or get the racket ready.';
      }
      return;
    }
    if (this.phase === 'warning') {
      if (this.time >= 1.6) {
        const target = g.p.neck,
          d = Math.max(1, distance(target, this.bird));
        this.velocity = {
          x: ((target.x - this.bird.x) / d) * 190 * s,
          y: ((target.y - this.bird.y) / d) * 190 * s,
        };
        this.phase = 'swoop';
        this.time = 0;
      }
      return;
    }
    if (this.phase === 'falling') {
      this.velocity.y += 260 * s * dt;
      this.rotation += dt * 7;
      this.bird.x += this.velocity.x * dt;
      this.bird.y += this.velocity.y * dt;
      if (this.bird.y >= g.level.playerSpawn.y + 75 * s || this.time > 3)
        this.phase = 'defeated';
      return;
    }
    this.bird.x += this.velocity.x * dt;
    this.bird.y += this.velocity.y * dt;
    if (this.phase === 'swoop') {
      if (
        this.swing > 0 &&
        g.racketHand &&
        distance(this.racketTip(), this.bird) < 34 * s
      ) {
        this.phase = 'falling';
        this.time = 0;
        this.velocity = { x: -this.direction * 65 * s, y: -60 * s };
        g.message = 'Good shot! The magpie is out of this climb.';
        return;
      }
      if (
        Math.min(distance(this.bird, g.p.neck), distance(this.bird, g.p.hip)) <
        28 * s
      ) {
        const attached = LIMBS.filter((limb) => g.grips[limb]);
        const limb = attached[this.hits % Math.max(1, attached.length)];
        if (limb) delete g.grips[limb];
        g.p.hip.px -= this.direction * 1.2 * s;
        g.message = limb
          ? 'Swooped! One grip knocked loose — catch another edge!'
          : 'Magpie hit! Grab an edge!';
        this.phase = 'escape';
        this.time = 0;
        this.hits++;
      } else if (this.time > 1.5) {
        this.phase = 'escape';
        this.time = 0;
        this.hits++;
      }
    } else if (this.time > 1.2) {
      this.phase = 'waiting';
      this.cooldown = 12;
      this.time = 0;
    }
  }
}
const encounters = new WeakMap<Climber, MagpieEncounter>();
export function magpieFor(g: Climber) {
  if (g.level.id !== 'pub-keys') return null;
  let encounter = encounters.get(g);
  if (!encounter) {
    encounter = new MagpieEncounter(g);
    encounters.set(g, encounter);
  }
  return encounter;
}
