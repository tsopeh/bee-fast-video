// Page layouts: which videos get a panel, iframes, scroll areas and shadow DOM.

import type { Browser, Frame, Page } from "puppeteer-core"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import {
  boxOf,
  clickInPanel,
  countPanels,
  launchBrowser,
  openPage,
  openPanel,
  sleep,
  startServer,
  waitForVideoReady,
} from "./harness"

let server: Awaited<ReturnType<typeof startServer>>
let browser: Browser
let page: Page | undefined

beforeAll(async () => {
  server = await startServer()
  ;({ browser } = await launchBrowser())
})

afterAll(async () => {
  await browser?.close()
  await server?.close()
})

afterEach(async () => {
  await page?.close()
  page = undefined
})

const countPanelsIn = (frame: Frame) =>
  frame.evaluate(
    () => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelectorAll(".controller").length ?? 0,
  )

describe("which videos get a panel", () => {
  it("only visible videos of at least 50×50 px that are in view", async () => {
    page = await openPage(browser, server.url("visibility.html"))
    await sleep(500)
    // Only `#visible`: not the hidden, transparent, tiny or out-of-view ones.
    expect(await countPanels(page)).toBe(1)

    await page.evaluate(() => document.getElementById("below")?.scrollIntoView())
    await page.waitForFunction(
      () => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelectorAll(".controller").length === 1,
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    // Hiding a video removes its panel (visibility is checked every second).
    await page.evaluate(() => {
      const element = document.getElementById("visible")
      if (element) element.style.opacity = "0"
    })
    await page.waitForFunction(
      () => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelectorAll(".controller").length === 0,
      { timeout: 3000 },
    )
  })

  it("in iframes without an address of their own (srcdoc, about:blank)", async () => {
    page = await browser.newPage()
    await page.goto(server.url("frames.html"))
    await sleep(1500)
    const frames = page.frames().filter((frame) => frame !== page?.mainFrame())
    expect(frames).toHaveLength(2)
    for (const frame of frames) {
      expect(await countPanelsIn(frame)).toBe(1)
    }
  })

  // Reddit puts its videos in the open shadow root of a custom element (see `shadow-player.html`). Not supported yet:
  // when it is, this test fails, and `.fails` should be removed.
  it.fails("in open shadow roots, like Reddit's player", async () => {
    page = await browser.newPage()
    await page.goto(server.url("shadow-player.html"))
    await page.waitForFunction(
      () => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".controller"),
      {
        timeout: 3000,
      },
    )
  })
})

describe("picture-in-picture", () => {
  it("is greyed out with a reason when the site forbids it", async () => {
    page = await openPage(browser, server.url("blocked.html"))
    await openPanel(page)
    const button = await page.evaluate(() => {
      const element = document
        .querySelector("bee-fast-video-root")
        ?.shadowRoot?.querySelector<HTMLButtonElement>('[title*="picture-in-picture"]')
      return { disabled: element?.disabled, title: element?.title }
    })
    expect(button).toEqual({
      disabled: true,
      title: "This site (or your browser settings) doesn't allow picture-in-picture.",
    })
  })

  it("works where the site allows it", async () => {
    page = await openPage(browser, server.url("player.html"))
    await waitForVideoReady(page)
    await openPanel(page)
    await clickInPanel(page, '[title^="Enter picture-in-picture"]')
    await page.waitForFunction(() => document.pictureInPictureElement?.tagName === "VIDEO")
  })
})

describe("scroll areas", () => {
  it("keep the panel on its video while the area scrolls", async () => {
    page = await openPage(browser, server.url("scroll-area.html"))
    const offset = async () => {
      const panel = await boxOf(page as Page, ".controller")
      const videoRect = await (page as Page).evaluate(() => {
        const rect = document.querySelector("video")?.getBoundingClientRect()
        return { x: rect?.x ?? 0, y: rect?.y ?? 0 }
      })
      return { x: panel.x - videoRect.x, y: panel.y - videoRect.y }
    }
    expect(await offset()).toEqual({ x: 5, y: 5 })
    for (const top of [50, 120, 180]) {
      await page.evaluate((top) => document.getElementById("feed")?.scrollTo(0, top), top)
      // Well under the 1 s timer that would catch up otherwise.
      await page.evaluate(() => new Promise(requestAnimationFrame))
      await page.evaluate(() => new Promise(requestAnimationFrame))
      expect(await offset()).toEqual({ x: 5, y: 5 })
    }
  })
})
