import type { Browser, Page } from "puppeteer-core"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import {
  boxOf,
  clickInPanel,
  countPanels,
  launchBrowser,
  openPage,
  openPanel,
  scrollFor,
  sleep,
  startServer,
  textOf,
  video,
  waitForVideoReady,
} from "./harness"

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

const videoBox = () =>
  page.evaluate(() => {
    const rect = document.querySelector("video")?.getBoundingClientRect()
    return rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  })

describe("panel", () => {
  it("shows the speed in the video's top left corner, collapsed", async () => {
    expect(await countPanels(page)).toBe(1)
    expect(await textOf(page, ".playback-rate")).toBe("1.00")
    const panel = await boxOf(page, ".controller")
    const box = await videoBox()
    expect(panel.x).toBeCloseTo((box?.x ?? 0) + 5, 0)
    expect(panel.y).toBeCloseTo((box?.y ?? 0) + 5, 0)
    expect(
      await page.evaluate(() => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".seek")),
    ).toBeNull()
  })

  it("reacts to the pointer right away", async () => {
    const label = await boxOf(page, ".playback-rate")
    await page.mouse.move(label.centerX, label.centerY)
    const tag = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
      x: label.centerX,
      y: label.centerY,
    })
    expect(tag).toBe("BEE-FAST-VIDEO-ROOT")
  })

  it("opens and closes with a click on the speed", async () => {
    await openPanel(page)
    expect(await boxOf(page, ".seek")).toBeTruthy()
    await clickInPanel(page, ".playback-rate")
    expect(
      await page.evaluate(() => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".seek")),
    ).toBeNull()
  })

  it("groups the buttons, with close at the end", async () => {
    await openPanel(page)
    const titles = await page.evaluate(() =>
      [...(document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".row")?.children ?? [])].map(
        (el) =>
          el.classList.contains("divider") ? "|" : ((el.getAttribute("title") ?? "").split(/[(.]/)[0] ?? "").trim(),
      ),
    )
    expect(titles).toEqual([
      "Drag to move",
      "Slow down",
      "Speed 1",
      "Speed up",
      "|",
      "Backward 5 seconds",
      "Play",
      "Forward 5 seconds",
      "|",
      "Loop",
      "Enter picture-in-picture",
      "|",
      "Remember my speed for all videos on this site",
      "Fit videos on this site to 80% of the window",
      "|",
      "Hide controls for this video",
    ])
  })

  it("keeps the speed label's width as the speed changes", async () => {
    const widths = []
    for (const rate of [0.25, 1, 1.75, 2.5]) {
      await page.evaluate((rate) => {
        const element = document.querySelector("video")
        if (element) element.playbackRate = rate
      }, rate)
      await sleep(50)
      widths.push((await boxOf(page, ".playback-rate")).width)
    }
    expect(new Set(widths).size).toBe(1)
  })

  it("changes the speed with the buttons, and resets it with a right-click", async () => {
    await openPanel(page)
    await clickInPanel(page, '[title^="Speed up"]')
    await clickInPanel(page, '[title^="Speed up"]')
    expect(await video(page, "playbackRate")).toBe(1.5)
    await clickInPanel(page, '[title^="Slow down"]')
    expect(await video(page, "playbackRate")).toBe(1.25)
    expect(await textOf(page, ".playback-rate")).toBe("1.25")
    await clickInPanel(page, ".playback-rate", { button: "right" })
    expect(await video(page, "playbackRate")).toBe(1)
    // The right-click doesn't close the panel.
    expect(await boxOf(page, ".seek")).toBeTruthy()
  })

  it("changes the speed, time and volume at a steady pace while scrolling", async () => {
    await openPanel(page)
    const label = await boxOf(page, ".playback-rate")
    await scrollFor(page, label.centerX, label.centerY, 1000, "up")
    // One step every 175 ms: about 6 steps of 0.25 in a second.
    expect(await video(page, "playbackRate")).toBeGreaterThanOrEqual(2)
    expect(await video(page, "playbackRate")).toBeLessThanOrEqual(2.75)

    const seek = await boxOf(page, ".seek")
    await scrollFor(page, seek.centerX, seek.centerY, 1000, "up")
    // 5 seconds per step, same pace as the speed.
    expect(await video(page, "currentTime")).toBeGreaterThanOrEqual(20)
    expect(await video(page, "currentTime")).toBeLessThanOrEqual(35)

    await page.evaluate(() => {
      const element = document.querySelector("video")
      if (element) element.volume = 0
    })
    const volume = await boxOf(page, ".volume")
    await scrollFor(page, volume.centerX, volume.centerY, 1000, "up")
    // 5% every 80 ms: about 55% in a second.
    expect(await video(page, "volume")).toBeGreaterThanOrEqual(0.4)
    expect(await video(page, "volume")).toBeLessThanOrEqual(0.7)
    expect(await video(page, "muted")).toBe(false)

    // The page itself didn't scroll.
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  it("switches the time between time played and time left", async () => {
    await openPanel(page)
    await page.evaluate(() => {
      const element = document.querySelector("video")
      if (element) element.currentTime = 20
    })
    await page.waitForFunction(() => document.querySelector("video")?.currentTime === 20)
    await sleep(100)
    expect(await textOf(page, ".time")).toBe("0:20")
    await clickInPanel(page, ".time")
    expect(await textOf(page, ".time")).toBe("0:40")
  })

  it("plays, pauses, seeks and loops with the buttons", async () => {
    await openPanel(page)
    await clickInPanel(page, '[title^="Play"]')
    await page.waitForFunction(() => !document.querySelector("video")?.paused)
    await clickInPanel(page, '[title^="Pause"]')
    expect(await video(page, "paused")).toBe(true)
    const before = await video(page, "currentTime")
    await clickInPanel(page, '[title^="Forward"]')
    expect(await video(page, "currentTime")).toBeCloseTo(before + 5, 1)
    await clickInPanel(page, '[title^="Backward"]')
    expect(await video(page, "currentTime")).toBeCloseTo(before, 1)
    await clickInPanel(page, '[title="Loop"]')
    expect(await video(page, "loop")).toBe(true)
  })

  it("moves the panel by its grip, and puts it back once the video leaves the view", async () => {
    await openPanel(page)
    const start = await boxOf(page, ".controller")
    const grip = await boxOf(page, ".grip")
    await page.mouse.move(grip.centerX, grip.centerY)
    await page.mouse.down()
    await page.mouse.move(grip.centerX + 200, grip.centerY + 100, { steps: 5 })
    await page.mouse.up()
    const moved = await boxOf(page, ".controller")
    expect(moved.x - start.x).toBeCloseTo(200, 0)
    expect(moved.y - start.y).toBeCloseTo(100, 0)

    await page.evaluate(() => window.scrollTo(0, 2000))
    await page.waitForFunction(
      () => !document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".controller"),
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForFunction(() =>
      document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".controller"),
    )
    const back = await boxOf(page, ".controller")
    expect(back.x).toBeCloseTo(start.x, 0)
    expect(back.y).toBeCloseTo(start.y, 0)
    // And it's collapsed again.
    expect(
      await page.evaluate(() => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".seek")),
    ).toBeNull()
  })

  it("resizes the video by its corner while the panel is open, and keeps the size after closing it", async () => {
    expect(
      await page.evaluate(() =>
        document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".resize-handle"),
      ),
    ).toBeNull()
    await openPanel(page)
    const handle = await boxOf(page, ".resize-handle")
    const box = await videoBox()
    // The handle sits on the video's bottom-right corner.
    expect(handle.x + handle.width).toBeCloseTo((box?.x ?? 0) + (box?.width ?? 0), 0)
    expect(handle.y + handle.height).toBeCloseTo((box?.y ?? 0) + (box?.height ?? 0), 0)

    await page.mouse.move(handle.centerX, handle.centerY)
    await page.mouse.down()
    await page.mouse.move(handle.centerX - 240, handle.centerY - 60, { steps: 5 })
    await page.mouse.up()
    expect((await videoBox())?.width).toBeCloseTo(400, 0)
    expect((await videoBox())?.height).toBeCloseTo(300, 0)

    await clickInPanel(page, ".playback-rate")
    expect(
      await page.evaluate(() =>
        document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".resize-handle"),
      ),
    ).toBeNull()
    expect((await videoBox())?.width).toBeCloseTo(400, 0)

    await openPanel(page)
    await clickInPanel(page, ".resize-handle", { count: 2 })
    expect((await videoBox())?.width).toBeCloseTo(640, 0)
    expect(await page.evaluate(() => document.querySelector("video")?.getAttribute("style"))).toBeFalsy()
  })

  it("hides the panel for one video", async () => {
    await openPanel(page)
    await clickInPanel(page, '[title="Hide controls for this video"]')
    expect(await countPanels(page)).toBe(0)
  })
})
