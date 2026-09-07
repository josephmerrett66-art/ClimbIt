'use client';
import Game from '../game';
import { towerLevel } from '@/lib/game/level';

export default function TowerJob() {
  return (
    <main className="climb-stage">
      <Game
        editing={false}
        initialLevel={towerLevel}
        onBack={() => {}}
        onPaid={() => {}}
      />
    </main>
  );
}
