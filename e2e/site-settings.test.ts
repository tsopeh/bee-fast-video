// Per-site settings in the panel: "remember my speed" and "fit videos".

import type { Browser, Page } from "puppeteer-core"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  clickInPanel,
  launchBrowser,
  openPage,
  openPanel,
  sleep,
  startServer,
  video,
  waitForVideoReady,
} from "./harness"

let server: Awaited<ReturnType<typeof startServer>>
let browser: Browser

beforeAll(async () => {
  server = await startServer()
  ;({ browser } = await launchBrowser())
})

afterAll(async () => {
  await browser?.close()
  await server?.close()
})

const REMEMBER = '[title*="emember"]'
const FIT = '[title*="80% of the window"]'

async function freshPage() {
  const page = await openPage(browser, server.url("player.html"))
  await waitForVideoReady(page)
  return page
}

/** Reloads the page and returns the speed the video starts with. */
async function speedAfterReload(page: Page) {
  await page.reload()
  await waitForVideoReady(page)
  await sleep(300)
  return video(page, "playbackRate")
}

const isActive = (page: Page, selector: string) =>
  page.evaluate(
    (selector) =>
      document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(selector)?.classList.contains("active"),
    selector,
  )

describe("remember my speed", () => {
  it("is off by default", async () => {
    const page = await freshPage()
    await page.keyboard.press("x")
    expect(await speedAfterReload(page)).toBe(1)
    await page.close()
  })

  it("remembers only speeds set through the extension, for every video on the site", async () => {
    const page = await freshPage()
    await openPanel(page)
    await clickInPanel(page, '[title^="Speed up"]')
    await clickInPanel(page, '[title^="Speed up"]')
    await clickInPanel(page, REMEMBER)
    expect(await isActive(page, REMEMBER)).toBe(true)
    expect(await speedAfterReload(page)).toBe(1.5)

    // A speed set by the site (like Twitch catching up with a live stream) isn't remembered.
    await page.evaluate(() => {
      const element = document.querySelector("video")
      if (element) element.playbackRate = 1.1
    })
    expect(await speedAfterReload(page)).toBe(1.5)

    // Shortcuts count as the user's choice.
    await page.click("#overlay")
    await page.keyboard.press("x")
    expect(await speedAfterReload(page)).toBe(1.75)

    // A site that resets the speed and loads the next video in the same element still gets the remembered speed.
    await page.evaluate(() => {
      const element = document.querySelector("video")
      if (element) {
        element.playbackRate = 1
        element.src = "clip.webm?next"
      }
    })
    await page.waitForFunction(() => document.querySelector("video")?.currentSrc.endsWith("?next"))
    await waitForVideoReady(page)
    await sleep(100)
    expect(await video(page, "playbackRate")).toBe(1.75)

    // Other pages on the same site get it too.
    const other = await freshPage()
    expect(await video(other, "playbackRate")).toBe(1.75)
    await other.close()

    await openPanel(page)
    await clickInPanel(page, REMEMBER)
    expect(await isActive(page, REMEMBER)).toBe(false)
    expect(await speedAfterReload(page)).toBe(1)
    await page.close()
  })
})

describe("fit videos", () => {
  it("limits all videos on the site to 80% of the window, and undoes it when turned off", async () => {
    const page = await freshPage()
    await openPanel(page)
    await clickInPanel(page, FIT)
    expect(await isActive(page, FIT)).toBe(true)
    const style = () => page.evaluate(() => document.querySelector("video")?.getAttribute("style") ?? "")
    expect(await style()).toContain("max-width: 80vw !important")
    expect(await style()).toContain("max-height: 80vh !important")

    // Still on after a reload.
    await page.reload()
    await waitForVideoReady(page)
    await sleep(300)
    expect(await style()).toContain("max-height: 80vh !important")

    await openPanel(page)
    await clickInPanel(page, FIT)
    expect(await style()).toBe("")
    await page.close()
  })
})
