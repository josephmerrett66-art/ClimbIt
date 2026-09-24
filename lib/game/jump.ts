import type { Grip, Point } from './level';
import { distance, type Climber, type Limb } from './physics';

export type JumpState =
  | 'idle'
  | 'charging'
  | 'propelling'
  | 'airborne'
  | 'caught';

const HANDS: Limb[] = ['leftHand', 'rightHand'];
const FEET: Limb[] = ['leftFoot', 'rightFoot'];
const TORSO = [
  'hip',
  'leftHip',
  'rightHip',
  'neck',
  'head',
  'leftShoulder',
  'rightShoulder',
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const smoothstep = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export class JumpController {
  state: JumpState = 'idle';
  charge = 0;
  target: Grip | null = null;
  flightTime = 0;
  private phaseTime = 0;
  private launchPower = 0;
  private chargePose: Record<string, Point> | null = null;
  private propulsionPose: Record<string, Point> | null = null;
  private handsReleased = false;
  private feetReleased = false;
  private leadHand: Limb = 'rightHand';

  constructor(public game: Climber) {}

  private snapshot() {
    return Object.fromEntries(
      Object.entries(this.game.p).map(([name, p]) => [
        name,
        { x: p.x, y: p.y },
      ]),
    );
  }

  private direction(from: Point) {
    const target = this.target!;
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  private shiftToward(name: string, desired: Point, strength: number) {
    const p = this.game.p[name];
    const dx = (desired.x - p.x) * strength;
    const dy = (desired.y - p.y) * strength;
    p.x += dx;
    p.y += dy;
    // Pose shaping is muscular movement, not stored launch velocity. The
    // actual take-off impulse is applied once the feet leave their holds.
    p.px += dx;
    p.py += dy;
  }

  private sameHandHold() {
    const left = this.game.grips.leftHand;
    const right = this.game.grips.rightHand;
    return Boolean(left && right && left.id === right.id);
  }

  private footReady() {
    return Boolean(this.game.grips.leftFoot || this.game.grips.rightFoot);
  }

  select(point: Point) {
    if (this.state === 'airborne') {
      if (
        !this.target ||
        distance(point, this.target) > (this.target.radius ?? 18) + 24
      )
        return 'none';
      return this.tryCatch(point) ? 'caught' : 'missed';
    }
    if (this.state === 'charging' || this.state === 'propelling') return 'none';
    const target = this.game.level.gripPoints
      .filter((hold) => hold.jumpTarget)
      .sort((a, b) => distance(a, point) - distance(b, point))[0];
    if (!target || distance(target, point) > (target.radius ?? 18) + 18)
      return 'none';
    this.target = target;
    this.game.message =
      'Target selected. Match both hands, plant a boot, then hold JUMP to load the legs.';
    return 'selected';
  }

  startCharge() {
    const g = this.game;
    if (this.state === 'airborne' || this.state === 'propelling') return false;
    if (!this.target) {
      g.message = 'Tap a coloured hand hold to choose a landing target.';
      return false;
    }
    if (!this.sameHandHold()) {
      g.message = 'Put both hands on the same hold before coiling up.';
      return false;
    }
    if (!this.footReady()) {
      g.message = 'Keep at least one boot planted before coiling up.';
      return false;
    }
    g.drag = null;
    this.state = 'charging';
    this.charge = 0;
    this.chargePose = this.snapshot();
    g.message = 'Loading the legs… release JUMP to drive through the foothold.';
    return true;
  }

  cancelCharge() {
    if (this.state !== 'charging') return;
    this.state = 'idle';
    this.charge = 0;
    this.chargePose = null;
    this.game.message = 'Jump cancelled.';
  }

  release() {
    if (this.state !== 'charging') return false;
    const g = this.game;
    if (!this.target || this.charge < 0.12) {
      this.cancelCharge();
      g.message = 'Hold JUMP longer so the legs have time to load.';
      return false;
    }
    this.launchPower = this.charge;
    this.leadHand =
      this.target.x >= g.p.hip.x ? 'rightHand' : 'leftHand';
    this.state = 'propelling';
    this.phaseTime = 0;
    this.propulsionPose = this.snapshot();
    this.handsReleased = false;
    this.feetReleased = false;
    g.message = 'Driving through the legs…';
    return true;
  }

  private coil() {
    const g = this.game;
    if (!this.target || !this.chargePose) return;
    const direction = this.direction(g.p.hip);
    const load = smoothstep(this.charge);
    // A climbing dyno starts opposite the intended motion: hips sink and move
    // slightly away from the target while the hands and feet remain fixed.
    const offset = {
      x: -direction.x * 34 * load * g.scale,
      y: (60 - Math.min(0, direction.y) * 12) * load * g.scale,
    };
    for (const name of TORSO) {
      const base = this.chargePose[name];
      const amount = name === 'head' ? 0.78 : name === 'neck' ? 0.9 : 1;
      const tuck = name === 'head' ? 8 * load * g.scale : 0;
      this.shiftToward(
        name,
        {
          x: base.x + offset.x * amount + direction.x * tuck * 0.35,
          y: base.y + offset.y * amount + tuck,
        },
        0.66,
      );
    }
    // Keep knees between the hips and planted feet so the silhouette reads as
    // a loaded spring instead of a torso simply sliding down.
    for (const side of ['left', 'right']) {
      const hip = g.p[side + 'Hip'];
      const foot = g.p[side + 'Foot'];
      const sign = side === 'left' ? -1 : 1;
      this.shiftToward(
        side + 'Knee',
        {
          x: (hip.x + foot.x) / 2 + sign * 23 * g.scale * load,
          y: (hip.y + foot.y) / 2 + 11 * g.scale * load,
        },
        0.32,
      );
    }
  }

  private propel(dt: number) {
    const g = this.game;
    if (!this.target || !this.propulsionPose) return;
    this.phaseTime += dt;
    const duration = 0.28;
    const t = clamp(this.phaseTime / duration, 0, 1);
    // Fast hip extension after the visible load gives the take-off a forceful,
    // spring-like snap instead of evenly interpolating out of the crouch.
    const drive = 1 - Math.pow(1 - t, 3);
    const direction = this.direction(g.p.hip);

    // The hands pull during the first instant. They release before the feet,
    // allowing the legs to provide the final external impulse.
    if (t >= 0.24 && !this.handsReleased) {
      for (const hand of HANDS) delete g.grips[hand];
      this.handsReleased = true;
    }
    if (t >= 0.78 && !this.feetReleased) {
      for (const foot of FEET) delete g.grips[foot];
      this.feetReleased = true;
    }

    const driveDistance = (50 + 22 * this.launchPower) * g.scale;
    const lift = (36 + 22 * this.launchPower) * g.scale;
    for (const name of TORSO) {
      const base = this.propulsionPose[name];
      const amount = name === 'head' ? 1.03 : 1;
      this.shiftToward(
        name,
        {
          x: base.x + direction.x * driveDistance * drive * amount,
          y:
            base.y +
            direction.y * driveDistance * drive * amount -
            lift * drive,
        },
        0.48,
      );
    }

    if (this.handsReleased) {
      const perpendicular = { x: -direction.y, y: direction.x };
      for (const side of ['left', 'right']) {
        const sign = side === 'left' ? -1 : 1;
        const handName = (side + 'Hand') as Limb;
        const shoulder = g.p[side + 'Shoulder'];
        const leading = handName === this.leadHand;
        const reach = (leading ? 78 : 38) * g.scale;
        const handTarget = {
          x:
            shoulder.x +
            direction.x * reach * (leading ? 1 : -0.35) +
            perpendicular.x * sign * (leading ? 5 : 18) * g.scale,
          y:
            shoulder.y +
            direction.y * reach * (leading ? 1 : -0.35) +
            perpendicular.y * sign * (leading ? 5 : 18) * g.scale +
            (leading ? 0 : 22 * g.scale),
        };
        this.shiftToward(side + 'Hand', handTarget, leading ? 0.56 : 0.18);
        this.shiftToward(
          side + 'Elbow',
          {
            x: shoulder.x + (handTarget.x - shoulder.x) * 0.52,
            y: shoulder.y + (handTarget.y - shoulder.y) * 0.52,
          },
          leading ? 0.38 : 0.12,
        );
      }
    }

    // As the hips rise, the knees unfold towards the line between hip and foot.
    // The small remaining offset keeps each knee on its anatomical bend side.
    for (const side of ['left', 'right']) {
      const hip = g.p[side + 'Hip'];
      const foot = g.p[side + 'Foot'];
      const sign = side === 'left' ? -1 : 1;
      this.shiftToward(
        side + 'Knee',
        {
          x: (hip.x + foot.x) / 2 + sign * 5 * g.scale * (1 - t),
          y: (hip.y + foot.y) / 2 + 2 * g.scale * (1 - t),
        },
        0.28,
      );
    }

    if (t >= 1) this.takeOff();
  }

  private takeOff() {
    const g = this.game;
    const target = this.target!;
    const handCenter = {
      x: (g.p.leftHand.x + g.p.rightHand.x) / 2,
      y: (g.p.leftHand.y + g.p.rightHand.y) / 2,
    };
    const direction = this.direction(handCenter);
    const dx = target.x - handCenter.x;
    const fullHorizontalSpeed = 10.5 * g.scale;
    const frames = clamp(Math.abs(dx) / fullHorizontalSpeed, 9, 30);
    // Aim a little beyond the hold. Dynos are caught just before the dead
    // point rather than with the body already falling away from the target.
    const overshootY = target.y - 10 * g.scale;
    const fullVy = clamp(
      (overshootY - handCenter.y - (0.42 * frames * frames) / 2) / frames,
      -14 * g.scale,
      -4 * g.scale,
    );
    const power = 0.56 + this.launchPower * 0.44;
    const vx = Math.sign(dx || 1) * fullHorizontalSpeed * power;
    const vy = fullVy * power;

    g.grips = {};
    g.drag = null;
    g.gripFocus = null;
    for (const [name, p] of Object.entries(g.p)) {
      let segmentVx = vx;
      let segmentVy = vy;
      if (name === this.leadHand) {
        segmentVx += direction.x * 3 * this.launchPower;
        segmentVy += direction.y * 3 * this.launchPower;
      } else if (name === this.leadHand.replace('Hand', 'Elbow')) {
        segmentVx += direction.x * 1.5 * this.launchPower;
        segmentVy += direction.y * 1.5 * this.launchPower;
      } else if (name.endsWith('Hand')) {
        // The spare arm is no longer posed after take-off. Give it less forward
        // momentum so the articulated bones let it trail and swing naturally.
        segmentVx -= direction.x * 2.2;
        segmentVy += 1.9;
      } else if (name.endsWith('Elbow')) {
        segmentVx -= direction.x * 1.05;
        segmentVy += 1.1;
      } else if (name.endsWith('Foot')) {
        segmentVx -= direction.x * 2.1;
        segmentVy += 2.3;
      } else if (name.endsWith('Knee')) {
        segmentVx -= direction.x * 0.9;
        segmentVy += 1.15;
      }
      p.px = p.x - segmentVx;
      p.py = p.y - segmentVy;
    }
    this.state = 'airborne';
    this.flightTime = 0;
    this.phaseTime = 0;
    this.chargePose = null;
    this.propulsionPose = null;
    g.unanchoredStartY = g.p.hip.y;
    g.message = 'Airborne — the hands lead. Tap the target as they arrive.';
  }

  private reachInFlight(dt: number) {
    const g = this.game;
    const target = this.target;
    if (!target) return;
    // Small equal-and-opposite internal impulses let the arms reach without
    // granting the whole body a second mid-air acceleration.
    for (const handName of [this.leadHand]) {
      const hand = g.p[handName];
      const dx = target.x - hand.x;
      const dy = target.y - hand.y;
      const d = Math.hypot(dx, dy) || 1;
      const impulse = Math.min(0.75, d * 0.012) * dt * 60;
      const ix = (dx / d) * impulse;
      const iy = (dy / d) * impulse;
      hand.px -= ix;
      hand.py -= iy;
      g.p.hip.px += ix * 0.11;
      g.p.hip.py += iy * 0.11;
    }
  }

  tryCatch(point: Point) {
    const g = this.game;
    const target = this.target;
    if (this.state !== 'airborne' || !target) return false;
    if (distance(point, target) > (target.radius ?? 18) + 24) return false;
    const hands = [...HANDS].sort(
      (a, b) => distance(g.p[a], target) - distance(g.p[b], target),
    );
    const nearest =
      distance(g.p[this.leadHand], target) <= 68 * g.scale
        ? this.leadHand
        : hands[0];
    const catchRadius = 64 * g.scale;
    if (distance(g.p[nearest], target) > catchRadius) {
      g.message =
        this.flightTime < 0.3
          ? 'Too early — wait until the hands reach the target.'
          : 'Out of reach — the launch needed more charge or a later catch.';
      return false;
    }

    // A dyno catch starts through the leading hand. Leaving the other arm free
    // preserves the loose counter-swing instead of snapping both arms rigid.
    const caughtHands = [nearest];
    for (const hand of caughtHands) {
      g.hold(hand, target);
      g.p[hand].x = g.p[hand].px = target.x;
      g.p[hand].y = g.p[hand].py = target.y;
    }
    g.catches.push({ x: target.x, y: target.y, age: 0 });
    this.state = 'caught';
    this.flightTime = 0;
    this.charge = 0;
    g.unanchoredStartY = null;
    g.message =
      'One hand caught. Absorb the swing and match the second hand quickly.';
    return true;
  }

  step(dt: number) {
    const g = this.game;
    if (this.state === 'charging') {
      this.charge = Math.min(1, this.charge + dt / 1.15);
      this.coil();
    } else if (this.state === 'propelling') {
      this.propel(dt);
    } else if (this.state === 'airborne') {
      this.flightTime += dt;
      this.reachInFlight(dt);
      if (this.flightTime > 1.55 && !g.failed)
        g.message = 'The dead point has passed — brace for the fall or restart.';
    } else if (this.state === 'caught') {
      this.flightTime += dt;
      if (this.flightTime > 0.72) this.state = 'idle';
    }
  }
}

const controllers = new WeakMap<Climber, JumpController>();

export function jumpFor(game: Climber) {
  if (game.level.testMode !== 'jump') return null;
  let controller = controllers.get(game);
  if (!controller) {
    controller = new JumpController(game);
    controllers.set(game, controller);
  }
  return controller;
}
