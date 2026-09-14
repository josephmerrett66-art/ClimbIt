# Choosing the next move

This pass keeps the shared stamina settings and adds a few specific movement
sequences to each job. `lib/game/route-moments.ts` describes their scene positions.

- **Narrow hand sequences:** selected edge contacts accept one limb at a time.
  The player must pass the trailing hand to a different contact instead of
  matching both hands at every step. Contacts are spaced for alternating reaches,
  with a wide exit for changing hands or reorganising the body.
- **Separate boot placements:** selected bracing contacts accept one boot. Both
  feet cannot stack on the same small support; the player has to choose the
  second foot position before moving a loaded hand.
- **Recovery on the opal mine:** the lower post below the first landing now
  accepts a hand as well as a boot, providing a catch after a missed traverse.
  This uses ordinary grip physics and is not a checkpoint or automatic catch.

The prawn introduces the narrow sequence on its lower kiosk traverse, before a
post stance. The pub alternates between narrow gutter contacts, a split-foot
post rest and a reverse cornice. Surf club uses two short eave sequences; drive-in
uses the central steel frame. Queenslander and showground use reverse traverses.
Railway focuses on the tower crossbeam, grandstand on the booth transfer, and
opal on its chute and upper horizontal crossing.

## Visual and control rules

A short cream notch indicates a single-limb contact. Normal wider edge marks
retain matching and resting. Both use the existing body-proximity fades.
An occupied notch cannot advertise a valid snap for another limb. Attempting it
shows a short explanation; moving the occupying limb makes it available at once.
There are no handedness locks, cooldowns, random failures or changed reach radii.

Aim assistance now gives priority to the nearby contact the player explicitly
aims at. The previous hysteresis could keep attracting a hand to its old grip
when contacts were close. An aimed contact still has to be physically reachable
before it can snap.

## Verification

`tests/route-moments.test.ts` checks occupancy, immediate release, ordinary wide
hand matching, distinct boot contacts, aim priority and level import validation.
The campaign route driver tries the trailing hand first when these sequences are
present, using normal begin/move/end controls and the same live fatigue physics.
Full-route tests and the existing rest, camera, touch, story and failure suites
remain the feasibility checks. No stamina values or poses are injected by the
route driver.
