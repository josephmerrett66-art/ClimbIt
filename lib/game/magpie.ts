import { LIMBS, distance, type Climber, type Limb } from './physics';
import type { Point } from './level';
// Territory centres on these roof edges in the 1600 × 1000 scene artwork. The
// bird circles its territory rather than sitting on the roof waiting.
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

// The bird tells you what it is about to do by how it flies, never by a caption.
// It circles its territory; when you come into range it closes into a tighter,
// faster orbit around you; then it makes passes. Passes strictly alternate — a
// wide one over your head that cannot hurt you, then a committed one straight at
// you that can. Reading which is which, and counting them, is the whole fight.
export const FLIGHT = {
  alertRange: 285,
  patrolRadius: 108,
  patrolRise: 0.45,
  patrolTurn: 0.55,
  patrolSpeed: 92,
  stalkRadius: 122,
  stalkRise: 0.5,
  stalkTurn: 1.15,
  stalkSpeed: 132,
  // A full slow lap before the first pass reads as a wind-up. The second pass
  // follows quickly, so the pair lands as one combination.
  openingStalk: 2.4,
  followUpStalk: 1.3,
  feintSpeed: 168,
  diveSpeed: 202,
  passTime: 1.2,
  recoverTime: 1.2,
  recoverClimb: -108,
  // Breathing room after a committed dive, spent back out on patrol.
  cooldown: 5,
};

export class MagpieEncounter {
  phase:
    | 'patrol'
    | 'stalk'
    | 'feint'
    | 'dive'
    | 'recover'
    | 'falling'
    | 'defeated' = 'patrol';
  time = 0;
  cooldown = 0;
  private previousTip: Point | null = null;
  private previousHand: Point | null = null;
  hits = 0;
  passes = 0;
  readonly perch: Point;
  bird: Point;
  // False means the next pass is the harmless one. Passes alternate from here,
  // so the opening move of every encounter is a warning the player can read.
  armed = false;
  private orbit = Math.PI;
  private aim: Point = { x: 0, y: 0 };
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
  // A pass is launched on a fixed heading and then flown ballistically. It does
  // not track the climber, so once it is committed its line can be read and
  // stepped out of, and the wide pass stays visibly wide.
  private launch(s: number) {
    const g = this.g;
    const real = this.armed;
    this.armed = !real;
    const toward = g.p.neck.x < this.bird.x ? -1 : 1;
    this.aim = real
      ? { x: g.p.neck.x, y: g.p.neck.y }
      : {
          x: g.p.neck.x + toward * 44 * s,
          y: g.p.neck.y - 62 * s,
        };
    const d = Math.max(1, distance(this.aim, this.bird));
    const speed = (real ? FLIGHT.diveSpeed : FLIGHT.feintSpeed) * s;
    this.velocity = {
      x: ((this.aim.x - this.bird.x) / d) * speed,
      y: ((this.aim.y - this.bird.y) / d) * speed,
    };
    this.phase = real ? 'dive' : 'feint';
    this.time = 0;
    this.passes++;
  }
  private inRange() {
    return (
      distance(this.g.p.hip, this.perch) < FLIGHT.alertRange &&
      this.g.hasHandSupport()
    );
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

    if (this.phase === 'patrol') {
      this.cooldown = Math.max(0, this.cooldown - dt);
      this.orbit += FLIGHT.patrolTurn * dt;
      this.steer(
        {
          x: this.perch.x + Math.cos(this.orbit) * FLIGHT.patrolRadius * s,
          y:
            this.perch.y +
            Math.sin(this.orbit) * FLIGHT.patrolRadius * FLIGHT.patrolRise * s,
        },
        FLIGHT.patrolSpeed * s,
        dt,
      );
      if (!this.cooldown && this.inRange()) {
        this.phase = 'stalk';
        this.time = 0;
        // Every encounter opens with the harmless pass.
        this.armed = false;
      }
    } else if (this.phase === 'stalk') {
      this.orbit += FLIGHT.stalkTurn * dt;
      this.steer(
        {
          x: g.p.neck.x + Math.cos(this.orbit) * FLIGHT.stalkRadius * s,
          y:
            g.p.neck.y -
            88 * s +
            Math.sin(this.orbit) * FLIGHT.stalkRadius * FLIGHT.stalkRise * s,
        },
        FLIGHT.stalkSpeed * s,
        dt,
      );
      if (!this.inRange()) this.phase = 'patrol';
      else if (
        this.time >= (this.armed ? FLIGHT.followUpStalk : FLIGHT.openingStalk)
      )
        this.launch(s);
    } else if (this.phase === 'recover') {
      this.velocity.y +=
        (FLIGHT.recoverClimb * s - this.velocity.y) * (1 - Math.exp(-2 * dt));
      if (this.time > FLIGHT.recoverTime) {
        this.phase = this.cooldown || !this.inRange() ? 'patrol' : 'stalk';
        this.time = 0;
      }
    }

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

    if (this.phase !== 'feint' && this.phase !== 'dive') return;

    // Both kinds of pass can be swatted, so reading the wind-up is rewarded
    // rather than merely survived.
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
      this.phase === 'dive' &&
      (sweptContact(oldBird, this.bird, g.p.neck, g.p.neck, 25 * s) ||
        sweptContact(oldBird, this.bird, g.p.hip, g.p.hip, 23 * s))
    ) {
      const attached = LIMBS.filter((limb) => g.grips[limb]);
      const limb = attached[this.hits % Math.max(1, attached.length)];
      if (limb) delete g.grips[limb];
      g.p.hip.px -= this.direction * 1.2 * s;
      g.message = limb
        ? 'Swooped! One grip knocked loose — catch another edge!'
        : 'Magpie hit! Grab an edge!';
      this.hits++;
      this.cooldown = FLIGHT.cooldown;
      this.phase = 'recover';
      this.time = 0;
      return;
    }
    if (this.time > FLIGHT.passTime) {
      if (this.phase === 'dive') this.cooldown = FLIGHT.cooldown;
      this.phase = 'recover';
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
