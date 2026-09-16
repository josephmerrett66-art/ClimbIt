import { contactCurves } from './climbing';
import type { Level } from './level';

// The campaign ramp. Every job now uses the contact-scaled reach introduced on
// the railway; what escalates is how hard the constraint bites and how tight
// the efficiency bonus is. Jobs are listed in the order the phone offers them.
//
// `one` is the reach multiplier while hanging from a single contact and `two`
// the multiplier on two; pull force follows from them (see `contactCurves`).
// The railway's entry is the pass that was tuned and played, and is left alone.
//
// `floor` is the harshest `one` that level's own contact layout can take
// without stranding a climber, measured by `tests/hang-driver.ts`. It is the
// hand-only traverses that set it: everywhere else a player can plant a foot
// and get their reach back, but on a hand-only span there is nowhere to put
// one, so too harsh a tier there makes a span uncrossable rather than hard.
//
// Two jobs cannot take the ramp their position calls for. The showground's
// hand-only spans bottom out at 0.90 and the opal mine's at 0.98 — the tightest
// in the game — so both sit gentler than the jobs around them. Closing that
// would mean re-authoring those spans with footholds or closer contacts, which
// is an art call on the existing paintings rather than a tuning one.
//
// `moves` is the target for the efficiency bonus, taken from the route driver's
// own move count on that level and then tightened along the campaign. It is the
// dial that escalates cleanly everywhere, because a move target can only cost
// money — it can never make a climb impossible.
//
// Discovery is 260 throughout rather than escalating. Being able to read the
// wall is what makes a sequence plannable at all; taking it away later would
// make those jobs fiddly rather than harder.
export const CAMPAIGN_DISCOVERY = 260;

export type DifficultyTier = {
  id: string;
  label: string;
  one: number;
  two: number;
  floor: number;
  moves: number;
};

export const CAMPAIGN_TIERS: DifficultyTier[] = [
  {
    id: 'pub-keys',
    label: 'Warm up',
    one: 0.94,
    two: 0.96,
    floor: 0.84,
    moves: 102,
  },
  {
    id: 'big-prawn-thong',
    label: 'Steady',
    one: 0.92,
    two: 0.94,
    floor: 0.88,
    moves: 125,
  },
  {
    id: 'surf-croc',
    label: 'Steady',
    one: 0.9,
    two: 0.92,
    floor: 0.88,
    moves: 87,
  },
  {
    id: 'drive-in-trolley',
    label: 'Committing',
    one: 0.88,
    two: 0.9,
    floor: 0.82,
    moves: 89,
  },
  {
    id: 'summer-santa',
    label: 'Committing',
    one: 0.86,
    two: 0.88,
    floor: 0.82,
    moves: 139,
  },
  {
    id: 'signal-esky',
    label: 'Hard',
    one: 0.86,
    two: 0.88,
    floor: 0.82,
    moves: 110,
  },
  // Held back by its layout, not by choice.
  {
    id: 'golden-bin-chicken',
    label: 'Hard',
    one: 0.92,
    two: 0.94,
    floor: 0.9,
    moves: 178,
  },
  // Held back hardest: the opal chute is almost entirely hand-only.
  {
    id: 'opal-disco',
    label: 'Serious',
    one: 0.98,
    two: 1,
    floor: 0.98,
    moves: 93,
  },
  {
    id: 'prize-pumpkin',
    label: 'Serious',
    one: 0.84,
    two: 0.86,
    floor: 0.82,
    moves: 98,
  },
];

const BY_ID = new Map(CAMPAIGN_TIERS.map((tier) => [tier.id, tier]));

export function tierFor(id: string) {
  return BY_ID.get(id);
}

export function applyDifficulty(level: Level) {
  const tier = BY_ID.get(level.id);
  if (!tier) return level;
  const curves = contactCurves(tier.one, tier.two);
  level.contactReach = curves.reach;
  level.contactForce = curves.force;
  level.discoveryRadius = CAMPAIGN_DISCOVERY;
  level.moveTarget = tier.moves;
  return level;
}
