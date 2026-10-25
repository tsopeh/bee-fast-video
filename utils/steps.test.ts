import { describe, expect, it } from "vitest"
import { areDefaultSteps, changedSteps, DEFAULT_STEPS, parseStep, resolveSteps, secondsLabel } from "./steps"

describe("parseStep", () => {
  it("reads a number, also with a comma as the decimal point", () => {
    expect(parseStep("speed", "0.5")).toBe(0.5)
    expect(parseStep("speed", " 2 ")).toBe(2)
    expect(parseStep("seek", "2,5")).toBe(2.5)
  })

  it("refuses text that isn't a number", () => {
    expect(parseStep("speed", "")).toBeUndefined()
    expect(parseStep("speed", "fast")).toBeUndefined()
    expect(parseStep("seek", "5 s")).toBeUndefined()
  })

  it("moves values into range, and rounds them", () => {
    expect(parseStep("speed", "0")).toBe(0.01)
    expect(parseStep("shiftSpeed", "-1")).toBe(0.01)
    expect(parseStep("speed", "100")).toBe(16)
    expect(parseStep("speed", "0.333")).toBe(0.33)
    expect(parseStep("seek", "0")).toBe(0.1)
    expect(parseStep("shiftSeek", "99999")).toBe(3600)
    expect(parseStep("seek", "2.25")).toBe(2.3)
  })
})

describe("stored steps", () => {
  it("keeps only changed steps, and fills in the defaults", () => {
    const steps = { ...DEFAULT_STEPS, seek: 10 }
    expect(changedSteps(steps)).toEqual({ seek: 10 })
    expect(resolveSteps({ seek: 10 })).toEqual(steps)
    expect(areDefaultSteps(steps)).toBe(false)
    expect(areDefaultSteps(resolveSteps({}))).toBe(true)
  })
})

it("says seconds in the singular for one", () => {
  expect(secondsLabel(1)).toBe("1 second")
  expect(secondsLabel(2.5)).toBe("2.5 seconds")
})
