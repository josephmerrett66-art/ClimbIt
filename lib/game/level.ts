export type Point = { x: number; y: number };
export type Grip = Point & { id: string; angle?: number; surface?: string };
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
  kind?: 'cross' | 'bulb' | 'gear' | 'cap' | 'valve' | 'fuse';
  successMessage?: string;
};
export type Level = {
  version: 1;
  id: string;
  name: string;
  backgroundImage: string;
  foregroundImage?: string;
  worldWidth: number;
  worldHeight: number;
  playerScale?: number;
  playerSpawn: Point;
  gripPoints: Grip[];
  colliders: Collider[];
  objectives: Objective[];
  interactiveObjects: (Point & { id: string; type: string })[];
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
          angle: Math.atan2(y - ay, x - ax),
          surface: 'bark',
        });
    }
    grips.push({ id: `grip-${grips.length}`, x, y, surface: 'bark' });
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
  [713, 255],
  [761, 236],
  [808, 217],
  [854, 200],
  [900, 183],
  [943, 170],
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
  playerScale: 1,
  playerSpawn: { x: 603, y: 873 },
  gripPoints: grips,
  colliders: [{ id: 'ground', type: 'edge', x: 0, y: 954, x2: 1200, y2: 954 }],
  objectives: [
    { id: 'pickles', type: 'carry', name: 'Pickles', x: 856, y: 190 },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 1000 },
  completionTrigger: { x: 550, y: 865, width: 255, height: 100 },
  pay: 40,
};

const CHURCH_PLAYER_SCALE = 0.82;
const churchGrips: Grip[] = [];
const churchRoute = (points: number[][]) =>
  points.forEach(([x, y], i) => {
    if (i) {
      const [ax, ay] = points[i - 1],
        steps = Math.ceil(
          Math.hypot(x - ax, y - ay) / (28 * CHURCH_PLAYER_SCALE),
        );
      for (let j = 1; j < steps; j++)
        churchGrips.push({
          id: `church-grip-${churchGrips.length}`,
          x: ax + ((x - ax) * j) / steps,
          y: ay + ((y - ay) * j) / steps,
          angle: Math.atan2(y - ay, x - ax),
        });
    }
    churchGrips.push({
      id: `church-grip-${churchGrips.length}`,
      x,
      y,
    });
  });

// Trace the two projecting stone buttresses. No route crosses the window glass.
churchRoute([
  [475, 927],
  [487, 879],
  [487, 819],
  [481, 746],
  [479, 688],
  [484, 627],
  [490, 568],
  [493, 518],
  [495, 473],
  [502, 448],
  [505, 398],
  [505, 363],
  [503, 337],
  [507, 295],
  [512, 261],
  [512, 231],
  [512, 200],
]);
churchRoute([
  [718, 927],
  [714, 879],
  [716, 815],
  [719, 748],
  [718, 684],
  [705, 627],
  [704, 580],
  [702, 534],
  [701, 487],
  [699, 451],
  [696, 397],
  [695, 362],
  [695, 339],
  [690, 294],
  [686, 260],
  [690, 229],
  [690, 200],
]);
// Actual horizontal stone courses and projecting sills join the pillars.
churchRoute([
  [490, 840],
  [535, 840],
  [600, 842],
  [674, 840],
  [714, 840],
]);
churchRoute([
  [490, 563],
  [553, 563],
  [621, 564],
  [704, 563],
]);
churchRoute([
  [505, 346],
  [548, 346],
  [603, 347],
  [659, 346],
  [695, 346],
]);
churchRoute([
  [512, 201],
  [558, 201],
  [611, 201],
  [652, 201],
  [690, 201],
]);
// Sloped stone coping leads to the cross plinth, rather than floating above it.
churchRoute([
  [532, 190],
  [553, 173],
  [577, 151],
  [597, 133],
  [612, 132],
]);
churchRoute([
  [675, 190],
  [654, 171],
  [633, 151],
  [612, 132],
]);

