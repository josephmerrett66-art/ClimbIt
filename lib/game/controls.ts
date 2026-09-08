import type { Level, Point } from './level';
import { Climber, LIMBS, distance, type Limb } from './physics';

export const START_ZOOM = 1.6;

export function cameraTarget(
  width: number,
  height: number,
  level: Level,
  focus: Point,
  zoom: number,
  edit: boolean,
) {
  const b = level.cameraBounds;
  const scale =
    (edit ? Math.min : Math.max)(width / b.width, height / b.height) *
    (edit ? 1 : zoom);
  const axis = (
    size: number,
    origin: number,
    extent: number,
    point: number,
    fraction: number,
  ) => {
    const centered = (size - extent * scale) / 2 - origin * scale;
    return edit || extent * scale <= size
      ? centered
      : Math.max(
          size - (origin + extent) * scale,
          Math.min(-origin * scale, size * fraction - point * scale),
        );
  };
  return {
    scale,
    x: axis(width, b.x, b.width, focus.x, 0.5),
    y: axis(height, b.y, b.height, focus.y, 0.62),
  };
}

export function selectLimb(
  game: Climber,
  point: Point,
  scale: number,
  touch: boolean,
  chosen: Limb | null,
) {
  if (chosen && chosen !== game.carrying) return chosen;
  const limb = LIMBS.filter((limb) => limb !== game.carrying).sort(
    (a, b) => distance(game.p[a], point) - distance(game.p[b], point),
  )[0];
  return limb && distance(game.p[limb], point) <= (touch ? 44 : 30) / scale
    ? limb
    : null;
}

export function dragTarget(pointer: Point, offset: Point): Point {
  return { x: pointer.x + offset.x, y: pointer.y + offset.y };
}
