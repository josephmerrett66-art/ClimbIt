import type { Climber } from './physics';
import type { Point } from './level';

type Pose = Record<string, Point>;
const poses = new WeakMap<Climber, { time: number; points: Pose }>();

// Presentation only: never feed filtered positions back into the solver.
// Contacts remain exact, so the silhouette cannot slide off a grabbed edge.
export function characterPose(g: Climber): Pose {
  const previous = poses.get(g);
  const dt = previous ? g.elapsed - previous.time : 0;
  const reset = !previous || dt < 0 || dt > 0.15;
  const points: Pose = {};
  const alpha = reset ? 1 : 1 - Math.exp(-dt / 0.045);
  for (const [name, target] of Object.entries(g.p)) {
    const old = previous?.points[name] ?? target;
    const exact = name.endsWith('Hand') || name.endsWith('Foot');
    const blend = exact ? 1 : alpha;
    points[name] = {
      x: old.x + (target.x - old.x) * blend,
      y: old.y + (target.y - old.y) * blend,
    };
  }
  // Keep the visible hinge on its anatomical side even during rapid reversals.
  for (const side of ['left', 'right']) {
    for (const hand of [true, false]) {
      const root = points[side + (hand ? 'Shoulder' : 'Hip')];
      const end = points[side + (hand ? 'Hand' : 'Foot')];
      const joint = points[side + (hand ? 'Elbow' : 'Knee')];
      const dx = end.x - root.x,
        dy = end.y - root.y;
      const length = Math.hypot(dx, dy);
      if (length < 0.001) continue;
      const nx = -dy / length,
        ny = dx / length;
      const sign = (side === 'left' ? -1 : 1) * (hand ? 1 : -1);
      const bend = (joint.x - root.x) * nx + (joint.y - root.y) * ny;
      if (bend * sign < 2 * g.scale) {
        const correction = sign * 2 * g.scale - bend;
        joint.x += nx * correction;
        joint.y += ny * correction;
      }
    }
  }
  poses.set(g, { time: g.elapsed, points });
  return points;
}
