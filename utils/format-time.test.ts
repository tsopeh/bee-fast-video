import { describe, expect, it } from "vitest"
import { formatPlaybackRate, formatTime } from "./format-time"

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

describe("formatPlaybackRate", () => {
  it("always shows two decimals", () => {
    expect(formatPlaybackRate(1)).toBe("1.00")
    expect(formatPlaybackRate(0.5)).toBe("0.50")
    expect(formatPlaybackRate(1.25)).toBe("1.25")
  })

  it("rounds to two decimals", () => {
    expect(formatPlaybackRate(1.3333)).toBe("1.33")
  })
})
