/** Used until a frame length is measured, e.g. for a video that hasn't played yet. Most videos are 24 to 60 fps. */
const FALLBACK_FRAME_DURATION = 1 / 30

const frameDurations = new WeakMap<HTMLVideoElement, number>()

/** How long one frame of the video lasts, in seconds. */
export function getFrameDuration(videoEl: HTMLVideoElement): number {
  return frameDurations.get(videoEl) ?? FALLBACK_FRAME_DURATION
}

/**
 * Measures the video's frame length while it plays. Videos don't report their frame rate, but the browser reports the
 * media time of each frame it shows. The shortest gap between two frames shown one after another is the frame length;
 * longer gaps come from frames the browser skipped. Returns a function that stops measuring.
 */
export function trackFrameDuration(videoEl: HTMLVideoElement): () => void {
  if (typeof videoEl.requestVideoFrameCallback !== "function") {
    return () => {}
  }
  let previous: VideoFrameCallbackMetadata | undefined
  let callbackId = 0
  const onFrame: VideoFrameRequestCallback = (_now, frame) => {
    if (previous != null && !videoEl.paused && frame.presentedFrames - previous.presentedFrames === 1) {
      const duration = frame.mediaTime - previous.mediaTime
      const shortest = frameDurations.get(videoEl)
      // Anything outside 120 fps to 10 fps is noise, e.g. from a seek.
      if (duration >= 1 / 120 && duration <= 1 / 10 && (shortest == null || duration < shortest)) {
        frameDurations.set(videoEl, duration)
      }
    }
    previous = frame
    callbackId = videoEl.requestVideoFrameCallback(onFrame)
  }
  callbackId = videoEl.requestVideoFrameCallback(onFrame)
  return () => videoEl.cancelVideoFrameCallback(callbackId)
}
