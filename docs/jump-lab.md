# Five Problems prototype

Five sparse boulders linked by four jump gaps. Each problem has four handholds and three footholds: 35 total. Round numbered holds are landings; short wide holds allow matching; narrow holds take one limb. Sections change direction and include sideways, rising and descending moves. Colour distinguishes each section without route lines.

No named launch restriction: any physically supported matched-hand stance can charge. The gap geometry makes the exits useful. Jump order still records the four required gaps, and completion requires climbing beyond the fourth landing to match the final hold for one controlled second.

Practice retry restores the last matched landing with a planted foot. It preserves exact body and jump state and labels completion as practice. Ordinary restart begins a fresh uninterrupted run.

Validation: `tests/jump-lab.test.ts` runs all five climbs using begin/end limb inputs and fixed physics ticks, searches charge/catch timings for each jump, recovers the catches and reaches the finish continuously. No section teleporting. This proves a route exists; human difficulty and touch comfort still need play feedback. Hold spacing is also checked against a 40-world-unit minimum.
