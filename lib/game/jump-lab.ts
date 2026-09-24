import { contactCurves } from './climbing';
import type { Collider, Grip, Level } from './level';

// The lab is no longer a row of targets at equal spacing. It is one authored
// problem that asks a different question of the jump in each section, so that
// landing a dyno is never the whole of a move.
//
// The wall has exactly two kinds of hand hold, and the whole route reads off
// the difference:
//
//   PADS are wide, lit, and the only holds that take both hands. Matching both
//   hands is what a launch requires, so a pad is the only place a jump can
//   begin, and the only place one can end.
//   NOTCHES take a single limb. They are the connective tissue — every other
//   hand hold on the wall is one — and they can never launch anything.
//
// That rule is what stops the level from collapsing. Ordinary hand holds are
// matchable by default in this engine, and a matchable hold beside a foothold
// is a launch pad whether it was meant to be one or not: before the notches
// went in, a full-charge dyno from the starting ledge cleared 387px and landed
// on the roof-crawl beacon, skipping the first two sections outright.
//
// Every span below was measured against the take-off maths in `jump.ts` rather
// than placed by eye. Horizontal speed is `10.5 * scale` per frame, flight is
// clamped to 9–30 frames, and the catch radius is `64 * scale`. The clamp is
// not the range limit it looks like — past 30 frames the body keeps flying and
// falling, so a long, flat jump can still be caught on the way down, which is
// exactly how that 387px skip worked. Nine pads, six intended jumps, and no
// unintended one: that is a property of the coordinates, and `jump-lab.test.ts`
// re-derives it rather than trusting this comment.
//
// The rest of the sections lean on rules that belong to the climber, not the
// jump:
//   - a launch needs one boot planted, so a pad with no foothold in leg range
//     cannot launch however good the hold is;
//   - a catch lands ONE hand with both feet free, so recovery is its own move;
//   - a carried object occupies a hand permanently, so nothing can be jumped
//     once the objective is in hand.

const SCALE = 0.9;

// A beacon. Wide enough to match both hands on, always lit, and the only kind
// of hold the jump will accept as a landing target.
const pad = (id: string, x: number, y: number, color: string): Grip => ({
  id,
  x,
  y,
  use: 'hand',
  color,
  jumpTarget: true,
  radius: 18,
});

// One limb fits. Everything that is not a beacon is one of these.
const notch = (id: string, x: number, y: number): Grip => ({
  id,
  x,
  y,
  use: 'hand',
  singleLimb: true,
  color: '#9aa4ad',
  radius: 10,
});

const foot = (id: string, x: number, y: number): Grip => ({
  id,
  x,
  y,
  use: 'foot',
  color: '#6f7a84',
  radius: 12,
});

// Hand holds every ~33px, which is the spacing the campaign's painted routes
// use. The anatomical reach is more than twice that, but a shoulder hangs below
// the hand it is gripping, so a move that looks short on paper is a long pull.
const ladder = (prefix: string, points: number[][], step = 33): Grip[] => {
  const out: Grip[] = [];
  points.forEach(([x, y], i) => {
    if (i) {
      const [ax, ay] = points[i - 1];
      const n = Math.ceil(Math.hypot(x - ax, y - ay) / step);
      for (let j = 1; j < n; j++)
        out.push(
          notch(
            `${prefix}-${out.length}`,
            ax + ((x - ax) * j) / n,
            ay + ((y - ay) * j) / n,
          ),
        );
    }
    out.push(notch(`${prefix}-${out.length}`, x, y));
  });
  return out;
};

const footRail = (prefix: string, points: number[][], step = 38): Grip[] =>
  ladder(prefix, points, step).map((g, i) =>
    foot(`${prefix}-foot-${i}`, g.x, g.y),
  );

