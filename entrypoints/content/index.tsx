import { render } from "solid-js/web"
import { createShadowRootUi, defineContentScript } from "#imports"
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
    // Render inside a shadow root, so the page's CSS can't affect the controls.
    const ui = await createShadowRootUi(ctx, {
      name: "bee-fast-video-root",
      position: "inline",
      anchor: "body",
      css,
      onMount: (container, _shadow, host) => render(() => <ControllersContainer host={host} />, container),
      onRemove: (unmount) => unmount?.(),
    })
    ui.mount()
    followFullscreen(ui.shadowHost, (listener) => ctx.addEventListener(document, "fullscreenchange", listener))
  },
})
