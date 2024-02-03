import { render } from "solid-js/web"
import { ControllersContainer } from "./controllers-container"

const isValidHtmlDocument = document.body != null

if (isValidHtmlDocument) {
  const rootElement = document.createElement("div")
  rootElement.classList.add("bee-fast-video-root-element")
  document.body.appendChild(rootElement)

  render(() => <ControllersContainer />, rootElement)
}
