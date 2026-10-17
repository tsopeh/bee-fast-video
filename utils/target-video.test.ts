import { describe, expect, it } from "vitest"
import { pickTargetVideo, type VideoTraits } from "./target-video"

const traits = new Map<string, VideoTraits>([
  ["small-playing", { area: 100, isPlaying: true }],
  ["large-playing", { area: 900, isPlaying: true }],
  ["huge-paused", { area: 5000, isPlaying: false }],
  ["tiny-paused", { area: 10, isPlaying: false }],
])
const getTraits = (name: string) => traits.get(name) as VideoTraits

describe("pickTargetVideo", () => {
  it("returns undefined when there are no candidates", () => {
    expect(pickTargetVideo([], undefined, getTraits)).toBeUndefined()
  })

  it("prefers the last interacted video when it's still a candidate", () => {
    expect(pickTargetVideo(["large-playing", "tiny-paused"], "tiny-paused", getTraits)).toBe("tiny-paused")
  })

  it("ignores the last interacted video when it's no longer a candidate", () => {
    expect(pickTargetVideo(["small-playing", "large-playing"], "gone", getTraits)).toBe("large-playing")
  })

  it("prefers a playing video over a larger paused one", () => {
    expect(pickTargetVideo(["huge-paused", "small-playing"], undefined, getTraits)).toBe("small-playing")
  })

  it("picks the largest video among paused ones", () => {
    expect(pickTargetVideo(["tiny-paused", "huge-paused"], undefined, getTraits)).toBe("huge-paused")
  })
})
