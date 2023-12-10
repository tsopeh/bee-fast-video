import "./content.scss"
import { observeForVideoElements } from "./mutation-observer"
import { initVideoManager } from "./video-manager"

const videoManager = initVideoManager()

observeForVideoElements({
  target: document.body,
  onMutation: (mutations) => {
    videoManager.updateState(mutations)
  },
})

