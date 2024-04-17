import { render } from "solid-js/web"
import { Popup } from "./Popup"

const rootEl = document.createElement("div")
document.body.appendChild(rootEl)
render(() => <Popup />, rootEl)
