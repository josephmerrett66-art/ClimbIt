import type { Level } from './level';

// Scene-specific sequences using existing painted contacts. Narrow notches
// cannot be matched; wide landings retain room to swap hands and rest.
// Coordinates are source-image pixels except the pub's rendered coordinates.
const MOMENTS: Record<
  string,
  { hands: number[][]; feet: number[][]; recovery?: number[]; hint: string }
> = {
  'opal-disco': {
    hands: [
      [194, 684],
      [250, 670],
      [1008, 357],
      [1066, 357],
    ],
    feet: [
      [704, 515],
      [755, 464],
      [806, 485],
    ],
    recovery: [385, 744],
    hint: 'The chute notches take one hand each. Set your feet on separate bridge braces before the upper traverse.',
  },
  'big-prawn-thong': {
    hands: [
      [285.5, 599.5],
      [336, 594],
    ],
    feet: [
      [883, 451],
      [883, 489],
    ],
    hint: 'Alternate hands across the kiosk trim, then establish separate feet on the tail post before turning onto the sculpture.',
  },
  'surf-croc': {
    hands: [
      [603.9, 401],
      [647.8, 401],
      [779.5, 401],
      [823.5, 401],
    ],
    feet: [
      [707, 493],
      [707, 531],
    ],
    hint: 'The upper eave has narrow hand notches. Use separate boot contacts at the middle post to recover before leaving it.',
  },
  'drive-in-trolley': {
    hands: [
      [742.4, 435],
      [784.9, 435],
      [827.3, 435],
    ],
    feet: [
      [997, 454],
      [997, 492],
    ],
    hint: 'Keep alternating hands across the central steel frame. The next post needs two separate boot placements to give your arms a rest.',
  },
  'summer-santa': {
    hands: [
      [995.8, 530],
      [952.6, 530],
      [909.5, 530],
    ],
    feet: [
      [737, 471],
      [737, 509],
    ],
    hint: 'The returning balcony edge takes one hand per notch. Reorganise your feet at the gable before changing direction again.',
  },
  'signal-esky': {
    hands: [
      [1365 + 128 / 3, 390],
      [1365 + 256 / 3, 390],
    ],
    feet: [
      [1365, 482],
      [1365, 520],
    ],
    hint: 'Before crossing the signal tower, set both boots separately on the upright. The exposed crossbeam needs alternating hands.',
  },
  'golden-bin-chicken': {
    hands: [
      [882.4, 594],
      [838.7, 594],
      [794.9, 594],
    ],
    feet: [
      [650, 434],
      [650, 472],
    ],
    hint: 'Plan your leading hand before reversing along the narrow cornice. Split your feet on the next post before the upper traverse.',
  },
  'prize-pumpkin': {
    hands: [
      [1150.8, 208],
      [1196.5, 208],
      [1242.3, 208],
    ],
    feet: [
      [1288, 300],
      [1288, 338],
    ],
    hint: 'Save a fresh hand for the booth transfer: its small edge contacts cannot be shared. Reposition both boots before reaching for the pumpkin.',
  },
  'pub-keys': {
    hands: [
      [456, 610],
      [502, 610],
      [652, 450],
      [606, 450],
    ],
    feet: [
      [590, 702],
      [590, 740],
    ],
    hint: 'The gutter notches take one hand each. Split your feet at the verandah post, then choose your leading hand for the reverse cornice.',
  },
};
export function applyRouteMoments(level: Level) {
  const plan = MOMENTS[level.id];
  if (!plan) return level;
  const point = (p: number[]) =>
    level.id === 'pub-keys'
      ? { x: p[0], y: p[1] }
      : { x: (p[0] * 1600) / 1586, y: (p[1] * 1000) / 992 };
  const handContacts: Level['gripPoints'] = [];
  for (const [kind, positions] of [
    ['hand', plan.hands],
    ['foot', plan.feet],
  ] as const) {
    for (const p of positions) {
      const target = point(p);
      const hold = level.gripPoints
        .filter((g) => g.use === kind)
        .sort(
          (a, b) =>
            Math.hypot(a.x - target.x, a.y - target.y) -
            Math.hypot(b.x - target.x, b.y - target.y),
        )[0];
      if (!hold || Math.hypot(hold.x - target.x, hold.y - target.y) > 18)
        throw new Error(`Missing ${level.id} ${kind} moment at ${p}`);
      hold.singleLimb = true;
      if (kind === 'hand') handContacts.push(hold);
    }
  }
  // Alternating hands needs a different spacing from matching both hands on
  // every hold. Keep the notches close enough to pass a leading hand, followed
  // by the original wider exit where the player can reorganise their stance.
  const groups: Level['gripPoints'][] = [];
  for (const hold of handContacts) {
    const group = groups[groups.length - 1],
      previous = group?.[group.length - 1];
    if (!previous || Math.hypot(hold.x - previous.x, hold.y - previous.y) > 75)
      groups.push([hold]);
    else group.push(hold);
  }
  for (const group of groups) {
    if (group.length < 2) continue;
    const first = group[0],
      last = group[group.length - 1];
    const dx = last.x - first.x,
      dy = last.y - first.y,
      length = Math.hypot(dx, dy);
    const step = Math.min(length / (group.length - 1), (26 * 1600) / 1586);
    if (step * (group.length - 1) >= length - 1) continue;
    level.gripPoints.push({
      ...last,
      id: last.id + '-wide-exit',
      singleLimb: false,
    });
    group.forEach((hold, i) => {
      hold.x = first.x + (dx / length) * step * i;
      hold.y = first.y + (dy / length) * step * i;
    });
  }
  if (plan.recovery) {
    const p = point(plan.recovery);
    const hold = level.gripPoints.find(
      (g) => Math.hypot(g.x - p.x, g.y - p.y) < 1,
    );
    if (hold) hold.use = undefined;
  }
  level.briefing = `${plan.hint} Short notches hold one limb; wider edges let you regroup.`;
  return level;
}
