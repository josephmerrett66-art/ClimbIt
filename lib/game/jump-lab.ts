import type { Grip, Level } from './level';

// Sparse switchbacks: every landing needs a deliberate foot recovery.
// No generated ladders, dead-end traps, or intervening handholds.
const pad = (id: string, x: number, y: number, color: string, radius = 17): Grip =>
  ({ id, x, y, color, radius, use: 'hand', jumpTarget: true });
const foot = (id: string, x: number, y: number, color: string): Grip =>
  ({ id, x, y, color, radius: 9, use: 'foot', singleLimb: true });

export const jumpLabLevel: Level = {
  version: 1,
  id: 'jump-lab',
  name: 'Switchback',
  backgroundImage: '',
  worldWidth: 1000,
  worldHeight: 1600,
  playerScale: 0.9,
  challenge: true,
  testMode: 'jump',
  playerSpawn: { x: 220, y: 1355 },
  jumpCourse: [
    { hold: 'jump-cyan', name: 'The gap', hint: 'Load from the yellow start. Catch with one hand, then recover your feet.' },
    { hold: 'jump-pink', name: 'High step', hint: 'One offset foothold. Set your hips before committing upwards.' },
    { hold: 'jump-lime', name: 'Switchback', hint: 'Reverse left. Let the swing settle before loading again.' },
    { hold: 'jump-orange', name: 'Compression', hint: 'The next catch is higher and left. Choose your planted foot carefully.' },
    { hold: 'jump-violet', name: 'The traverse', hint: 'A longer rightward throw. Reach, catch, then control the cut-loose swing.' },
    { hold: 'jump-red', name: 'Last throw', hint: 'Commit upwards. Match both hands on FINISH and hold still for one second.' },
  ],
  gripPoints: [
    { ...pad('start-hands', 220, 1260, '#f5dc43', 21), jumpTarget: false },
    foot('start-left-foot', 192, 1425, '#bba536'),
    foot('start-right-foot', 248, 1425, '#bba536'),
    pad('jump-cyan', 450, 1150, '#42ddff'),
    foot('cyan-foot', 480, 1294, '#288da2'),
    pad('jump-pink', 700, 1000, '#ff63b7', 15),
    foot('pink-foot', 665, 1138, '#ae447e'),
    pad('jump-lime', 465, 835, '#83f05d', 16),
    foot('lime-foot', 500, 983, '#52983d'),
    pad('jump-orange', 255, 670, '#ff8a3d', 15),
    foot('orange-foot', 230, 810, '#af6030'),
    pad('jump-violet', 490, 530, '#b68cff', 16),
    foot('violet-foot', 527, 672, '#7b5dac'),
    pad('jump-red', 730, 350, '#ff5656', 17),
    foot('finish-foot', 704, 497, '#ab3c3c'),
  ],
  colliders: [
    { id: 'ground', type: 'edge', role: 'ground', x: 0, y: 1535, x2: 1000, y2: 1535 },
  ],
  objectives: [
    { id: 'lab-finish', type: 'repair', kind: 'scenery', name: 'Match the finish', x: 730, y: 350 },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1000, height: 1600 },
  completionTrigger: { x: 700, y: 320, width: 80, height: 180 },
  pay: 0,
};

export const jumpLabJob = {
  id: jumpLabLevel.id,
  name: 'TEST AREA: Switchback',
  client: 'Bouldering circuit · Six committing jumps',
  pay: 0,
  href: '/jump-lab',
  image: '/assets/jump-lab.svg',
  level: jumpLabLevel,
};
