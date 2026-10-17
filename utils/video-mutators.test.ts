import { describe, expect, it } from "vitest"
import { adjustPlaybackRate, seekBy, seekToNormalized } from "./video-mutators"

function fakeVideo(props: Partial<HTMLVideoElement>): HTMLVideoElement {
  return { playbackRate: 1, currentTime: 0, duration: 100, ...props } as HTMLVideoElement
}

describe("adjustPlaybackRate", () => {
  it("adjusts the playback rate", () => {
    const video = fakeVideo({ playbackRate: 1 })
    adjustPlaybackRate(video, 0.25)
    expect(video.playbackRate).toBe(1.25)
  })

  it("clamps to the browser's allowed range [0.1, 16]", () => {
    const slow = fakeVideo({ playbackRate: 0.2 })
    adjustPlaybackRate(slow, -0.25)
    expect(slow.playbackRate).toBe(0.1)

    const fast = fakeVideo({ playbackRate: 15.9 })
    adjustPlaybackRate(fast, 0.25)
    expect(fast.playbackRate).toBe(16)
  })
})

describe("seekBy", () => {
  it("seeks by the given number of milliseconds", () => {
    const video = fakeVideo({ currentTime: 10 })
    seekBy(video, 5_000)
    expect(video.currentTime).toBe(15)
  })

  it("clamps to the start and end of the video", () => {
    const start = fakeVideo({ currentTime: 3 })
    seekBy(start, -5_000)
    expect(start.currentTime).toBe(0)

    const end = fakeVideo({ currentTime: 98, duration: 100 })
    seekBy(end, 5_000)
    expect(end.currentTime).toBe(100)
  })
})

describe("seekToNormalized", () => {
  it("seeks to a fraction of the duration", () => {
    const video = fakeVideo({ duration: 200 })
    seekToNormalized(video, 0.3)
    expect(video.currentTime).toBe(60)
  })

  it("ignores values outside [0, 1]", () => {
    const video = fakeVideo({ currentTime: 42 })
    seekToNormalized(video, 1.5)
    expect(video.currentTime).toBe(42)
  })
})
