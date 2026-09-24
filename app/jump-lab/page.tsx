'use client';
import Game from '../game';
import { jumpLabLevel } from '@/lib/game/jump-lab';

export default function JumpLab() {
  return (
    <main className="climb-stage">
      <Game
        editing={false}
        initialLevel={jumpLabLevel}
        onBack={() => {}}
        onPaid={() => {}}
      />
    </main>
  );
}
