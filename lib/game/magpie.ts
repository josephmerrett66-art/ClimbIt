import { LIMBS, distance, type Climber, type Limb } from './physics';
import type { Point } from './level';
// Feet sit on these roof edges in the 1600 × 1000 scene artwork.
const PERCHES: Record<string, Point> = {
  'pub-keys': { x: 748, y: 414 },
  'surf-croc': { x: 702, y: 277 },
  'summer-santa': { x: 650, y: 322 },
  'prize-pumpkin': { x: 720, y: 350 },
  // Station roof ridge, above the exposed y=470 awning traverse. Out of range
  // from the start and from the tower finish, so the bird commits while the
  // climber is hand-only across the middle of the route.
  'signal-esky': { x: 888, y: 237 },
};
export class MagpieEncounter {
  phase:
    | 'waiting'
    | 'warning'
    | 'approach'
    | 'swoop'
    | 'escape'
    | 'return'
    | 'falling'
    | 'defeated' = 'waiting';
  time = 0;
  cooldown = 0;
  private previousTip: Point | null = null;
  private previousHand: Point | null = null;
  hits = 0;
  readonly perch: Point;
  bird: Point;
  private staging: Point = { x: 0, y: 0 };
  wingTime = 0;
  velocity: Point = { x: 0, y: 0 };
  direction = -1;
  rotation = 0;
  constructor(public g: Climber) {
    const feet = PERCHES[g.level.id];
    this.perch = { x: feet.x, y: feet.y - 18 * g.scale };
    this.bird = { ...this.perch };
  }
  private steer(target: Point, speed: number, dt: number) {
    const d = Math.max(1, distance(target, this.bird));
    const blend = 1 - Math.exp(-3 * dt);
    this.velocity.x +=
      (((target.x - this.bird.x) / d) * speed - this.velocity.x) * blend;
    this.velocity.y +=
      (((target.y - this.bird.y) / d) * speed - this.velocity.y) * blend;
  }
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
    if (g.cigaretteHand) {
      g.message = 'Put the dart out before taking out the racket.';
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
    this.wingTime += dt;
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
      this.bird = { ...this.perch };
      this.velocity = { x: 0, y: 0 };
      this.rotation = 0;
      this.direction = g.p.neck.x < this.perch.x ? -1 : 1;
      this.cooldown -= dt;
      if (
        this.cooldown <= 0 &&
        distance(g.p.hip, this.perch) < 285 &&
        g.hasHandSupport()
      ) {
        this.phase = 'warning';
        this.time = 0;
        this.direction = g.p.hip.x < this.perch.x ? -1 : 1;
        g.message =
          'That magpie has spotted you. Secure a hand and get the racket ready.';
      }
      return;
    }
    if (this.phase === 'warning') {
      // The bird stays on the roof long enough for the player to recognise the
      // threat, then visibly leaves the perch before the damaging dive begins.
      if (this.time >= 2.4) {
        const staging = {
            x: g.p.neck.x - this.direction * 125 * s,
            y: g.p.neck.y - 75 * s,
          },
          d = Math.max(1, distance(staging, this.bird));
        this.staging = staging;
        this.velocity = {
          x: ((staging.x - this.bird.x) / d) * 92 * s,
          y: ((staging.y - this.bird.y) / d) * 92 * s,
        };
        this.phase = 'approach';
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
    if (this.phase === 'approach') this.steer(this.staging, 115 * s, dt);
    if (this.phase === 'return')
      this.steer(
        this.perch,
        Math.min(140 * s, distance(this.bird, this.perch) * 2),
        dt,
      );
    if (this.phase === 'escape')
      this.velocity.y += (-100 * s - this.velocity.y) * (1 - Math.exp(-2 * dt));
    this.bird.x += this.velocity.x * dt;
    this.bird.y += this.velocity.y * dt;
    if (Math.abs(this.velocity.x) > 4 * s)
      this.direction = Math.sign(this.velocity.x);
    const bank = Math.max(
      -0.6,
      Math.min(
        0.6,
        Math.atan2(this.velocity.y, Math.abs(this.velocity.x)) * this.direction,
      ),
    );
    this.rotation += (bank - this.rotation) * (1 - Math.exp(-5 * dt));
    if (this.phase === 'return') {
      if (distance(this.bird, this.perch) < 3 * s) {
        this.phase = 'waiting';
        this.cooldown = 16;
        this.time = 0;
      }
      return;
    }
    if (this.phase === 'approach') {
      if (this.time >= 3 || distance(this.bird, this.staging) < 20 * s) {
        const target = g.p.neck,
          d = Math.max(1, distance(target, this.bird));
        this.velocity = {
          x: ((target.x - this.bird.x) / d) * 190 * s,
          y: ((target.y - this.bird.y) / d) * 190 * s,
        };
        this.phase = 'swoop';
        this.time = 0;
        g.message = 'It is diving — swing through it or move!';
      }
      return;
    }
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
        sweptContact(oldBird, this.bird, g.p.neck, g.p.neck, 25 * s) ||
        sweptContact(oldBird, this.bird, g.p.hip, g.p.hip, 23 * s)
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
    } else if (this.phase === 'escape' && this.time > 1.6) {
      this.phase = 'return';
      this.time = 0;
    }
  }
}
const encounters = new WeakMap<Climber, MagpieEncounter>();
export function magpieFor(g: Climber) {
  if (!PERCHES[g.level.id]) return null;
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
