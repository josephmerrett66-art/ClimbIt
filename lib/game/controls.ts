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
  if (edit) {
    const scale = Math.max(width / 1200, height / 900) * zoom;
    return {
      scale,
      x: width / 2 - focus.x * scale,
      y: height / 2 - focus.y * scale,
    };
  }
  const jumpPortrait =
    level.testMode === 'jump' && !edit && width <= 600 && height > width;
  const scale =
    (edit ? Math.min : Math.max)(width / b.width, height / b.height) *
    zoom *
    // A width-fitted portrait view made the climber and minimal holds too small
    // to read on phones. Crop a little more of the empty sides instead.
    (jumpPortrait ? 1.18 : 1);
  const axis = (
    size: number,
    origin: number,
    extent: number,
    point: number,
    fraction: number,
  ) => {
    const centered = (size - extent * scale) / 2 - origin * scale;
    return extent * scale <= size
      ? centered
      : Math.max(
          size - (origin + extent) * scale,
          Math.min(-origin * scale, size * fraction - point * scale),
        );
  };
  return {
    scale,
    x: axis(width, b.x, b.width, focus.x, 0.5),
    // Jump Lab needs room below the climber for the launch controls and for
    // reading the next gap. Its sparse test backdrop can safely overscan the
    // world, so keep the body near the middle instead of pinning it low.
    y:
      level.testMode === 'jump' && !edit
        ? height * (jumpPortrait ? 0.48 : 0.55) - focus.y * scale
        : axis(height, b.y, b.height, focus.y, edit ? 0.5 : 0.62),
  };
}

// Two limbs matched on one hold sit at the same point, so distance alone cannot
// separate them and the sort simply returned the first in LIMBS order — the
// right hand could never be picked up. Break that tie by grip age and hand back
// the limb that was already there, which is the one a climber moves next: you
// match hands in order to send the established hand on to the next hold.
const MATCHED = 12;

export function selectLimb(
  game: Climber,
  point: Point,
  scale: number,
  touch: boolean,
  chosen: Limb | null,
) {
  if (chosen && chosen !== game.carrying) return chosen;
  const ranked = LIMBS.filter((limb) => limb !== game.carrying).sort(
    (a, b) => distance(game.p[a], point) - distance(game.p[b], point),
  );
  const nearest = ranked[0];
  if (!nearest) return null;
  const limb =
    ranked
      .filter(
        (candidate) =>
          game.grips[candidate] &&
          distance(game.p[candidate], game.p[nearest]) <= MATCHED * game.scale,
      )
      .sort((a, b) => (game.gripOrder[a] ?? 0) - (game.gripOrder[b] ?? 0))[0] ??
    nearest;
  return distance(game.p[limb], point) <= (touch ? 44 : 30) / scale
    ? limb
    : null;
}

export function dragTarget(pointer: Point, offset: Point): Point {
  return { x: pointer.x + offset.x, y: pointer.y + offset.y };
}
