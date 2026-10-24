// Shared setup for the browser tests: a static server for the test pages, Chrome or Firefox with the extension
// installed, and helpers for reaching into the panels. Selectors starting with `>>>` look inside shadow roots, where the panels are.

import { createReadStream, statSync } from "node:fs"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { extname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Browser as BrowserName, getInstalledBrowsers } from "@puppeteer/browsers"
import puppeteer, { type Browser, type Frame, type Page } from "puppeteer-core"
import { afterAll, beforeAll } from "vitest"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const PAGES_DIR = join(ROOT, "e2e/pages")
const BROWSERS_DIR = join(ROOT, ".cache/browsers")

/** Set by `npm run test:e2e:firefox`. Chrome otherwise. */
export const isFirefox = process.env.E2E_BROWSER === "firefox"

// The add-on ID from `wxt.config.ts`, and a fixed internal UUID for it. Firefox picks a random UUID at install, which
// would leave no way to find the popup's `moz-extension://` URL.
const FIREFOX_ADDON_ID = "bee.fast.video@tsopeh.github.com"
const FIREFOX_ADDON_UUID = "0b3e6a52-6f1c-4c7e-9d38-6b4f5a3e2c10"

const CONTENT_TYPES: Record<string, string> = { ".html": "text/html", ".webm": "video/webm" }

/** Serves `e2e/pages`. Supports range requests, without which the browser can't seek in a video. */
async function startServer() {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname
    const file = join(PAGES_DIR, path)
    let size: number
    try {
      size = statSync(file).size
    } catch {
      response.writeHead(404).end()
      return
    }
    const headers = {
      "Content-Type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
      "Accept-Ranges": "bytes",
    }
    const range = /bytes=(\d*)-(\d*)/.exec(request.headers.range ?? "")
    if (range == null) {
      response.writeHead(200, { ...headers, "Content-Length": size })
      createReadStream(file).pipe(response)
      return
    }
    const start = range[1] ? Number(range[1]) : 0
    const end = range[2] ? Number(range[2]) : size - 1
    response.writeHead(206, {
      ...headers,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": end - start + 1,
    })
    createReadStream(file, { start, end }).pipe(response)
  })
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done))
  const { port } = server.address() as AddressInfo
  return {
    port,
    close: () => new Promise<void>((done) => server.close(() => done())),
  }
}

export interface TestEnv {
  browser: Browser
  extensionId: string
  /** The test page's URL. `host` can also be `www.example.com`, which resolves to the test server too. */
  url: (path: string, host?: string) => string
}

/**
 * Starts the test server and Chrome for Testing or Firefox (installed by `npm run e2e:install`) with the built
 * extension, once for the test file.
 */
export function useBrowser(): TestEnv {
  const env = {} as TestEnv
  let server: Awaited<ReturnType<typeof startServer>> | undefined
  beforeAll(async () => {
    server = await startServer()
    const installed = await getInstalledBrowsers({ cacheDir: BROWSERS_DIR })
    const name = isFirefox ? BrowserName.FIREFOX : BrowserName.CHROME
    const executable = installed.find((browser) => browser.browser === name)
    if (executable == null) {
      throw new Error(
        `${isFirefox ? "Firefox" : "Chrome for Testing"} isn't installed. Run \`npm run e2e:install\` first.`,
      )
    }
    env.browser = isFirefox
      ? await puppeteer.launch({
          browser: "firefox",
          executablePath: executable.executablePath,
          headless: true,
          // Without it, Firefox won't let Puppeteer open a `moz-extension://` page.
          args: ["--remote-allow-system-access"],
          extraPrefsFirefox: {
            // Lets test pages call `play()` without a click first.
            "media.autoplay.default": 0,
            // Every host resolves to the test server, for the real-looking site in the screenshots.
            "network.dns.forceResolve": "127.0.0.1",
            "extensions.webextensions.uuids": JSON.stringify({ [FIREFOX_ADDON_ID]: FIREFOX_ADDON_UUID }),
          },
        })
      : await puppeteer.launch({
          executablePath: executable.executablePath,
          headless: true,
          pipe: true,
          enableExtensions: true,
          args: [
            // Lets test pages call `play()` without a click first.
            "--autoplay-policy=no-user-gesture-required",
            // A real-looking site for the screenshots.
            "--host-resolver-rules=MAP www.example.com 127.0.0.1",
          ],
        })
    env.extensionId = await env.browser.installExtension(join(ROOT, `dist/${isFirefox ? "firefox" : "chrome"}-mv3`))
    const { port } = server
    env.url = (path, host = "127.0.0.1") => `http://${host}:${port}/${path}`
  })
  afterAll(async () => {
    await env.browser?.close()
    await server?.close()
  })
  return env
}

export const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

/** Opens a test page and waits for the first panel. */
export async function openPage(env: TestEnv, path: string, options?: { host?: string; viewport?: Viewport }) {
  const page = await env.browser.newPage()
  await page.setViewport(options?.viewport ?? { width: 1100, height: 700 })
  await page.goto(env.url(path, options?.host))
  await page.waitForSelector(">>> .controller")
  return page
}

type Viewport = { width: number; height: number; deviceScaleFactor?: number }

/** Opens the player test page, with the video ready to play and seek. */
export async function openPlayer(env: TestEnv, options?: { host?: string; viewport?: Viewport }) {
  const page = await openPage(env, "player.html", options)
  await waitForVideoReady(page)
  return page
}

