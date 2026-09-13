'use client';
import Game from '../game';
import { pubLevel } from '@/lib/game/pub-level';
export default function Pub() {
  return (
    <main className="climb-stage">
      <Game
        editing={false}
        initialLevel={pubLevel}
        onBack={() => {}}
        onPaid={() => {}}
      />
    </main>
  );
}
