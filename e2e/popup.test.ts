import type { Browser } from "puppeteer-core"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { countPanels, launchBrowser, openPage, sleep, startServer } from "./harness"

let server: Awaited<ReturnType<typeof startServer>>
let browser: Browser
let extensionId: string

beforeAll(async () => {
  server = await startServer()
  ;({ browser, extensionId } = await launchBrowser())
})

afterAll(async () => {
  await browser?.close()
  await server?.close()
})

describe("popup", () => {
  it("shows the current site, and turns the extension off and on for it", async () => {
    const page = await openPage(browser, server.url("player.html"))
    const extension = (await browser.extensions()).get(extensionId)
    if (extension == null) {
      throw new Error("The extension isn't installed")
    }
    // Same as clicking the extension's icon in the toolbar.
    await page.triggerExtensionAction(extension)
    const popup = await (await browser.waitForTarget((target) => target.url().endsWith("popup.html"))).asPage()
    if (popup == null) {
      throw new Error("The popup didn't open")
    }
    await popup.waitForFunction(() => document.querySelector(".hostname")?.textContent === "127.0.0.1")
    expect(await popup.evaluate(() => document.querySelector<HTMLInputElement>(".switch")?.checked)).toBe(true)

    await popup.click(".switch")
    await popup.waitForFunction(() => document.querySelector(".site-state")?.textContent === "Off for")
    await page.waitForFunction(
      () => !document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".controller"),
    )
    expect(await countPanels(page)).toBe(0)

    await popup.click(".switch")
    await page.waitForFunction(() =>
      document.querySelector("bee-fast-video-root")?.shadowRoot?.querySelector(".controller"),
    )
    await sleep(100)
    expect(await countPanels(page)).toBe(1)
  })
})
