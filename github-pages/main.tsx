import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Game from '@/app/game';
import { EXTRA_JOBS } from '@/lib/game/extra-jobs';
import '@/app/globals.css';
import {
  catLevel,
  churchLevel,
  towerLevel,
  type Level,
} from '@/lib/game/level';

const basePath = '/ClimbIt';
const route = location.pathname.replace(basePath, '').replace(/\/$/, '') || '/';
const source =
  EXTRA_JOBS.find((job) => job.href === route)?.level ??
  (route === '/church'
    ? churchLevel
    : route === '/tower'
      ? towerLevel
      : catLevel);
const level = structuredClone(source) as Level;

for (const key of ['backgroundImage', 'foregroundImage'] as const) {
  const asset = level[key];
  if (asset?.startsWith('/')) level[key] = `${basePath}${asset}`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="climb-stage">
      <Game
        editing={false}
        initialLevel={level}
        basePath={basePath}
        onBack={() => {}}
        onPaid={() => {}}
      />
    </main>
  </StrictMode>,
);
