# Odd Jobs — tree climbing prototype

The main page opens directly into a full-window climbing scene. It contains only the tree environment, climber, safety rope, and low-poly Pickles sprite. There is no job board, header, wallet, HUD, owner, button bar, or results menu. The phone/job menu is deferred.

Drag a hand or boot onto the tree to climb. Keys 1–4 select individual limbs; R restarts the climb; F requests browser fullscreen. Pickles can still be carried in one hand. Reaching the ground keeps the climbing simulation running.

The second full-window climb is available at `/church`. It uses a separate low-poly PNG environment and authored route up a stone church. Reaching the crooked cross with either hand straightens it in place.

The third climb is available at `/tower`. It follows the lattice, maintenance platforms and antenna braces of a telecommunications tower. Reaching the dead summit bulb replaces and illuminates it.

The developer workshop is retained separately at `/workshop`: import background/foreground PNGs, trace grips and edge/rectangle colliders, place spawn/objective/rope/return-zone/camera geometry, play test, undo, save locally and export/reload portable JSON with embedded artwork.

## Run

Node 22.13+ and pnpm. `pnpm install`, then `pnpm dev`. `pnpm build` creates the Worker and client assets. `pnpm exec tsc --noEmit` checks types.

## Architecture

- `lib/game/physics.ts`: position-based weighted ragdoll with a physical torso frame, separate shoulder and hip joints, fixed bone lengths, limited endpoint reach, anchored grips, one-way elbow/knee hinges and an auto-belay harness constraint. Soft dragging, nearby-hold attraction and capped release momentum keep repositioning fluid while grip anchors remain precise.
- `lib/game/level.ts`: separate authored tree and church level data plus JSON validation. No owner entity in either level.
- `lib/game/render.ts`: PNG background/foreground layers, a connected low-poly climber built from tapered faceted limbs, joint pieces, skin forearms, shaped hands and boots, torso, pelvis, head and harness, plus the low-poly cat PNG and editor overlays. Gameplay geometry is invisible.
- `app/game.tsx`: fixed timestep, bounded camera, unified mouse/touch Pointer Events and workshop tools. Gameplay covers the viewport, cropping the world rather than letterboxing it.
- `app/page.tsx`, `app/church/page.tsx` and `app/tower/page.tsx`: direct full-screen climbing entries, with no app shell.
- `app/workshop/page.tsx`: separate developer entry.

The complete carry-and-return system remains available to editor play tests. The main page uses continuous climbing mode while we focus on movement.

## Validation

Automated tests exercise ascent, branch traversal, actual cat pickup, three-limb descent, complete church and tower ascents, both repair objectives, safety-rope catch, carrying lockout and JSON validation. Hinge regression tests intentionally reverse both knees and rotate the body, then verify bend direction and unchanged leg segment lengths. Continuous mode is checked to avoid freezing at a hidden completion menu. Mouse/touch feel still needs hands-on tuning.

## Artwork

`public/assets/cat-tree.png` is built-in ImageGen artwork based on the supplied illustrated backyard concept. `public/assets/pickles.png` is a generated angular low-poly orange-and-white sitting cat, facing left, with a transparent background prepared from the generated sprite. Prompt: orange-and-white sitting cat, broad warm faceted planes, full body and curled tail, clean silhouette readable at game scale, no emoji, props, text, outline border, or background scenery.

`public/assets/church-cross.png` is built-in ImageGen artwork created for the second climb, with the church filling the playfield and readable routes formed by buttresses, masonry, windows, gutters and tower ledges. The generated background excludes the cross itself because the cross is rendered as the interactive repair object.

`public/assets/telephone-tower.png` is built-in ImageGen artwork for the third climb. The centered low-poly structure exposes a continuous ladder-and-lattice route, with wider platform detours and an empty lamp fitting at the summit. The bulb and its completion glow are rendered as the interactive object.
