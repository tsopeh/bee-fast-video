/** Speed change of the slow down / speed up buttons, the Z / X keys and one scroll step. */
export const SPEED_STEP = 0.25
/** Seek of the back / forward buttons, the A / D keys and one scroll step on the seek bar. */
export const SEEK_STEP_MS = 5_000

// Adjustments (rate, seek, volume) are relative to the current value and never snap to a grid (e.g. multiples of 5 s),
// so going back and forth while the video plays doesn't get stuck in the same window, and stepping up then down returns
// to the starting value. Rates and volumes are only rounded to hundredths to remove floating point noise
// (1 + 0.1 + 0.1 + 0.1 is 1.3000000000000003).

/** The playback rate after changing it by `adjustment`, within Chrome's allowed range [0.1, 16]. */
export function adjustedPlaybackRate(current: number, adjustment: number): number {
  return Math.min(16, Math.max(0.1, roundToHundredths(current + adjustment)))
}

/** Changes the volume by `adjustment` and unmutes. A muted video counts as volume 0. */
export function adjustVolume(videoEl: HTMLVideoElement, adjustment: number) {
  const current = videoEl.muted ? 0 : videoEl.volume
  videoEl.volume = Math.min(1, Math.max(0, roundToHundredths(current + adjustment)))
  videoEl.muted = false
}

export function seekBy(videoEl: HTMLVideoElement, seekMs: number) {
  const seekSeconds = seekMs / 1000
  videoEl.currentTime = getValidSeekTime(videoEl.duration, videoEl.currentTime, seekSeconds)
}

/** Pauses the video and moves it one frame back (-1) or forward (1). */
export function stepFrame(videoEl: HTMLVideoElement, direction: -1 | 1, frameDuration: number) {
  videoEl.pause()
  videoEl.currentTime = getValidSeekTime(videoEl.duration, videoEl.currentTime, direction * frameDuration)
}

export function seekToNormalized(videoEl: HTMLVideoElement, normalized: number) {
  if (normalized >= 0 && normalized <= 1) {
    videoEl.currentTime = Math.round(videoEl.duration * normalized)
  }
}

export function togglePlayPause(videoEl: HTMLVideoElement) {
  const isPaused = videoEl.paused
  if (isPaused) {
    videoEl.play().catch(() => console.log("bee-fast-video:", "Could not play the video", videoEl))
  } else {
    videoEl.pause()
  }
}

export function toggleLoop(videoEl: HTMLVideoElement) {
  videoEl.loop = !videoEl.loop
}

export type PictureInPictureAvailability = "available" | "blocked" | "unsupported"

/**
 * - `unsupported`: the browser has no picture-in-picture web API (e.g. Firefox < 153, which only offers its own
 *   built-in picture-in-picture toggle).
 * - `blocked`: the document disallows it, e.g. via the `Permissions-Policy: picture-in-picture=()` response header or
 *   an iframe without `allow="picture-in-picture"`, or the user turned it off in browser settings.
 *
 * The video's own `disablePictureInPicture` attribute is ignored on purpose; we override it when entering
 * picture-in-picture.
 */
export function getPictureInPictureAvailability(videoEl: HTMLVideoElement): PictureInPictureAvailability {
  const doc = videoEl.ownerDocument
  if (typeof videoEl.requestPictureInPicture !== "function" || typeof doc.pictureInPictureEnabled !== "boolean") {
    return "unsupported"
  }
  return doc.pictureInPictureEnabled ? "available" : "blocked"
}

export function isPictureInPicture(videoEl: HTMLVideoElement): boolean {
  return videoEl.ownerDocument.pictureInPictureElement === videoEl
}

export function togglePictureInPicture(videoEl: HTMLVideoElement) {
  if (getPictureInPictureAvailability(videoEl) !== "available") {
    return
  }
  if (isPictureInPicture(videoEl)) {
    videoEl.ownerDocument
      .exitPictureInPicture()
      .catch(() => console.log("bee-fast-video:", "Could not exit from the picture-in-picture mode for video", videoEl))
  } else {
    videoEl.disablePictureInPicture = false
    videoEl
      .requestPictureInPicture()
      .catch(() => console.log("bee-fast-video:", "Could not enter the picture-in-picture mode for video", videoEl))
  }
}

function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100
}

function getValidSeekTime(totalDuration: number, currentTime: number, adjustment: number): number {
  const time = Math.max(0, currentTime + adjustment)
  // Unknown duration (`NaN`, e.g. before metadata loads) would make the time `NaN`, which the video rejects.
  return Number.isNaN(totalDuration) ? time : Math.min(totalDuration, time)
}
