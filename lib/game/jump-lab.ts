import type { Grip, Level } from './level';

// Seven holds per problem: four hands and three feet. No filler holds.
export const boulderSections = [
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
      radius: i === 0 || i === 3 ? 18 : 10,
      singleLimb: i === 1 || i === 2,
      jumpTarget: index > 0 && i === 0,
      surface: i === 3 ? 'rest' : undefined,
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
  name: 'Five Problems',
  backgroundImage: '',
  worldWidth: 1200,
  worldHeight: 1650,
  playerScale: 0.9,
  challenge: true,
  fatigue: true,
  testMode: 'jump',
  playerSpawn: { x: 200, y: 1495 },
  jumpCourse: boulderSections.slice(1).map((section, index) => ({
    hold: `landing-${index + 1}`,
    name: section.name,
    hint: 'Set your feet, match a wide hold, then jump across the gap.',
  })),
  boulderFinish: 'section-4-hand-3',
  gripPoints: grips,
  colliders: [
    {
      id: 'ground',
      type: 'edge',
      role: 'ground',
      x: 0,
      y: 1610,
      x2: 1200,
      y2: 1610,
    },
  ],
  objectives: [
    {
      id: 'lab-finish',
      type: 'repair',
      kind: 'scenery',
      name: 'Match the finish',
      x: 315,
      y: 410,
    },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 1650 },
  completionTrigger: { x: 275, y: 380, width: 90, height: 180 },
  pay: 0,
};
export const jumpLabJob = {
  id: jumpLabLevel.id,
  name: 'TEST AREA: Five Problems',
  client: 'Five sparse boulders · Four connecting jumps',
  pay: 0,
  href: '/jump-lab',
  image: '/assets/jump-lab.svg',
  level: jumpLabLevel,
};
