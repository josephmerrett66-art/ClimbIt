import { LIMBS, distance, type Climber, type Limb } from './physics';
import type { Point } from './level';
export class MagpieEncounter {
  phase: 'waiting' | 'warning' | 'swoop' | 'escape' | 'falling' | 'defeated' =
    'waiting';
  time = 0;
  cooldown = 5;
  private previousTip: Point | null = null;
  private previousHand: Point | null = null;
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
      if (g.drag?.limb === g.racketHand) g.end(true);
      g.racketHand = null;
      this.previousTip = null;
      this.previousHand = null;
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
    this.previousTip = this.racketTip();
    this.previousHand = null;
    g.message =
      'Racket out. Grab this hand and drag it through the magpie to swing.';
  }
  racketTip(): Point {
    const g = this.g,
      hand = g.p[g.racketHand ?? 'rightHand'];
    const elbow = g.p[(g.racketHand ?? 'rightHand').replace('Hand', 'Elbow')];
    const angle = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);
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
    const tip = g.racketHand ? this.racketTip() : null;
    const oldTip = this.previousTip ?? tip;
    const hand = g.racketHand ? g.p[g.racketHand] : null;
    const root = g.racketHand ? g.root(g.racketHand) : null;
    const relativeHand =
      hand && root ? { x: hand.x - root.x, y: hand.y - root.y } : null;
    const handSpeed =
      dt > 0 && relativeHand && this.previousHand
        ? distance(relativeHand, this.previousHand) / dt
        : 0;
    const swinging = Boolean(
      g.racketHand &&
      g.drag?.limb === g.racketHand &&
      tip &&
      oldTip &&
      dt > 0 &&
      handSpeed > 65 * s &&
      distance(tip, oldTip) / dt > 100 * s &&
      g.stamina[g.racketHand] > 0,
    );
    if (swinging && g.racketHand)
      g.stamina[g.racketHand] = Math.max(0, g.stamina[g.racketHand] - 12 * dt);
    this.previousTip = tip;
    this.previousHand = relativeHand;
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
    const oldBird = { ...this.bird };
    this.bird.x += this.velocity.x * dt;
    this.bird.y += this.velocity.y * dt;
    if (this.phase === 'swoop') {
      if (
        swinging &&
        tip &&
        oldTip &&
        sweptContact(oldTip, tip, oldBird, this.bird, 27 * s)
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

// Relative swept collision catches quick mouse/touch swipes between frames.
export function sweptContact(
  from: Point,
  to: Point,
  birdFrom: Point,
  birdTo: Point,
  radius: number,
) {
  const a = { x: from.x - birdFrom.x, y: from.y - birdFrom.y };
  const b = { x: to.x - birdTo.x, y: to.y - birdTo.y };
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared
    ? Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lengthSquared))
    : 0;
  return Math.hypot(a.x + dx * t, a.y + dy * t) <= radius;
}
