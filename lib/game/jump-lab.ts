import type { Grip, Level } from './level';

const hand = (
  id: string,
  x: number,
  y: number,
  color: string,
  jumpTarget = true,
): Grip => ({ id, x, y, use: 'hand', color, jumpTarget, radius: 18 });

const foot = (id: string, x: number, y: number, color: string): Grip => ({
  id,
  x,
  y,
  use: 'foot',
  color,
  radius: 13,
});

export const jumpLabLevel: Level = {
  version: 1,
  id: 'jump-lab',
  name: 'Jump mechanic lab',
  backgroundImage: '',
  worldWidth: 1000,
  worldHeight: 720,
  playerScale: 0.9,
  challenge: true,
  testMode: 'jump',
  playerSpawn: { x: 190, y: 500 },
  gripPoints: [
    hand('start-hands', 190, 405, '#f5dc43', false),
    foot('start-left-foot', 162, 570, '#f5dc43'),
    foot('start-right-foot', 218, 570, '#f5dc43'),

    hand('jump-cyan', 365, 330, '#42ddff'),
    hand('jump-pink', 430, 230, '#ff63b7'),
    hand('jump-orange', 545, 355, '#ff8a3d'),
    hand('jump-lime', 650, 220, '#83f05d'),
    hand('jump-violet', 785, 315, '#b68cff'),
    hand('jump-red', 885, 175, '#ff5656'),

    foot('setup-cyan-left', 335, 470, '#217f94'),
    foot('setup-cyan-right', 385, 474, '#217f94'),
    foot('setup-pink-left', 400, 375, '#96376f'),
    foot('setup-pink-right', 448, 380, '#96376f'),
    foot('setup-orange-left', 510, 500, '#9b4e25'),
    foot('setup-orange-right', 560, 500, '#9b4e25'),
    foot('setup-lime-left', 620, 365, '#438337'),
    foot('setup-lime-right', 670, 365, '#438337'),
    foot('setup-violet-left', 755, 460, '#67518e'),
    foot('setup-violet-right', 805, 460, '#67518e'),
  ],
  colliders: [
    { id: 'ground', type: 'edge', role: 'ground', x: 0, y: 675, x2: 1000, y2: 675 },
  ],
  objectives: [
    { id: 'lab-marker', type: 'repair', kind: 'scenery', name: 'Lab marker', x: 970, y: 70 },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1000, height: 720 },
  completionTrigger: { x: 930, y: 40, width: 40, height: 40 },
  pay: 0,
};

export const jumpLabJob = {
  id: jumpLabLevel.id,
  name: 'TEST AREA: Dynamic jump training',
  client: 'Climbing gym · Mechanics lab',
  pay: 0,
  href: '/jump-lab',
  image: '/assets/jump-lab.svg',
  level: jumpLabLevel,
};
