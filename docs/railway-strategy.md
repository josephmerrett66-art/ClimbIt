# Railway strategy pass

A movement-strategy pass applied to the railway job (`signal-esky`) only. No art,
camera, collider, objective, contact or story changes. Every other job keeps its
previous reach, discovery radius and payout exactly as before; the opt-in is the
`contactReach`, `discoveryRadius` and `moveTarget` fields on the level.

## Why

Measured against the shipped contact data, hand reach is 78 × 0.82 = 64 world
units and the median gap between contacts is 37, with a median of 3 contacts
within reach of any contact — predecessor plus successor. Combined with a
`reach()` that returned a constant regardless of stance, this meant body position
never constrained what was reachable and the order limbs were moved in never
mattered. The climb was an execution test, not a sequence puzzle.

The reference point is Klifur, whose designer constrains reach by contact count
for exactly this reason: it "enables much more interesting level design". Klifur
also scores routes on move efficiency, and always leaves a safe position rather
than punishing with dead ends.

## What changed

### Contact-scaled reach and pull force

`lib/game/climbing.ts` adds two curves indexed by the number of *other* limbs
still on holds:

| other limbs on holds | reach × | pull force × |
|---:|---:|---:|
| 3 | 1.00 | 1.00 |
| 2 | 0.88 | 0.92 |
| 1 | 0.86 | 0.85 |
| 0 | 0.86 | 0.85 |

With all four points on, reach is unchanged at 64. Let a limb go and every reach
shortens, so feet have to be set before a hand is committed.

Established grips and the overextension check use `baseReach()`, the unscaled
anatomical value, so shifting one limb never pops a hold the climber is already
on. The opening stance is also established at base reach, before any limb is on a
hold.

### Tuning limit

The railway's three hand-only awning traverses (y = 626, 550 and 470 in source
pixels) are the binding constraint. Hanging from one hand puts the shoulder well
below the hold line, so the free hand is already near its limit before any
penalty. The route driver clears the level at 0.85 and above and falls at 0.84,
and the band 0.85–0.90 passes consistently, so **0.86 is the strongest stable
setting for the current contact layout**.

Pushing the constraint harder needs those traverses re-authored with real
footholds. The scene's existing "no floating footholds between awnings" rule
rules that out without an art judgement, so it is deliberately left alone.

Densifying the hand contacts on those spans from 44 to ~30 units was tried and
reverted: it allowed a slightly harsher 2-contact value but was not needed at
0.86, and it would have worked against the density reduction in
`docs/campaign-climbing.md`.

### Discovery

`CLIMBING.discoveryRadius` is now overridable per level. The railway uses 260
rather than 190, because a sequence cannot be planned when only the next two
holds are ever visible. Discovery still never extends reach or permits an invalid
grip.

### Efficiency pay

`lib/game/scoring.ts` adds a sliding bonus on levels that set `moveTarget`. A
move is a grip caught. The railway targets 110 moves and pays $2 per move saved,
capped at $80 on a $290 job.

This is the fix for free resting. Getting both feet under you drops the hands to
about 0.04 estimated load, below `minimumLoad`, so they recover at up to 4.5/s
with no clock and no cost — "move one limb, rest to full, repeat" was strictly
optimal. Rather than draining rests or adding a timer, dithering now costs money.
The bonus slides to zero instead of passing a threshold, so there is no move
count that suddenly feels unfair.

A live move counter shows during the climb; the payout screen reports the move
count and the bonus.

**The move target is the one number here that has not been playtested.** The
route driver takes 141 moves, but it brute-forces every limb each cycle and is
not a proxy for a human. 110 is a provisional figure chosen to sit under that.

## Verification

`tests/railway-strategy.test.ts` checks the opt-in (and that the pub and the
other seven jobs are untouched), that reach increases strictly with contact
count and matches the tuning curve, that three contacts equals base reach, that
established grips are judged at base reach, that a non-opted-in level ignores
contact count, and the bonus curve including its zero and cap.

`tests/australian.test.ts` remains the feasibility gate and still completes the
railway through ordinary begin/move/step/end gestures with fatigue live. The
existing campaign, opal, pub, physics, controls, route-moments and story suites
are unchanged and still pass. `tests/magpie.test.ts` fails identically before and
after this branch; it is unrelated and uses the pub level.

## Not done

Deliberately left for after a play session, since they depend on how the reach
constraint actually feels:

- Re-authoring the route as a chain of short problems between real rests.
- Safe-versus-risky variants within each section.
- Wider move spacing on the harder sequences.
- Letting the body swing. `move()` caps drag velocity at 14 × scale and `end()`
  damps the release impulse to 0.38; Klifur treats momentum as its highest skill
  expression, but that suppression looks deliberate here and is the change most
  likely to destabilise the solver.
