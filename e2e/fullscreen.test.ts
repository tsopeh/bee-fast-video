import type { Page } from "puppeteer-core"
import { beforeEach, describe, expect, it } from "vitest"
import { isPanelOnTop, openPlayer, panelOffset, sleep, useBrowser, video } from "./harness"

const env = useBrowser()
let page: Page

beforeEach(async () => {
  await page?.close()
  page = await openPlayer(env)
})

describe("fullscreen", () => {
  it("keeps the panel on top when the site makes its player fullscreen", async () => {
    await page.click("#site-fullscreen")
    await page.waitForFunction(() => document.fullscreenElement?.id === "player")
    // Fullscreen resizes the video, and the panel follows.
    await expect.poll(() => panelOffset(page)).toEqual({ x: 5, y: 5 })
    expect(await isPanelOnTop(page)).toBe(true)
  })

  // Chrome only lets you click inside the fullscreen element, and a `<video>` can't hold the panel (see `host.ts`).
  it("shows the panel, unclickable, and keeps shortcuts working when the video itself is fullscreen", async () => {
    await page.click("#video-fullscreen")
    await page.waitForFunction(() => document.fullscreenElement?.tagName === "VIDEO")
    const isShownOnTop = await page.evaluate(() =>
      document.querySelector("bee-fast-video-root")?.matches(":popover-open"),
    )
    expect(isShownOnTop).toBe(true)
    await page.keyboard.press("x")
    await sleep(50)
    expect(await video(page, "playbackRate")).toBe(1.25)
    await page.evaluate(() => document.exitFullscreen())
    await page.waitForFunction(() => document.fullscreenElement == null)
    // Back to normal: clickable again.
    expect(await isPanelOnTop(page)).toBe(true)
  })

  it("stays on top of the page without fullscreen", async () => {
    // A page element with the highest z-index, over the video's corner.
    await page.evaluate(() => {
      const cover = document.createElement("div")
      cover.style.cssText = "position: fixed; inset: 0; z-index: 2147483647"
      document.body.append(cover)
    })
    expect(await isPanelOnTop(page)).toBe(true)
  })
})
