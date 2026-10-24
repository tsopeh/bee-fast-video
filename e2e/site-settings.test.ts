// Per-site settings in the popup: "remember my speed" and "fit videos".

import type { Page } from "puppeteer-core"
import { describe, expect, it } from "vitest"
import {
  clickInPanel,
  openPanel,
  openPlayer,
  openPopup,
  setVideo,
  sleep,
  useBrowser,
  video,
  waitForVideoReady,
} from "./harness"

const env = useBrowser()

const REMEMBER = ".remember .switch"
const FIT = ".fit .switch"

/** Flips a switch in the popup for the page, and returns whether it's on afterwards. */
async function toggleInPopup(page: Page, selector: string) {
  const popup = await openPopup(env, page)
  const wasOn = await popup.$eval(selector, (element) => (element as HTMLInputElement).checked)
  await popup.click(selector)
  // Waits for the setting to be saved and read back.
  await popup.waitForFunction(
    (selector, wasOn) => (document.querySelector(selector) as HTMLInputElement | null)?.checked === !wasOn,
    {},
    selector,
    wasOn,
  )
  await popup.close()
  // Clicks only reach the tab in front.
  await page.bringToFront()
  return !wasOn
}

/** Reloads the page and returns the speed the video starts with. */
async function speedAfterReload(page: Page) {
  await reloadPlayer(page)
  return video(page, "playbackRate")
}

/** Reloads the page and waits until the panel is back, which is after the site settings have been applied. */
async function reloadPlayer(page: Page) {
  await page.reload()
  await page.waitForSelector(">>> .controller")
  await waitForVideoReady(page)
}

describe("remember my speed", () => {
  it("is off by default", async () => {
    const page = await openPlayer(env)
    await page.keyboard.press("x")
    expect(await speedAfterReload(page)).toBe(1)
    await page.close()
  })

  it("remembers only speeds set through the extension, for every video on the site", async () => {
    const page = await openPlayer(env)
    await openPanel(page)
    await clickInPanel(page, '[title^="Speed up"]')
    await clickInPanel(page, '[title^="Speed up"]')
    // Turning it on remembers the video's speed.
    expect(await toggleInPopup(page, REMEMBER)).toBe(true)
    expect(await speedAfterReload(page)).toBe(1.5)

    // A speed set by the site (like Twitch catching up with a live stream) isn't remembered.
    await setVideo(page, { playbackRate: 1.1 })
    expect(await speedAfterReload(page)).toBe(1.5)

    // Shortcuts count as the user's choice.
    await page.click("#overlay")
    await page.keyboard.press("x")
    expect(await speedAfterReload(page)).toBe(1.75)

    // A site that resets the speed and loads the next video in the same element still gets the remembered speed.
    await setVideo(page, { playbackRate: 1, src: "clip.webm?next" })
    await page.waitForFunction(() => document.querySelector("video")?.currentSrc.endsWith("?next"))
    await waitForVideoReady(page)
    await sleep(100)
    expect(await video(page, "playbackRate")).toBe(1.75)

    // Other pages on the same site get it too.
    const other = await openPlayer(env)
    expect(await video(other, "playbackRate")).toBe(1.75)
    await other.close()

    expect(await toggleInPopup(page, REMEMBER)).toBe(false)
    expect(await speedAfterReload(page)).toBe(1)
    await page.close()
  })

  it("leaves a site's own speed alone when another site's remembered speed changes", async () => {
    const page = await openPlayer(env)
    await toggleInPopup(page, REMEMBER)
    await setVideo(page, { playbackRate: 1.1 })

    const other = await openPlayer(env, { host: "www.example.com" })
    await toggleInPopup(other, REMEMBER)
    await openPanel(other)
    await clickInPanel(other, '[title^="Speed up"]')
    await sleep(300)
    expect(await video(page, "playbackRate")).toBe(1.1)

    await toggleInPopup(other, REMEMBER)
    await other.close()
    await toggleInPopup(page, REMEMBER)
    await page.close()
  })

  it("can't be turned on while the extension is off for the site", async () => {
    const page = await openPlayer(env)
    const popup = await openPopup(env, page)
    await popup.click(".site-switch .switch")
    await popup.waitForFunction(() => document.querySelector(".site-state")?.textContent === "Off for")
    const isDisabled = (selector: string) => popup.$eval(selector, (element) => (element as HTMLInputElement).disabled)
    expect(await isDisabled(REMEMBER)).toBe(true)
    expect(await isDisabled(FIT)).toBe(true)
    await popup.click(".site-switch .switch")
    await popup.waitForFunction(() => document.querySelector(".site-state")?.textContent === "On for")
    expect(await isDisabled(REMEMBER)).toBe(false)
    await popup.close()
    await page.close()
  })
})

describe("fit videos", () => {
  it("limits all videos on the site to 80% of the window, and undoes it when turned off", async () => {
    const page = await openPlayer(env)
    expect(await toggleInPopup(page, FIT)).toBe(true)
    const style = () => page.evaluate(() => document.querySelector("video")?.getAttribute("style") ?? "")
    expect(await style()).toContain("max-width: 80vw !important")
    expect(await style()).toContain("max-height: 80vh !important")

    // Still on after a reload.
    await reloadPlayer(page)
    expect(await style()).toContain("max-height: 80vh !important")

    await toggleInPopup(page, FIT)
    await page.waitForFunction(() => document.querySelector("video")?.getAttribute("style") === "")
    expect(await style()).toBe("")
    await page.close()
  })
})
