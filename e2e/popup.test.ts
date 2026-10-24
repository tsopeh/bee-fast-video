import type { KeyInput, Page } from "puppeteer-core"
import { describe, expect, it } from "vitest"
import { countPanels, openPanel, openPlayer, openPopup, setVideo, sleep, useBrowser, video } from "./harness"

const env = useBrowser()

describe("popup", () => {
  it("shows the current site, and turns the extension off and on for it", async () => {
    const page = await openPlayer(env)
    const popup = await openPopup(env, page)
    await popup.waitForFunction(() => document.querySelector(".hostname")?.textContent === "127.0.0.1")
    expect(await popup.$eval(".site-switch .switch", (element) => (element as HTMLInputElement).checked)).toBe(true)

    await popup.click(".site-switch .switch")
    await popup.waitForFunction(() => document.querySelector(".site-state")?.textContent === "Off for")
    await page.waitForSelector(">>> .controller", { hidden: true })
    expect(await countPanels(page)).toBe(0)

    await popup.click(".site-switch .switch")
    await page.waitForSelector(">>> .controller")
    expect(await countPanels(page)).toBe(1)
  })

  it("adds up the time saved by watching faster, on this device and others", async () => {
    const page = await openPlayer(env)
    const popup = await openPopup(env, page)
    await popup.waitForFunction(() => document.querySelector(".stats-value")?.textContent === "0.0 hours")

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
    await popup.waitForFunction(() => document.querySelector(".stats-value")?.textContent === "14.2 hours")
    await popup.evaluate(() => chrome.storage.sync.set({ "savedSeconds.other-device": 3600 }))
    await popup.waitForFunction(() => document.querySelector(".stats-value")?.textContent === "15.2 hours")
  })
})

describe("popup keys", () => {
  const DEFAULTS = ["Z", "X", "A", "D", "Q", "E", "S"]
  const keyLabels = (popup: Page) => popup.$$eval(".key", (keys) => keys.map((key) => key.textContent))
  /** Clicks the key button at `index`, in the order of `DEFAULTS`, and presses `key`. */
  const changeKey = async (popup: Page, index: number, key: KeyInput) => {
    // In Firefox, `ElementHandle.click()` here sometimes never returns. Clicking by position works.
    const box = await (await popup.$$(".key"))[index]?.boundingBox()
    if (box == null) {
      throw new Error(`No key button ${index}`)
    }
    await popup.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await popup.waitForSelector(".key.recording")
    await popup.keyboard.press(key)
    await sleep(50)
  }
  const slowDownTitle = (page: Page) => page.$eval(">>> .control[title^='Slow down']", (el) => el.getAttribute("title"))

  it("change when a key is clicked and a new one pressed, swap when taken, and reset", async () => {
    const page = await openPlayer(env)
    const popup = await openPopup(env, page)
    expect(await keyLabels(popup)).toEqual(DEFAULTS)
    expect(await popup.$(".reset-keys")).toBeNull()

    // Number keys always seek, so they're refused and the button keeps waiting. Escape stops waiting.
    await changeKey(popup, 6, "5")
    expect(await popup.$(".key.recording")).not.toBeNull()
    await popup.keyboard.press("Escape")
    await popup.waitForFunction(() => document.querySelector(".key.recording") == null)
    expect(await keyLabels(popup)).toEqual(DEFAULTS)

    await changeKey(popup, 6, "k")
    // Slow down takes X, so speed up gets Z.
    await changeKey(popup, 0, "x")
    await popup.waitForFunction(() => document.querySelector(".key")?.textContent === "X")
    expect(await keyLabels(popup)).toEqual(["X", "Z", "A", "D", "Q", "E", "K"])

    await page.bringToFront()
    await page.click("#overlay")
    await page.keyboard.press("x")
    await sleep(50)
    expect(await video(page, "playbackRate")).toBe(0.75)
    await page.keyboard.press("k")
    await page.waitForFunction(() => !document.querySelector("video")?.paused)
    await page.keyboard.press("s")
    await sleep(50)
    expect(await video(page, "paused")).toBe(false)
    await openPanel(page)
    expect(await slowDownTitle(page)).toBe("Slow down (X)")

    await popup.click(".reset-keys")
    await popup.waitForFunction(() => document.querySelector(".reset-keys") == null)
    expect(await keyLabels(popup)).toEqual(DEFAULTS)
    await sleep(100)
    expect(await slowDownTitle(page)).toBe("Slow down (Z)")
  })
})

// The popup's extension API, as far as these tests use it.
interface StorageArea {
  get(keys: string | Array<string>): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}
declare const chrome: { storage: { local: StorageArea; sync: StorageArea } }
