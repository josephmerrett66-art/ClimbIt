import type { makeClimb } from './campaign';

// Strategy pass, applied to the railway job only. Every other job keeps its
// existing reach, discovery and scoring exactly as it was.
//
// The change that matters is `contactReach`: reach and pull force now scale
// with how many limbs are still on holds (see CONTACT_REACH in climbing.ts).
// A hold that is within range from three points is out of range from two, so
// the player has to set their feet before releasing a hand. Nothing about the
// painting, camera, colliders or objective changes.
//
// `discoveryRadius` is widened because a sequence cannot be planned if only the
// next two holds are ever visible. `moveTarget` drives the efficiency bonus on
// the payout screen; resting forever is still possible, it just costs money.

export const RAILWAY_DISCOVERY = 260;
export const RAILWAY_MOVE_TARGET = 110;

export function configureRailway(job: ReturnType<typeof makeClimb>) {
  if (job.id !== 'signal-esky') return job;
  const level = job.level;
  level.contactReach = true;
  level.discoveryRadius = RAILWAY_DISCOVERY;
  level.moveTarget = RAILWAY_MOVE_TARGET;
  level.briefing =
    'Awning transfers, signal gantry, tower descent and the crossbeam. ' +
    'Your reach shortens as limbs leave their holds, so set your feet before ' +
    'you commit a hand. Fewer moves pay better.';
  return job;
}
