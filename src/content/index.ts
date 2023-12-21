import { h, render } from "preact"
import { ControllersContainer } from "./controllers-container"
import "./index.scss"

const rootElement = document.createElement("div")
rootElement.classList.add("bee-fast-video-root-element")
document.body.appendChild(rootElement)

render(h(ControllersContainer, null), rootElement)

