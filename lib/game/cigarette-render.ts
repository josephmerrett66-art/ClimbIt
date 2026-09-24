import type { Climber } from './physics';
import { existingCigaretteFor } from './cigarette';
import type { View } from './render';

export function drawCigarette(
  ctx: CanvasRenderingContext2D,
  g: Climber,
  view: View,
) {
  const moment = existingCigaretteFor(g);
  if (!moment) return;
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.scale(view.scale, view.scale);
  const s = g.scale;

  if (moment.puffs.length > 1) {
    ctx.beginPath();
    moment.puffs.forEach((puff, index) => {
      if (index === 0) ctx.moveTo(puff.x, puff.y);
      else {
        const previous = moment.puffs[index - 1];
        ctx.quadraticCurveTo(
          previous.x,
          previous.y,
          (previous.x + puff.x) / 2,
          (previous.y + puff.y) / 2,
        );
      }
    });
    const oldest = moment.puffs[moment.puffs.length - 1];
    const opacity = Math.max(0, 0.5 - oldest.age * 0.18);
    ctx.strokeStyle = `rgba(235, 239, 226, ${opacity})`;
    ctx.lineWidth = 3.2 * s;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  for (const puff of moment.puffs) {
    const radius = (1.4 + puff.age * 3.5) * s;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(238, 241, 230, ${Math.max(0, 0.3 - puff.age * 0.16)})`;
    ctx.fill();
  }

  if (g.cigaretteHand) {
    const hand = g.p[g.cigaretteHand];
    const tip = moment.tip();
    const angle = Math.atan2(tip.y - hand.y, tip.x - hand.x);
    ctx.save();
    ctx.translate(hand.x, hand.y);
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#161612';
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(1 * s, 0);
    ctx.lineTo(12 * s, 0);
    ctx.stroke();
    ctx.strokeStyle = '#f4eddb';
    ctx.lineWidth = 3 * s;
    ctx.stroke();
    ctx.strokeStyle = '#b87948';
    ctx.beginPath();
    ctx.moveTo(1 * s, 0);
    ctx.lineTo(4.5 * s, 0);
    ctx.stroke();
    ctx.fillStyle = moment.smoking ? '#ffb13b' : '#d96835';
    ctx.beginPath();
    ctx.arc(12 * s, 0, (moment.smoking ? 2.1 : 1.5) * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
