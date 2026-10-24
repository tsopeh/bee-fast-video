import { render } from "solid-js/web"
import { type ContentScriptContext, createShadowRootUi, defineContentScript } from "#imports"
import { watchVideos } from "@/utils/video-set"
import { ControllersContainer } from "./controllers-container"
import { followFullscreen } from "./host"
import css from "./style.css?inline"

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  // Also run in iframes without an address of their own (`about:blank`, `srcdoc`), which some players use.
  matchAboutBlank: true,
  // The CSS is bundled into the script as a string and passed to `createShadowRootUi` below. WXT's default ("ui")
  // fetches a separate CSS file at runtime instead. That needs a web-accessible resource, which pages can detect, and
  // it failed on some pages ("Unsafe attempt to load URL chrome-extension://<id>/content-scripts/content.css").
  cssInjectionMode: "manual",

  async main(ctx) {
    // Most pages and frames (ads, embeds) never have a video. Until one shows up, the extension adds nothing to the page
    // and doesn't read its settings.
    await waitForVideo(ctx)
    // Render inside a shadow root, so the page's CSS can't affect the controls.
    const ui = await createShadowRootUi(ctx, {
      name: "bee-fast-video-root",
      position: "inline",
      anchor: "body",
      css,
      onMount: (container, _shadow, host) => {
        keepEventsInside(container)
        return render(() => <ControllersContainer host={host} />, container)
      },
      onRemove: (unmount) => unmount?.(),
    })
    ui.mount()
    followFullscreen(ui.shadowHost, (listener) => ctx.addEventListener(document, "fullscreenchange", listener))
  },
})

function waitForVideo(ctx: ContentScriptContext): Promise<void> {
  return new Promise((resolve) => {
    const stop = watchVideos(document.body, (videos) => {
      if (videos.size > 0) {
        // Called once before `watchVideos` returns, so `stop` may not be set yet.
        queueMicrotask(() => stop())
        resolve()
      }
    })
    ctx.onInvalidated(stop)
  })
}

/** Pointer events on the panels that the page must not get, e.g. a click that would pause a click-to-pause player. */
const PANEL_EVENTS = ["click", "dblclick", "contextmenu", "pointerdown", "pointerup", "mousedown", "mouseup", "wheel"]

/**
 * Stops pointer events at the panels' container, so they don't reach the page. The panels' own handlers are native
 * (`on:click`) and run on their elements first. Solid's usual `onClick` would be too late: it listens on the document,
 * after the event has passed through the page's elements.
 */
function keepEventsInside(element: HTMLElement) {
  for (const type of PANEL_EVENTS) {
    element.addEventListener(type, (event) => event.stopPropagation())
  }
}
