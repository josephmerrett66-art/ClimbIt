import assert from 'node:assert/strict';
import { artworkFrame, resizeArtwork } from '../lib/game/artwork';
import { buildingEditorLevel } from '../lib/game/building-editor';
import { parseLevel } from '../lib/game/level';

const level = structuredClone(buildingEditorLevel);
const before = structuredClone(level);
resizeArtwork(level, 150);
const frame = artworkFrame(level);
assert.equal(frame.width, before.worldWidth * 1.5);
assert.equal(frame.height, before.worldHeight * 1.5);
assert.equal(frame.x + frame.width / 2, before.worldWidth / 2);
assert.equal(frame.y + frame.height, before.worldHeight);
assert.deepEqual(level.gripPoints, before.gripPoints);
assert.deepEqual(level.playerSpawn, before.playerSpawn);
assert.equal(level.playerScale, before.playerScale);
assert.deepEqual(parseLevel(JSON.stringify(level)).backgroundFraming, frame);
resizeArtwork(level, 100);
assert.deepEqual(artworkFrame(level), {
  x: 0,
  y: 0,
  width: before.worldWidth,
  height: before.worldHeight,
});
level.backgroundFraming = { y: -200, height: 4000 };
resizeArtwork(level, 200);
assert.equal(artworkFrame(level).y + artworkFrame(level).height, 3800);
assert.throws(() =>
  parseLevel(
    JSON.stringify({ ...level, backgroundFraming: { y: 0, height: -1 } }),
  ),
);
console.log(
  'PASS artwork scaling, fixed ground anchor, unchanged holds/player, legacy framing and export round trip',
);
