import type { makeClimb, RouteCorner } from './campaign';
import type { Grip } from './level';
import contacts from './campaign-contacts.json';
import { configureOpal } from './opal-challenge';

// Explicit contacts traced onto the existing paintings, in source-image pixels.
// No random deletion, automatic gap filling or dense runtime route generation.
export function configureCampaign(job: ReturnType<typeof makeClimb>) {
  if (job.id === 'opal-disco') return configureOpal(job);
  const plan = contacts[job.href.slice(1) as keyof typeof contacts];
  if (!plan) return job;
  // Record the natural intermediate stances in the route specification too.
  // They are ordinary contacts, never checkpoints or auto-rest triggers.
  const expanded: RouteCorner[] = [job.route[0]];
  for (let i = 1; i < job.route.length; i++) {
    const a = job.route[i - 1],
      b = job.route[i];
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      length = dx * dx + dy * dy;
    const along = plan.rests
      .map(
        ([x, y]) => [(x * 1600) / 1586, (y * 1000) / 992] as [number, number],
      )
      .map((p) => ({
        p,
        t: length ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length : 0,
      }))
      .filter(
        ({ p, t }) =>
          t > 0.01 &&
          t < 0.99 &&
          Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t) < 1,
      )
      .sort((x, y) => x.t - y.t);
    for (const { p } of along) expanded.push([p[0], p[1], b[2]]);
    expanded.push(b);
  }
  job.route = expanded;
  job.level.fatigue = true;
  job.level.gripPoints = plan.contacts.map(
    ([x, y, use], i): Grip => ({
      id: `${job.id}-contact-${i}`,
      x: (Number(x) * 1600) / 1586,
      y: (Number(y) * 1000) / 992,
      use: use === 'H' ? 'hand' : use === 'F' ? 'foot' : undefined,
      surface: 'trim',
    }),
  );
  job.level.briefing = `${plan.design} Nearby edges reveal around your body. Rest tired arms by getting both feet underneath you.`;
  return job;
}
