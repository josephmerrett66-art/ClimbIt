import type { makeClimb } from './campaign';
import type { Grip } from './level';

// Individually set against the 1586 × 992 source painting. These are timber
// contacts, not a resampled route. H = underside hand grip, F = foot brace.
// Sections deliberately retain a few close pairs at turns and remove ladders
// of interchangeable holds between them.
type Contact = [number, number, ('H' | 'F')?];
export const OPAL_CONTACTS: Record<string, Contact[]> = {
  // The starting post teaches moving feet before overextending the arms.
  start: [
    [90, 859],
    [90, 805],
    [90, 752],
    [90, 710],
  ],
  // Commitment 1: leave the post to traverse the chute's lower timber edge.
  lowerChute: [
    [142, 697, 'H'],
    [194, 684, 'H'],
    [250, 670, 'H'],
    [304, 657, 'H'],
    [354, 645, 'H'],
    [385, 637],
  ],
  // A low brace catches a missed entry; establish feet under the platform lip.
  firstRest: [
    [385, 744, 'F'],
    [385, 693, 'F'],
    [385, 655, 'F'],
    [385, 613],
    [385, 563],
    [432, 563, 'H'],
    [482, 563, 'H'],
    [524, 563],
  ],
  middleChute: [
    [524, 652, 'F'],
    [524, 602, 'F'],
    [524, 548],
    [579, 530],
    [635, 511],
    [687, 495],
    [704, 489],
  ],
  // Post stance before the short exposed bridge; separate left/right footholds
  // straddle the actual small landing, so arms can recover at the turn.
  bridgeRest: [
    [704, 601, 'F'],
    [704, 551, 'F'],
    [704, 515, 'F'],
    [704, 475],
    [704, 430],
    [750, 430, 'H'],
    [806, 430],
    [755, 464, 'F'],
    [806, 485, 'F'],
    [806, 405],
  ],
  upperChute: [
    [856, 388],
    [909, 371],
    [950, 357],
  ],
  // Crux: longer hand-only crossing with no invented footholds in mid-air.
  crux: [
    [1008, 357, 'H'],
    [1066, 357, 'H'],
    [1118, 357],
  ],
  // The far post supplies both a recovery catch and a stance below the gantry.
  farRest: [
    [1118, 472, 'F'],
    [1118, 418, 'F'],
    [1118, 445, 'F'],
    [1118, 329],
    [1118, 278],
    [1140, 278],
    [1140, 251],
  ],
  gantry: [
    [1191, 233],
    [1244, 215],
    [1271, 205],
    [1325, 197],
    [1380, 190],
  ],
  // Commitment 2: turn up the exposed tower. Lower crossbeam is a recovery.
  tower: [
    [1380, 350, 'F'],
    [1380, 296, 'F'],
    [1380, 244, 'F'],
    [1380, 153],
    [1380, 99],
    [1380, 47],
  ],
  finish: [
    [1430, 55],
    [1426, 153, 'F'],
    [1473, 153, 'F'],
  ],
};
export function configureOpal(job: ReturnType<typeof makeClimb>) {
  if (job.id !== 'opal-disco') return job;
  job.level.fatigue = true;
  job.level.gripPoints = Object.entries(OPAL_CONTACTS).flatMap(
    ([section, points]) =>
      points.map(
        ([x, y, use], i): Grip => ({
          id: `opal-${section}-${i}`,
          x: (x * 1600) / 1586,
          y: (y * 1000) / 992,
          use: use === 'H' ? 'hand' : use === 'F' ? 'foot' : undefined,
          surface: 'trim',
          angle:
            section === 'lowerChute'
              ? -0.24
              : ['middleChute', 'upperChute', 'gantry'].includes(section)
                ? -0.3
                : 0,
        }),
      ),
  );
  job.level.briefing =
    'Nearby timber edges reveal around your body. Warm limbs are tiring: establish your feet below your hips to rest your arms. Keep a hand and foot planted to secure Nev’s disco ball.';
  return job;
}
