# Odd Jobs

A browser game prototype: climb a backyard tree by moving four limbs, collect Pickles with one hand, descend with three free limbs, and earn $40. Mouse and touch use the same Pointer Events path. Money and workshop saves are device-local.

## Run

Use Node 22.13+ and pnpm. Run `pnpm install`, `pnpm dev`, then open the printed local URL. `pnpm build` produces the Cloudflare Worker and client assets. `pnpm exec tsc --noEmit` checks types.

## Play

Open **Cat stuck in tree → Accept job**. Drag hands or boots to solid-looking bark or branches. A bright ring confirms a nearby valid grip; release to attach. Short moves, especially moving feet up to support your weight, are most reliable. Buttons or keys 1–4 select a limb when it is difficult to target. Space pauses; Escape cancels a drag. Zoom out to see the route. Let go releases all grips; the rope catches you.

Drag a free hand onto Pickles on the upper-right branch. That hand becomes occupied and carries extra weight. Return to the base of the tree near Sarah to finish. Reaching Pickles alone does not finish the job.

## Level workshop

Import a PNG background, then place grips by clicking. Use Select / move to drag and delete grips or colliders. Edge and rectangle tools trace collision geometry; spawn, objective, rope, return-zone, and camera tools place the remaining level elements. Undo supports the last 40 geometry edits. Optional foreground PNGs render over the scene.

**Play test** resets the climber using the current level data; returning to the editor preserves the geometry. Tests never pay money. **Save on this device** stores one workshop level locally. **Export JSON** embeds the background and foreground PNGs so the exported file is portable. **Load JSON** validates and restores it. Large images may exceed browser storage; export JSON in that case. Background import scales existing geometry to the new dimensions.

## Architecture

- `lib/game/physics.ts`: small position-based dynamics solver. Weighted particles, rigid torso and bone constraints, endpoint anchors, limited reach, damping, muscle support, collisions, and an auto-belay distance constraint. No canned climbing animations or platformer movement.
- `lib/game/level.ts`: typed level schema, validation, and authored Cat Rescue geometry. Level appearance and geometry are independent.
- `lib/game/render.ts`: PNG layers, simple runtime character/entities, camera transform and editor overlays. Gameplay hides tracing geometry.
- `app/game.tsx`: pointer input abstraction, fixed physics timestep, smooth bounded camera, workshop, carry/return loop, results.
- `app/page.tsx`: original Odd Jobs board, listing, locked future jobs and local wallet.
- `tests/physics.test.ts`: input-driven ascent, branch traversal, actual cat capture, three-limb descent, rope catch, joint reach, carrying lockout, completion and JSON checks.

The reusable objective type for this slice is `carry`. Future verbs should add objective handlers without changing limb manipulation or grip constraints. The cat is a perched entity before pickup and a weighted held entity afterward; deliberate dropping is not implemented. Collision support is edge and rectangle, without polygon or self-collision simulation. Muscle assistance favors controllability over biomechanics; the rope is a visual curve plus harness distance constraint, without rope wrapping. Runtime cat/customer visuals use platform emoji.

## Validation

Physics tests pass through the complete rescue and return using the same begin/move/end/step methods as player input. Type-check and production build are checked separately. Physical mouse/touch device usability has not been tested in a browser; this remains a prototype needing hands-on feel tuning. The optional read-only WebMCP job-status tool is feature-detected; no supported runtime was available to validate its registration.

## Art

`public/assets/cat-tree.png` was generated using built-in ImageGen from the supplied concept as a style reference. Prompt: clean standalone illustrated low-poly suburban backyard oak tree, full centered trunk, readable branches, grassy ground near 92% height, fence, houses, shrubs, sunny blue sky; no characters, cat, rope, text, arrows, labels, UI, or borders. It is PNG artwork, not procedural scenery.
