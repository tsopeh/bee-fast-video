// Not a test: `npm run screenshots` runs this to update the images in `docs/` that the README shows.

import { mkdirSync, readFileSync } from "node:fs"
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
  // Low, so the page's height below is its content's, not the window's.
  await tab.setViewport({ width: 320, height: 100, deviceScaleFactor: 2 })
  await tab.goto(extensionUrl(env, "popup.html"))
  // A remembered speed shows more than the default switches, and 0.0 hours saved would look like nobody uses it.
  await tab.evaluate(() =>
    chrome.storage.local.set({ rememberedSpeeds: { "www.example.com": 1.5 }, savedSeconds: 12.4 * 3600 }),
  )
  await tab.waitForSelector(".remembered-speed")
  // The switch slides over for 150 ms.
  await sleep(300)
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

// The images for the Chrome Web Store and Firefox Add-ons. Each is taken at 2× from a window half its size, so the
// panel is big enough to read. Chrome asks for exactly these sizes.
const STORE_IMAGES = [
  { name: "marquee", width: 1400, height: 560 },
  { name: "tile", width: 440, height: 280 },
  { name: "speed", width: 1280, height: 800 },
  { name: "keys", width: 1280, height: 800 },
  { name: "popup", width: 1280, height: 800 },
]

for (const { name, width, height } of STORE_IMAGES) {
  it(`store ${name}`, async () => {
    const viewport = { width: width / 2, height: height / 2, deviceScaleFactor: 2 }
    const page = await env.browser.newPage()
    await page.setViewport(viewport)
    await page.goto(env.url(`store.html#${name}`))
    await page.addStyleTag({
      content: `
        @font-face { font-family: "Salsa"; src: url(data:font/woff2;base64,${base64("assets/fonts/salsa-latin.woff2")}); }
        @font-face { font-family: "Roboto Condensed"; src: url(data:font/woff2;base64,${base64("assets/fonts/roboto-condensed-latin.woff2")}); }
      `,
    })
    const images = { logo: "assets/icon-large.png", popup: "docs/popup.png" }
    for (const [id, path] of Object.entries(images)) {
      await page.$eval(
        `#${id}`,
        (img, data) => {
          ;(img as HTMLImageElement).src = `data:image/png;base64,${data}`
        },
        base64(path),
      )
    }
    await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.decode())]))
    // The small tile has no panel.
    if (name !== "tile") {
      await page.waitForSelector(">>> .controller")
      await waitForVideoReady(page)
      await setUpVideo(page)
      await openPanel(page)
      await hoverPanel(page)
    }
    if (name === "keys") {
      // Opening the panel focused the speed label, and a key press would draw a focus ring around it.
      await page.$eval(">>> .playback-rate", (element) => (element as HTMLElement).blur())
      await page.keyboard.press("d")
      // The feedback fades out in half a second. This holds it where it's fully shown.
      await page.$eval(">>> .feedback", (element) => {
        for (const animation of element.getAnimations()) {
          animation.pause()
          animation.currentTime = 250
        }
      })
    }
    mkdirSync(join(ROOT, "docs/store"), { recursive: true })
    await page.screenshot({ path: join(ROOT, `docs/store/${name}.png`), captureBeyondViewport: false })
    await page.close()
  })
}

// The popup's extension API, as far as this file uses it.
declare const chrome: { storage: { local: { set(items: Record<string, unknown>): Promise<void> } } }
