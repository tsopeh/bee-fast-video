import "./style.css"
import { render } from "solid-js/web"
import { createShadowRootUi, defineContentScript } from "#imports"
import { ControllersContainer } from "./controllers-container"

export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  // Imported CSS is injected into the shadow root instead of the page.
  cssInjectionMode: "ui",

  async main(ctx) {
    // Render inside a shadow root, so that page styles can't leak into the controls.
    const ui = await createShadowRootUi(ctx, {
      name: "bee-fast-video-root",
      position: "inline",
      anchor: "body",
      onMount: (container) => render(() => <ControllersContainer />, container),
      onRemove: (unmount) => unmount?.(),
    })
    ui.mount()
  },
})
