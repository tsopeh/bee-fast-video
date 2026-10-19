import { describe, expect, it } from "vitest"
import { createWheelStepper } from "./wheel-stepper"

describe("createWheelStepper", () => {
  it("steps up for scrolling up and down for scrolling down", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(0, -3)).toBe(1)
    time = 100
    expect(step(0, 3)).toBe(-1)
  })

  it("steps up for scrolling right and down for scrolling left", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(3, 0)).toBe(1)
    time = 100
    expect(step(-3, 0)).toBe(-1)
  })

  it("ignores events within the interval of the last step", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(0, -1)).toBe(1)
    for (time = 10; time < 100; time += 10) {
      expect(step(0, -1)).toBe(0)
    }
    expect(step(0, -1)).toBe(1)
  })

  it("ignores events without movement", () => {
    const step = createWheelStepper(100, () => 0)
    expect(step(0, 0)).toBe(0)
    expect(step(0, -1)).toBe(1)
  })

  it("goes by the stronger axis of each event, and counts 45° as vertical", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(1, -4)).toBe(1)
    time = 100
    expect(step(-3, -1)).toBe(-1)
    time = 200
    expect(step(-2, -2)).toBe(1)
    time = 300
    expect(step(2, 2)).toBe(-1)
  })
})
