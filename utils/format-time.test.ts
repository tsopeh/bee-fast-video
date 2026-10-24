import { describe, expect, it } from "vitest"
import { formatHours, formatPlaybackRate, formatTime, timeLeftAtSpeed } from "./format-time"

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

describe("formatHours", () => {
  it("shows hours with one decimal", () => {
    expect(formatHours(0)).toBe("0.0 hours")
    expect(formatHours(51_120)).toBe("14.2 hours")
    expect(formatHours(-1800)).toBe("-0.5 hours")
  })

  it("never shows minus zero", () => {
    expect(formatHours(-100)).toBe("0.0 hours")
  })
})

describe("timeLeftAtSpeed", () => {
  it("divides the time left by the speed", () => {
    expect(timeLeftAtSpeed(2400, 2)).toBe(1200)
    expect(timeLeftAtSpeed(60, 0.5)).toBe(120)
  })

  it("keeps the time left when the speed is 0", () => {
    expect(timeLeftAtSpeed(60, 0)).toBe(60)
  })
})
