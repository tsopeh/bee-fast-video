import { render } from "solid-js/web"
import { Popup } from "./Popup"

const appContainer = document.getElementById("root")!
render(() => <Popup />, appContainer)
