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
export type Objective = Point & {
  id: string;
  type: 'carry' | 'repair';
  name: string;
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
  objectives: Objective[];
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
    { id: 'pickles', type: 'carry', name: 'Pickles', x: 856, y: 190 },
  ],
  interactiveObjects: [],
  ropeAnchors: [{ x: 625, y: 140 }],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 1000 },
  completionTrigger: { x: 550, y: 865, width: 255, height: 100 },
  pay: 40,
};

const churchGrips: Grip[] = [];
const churchRoute = (points: number[][]) =>
  points.forEach(([x, y], i) => {
    if (i) {
      const [ax, ay] = points[i - 1],
        steps = Math.ceil(Math.hypot(x - ax, y - ay) / 28);
      for (let j = 1; j < steps; j++)
        churchGrips.push({
          id: `church-grip-${churchGrips.length}`,
          x: ax + ((x - ax) * j) / steps,
          y: ay + ((y - ay) * j) / steps,
        });
    }
    churchGrips.push({
      id: `church-grip-${churchGrips.length}`,
      x,
      y,
    });
  });

// Main route follows the central buttresses, window ledges and bell-tower trim.
churchRoute([
  [548, 926],
  [632, 918],
  [532, 866],
  [650, 838],
  [518, 785],
  [662, 754],
  [508, 702],
  [664, 671],
  [510, 620],
  [656, 590],
  [518, 536],
  [648, 505],
  [522, 455],
  [646, 424],
  [526, 372],
  [640, 344],
  [532, 292],
  [634, 265],
  [544, 216],
  [622, 190],
  [580, 153],
  [612, 122],
]);
// Optional side routes let players swing around the large lower window and roof.
churchRoute([
  [506, 812],
  [458, 786],
  [424, 742],
  [454, 692],
  [502, 662],
]);
churchRoute([
  [672, 802],
  [718, 770],
  [755, 724],
  [710, 682],
  [665, 650],
]);
churchRoute([
  [520, 525],
  [480, 485],
  [448, 448],
  [492, 418],
  [530, 388],
]);
churchRoute([
  [646, 514],
  [688, 478],
  [724, 438],
  [686, 404],
  [642, 376],
]);

export const churchLevel: Level = {
  version: 1,
  id: 'church-cross',
  name: 'Straighten the church cross',
  backgroundImage: '/assets/church-cross.png',
  worldWidth: 1200,
  worldHeight: 1000,
  playerSpawn: { x: 590, y: 878 },
  gripPoints: churchGrips,
  colliders: [
    { id: 'church-ground', type: 'edge', x: 0, y: 958, x2: 1200, y2: 958 },
    { id: 'left-roof', type: 'edge', x: 190, y: 675, x2: 505, y2: 432 },
    { id: 'right-roof', type: 'edge', x: 690, y: 432, x2: 1000, y2: 675 },
  ],
  objectives: [
    {
      id: 'church-cross',
      type: 'repair',
      name: 'Crooked cross',
      x: 612,
      y: 122,
    },
  ],
  interactiveObjects: [
    { id: 'cross-hinge', type: 'straighten', x: 612, y: 122 },
  ],
  ropeAnchors: [{ x: 612, y: 100 }],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 1000 },
  completionTrigger: { x: 520, y: 850, width: 180, height: 110 },
  pay: 55,
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
    !l.objectives.every(
      (o: any) => point(o) && ['carry', 'repair'].includes(o.type),
    )
  )
    throw Error('Add at least one supported objective.');
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