export async function waitForVideoReady(page: Page) {
  await page.waitForFunction(() => {
    const element = document.querySelector("video")
    return element != null && element.readyState >= 2 && Number.isFinite(element.duration)
  })
}

/** The URL of a page of the extension, like `popup.html`. */
export function extensionUrl(env: TestEnv, path: string) {
  return isFirefox ? `moz-extension://${FIREFOX_ADDON_UUID}/${path}` : `chrome-extension://${env.extensionId}/${path}`
}

/**
 * Opens the extension's popup for the page, the same as clicking the extension's icon in the toolbar. Puppeteer can't
 * click the icon in Firefox, so there the popup opens in a background tab, where it reads the page's site the same way.
 */
export async function openPopup(env: TestEnv, page: Page) {
  if (isFirefox) {
    const popup = await env.browser.newPage()
    await page.bringToFront()
    // The popup loads, but Puppeteer never sees the navigation finish: it moves into the extension's process. And
    // `waitForSelector` fails if it checks during the move ("right-hand side of 'in' should be an object, got null"),
    // so this checks by hand and retries.
    popup.goto(extensionUrl(env, "popup.html")).catch(() => {})
    while (!(await popup.evaluate(() => document.querySelector(".hostname") != null).catch(() => false))) {
      await sleep(50)
    }
    return popup
  }
  const extension = (await env.browser.extensions()).get(env.extensionId)
  if (extension == null) {
    throw new Error("The extension isn't installed")
  }
  await page.triggerExtensionAction(extension)
  const popup = await (await env.browser.waitForTarget((target) => target.url().endsWith("popup.html"))).asPage()
  if (popup == null) {
    throw new Error("The popup didn't open")
  }
  return popup
}

export async function countPanels(page: Page | Frame) {
  return (await page.$$(">>> .controller")).length
}

/** Whether there's an element for `selector` in the panels. */
export async function hasInPanel(page: Page, selector: string) {
  return (await page.$(`>>> ${selector}`)) != null
}

/** The box of an element in the panels, in viewport coordinates. */
export async function boxOf(page: Page, selector: string) {
  const box = await (await page.$(`>>> ${selector}`))?.boundingBox()
  if (box == null) {
    throw new Error(`No ${selector} in the panel`)
  }
  return { ...box, centerX: box.x + box.width / 2, centerY: box.y + box.height / 2 }
}

/** Whether the speed label is what's drawn on top at its own position, so it can be seen and clicked. */
export async function isPanelOnTop(page: Page) {
  const label = await boxOf(page, ".playback-rate")
  return page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === "BEE-FAST-VIDEO-ROOT", {
    x: label.centerX,
    y: label.centerY,
  })
}

export function textOf(page: Page, selector: string) {
  return page.$eval(`>>> ${selector}`, (element) => element.textContent)
}

export async function clickInPanel(
  page: Page,
  selector: string,
  options?: { button?: "left" | "right"; count?: number },
) {
  await page.click(`>>> ${selector}`, options)
  await sleep(50)
}

/** Clicks the speed label to open the full panel. */
export async function openPanel(page: Page) {
  await clickInPanel(page, ".playback-rate")
  await page.waitForSelector(">>> .controller.expanded")
}

/**
 * Scrolls over a point the way a trackpad does: a small step every 16 ms, for `ms`. A direction can also be a delta,
 * for a swipe that isn't straight.
 */
export async function scrollFor(
  page: Page,
  x: number,
  y: number,
  ms: number,
  direction: "up" | "down" | "left" | "right" | { deltaX: number; deltaY: number },
) {
  const delta =
    typeof direction === "object"
      ? direction
      : {
          deltaX: { left: -4, right: 4, up: 0, down: 0 }[direction],
          deltaY: { up: -4, down: 4, left: 0, right: 0 }[direction],
        }
  await page.mouse.move(x, y)
  const end = Date.now() + ms
  while (Date.now() < end) {
    await page.mouse.wheel(delta)
    await sleep(16)
  }
}

/** Reads a property of the first `<video>` on the page. */
export function video<K extends keyof HTMLVideoElement>(page: Page, key: K): Promise<HTMLVideoElement[K]> {
  return page.evaluate((key) => document.querySelector("video")?.[key], key) as Promise<HTMLVideoElement[K]>
}

/** Sets properties of the first `<video>` on the page, the way the site would. */
export async function setVideo(page: Page, values: Partial<Pick<HTMLVideoElement, VideoProperty>>) {
  await page.evaluate((values) => {
    const element = document.querySelector("video")
    if (element != null) {
      Object.assign(element, values)
    }
  }, values)
}

type VideoProperty = "currentTime" | "playbackRate" | "volume" | "muted" | "src"

/** The first video's box, in viewport coordinates. */
export function videoBox(page: Page) {
  return page.evaluate(() => {
    const rect = document.querySelector("video")?.getBoundingClientRect()
    return { x: rect?.x ?? 0, y: rect?.y ?? 0, width: rect?.width ?? 0, height: rect?.height ?? 0 }
  })
}

/** The panel's offset from its video's top left corner, which is normally 5 px each way. */
export async function panelOffset(page: Page) {
  const panel = await boxOf(page, ".controller")
  const box = await videoBox(page)
  return { x: Math.round(panel.x - box.x), y: Math.round(panel.y - box.y) }
}
