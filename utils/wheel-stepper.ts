/**
 * A pause between wheel events this long ends a swipe. In one log from a MacBook trackpad, events came 3-42 ms apart
 * while the fingers moved and 702 ms apart between swipes.
 */
const SWIPE_GAP_MS = 150
/**
 * Movement needed to step the other way within a swipe. In the same log, a stray event moved 1 px against the swipe,
 * while a real turn moved 1, 2, then 4 px and passed this on its third event, 16 ms in.
 */
const TURN_THRESHOLD_PX = 4

/**
 * Turns wheel events into at most one step per `intervalMs`: 1 for scrolling up or right, -1 for down or left, 0 for
 * ignored events.
 *
 * Trackpads fire many small wheel events per gesture while mouse wheels fire one per notch, so counting events (or
 * summing deltas) changes values at very different speeds across devices. Limiting the step rate by time instead
 * makes a continuous scroll change values at the same, predictable pace everywhere.
 *
 * A swipe keeps the axis of its first event until it pauses. Fingers on a trackpad move diagonally, often 1-3 px on
 * both axes per event, and up and right both mean more. So down-and-right means less on one axis and more on the
 * other; choosing the axis per event made such a swipe step either way. Within the axis, the step goes by the movement
 * summed since the last step. Stepping the other way takes `TURN_THRESHOLD_PX` of movement, so jitter can't reverse
 * a swipe. The first step of a swipe needs no threshold, so it still comes on the first event.
 */
export function createWheelStepper (intervalMs: number, now: () => number = () => performance.now()) {
  let lastStepAt = Number.NEGATIVE_INFINITY
  let lastEventAt = Number.NEGATIVE_INFINITY
  let axis: "x" | "y" | undefined
  // Movement along the axis since the last step, positive for up or right.
  let movement = 0
  let lastStep: -1 | 1 | undefined
  return (deltaX: number, deltaY: number): -1 | 0 | 1 => {
    const time = now()
    if (time - lastEventAt >= SWIPE_GAP_MS) {
      axis = undefined
      movement = 0
      lastStep = undefined
    }
    lastEventAt = time
    if (axis === undefined) {
      if (deltaX === 0 && deltaY === 0) {
        return 0
      }
      axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y"
    }
    movement += axis === "x" ? deltaX : -deltaY
    const step = movement > 0 ? 1 : movement < 0 ? -1 : 0
    const isTurn = lastStep !== undefined && step !== lastStep
    if (step === 0 || (isTurn && Math.abs(movement) < TURN_THRESHOLD_PX) || time - lastStepAt < intervalMs) {
      return 0
    }
    lastStepAt = time
    lastStep = step
    movement = 0
    return step
  }
}

/** A wheel event handler that keeps the page from scrolling and calls `onStep` at most once per `intervalMs`. */
export function onWheelStep (intervalMs: number, onStep: (step: -1 | 1) => void) {
  const stepWheel = createWheelStepper(intervalMs)
  return (event: WheelEvent) => {
    event.preventDefault()
    // Deltas in lines or pages come from a wheel notch, which is always a real move: count it as clearing the threshold.
    const scale = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? 1 : TURN_THRESHOLD_PX
    const step = stepWheel(event.deltaX * scale, event.deltaY * scale)
    if (step !== 0) {
      onStep(step)
    }
  }
}
