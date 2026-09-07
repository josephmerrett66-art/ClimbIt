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
  elapsed = 0;
  ropeLength: number;
  ropeCaught = false;
  message = 'Drag a hand or boot onto the bark. Small moves work best.';
  constructor(
    public level: Level,
    public completionEnabled = true,
  ) {
    const { x, y } = level.playerSpawn;
    const add = (n: string, dx: number, dy: number, r: number, mass = 1) =>
      (this.p[n] = { x: x + dx, y: y + dy, px: x + dx, py: y + dy, r, mass });
    add('neck', 0, -48, 12, 3);
    add('hip', 0, 0, 13, 4);
    add('head', 0, -70, 15, 1.5);
    for (const [side, s] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      add(side + 'Shoulder', s * 17, -44, 8, 2);
      add(side + 'Hip', s * 11, -2, 8, 2.2);
      add(side + 'Elbow', s * 33, -73, 6);
      add(side + 'Hand', s * 30, -106, 8);
      add(side + 'Knee', s * 24, 38, 7, 1.4);
      add(side + 'Foot', s * 30, 78, 9, 1.3);
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
    link('neck', 'hip', 48);
    link('neck', 'head', 22);
    link('head', 'hip', 70);
    link('leftShoulder', 'rightShoulder', 34);
    link('leftHip', 'rightHip', 22);
    link('hip', 'leftHip', 11.2);
    link('hip', 'rightHip', 11.2);
    for (const side of ['left', 'right']) {
      link('neck', side + 'Shoulder');
      link('hip', side + 'Shoulder');
      link('neck', side + 'Hip', 49.2);
      link(side + 'Shoulder', side + 'Hip', 45.3);
      link(side + 'Shoulder', side + 'Elbow', 39);
      link(side + 'Elbow', side + 'Hand', 39);
      link(side + 'Shoulder', side + 'Hand', 77, 1, true);
      link(side + 'Hip', side + 'Knee', 42.1);
      link(side + 'Knee', side + 'Foot', 43);
      link(side + 'Hip', side + 'Foot', 84, 1, true);
      link(side + 'Hip', side + 'Foot', 76, 0.025);
      link(side + 'Shoulder', side + 'Hand', 68, 0.018);
    }
    this.ropeLength = distance(this.p.hip, level.ropeAnchors[0]) + 55;
    const o = level.objectives[0];
    this.cat = { x: o.x, y: o.y, px: o.x, py: o.y, r: 13, mass: 1.5 };
    for (const limb of LIMBS) {
      const g = this.nearest(this.p[limb], 36);
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
    return limb.endsWith('Hand') ? 78 : 86;
  }
  nearest(pos: Point, r = 24) {
    return this.level.gripPoints
      .filter((g) => distance(g, pos) < r)
      .sort((a, b) => distance(a, pos) - distance(b, pos))[0];
  }
  begin(limb: Limb, target: Point) {
    if (this.complete || this.carrying === limb) return false;
    delete this.grips[limb];
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
      cap = Math.min(14, length),
      vx = (dx / length) * cap,
      vy = (dy / length) * cap;
    this.drag.velocity.x = this.drag.velocity.x * 0.55 + vx * 0.45;
    this.drag.velocity.y = this.drag.velocity.y * 0.55 + vy * 0.45;
    this.drag.previousTarget = { ...target };
    this.drag.target = { ...target };
  }
  end(cancel = false) {
    if (!this.drag) return;
    const { limb, velocity } = this.drag,
      p = this.p[limb];
    if (!cancel) {
      if (
        !this.collected &&
        limb.endsWith('Hand') &&
        distance(p, this.cat) < 31
      ) {
        this.carrying = limb;
        this.p[limb].mass += this.cat.mass;
        this.collected = true;
        this.message =
          'Pickles secured! One hand is busy. Bring them safely back to the ground.';
      } else {
        const g = this.nearest(p, 27);
        if (g && distance(g, this.root(limb)) <= this.reach(limb) + 8) {
          this.grips[limb] = g;
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
  }
  releaseAll() {
    this.grips = {};
    this.drag = null;
    this.message = 'Rope catch! Drag a free limb back to the tree.';
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
      if (bend * sign < 2) {
        const correction = sign * Math.max(Math.abs(bend), 2) - bend;
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
      if (bend * sign < 2) {
        const correction = sign * Math.max(Math.abs(bend), 2) - bend;
        elbow.x += nx * correction;
        elbow.y += ny * correction;
        elbow.px += nx * correction;
        elbow.py += ny * correction;
      }
    }
  }
  step(dt = 1 / 60) {
    if (this.complete) return;
    this.elapsed += dt;
    const h = dt * 60;
    const anchors = Object.entries(this.grips) as [Limb, Grip][];
    // Gentle muscle support shifts body weight toward holds, while the joints and gravity remain active.
    if (anchors.length) {
      let tx = 0,
        ty = 0,
        w = 0;
      for (const [limb, g] of anchors) {
        const k = limb.endsWith('Hand') ? 1 : 1.2;
        tx += g.x * k;
        ty += (g.y + (limb.endsWith('Hand') ? 102 : -65)) * k;
        w += k;
      }
      const hip = this.p.hip;
      hip.x += (tx / w - hip.x) * 0.16 * h;
      hip.y += (ty / w - hip.y) * 0.35 * h;
      const neck = this.p.neck;
      neck.x += (hip.x - neck.x) * 0.1 * h;
      neck.y += (hip.y - 48 - neck.y) * 0.3 * h;
    }
    for (const p of Object.values(this.p)) {
      const vx = (p.x - p.px) * 0.982,
        vy = (p.y - p.py) * 0.982;
      p.px = p.x;
      p.py = p.y;
      p.x += vx * h;
      p.y += vy * h + 0.42 * h * h;
    }
    this.ropeCaught = false;
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
          nearbyGrip = this.nearest(target, 38),
          canReachGrip =
            nearbyGrip && distance(nearbyGrip, root) <= this.reach(limb) + 8,
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
        hand.x += (hip.x + 24 - hand.x) * 0.1;
        hand.y += (hip.y - 24 - hand.y) * 0.1;
      }
      for (const [limb, g] of anchors) {
        this.p[limb].x = g.x;
        this.p[limb].y = g.y;
      }
      const hip = this.p.hip,
        a = this.level.ropeAnchors[0],
        d = distance(hip, a);
      if (d > this.ropeLength) {
        hip.x = a.x + ((hip.x - a.x) * this.ropeLength) / d;
        hip.y = a.y + ((hip.y - a.y) * this.ropeLength) / d;
        this.ropeCaught = true;
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
    // Auto-belay feeds out during deliberate descent, but catches unanchored falls.
    if (anchors.length) {
      const d = distance(this.p.hip, this.level.ropeAnchors[0]);
      this.ropeLength += (d + 65 - this.ropeLength) * 0.08;
    }
    if (this.carrying) {
      const hand = this.p[this.carrying];
      this.cat.px = this.cat.x;
      this.cat.py = this.cat.y;
      this.cat.x += (hand.x + 5 - this.cat.x) * 0.35;
      this.cat.y += (hand.y + 12 - this.cat.y) * 0.35;
      const z = this.level.completionTrigger;
      if (
        this.completionEnabled &&
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
