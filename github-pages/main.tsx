import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Game from '@/app/game';
import { pubLevel } from '@/lib/game/pub-level';
import { AUSTRALIAN_JOBS } from '@/lib/game/australian-jobs';
import '@/app/globals.css';
import type { Level } from '@/lib/game/level';

const basePath = '/ClimbIt';
const route = location.pathname.replace(basePath, '').replace(/\/$/, '') || '/';
const legacy: Record<string, number> = {
  '/': 0,
  '/church': 1,
  '/tower': 2,
  '/lighthouse': 3,
  '/windmill': 4,
  '/chimney': 5,
  '/water-tower': 6,
  '/cable-car': 7,
};
const source =
  route === '/pub'
    ? pubLevel
    : (
        AUSTRALIAN_JOBS.find((job) => job.href === route) ??
        AUSTRALIAN_JOBS[legacy[route] ?? 0]
      ).level;
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
