'use client';
import Game from './game';
export default function Home() {
  return <main className="climb-stage"><Game editing={false} onBack={() => {}} onPaid={() => {}} /></main>;
}
