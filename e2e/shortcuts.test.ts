import type { KeyInput, Page } from "puppeteer-core"
import { beforeEach, describe, expect, it } from "vitest"
import { openPlayer, sleep, useBrowser, video } from "./harness"

const env = useBrowser()
let page: Page

beforeEach(async () => {
  await page?.close()
  page = await openPlayer(env)
  // Focus the player, which keeps key presses to itself (see `player.html`).
  await page.click("#overlay")
})

const press = async (key: KeyInput) => {
  await page.keyboard.press(key)
  await sleep(50)
}

describe("keyboard shortcuts", () => {
  it("work even when the player stops key events", async () => {
    await press("x")
    expect(await video(page, "playbackRate")).toBe(1.25)
    await press("z")
    await press("z")
    expect(await video(page, "playbackRate")).toBe(0.75)
    await page.keyboard.down("Shift")
    await press("X")
    await page.keyboard.up("Shift")
    expect(await video(page, "playbackRate")).toBe(0.85)

    await press("d")
    expect(await video(page, "currentTime")).toBeCloseTo(5, 1)
    await page.keyboard.down("Shift")
    await press("D")
    await page.keyboard.up("Shift")
    expect(await video(page, "currentTime")).toBeCloseTo(25, 1)
    await press("a")
    expect(await video(page, "currentTime")).toBeCloseTo(20, 1)
    await press("5")
    expect(await video(page, "currentTime")).toBe(30)

    await press("s")
    await page.waitForFunction(() => !document.querySelector("video")?.paused)
    await press("s")
    expect(await video(page, "paused")).toBe(true)
  })

  it("are ignored while typing in a text field", async () => {
    await page.click("#text")
    await page.keyboard.type("xxdd")
    expect(await video(page, "playbackRate")).toBe(1)
    expect(await video(page, "currentTime")).toBe(0)
  })

  it("step one frame back and forward with Q and E", async () => {
    // Play for a few frames so the frame length can be measured; the test clip is 10 fps.
    await page.evaluate(() => document.querySelector("video")?.play())
    await page.waitForFunction(() => (document.querySelector("video")?.currentTime ?? 0) >= 0.5)
    await press("e")
    expect(await video(page, "paused")).toBe(true)
    const start = await video(page, "currentTime")
    await press("e")
    expect(await video(page, "currentTime")).toBeCloseTo(start + 0.1, 3)
    await press("e")
    expect(await video(page, "currentTime")).toBeCloseTo(start + 0.2, 3)
    await press("q")
    expect(await video(page, "currentTime")).toBeCloseTo(start + 0.1, 3)
  })

  it("keep moving forward when going back and forth while the video plays", async () => {
    await page.evaluate(() => document.querySelector("video")?.play())
    await sleep(300)
    const start = await video(page, "currentTime")
    for (let i = 0; i < 8; i++) {
      await press(i % 2 === 0 ? "d" : "a")
      await sleep(200)
    }
    // After an even number of steps, only the playing time is added: no snapping to multiples of 5 s.
    const end = await video(page, "currentTime")
    expect(end).toBeGreaterThan(start + 0.5)
    expect(end).toBeLessThan(start + 5)
  })

  it("show what they did next to the panel, and replace it on the next key", async () => {
    const feedback = () => page.$$eval(">>> .feedback", (els) => els.map((el) => el.textContent))
    await page.keyboard.press("d")
    expect(await feedback()).toEqual(["+5 s"])
    await page.keyboard.press("a")
    expect(await feedback()).toEqual(["−5 s"])
    await page.keyboard.down("Shift")
    await page.keyboard.press("X")
    await page.keyboard.up("Shift")
    expect(await feedback()).toEqual(["+0.1"])
    await page.keyboard.press("s")
    expect(await feedback()).toEqual(["Play"])
    await page.keyboard.press("5")
    expect(await feedback()).toEqual(["50%"])
    // Gone after half a second.
    await page.waitForSelector(">>> .feedback", { hidden: true, timeout: 2000 })
  })
})
