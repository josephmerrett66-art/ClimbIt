import type { Level, Point, Grip } from './level';
export type Particle = Point & {
  px: number;
  py: number;
  r: number;
  mass: number;
};
export const LIMBS = [
  'leftHand',
  'rightHand',
  'leftFoot',
  'rightFoot',
] as const;
export type Limb = (typeof LIMBS)[number];
type Bone = {
  a: string;
  b: string;
  length: number;
  stiffness: number;
  max?: boolean;
};
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export class Climber {
  p: Record<string, Particle> = {};
  bones: Bone[] = [];
  grips: Partial<Record<Limb, Grip>> = {};
  drag: {
    limb: Limb;
    target: Point;
    previousTarget: Point;
    velocity: Point;
  } | null = null;
  carrying: Limb | null = null;
  cat: Particle;
  collected = false;
  complete = false;
  failed = false;
  elapsed = 0;
  scale: number;
  unanchoredStartY: number | null = null;
  gripFocus: Grip | null = null;
  catches: { x: number; y: number; age: number }[] = [];
  message = 'Drag a hand or boot onto the bark. Small moves work best.';
  constructor(
    public level: Level,
    public completionEnabled = true,
  ) {
    this.scale = level.playerScale ?? 1;
    const { x, y } = level.playerSpawn,
      s = this.scale;
    const add = (n: string, dx: number, dy: number, r: number, mass = 1) =>
      (this.p[n] = {
        x: x + dx * s,
        y: y + dy * s,
        px: x + dx * s,
        py: y + dy * s,
        r: r * s,
        mass,
      });
    add('neck', 0, -48, 12, 3);
    add('hip', 0, 0, 13, 4);
    add('head', 0, -70, 15, 1.5);
    for (const [side, sideSign] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      add(side + 'Shoulder', sideSign * 17, -44, 8, 2);
      add(side + 'Hip', sideSign * 11, -2, 8, 2.2);
      add(side + 'Elbow', sideSign * 33, -73, 6);
      add(side + 'Hand', sideSign * 30, -106, 8);
      add(side + 'Knee', sideSign * 24, 38, 7, 1.4);
      add(side + 'Foot', sideSign * 30, 78, 9, 1.3);
    }
    const link = (
      a: string,
      b: string,
      length?: number,
      stiffness = 1,
      max = false,
    ) =>
      this.bones.push({
        a,
        b,
        length: length ?? distance(this.p[a], this.p[b]),
        stiffness,
        max,
      });
    link('neck', 'hip', 48 * s);
    link('neck', 'head', 22 * s);
    link('head', 'hip', 70 * s);
    link('leftShoulder', 'rightShoulder', 34 * s);
    link('leftHip', 'rightHip', 22 * s);
    link('hip', 'leftHip', 11.2 * s);
    link('hip', 'rightHip', 11.2 * s);
    for (const side of ['left', 'right']) {
      link('neck', side + 'Shoulder');
      link('hip', side + 'Shoulder');
      link('neck', side + 'Hip', 49.2 * s);
      link(side + 'Shoulder', side + 'Hip', 45.3 * s);
      link(side + 'Shoulder', side + 'Elbow', 39 * s);
      link(side + 'Elbow', side + 'Hand', 39 * s);
      link(side + 'Shoulder', side + 'Hand', 77 * s, 1, true);
      link(side + 'Hip', side + 'Knee', 42.1 * s);
      link(side + 'Knee', side + 'Foot', 43 * s);
      link(side + 'Hip', side + 'Foot', 84 * s, 1, true);
      link(side + 'Hip', side + 'Foot', 76 * s, 0.025);
      link(side + 'Shoulder', side + 'Hand', 68 * s, 0.018);
    }
    const o = level.objectives[0];
    this.cat = { x: o.x, y: o.y, px: o.x, py: o.y, r: 13, mass: 1.5 };
    for (const limb of LIMBS) {
      const g = this.nearest(this.p[limb], Math.max(22, 36 * s));
      if (g) this.grips[limb] = g;
    }
  }
  root(limb: Limb) {
    return this.p[
      limb.endsWith('Hand')
        ? limb.replace('Hand', 'Shoulder')
        : limb.replace('Foot', 'Hip')
    ];
  }
  reach(limb: Limb) {
    return (limb.endsWith('Hand') ? 78 : 86) * this.scale;
  }
  nearest(pos: Point, r = 24) {
    return this.level.gripPoints
      .filter((g) => distance(g, pos) < r)
      .sort((a, b) => distance(a, pos) - distance(b, pos))[0];
  }
  begin(limb: Limb, target: Point) {
    if (this.complete || this.failed || this.carrying === limb) return false;
    delete this.grips[limb];
    this.gripFocus = null;
    this.drag = {
      limb,
      target: { ...target },
      previousTarget: { ...target },
      velocity: { x: 0, y: 0 },
    };
    return true;
  }
  move(target: Point) {
    if (!this.drag) return;
    const dx = target.x - this.drag.previousTarget.x,
      dy = target.y - this.drag.previousTarget.y,
      length = Math.hypot(dx, dy) || 1,
      cap = Math.min(14 * this.scale, length),
      vx = (dx / length) * cap,
      vy = (dy / length) * cap;
    this.drag.velocity.x = this.drag.velocity.x * 0.55 + vx * 0.45;
    this.drag.velocity.y = this.drag.velocity.y * 0.55 + vy * 0.45;
    this.drag.previousTarget = { ...target };
    this.drag.target = { ...target };
  }
  reachableHold(limb: Limb, pos: Point, radius: number) {
    return this.level.gripPoints
      .filter(
        (g) =>
          distance(g, pos) < radius &&
          distance(g, this.root(limb)) <= this.reach(limb) + 8 * this.scale,
      )
      .sort((a, b) => distance(a, pos) - distance(b, pos))[0];
  }
  grabPreview() {
    if (!this.drag) return undefined;
    const { limb } = this.drag;
    const focus = this.gripFocus;
    if (
      focus &&
      distance(focus, this.p[limb]) < 27 * this.scale &&
      distance(focus, this.root(limb)) <= this.reach(limb) + 8 * this.scale
    )
      return focus;
    return this.reachableHold(limb, this.p[limb], 27 * this.scale);
  }
  end(cancel = false) {
    if (!this.drag) return;
    const { limb, velocity } = this.drag,
      p = this.p[limb];
    if (!cancel) {
      if (
        !this.collected &&
        limb.endsWith('Hand') &&
        distance(p, this.cat) < 31 * this.scale
      ) {
        this.collected = true;
        if (this.level.objectives[0].type === 'repair') {
          this.complete = true;
          this.message =
            this.level.objectives[0].kind === 'bulb'
              ? 'New bulb fitted. Tower light restored.'
              : 'Cross straightened. That should hold.';
        } else {
          this.carrying = limb;
          this.p[limb].mass += this.cat.mass;
          this.message =
            'Pickles secured! One hand is busy. Bring them safely back to the ground.';
        }
      } else {
        const g = this.grabPreview();
        if (
          g &&
          distance(g, this.root(limb)) <= this.reach(limb) + 8 * this.scale
        ) {
          this.grips[limb] = g;
          p.x = p.px = g.x;
          p.y = p.py = g.y;
          this.catches.push({ x: g.x, y: g.y, age: 0 });
          this.message = 'Good grip. Move another limb to shift your weight.';
        } else {
          // Preserve a small, capped flick without storing the full drag
          // correction as an explosive Verlet impulse.
          p.px = p.x - velocity.x * 0.38;
          p.py = p.y - velocity.y * 0.38;
          this.message = 'No grip caught. Aim for the trunk or a solid branch.';
        }
      }
    }
    this.drag = null;
    this.gripFocus = null;
  }
  releaseAll() {
    this.grips = {};
    this.drag = null;
    this.gripFocus = null;
    this.message = 'No holds. Grab something before you hit the ground!';
  }
  constrainKnees() {
    for (const [side, sign] of [
      ['left', 1],
      ['right', -1],
    ] as const) {
      const hip = this.p[side + 'Hip'],
        knee = this.p[side + 'Knee'],
        foot = this.p[side + 'Foot'];
      const dx = foot.x - hip.x,
        dy = foot.y - hip.y;
      const length = Math.hypot(dx, dy);
      if (length < 0.001) continue;
      // Each knee is a one-way hinge. The signed bend follows the limb as
      // the whole body rotates, instead of flipping to the other IK solution.
      const nx = -dy / length,
        ny = dx / length;
      const bend = (knee.x - hip.x) * nx + (knee.y - hip.y) * ny;
      if (bend * sign < 2 * this.scale) {
        const correction =
          sign * Math.max(Math.abs(bend), 2 * this.scale) - bend;
        knee.x += nx * correction;
        knee.y += ny * correction;
        // Moving the constraint must not inject a kick into Verlet velocity.
        knee.px += nx * correction;
        knee.py += ny * correction;
      }
    }
  }
  constrainElbows() {
    for (const [side, sign] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      const shoulder = this.p[side + 'Shoulder'],
        elbow = this.p[side + 'Elbow'],
        hand = this.p[side + 'Hand'];
      const dx = hand.x - shoulder.x,
        dy = hand.y - shoulder.y;
      const length = Math.hypot(dx, dy);
      if (length < 0.001) continue;
      const nx = -dy / length,
        ny = dx / length;
      const bend = (elbow.x - shoulder.x) * nx + (elbow.y - shoulder.y) * ny;
      if (bend * sign < 2 * this.scale) {
        const correction =
          sign * Math.max(Math.abs(bend), 2 * this.scale) - bend;
        elbow.x += nx * correction;
        elbow.y += ny * correction;
        elbow.px += nx * correction;
        elbow.py += ny * correction;
      }
    }
  }
  step(dt = 1 / 60) {
    if (this.complete || this.failed) return;
    this.elapsed += dt;
    this.catches = this.catches.filter((event) => (event.age += dt) < 0.38);
    const h = dt * 60;
    const anchors = Object.entries(this.grips) as [Limb, Grip][];
    if (this.drag) {
      const { limb, target } = this.drag;
      // A little hysteresis keeps adjacent holds from flickering under the cursor.
      if (
        !this.gripFocus ||
        distance(this.gripFocus, target) > 43 * this.scale ||
        distance(this.gripFocus, this.root(limb)) >
          this.reach(limb) + 8 * this.scale
      )
        this.gripFocus =
          this.reachableHold(limb, target, 38 * this.scale) ?? null;
    }
    // Gentle muscle support shifts body weight toward holds, while the joints and gravity remain active.
    if (anchors.length) {
      let tx = 0,
        ty = 0,
        w = 0;
      for (const [limb, g] of anchors) {
        const k = limb.endsWith('Hand') ? 1 : 1.2;
        tx += g.x * k;
        ty += (g.y + (limb.endsWith('Hand') ? 102 : -65) * this.scale) * k;
        w += k;
      }
      const hip = this.p.hip;
      const feet = anchors.filter(([limb]) => limb.endsWith('Foot')).length;
      const support = feet ? 1 : anchors.length === 1 ? 0.3 : 0.65;
      const dx = (tx / w - hip.x) * 0.16 * support * h;
      const dy = (ty / w - hip.y) * 0.35 * support * h;
      hip.x += dx;
      hip.y += dy;
      // Muscle corrections should shift weight without storing an extra launch impulse.
      hip.px += dx * 0.15;
      hip.py += dy * 0.15;
      const neck = this.p.neck;
      const lean = Math.max(
        -16 * this.scale,
        Math.min(16 * this.scale, (tx / w - hip.x) * 0.25),
      );
      const nx = (hip.x + lean - neck.x) * 0.1 * support * h;
      const ny = (hip.y - 48 * this.scale - neck.y) * 0.3 * support * h;
      neck.x += nx;
      neck.y += ny;
      neck.px += nx * 0.15;
      neck.py += ny * 0.15;
    }
    for (const p of Object.values(this.p)) {
      const vx = (p.x - p.px) * 0.982,
        vy = (p.y - p.py) * 0.982;
      p.px = p.x;
      p.py = p.y;
      p.x += vx * h;
      p.y += vy * h + 0.42 * h * h;
    }
    for (let pass = 0; pass < 18; pass++) {
      for (const b of this.bones) {
        const a = this.p[b.a],
          c = this.p[b.b],
          d = distance(a, c) || 0.001;
        if (b.max && d < b.length) continue;
        const error = ((d - b.length) / d) * b.stiffness,
          wa = 1 / a.mass,
          wb = 1 / c.mass;
        const dx = (c.x - a.x) * error,
          dy = (c.y - a.y) * error;
        a.x += (dx * wa) / (wa + wb);
        a.y += (dy * wa) / (wa + wb);
        c.x -= (dx * wb) / (wa + wb);
        c.y -= (dy * wb) / (wa + wb);
      }
      this.constrainKnees();
      this.constrainElbows();
      if (this.drag) {
        const { limb, target } = this.drag,
          root = this.root(limb),
          nearbyGrip = this.gripFocus,
          canReachGrip =
            nearbyGrip &&
            distance(nearbyGrip, root) <= this.reach(limb) + 8 * this.scale,
          guidedTarget = canReachGrip
            ? {
                x: target.x + (nearbyGrip.x - target.x) * 0.72,
                y: target.y + (nearbyGrip.y - target.y) * 0.72,
              }
            : target,
          d = distance(root, guidedTarget) || 1,
          k = Math.min(1, this.reach(limb) / d);
        const p = this.p[limb];
        p.x += (root.x + (guidedTarget.x - root.x) * k - p.x) * 0.32;
        p.y += (root.y + (guidedTarget.y - root.y) * k - p.y) * 0.32;
      }
      if (this.carrying) {
        const hand = this.p[this.carrying],
          hip = this.p.hip;
        hand.x += (hip.x + 24 * this.scale - hand.x) * 0.1;
        hand.y += (hip.y - 24 * this.scale - hand.y) * 0.1;
      }
      for (const [limb, g] of anchors) {
        this.p[limb].x = g.x;
        this.p[limb].y = g.y;
      }
      for (const p of Object.values(this.p)) {
        this.collide(p);
        p.x = Math.max(p.r, Math.min(this.level.worldWidth - p.r, p.x));
        p.y = Math.max(p.r, Math.min(this.level.worldHeight - p.r, p.y));
      }
    }
    this.constrainKnees();
    this.constrainElbows();
    if (this.drag) {
      const p = this.p[this.drag.limb];
      p.px += (p.x - p.px) * 0.7;
      p.py += (p.y - p.py) * 0.7;
    }
    if (anchors.length) {
      this.unanchoredStartY = null;
    } else {
      if (this.unanchoredStartY === null) this.unanchoredStartY = this.p.hip.y;
      const groundY = this.level.colliders
          .filter(
            (c) =>
              c.type === 'edge' &&
              Math.abs(c.y2 - c.y) < 2 &&
              Math.max(c.y, c.y2) > this.level.worldHeight * 0.75,
          )
          .reduce(
            (lowest, c) => Math.min(lowest, Math.min(c.y, c.y2)),
            this.level.worldHeight,
          ),
        hitGround = Object.values(this.p).some(
          (p) => p.y + p.r >= groundY - 1.5,
        ),
        fallDistance = this.p.hip.y - this.unanchoredStartY;
      if (hitGround && fallDistance > 55 * this.scale) {
        this.failed = true;
        this.drag = null;
        this.message = 'You fell. The job is over.';
      }
    }
    if (this.carrying) {
      const hand = this.p[this.carrying];
      this.cat.px = this.cat.x;
      this.cat.py = this.cat.y;
      this.cat.x += (hand.x + 5 * this.scale - this.cat.x) * 0.35;
      this.cat.y += (hand.y + 12 * this.scale - this.cat.y) * 0.35;
      const z = this.level.completionTrigger;
      if (
        this.completionEnabled &&
        !this.failed &&
        (this.unanchoredStartY === null ||
          this.p.hip.y - this.unanchoredStartY < 55 * this.scale) &&
        this.p.hip.x > z.x &&
        this.p.hip.x < z.x + z.width &&
        this.p.hip.y > z.y &&
        this.p.hip.y < z.y + z.height
      ) {
        this.complete = true;
        this.message = 'Pickles is home. Job complete!';
      }
    }
  }
  collide(p: Particle) {
    for (const c of this.level.colliders) {
      if (c.type === 'edge') {
        const dx = c.x2 - c.x,
          dy = c.y2 - c.y,
          len = dx * dx + dy * dy;
        if (!len) continue;
        const t = Math.max(
            0,
            Math.min(1, ((p.x - c.x) * dx + (p.y - c.y) * dy) / len),
          ),
          qx = c.x + t * dx,
          qy = c.y + t * dy;
        let nx = p.x - qx,
          ny = p.y - qy,
          d = Math.hypot(nx, ny);
        if (d < p.r) {
          if (d < 0.001) {
            nx = 0;
            ny = -1;
            d = 1;
          }
          p.x = qx + (nx / d) * p.r;
          p.y = qy + (ny / d) * p.r;
          p.px += (p.x - p.px) * 0.12;
        }
      } else {
        const x = Math.min(c.x, c.x2),
          y = Math.min(c.y, c.y2),
          r = Math.max(c.x, c.x2),
          b = Math.max(c.y, c.y2);
        if (p.x > x - p.r && p.x < r + p.r && p.y > y - p.r && p.y < b + p.r) {
          const ds = [
            p.x - x + p.r,
            r + p.r - p.x,
            p.y - y + p.r,
            b + p.r - p.y,
          ];
          const i = ds.indexOf(Math.min(...ds));
          if (i === 0) p.x = x - p.r;
          if (i === 1) p.x = r + p.r;
          if (i === 2) p.y = y - p.r;
          if (i === 3) p.y = b + p.r;
        }
      }
    }
  }
}
