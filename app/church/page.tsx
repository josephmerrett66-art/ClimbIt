'use client';
import Game from '../game';
import { churchLevel } from '@/lib/game/level';

export default function ChurchJob() {
  return (
    <main className="climb-stage">
      <Game
        editing={false}
        initialLevel={churchLevel}
        onBack={() => {}}
        onPaid={() => {}}
      />
    </main>
  );
}
