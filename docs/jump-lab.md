# Switchback
A black-wall boulder with six numbered dynos. Seven handholds and eight footholds total; no interpolated routes, invisible traps or carry objective.

Follow the numbered holds in order. Match hands, recover one foot, select the next target, charge and release, then tap as a hand arrives. Each foothold accepts one boot. Offset feet and two changes of direction demand a new stance after each landing. The six gaps vary from 230 to 250 pixels across and 110 to 180 pixels upwards.

Physical catches require a hand within the hold radius plus 20 player-scaled pixels (about 33–35 world pixels). Touch selection remains larger. Missed taps have a 160ms recovery, so repeated tapping cannot replace timing. A held target stays available for limb selection, allowing the free hand to match it.

A clear requires all six jump catches in order, then both hands matched on the finish and the hip moving less than 1.4 player-scaled pixels per physics frame for one uninterrupted second. Falling restarts the run. Training does not pay into the story bank.

Validation uses the actual Climber and JumpController. The driver searches charge and catch times and uses normal begin/step/end input to recover the free hand and foot at every landing; it carries the resulting pose and momentum through the entire run. This verifies reachability, not human difficulty. Final feel still benefits from playtesting on touch.

Run tests with the project's TypeScript runner or compile tests/jump.test.ts and tests/jump-lab.test.ts to CommonJS with tsc and execute them with Node.
