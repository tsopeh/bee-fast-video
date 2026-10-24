// Not a test: `npm run screenshots` runs this to update the images in `docs/` that the README shows.

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Page } from "puppeteer-core"
import { it } from "vitest"
import {
  boxOf,
  extensionUrl,
  openPage,
  openPanel,
  openPlayer,
  openPopup,
  setVideo,
  sleep,
  useBrowser,
  waitForVideoReady,
} from "./harness"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
// Resolves to the test server (see `useBrowser`), so the popup shows a real-looking site.
const SITE = "www.example.com"

const env = useBrowser()

const openSitePage = () => openPlayer(env, { host: SITE, viewport: { width: 900, height: 520, deviceScaleFactor: 2 } })

/** A video partway through, with sound and a speed other than 1, so the pictures show more than defaults. */
async function setUpVideo(page: Page) {
  await setVideo(page, { currentTime: 20, playbackRate: 1.5, volume: 0.7, muted: false })
  await page.waitForFunction(() => !document.querySelector("video")?.seeking)
}

/** Hovers the speed label: the panel's resting look is see-through, too faint for a picture. */
async function hoverPanel(page: Page) {
  const label = await boxOf(page, ".playback-rate")
  await page.mouse.move(label.centerX, label.centerY)
  await sleep(300)
}

const base64 = (path: string) => readFileSync(join(ROOT, path)).toString("base64")

async function shootPanel(page: Page, path: string) {
  await hoverPanel(page)
  const panel = await boxOf(page, ".controller")
  await page.screenshot({
    path: join(ROOT, path),
    clip: { x: panel.x - 20, y: panel.y - 20, width: Math.max(panel.width, 120) + 40, height: panel.height + 40 },
    // By default Puppeteer resizes the page to capture beyond the viewport, which hides the panel for a moment.
    captureBeyondViewport: false,
  })
}

it("panel", async () => {
  const page = await openSitePage()
  await setUpVideo(page)
  await shootPanel(page, "docs/panel-collapsed.png")
  await openPanel(page)
  await shootPanel(page, "docs/panel.png")
  await page.close()
})

it("popup", async () => {
  const page = await openSitePage()
  // Opening the popup once gives it access to the site's address (`activeTab`).
  await (await openPopup(env, page)).close()
  // The real popup can't be resized, and it's cut off at 600 px. So the picture comes from the popup page in a
  // background tab: it asks for the active tab, which is still the site, so it shows the same content.
  const tab = await env.browser.newPage()
  await page.bringToFront()
  await tab.setViewport({ width: 320, height: 600, deviceScaleFactor: 2 })
  await tab.goto(extensionUrl(env, "popup.html"))
  await tab.waitForFunction((site) => document.querySelector(".hostname")?.textContent === site, {}, SITE)
  await tab.evaluate(() => document.fonts.ready)
  const height = await tab.evaluate(() => document.documentElement.scrollHeight)
  await tab.setViewport({ width: 320, height, deviceScaleFactor: 2 })
  await tab.screenshot({ path: join(ROOT, "docs/popup.png") })
  await tab.close()
  await page.close()
})

it("banner", async () => {
  const page = await openPage(env, "banner.html", { viewport: { width: 1022, height: 575, deviceScaleFactor: 2 } })
  await waitForVideoReady(page)
  await page.addStyleTag({
    content: `
      @font-face { font-family: "Salsa"; src: url(data:font/woff2;base64,${base64("assets/fonts/salsa-latin.woff2")}); }
    `,
  })
  await page.$eval(
    "#logo",
    (img, data) => {
      ;(img as HTMLImageElement).src = `data:image/png;base64,${data}`
    },
    base64("assets/icon-large.png"),
  )
  await page.evaluate(() => document.fonts.ready)
  await setUpVideo(page)
  await openPanel(page)
  await hoverPanel(page)
  await page.screenshot({ path: join(ROOT, "docs/intro.png"), captureBeyondViewport: false })
  await page.close()
})
