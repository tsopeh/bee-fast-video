import { describe, expect, it } from "vitest"
import { copyMovedSettings } from "./moved-settings"

function fakeArea(items: Record<string, unknown>) {
  return {
    items,
    get: async (keys: Array<string>) =>
      Object.fromEntries(keys.filter((key) => key in items).map((key) => [key, items[key]])),
    set: async (added: Record<string, unknown>) => {
      Object.assign(items, added)
    },
  }
}

describe("copyMovedSettings", () => {
  it("copies the settings from sync to local storage, but keeps the ones this device has", async () => {
    const sync = fakeArea({
      rememberedSpeeds: { "example.com": 1.5 },
      fitVideosHostnames: ["example.com"],
      blacklistedHostnames: ["meet.google.com"],
    })
    const local = fakeArea({ fitVideosHostnames: ["kept.example.com"] })
    await copyMovedSettings(sync, local)
    expect(local.items).toEqual({ rememberedSpeeds: { "example.com": 1.5 }, fitVideosHostnames: ["kept.example.com"] })
    // Other devices still find them in sync storage when they update.
    expect(sync.items.rememberedSpeeds).toEqual({ "example.com": 1.5 })
  })
})
