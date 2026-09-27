import type { Grip, Level } from './level';

// Sparse authored problems, linked by open jump gaps. No filler holds.
const problems = [
  {
    name: 'Sideways',
    color: '#d9bf66',
    x: 200,
    y: 1400,
    hands: [
      [0, 0],
      [65, -25],
      [105, -75],
      [150, -65],
    ],
    feet: [
      [-22, 145],
      [62, 116],
      [140, 65],
    ],
  },
  {
    name: 'High step',
    color: '#70b5c5',
    x: 590,
    y: 1215,
    hands: [
      [0, 0],
      [50, -55],
      [115, -65],
      [140, -125],
    ],
    feet: [
      [15, 138],
      [60, 58],
      [135, 8],
    ],
  },
  {
    name: 'Crossover',
    color: '#c495ba',
    x: 970,
    y: 980,
    hands: [
      [0, 0],
      [-60, -40],
      [-20, -100],
      [-95, -135],
    ],
    feet: [
      [15, 140],
      [-60, 85],
      [-100, 5],
    ],
  },
  {
    name: 'Low traverse',
    color: '#90b375',
    x: 635,
    y: 730,
    hands: [
      [0, 0],
      [-70, 25],
      [-140, 0],
      [-170, -65],
    ],
    feet: [
      [20, 140],
      [-65, 135],
      [-160, 70],
    ],
  },
  {
    name: 'Compression',
    color: '#cfa176',
    x: 225,
    y: 555,
    hands: [
      [0, 0],
      [60, -40],
      [20, -105],
      [90, -145],
    ],
    feet: [
      [-15, 142],
      [70, 85],
      [45, -2],
    ],
  },
];
const existingSections = [
  ...problems.map((section, index) => ({
    ...section,
    y: section.y + 1125,
    name: [
      'Warm-up traverse',
      'High step',
      'Cracked corner',
      'Rest pocket',
      'Compression',
    ][index],
    feet:
      index === 3
        ? [
            [-22, 140],
            [22, 140],
            [-65, 135],
            [-160, 70],
          ]
        : section.feet,
  })),
  ...problems.map((section, index) => ({
    ...section,
    name: [
      'Hanging traverse',
      'Fragile crossing',
      'Reverse corner',
      'Moving catch',
      'Upper ascent',
    ][index],
    hands:
      index === 0
        ? [
            [0, 0],
            [55, -15],
            [95, -40],
            [145, -65],
          ]
        : section.hands,
    feet:
      index === 0
        ? [section.feet[0], [62, 136], section.feet[2]]
        : section.feet,
  })),
];
export const boulderSections = [
  ...existingSections.map((section) => ({ ...section, y: section.y + 700 })),
  {
    name: 'Hand shuffle',
    color: '#e1b86a',
    x: 500,
    y: 950,
    hands: [
      [0, 0],
      [60, 0],
      [120, 0],
      [180, 0],
      [240, 0],
      [300, 0],
      [360, 0],
    ],
    feet: [
      [-22, 145],
      [22, 145],
      [338, 145],
      [382, 145],
    ],
  },
  {
    name: 'Return shuffle',
    color: '#83c9c3',
    x: 1110,
    y: 790,
    hands: [
      [0, 0],
      [-60, 0],
      [-120, 0],
      [-180, 0],
      [-240, 0],
      [-300, 0],
      [-360, 0],
    ],
    feet: [
      [-22, 145],
      [22, 145],
      [-382, 120],
      [-338, 120],
    ],
  },
];
const grips: Grip[] = boulderSections.flatMap((section, index) => [
  ...section.hands.map(
    ([x, y], i): Grip => ({
      id:
        i === 0
          ? index === 0
            ? 'start-hands'
            : `landing-${index}`
          : `section-${index}-hand-${i}`,
      x: section.x + x,
      y: section.y + y,
      use: 'hand',
      color: section.color,
      radius: i === 0 || i === section.hands.length - 1 ? 18 : 10,
      singleLimb: i > 0 && i < section.hands.length - 1,
      jumpTarget: index > 0 && i === 0,
      surface: i === section.hands.length - 1 ? 'rest' : undefined,
      hangingDrain: index >= 10 ? 1.5 : undefined,
      crumbleAfter:
        (index === 2 || index === 6) && (i === 1 || i === 2) ? 5 : undefined,
      motion: index === 8 && i === 0 ? { amplitude: 18, period: 6 } : undefined,
    }),
  ),
  ...section.feet.map(
    ([x, y], i): Grip => ({
      id: `section-${index}-foot-${i}`,
      x: section.x + x,
      y: section.y + y,
      use: 'foot',
      color: section.color,
      radius: 8,
      singleLimb: true,
    }),
  ),
]);
export const jumpLabLevel: Level = {
  version: 1,
  id: 'jump-lab',
  name: 'Twelve Problems',
  backgroundImage: '',
  worldWidth: 1200,
  worldHeight: 3475,
  playerScale: 0.9,
  challenge: true,
  fatigue: true,
  testMode: 'jump',
  playerSpawn: { x: 200, y: 3320 },
  jumpCourse: boulderSections.slice(1).map((section, index) => ({
    hold: `landing-${index + 1}`,
    name: section.name,
    hint: 'Set your feet, match a wide hold, then jump across the gap.',
  })),
  boulderFinish: 'section-11-hand-6',
  gripPoints: grips,
  colliders: [
    {
      id: 'ground',
      type: 'edge',
      role: 'ground',
      x: 0,
      y: 3435,
      x2: 1200,
      y2: 3435,
    },
  ],
  objectives: [
    {
      id: 'lab-finish',
      type: 'repair',
      kind: 'scenery',
      name: 'Match the finish',
      x: 750,
      y: 790,
    },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 3475 },
  completionTrigger: { x: 710, y: 760, width: 90, height: 180 },
  pay: 0,
};
export const jumpLabJob = {
  id: jumpLabLevel.id,
  name: 'TEST AREA: Twelve Problems',
  client: 'Twelve sparse puzzles · Hand-only shuffles · Eleven jumps',
  pay: 0,
  href: '/jump-lab',
  image: '/assets/jump-lab.svg',
  level: jumpLabLevel,
};
