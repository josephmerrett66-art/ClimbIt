# Opal climbing prototype

Only Disco at the opal mine enables `Level.fatigue`. Other jobs retain their
existing routes, mechanics and hold display. No art, camera, phone, money or story
changes are required by the prototype.

## Tuning

`lib/game/climbing.ts` contains the `CLIMBING` configuration. Stamina is independent
for each limb (100 initially). Rates are points per second, not frame counts.
Hand drain is 7.5, foot drain 0.85, unloaded recovery 7, lightly loaded recovery up
to 5. Recovery tapers to zero at 14% estimated load. Loaded drain scales with
load to power 1.25. Stages are fresh >=70, warm >=45, tired >=25, critical >=10,
failing below 10. At zero, a loaded grip releases into the existing physics.
An unloaded exhausted limb can recover and catch again; there is no reset or
artificial cooldown. Holding one hand while shaking the other out still costs
more stamina than it restores when the hands carry the whole body.

Loads are estimates, not measured physical forces. The existing Verlet solver
includes muscle corrections, so its correction impulses are unsuitable as raw
force measurements. We use the pelvis as the body-weight proxy: feet below it,
leg extension, lateral alignment and distinct contact positions determine leg
support. Arms share the remaining load with a reach penalty. Awkward feet incur
extra tension. Boots on a single point do not count as a broad resting stance.
Standing on different good contacts can restore arms, while the legs keep working.

Colour blends continuously; deterministic tremble affects drawn knees/elbows
only. Grab geometry, touch tolerances, cursor guidance and physics points are
unchanged. Stamina stops when the game is paused by its existing phone/payout flow.

## Discovery

Small cream timber-edge hints fade in within 190 × playerScale world units of
the midpoint between pelvis and neck, including while no limb is selected.
Selecting a limb brightens usable holds within its existing reach. Actual snap
preview is strongest. Discovery never expands reach or permits an invalid grip.
Fade time is 0.22 seconds. The whole map is visible only in editor/debug views.

F2 toggles developer diagnostics: limb stamina/stage, estimated loads, all hold
locations and the body discovery radius. No stamina bars appear in normal play.

## Route setting

`lib/game/opal-challenge.ts` owns 62 individually authored contacts, replacing
165 generated contacts (62% fewer). Coordinates refer to the original 1586 × 992
painting and are normalized once alongside the background.

- Start: lower-left upright; establish feet and rise to the chute.
- First commitment: underside of the long lower chute; release the trailing boots.
- First rest: post below the small left platform. Two different low foot contacts
  let the arms recover. A lower brace is available if the entry is missed.
- Middle chute: angled timber to the central landing and its post braces.
- Bridge: short hand-only transfer to the next upright.
- Crux: upper horizontal timber crossing; arrive with fresh arms and get feet
  onto the far post after the traverse.
- Gantry: follow the upper chute; release overly high/trailing feet before the turn.
- Final commitment: exposed right tower. Its crossbeam provides recovery options.
- Finish: roof beam hands and landing feet, then hold the disco-ball hanger until
  the existing repair completes.

The lower contacts are recovery grips, not checkpoints or teleport destinations.
Missing everything still invokes the existing fall/failure system.

## Verification

`tests/climbing.test.ts` checks load sharing, efficient/awkward stance recovery,
independent grip failure, cascading load, time-based rates, idle discovery, fade,
unchanged reach, visual-only tremble and isolation of other jobs.
`tests/opal.test.ts` checks an actual settled resting stance with physics running,
unique holds and density. `tests/australian.test.ts` traverses all eight jobs
through begin/step/end controls and completes each repair. The opal driver uses
quicker gestures, tries committed reaches and releases high trailing feet; it
does not disable fatigue, teleport or insert grips. Existing pub, physics, touch,
camera and story regression suites remain in use. Human mastery/difficulty still
needs tuning from play sessions; automated completion proves a route is feasible,
not that its difficulty is final.
