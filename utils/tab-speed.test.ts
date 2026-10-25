import { describe, expect, it } from "vitest"
import { readTabSpeed, writeTabSpeed } from "./tab-speed"

function fakeStorage() {
  const items = new Map<string, string>()
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value)
    },
  }
  return { items, storage: () => storage }
}

describe("tab speed", () => {
  it("reads back what was written", () => {
    const { storage } = fakeStorage()
    expect(readTabSpeed(storage)).toBeUndefined()
    writeTabSpeed(1.5, storage)
    expect(readTabSpeed(storage)).toBe(1.5)
  })

  it("ignores values that aren't a speed, since the page can change them", () => {
    const { items, storage } = fakeStorage()
    for (const value of ["", "fast", "0", "-1", "Infinity"]) {
      items.set("beeFastVideo.speed", value)
      expect(readTabSpeed(storage)).toBeUndefined()
    }
  })

  it("does nothing when the storage is blocked", () => {
    const blocked = () => {
      throw new DOMException("The operation is insecure.", "SecurityError")
    }
    expect(readTabSpeed(blocked)).toBeUndefined()
    expect(() => writeTabSpeed(1.5, blocked)).not.toThrow()
  })
})
