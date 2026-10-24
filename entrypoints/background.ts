import { browser, defineBackground } from "#imports"
import { isAddSavedSeconds, SAVED_SECONDS_PREFIX } from "@/utils/saved-time"
import { deviceIdItem, savedSecondsItem } from "@/utils/settings"

/**
 * This device's saved time is copied to sync storage at most this often. Sync storage allows 120 writes a minute and
 * 1800 an hour. Chrome stops an idle background script after 30 s, so a copy waiting longer could be lost.
 */
const SYNC_INTERVAL_MS = 20_000

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message) => {
    if (isAddSavedSeconds(message)) {
      addSavedSeconds(message.addSavedSeconds)
    }
  })
})

// Additions run one after another, so two tabs adding at once can't overwrite each other.
let additions = Promise.resolve()

function addSavedSeconds(seconds: number) {
  additions = additions
    .then(async () => {
      await savedSecondsItem.setValue((await savedSecondsItem.getValue()) + seconds)
      copyToSyncSoon()
    })
    .catch(() => {})
}

let lastCopyAt = Number.NEGATIVE_INFINITY
let copyTimeoutId: ReturnType<typeof setTimeout> | undefined

function copyToSyncSoon() {
  if (copyTimeoutId != null) {
    return
  }
  copyTimeoutId = setTimeout(
    () => {
      copyTimeoutId = undefined
      lastCopyAt = Date.now()
      copyToSync().catch(() => {})
    },
    Math.max(0, lastCopyAt + SYNC_INTERVAL_MS - Date.now()),
  )
}

async function copyToSync() {
  let deviceId = await deviceIdItem.getValue()
  if (deviceId == null) {
    deviceId = crypto.randomUUID()
    await deviceIdItem.setValue(deviceId)
  }
  await browser.storage.sync.set({ [SAVED_SECONDS_PREFIX + deviceId]: await savedSecondsItem.getValue() })
}
