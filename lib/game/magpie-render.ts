import type { Climber } from './physics';
import { magpieFor } from './magpie';
import type { View } from './render';
export function drawMagpie(
  ctx: CanvasRenderingContext2D,
  g: Climber,
  view: View,
) {
  const encounter = magpieFor(g);
  if (!encounter) return;
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.scale, view.scale);
  const s = g.scale;
  if (g.racketHand) {
    const hand = g.p[g.racketHand],
      tip = encounter.racketTip();
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(Math.atan2(tip.y - hand.y, tip.x - hand.x));
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111913';
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(27 * s, 0);
    ctx.stroke();
    ctx.strokeStyle = '#c58944';
    ctx.lineWidth = 3 * s;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(38 * s, 0, 17 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e9e6c54d';
    ctx.fill();
    ctx.strokeStyle = '#101812';
    ctx.lineWidth = 4 * s;
    ctx.stroke();
    ctx.strokeStyle = '#e4bb62';
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = '#eee7c6';
    ctx.lineWidth = 0.7 * s;
    for (let i = -15; i <= 15; i += 5) {
      ctx.beginPath();
      ctx.moveTo((38 + i) * s, -14 * s);
      ctx.lineTo((38 + i) * s, 14 * s);
      ctx.moveTo(20 * s, i * s);
      ctx.lineTo(56 * s, i * s);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }
  if (encounter.phase !== 'defeated') {
    ctx.save();
    ctx.translate(encounter.bird.x, encounter.bird.y);
    ctx.rotate(encounter.rotation);
    ctx.scale(s * encounter.direction, s);
    const poly = (points: number[][], fill: string) => {
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = '#101411';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.stroke();
    };
    const flying = !['waiting', 'warning'].includes(encounter.phase);
    const flap = flying
      ? Math.sin(encounter.time * 18) * 17
      : encounter.phase === 'warning'
        ? Math.sin(encounter.time * 10) * 8
        : 2;
    poly(
      [
        [-12, 1],
        [-31, 9],
        [-24, 13],
        [0, 10],
      ],
      '#151a1d',
    );
    poly(
      [
        [-3, 0],
        [-15, -18 - flap],
        [6, -10 - flap],
        [16, 1],
      ],
      '#252f34',
    );
    poly(
      [
        [-16, 0],
        [-6, -10],
        [13, -7],
        [20, 4],
        [7, 13],
        [-9, 10],
      ],
      '#20272b',
    );
    poly(
      [
        [-4, -8],
        [6, -8],
        [9, 7],
        [0, 6],
      ],
      '#f1f1de',
    );
    poly(
      [
        [-5, 1],
        [-19, 23 + flap],
        [5, 13 + flap],
        [11, 1],
      ],
      '#131c22',
    );
    poly(
      [
        [0, 3],
        [-8, 12 + flap / 2],
        [2, 10 + flap / 2],
        [8, 1],
      ],
      '#e6e9dd',
    );
    poly(
      [
        [10, -6],
        [14, -14],
        [25, -12],
        [29, -3],
        [20, 5],
      ],
      '#1b2227',
    );
    poly(
      [
        [26, -7],
        [39, -1],
        [27, 1],
      ],
      '#a1aca8',
    );
    ctx.fillStyle = '#bb6a45';
    ctx.beginPath();
    ctx.arc(23, -8, 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (!flying) {
      ctx.strokeStyle = '#151813';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2, 10);
      ctx.lineTo(-4, 17);
      ctx.lineTo(-9, 18);
      ctx.moveTo(7, 10);
      ctx.lineTo(8, 17);
      ctx.lineTo(13, 18);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  if (encounter.phase === 'warning' || encounter.phase === 'approach') {
    const x = ctx.canvas.width / ctx.getTransform().a / 2;
    ctx.save();
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    // Warning remains readable even if the perched bird is near a screen edge.
    ctx.fillStyle = '#17271eee';
    ctx.fillRect(x - 145, 74, 290, 52);
    ctx.fillStyle = '#ffe39b';
    ctx.fillText(
      encounter.phase === 'warning'
        ? 'MAGPIE WATCHING YOU'
        : 'MAGPIE TAKING OFF',
      x,
      96,
    );
    ctx.font = '12px Arial';
    ctx.fillText('Brace, move, or ready your racket', x, 115);
    ctx.restore();
  }
}
