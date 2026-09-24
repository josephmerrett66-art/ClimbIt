# The Gantry — jump lab design notes

`/jump-lab` used to be six beacons in a zig-zag, each one in easy range of the
last. It was the right shape for proving the dyno worked and the wrong shape for
finding out whether the dyno is interesting. This is the rebuild.

The level is `lib/game/jump-lab.ts`. Everything below is re-derived by
`tests/jump-lab.test.ts`, so if a number here and the level disagree, the test
fails rather than the wall quietly changing shape.

## What the jump can actually do

Three constants in `lib/game/jump.ts` set the whole envelope, at `scale = 0.9`:

| | |
| --- | --- |
| horizontal speed | `10.5 * scale` = 9.45px per frame at full charge |
| flight length | clamped to 9–30 frames |
| catch radius | `64 * scale` = 57.6px from the leading hand |
| charge → power | `power = 0.56 + charge * 0.44`, scaling **both** vx and vy |

Measured reach, full charge:

```
max rise by distance        dx=100 → 185px   dx=200 → 235px   dx=300 → 250px
```

Two things about that table are worth knowing before authoring anything.

**Straight up is the one direction the mechanic cannot go.** A big rise needs
horizontal distance to buy the flight time, so tall, narrow gaps are impossible
in a way tall, wide ones are not.

**The 30-frame clamp is not the range limit it looks like.** Past 30 frames the
body keeps flying and falling, so a long flat jump can still be caught on the
way down. The first draft of this level had a 387px dyno from the opening ledge
straight onto the roof-crawl beacon, skipping two whole sections, and that is
how it worked.

## Why full charge is almost always right

`takeOff()` aims the arc at the target and then scales it by power. At power 1
the arc passes through the hold; at anything less it undershoots along the same
launch angle. So for most spans the charge meter changes *how far*, never
*whether*, and the optimal play is to hold it down every time.

That is what the roof crawl exists to break. Apex height scales with power², so
a ceiling turns the meter into a real decision:

```
pad-roof → land-roof, dx=250, dy=-20, slab 45px above the launch

power  charge   peak   miss   result
1.00    100%    56.0   13.2   hits the slab
0.90     77%    45.7   16.3   hits the slab
0.86     68%    40.9   31.6   fits, catches
0.82     59%    38.6   39.5   fits, catches
0.78     50%    34.6   52.4   fits, catches
0.70     32%    28.2   80.4   fits, falls short
```

The window is roughly half to three-quarter charge. It is the only place in the
game where the meter decides whether a jump lands.

## The grammar

The wall has exactly two kinds of hand hold:

- **Pads** (9 of them) are wide, always lit, take both hands, and are the only
  holds the jump accepts as a landing target.
- **Notches** (29) take one limb and can never launch anything.

This is not decoration. Ordinary hand holds are matchable by default in this
engine, and *a matchable hold beside a foothold is a launch pad whether it was
meant to be one or not*. Making every connective hold a notch is what makes the
route a route instead of a field of launch sites. The test asserts that the set
of matchable holds and the set of beacons are the same set.

## The five sections

| # | Section | What it tests | The span |
| --- | --- | --- | --- |
| 1 | The Feint | reading pads vs notches | — |
| 2 | The Roof Crawl | charge control under a slab | +250, −20 |
| 3 | The Blind Catch | one-handed recovery, hand-only exit | +230, −215 |
| 4 | The Fork | reading footholds before committing | −300, −25 / +100, −135 |
| 5 | The Belay Ledge | the carry, and what it takes away | +180, +30 |

**1 — The Feint.** The opening stance is two separate notches, so the ground is
the one place on the wall where a jump can never begin. The line straight
overhead is the obvious continuation and dead-ends at a notch; the way on is a
traverse right and slightly downhill, away from every beacon in sight.

**2 — The Roof Crawl.** Above.

**3 — The Blind Catch.** Near the ceiling of what the mechanic can do, onto a
beacon with **no foothold anywhere in leg range** — `land-high` is the one pad
that cannot launch, and that is the section rather than an oversight. The catch
leaves one hand on the pad and both boots swinging over nothing, and the only
way off is 175px of hand-only climbing to `pad-fork`. Hand-only spans are the
one place contact-scaled reach can genuinely strand a climber (see
`docs/campaign-difficulty.md`), which is why the steps are 29px against a
61.8px one-contact reach.

**4 — The Fork.** Two beacons, both matchable, both in range. Left is a long
flat 300px dyno back across the void; right is a short steep one. The left one's
footholds sit 205px beneath it, far outside any leg reach, so that pad cannot
launch again — and nothing else connects to it. It is a commitment, not a hidden
trap: the boot rail is drawn like every other and is plainly too far down. The
question the fork asks is whether you read footholds before you read beacons.

**5 — The Belay Ledge.** The tool sits across a 180px gap. A dyno crosses it in
one move; a line of notches crosses it in six, and the move target prices the
difference. Coming back, the dyno is gone: carrying occupies a hand permanently
(`begin()` refuses to move the carrying limb), and one hand can never match a
pad. The notch line is the only way home, walked with both boots planted and one
hand moving at a time, and it was in plain sight the whole climb.

## Tuning dials

| Setting | Value | Effect |
| --- | --- | --- |
| `contactReach` | `contactCurves(0.88, 0.92)` | one-contact reach 61.8px; sets the hand-only exit's difficulty |
| `discoveryRadius` | 300 | read the next two moves; beacons ignore it and stay lit |
| `moveTarget` | 74 | walking the objective gap costs most of the bonus |
| roof slab `y` | 1095 | 45px of clearance; raise it to widen the charge window |
| `fatigue` | on | the hand-only exit and the carry are both on a clock |

Beacons are exempt from the discovery fade deliberately. Being able to see the
landing options from a distance is what lets the fork be a decision rather than
trial and error; it is the small stance holds that have to be earned by getting
close.

## Known tuning calls

- **The fork's dead end ends the run.** Landing there means restarting. The tell
  is visible and the level is short, but softening it means either giving that
  pad a foothold (which removes the decision) or adding an escape line (which
  removes the commitment).
- **`land-summit → land-ledge` is a legal shortcut** that skips the summit
  ladder for one hard dyno. It is allowed on purpose — that is the efficiency
  bonus doing its job — and the test whitelists it explicitly rather than by
  accident.
- **The roof slab is the number most likely to want a nudge.** The arc maths
  here tracks the hand pair, which is the highest part of the body at take-off,
  but the real flight pose is solved by the ragdoll. If full charge turns out to
  squeak under the slab in play, lower `roof-slab.y`; the test prints the
  measured peak when it fails.
