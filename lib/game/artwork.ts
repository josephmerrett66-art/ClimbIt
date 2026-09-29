import type { Level } from './level';

export function artworkFrame(level: Level) {
  return {
    x: level.backgroundFraming?.x ?? 0,
    y: level.backgroundFraming?.y ?? 0,
    width: level.backgroundFraming?.width ?? level.worldWidth,
    height: level.backgroundFraming?.height ?? level.worldHeight,
  };
}

// Scale around the bottom centre so a tree's roots stay on the same ground.
export function resizeArtwork(level: Level, percent: number) {
  if (!Number.isFinite(percent)) return;
  const frame = artworkFrame(level);
  const width = (level.worldWidth * Math.max(10, Math.min(400, percent))) / 100;
  const height = (frame.height * width) / frame.width;
  if (height > 32000) return;
  level.backgroundFraming = {
    x: frame.x + (frame.width - width) / 2,
    y: frame.y + frame.height - height,
    width,
    height,
  };
}
