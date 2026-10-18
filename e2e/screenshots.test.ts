// Not a test: `npm run screenshots` runs this to update the images in `docs/` that the README shows.

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Browser, Page } from "puppeteer-core"
import { afterAll, beforeAll, it } from "vitest"
import { boxOf, launchBrowser, openPanel, sleep, waitForPanel, waitForVideoReady } from "./harness"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const SITE = "https://www.example.com/"

let browser: Browser
let extensionId: string

beforeAll(async () => {
  ;({ browser, extensionId } = await launchBrowser())
})

afterAll(async () => {
  await browser?.close()
})

/**
 * Opens the player page as if it were on `www.example.com`, so the popup shows a real-looking site. Requests to it are
 * answered with the files in `e2e/pages`.
 */
async function openSitePage() {
  const page = await browser.newPage()
  await page.setViewport({ width: 900, height: 520, deviceScaleFactor: 2 })
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    if (!request.url().startsWith(SITE)) {
      request.continue()
      return
    }
    const name = new URL(request.url()).pathname.slice(1)
    const file = join(ROOT, "e2e/pages", name)
    if (!existsSync(file)) {
      request.respond({ status: 404 })
      return
    }
    request.respond({
      status: 200,
      contentType: name.endsWith(".html") ? "text/html" : "video/webm",
      body: readFileSync(file),
    })
  })
  await page.goto(`${SITE}player.html`)
  await waitForPanel(page)
  await waitForVideoReady(page)
  return page
}

/** A screenshot of the panel, hovered (its resting look is see-through, too faint for a picture). */
async function shootPanel(page: Page, path: string) {
  const label = await boxOf(page, ".playback-rate")
  await page.mouse.move(label.centerX, label.centerY)
  await sleep(300)
  const panel = await boxOf(page, ".controller")
  await page.screenshot({
    path: join(ROOT, path),
    clip: { x: panel.x - 20, y: panel.y - 20, width: Math.max(panel.width, 120) + 40, height: panel.height + 40 },
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
  // Clicking the extension's icon gives the popup access to the site's address (`activeTab`).
  const extension = (await browser.extensions()).get(extensionId)
  if (extension == null) {
    throw new Error("The extension isn't installed")
  }
  await page.triggerExtensionAction(extension)
  const popup = await browser.waitForTarget((target) => target.url().endsWith("popup.html"))
  await (await popup.asPage())?.close()
  // The real popup can't be resized, and it's cut off at 600 px. So the picture comes from the popup page in a
  // background tab: it asks for the active tab, which is still the site, so it shows the same content.
  const tab = await browser.newPage()
  await page.bringToFront()
  await tab.setViewport({ width: 320, height: 600, deviceScaleFactor: 2 })
  await tab.goto(`chrome-extension://${extensionId}/popup.html`)
  await tab.waitForFunction(
    (site) => document.querySelector(".hostname")?.textContent === new URL(site).hostname,
    {},
    SITE,
  )
  await tab.evaluate(() => document.fonts.ready)
  const height = await tab.evaluate(() => document.documentElement.scrollHeight)
  await tab.setViewport({ width: 320, height, deviceScaleFactor: 2 })
  await tab.screenshot({ path: join(ROOT, "docs/popup.png") })
  await tab.close()
  await page.close()
})
