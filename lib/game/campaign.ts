import type { Level, Grip } from './level';

export type RouteCorner = [number, number, ('hang' | 'brace')?];
export type ClimbSpec = {
  slug: string;
  id: string;
  href: string;
  name: string;
  client: string;
  briefing: string;
  success: string;
  // Job names read as marketplace listings, which is too long for the editor's
  // objective marker. `item` is the short name of the thing being fetched.
  item?: string;
  pay: number;
  route: RouteCorner[];
  target: [number, number];
  scale?: number;
  braces?: RouteCorner[][];
};

// These polylines are traced against the final artwork, never drawn over it.
// 'hang' makes a span hand-only; posts and projecting trim support both limbs.
export function makeClimb(spec: ClimbSpec) {
  const scale = spec.scale ?? 0.82;
  // Original PNGs are 1586 × 992; normalize art and interaction geometry together.
  const normal = (p: RouteCorner): RouteCorner => [
    (p[0] * 1600) / 1586,
    (p[1] * 1000) / 992,
    p[2],
  ];
  spec = {
    ...spec,
    route: spec.route.map(normal),
    braces: spec.braces?.map((path) => path.map(normal)),
    target: [(spec.target[0] * 1600) / 1586, (spec.target[1] * 1000) / 992],
  };
  const grips: Grip[] = [];
  for (let i = 1; i < spec.route.length; i++) {
    const a = spec.route[i - 1],
      b = spec.route[i];
    const n = Math.max(
      1,
      Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (30 * scale)),
    );
    for (let j = 0; j <= n; j++) {
      const x = a[0] + ((b[0] - a[0]) * j) / n;
      const y = a[1] + ((b[1] - a[1]) * j) / n;
      const use = b[2] === 'hang' && j > 0 && j < n ? 'hand' : undefined;
      grips.push({
        id: `${spec.slug}-${i}-${j}`,
        x,
        y,
        use,
        angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
        surface: 'trim',
      });
    }
  }
  // Extra footholds are explicitly traced onto nearby posts/trim, not offset
  // from the hand route into empty space.
  for (const path of spec.braces ?? []) {
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i],
        n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (32 * scale));
      for (let j = 0; j <= n; j++)
        grips.push({
          id: `${spec.slug}-brace-${grips.length}`,
          x: a[0] + ((b[0] - a[0]) * j) / n,
          y: a[1] + ((b[1] - a[1]) * j) / n,
          use: 'foot',
          surface: 'trim',
        });
    }
  }
  const start = spec.route[0];
  const level: Level = {
    version: 1,
    id: spec.id,
    name: spec.name,
    backgroundImage: `/assets/australia-${spec.slug}.png`,
    worldWidth: 1600,
    worldHeight: 1000,
    playerScale: scale,
    playerSpawn: { x: start[0], y: start[1] - 72 * scale },
    gripPoints: grips,
    colliders: [
      {
        id: `${spec.slug}-ground`,
        role: 'ground',
        type: 'edge',
        x: 0,
        y: start[1] + 16,
        x2: 1600,
        y2: start[1] + 16,
      },
    ],
    objectives: [
      {
        id: `${spec.slug}-job`,
        type: 'repair',
        kind: 'scenery',
        name: spec.item ?? spec.name,
        x: spec.target[0],
        y: spec.target[1],
        successMessage: spec.success,
      },
    ],
    interactiveObjects: [],
    cameraBounds: { x: 0, y: 0, width: 1600, height: 1000 },
    completionTrigger: {
      x: spec.target[0] - 60,
      y: spec.target[1] - 60,
      width: 120,
      height: 120,
    },
    pay: spec.pay,
    challenge: true,
    location: spec.client,
    briefing: `${spec.briefing} Keep one hand and a foot planted; hold the job marker until the bar fills, then release.`,
  };
  return {
    id: spec.id,
    name: spec.name,
    client: spec.client,
    pay: spec.pay,
    href: spec.href,
    image: level.backgroundImage,
    level,
    route: spec.route,
  };
}
