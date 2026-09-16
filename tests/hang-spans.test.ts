import assert from 'node:assert/strict';
import { AUSTRALIAN_JOBS } from '../lib/game/australian-jobs';
import { pubJob } from '../lib/game/pub-level';
import { strandedContacts } from './hang-driver';

// Contact-scaled reach can only make a climb impossible in one place: a
// hand-only span, where there is no foot to plant and no way to get the reach
// back. This checks every hand-only contact on a job still lets the free hand
// reach something, with the ordinary controls and the live solver.
//
// The route driver cannot stand in for this. Its greedy hold choice makes its
// pass/fail chaotic rather than monotonic in difficulty — the drive-in
// completes at 0.84 and falls at 0.94 — so it reports neither feasibility nor
// difficulty for this mechanic. This does respond monotonically: the railway
// strands nothing from 0.82 up, 14 contacts at 0.80 and 19 at 0.70.
//
// Each job is simulated hold by hold, so the full sweep takes minutes. By
// default it checks the railway (the tuned reference) and the grandstand (the
// harshest tier); set HANG_SPANS=all for the whole campaign.
const jobs = [pubJob, ...AUSTRALIAN_JOBS];
const selected =
  process.env.HANG_SPANS === 'all'
    ? jobs
    : jobs.filter((job) => ['signal-esky', 'prize-pumpkin'].includes(job.id));

for (const job of selected) {
  const stranded = strandedContacts(job.level);
  assert.deepEqual(
    stranded,
    [],
    `${job.id} strands ${stranded.length} contact(s) at its tier: ${stranded.join(', ')}`,
  );
  console.log(`  ${job.id}: no stranded contacts`);
}

console.log(
  `PASS hand-only spans crossable on ${selected.length} job(s)` +
    (process.env.HANG_SPANS === 'all' ? '' : ' (HANG_SPANS=all for all nine)'),
);
