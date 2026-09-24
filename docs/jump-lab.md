# Switchback
A black-wall boulder with six numbered dynos. Seven handholds and eight footholds total; no interpolated routes, invisible traps or carry objective.

Follow the numbered holds in order. Match hands, recover one foot, select the next target, then hold and release JUMP. The fixed GRAB control mirrors the selected hold colour while a solid ring closes around the target. Press GRAB when the control flashes and the ring completes; the moving hold itself is never the timing button. Each foothold accepts one boot. Offset feet and two changes of direction demand a new stance after each landing. The six gaps vary from 230 to 250 pixels across and 110 to 180 pixels upwards.

Physical catches require the leading hand to enter the illuminated catch window. A 320ms input buffer makes an intentional slightly-early press reliable on touchscreens, while a late press still misses. The button changes from approaching to ready to missed, and supported devices give one short vibration as the window opens. A held target stays available for limb selection, allowing the free hand to match it.

A clear requires all six jump catches in order, then both hands matched on the finish and the hip moving less than 1.4 player-scaled pixels per physics frame for one uninterrupted second. Falling restarts the run. Training does not pay into the story bank.

Validation uses the actual Climber and JumpController. The driver searches charge and catch times and uses normal begin/step/end input to recover the free hand and foot at every landing; it carries the resulting pose and momentum through the entire run. This verifies reachability, not human difficulty. Final feel still benefits from playtesting on touch.

Run tests with the project's TypeScript runner or compile tests/jump.test.ts and tests/jump-lab.test.ts to CommonJS with tsc and execute them with Node.
