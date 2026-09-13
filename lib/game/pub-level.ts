import type { Level, Grip, Collider } from './level';

const holds: Grip[] = [];
const hand = (x: number, y: number) =>
  holds.push({
    id: `pub-h-${holds.length}`,
    x,
    y,
    use: 'hand',
    surface: 'bracket',
  });
const foot = (x: number, y: number) =>
  holds.push({
    id: `pub-f-${holds.length}`,
    x,
    y,
    use: 'foot',
    surface: 'ledge',
  });
// Author the climbing puzzle before the art: three long reversals, two hanging
// traverses, and a supported one-handed finish. No interpolated wall grips.
for (let y = 790; y >= 630; y -= 40) {
  hand(240, y);
  hand(273, y - 12);
}
for (let y = 908; y >= 710; y -= 44) foot(y % 88 < 44 ? 238 : 276, y);
for (const x of [300, 345, 390, 445, 495, 550, 595, 650, 700, 755, 795])
  hand(x, 630);
for (let y = 630; y >= 430; y -= 40) {
  hand(808, y);
  hand(840, y - 12);
}
for (let y = 740; y >= 535; y -= 41) foot(834, y);
for (const x of [775, 730, 680, 635, 590, 540, 485, 440, 395, 345, 325])
  hand(x, 418);
for (let y = 418; y >= 218; y -= 40) {
  hand(300, y);
  hand(332, y - 12);
}
for (let y = 527; y >= 327; y -= 40) foot(300, y);
for (let x = 375; x <= 1185; x += 45) hand(x, 206);
for (let x = 360; x <= 1200; x += 70) foot(x, 322);
hand(1218, 208);
foot(1210, 322);
foot(785, 520);
hand(795, 418);
const colliders: Collider[] = [
  { id: 'pub-ground', type: 'edge', x: 0, y: 950, x2: 1600, y2: 950 },
  { id: 'verandah-lip', type: 'rect', x: 294, y: 603, x2: 774, y2: 616 },
  { id: 'sign-support', type: 'rect', x: 365, y: 391, x2: 766, y2: 404 },
  { id: 'roof-footing', type: 'rect', x: 350, y: 332, x2: 1250, y2: 345 },
  { id: 'roof-parapet', type: 'rect', x: 370, y: 179, x2: 1200, y2: 192 },
];
export const pubLevel: Level = {
  version: 1,
  id: 'pub-keys',
  name: 'Keys on the pub roof',
  backgroundImage: '/assets/country-pub.png',
  worldWidth: 1600,
  worldHeight: 1000,
  playerScale: 0.82,
  playerSpawn: { x: 255, y: 850 },
  gripPoints: holds,
  colliders,
  objectives: [
    {
      id: 'pub-keys',
      type: 'repair',
      kind: 'keys',
      name: 'Retrieve Gaz’s ute keys',
      x: 1250,
      y: 217,
      successMessage: 'Keys recovered. Gaz owes you more than a cold one.',
    },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1600, height: 1000 },
  completionTrigger: { x: 1160, y: 180, width: 160, height: 180 },
  pay: 180,
  challenge: true,
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
