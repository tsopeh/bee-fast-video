import type { Page } from "puppeteer-core"
import { beforeEach, describe, expect, it } from "vitest"
import {
  boxOf,
  clickInPanel,
  countPanels,
  hasInPanel,
  isPanelOnTop,
  openPanel,
  openPlayer,
  panelOffset,
  scrollFor,
  setVideo,
  sleep,
  textOf,
  useBrowser,
  video,
  videoBox,
} from "./harness"

const env = useBrowser()
let page: Page

beforeEach(async () => {
  await page?.close()
  page = await openPlayer(env)
})

describe("panel", () => {
  it("shows the speed in the video's top left corner, collapsed", async () => {
    expect(await countPanels(page)).toBe(1)
    expect(await textOf(page, ".playback-rate")).toBe("1.00")
    expect(await panelOffset(page)).toEqual({ x: 5, y: 5 })
    expect(await hasInPanel(page, ".seek")).toBe(false)
  })

  it("reacts to the pointer right away", async () => {
    const label = await boxOf(page, ".playback-rate")
    await page.mouse.move(label.centerX, label.centerY)
    expect(await isPanelOnTop(page)).toBe(true)
  })

  it("opens and closes with a click on the speed", async () => {
    await openPanel(page)
    expect(await hasInPanel(page, ".seek")).toBe(true)
    await clickInPanel(page, ".playback-rate")
    expect(await hasInPanel(page, ".seek")).toBe(false)
  })

  it("groups the buttons, with close at the end", async () => {
    await openPanel(page)
    const titles = await page.$eval(">>> .row", (row) =>
      [...row.children].map((el) =>
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
      "|",
      "Remember my speed for all videos on this site",
      "Fit videos on this site to 80% of the window",
      "|",
      "Hide controls for this video",
    ])
  })

  it("keeps the speed label's width as the speed changes", async () => {
    const widths = []
    for (const playbackRate of [0.25, 1, 1.75, 2.5]) {
      await setVideo(page, { playbackRate })
      await expect.poll(() => textOf(page, ".playback-rate")).toBe(playbackRate.toFixed(2))
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
    expect(await hasInPanel(page, ".seek")).toBe(true)
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

    await setVideo(page, { volume: 0 })
    const volume = await boxOf(page, ".volume")
    await scrollFor(page, volume.centerX, volume.centerY, 1000, "up")
    // 5% every 80 ms: about 55% in a second.
    expect(await video(page, "volume")).toBeGreaterThanOrEqual(0.4)
    expect(await video(page, "volume")).toBeLessThanOrEqual(0.7)
    expect(await video(page, "muted")).toBe(false)

    // The page itself didn't scroll.
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  it("also changes values when scrolling sideways: right is more", async () => {
    await openPanel(page)
    const label = await boxOf(page, ".playback-rate")
    await scrollFor(page, label.centerX, label.centerY, 500, "right")
    expect(await video(page, "playbackRate")).toBeGreaterThan(1)
    await sleep(200)
    await scrollFor(page, label.centerX, label.centerY, 1000, "left")
    expect(await video(page, "playbackRate")).toBeLessThan(1)

    const seek = await boxOf(page, ".seek")
    await scrollFor(page, seek.centerX, seek.centerY, 500, "right")
    expect(await video(page, "currentTime")).toBeGreaterThanOrEqual(10)

    await setVideo(page, { volume: 1 })
    const volume = await boxOf(page, ".volume")
    await scrollFor(page, volume.centerX, volume.centerY, 500, "left")
    expect(await video(page, "volume")).toBeLessThan(1)

    // The page itself didn't scroll.
    expect(await page.evaluate(() => [window.scrollX, window.scrollY])).toEqual([0, 0])
  })

  it("keeps a swipe on the axis it started on, even going diagonally", async () => {
    await openPanel(page)
    const label = await boxOf(page, ".playback-rate")
    // Down and to the right, like fingers on a trackpad: starts more down than right, then drifts.
    await scrollFor(page, label.centerX, label.centerY, 150, { deltaX: 1, deltaY: 3 })
    await scrollFor(page, label.centerX, label.centerY, 850, { deltaX: 3, deltaY: 2 })
    // About 6 steps, all down.
    expect(await video(page, "playbackRate")).toBeLessThanOrEqual(0.25)
    // After a pause, a new swipe picks its axis anew.
    await sleep(200)
    await scrollFor(page, label.centerX, label.centerY, 500, { deltaX: 3, deltaY: 2 })
    expect(await video(page, "playbackRate")).toBeGreaterThan(0.25)
  })

  it("switches the time between time played and time left", async () => {
    await openPanel(page)
    await setVideo(page, { currentTime: 20 })
    await expect.poll(() => textOf(page, ".time")).toBe("0:20")
    await clickInPanel(page, ".time")
    expect(await textOf(page, ".time")).toBe("0:40")
  })

  it("shows the time left at the current speed", async () => {
    await openPanel(page)
    await setVideo(page, { currentTime: 20, playbackRate: 2 })
    await page.waitForFunction(() => document.querySelector("video")?.currentTime === 20)
    await clickInPanel(page, ".time")
    expect(await textOf(page, ".time")).toBe("0:20")
    await setVideo(page, { playbackRate: 0.5 })
    await expect.poll(() => textOf(page, ".time")).toBe("1:20")
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
    await page.waitForSelector('>>> [title="Disable loop"]')
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
    await page.waitForSelector(">>> .controller", { hidden: true })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForSelector(">>> .controller")
    expect(await panelOffset(page)).toEqual({ x: 5, y: 5 })
    // And it's collapsed again.
    expect(await hasInPanel(page, ".seek")).toBe(false)
  })

  it("stays open and on its video while the window resizes", async () => {
    await openPanel(page)
    for (const width of [900, 1300, 1100]) {
      await page.setViewport({ width, height: 700 })
      await expect.poll(() => panelOffset(page)).toEqual({ x: 5, y: 5 })
      expect(await hasInPanel(page, ".controller.expanded")).toBe(true)
    }
  })

  it("resizes the video by its corner while the panel is open, and keeps the size after closing it", async () => {
    expect(await hasInPanel(page, ".resize-handle")).toBe(false)
    await openPanel(page)
    const handle = await boxOf(page, ".resize-handle")
    const box = await videoBox(page)
    // The handle sits on the video's bottom-right corner.
    expect(handle.x + handle.width).toBeCloseTo(box.x + box.width, 0)
    expect(handle.y + handle.height).toBeCloseTo(box.y + box.height, 0)

    await page.mouse.move(handle.centerX, handle.centerY)
    await page.mouse.down()
    await page.mouse.move(handle.centerX - 240, handle.centerY - 60, { steps: 5 })
    await page.mouse.up()
    expect((await videoBox(page)).width).toBeCloseTo(400, 0)
    expect((await videoBox(page)).height).toBeCloseTo(300, 0)

    await clickInPanel(page, ".playback-rate")
    expect(await hasInPanel(page, ".resize-handle")).toBe(false)
    expect((await videoBox(page)).width).toBeCloseTo(400, 0)

    await openPanel(page)
    await clickInPanel(page, ".resize-handle", { count: 2 })
    expect((await videoBox(page)).width).toBeCloseTo(640, 0)
    expect(await page.evaluate(() => document.querySelector("video")?.getAttribute("style"))).toBeFalsy()
  })

  it("keeps clicks on the panel from reaching the page", async () => {
    await page.evaluate(() => {
      const counts = { click: 0, pointerdown: 0 }
      Object.assign(window, { counts })
      document.addEventListener("click", () => counts.click++)
      document.addEventListener("pointerdown", () => counts.pointerdown++)
    })
    await openPanel(page)
    await clickInPanel(page, '[title^="Play"]')
    await page.waitForFunction(() => !document.querySelector("video")?.paused)
    expect(await page.evaluate(() => (window as unknown as { counts: object }).counts)).toEqual({
      click: 0,
      pointerdown: 0,
    })
  })

  it("hides the panel for one video", async () => {
    await openPanel(page)
    await clickInPanel(page, '[title="Hide controls for this video"]')
    expect(await countPanels(page)).toBe(0)
  })
})
