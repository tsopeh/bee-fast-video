import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js"
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
 * Used by both the content script and the popup. The content script reads the hostname of its page; the popup reads it
 * from the active tab.
 */
export function useSettings() {
  const [currentHostname, setCurrentHostname] = createSignal("--- unknown domain ---")

  createEffect(() => {
    const isPopup = browser.tabs != null
    if (isPopup) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
        if (currentTab?.url) {
          setCurrentHostname(new URL(currentTab.url).hostname)
        }
      })
    } else {
      setCurrentHostname(window.location.hostname)
    }
  })

  const blacklist = useHostnameListSetting(blacklistedHostnamesItem, currentHostname)
  const fitVideos = useHostnameListSetting(fitVideosHostnamesItem, currentHostname)

  const [rememberedSpeeds, setRememberedSpeeds] = createSignal<Record<string, number>>({})
  createEffect(() => {
    rememberedSpeedsItem.getValue().then((value) => setRememberedSpeeds(value))
    onCleanup(rememberedSpeedsItem.watch((value) => setRememberedSpeeds(value)))
  })

  return {
    currentHostname,
    isDisabledOnThisDomain: blacklist.includesCurrent,
    toggleBlacklistHostName: blacklist.toggleCurrent,
    isFitVideosOnThisDomain: fitVideos.includesCurrent,
    toggleFitVideosOnThisDomain: fitVideos.toggleCurrent,
    /** The remembered speed for this site, or `undefined` when "remember my speed" is off. */
    rememberedSpeed: (): number | undefined => rememberedSpeeds()[currentHostname()],
    /** Remembers a speed for this site; `undefined` turns "remember my speed" off. */
    setRememberedSpeed: (speed: number | undefined) => {
      const { [currentHostname()]: _, ...others } = rememberedSpeeds()
      rememberedSpeedsItem.setValue(speed == null ? others : { ...others, [currentHostname()]: speed })
    },
  }
}

/** A per-site on/off setting, stored as the list of hostnames for which it's on. */
function useHostnameListSetting(
  item: WxtStorageItem<Array<string>, Record<string, unknown>>,
  hostname: Accessor<string>,
) {
  const [hostnames, setHostnames] = createSignal<Array<string>>([])

  createEffect(() => {
    item.getValue().then((value) => setHostnames(value))
    onCleanup(item.watch((value) => setHostnames(value)))
  })

  return {
    includesCurrent: () => hostnames().includes(hostname()),
    toggleCurrent: () => {
      const current = hostname()
      const list = hostnames()
      item.setValue(list.includes(current) ? list.filter((h) => h !== current) : [...list, current])
    },
  }
}
