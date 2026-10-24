// Page layouts: which videos get a panel, iframes, scroll areas and shadow DOM.

import type { Page } from "puppeteer-core"
import { afterEach, describe, expect, it } from "vitest"
import { countPanels, openPage, panelOffset, sleep, useBrowser } from "./harness"

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

  it("only once the page has a video, and not after it's removed", async () => {
    page = await env.browser.newPage()
    await page.goto(env.url("no-video.html"))
    // Give the content script time to start.
    await sleep(500)
    expect(await page.$("bee-fast-video-root")).toBeNull()

    await page.evaluate(() => {
      const slot = document.getElementById("slot")
      if (slot) slot.innerHTML = `<div><video src="clip.webm" muted width="320" height="180"></video></div>`
    })
    await waitForPanels(page, 1)

    // Remove the video's parent, not the video itself.
    await page.evaluate(() => document.querySelector("#slot > div")?.remove())
    await waitForPanels(page, 0)
  })

  // Reddit puts its videos in the open shadow root of a custom element (see `shadow-player.html`).
  it("in open shadow roots, like Reddit's player, also ones added later", async () => {
    page = await env.browser.newPage()
    await page.goto(env.url("shadow-player.html"))
    // Gives the content script time to start, so it's already watching when the player gets its shadow root.
    await sleep(300)
    await page.evaluate(() => (window as unknown as { definePlayers: () => void }).definePlayers())
    await page.waitForSelector(">>> .controller", { timeout: 3000 })
    // Not the hidden 0×0 preview video a few shadow roots deeper.
    await sleep(500)
    expect(await countPanels(page)).toBe(1)
    await page.evaluate(() => document.body.append(document.createElement("shadow-player")))
    await waitForPanels(page, 2)

    // Keys go to the video under the mouse, which takes looking inside the shadow roots.
    const rates = () =>
      page?.$$eval("shadow-player", (players) =>
        players.map((player) => player.shadowRoot?.querySelector("video")?.playbackRate),
      )
    const second = await page.evaluate(() => {
      const box = document
        .querySelectorAll("shadow-player")[1]
        ?.shadowRoot?.querySelector("video")
        ?.getBoundingClientRect()
      return { x: (box?.x ?? 0) + 100, y: (box?.y ?? 0) + 100 }
    })
    await page.mouse.move(second.x, second.y)
    await sleep(200)
    await page.keyboard.press("x")
    await sleep(50)
    expect(await rates()).toEqual([1, 1.25])
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
