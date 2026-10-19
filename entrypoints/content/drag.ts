/** Follows a pointer drag that `event` started on `element`, until the pointer is released. */
export function trackDrag(element: HTMLElement, event: PointerEvent, onMove: (dx: number, dy: number) => void) {
  event.preventDefault()
  // Keeps the pointer events coming to the element, even when the pointer leaves it. Also stops touch screens from
  // scrolling the page instead (with `touch-action: none` in `style.css`).
  element.setPointerCapture(event.pointerId)
  const listeners = new AbortController()
  const { signal } = listeners
  element.addEventListener(
    "pointermove",
    (move) => onMove(move.clientX - event.clientX, move.clientY - event.clientY),
    {
      signal,
    },
  )
  // Fires when the pointer is released or the drag is cancelled.
  element.addEventListener("lostpointercapture", () => listeners.abort(), { signal })
}
