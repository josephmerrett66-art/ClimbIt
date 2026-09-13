'use client';
import Game from '../game';
import { AUSTRALIAN_JOBS } from '@/lib/game/australian-jobs';
const job = AUSTRALIAN_JOBS.find((job) => job.href === '/railway')!;
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
