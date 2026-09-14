# Campaign climbing pass

All nine jobs on the phone now enable the same load-based limb fatigue,
body-proximity hold discovery, gradual limb tint, visual-only tremble and
individual grip failure introduced on the opal mine. Retired URLs remain aliases
to the current Australian jobs. Backgrounds, camera, character shape, grab
radii, touch controls, phone, story and finances are unchanged.

## Harsher shared tuning

`lib/game/climbing.ts` remains the single tuning area. Compared with the first
opal prototype:

| Setting | Before | Now |
|---|---:|---:|
| Loaded hand drain | 7.5 | 9.5 |
| Loaded foot drain | 0.85 | 1.1 |
| Fully unloaded recovery | 7 | 5.5 |
| Maximum light-load recovery | 5 | 4.5 |

Rates are stamina points per second before load scaling. Hands under a full
body-weight load exhaust in about 10.5 seconds, or sooner when overextended.
This is 27% faster drain; it is not a global countdown. Recovery still requires
unloading the individual limb. Feet remain substantially more efficient than
hands. There are no accuracy penalties or random shake forces.

F2 shows stamina, stage and estimated load on any job. Normal play uses body
colour and the nearby cream edge hints, without permanent stamina bars.

## Authored contacts

The seven newly revised scene layouts are stored in
`lib/game/campaign-contacts.json`. `contacts` are source-image coordinates;
`H` means hand-only and `F` foot-only. Unlabelled corners accept either limb.
`rests` document actual post/ledge stances for route planning and regression
checks. They do not grant stamina or trigger gameplay actions. The opal and pub
keep their separate scene-specific definitions.

| Job | Previous contacts | Revised contacts | Main challenge and rests |
|---|---:|---:|---|
| Pub keys | 102 | 74 | Gutter commitments, two verandah posts, reverse cornice and parapet |
| Big Prawn | 169 | 79 | Kiosk gutters, tail turn, shell ridge and antenna; upright and tail rests |
| Surf club | 134 | 80 | Long eave traverse broken by real verandah posts; exposed flagpole finish |
| Drive-in | 203 | 104 | Staggered steel platforms and vertical transitions; rests at their uprights |
| Queenslander | 227 | 110 | Porch traverse, reversal, gable turn and final roof commitment |
| Railway | 194 | 96 | Awning transfers and tower descent/crossbeam/re-ascent, with post stances |
| Showground | 314 | 147 | Reverse cornice and tower bridge; lower braces allow recovery |
| Opal mine | 165 | 62 | Existing sparse prototype layout, now with harsher shared fatigue |
| Grandstand | 191 | 93 | Ticket booth and long eave, real posts at the midpoint, final booth transfer |

Contacts remain on the painted posts, structural edges and braces. The pub was
already relatively sparse, so its reductions are smaller; its extra intermediate
foot stances make the long first gutter manageable with the tougher stamina.

## Validation

The campaign route driver uses actual begin/move/step/end gestures, including
searching for a nearer hold after an overreach, releasing trailing feet, and
moving feet into efficient stances before waiting to recover. It never teleports
the climber, inserts holds, refills stamina, or turns fatigue off. The separate
stance fixtures in `tests/campaign-design.test.ts` validate load/recovery on real
scene contacts with the physics solver running, independently of the route test.
That suite also checks bounds, unique points, substantially reduced density,
all-job opt-in and the tougher rates.

Full-route completion is a feasibility check, not a claim about mastery time.
Player feedback should guide future tuning of specific moves and rest spacing.
