/**
 * Constrains a video to 80% of the viewport's width and height while keeping its whole frame visible. Used for sites
 * whose videos can be taller or wider than the viewport.
 */
export const FIT_TO_VIEWPORT_STYLES = {
  "max-width": "80vw",
  "max-height": "80vh",
  "object-fit": "contain",
}

/**
 * Sets inline `!important` styles, so they win over the page's stylesheets, and returns a function that restores the
 * element's previous inline values. Inline styles set via the CSSOM are also not blocked by the page's
 * Content-Security-Policy, unlike injected `<style>` elements.
 */
export function setImportantStyles(element: ElementCSSInlineStyle, styles: Record<string, string>): () => void {
  const { style } = element
  const previous = Object.keys(styles).map((name) => ({
    name,
    value: style.getPropertyValue(name),
    priority: style.getPropertyPriority(name),
  }))
  for (const [name, value] of Object.entries(styles)) {
    style.setProperty(name, value, "important")
  }
  return () => {
    for (const { name, value, priority } of previous) {
      if (value === "") {
        style.removeProperty(name)
      } else {
        style.setProperty(name, value, priority)
      }
    }
  }
}
