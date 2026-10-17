import { render } from "solid-js/web"
import { createShadowRootUi, defineContentScript } from "#imports"
import { ControllersContainer } from "./controllers-container"
import css from "./style.css?inline"

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  // The CSS is bundled into the script as a string and handed to `createShadowRootUi` below. With
  // `cssInjectionMode: "ui"`, WXT would instead fetch a separate CSS file from the extension at runtime, which needs a
  // web-accessible resource (detectable by pages) and failed on some pages ("Unsafe attempt to load URL
  // chrome-extension://<dynamic id>/content-scripts/content.css").
  cssInjectionMode: "manual",

  async main(ctx) {
    // Render inside a shadow root, so that page styles can't leak into the controls.
    const ui = await createShadowRootUi(ctx, {
      name: "bee-fast-video-root",
      position: "inline",
      anchor: "body",
      css,
      onMount: (container) => render(() => <ControllersContainer />, container),
      onRemove: (unmount) => unmount?.(),
    })
    ui.mount()
  },
})
