export function adjustPlaybackRate (videoEl: HTMLVideoElement, adjustment: number) {
  videoEl.playbackRate = getValidPlaybackRate(videoEl.playbackRate, adjustment)
}

export function seekBy (videoEl: HTMLVideoElement, seekMs: number) {
  const seekSeconds = seekMs / 1000
  videoEl.currentTime = getValidSeekTime(videoEl.duration, videoEl.currentTime, seekSeconds)
}

export function seekToNormalized (videoEl: HTMLVideoElement, normalized: number) {
  if (normalized >= 0 && normalized <= 1) {
    videoEl.currentTime = Math.round(videoEl.duration * normalized)
  }
}

export function togglePlayPause (videoEl: HTMLVideoElement) {
  const isPaused = videoEl.paused
  if (isPaused) {
    videoEl.play().catch(() => console.log("bee-fast-video:", "Could not play the video", videoEl))
  } else {
    videoEl.pause()
  }
}

export function toggleLoop (videoEl: HTMLVideoElement) {
  videoEl.loop = !videoEl.loop
}

export function togglePictureInPicture (videoEl: HTMLVideoElement) {
  const isPictureInPicture = videoEl.ownerDocument.pictureInPictureElement == videoEl
  if (isPictureInPicture) {
    videoEl.ownerDocument.exitPictureInPicture().catch(() => console.log("bee-fast-video:", "Could not exit from the picture-in-picture mode for video", videoEl))
  } else {
    videoEl.disablePictureInPicture = false
    videoEl.requestPictureInPicture().catch(() => console.log("bee-fast-video:", "Could not enter the picture-in-picture mode for video", videoEl))
  }
}

function getValidPlaybackRate (current: number, adjustment: number): number {
  const chromeMinAllowedPlaybackRate = 0.1
  const chromeMaxAllowedPlaybackRate = 16
  return Math.min(chromeMaxAllowedPlaybackRate, Math.max(chromeMinAllowedPlaybackRate, current + adjustment))
}

function getValidSeekTime (totalDuration: number, currentTime: number, adjustment: number): number {
  return Math.min(totalDuration, Math.max(0, currentTime + adjustment))
}
