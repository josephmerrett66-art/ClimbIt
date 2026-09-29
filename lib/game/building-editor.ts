import type { Level } from './level';
import { jumpLabLevel } from './jump-lab';

export const buildingEditorLevel: Level = {
  ...structuredClone(jumpLabLevel),
  id: 'building-editor',
  name: 'Blank Test Arena',
  gripPoints: structuredClone(
    jumpLabLevel.gripPoints.filter((hold) =>
      ['start-hands', 'section-0-foot-0'].includes(hold.id),
    ),
  ),
  jumpCourse: [],
  boulderFinish: undefined,
};

buildingEditorLevel.gripPoints.push({
  ...buildingEditorLevel.gripPoints[1],
  id: 'start-right-foot',
  x: buildingEditorLevel.playerSpawn.x + 22,
});

export const buildingEditorJob = {
  id: buildingEditorLevel.id,
  name: 'BUILDING EDITOR',
  client: 'Blank Test Arena · Build your own climb',
  pay: 0,
  href: '/building-editor',
  image: '/assets/jump-lab.svg',
  level: buildingEditorLevel,
};
