import { describe, expect, it } from "vitest"
import { isVideoVisibleEnough, MIN_VIDEO_SIZE_PX } from "./video-visibility"

function fakeVideo(width: number, height: number, checkVisibility?: () => boolean): HTMLVideoElement {
  return { getBoundingClientRect: () => ({ width, height }), checkVisibility } as unknown as HTMLVideoElement
}

describe("isVideoVisibleEnough", () => {
  it("accepts a visible video of a reasonable size", () => {
    expect(isVideoVisibleEnough(fakeVideo(320, 180, () => true))).toBe(true)
  })

  it("rejects videos smaller than the minimum size in either dimension", () => {
    expect(isVideoVisibleEnough(fakeVideo(MIN_VIDEO_SIZE_PX - 1, 180, () => true))).toBe(false)
    expect(isVideoVisibleEnough(fakeVideo(320, MIN_VIDEO_SIZE_PX - 1, () => true))).toBe(false)
  })

  it("rejects videos that checkVisibility reports as hidden", () => {
    expect(isVideoVisibleEnough(fakeVideo(320, 180, () => false))).toBe(false)
  })

  it("assumes visible when checkVisibility isn't supported", () => {
    expect(isVideoVisibleEnough(fakeVideo(320, 180))).toBe(true)
  })
})
