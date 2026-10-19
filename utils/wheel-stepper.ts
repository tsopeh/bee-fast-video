/**
 * Turns wheel events into at most one step per `intervalMs`: 1 for scrolling up or right, -1 for down or left, 0 for
 * ignored events.
 *
 * Trackpads fire many small wheel events per gesture while mouse wheels fire one per notch, so counting events (or
 * summing deltas) changes values at very different speeds across devices. Limiting the step rate by time instead
 * makes a continuous scroll change values at the same, predictable pace everywhere.
 *
 * Each event counts on its stronger axis only: sideways when it moves more sideways than up or down, otherwise
 * vertically. So a diagonal swipe never steps on both axes, and a swipe that turns switches axis with it.
 */
export function createWheelStepper(intervalMs: number, now: () => number = () => performance.now()) {
  let lastStepAt = Number.NEGATIVE_INFINITY
  return (deltaX: number, deltaY: number): -1 | 0 | 1 => {
    // Up and right are "more", like on a graph.
    const direction = Math.abs(deltaX) > Math.abs(deltaY) ? Math.sign(deltaX) : -Math.sign(deltaY)
    const time = now()
    if (direction === 0 || time - lastStepAt < intervalMs) {
      return 0
    }
    lastStepAt = time
    return direction > 0 ? 1 : -1
  }
}

/** A wheel event handler that keeps the page from scrolling and calls `onStep` at most once per `intervalMs`. */
export function onWheelStep(intervalMs: number, onStep: (step: -1 | 1) => void) {
  const stepWheel = createWheelStepper(intervalMs)
  return (event: WheelEvent) => {
    event.preventDefault()
    const step = stepWheel(event.deltaX, event.deltaY)
    if (step !== 0) {
      onStep(step)
    }
  }
}
