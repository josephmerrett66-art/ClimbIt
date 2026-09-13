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
// Left verandah post, then the underside of the existing gutter.
for (let y = 800; y >= 600; y -= 40) {
  hand(190, y);
  hand(202, y - 8);
}
for (let y = 916; y >= 716; y -= 40) foot(196, y);
for (let x = 230; x <= 790; x += 30) hand(x, 610);
// Corner post and right-hand trim of the central weatherboard facade.
for (let y = 600; y >= 440; y -= 40) {
  hand(810, y);
  hand(822, y - 8);
}
for (const y of [748, 708, 668, 628, 588, 548]) foot(820, y);
foot(780, 545);
for (let x = 790; x >= 430; x -= 30) hand(x, 450);
// Left facade edge and the stepped parapet, following the painted roof outline.
for (let y = 442; y >= 282; y -= 40) {
  hand(422, y);
  hand(436, y - 8);
}
for (const y of [560, 520, 480, 440, 400, 360]) foot(421, y);
for (const [x, y] of [
  [460, 280],
  [488, 280],
  [488, 266],
  [530, 266],
  [557, 266],
  [557, 224],
  [600, 224],
  [645, 224],
  [680, 224],
])
  hand(x, y);
// Boots brace on the side trim and the actual corrugated roof/eave below.
for (const [x, y] of [
  [460, 450],
  [488, 410],
  [488, 370],
  [530, 450],
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
  if ([190, 202, 810, 822, 422, 436].includes(g.x)) g.angle = Math.PI / 2;
}
const colliders: Collider[] = [
  { id: 'pub-ground', type: 'edge', x: 0, y: 950, x2: 1600, y2: 950 },
  { id: 'verandah-gutter', type: 'rect', x: 224, y: 589, x2: 770, y2: 596 },
  { id: 'facade-cornice', type: 'rect', x: 450, y: 436, x2: 780, y2: 441 },
];
export const pubLevel: Level = {
  version: 1,
  id: 'pub-keys',
  name: 'Keys on the pub roof',
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
  backgroundFraming: { y: -40, height: 1450 },
  location: 'The Galah Arms · Outback NSW',
  briefing:
    'Work around the verandah. Release your feet to hang beneath the gutters. Keep a hand and a foot planted while holding the keys, then release to collect.',
};
export const pubJob = {
  id: pubLevel.id,
  name: pubLevel.name,
  client: 'Gaz · The Galah Arms, outback NSW',
  pay: pubLevel.pay,
  href: '/pub',
  image: pubLevel.backgroundImage,
  level: pubLevel,
};
