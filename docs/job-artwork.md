# Additional job artwork

Generated with the built-in ImageGen tool. Final PNGs are kept in `public/assets/`; all scenes use the existing 1200×1000 gameplay coordinates. The new PNGs retain their native 1374×1145 resolution. Ladder rails and ground levels were traced from the final images, and every route was tested with limb inputs from spawn to its repair objective.

## Lighthouse and windmill

Commissioning brief: five separate faceted low-poly painterly backgrounds. Landscape 6:5; fixed front elevation; entire tall structure centered; ground near the bottom; readable continuous front service ladder; distinct scenery on either side; no people, UI, text, climbing ropes or markers. Lighthouse on a rocky coast, with the beacon at the top. Old wooden windmill on a farm, with a fixed central service ladder to the drive housing, separate from its sails.

Saved files: `public/assets/lighthouse.png`, `public/assets/windmill.png`.

## Remaining scene prompts

### public/assets/chimney.png

Use case: stylized-concept. Asset type: detailed background for a 2D climbing game. Create a separate landscape 6:5 illustration, ideally 2400x2000. Scene: a tall red brick factory chimney with external ladder up the front to rim, small industrial brick buildings flanking it, warm evening light. Clean faceted low-poly painterly style with rich environmental detail. Fixed front elevation view, entire tall structure centered, ground at 94% image height, structure summit at 12% height. A clearly visible continuous narrow vertical maintenance ladder directly facing camera, centered at 50% image width, rails at 49% and 51%, from ground to summit. Every rung is a real climbable metal edge. Keep the ladder unobscured and continuous across all structural sections. Structure occupies middle 40% of image, scenic landscape both sides. No people, UI, text, logos, markers or climbing ropes. Leave space on the summit for a small interactive repair object.

### public/assets/water-tower.png

Use case: stylized-concept. Asset type: detailed background for a 2D climbing game. Create a separate landscape 6:5 illustration, ideally 2400x2000. Scene: a tall steel water tank elevated on four lattice support legs, external ladder up the very front continuing over the tank wall to its roof, small rural town and fields surrounding it. Clean faceted low-poly painterly style with rich environmental detail. Fixed front elevation view, entire tall structure centered, ground at 94% image height, structure summit at 12% height. A clearly visible continuous narrow vertical maintenance ladder directly facing camera, centered at 50% image width, rails at 49% and 51%, from ground to summit. Every rung is a real climbable metal edge. Keep the ladder unobscured and continuous across all structural sections. Structure occupies middle 40% of image, scenic landscape both sides. No people, UI, text, logos, markers or climbing ropes. Leave space on the summit for a small interactive repair object.

### public/assets/cable-car.png

Use case: stylized-concept. Asset type: detailed background for a 2D climbing game. Create a separate landscape 6:5 illustration, ideally 2400x2000. Scene: an alpine cable-car support pylon with central steel service ladder from ground to top beam, cables extending out to the sides and a distant gondola, mountain pine forest and snowy peaks. Clean faceted low-poly painterly style with rich environmental detail. Fixed front elevation view, entire tall structure centered, ground at 94% image height, structure summit at 12% height. A clearly visible continuous narrow vertical maintenance ladder directly facing camera, centered at 50% image width, rails at 49% and 51%, from ground to summit. Every rung is a real climbable metal edge. Keep the ladder unobscured and continuous across all structural sections. Structure occupies middle 40% of image, scenic landscape both sides. No people, UI, text, logos, markers or climbing ropes. Leave space on the summit for a small interactive repair object.


## Australian pub prototype

Saved asset: `public/assets/country-pub.png`. Generated with built-in ImageGen. Holds and invisible obstruction geometry are traced onto the existing pub structure. The renderer adds only subtle contextual grab hints, with no extra beams, pipes or brackets over the bitmap. Background framing is adjusted in the game renderer, preserving the generated file.

Prompt: Use case: stylized-concept. Asset type: background bitmap for a side-on climbing puzzle game. Front elevation of a rambling Australian country pub in a dry inland town, gum trees, red dirt verge, corrugated iron roofs, weatherboard siding, verandah, warm late afternoon sun. Clean faceted low-poly painterly illustration, subdued architectural detail so game-authored interactive beams and grips remain readable in front. Landscape 1600:1000 composition. Straight-on readable flat front facade spanning approximately x180..1430 and y260..910 on a 1600x1000 canvas; varied roof setbacks. Ground at y950. Leave blank facade areas for game-rendered structural ledges and signs. Place a green wheelie bin near x200 y900. Distant gum trees and utility poles at the sides. Background only; do not encode a climbing route. No people, ladders, UI, markers, text, letters, signage lettering, ropes, or watermarks.

## New Australian campaign — September 2026

Eight new original images, generated once each with built-in ImageGen, replace the prior settings in the job lineup. Files are `public/assets/australia-{prawn,surf-club,drive-in,queenslander,railway,showground,opal-mine,grandstand}.png`. Original 1586×992 PNGs are preserved. `australian-routes.json` records traced native-pixel coordinates; the game scales both the image and geometry to 1600×1000.

Shared brief: side-on, broad, low-poly painterly Australian climbing environments, warm light, gum trees, real posts/gutters/roof edges/diagonal braces supporting a climb across multiple levels. No people, text, UI, arrows or added climbing hardware. Targets are painted into the scene; only the functional job marker and completion progress are overlaid.

Subjects: giant prawn over a seafood kiosk with a thong on its antenna; surf club with an inflatable crocodile at the flagpole; rear drive-in frame with a trolley at the top; Queenslander with inflatable summer Santa; railway signal box with an esky; fairground slide building with a golden ibis; opal-processing gantry with disco ball; country grandstand with giant pumpkin.
