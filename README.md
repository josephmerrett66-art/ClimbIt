# Odd Jobs — climbing game prototype

**[Play Odd Jobs in your browser](https://josephmerrett66-art.github.io/ClimbIt/)**

Holds use small surface-aligned edge highlights: nearby reachable edges appear while dragging, the actual catch target brightens, and a brief dust flick confirms attachment. Stable targeting prevents adjacent holds flickering under the pointer. Planting feet supports the hips; hanging from an arm leaves more weight and sway in the body. Catching a hold clears stored drag momentum.

Moving a foot requires at least one hand securely attached. Planted feet can support a stationary stance, but cannot pull the body up the wall or advance between holds by themselves. Losing the last hand during a foot step cancels that step and lets the free foot fall.

The church routes follow projecting buttresses, stone courses and roof coping, avoiding window glass. The tower routes follow its front ladder, structural beams and maintenance platforms. The tree's upper rescue branch follows the visible wood. Grips remain spaced for each character scale; no rope recovery is present.

Every map starts at 1.6× the previous camera zoom, framed on the climber immediately. The camera holds still during a limb drag and smoothly follows again after release. Portrait and landscape layouts keep the background covering the viewport.

On touchscreens, hands and feet have generous 88-pixel selection areas. Four compact limb selectors let you select a hand or foot and drag anywhere on the canvas to move it relative to your finger, keeping the artwork visible. Lifting your finger grabs a reachable edge. Interrupted gestures can safely reattach to a nearby reachable hold without awarding a repair or adding a fling.

The main page opens directly into a full-window climbing scene. The environment, climber and objective fill the viewport. A small handset button opens the in-game phone over the paused climb.

Drag a hand or boot onto the tree to climb. Keys 1–4 select individual limbs; R restarts the climb; F requests browser fullscreen. Pickles can still be carried in one hand. Gravity acts on the full body, and falling from the climb ends the job without payment.

The phone contains the Odd Jobs app and Common Cents online banking. Jobs launch eight full-screen routes directly. Completing a job opens an animated payment screen with the amount earned and the account balance before and after the deposit. Banking tracks the available balance, lifetime earnings, completed jobs and the remaining $12,000 career-pivot loan. The available balance can be transferred toward the debt.

The second full-window climb is available at `/church`. It uses a separate low-poly PNG environment and authored route up a stone church. Reaching the crooked cross with either hand straightens it in place.

The third climb is available at `/tower`. It follows the lattice, maintenance platforms and antenna braces of a telecommunications tower. Reaching the dead summit bulb replaces and illuminates it.

Five more jobs are available through the phone, each with its own low-poly background and summit repair:

| Route | Job | Payment |
| --- | --- | --- |
| `/lighthouse` | Restore the lighthouse beacon | $120 |
| `/windmill` | Repair the windmill drive | $95 |
| `/chimney` | Secure the chimney cap | $110 |
| `/water-tower` | Fix the water tower valve | $135 |
| `/cable-car` | Repair the cable-car signal | $150 |

Their holds follow the visible front service ladder rails. Repairs change the object in place and use the same payment screen and persistent banking system as the original jobs. All eight routes are included in both the Sites build and GitHub Pages build.

The developer workshop is retained separately at `/workshop`: import background/foreground PNGs, trace grips and edge/rectangle colliders, place spawn/objective/return-zone/camera geometry, play test, undo, save locally and export/reload portable JSON with embedded artwork.

## Run

Node 22.13+ and pnpm. `pnpm install`, then `pnpm dev`. `pnpm build` creates the Worker and client assets. `pnpm exec tsc --noEmit` checks types.

## Architecture

- `lib/game/physics.ts`: position-based weighted ragdoll with a physical torso frame, separate shoulder and hip joints, fixed bone lengths, limited endpoint reach, anchored grips, gravity, one-way elbow/knee hinges and ground-impact failure. Soft dragging, nearby-hold attraction and capped release momentum keep repositioning fluid while grip anchors remain precise.
- `lib/game/level.ts`: separate authored tree, church and tower level data plus JSON validation. Each level carries a calibrated player scale; generated grip spacing follows that scale so smaller characters receive proportionally denser holds.
- `lib/game/render.ts`: PNG background/foreground layers, a connected low-poly climber built from tapered faceted limbs, joint pieces, skin forearms, shaped hands and boots, torso, pelvis, face and hair, plus the low-poly cat PNG and editor overlays. The climber has no helmet, harness or visible rope, and gameplay geometry is invisible.
- `app/game.tsx`: fixed timestep, bounded camera, unified mouse/touch Pointer Events, persistent finances, the in-game phone and workshop tools. Gameplay covers the viewport, cropping the world rather than letterboxing it.
- `app/page.tsx`, `app/church/page.tsx` and `app/tower/page.tsx`: direct full-screen climbing entries, with no app shell.
- `app/workshop/page.tsx`: separate developer entry.

The complete carry-and-return system remains available to editor play tests. Normal routes stop on completion and present the payment screen; editor play tests do not award money.

## Validation

`pnpm exec jiti tests/controls.test.ts` checks camera coverage at portrait, landscape and desktop sizes for all eight maps, touch targeting, relative dragging and gesture cancellation.

`pnpm exec jiti tests/physics.test.ts` runs the original climb regressions. `pnpm exec jiti tests/extra-jobs.test.ts` verifies all five additional routes by moving limbs from their starting holds to their actual summit repair, including artwork/entry-point checks and the hand-support requirement.

Automated tests exercise ascent, branch traversal, actual cat pickup, three-limb descent, complete church and tower ascents, both repair objectives, gravity-driven fall failure, carrying lockout and JSON validation. Scale regression checks verify that body geometry, reach, collision radii, snap zones and nearest-hold spacing change together for each background. Hinge tests intentionally reverse both knees and rotate the body, then verify bend direction and unchanged leg segment lengths. Mouse/touch feel still needs hands-on tuning.

## Artwork

`public/assets/cat-tree.png` is built-in ImageGen artwork based on the supplied illustrated backyard concept. `public/assets/pickles.png` is a generated angular low-poly orange-and-white sitting cat, facing left, with a transparent background prepared from the generated sprite. Prompt: orange-and-white sitting cat, broad warm faceted planes, full body and curled tail, clean silhouette readable at game scale, no emoji, props, text, outline border, or background scenery.

`public/assets/church-cross.png` is built-in ImageGen artwork created for the second climb, with the church filling the playfield and readable routes formed by buttresses, masonry, windows, gutters and tower ledges. The generated background excludes the cross itself because the cross is rendered as the interactive repair object.

`public/assets/telephone-tower.png` is built-in ImageGen artwork for the third climb. The centered low-poly structure exposes a continuous ladder-and-lattice route, with wider platform detours and an empty lamp fitting at the summit. The bulb and its completion glow are rendered as the interactive object.

All three environment textures are stored at 2400×2000 while retaining a 1200×1000 gameplay coordinate system. This supplies 2× artwork resolution for high-density displays without moving the authored grips, collisions or objectives.

The five new scene assets and their generation prompts are documented in [docs/job-artwork.md](docs/job-artwork.md).
