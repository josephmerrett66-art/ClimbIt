# Odd Jobs — climbing game prototype

**[Play Odd Jobs in your browser](https://josephmerrett66-art.github.io/ClimbIt/)**

## Australian jobs

The game opens on **De-thong the Big Prawn**. The phone contains eight entirely new Australian maps plus the established pub climb. Every new scene has original artwork and an authored route following real posts, gutters, roof edges and structural braces. Hand-only traverses require releasing and repositioning boots; corners and stepped roofs change the direction of the climb. Only subtle contextual edge marks are visible during play.

| Route | Job | Payment |
| --- | --- | --- |
| `/prawn` | De-thong the Big Prawn | $220 |
| `/surf-club` | A croc above the surf club | $240 |
| `/drive-in` | Trolley at the drive-in | $280 |
| `/queenslander` | Santa has heatstroke | $250 |
| `/railway` | Last drinks at platform two | $290 |
| `/showground` | Crown the bin chicken | $310 |
| `/opal-mine` | Disco at the opal mine | $340 |
| `/grandstand` | The pumpkin has won | $360 |
| `/pub` | Keys on the pub roof | $180 |

Keep one hand and a foot planted, hold the free hand on the small job marker until its bar fills, then release. A brief touch does not award the job or prevent catching a nearby hold. Completion opens the payment screen and updates Common Cents banking and the remaining career-pivot debt. Finances persist locally.

The climber needs hand support to move the feet. Overextended grips release, and an unsupported fall fails the job. No ropes, helmets, visible grip hardware or range rings cover the scene. Difficulty and feel still benefit from human playtesting.

Each map fills the window at a close starting zoom. Mouse dragging and touch limb selectors share the same reach and grab rules; the camera stays still during a drag. Keys 1–4 select limbs, R restarts and F requests fullscreen. The phone pauses the climb.

Old bookmarked URLs open the new jobs. The original maps remain as archived physics-test fixtures, but are no longer in the playable job lineup. New paths work on both Sites and GitHub Pages.

The developer workshop is retained separately at `/workshop`: import background/foreground PNGs, trace grips and edge/rectangle colliders, place spawn/objective/return-zone/camera geometry, play test, undo, save locally and export/reload portable JSON with embedded artwork.

## Run

Node 22.13+ and pnpm. `pnpm install`, then `pnpm dev`. `pnpm build` creates the Worker and client assets. `pnpm exec tsc --noEmit` checks types.

## Architecture

- `lib/game/physics.ts`: position-based weighted ragdoll with a physical torso frame, separate shoulder and hip joints, fixed bone lengths, limited endpoint reach, anchored grips, gravity, one-way elbow/knee hinges and ground-impact failure. Soft dragging, nearby-hold attraction and capped release momentum keep repositioning fluid while grip anchors remain precise.
- `lib/game/australian-jobs.ts`, `australian-routes.json` and `campaign.ts`: current job lineup, coordinates traced in native artwork pixels and shared scaling of artwork/geometry. `level.ts` retains types, JSON validation and retired regression fixtures.
- `lib/game/render.ts`: PNG background/foreground layers, a connected low-poly climber built from tapered faceted limbs, joint pieces, skin forearms, shaped hands and boots, torso, pelvis, face and hair, plus the low-poly cat PNG and editor overlays. The climber has no helmet, harness or visible rope, and gameplay geometry is invisible.
- `app/game.tsx`: fixed timestep, bounded camera, unified mouse/touch Pointer Events, persistent finances, the in-game phone and workshop tools. Gameplay covers the viewport, cropping the world rather than letterboxing it.
- `app/page.tsx`, `app/church/page.tsx` and `app/tower/page.tsx`: direct full-screen climbing entries, with no app shell.
- `app/workshop/page.tsx`: separate developer entry.

The complete carry-and-return system remains available to editor play tests. Normal routes stop on completion and present the payment screen; editor play tests do not award money.

## Validation

`pnpm exec jiti tests/australian.test.ts` traverses all eight new routes using limb inputs and performs each supported job interaction. It also checks spawn support, artwork and route entries, finite JSON geometry, brief objective contact, boot-only climbing rejection and falling failure.

`pnpm exec jiti tests/pub.test.ts` checks the pub route and obstruction rules. `pnpm exec jiti tests/controls.test.ts` covers camera framing, touch selection and cancellation. `tests/physics.test.ts` retains the original level fixtures for bone, hinge, reach, carry and gravity regressions.

## Artwork

`public/assets/cat-tree.png` is built-in ImageGen artwork based on the supplied illustrated backyard concept. `public/assets/pickles.png` is a generated angular low-poly orange-and-white sitting cat, facing left, with a transparent background prepared from the generated sprite. Prompt: orange-and-white sitting cat, broad warm faceted planes, full body and curled tail, clean silhouette readable at game scale, no emoji, props, text, outline border, or background scenery.

`public/assets/church-cross.png` is built-in ImageGen artwork created for the second climb, with the church filling the playfield and readable routes formed by buttresses, masonry, windows, gutters and tower ledges. The generated background excludes the cross itself because the cross is rendered as the interactive repair object.

`public/assets/telephone-tower.png` is built-in ImageGen artwork for the third climb. The centered low-poly structure exposes a continuous ladder-and-lattice route, with wider platform detours and an empty lamp fitting at the summit. The bulb and its completion glow are rendered as the interactive object.

All three environment textures are stored at 2400×2000 while retaining a 1200×1000 gameplay coordinate system. This supplies 2× artwork resolution for high-density displays without moving the authored grips, collisions or objectives.

The five new scene assets and their generation prompts are documented in [docs/job-artwork.md](docs/job-artwork.md).

## Ambience

User-supplied Quorn, South Australia birds/flies soundscape loops at 30% volume during play. Playback starts on the first tap, click or key press. The speaker control above the phone remembers mute locally; audio pauses in hidden tabs and stops when leaving the game. The same audio path is prefixed for GitHub Pages.
