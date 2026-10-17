/**
 * Turns wheel events into at most one step per `intervalMs`: 1 for scrolling up, -1 for down, 0 for ignored events.
 *
 * Trackpads fire many small wheel events per gesture while mouse wheels fire one per notch, so counting events (or
 * summing deltas) changes values at very different speeds across devices. Limiting the step rate by time instead
 * makes a continuous scroll change values at the same, predictable pace everywhere.
 */
export function createWheelStepper(intervalMs: number, now: () => number = () => performance.now()) {
  let lastStepAt = Number.NEGATIVE_INFINITY
  return (deltaY: number): -1 | 0 | 1 => {
    if (deltaY === 0) {
      return 0
    }
    const time = now()
    if (time - lastStepAt < intervalMs) {
      return 0
    }
    lastStepAt = time
    return deltaY < 0 ? 1 : -1
  }
}
