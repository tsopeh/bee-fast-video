import { type Accessor, createSignal, onCleanup } from "solid-js"
import { browser, storage, type WxtStorageItem } from "#imports"

// Same storage key as v1, so that existing users keep their settings.
const blacklistedHostnamesItem = storage.defineItem<Array<string>>("sync:blacklistedHostnames", {
  fallback: [],
})

// Sites on which all videos are limited to 80% of the window (see `FIT_TO_VIEWPORT_STYLES`).
const fitVideosHostnamesItem = storage.defineItem<Array<string>>("sync:fitVideosHostnames", {
  fallback: [],
})

// The speed to use for all videos on a site, for sites where "remember my speed" is on.
const rememberedSpeedsItem = storage.defineItem<Record<string, number>>("sync:rememberedSpeeds", {
  fallback: {},
})

/**
 * Chrome allows 120 writes a minute to sync storage, and scrolling over the speed changes it about 6 times a second.
 * So speed changes are saved at most once a second: the first one right away, the last one when the second is over.
 */
const SPEED_SAVE_INTERVAL_MS = 1000

export type Settings = ReturnType<typeof useSettings>

/**
 * Used by both the content script and the popup. The content script reads the hostname of its page; the popup reads it
 * from the active tab.
 */
export function useSettings() {
  const isPopup = browser.tabs != null
  const [currentHostname, setCurrentHostname] = createSignal(isPopup ? "--- unknown domain ---" : location.hostname)
  if (isPopup) {
    browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
      if (currentTab?.url) {
        setCurrentHostname(new URL(currentTab.url).hostname)
      }
    })
  }

  const blacklist = useStorageItem(blacklistedHostnamesItem)
  const fitVideos = useStorageItem(fitVideosHostnamesItem)
  const rememberedSpeeds = useStorageItem(rememberedSpeedsItem)

  const toggleHostname = (item: typeof blacklistedHostnamesItem, list: Array<string> = []) => {
    const hostname = currentHostname()
    item.setValue(list.includes(hostname) ? list.filter((h) => h !== hostname) : [...list, hostname])
  }

  const saveSpeeds = createThrottle(SPEED_SAVE_INTERVAL_MS, (speeds: Record<string, number>) =>
    rememberedSpeedsItem.setValue(speeds),
  )
  const withSpeed = (speed: number | undefined) => {
    const { [currentHostname()]: _, ...others } = rememberedSpeeds() ?? {}
    return speed == null ? others : { ...others, [currentHostname()]: speed }
  }

  return {
    currentHostname,
    /** Whether all settings have been read from storage. */
    isLoaded: () => blacklist() != null && fitVideos() != null && rememberedSpeeds() != null,
    isDisabledOnThisDomain: () => blacklist()?.includes(currentHostname()) ?? false,
    toggleBlacklistHostName: () => toggleHostname(blacklistedHostnamesItem, blacklist()),
    isFitVideosOnThisDomain: () => fitVideos()?.includes(currentHostname()) ?? false,
    toggleFitVideosOnThisDomain: () => toggleHostname(fitVideosHostnamesItem, fitVideos()),
    /** The remembered speed for this site, or `undefined` when "remember my speed" is off. */
    rememberedSpeed: (): number | undefined => rememberedSpeeds()?.[currentHostname()],
    /** Turns "remember my speed" on (with this speed) or off (`undefined`). Saved right away. */
    toggleRememberedSpeed: (speed: number | undefined) => saveSpeeds.now(withSpeed(speed)),
    /** Remembers a new speed while "remember my speed" is on. */
    updateRememberedSpeed: (speed: number) => saveSpeeds.later(withSpeed(speed)),
  }
}

/** The item's value, or `undefined` until it has been read from storage. */
function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>): Accessor<T | undefined> {
  const [value, setValue] = createSignal<T>()
  item.getValue().then((newValue) => setValue(() => newValue))
  onCleanup(item.watch((newValue) => setValue(() => newValue)))
  return value
}

/** Runs `run` at most once per `intervalMs` with the latest value (`later`), or right away (`now`). */
function createThrottle<T>(intervalMs: number, run: (value: T) => void) {
  let lastRunAt = Number.NEGATIVE_INFINITY
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const now = (value: T) => {
    clearTimeout(timeoutId)
    timeoutId = undefined
    lastRunAt = Date.now()
    run(value)
  }
  const later = (value: T) => {
    const wait = lastRunAt + intervalMs - Date.now()
    clearTimeout(timeoutId)
    if (wait <= 0) {
      now(value)
    } else {
      timeoutId = setTimeout(() => now(value), wait)
    }
  }
  onCleanup(() => clearTimeout(timeoutId))
  return { now, later }
}
