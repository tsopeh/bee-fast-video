// Shared setup for the browser tests: a static server for the test pages, and Chrome with the extension installed.

import { createReadStream, statSync } from "node:fs"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { extname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Browser as BrowserName, getInstalledBrowsers } from "@puppeteer/browsers"
import puppeteer, { type Browser, type Page } from "puppeteer-core"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const PAGES_DIR = join(ROOT, "e2e/pages")
const EXTENSION_DIR = join(ROOT, ".output/chrome-mv3")
const BROWSERS_DIR = join(ROOT, ".cache/browsers")

const CONTENT_TYPES: Record<string, string> = { ".html": "text/html", ".webm": "video/webm" }

/**
 * Serves `e2e/pages`. Supports range requests, without which the browser can't seek in a video. Pages whose name
 * starts with `blocked` get a header that forbids picture-in-picture.
 */
export async function startServer() {
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
    const headers: Record<string, string | number> = {
      "Content-Type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
      "Accept-Ranges": "bytes",
    }
    if (path.startsWith("/blocked")) {
      headers["Permissions-Policy"] = "picture-in-picture=()"
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
    url: (path: string) => `http://127.0.0.1:${port}/${path}`,
    close: () => new Promise<void>((done) => server.close(() => done())),
  }
}

/** Starts Chrome for Testing (installed by `npm run e2e:install`) with the built extension. */
export async function launchBrowser() {
  const installed = await getInstalledBrowsers({ cacheDir: BROWSERS_DIR })
  const chrome = installed.find((browser) => browser.browser === BrowserName.CHROME)
  if (chrome == null) {
    throw new Error("Chrome for Testing isn't installed. Run `npm run e2e:install` first.")
  }
  const browser = await puppeteer.launch({
    executablePath: chrome.executablePath,
    headless: true,
    pipe: true,
    enableExtensions: true,
    // Lets test pages call `play()` without a click first.
    args: ["--autoplay-policy=no-user-gesture-required"],
  })
  const extensionId = await browser.installExtension(EXTENSION_DIR)
  return { browser, extensionId }
}

export async function openPage(browser: Browser, url: string, viewport = { width: 1100, height: 700 }) {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.goto(url)
  await waitForPanel(page)
  return page
}

export const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

/** Waits for the first panel to show. */
export async function waitForPanel(page: Page) {
  await page.waitForFunction(() =>
    document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".controller"),
  )
}

export function countPanels(page: Page) {
  return page.evaluate(
    () => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelectorAll(".controller").length ?? 0,
  )
}

/** The box of an element inside the extension's shadow root, in viewport coordinates. */
export async function boxOf(page: Page, selector: string) {
  const box = await page.evaluate((selector) => {
    const element = document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(selector)
    const rect = element?.getBoundingClientRect()
    return rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  }, selector)
  if (box == null) {
    throw new Error(`No ${selector} in the panel`)
  }
  return { ...box, centerX: box.x + box.width / 2, centerY: box.y + box.height / 2 }
}

export function textOf(page: Page, selector: string) {
  return page.evaluate(
    (selector) => document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(selector)?.textContent,
    selector,
  )
}

export async function clickInPanel(
  page: Page,
  selector: string,
  options?: { button?: "left" | "right"; count?: number },
) {
  const box = await boxOf(page, selector)
  await page.mouse.click(box.centerX, box.centerY, options)
  await sleep(50)
}

/** Clicks the speed label to open the full panel. */
export async function openPanel(page: Page) {
  await clickInPanel(page, ".playback-rate")
  await page.waitForFunction(() =>
    document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".controller.expanded"),
  )
}

/** Scrolls the mouse wheel over a point the way a trackpad does: a small step every 16 ms, for `ms`. */
export async function scrollFor(page: Page, x: number, y: number, ms: number, direction: "up" | "down") {
  await page.mouse.move(x, y)
  const end = Date.now() + ms
  while (Date.now() < end) {
    await page.mouse.wheel({ deltaY: direction === "up" ? -4 : 4 })
    await sleep(16)
  }
}

/** Reads a property of the first `<video>` on the page. */
export function video<K extends keyof HTMLVideoElement>(page: Page, key: K): Promise<HTMLVideoElement[K]> {
  return page.evaluate((key) => document.querySelector("video")?.[key], key) as Promise<HTMLVideoElement[K]>
}

export async function waitForVideoReady(page: Page) {
  await page.waitForFunction(() => {
    const element = document.querySelector("video")
    return element != null && element.readyState >= 2 && Number.isFinite(element.duration)
  })
}
