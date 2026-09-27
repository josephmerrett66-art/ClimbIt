import { Climber } from './physics';
import { JumpController, jumpFor } from './jump';

// Clone the entire graph at once: the cached particle array must still point
// to the same particles as body.p after restoring a practice attempt.
export class BoulderPractice {
  private saved: { body: Climber; jump: JumpController } | null = null;
  private section = -1;
  used = false;
  capture(body: Climber) {
    const jump = jumpFor(body);
    if (
      !jump ||
      !body.level.boulderFinish ||
      body.failed ||
      body.drag ||
      body.complete ||
      body.elapsed < 0.8
    )
      return;
    const index = jump.completedJumps;
    const entry = index
      ? body.level.jumpCourse![index - 1].hold
      : 'start-hands';
    if (
      index <= this.section ||
      body.grips.leftHand?.id !== entry ||
      body.grips.rightHand?.id !== entry ||
      !(body.grips.leftFoot || body.grips.rightFoot)
    )
      return;
    this.saved = structuredClone({ body, jump });
    this.section = index;
  }
  restore() {
    if (!this.saved) return null;
    const state = structuredClone(this.saved);
    Object.setPrototypeOf(state.body, Climber.prototype);
    Object.assign(jumpFor(state.body)!, state.jump, { game: state.body });
    this.used = true;
    return state.body;
  }
}
