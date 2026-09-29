'use client';
import { useRouter } from 'next/navigation';
import Game from '../game';
import { buildingEditorLevel } from '@/lib/game/building-editor';

export default function BuildingEditor() {
  const router = useRouter();
  return (
    <main className="climb-stage">
      <Game
        editing
        initialLevel={buildingEditorLevel}
        onBack={() => router.push('/')}
        onPaid={() => {}}
      />
    </main>
  );
}
