# Campaign difficulty

The contact-scaled reach pass, first tuned on the railway, now runs on all nine
jobs, with a difficulty ramp across the campaign. No art, camera, collider,
objective or contact-data changes.

## The ramp

| # | job | reach `one` | layout floor | move target |
|---:|---|---:|---:|---:|
| 1 | Pub keys | 0.94 | 0.84 | 102 |
| 2 | Big Prawn | 0.92 | 0.88 | 125 |
| 3 | Surf club | 0.90 | 0.88 | 87 |
| 4 | Drive-in | 0.88 | 0.82 | 89 |
| 5 | Queenslander | 0.86 | 0.82 | 139 |
| 6 | Railway | 0.86 | 0.82 | 110 |
| 7 | Showground | **0.92** | 0.90 | 178 |
| 8 | Opal mine | **0.98** | 0.98 | 93 |
| 9 | Grandstand | 0.84 | 0.82 | 98 |

`one` is the reach multiplier while hanging from a single contact; `two` is
`one + 0.02` and pull force follows both (see `contactCurves`). The railway's
entry is the pass that was tuned and played, unchanged.

**Reach does not ramp all the way to the end, and the two bold rows are why.**
Each job's *layout floor* is the harshest `one` its own contact layout can take
without stranding a climber, measured rather than guessed. The showground floors
at 0.90 and the opal mine at 0.98 — its chute is almost entirely hand-only — so
both sit gentler than the jobs around them. Closing that gap means re-authoring
those spans with footholds or closer contacts, which is an art judgement on the
existing paintings, not a tuning one.

The move target escalates everywhere, including on those two, so the campaign
still tightens to the end. A move target can only cost money; it can never make
a climb impossible.

Discovery stays at 260 throughout. Being able to read the wall is what makes a
sequence plannable; taking it away later would make those jobs fiddly, not hard.

## Why the route driver could not tune this

`tests/route-driver.ts` was the obvious gate and it is the wrong tool. It commits
greedily to the nearest useful hold and never reconsiders, so under contact-scaled
reach its pass/fail is **chaotic rather than monotonic in difficulty**:

| job | completes at | falls at |
|---|---|---|
| drive-in | 0.84, 0.86, 0.88, 0.90, 0.92 | 0.94, 0.96 |
| railway | 0.86, 0.88, 0.90, 0.92 | 0.84, 0.94, 0.96 |
| pub | 0.99 | 0.84 through 0.98 |

A pass does not mean a tier is right and a failure does not mean it is too hard.
Roughly 200 route simulations went into establishing that, and none of it is
usable as difficulty evidence.

The driver is therefore run at unscaled reach and kept for what it does prove:
that each route's polyline, contacts, colliders, objective and return zone form
a climb that can be completed through ordinary gestures with fatigue live.

## What does gate the tiers

`tests/hang-spans.test.ts`, built on `tests/hang-driver.ts`.

A reach tier can only make a climb *impossible* in one place. Everywhere else a
player can plant a foot and win the reach back; on a hand-only span there is
nowhere to put one, so too harsh a tier stops a span being crossable at all.

The check hangs the climber from each hand-only contact in the live solver and
tries to catch a neighbour with the free hand, through the normal controls. A
contact counts as stranding only if no neighbour on either side can be caught
**and** no boot can find a foothold from there — because planting a foot is
exactly the escape the mechanic leaves open.

It responds monotonically, which is the property the route driver lacks:

| railway `one` | stranded contacts |
|---|---:|
| unconstrained | 0 |
| 0.86 (shipped) | 0 |
| 0.80 | 14 |
| 0.70 | 19 |

Calibration came from the railway: it is known good by play, and it measures
clean. Every job ships at a tier that strands nothing. The suite checks the
railway and the grandstand by default; `HANG_SPANS=all` runs all nine and takes
a few minutes.

## Magpie

The railway has a magpie, its territory centred on the station roof ridge at
scene (888, 237) in `lib/game/magpie.ts`. Placement is deliberate: the 285-unit
alert radius reaches the exposed y = 470 awning traverse but not the
ground-level spawn or the tower finish, so the bird commits while the climber is
hand-only across the middle of the route and leaves the crux alone.

It interacts with the reach pass. Taking the racket out releases a hand, which
drops the climber to two contacts and shortens every reach, and a landed swoop
knocks a grip loose.

### Flight pattern

**This part changes every magpie, not just the railway's.** The bird used to sit
on its roof, then a caption reading MAGPIE WATCHING YOU / MAGPIE TAKING OFF told
you what was coming. Both are gone. The flight is now the only tell:

| phase | what it looks like | can it hurt you |
|---|---|---|
| `patrol` | wide slow ellipse over its own territory | no |
| `stalk` | tighter, faster orbit around the climber | no |
| `feint` | a committed pass that crosses above your head | **no** |
| `dive` | the same shape, aimed at your head | **yes** |
| `recover` | climbs away | no |

Passes strictly alternate and every encounter opens with a `feint`, so the first
pass of any sequence is always the harmless one. Measured against a climber
parked on the traverse, the feint clears the head by 62 world units against a
hit radius of 20.5 — close enough to be alarming, wide enough to read as a miss.
The dive contacts.

Passes are launched on a fixed heading and flown ballistically rather than
homing, so a committed line can be read and moved out of, and the wide pass
stays visibly wide. Both kinds can be swatted with the racket, so reading the
wind-up is rewarded rather than merely survived.

The observed loop, with the climber standing still on the traverse:

```
stalk 2.4s -> feint 1.2s -> recover 1.2s -> stalk 1.3s -> dive -> recover
   -> patrol 5s cooldown -> repeat        (about 13s per cycle)
```

The audio cue fires on both kinds of pass, never on one alone — a sound that
distinguished a feint from a dive would just be the caption again.

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
