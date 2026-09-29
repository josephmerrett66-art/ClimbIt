import type { Level } from './level';

export const buildingEditorLevel: Level = {
  version: 1,
  id: 'building-editor',
  name: 'Building Editor',
  backgroundImage: '/assets/building-editor.svg',
  worldWidth: 1200,
  worldHeight: 1600,
  playerScale: 0.9,
  challenge: true,
  fatigue: true,
  playerSpawn: { x: 600, y: 1490 },
  gripPoints: [],
  colliders: [
    {
      id: 'building-ground',
      type: 'edge',
      role: 'ground',
      x: 0,
      y: 1540,
      x2: 1200,
      y2: 1540,
    },
  ],
  objectives: [
    {
      id: 'building-finish',
      type: 'repair',
      kind: 'scenery',
      name: 'Building finish',
      x: 600,
      y: 120,
      successMessage: 'Custom climb complete.',
    },
  ],
  interactiveObjects: [],
  cameraBounds: { x: 0, y: 0, width: 1200, height: 1600 },
  completionTrigger: { x: 520, y: 70, width: 160, height: 150 },
  pay: 0,
};

export const buildingEditorJob = {
  id: buildingEditorLevel.id,
  name: 'BUILDING EDITOR',
  client: 'Create a climb from scratch',
  pay: 0,
  href: '/building-editor',
  image: '/assets/building-editor.svg',
  level: buildingEditorLevel,
};
