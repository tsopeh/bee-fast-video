import { render } from "solid-js/web"
import { ControllersContainer } from "./controllers-container"
import contentCss from "./content.scss?inline" // read as transformed css string

const isValidHtmlDocument = document.body != null

if (isValidHtmlDocument) {
  // Custom element name, so that page styles targeting `div` etc. don't match the host.
  const hostElement = document.createElement("bee-fast-video-root")
  document.body.appendChild(hostElement)

  // Render inside a shadow root, so that page styles can't leak into the controls.
  const shadowRoot = hostElement.attachShadow({ mode: "open" })

  // `@font-face` rules are ignored inside a shadow root, so the font is loaded at the document level.
  const fontLinkElement = document.createElement("link")
  fontLinkElement.rel = "stylesheet"
  fontLinkElement.href = "https://fonts.googleapis.com/css2?family=Roboto+Condensed&display=swap"
  document.head?.appendChild(fontLinkElement)

  render(() => <>
    <style>{contentCss}</style>
    <ControllersContainer />
  </>, shadowRoot)
}
