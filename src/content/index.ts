import { h, render } from "preact"
import "./content.scss"
import { ControllersContainer } from "./controllers-container"

const rootElement = document.createElement("div")
rootElement.classList.add("video-king-root-element")
document.body.appendChild(rootElement)

render(h(ControllersContainer, null), rootElement)

