import { savedSecondsItem } from "@/utils/settings"

/** Saved time is written at most this often while videos play, and also when one pauses or the page is hidden. */
const SAVE_INTERVAL_MS = 10_000

// Time saved by all videos in this frame, not written yet.
let unsaved = 0
let saveTimeoutId: ReturnType<typeof setTimeout> | undefined

function save() {
  clearTimeout(saveTimeoutId)
  saveTimeoutId = undefined
  if (unsaved === 0) {
    return
  }
  const added = unsaved
  unsaved = 0
  // Another tab can write between this read and write, and one of the two additions is lost. That costs at most
  // `SAVE_INTERVAL_MS` of one tab's saved time, which the total can afford.
  savedSecondsItem
    .getValue()
    .then((total) => savedSecondsItem.setValue(total + added))
    // Fails after the extension is updated or removed, while the old content script still runs.
    .catch(() => {})
}

let isListeningForPageHide = false

/**
 * Counts the time saved by watching the video faster than 1×, and lost below 1×, for the popup. Between two
 * `timeupdate` events, the video time that passed took that time divided by the speed to watch. Seeks, loops and
 * speed changes start a new measurement, so a jump never counts. Returns a function that stops counting.
 */
export function trackSavedTime(videoEl: HTMLVideoElement): () => void {
  if (!isListeningForPageHide) {
    isListeningForPageHide = true
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && save())
    window.addEventListener("pagehide", save)
  }
  let lastTime: number | undefined
  const restart = () => {
    lastTime = undefined
  }
  const onTimeUpdate = () => {
    const time = videoEl.currentTime
    const played = lastTime == null ? 0 : time - lastTime
    lastTime = time
    if (played > 0 && videoEl.playbackRate > 0) {
      unsaved += played - played / videoEl.playbackRate
      saveTimeoutId ??= setTimeout(save, SAVE_INTERVAL_MS)
    }
  }
  const onPause = () => {
    onTimeUpdate()
    save()
  }
  const listeners = new AbortController()
  const { signal } = listeners
  videoEl.addEventListener("timeupdate", onTimeUpdate, { signal })
  videoEl.addEventListener("pause", onPause, { signal })
  for (const type of ["seeking", "ratechange", "emptied"]) {
    videoEl.addEventListener(type, restart, { signal })
  }
  return () => listeners.abort()
}
