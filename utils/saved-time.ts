// Time saved by watching faster than 1×, in seconds, net of time lost below 1×. Sync storage keeps whichever write
// came last, so two devices adding to one shared number would lose one of the additions. Instead each device writes
// only its own total, under its own key, and the popup adds them up. A device that is gone leaves its key, so its
// time still counts.

/** Sync storage key prefix for each device's total: `savedSeconds.<device id>`. */
export const SAVED_SECONDS_PREFIX = "savedSeconds."

/** What the content script sends the background script after measuring saved time. */
export interface AddSavedSeconds {
  addSavedSeconds: number
}

export function isAddSavedSeconds(message: unknown): message is AddSavedSeconds {
  return typeof (message as AddSavedSeconds | null)?.addSavedSeconds === "number"
}

/**
 * The total of all devices. This device's own total comes from local storage, which is always current; its copy in
 * sync storage can be up to `SYNC_INTERVAL_MS` behind.
 */
export function totalSavedSeconds(syncItems: Record<string, unknown>, deviceId: string | null, ownSeconds: number) {
  let total = ownSeconds
  for (const [key, value] of Object.entries(syncItems)) {
    if (key.startsWith(SAVED_SECONDS_PREFIX) && key !== SAVED_SECONDS_PREFIX + deviceId && typeof value === "number") {
      total += value
    }
  }
  return total
}
