import { createEffect, createSignal, onCleanup } from "solid-js"
import { browser, storage } from "#imports"

// Same storage key as v1, so that existing users keep their settings.
const blacklistedHostnamesItem = storage.defineItem<Array<string>>("sync:blacklistedHostnames", {
  fallback: [],
})

/**
 * This hook will be executed in two independent contexts: content script and popup
 */
export function useSettings() {
  const [blacklistedHostnames, setBlacklistedHostnames] = createSignal<Array<string>>([])
  const [currentHostname, setCurrentHostname] = createSignal("--- unknown domain ---")

  createEffect(() => {
    // Get current hostname
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

    blacklistedHostnamesItem.getValue().then((value) => setBlacklistedHostnames(value))
    const unwatch = blacklistedHostnamesItem.watch((value) => setBlacklistedHostnames(value))
    onCleanup(unwatch)
  })

  return {
    currentHostname,
    isDisabledOnThisDomain: () => {
      return blacklistedHostnames().includes(currentHostname())
    },
    toggleBlacklistHostName: () => {
      const hostnames = blacklistedHostnames()
      const hostname = currentHostname()
      const updated = hostnames.includes(hostname) ? hostnames.filter((h) => h !== hostname) : [...hostnames, hostname]
      blacklistedHostnamesItem.setValue(updated)
    },
  }
}
