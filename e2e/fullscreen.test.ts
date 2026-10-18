import type { Browser, Page } from "puppeteer-core"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { boxOf, launchBrowser, openPage, sleep, startServer, waitForVideoReady } from "./harness"

let server: Awaited<ReturnType<typeof startServer>>
let browser: Browser
let page: Page

beforeAll(async () => {
  server = await startServer()
  ;({ browser } = await launchBrowser())
})

afterAll(async () => {
  await browser?.close()
  await server?.close()
})

beforeEach(async () => {
  await page?.close()
  page = await openPage(browser, server.url("player.html"))
  await waitForVideoReady(page)
})

/** Whether the speed label is what's drawn on top at its own position, so it can be seen and clicked. */
const isPanelOnTop = async () => {
  const label = await boxOf(page, ".playback-rate")
  return page.evaluate(
    ({ x, y }) => {
      const hit = document.elementFromPoint(x, y)
      return hit?.tagName === "BEE-FAST-VIDEO-ROOT"
    },
    { x: label.centerX, y: label.centerY },
  )
}

/** The panel's offset from the video's top left corner. */
const panelOffset = async () => {
  const panel = await boxOf(page, ".controller")
  const videoRect = await page.evaluate(() => {
    const rect = document.querySelector("video")?.getBoundingClientRect()
    return { x: rect?.x ?? 0, y: rect?.y ?? 0 }
  })
  return { x: panel.x - videoRect.x, y: panel.y - videoRect.y }
}

describe("fullscreen", () => {
  it("keeps the panel on top when the site makes its player fullscreen", async () => {
    await page.click("#site-fullscreen")
    await page.waitForFunction(() => document.fullscreenElement?.id === "player")
    await sleep(1200) // Fullscreen resizes the video; the panel follows within its 1 s timer.
    expect(await isPanelOnTop()).toBe(true)
    const offset = await panelOffset()
    expect(offset.x).toBeCloseTo(5, 0)
    expect(offset.y).toBeCloseTo(5, 0)
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
    expect(await page.evaluate(() => document.querySelector("video")?.playbackRate)).toBe(1.25)
    await page.evaluate(() => document.exitFullscreen())
    await page.waitForFunction(() => document.fullscreenElement == null)
    // Back to normal: clickable again.
    expect(await isPanelOnTop()).toBe(true)
  })

  it("stays on top of the page without fullscreen", async () => {
    // A page element with the highest z-index, over the video's corner.
    await page.evaluate(() => {
      const cover = document.createElement("div")
      cover.style.cssText = "position: fixed; inset: 0; z-index: 2147483647"
      document.body.append(cover)
    })
    expect(await isPanelOnTop()).toBe(true)
  })
})
