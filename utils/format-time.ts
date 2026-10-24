/** Formats seconds as `m:ss`, or `h:mm:ss` from one hour on. Non-finite input (unknown duration) gives `--:--`. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "--:--"
  }
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = s.toString().padStart(2, "0")
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`
}

/** Formats a playback rate with two decimals, e.g. `1.00`, `1.25`, `0.50`, so that the label keeps its width. */
export function formatPlaybackRate(rate: number): string {
  return rate.toFixed(2)
}

/** Hours with one decimal, like Steam's play time: `14.2 hours`. */
export function formatHours(seconds: number): string {
  const hours = (seconds / 3600).toFixed(1)
  // -0.04 hours would show as "-0.0".
  return `${hours === "-0.0" ? "0.0" : hours} hours`
}

/**
 * How long the rest of the video takes to watch at this speed: 40 minutes left at 2× take 20. A rate of 0 or less
 * (which some browsers allow) gives the time left as is.
 */
export function timeLeftAtSpeed(secondsLeft: number, rate: number): number {
  return rate > 0 ? secondsLeft / rate : secondsLeft
}