// Authored holds are placed first and always win. Filler from `ladder` runs
// through the named lines and naturally lands on top of the pads it connects,
// and a stray notch on a pad would quietly break the level: the click would
// take the notch and the jump would refuse to load. Holds of different kinds
// may share a spot, because `canUse` already keeps boots off hand holds.
const merge = (anchors: Grip[], filler: Grip[]): Grip[] => {
  const kept = [...anchors];
  for (const g of filler) {
    const clash = kept.some(
      (other) =>
        other.use === g.use && Math.hypot(other.x - g.x, other.y - g.y) < 12,
    );
    if (!clash) kept.push(g);
  }
  return kept;
};

// ---------------------------------------------------------------------------
// Section 1 — The Feint. Two notches to start on, so the ground is the one
// place on the wall a jump can never begin. The line straight overhead is the
// obvious continuation and it ends at a notch with nothing above it; the way on
// is a traverse right and slightly downhill, away from every beacon in sight.
//
// Section 2 — The Roof Crawl. 250px across and barely uphill, under a slab set
// 45px above the launch. A full-charge dyno peaks 56px up and hits it; the jump
// only fits through at roughly half to three-quarter charge. It is the one
// place in the game where the charge meter decides whether a jump lands rather
// than only how far it goes.
//
// Section 3 — The Blind Catch. 230 across and 215 up, near the ceiling of what
// the mechanic can do, onto a beacon with no foothold anywhere near it. The
// jump is the easy part. The catch leaves one hand on the pad and both boots
// swinging over nothing, and the only way off is 175px of hand-only climbing to
// the next pad — the one kind of span the campaign treats as genuinely hard,
// because contact-scaled reach cannot be bought back without a foot to plant.
//
// Section 4 — The Fork. Two beacons, both matchable, both in range. The left is
// a long flat 300px dyno back across the void; the right is a short steep one.
// The left one's footholds sit 205px beneath it, far outside any leg reach, so
// the pad cannot launch again — and a pad that cannot launch, in a place
// nothing else connects to, is the end of the run. The boot rail under it is
// drawn like every other and is plainly too far down: the fork is a question
// about reading footholds, asked at the one moment the answer is expensive.
//
// Section 5 — The Belay Ledge. The tool sits across a 180px gap that a dyno
// crosses in one move and a line of notches crosses in six. Going out the dyno
// is strictly better and the move target pays for it. Coming back the dyno is
// gone: the tool fills a hand, that hand can never take a hold again, and one
// hand cannot match a pad. The notches are the only way home, and they were in
// plain sight the whole time.
const anchors: Grip[] = [
  notch('start-left', 123, 1235),
  notch('start-right', 177, 1235),
  foot('start-foot-l', 124, 1400),
  foot('start-foot-r', 177, 1400),
  notch('feint-top', 156, 1036),

  pad('pad-roof', 287, 1140, '#42ddff'),
  foot('pad-roof-f1', 265, 1232),
  foot('pad-roof-f2', 316, 1230),
  pad('land-roof', 537, 1120, '#42ddff'),
  foot('land-roof-f1', 515, 1212),
  foot('land-roof-f2', 565, 1210),

  // No boot rail. That is the section, not an oversight.
  pad('land-high', 767, 905, '#ff63b7'),

  pad('pad-fork', 865, 760, '#83f05d'),
  foot('pad-fork-f1', 842, 852),
  foot('pad-fork-f2', 888, 850),
  pad('trap-beacon', 565, 735, '#ff8a3d'),
  foot('trap-f1', 548, 940),
  foot('trap-f2', 598, 938),
  pad('land-right', 965, 625, '#83f05d'),
  foot('land-right-f1', 943, 717),
  foot('land-right-f2', 978, 715),

  pad('land-summit', 700, 490, '#b68cff'),
  foot('land-summit-f1', 678, 582),
  foot('land-summit-f2', 726, 580),
  pad('pad-launch', 712, 312, '#ff5656'),
  foot('pad-launch-f1', 694, 427),
  foot('pad-launch-f2', 742, 425),
  pad('land-ledge', 892, 342, '#ff5656'),
  foot('land-ledge-f1', 872, 434),
  foot('land-ledge-f2', 920, 432),

  notch('return-1', 854, 356),
  notch('return-2', 816, 366),
  notch('return-3', 778, 362),
  notch('return-4', 742, 346),
  notch('return-5', 726, 330),
];

