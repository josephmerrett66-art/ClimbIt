import type { Level, Grip, Objective } from './level';

type JobSpec = {
  slug: string;
  name: string;
  client: string;
  pay: number;
  kind: Objective['kind'];
  task: string;
  success: string;
  rails: [number, number];
  bottom: number;
  top: number;
  target: [number, number];
  scale: number;
};

// Continuous rail grips follow the visible front service ladders in the final artwork.
function makeJob(spec: JobSpec) {
  const grips: Grip[] = [];
  const [left, right] = spec.rails;
  const steps = Math.ceil((spec.bottom - spec.top) / (25 * spec.scale));
  for (let i = 0; i <= steps; i++) {
    const y = spec.bottom - ((spec.bottom - spec.top) * i) / steps;
    for (const x of [left, right])
      grips.push({
        id: `${spec.slug}-rung-${grips.length}`,
        x,
        y,
        angle: Math.PI / 2,
        surface: 'ladder',
      });
  }
  const level: Level = {
    version: 1,
    id: spec.slug,
    name: spec.name,
    backgroundImage: `/assets/${spec.slug}.png`,
    worldWidth: 1200,
    worldHeight: 1000,
    playerScale: spec.scale,
    playerSpawn: { x: (left + right) / 2, y: spec.bottom - 72 * spec.scale },
    gripPoints: grips,
    colliders: [
      {
        id: `${spec.slug}-ground`,
        type: 'edge',
        x: 0,
        y: spec.bottom + 7,
        x2: 1200,
        y2: spec.bottom + 7,
      },
    ],
    objectives: [
      {
        id: `${spec.slug}-repair`,
        type: 'repair',
        kind: spec.kind,
        name: spec.task,
        x: spec.target[0],
        y: spec.target[1],
        successMessage: spec.success,
      },
    ],
    interactiveObjects: [],
    cameraBounds: { x: 0, y: 0, width: 1200, height: 1000 },
    completionTrigger: {
      x: left - 60,
      y: 860,
      width: right - left + 120,
      height: 100,
    },
    pay: spec.pay,
  };
  return {
    id: spec.slug,
    name: spec.name,
    client: spec.client,
    pay: spec.pay,
    href: `/${spec.slug}`,
    image: level.backgroundImage,
    level,
  };
}

export const EXTRA_JOBS = [
  makeJob({
    slug: 'lighthouse',
    name: 'Restore the lighthouse beacon',
    client: 'Harbour keeper',
    pay: 120,
    kind: 'bulb',
    task: 'Beacon lamp',
    success: 'Beacon restored. Ships can find their way home.',
    rails: [590, 610],
    bottom: 859,
    top: 155,
    target: [600, 137],
    scale: 0.65,
  }),
  makeJob({
    slug: 'windmill',
    name: 'Repair the windmill drive',
    client: 'Willow Farm',
    pay: 95,
    kind: 'gear',
    task: 'Drive gearbox',
    success: 'Drive repaired. The mill is ready to turn again.',
    rails: [585, 614],
    bottom: 902,
    top: 222,
    target: [629, 258],
    scale: 0.72,
  }),
  makeJob({
    slug: 'chimney',
    name: 'Secure the chimney cap',
    client: 'Old Brickworks',
    pay: 110,
    kind: 'cap',
    task: 'Chimney cap',
    success: 'Cap secured. The brickworks is weatherproof again.',
    rails: [593, 607],
    bottom: 944,
    top: 61,
    target: [600, 80],
    scale: 0.64,
  }),
  makeJob({
    slug: 'water-tower',
    name: 'Fix the water tower valve',
    client: 'Town waterworks',
    pay: 135,
    kind: 'valve',
    task: 'Leaking valve',
    success: 'Valve sealed. Water pressure is back to normal.',
    rails: [590, 610],
    bottom: 920,
    top: 90,
    target: [625, 118],
    scale: 0.64,
  }),
  makeJob({
    slug: 'cable-car',
    name: 'Repair the cable-car signal',
    client: 'Alpine lift service',
    pay: 150,
    kind: 'fuse',
    task: 'Signal control box',
    success: 'Signal restored. The lift can run again.',
    rails: [588, 612],
    bottom: 919,
    top: 102,
    target: [600, 65],
    scale: 0.62,
  }),
];
