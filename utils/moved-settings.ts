/** Settings that moved from sync to local storage. Their keys stayed the same. */
const MOVED_TO_LOCAL = ["fitVideosHostnames", "rememberedSpeeds"]

interface StorageArea {
  get(keys: Array<string>): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

/**
 * Copies the settings that moved to local storage, unless this device already has them. They stay in sync storage, so
 * other devices still get them when they update.
 */
export async function copyMovedSettings(sync: StorageArea, local: StorageArea) {
  const [synced, current] = await Promise.all([sync.get(MOVED_TO_LOCAL), local.get(MOVED_TO_LOCAL)])
  const missing: Record<string, unknown> = {}
  for (const key of MOVED_TO_LOCAL) {
    if (current[key] === undefined && synced[key] !== undefined) {
      missing[key] = synced[key]
    }
  }
  await local.set(missing)
}
