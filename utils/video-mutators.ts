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

function roundToHundredths(value: number): number {
  return Math.round(value * 100) / 100
}

function getValidSeekTime(totalDuration: number, currentTime: number, adjustment: number): number {
  const time = Math.max(0, currentTime + adjustment)
  // Unknown duration (`NaN`, e.g. before metadata loads) would make the time `NaN`, which the video rejects.
  return Number.isNaN(totalDuration) ? time : Math.min(totalDuration, time)
}
