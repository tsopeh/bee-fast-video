import { describe, expect, it } from "vitest"
import { countPanels, openPlayer, openPopup, setVideo, sleep, useBrowser } from "./harness"

const env = useBrowser()

describe("popup", () => {
  it("shows the current site, and turns the extension off and on for it", async () => {
    const page = await openPlayer(env)
    const popup = await openPopup(env, page)
    await popup.waitForFunction(() => document.querySelector(".hostname")?.textContent === "127.0.0.1")
    expect(await popup.$eval(".switch", (element) => (element as HTMLInputElement).checked)).toBe(true)

    await popup.click(".switch")
    await popup.waitForFunction(() => document.querySelector(".site-state")?.textContent === "Off for")
    await page.waitForSelector(">>> .controller", { hidden: true })
    expect(await countPanels(page)).toBe(0)

    await popup.click(".switch")
    await page.waitForSelector(">>> .controller")
    expect(await countPanels(page)).toBe(1)
  })

  it("adds up the time saved by watching faster, on this device and others", async () => {
    const page = await openPlayer(env)
    const popup = await openPopup(env, page)
    await popup.waitForFunction(() => document.querySelector(".stats")?.textContent === "Time saved: 0.0 hours")

    await setVideo(page, { playbackRate: 2 })
    await page.evaluate(() => document.querySelector("video")?.play())
    await sleep(2000)
    // Pausing saves right away. 2 s at 2× played 4 s of video, which saved 2 s.
    await page.evaluate(() => document.querySelector("video")?.pause())
    await popup.waitForFunction(
      async () => Number((await chrome.storage.local.get("savedSeconds")).savedSeconds ?? 0) > 1.5,
    )
    const saved = await popup.evaluate(async () => (await chrome.storage.local.get("savedSeconds")).savedSeconds)
    expect(saved).toBeLessThan(2.5)

    // The background script copies this device's total to sync storage, under the device's own key.
    await popup.waitForFunction(async () => {
      const { savedSeconds, deviceId } = await chrome.storage.local.get(["savedSeconds", "deviceId"])
      const key = `savedSeconds.${deviceId}`
      return typeof deviceId === "string" && (await chrome.storage.sync.get(key))[key] === savedSeconds
    })

    // This device's total comes from local storage, plus every other device's from sync.
    await popup.evaluate(() => chrome.storage.local.set({ savedSeconds: 51_120 }))
    await popup.waitForFunction(() => document.querySelector(".stats")?.textContent === "Time saved: 14.2 hours")
    await popup.evaluate(() => chrome.storage.sync.set({ "savedSeconds.other-device": 3600 }))
    await popup.waitForFunction(() => document.querySelector(".stats")?.textContent === "Time saved: 15.2 hours")
  })
})

// The popup's extension API, as far as these tests use it.
interface StorageArea {
  get(keys: string | Array<string>): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}
declare const chrome: { storage: { local: StorageArea; sync: StorageArea } }
