import { applyDifficulty } from './campaign-difficulty';
import { applyRouteMoments } from './route-moments';
import type { Level, Grip, Collider } from './level';

const holds: Grip[] = [];
const hand = (x: number, y: number) =>
  holds.push({
    id: `pub-h-${holds.length}`,
    x,
    y,
    use: 'hand',
    surface: 'timber',
  });
const foot = (x: number, y: number) =>
  holds.push({
    id: `pub-f-${holds.length}`,
    x,
    y,
    use: 'foot',
    surface: 'ledge',
  });
// Traced over country-pub.png in its rendered coordinates (1600 wide,
// 1450 high, offset -40). All geometry is invisible during play.
// Sparse contacts on the left post, then the painted gutter. Two actual
// verandah posts interrupt the longest traverse with optional foot stances.
for (const y of [800, 752, 704, 656, 608]) hand(196, y);
for (const y of [916, 870, 824, 778, 732]) foot(196, y);
for (const x of [
  234, 280, 326, 372, 410, 456, 502, 548, 590, 636, 682, 728, 774, 810,
])
  hand(x, 610);
for (const x of [410, 590]) for (const y of [702, 740]) foot(x, y);
// Right facade edge, rest below the corner, reverse beneath the cornice.
for (const y of [600, 548, 496, 440]) hand(810, y);
for (const y of [748, 702, 660, 620, 580, 542]) foot(820, y);
foot(780, 545);
for (const x of [790, 744, 698, 652, 606, 560, 514, 468, 430]) hand(x, 450);
// Facade trim and stepped parapet. Short pairs survive only at direction changes.
for (const y of [442, 392, 342, 292]) hand(422, y);
for (const y of [560, 520, 480, 440, 400, 360]) foot(421, y);
for (const [x, y] of [
  [460, 280],
  [488, 266],
  [530, 266],
  [557, 266],
  [557, 224],
  [600, 224],
  [645, 224],
  [680, 224],
])
  hand(x, y);
for (const [x, y] of [
  [488, 410],
  [488, 370],
  [557, 410],
  [557, 370],
  [557, 330],
  [600, 330],
  [645, 330],
  [680, 330],
])
  foot(x, y);
for (const g of holds) {
  g.surface = g.use === 'hand' ? 'timber' : 'trim';
  if ([196, 810, 422].includes(g.x)) g.angle = Math.PI / 2;
}
const colliders: Collider[] = [
  { id: 'pub-ground', type: 'edge', x: 0, y: 950, x2: 1600, y2: 950 },
  { id: 'verandah-gutter', type: 'rect', x: 224, y: 589, x2: 770, y2: 596 },
  { id: 'facade-cornice', type: 'rect', x: 450, y: 436, x2: 780, y2: 441 },
];
export const pubLevel: Level = {
  version: 1,
  id: 'pub-keys',
  name: 'Need my ute keys off the pub roof',
  backgroundImage: '/assets/country-pub.png',
  worldWidth: 1600,
  worldHeight: 1000,
  playerScale: 0.82,
  playerSpawn: { x: 196, y: 851 },
  gripPoints: holds,
  colliders,
  objectives: [
    {
      id: 'pub-keys',
      type: 'repair',
      kind: 'keys',
      name: 'Retrieve Gaz’s ute keys',
      x: 680,
      y: 224,
      successMessage: 'Keys recovered. Gaz owes you more than a cold one.',
    },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1600, height: 1000 },
  completionTrigger: { x: 570, y: 180, width: 160, height: 180 },
  pay: 180,
  challenge: true,
  fatigue: true,
  backgroundFraming: { y: -40, height: 1450 },
  location: 'The Galah Arms · Outback NSW',
  briefing:
    'Rest on the verandah posts before the long gutter traverse. Release trailing feet at the corners; warm arms need unloading. Keep a hand and foot planted to collect Gaz’s keys.',
};
applyRouteMoments(pubLevel);
applyDifficulty(pubLevel);
export const pubJob = {
  id: pubLevel.id,
  name: pubLevel.name,
  client: 'Gaz · The Galah Arms, outback NSW',
  pay: pubLevel.pay,
  href: '/pub',
  image: pubLevel.backgroundImage,
  level: pubLevel,
};
