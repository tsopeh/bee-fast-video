import { describe, expect, it } from "vitest"
import { createWheelStepper } from "./wheel-stepper"

describe("createWheelStepper", () => {
  it("steps up for scrolling up and down for scrolling down", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(0, -3)).toBe(1)
    time = 200
    expect(step(0, 3)).toBe(-1)
  })

  it("steps up for scrolling right and down for scrolling left", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(3, 0)).toBe(1)
    time = 200
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

  it("keeps the axis of a swipe's first event until it pauses", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(1, -4)).toBe(1)
    // Down and right in the same swipe still counts as down.
    time = 100
    expect(step(6, 4)).toBe(-1)
    // After a pause, the next swipe picks its axis anew.
    time = 400
    expect(step(3, 2)).toBe(1)
  })

  it("counts 45° as vertical", () => {
    const step = createWheelStepper(100, () => 0)
    expect(step(2, 2)).toBe(-1)
  })

  it("steps by the movement since the last step, not by the last event", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(3, 0)).toBe(1)
    for (time = 10; time < 100; time += 10) {
      expect(step(3, 0)).toBe(0)
    }
    // One stray event the other way doesn't reverse the swipe.
    expect(step(-1, -1)).toBe(1)
  })

  it("follows the swipe when it turns back on its axis", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(0, -2)).toBe(1)
    for (time = 10; time <= 100; time += 10) {
      expect(step(0, 2)).toBe(time === 100 ? -1 : 0)
    }
  })

  it("needs 4 px of movement to step the other way within a swipe", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(0, -2)).toBe(1)
    time = 100
    expect(step(0, 3)).toBe(0)
    time = 110
    expect(step(0, 1)).toBe(-1)
  })

  it("lets jitter against the swipe cancel out", () => {
    let time = 0
    const step = createWheelStepper(100, () => time)
    expect(step(0, -2)).toBe(1)
    time = 100
    expect(step(0, 3)).toBe(0)
    // The swipe goes on as before: 3 px back, 5 px on.
    time = 110
    expect(step(0, -5)).toBe(1)
  })
})
