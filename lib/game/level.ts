export type Point = { x: number; y: number };
export type Grip = Point & { id: string };
export type Collider = {
  id: string;
  type: 'edge' | 'rect';
  x: number;
  y: number;
  x2: number;
  y2: number;
};
export type Level = {
  version: 1;
  id: string;
  name: string;
  backgroundImage: string;
  foregroundImage?: string;
  worldWidth: number;
  worldHeight: number;
  playerSpawn: Point;
  gripPoints: Grip[];
  colliders: Collider[];
  objectives: (Point & { id: string; type: 'carry'; name: string })[];
  interactiveObjects: (Point & { id: string; type: string })[];
  ropeAnchors: Point[];
  cameraBounds: { x: number; y: number; width: number; height: number };
  completionTrigger: { x: number; y: number; width: number; height: number };
  pay: number;
};
const grips: Grip[] = [];
const route = (points: number[][]) =>
  points.forEach(([x, y], i) => {
    if (i) {
      const [ax, ay] = points[i - 1],
        n = Math.ceil(Math.hypot(x - ax, y - ay) / 30);
      for (let j = 1; j < n; j++)
        grips.push({
          id: `grip-${grips.length}`,
          x: ax + ((x - ax) * j) / n,
          y: ay + ((y - ay) * j) / n,
        });
    }
    grips.push({ id: `grip-${grips.length}`, x, y });
  });
// Coordinates are traced over cat-tree.png, independent of the physics engine.
route([
  [573, 927],
  [633, 917],
  [574, 864],
  [641, 853],
  [583, 796],
  [648, 780],
  [582, 729],
  [650, 711],
  [587, 663],
  [650, 641],
  [589, 594],
  [649, 572],
  [591, 523],
  [651, 503],
  [601, 453],
  [665, 430],
  [612, 384],
  [675, 357],
  [628, 317],
  [690, 287],
]);
for (let y = 900; y >= 300; y -= 34)
  route([
    [603, y],
    [636, y - 12],
  ]);
route([
  [687, 461],
  [731, 444],
  [780, 430],
  [827, 416],
  [875, 402],
]);
route([
  [561, 478],
  [519, 448],
  [476, 420],
  [430, 404],
  [387, 391],
  [338, 382],
]);
route([
  [713, 270],
  [761, 251],
  [808, 235],
  [854, 221],
  [900, 207],
  [943, 190],
]);
route([
  [589, 289],
  [548, 245],
  [506, 210],
  [460, 185],
  [414, 174],
  [369, 166],
]);
export const catLevel: Level = {
  version: 1,
  id: 'cat-tree',
  name: 'Cat stuck in tree',
  backgroundImage: '/assets/cat-tree.png',
  worldWidth: 1200,
  worldHeight: 1000,
  playerSpawn: { x: 603, y: 873 },
  gripPoints: grips,
  colliders: [{ id: 'ground', type: 'edge', x: 0, y: 954, x2: 1200, y2: 954 }],
  objectives: [
    { id: 'pickles', type: 'carry', name: 'Pickles', x: 856, y: 203 },
  ],
  interactiveObjects: [{ id: 'owner', type: 'customer', x: 739, y: 950 }],
  ropeAnchors: [{ x: 625, y: 140 }],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 1000 },
  completionTrigger: { x: 550, y: 865, width: 255, height: 100 },
  pay: 40,
};
export function parseLevel(raw: string): Level {
  const l = JSON.parse(raw);
  const point = (p: any) =>
    p &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    Math.abs(p.x) < 20000 &&
    Math.abs(p.y) < 20000;
  if (
    l.version !== 1 ||
    typeof l.id !== 'string' ||
    typeof l.name !== 'string' ||
    !Number.isFinite(l.worldWidth) ||
    !Number.isFinite(l.worldHeight) ||
    l.worldWidth < 200 ||
    l.worldHeight < 200 ||
    l.worldWidth > 8000 ||
    l.worldHeight > 8000 ||
    !point(l.playerSpawn)
  )
    throw Error('Invalid level dimensions or spawn.');
  if (
    typeof l.backgroundImage !== 'string' ||
    !/^(data:image\/png;base64,|\/[^/]|https:\/\/)/.test(l.backgroundImage)
  )
    throw Error(
      'Background must be a PNG data URL, local asset path, or HTTPS URL.',
    );
  if (
    !Array.isArray(l.gripPoints) ||
    l.gripPoints.length > 5000 ||
    !l.gripPoints.every((g: any) => point(g) && typeof g.id === 'string')
  )
    throw Error('Invalid grip points.');
  if (
    !Array.isArray(l.colliders) ||
    !l.colliders.every(
      (c: any) =>
        point(c) &&
        Number.isFinite(c.x2) &&
        Number.isFinite(c.y2) &&
        ['edge', 'rect'].includes(c.type),
    )
  )
    throw Error('Invalid colliders.');
  if (
    !Array.isArray(l.objectives) ||
    !l.objectives.length ||
    !l.objectives.every((o: any) => point(o) && o.type === 'carry')
  )
    throw Error('Add at least one carry objective.');
  if (
    !Array.isArray(l.ropeAnchors) ||
    !l.ropeAnchors.length ||
    !l.ropeAnchors.every(point)
  )
    throw Error('A rope anchor is required.');
  for (const key of ['cameraBounds', 'completionTrigger'])
    if (
      !point(l[key]) ||
      !Number.isFinite(l[key].width) ||
      !Number.isFinite(l[key].height) ||
      l[key].width <= 0 ||
      l[key].height <= 0
    )
      throw Error('Invalid camera bounds or completion zone.');
  l.interactiveObjects ??= [];
  l.pay = Number.isFinite(l.pay) ? Math.max(0, l.pay) : 0;
  return l;
}
