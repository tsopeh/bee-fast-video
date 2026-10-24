import { describe, expect, it } from "vitest"
import {
  actionForKey,
  areDefaultKeys,
  bindingForKey,
  changedKeys,
  DEFAULT_KEYS,
  keyLabel,
  resolveKeys,
  withKey,
} from "./keys"

const press = (key: string, code = "", shiftKey = false) => ({ key, code, shiftKey })
const modifiers = { altKey: false, ctrlKey: false, metaKey: false }

describe("actionForKey", () => {
  it("finds the action for a key, also with Shift or Caps Lock", () => {
    expect(actionForKey(DEFAULT_KEYS, press("z", "KeyZ"))).toBe("slowDown")
    expect(actionForKey(DEFAULT_KEYS, press("Z", "KeyZ", true))).toBe("slowDown")
    expect(actionForKey(DEFAULT_KEYS, press("Z", "KeyZ"))).toBe("slowDown")
    expect(actionForKey(DEFAULT_KEYS, press("m", "KeyM"))).toBeUndefined()
  })

  it("follows the layout, not the physical key", () => {
    // On a French keyboard, the key where QWERTY has W types Z.
    expect(actionForKey(DEFAULT_KEYS, press("z", "KeyW"))).toBe("slowDown")
    expect(actionForKey(DEFAULT_KEYS, press("W", "KeyZ", true))).toBeUndefined()
  })

  it("finds a key that Shift turns into another character by where it is", () => {
    const keys = withKey(DEFAULT_KEYS, "slowDown", { key: "[", code: "BracketLeft" })
    expect(actionForKey(keys, press("[", "BracketLeft"))).toBe("slowDown")
    expect(actionForKey(keys, press("{", "BracketLeft", true))).toBe("slowDown")
    expect(actionForKey(keys, press("{", "BracketLeft"))).toBeUndefined()
  })
})

describe("bindingForKey", () => {
  it("takes plain keys, letters in lower case", () => {
    expect(bindingForKey({ ...press("K", "KeyK"), ...modifiers })).toEqual({ key: "k", code: "KeyK" })
    expect(bindingForKey({ ...press(" ", "Space"), ...modifiers })).toEqual({ key: " ", code: "Space" })
  })

  it("refuses number keys, modifiers and keys that do something else", () => {
    expect(bindingForKey({ ...press("5", "Digit5"), ...modifiers })).toBeUndefined()
    expect(bindingForKey({ ...press("K", "KeyK", true), ...modifiers })).toBeUndefined()
    expect(bindingForKey({ ...press("k", "KeyK"), ...modifiers, ctrlKey: true })).toBeUndefined()
    expect(bindingForKey({ ...press("Escape", "Escape"), ...modifiers })).toBeUndefined()
    expect(bindingForKey({ ...press("Dead", "BracketRight"), ...modifiers })).toBeUndefined()
  })
})

describe("withKey", () => {
  it("swaps with the action that had the key", () => {
    const keys = withKey(DEFAULT_KEYS, "slowDown", { key: "x", code: "KeyX" })
    expect(keys.slowDown.key).toBe("x")
    expect(keys.speedUp.key).toBe("z")
  })
})

describe("stored keys", () => {
  it("keeps only changed keys, and fills in the rest with defaults", () => {
    const keys = withKey(DEFAULT_KEYS, "playPause", { key: "k", code: "KeyK" })
    expect(changedKeys(keys)).toEqual({ playPause: { key: "k", code: "KeyK" } })
    expect(resolveKeys(changedKeys(keys))).toEqual(keys)
    expect(areDefaultKeys(keys)).toBe(false)
    expect(areDefaultKeys(withKey(keys, "playPause", { key: "s", code: "KeyS" }))).toBe(true)
    expect(changedKeys(withKey(keys, "playPause", { key: "s", code: "KeyS" }))).toEqual({})
  })
})

describe("keyLabel", () => {
  it("shows letters in upper case and names some keys", () => {
    expect(keyLabel("z")).toBe("Z")
    expect(keyLabel(" ")).toBe("Space")
    expect(keyLabel("ArrowLeft")).toBe("←")
    expect(keyLabel("PageDown")).toBe("PgDn")
    expect(keyLabel("F2")).toBe("F2")
  })
})
