import type { Grip, Point } from './level';
import { distance, type Climber, type Limb } from './physics';

export type JumpState = 'idle' | 'charging' | 'airborne' | 'caught';

export class JumpController {
  state: JumpState = 'idle';
  charge = 0;
  target: Grip | null = null;
  flightTime = 0;
  private chargePose: Record<string, Point> | null = null;

  constructor(public game: Climber) {}

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
    const target = this.game.level.gripPoints
      .filter((hold) => hold.jumpTarget)
      .sort((a, b) => distance(a, point) - distance(b, point))[0];
    if (!target || distance(target, point) > (target.radius ?? 18) + 18) return 'none';
    this.target = target;
    this.game.message = 'Target selected. Secure both hands together and at least one foot, then hold JUMP.';
    return 'selected';
  }

  startCharge() {
    const g = this.game;
    if (this.state === 'airborne') return false;
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
    this.chargePose = Object.fromEntries(
      Object.entries(g.p).map(([name, p]) => [name, { x: p.x, y: p.y }]),
    );
    g.message = 'Coiling… release JUMP to launch.';
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
    if (!this.target || this.charge < 0.08) {
      this.cancelCharge();
      g.message = 'Hold JUMP a little longer to build power.';
      return false;
    }
    const handCenter = {
      x: (g.p.leftHand.x + g.p.rightHand.x) / 2,
      y: (g.p.leftHand.y + g.p.rightHand.y) / 2,
    };
    const dx = this.target.x - handCenter.x;
    const power = 0.35 + this.charge * 0.65;
    const horizontalSpeed = 6.2 + power * 4.5;
    const vx = Math.sign(dx || 1) * horizontalSpeed;
    const frames = Math.max(10, Math.min(34, Math.abs(dx) / horizontalSpeed));
    const gravity = 0.42;
    const rawVy =
      (this.target.y - handCenter.y - (gravity * frames * frames) / 2) /
      frames;
    const vy = Math.max(-15, Math.min(-4, rawVy));
    g.grips = {};
    g.drag = null;
    g.gripFocus = null;
    for (const p of Object.values(g.p)) {
      p.px = p.x - vx;
      p.py = p.y - vy;
    }
    this.state = 'airborne';
    this.flightTime = 0;
    this.chargePose = null;
    g.unanchoredStartY = g.p.hip.y;
    g.message = 'Airborne — tap the selected hold when a hand reaches it!';
    return true;
  }

  tryCatch(point: Point) {
    const g = this.game;
    const target = this.target;
    if (this.state !== 'airborne' || !target) return false;
    if (distance(point, target) > (target.radius ?? 18) + 24) return false;
    const hands = (['leftHand', 'rightHand'] as Limb[]).sort(
      (a, b) => distance(g.p[a], target) - distance(g.p[b], target),
    );
    const hand = hands[0];
    const catchRadius = 61 * g.scale;
    if (distance(g.p[hand], target) > catchRadius) {
      g.message = 'Too early — tap when your hand is close to the target.';
      return false;
    }
    g.grips[hand] = target;
    g.p[hand].x = g.p[hand].px = target.x;
    g.p[hand].y = g.p[hand].py = target.y;
    g.catches.push({ x: target.x, y: target.y, age: 0 });
    this.state = 'caught';
    this.flightTime = 0;
    this.charge = 0;
    g.unanchoredStartY = null;
    g.message = 'Caught! Stabilise, bring the other hand across, then choose the next target.';
    return true;
  }

  step(dt: number) {
    const g = this.game;
    if (this.state === 'charging' && this.target && this.chargePose) {
      this.charge = Math.min(1, this.charge + dt / 1.05);
      const dx = this.target.x - g.p.hip.x;
      const dy = this.target.y - g.p.hip.y;
      const length = Math.hypot(dx, dy) || 1;
      const ease = 1 - Math.pow(1 - this.charge, 2);
      const offset = { x: (-dx / length) * 22 * ease, y: 28 * ease };
      for (const name of ['hip', 'leftHip', 'rightHip', 'neck', 'leftShoulder', 'rightShoulder']) {
        const p = g.p[name];
        const base = this.chargePose[name];
        const desiredX = base.x + offset.x;
        const desiredY = base.y + offset.y;
        const sx = (desiredX - p.x) * 0.34;
        const sy = (desiredY - p.y) * 0.34;
        p.x += sx;
        p.y += sy;
        p.px += sx;
        p.py += sy;
      }
    } else if (this.state === 'airborne') {
      this.flightTime += dt;
      if (this.flightTime > 1.8 && !g.failed)
        g.message = 'Missed the catch — brace for the fall or restart.';
    } else if (this.state === 'caught') {
      this.flightTime += dt;
      if (this.flightTime > 0.45) this.state = 'idle';
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