export const churchLevel: Level = {
  version: 1,
  id: 'church-cross',
  name: 'Straighten the church cross',
  backgroundImage: '/assets/church-cross.png',
  worldWidth: 1200,
  worldHeight: 1000,
  playerScale: CHURCH_PLAYER_SCALE,
  playerSpawn: { x: 495, y: 878 },
  gripPoints: churchGrips,
  colliders: [
    { id: 'church-ground', type: 'edge', x: 0, y: 958, x2: 1200, y2: 958 },
    { id: 'left-roof', type: 'edge', x: 250, y: 648, x2: 447, y2: 455 },
    { id: 'right-roof', type: 'edge', x: 752, y: 455, x2: 938, y2: 648 },
  ],
  objectives: [
    {
      id: 'church-cross',
      type: 'repair',
      kind: 'cross',
      name: 'Crooked cross',
      x: 612,
      y: 122,
    },
  ],
  interactiveObjects: [
    { id: 'cross-hinge', type: 'straighten', x: 612, y: 122 },
  ],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 1000 },
  completionTrigger: { x: 520, y: 850, width: 180, height: 110 },
  pay: 55,
};

const TOWER_PLAYER_SCALE = 0.62;
const towerGrips: Grip[] = [];
const towerRoute = (points: number[][]) =>
  points.forEach(([x, y], i) => {
    if (i) {
      const [ax, ay] = points[i - 1],
        steps = Math.ceil(
          Math.hypot(x - ax, y - ay) / (27 * TOWER_PLAYER_SCALE),
        );
      for (let j = 1; j < steps; j++)
        towerGrips.push({
          id: `tower-grip-${towerGrips.length}`,
          x: ax + ((x - ax) * j) / steps,
          y: ay + ((y - ay) * j) / steps,
          angle: Math.atan2(y - ay, x - ax),
        });
    }
    towerGrips.push({
      id: `tower-grip-${towerGrips.length}`,
      x,
      y,
    });
  });

// Front ladder rails and rungs, traced through the maintenance platforms.
towerRoute([
  [614, 928],
  [614, 854],
  [613, 748],
  [612, 650],
  [612, 579],
  [610, 491],
  [610, 378],
  [612, 283],
  [614, 192],
  [614, 88],
]);
towerRoute([
  [632, 928],
  [632, 854],
  [633, 748],
  [634, 650],
  [633, 579],
  [631, 491],
  [631, 378],
  [630, 283],
  [631, 192],
  [636, 88],
]);
for (let y = 917; y >= 93; y -= 15)
  towerRoute([
    [615, y],
    [624, y],
    [632, y],
  ]);
// Structural uprights taper towards the summit; the empty bays are not grabbable.
towerRoute([
  [438, 884],
  [463, 745],
  [487, 580],
  [516, 378],
  [538, 218],
  [551, 133],
]);
towerRoute([
  [770, 884],
  [748, 745],
  [724, 580],
  [698, 378],
  [678, 218],
  [668, 133],
]);
// Platforms and the visible diagonal steel members connect to the ladder.
towerRoute([
  [477, 578],
  [612, 578],
  [760, 578],
]);
towerRoute([
  [513, 374],
  [613, 374],
  [742, 374],
]);
towerRoute([
  [519, 120],
  [617, 120],
  [706, 134],
]);
towerRoute([
  [450, 852],
  [740, 609],
]);
towerRoute([
  [460, 609],
  [744, 852],
]);
towerRoute([
  [494, 568],
  [685, 391],
]);
towerRoute([
  [503, 391],
  [717, 568],
]);
towerRoute([
  [524, 369],
  [678, 225],
]);
towerRoute([
  [538, 225],
  [692, 369],
]);
towerRoute([
  [616, 120],
  [626, 88],
  [626, 53],
  [614, 26],
  [605, 20],
]);

export const towerLevel: Level = {
  version: 1,
  id: 'telephone-tower-bulb',
  name: 'Replace the tower light bulb',
  backgroundImage: '/assets/telephone-tower.png',
  worldWidth: 1200,
  worldHeight: 1000,
  playerScale: TOWER_PLAYER_SCALE,
  playerSpawn: { x: 624, y: 872 },
  gripPoints: towerGrips,
  colliders: [
    { id: 'tower-ground', type: 'edge', x: 0, y: 960, x2: 1200, y2: 960 },
  ],
  objectives: [
    {
      id: 'tower-bulb',
      type: 'repair',
      kind: 'bulb',
      name: 'Dead tower light',
      x: 602,
      y: 62,
    },
  ],
  interactiveObjects: [
    { id: 'tower-lamp', type: 'replace-bulb', x: 602, y: 62 },
  ],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 1000 },
  completionTrigger: { x: 520, y: 850, width: 180, height: 110 },
  pay: 85,
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
    (l.playerScale !== undefined &&
      (!Number.isFinite(l.playerScale) ||
        l.playerScale < 0.4 ||
        l.playerScale > 1.5)) ||
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
  // Accept old exports, but discard the retired rope configuration.
  delete l.ropeAnchors;
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
