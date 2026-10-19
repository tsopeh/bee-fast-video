// Not a test: `npm run screenshots` runs this to update the images in `docs/` that the README shows.

import { join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Page } from "puppeteer-core"
import { it } from "vitest"
import { boxOf, openPanel, openPlayer, openPopup, sleep, useBrowser } from "./harness"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
// Resolves to the test server (see `useBrowser`), so the popup shows a real-looking site.
const SITE = "www.example.com"

const env = useBrowser()

const openSitePage = () => openPlayer(env, { host: SITE, viewport: { width: 900, height: 520, deviceScaleFactor: 2 } })

/** A screenshot of the panel, hovered (its resting look is see-through, too faint for a picture). */
async function shootPanel(page: Page, path: string) {
  const label = await boxOf(page, ".playback-rate")
  await page.mouse.move(label.centerX, label.centerY)
  await sleep(300)
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
  await tab.goto(`chrome-extension://${env.extensionId}/popup.html`)
  await tab.waitForFunction((site) => document.querySelector(".hostname")?.textContent === site, {}, SITE)
  await tab.evaluate(() => document.fonts.ready)
  const height = await tab.evaluate(() => document.documentElement.scrollHeight)
  await tab.setViewport({ width: 320, height, deviceScaleFactor: 2 })
  await tab.screenshot({ path: join(ROOT, "docs/popup.png") })
  await tab.close()
  await page.close()
})