const filler: Grip[] = [
  ...ladder('approach', [
    [150, 1200],
    [163, 1135],
  ]),
  ...ladder('feint', [
    [163, 1135],
    [158, 1060],
  ]),
  ...ladder('traverse', [
    [163, 1135],
    [262, 1140],
  ]),
  // The hand-only exit from the blind catch.
  ...ladder('high-exit', [
    [767, 905],
    [865, 760],
  ]),
  ...ladder('summit', [
    [700, 490],
    [707, 345],
  ]),
  ...footRail('approach', [
    [124, 1400],
    [138, 1300],
    [132, 1240],
  ]),
  ...footRail('approach-r', [
    [177, 1400],
    [186, 1300],
    [180, 1240],
  ]),
  ...footRail('feint', [
    [150, 1180],
    [186, 1160],
  ]),
  ...footRail('traverse', [
    [205, 1234],
    [316, 1230],
  ]),
  ...footRail('summit', [
    [682, 585],
    [690, 445],
  ]),
  ...footRail('summit-r', [
    [726, 583],
    [734, 443],
  ]),
  // The return traverse is made with both feet planted and one hand moving at a
  // time, so its boot rail is continuous where the hand line is not.
  ...footRail(
    'return',
    [
      [876, 444],
      [838, 456],
      [800, 464],
      [762, 458],
      [726, 442],
      [700, 424],
    ],
    36,
  ),
];

const colliders: Collider[] = [
  {
    id: 'ground',
    type: 'edge',
    role: 'ground',
    x: 0,
    y: 1455,
    x2: 1000,
    y2: 1455,
  },
  // The roof crawl slab. Measured: the full-charge arc rises above this line
  // between x=382 and x=504, so the slab is exactly the span that has to be
  // flown under rather than over.
  { id: 'roof-slab', type: 'edge', x: 370, y: 1095, x2: 505, y2: 1095 },
];

const curves = contactCurves(0.88, 0.92);

export const jumpLabLevel: Level = {
  version: 1,
  id: 'jump-lab',
  name: 'The Gantry',
  backgroundImage: '',
  worldWidth: 1000,
  worldHeight: 1500,
  playerScale: SCALE,
  challenge: true,
  fatigue: true,
  testMode: 'jump',
  // Reach shrinks as limbs come off. It is what gives the hand-only exit from
  // the blind catch its bite, and what makes planting a boot worth a move.
  contactReach: curves.reach,
  contactForce: curves.force,
  // Wide enough to read the next two moves and judge the fork's boot rail,
  // tight enough that the wall has to be worked out rather than taken in at a
  // glance. Beacons ignore this and stay lit — they are the lab's chalk marks.
  discoveryRadius: 300,
  // Walking the objective gap on the notches instead of jumping it costs about
  // eight moves, which is most of the bonus. That is the trade the section is for.
  moveTarget: 74,
  briefing:
    'Six beacons, one tool, no rope. Wide pads take both hands and are the only holds a jump can start or finish on; narrow notches take one limb and will never launch. Tap a beacon to commit, hold JUMP to load, and tap it again as the hands arrive. R restarts.',
  playerSpawn: { x: 150, y: 1330 },
  gripPoints: merge(anchors, filler),
  colliders,
  objectives: [
    {
      id: 'lab-tool',
      type: 'carry',
      kind: 'gear',
      name: 'Torque wrench',
      x: 950,
      y: 300,
      successMessage: 'Wrench back on the belay ledge. Lab run complete.',
    },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1000, height: 1500 },
  // The hip hangs roughly 85px under the last pad, so the zone is set where a
  // climber hanging off `pad-launch` actually is, not where the hold is.
  completionTrigger: { x: 665, y: 355, width: 95, height: 90 },
  pay: 0,
};

export const jumpLabJob = {
  id: jumpLabLevel.id,
  name: 'TEST AREA: The Gantry',
  client: 'Climbing gym · Mechanics lab',
  pay: 0,
  href: '/jump-lab',
  image: '/assets/jump-lab.svg',
  level: jumpLabLevel,
};
