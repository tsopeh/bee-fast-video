// Page layouts: which videos get a panel, iframes, scroll areas and shadow DOM.

import type { Page } from "puppeteer-core"
import { afterEach, describe, expect, it } from "vitest"
import { clickInPanel, countPanels, openPage, openPanel, openPlayer, panelOffset, sleep, useBrowser } from "./harness"

const env = useBrowser()
let page: Page | undefined

afterEach(async () => {
  await page?.close()
  page = undefined
})

/** Waits for the number of panels on the page to be `count`. */
const waitForPanels = (page: Page, count: number) => expect.poll(() => countPanels(page), { timeout: 3000 }).toBe(count)

describe("which videos get a panel", () => {
  it("only visible videos of at least 50×50 px that are in view", async () => {
    page = await openPage(env, "visibility.html")
    // Give any wrong panels time to show up too.
    await sleep(500)
    // Only `#visible`: not the hidden, transparent, tiny or out-of-view ones.
    expect(await countPanels(page)).toBe(1)

    await page.evaluate(() => document.getElementById("below")?.scrollIntoView())
    await waitForPanels(page, 1)
    await page.evaluate(() => window.scrollTo(0, 0))
    // Hiding a video removes its panel (visibility is checked every second).
    await page.evaluate(() => {
      const element = document.getElementById("visible")
      if (element) element.style.opacity = "0"
    })
    await waitForPanels(page, 0)
  })

  it("in iframes without an address of their own (srcdoc, about:blank)", async () => {
    page = await env.browser.newPage()
    await page.goto(env.url("frames.html"))
    const frames = page.frames().filter((frame) => frame !== page?.mainFrame())
    expect(frames).toHaveLength(2)
    for (const frame of frames) {
      await frame.waitForSelector(">>> .controller")
      expect(await countPanels(frame)).toBe(1)
    }
  })

  // Reddit puts its videos in the open shadow root of a custom element (see `shadow-player.html`). Not supported yet:
  // when it is, this test fails, and `.fails` should be removed.
  it.fails("in open shadow roots, like Reddit's player", async () => {
    page = await env.browser.newPage()
    await page.goto(env.url("shadow-player.html"))
    await page.waitForSelector(">>> .controller", { timeout: 3000 })
  })
})

describe("picture-in-picture", () => {
  it("is greyed out with a reason when the site forbids it", async () => {
    page = await openPage(env, "blocked.html")
    await openPanel(page)
    const button = await page.$eval('>>> [title*="picture-in-picture"]', (element) => ({
      disabled: (element as HTMLButtonElement).disabled,
      title: element.getAttribute("title"),
    }))
    expect(button).toEqual({
      disabled: true,
      title: "This site (or your browser settings) doesn't allow picture-in-picture.",
    })
  })

  it("works where the site allows it", async () => {
    page = await openPlayer(env)
    await openPanel(page)
    await clickInPanel(page, '[title^="Enter picture-in-picture"]')
    await page.waitForFunction(() => document.pictureInPictureElement?.tagName === "VIDEO")
  })
})

describe("scroll areas", () => {
  it("keep the panel on its video while the area scrolls", async () => {
    const scrollPage = await openPage(env, "scroll-area.html")
    page = scrollPage
    expect(await panelOffset(scrollPage)).toEqual({ x: 5, y: 5 })
    for (const top of [50, 120, 180]) {
      await scrollPage.evaluate((top) => document.getElementById("feed")?.scrollTo(0, top), top)
      // Well under the 1 s timer that would catch up otherwise.
      await scrollPage.evaluate(() => new Promise(requestAnimationFrame))
      await scrollPage.evaluate(() => new Promise(requestAnimationFrame))
      expect(await panelOffset(scrollPage)).toEqual({ x: 5, y: 5 })
    }
  })
})
