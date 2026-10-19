import { describe, expect, it } from "vitest"
import { countPanels, openPlayer, openPopup, useBrowser } from "./harness"

const env = useBrowser()

describe("popup", () => {
  it("shows the current site, and turns the extension off and on for it", async () => {
    const page = await openPlayer(env)
    const popup = await openPopup(env, page)
    await popup.waitForFunction(() => document.querySelector(".hostname")?.textContent === "127.0.0.1")
    expect(await popup.$eval(".switch", (element) => (element as HTMLInputElement).checked)).toBe(true)

    await popup.click(".switch")
    await popup.waitForFunction(() => document.querySelector(".site-state")?.textContent === "Off for")
    await page.waitForSelector(">>> .controller", { hidden: true })
    expect(await countPanels(page)).toBe(0)

    await popup.click(".switch")
    await page.waitForSelector(">>> .controller")
    expect(await countPanels(page)).toBe(1)
  })
})
