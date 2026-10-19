// The element that holds the shadow root with all panels (see `index.tsx`). Usually it sits in the page's top left
// corner, but while the site shows an element fullscreen it moves inside that element.

/** Tags that can't show elements put inside them, so the host can't move into them. */
const REPLACED_ELEMENTS = new Set(["VIDEO", "IFRAME", "CANVAS", "IMG", "OBJECT", "EMBED"])

/**
 * Keeps the panels visible and clickable, also in fullscreen.
 *
 * - Normally the host is a popover in the browser's top layer, which is drawn above everything on the page, so no
 *   z-index on the page can cover the panels.
 * - In fullscreen, Chrome draws the top layer but only lets you click inside the fullscreen element (and modal
 *   dialogs). So while the site shows its player fullscreen, the host moves inside the player.
 * - When the `<video>` itself is fullscreen, the host can't go inside it. It stays in the top layer: the panels can be
 *   seen and shortcuts work, but they can't be clicked.
 *
 * The browser closes all popovers when something enters fullscreen, and an element shown later is drawn above
 * earlier ones, so the popover is shown again on every fullscreen change.
 */
export function followFullscreen(element: HTMLElement, addFullscreenListener: (listener: () => void) => void) {
  // Popovers: Chrome 114+, Firefox 125+. Elsewhere the host is just the last element in `<body>`.
  const canPopover = typeof element.showPopover === "function"
  if (canPopover) {
    element.popover = "manual"
  }
  const place = () => {
    const fullscreen = document.fullscreenElement
    const container =
      fullscreen != null && !REPLACED_ELEMENTS.has(fullscreen.tagName)
        ? // A custom element only shows its shadow root's content, so the host goes there if it can.
          (fullscreen.shadowRoot ?? fullscreen)
        : document.body
    if (element.parentNode !== container) {
      container.append(element)
    }
    if (canPopover && container === document.body) {
      element.hidePopover()
      element.showPopover()
    }
  }
  place()
  addFullscreenListener(place)
}
