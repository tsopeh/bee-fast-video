import { describe, expect, it } from "vitest"
import { isAddSavedSeconds, totalSavedSeconds } from "./saved-time"

describe("totalSavedSeconds", () => {
  it("adds the other devices' totals to this device's", () => {
    const sync = { "savedSeconds.a": 100, "savedSeconds.b": 20, blacklistedHostnames: ["example.com"] }
    expect(totalSavedSeconds(sync, "a", 150)).toBe(170)
  })

  it("counts every synced total before this device has an id", () => {
    expect(totalSavedSeconds({ "savedSeconds.b": 20 }, null, 0)).toBe(20)
  })
})

describe("isAddSavedSeconds", () => {
  it("accepts only messages with a number", () => {
    expect(isAddSavedSeconds({ addSavedSeconds: 1.5 })).toBe(true)
    expect(isAddSavedSeconds({ addSavedSeconds: "1" })).toBe(false)
    expect(isAddSavedSeconds(null)).toBe(false)
  })
})
