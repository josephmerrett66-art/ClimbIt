'use client';
import Game from '../game';
import { EXTRA_JOBS } from '@/lib/game/extra-jobs';
const job = EXTRA_JOBS.find((job) => job.id === 'cable-car')!;
export default function JobPage() {
  return (
    <main className="climb-stage">
      <Game
        editing={false}
        initialLevel={job.level}
        onBack={() => {}}
        onPaid={() => {}}
      />
    </main>
  );
}
