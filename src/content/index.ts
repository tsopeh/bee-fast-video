import { render } from "preact"
import "./content.scss"
import { SomeText } from "./some-text"

interface ObserveVideoElementsOptions {
  throttleMs: number
  onMutationsSettled: () => void
}

function observeForVideoElements ({
  throttleMs,
  onMutationsSettled,
}: ObserveVideoElementsOptions) {

  let lastSetTimeoutId: number | undefined = undefined
  const observer = new MutationObserver(
    (mutationList, observer) => {
      const hasMutationOfInterest = mutationList.some(mutation => mutation.type == "childList" || mutation.type == "attributes")
      if (hasMutationOfInterest) {
        clearTimeout(lastSetTimeoutId)
        lastSetTimeoutId = window.setTimeout(() => {
          onMutationsSettled()
        }, throttleMs)
      }
    },
  )

  observer.observe(document.body, { childList: true, subtree: true })

  return {
    stopObserving: () => {
      observer.disconnect()
    },
  }
}

function initVideoManager () {
  const rootElement = document.createElement("div")
  rootElement.classList.add("video-king-root-element")
  document.body.appendChild(rootElement)

  render(SomeText, rootElement)

  const registeredVideoElements = new Set<HTMLVideoElement>()
  return {
    updateState: () => {
      const foundVideoElements = new Set(Array.from(document.body.querySelectorAll("video")))
      console.log("king: found", foundVideoElements)
      const addedVideoElements = Array.from(foundVideoElements).filter(el => {
        return !registeredVideoElements.has(el)
      })
      const removedVideoElements = Array.from(registeredVideoElements).filter(el => {
        return !foundVideoElements.has(el)
      })

      const hasNothingTodo = addedVideoElements.length == 0 && removedVideoElements.length == 0
      if (hasNothingTodo) {
        console.log("video-king: has nothing to do", registeredVideoElements)
        return
      }
      addedVideoElements.forEach(el => {
        console.log("video-king: added", el)
        registeredVideoElements.add(el)
      })
      removedVideoElements.forEach(el => {
        console.log("video-king: removed", el)
        registeredVideoElements.delete(el)
      })
    },
  }
}

const videoManager = initVideoManager()

observeForVideoElements({
  throttleMs: 50,
  onMutationsSettled: () => {
    videoManager.updateState()
  },
})
