import { describe, expect, it } from "vitest"
import { setImportantStyles } from "./video-styles"

// Minimal in-memory stand-in for CSSStyleDeclaration.
function fakeElement(initial: Record<string, [string, string]> = {}) {
  const props = new Map(Object.entries(initial))
  const style = {
    getPropertyValue: (name: string) => props.get(name)?.[0] ?? "",
    getPropertyPriority: (name: string) => props.get(name)?.[1] ?? "",
    setProperty: (name: string, value: string, priority = "") => props.set(name, [value, priority]),
    removeProperty: (name: string) => props.delete(name),
  }
  return { element: { style } as unknown as ElementCSSInlineStyle, props }
}

describe("setImportantStyles", () => {
  it("sets the styles as important", () => {
    const { element, props } = fakeElement()
    setImportantStyles(element, { width: "100px" })
    expect(props.get("width")).toEqual(["100px", "important"])
  })

  it("restores previous inline values and removes styles that weren't set", () => {
    const { element, props } = fakeElement({ width: ["50%", ""] })
    const restore = setImportantStyles(element, { width: "100px", height: "80px" })
    restore()
    expect(props.get("width")).toEqual(["50%", ""])
    expect(props.has("height")).toBe(false)
  })
})
