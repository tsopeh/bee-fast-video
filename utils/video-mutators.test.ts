import { describe, expect, it } from "vitest"
import { adjustedPlaybackRate, adjustVolume, seekBy, seekToNormalized, stepFrame } from "./video-mutators"

function fakeVideo(props: Partial<HTMLVideoElement>): HTMLVideoElement {
  return { playbackRate: 1, currentTime: 0, duration: 100, ...props } as HTMLVideoElement
}

describe("adjustedPlaybackRate", () => {
  it("adjusts the playback rate", () => {
    expect(adjustedPlaybackRate(1, 0.25)).toBe(1.25)
  })

  it("clamps to the browser's allowed range [0.1, 16]", () => {
    expect(adjustedPlaybackRate(0.2, -0.25)).toBe(0.1)
    expect(adjustedPlaybackRate(15.9, 0.25)).toBe(16)
  })

  it("doesn't snap to a grid: stepping up then down returns to the starting rate", () => {
    expect(adjustedPlaybackRate(1.1, 0.25)).toBe(1.35)
    expect(adjustedPlaybackRate(1.35, -0.25)).toBe(1.1)
  })

  it("doesn't accumulate floating point noise", () => {
    let rate = 1
    for (let i = 0; i < 3; i++) {
      rate = adjustedPlaybackRate(rate, 0.1)
    }
    expect(rate).toBe(1.3)
  })
})

describe("adjustVolume", () => {
  it("changes the volume and unmutes", () => {
    const video = fakeVideo({ volume: 0.47, muted: true })
    adjustVolume(video, 0.05)
    // A muted video counts as volume 0.
    expect(video.volume).toBe(0.05)
    expect(video.muted).toBe(false)
  })

  it("doesn't snap to a grid, and stays within [0, 1]", () => {
    const video = fakeVideo({ volume: 0.47, muted: false })
    adjustVolume(video, 0.05)
    expect(video.volume).toBe(0.52)
    adjustVolume(video, -0.05)
    expect(video.volume).toBe(0.47)
    adjustVolume(video, 1)
    expect(video.volume).toBe(1)
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

  it("doesn't snap to a grid, so going back and forth keeps the playback progress", () => {
    const video = fakeVideo({ currentTime: 12.3 })
    seekBy(video, 5_000)
    expect(video.currentTime).toBe(17.3)
    video.currentTime += 0.4 // The video plays on in the meantime.
    seekBy(video, -5_000)
    expect(video.currentTime).toBeCloseTo(12.7)
  })

  it("seeks forward when the duration is unknown or infinite (live)", () => {
    const unknown = fakeVideo({ currentTime: 10, duration: Number.NaN })
    seekBy(unknown, 5_000)
    expect(unknown.currentTime).toBe(15)

    const live = fakeVideo({ currentTime: 10, duration: Number.POSITIVE_INFINITY })
    seekBy(live, 5_000)
    expect(live.currentTime).toBe(15)
  })
})

describe("stepFrame", () => {
  it("pauses and moves by one frame", () => {
    let isPaused = false
    const video = fakeVideo({ currentTime: 10, pause: () => (isPaused = true) })
    stepFrame(video, 1, 0.04)
    expect(isPaused).toBe(true)
    expect(video.currentTime).toBeCloseTo(10.04)
    stepFrame(video, -1, 0.04)
    expect(video.currentTime).toBeCloseTo(10)
  })

  it("stays within the video", () => {
    const video = fakeVideo({ currentTime: 0, pause: () => {} })
    stepFrame(video, -1, 0.04)
    expect(video.currentTime).toBe(0)
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
