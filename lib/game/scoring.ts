import type { Level } from './level';

// Efficiency pay. A move is a grip caught, so shuffling a limb back and forth
// to recover costs money even though it costs no stamina. This is what stops
// "rest to full at every hold" from being the strictly best way to play,
// without adding an artificial timer or draining rests.
//
// The bonus slides rather than passing a threshold: there is no cliff to fall
// off and no move count that feels unfair, it simply pays less the longer you
// take. Only levels that set `moveTarget` score at all.
export const BONUS_PER_MOVE = 2;
export const BONUS_CAP = 80;

export function efficiencyBonus(level: Level, moves: number) {
  if (!level.moveTarget) return 0;
  const saved = Math.max(0, level.moveTarget - moves);
  return Math.min(BONUS_CAP, saved * BONUS_PER_MOVE);
}
