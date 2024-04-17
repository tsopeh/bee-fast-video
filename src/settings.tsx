import { createEffect, createSignal, onCleanup } from "solid-js"
import { getBrowser } from "./browser-context"

type StorageEventHandler = Parameters<typeof chrome.storage.onChanged.addListener>[0]

interface BeeFastVideoSettings {
  blacklistedHostnames: Array<string>
}

/**
 * This hook will be executed in two independent contexts: content script and popup
 */
export function useSettings () {

  const [settings, setSettings] = createSignal<BeeFastVideoSettings>({ blacklistedHostnames: [] })
  const [currentHostname, setCurrentHostname] = createSignal("--- unknown domain ---")

  createEffect(() => {
    const browserContext = getBrowser()

    // Get current hostname
    const isPopup = browserContext.tabs != null
    if (isPopup) {
      // popup context
      browserContext.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        ([currentTab]) => {
          if (!currentTab.url) {
            return
          }
          const url = new URL(currentTab.url)
          const hostname = url.hostname
          setCurrentHostname(hostname)
        },
      )
    } else {
      // content script context
      setCurrentHostname(window.location.host)
    }

    // Initial
    browserContext.storage.sync.get(({ blacklistedHostnames }) => {
      setSettings(() => {
        return {
          blacklistedHostnames: blacklistedHostnames ?? [],
        }
      })
    })

    // On change update settings
    const handleSettingsChange: StorageEventHandler = (changes) => {
      setSettings(() => {
        return {
          blacklistedHostnames: changes.blacklistedHostnames.newValue,
        }
      })
    }
    browserContext.storage.onChanged.addListener(handleSettingsChange)
    onCleanup(() => {
      browserContext.storage.onChanged.removeListener(handleSettingsChange)
    })
  })

  return {
    currentHostname,
    isDisabledOnThisDomain: () => {
      const _currentHostName = currentHostname()
      return settings().blacklistedHostnames.some((hostname) => hostname === _currentHostName)
    },
    toggleBlacklistHostName: () => {
      const blacklistedHostnames = settings().blacklistedHostnames
      const _currentHostName = currentHostname()
      const alreadyAdded = blacklistedHostnames.some((hostname) => hostname === _currentHostName)
      const updated = alreadyAdded
        ? blacklistedHostnames.filter((hostname) => hostname !== _currentHostName)
        : [...blacklistedHostnames, _currentHostName]
      getBrowser().storage.sync.set({ blacklistedHostnames: updated })
    },
  }
}
