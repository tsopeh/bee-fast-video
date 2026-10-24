import { defineContentScript } from "#imports"
import { SHADOW_ROOT_EVENT } from "@/utils/video-set"

// Runs in the page's own JavaScript, not in the content script's, so it can wrap the page's `attachShadow`.
export default defineContentScript({
  matches: ["<all_urls>"],
  allFrames: true,
  matchAboutBlank: true,
  world: "MAIN",
  // Before the page's scripts, so no shadow root is attached before the wrapper.
  runAt: "document_start",

  main() {
    const attachShadow = Element.prototype.attachShadow
    Element.prototype.attachShadow = function (this: Element, init: ShadowRootInit) {
      const root = attachShadow.call(this, init)
      // Sites like Reddit add a custom element first and give it a shadow root later, when the script that defines it
      // has loaded. Nothing else tells the content script about that shadow root (see `watchVideos`). Composed, so
      // it also comes out of the shadow roots the element is in.
      if (init.mode === "open") {
        this.dispatchEvent(new Event(SHADOW_ROOT_EVENT, { composed: true }))
      }
      return root
    }
  },
})
