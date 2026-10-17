import { describe, expect, it } from "vitest"
import { formatTime } from "./format-time"

describe("formatTime", () => {
  it("formats minutes and seconds", () => {
    expect(formatTime(0)).toBe("0:00")
    expect(formatTime(5.9)).toBe("0:05")
    expect(formatTime(83)).toBe("1:23")
  })

  it("adds hours from one hour on", () => {
    expect(formatTime(3600)).toBe("1:00:00")
    expect(formatTime(3725)).toBe("1:02:05")
  })

  it("returns a placeholder for unknown durations", () => {
    expect(formatTime(Number.NaN)).toBe("--:--")
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("--:--")
  })
})
