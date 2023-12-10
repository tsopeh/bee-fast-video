import { h, render } from "preact"
import { ControllersContainer } from "./controllers-container"
import { createObservable } from "./observable"

export function initVideoManager () {
  const { observable, publish } = createObservable<Array<HTMLVideoElement>>()

  const rootElement = document.createElement("div")
  rootElement.classList.add("video-king-root-element")
  document.body.appendChild(rootElement)

  render(h(ControllersContainer, { outsideStateChanges: observable }), rootElement)

  const registeredVideoElements = new Set<HTMLVideoElement>()

  return {
    updateState: (mutations: Array<MutationRecord>) => {

      const { addedVideoElements, removedVideoElements } = extractVideoElementsFromMutations(mutations)

      const hasNothingTodo = addedVideoElements.size == 0 && removedVideoElements.size == 0
      if (hasNothingTodo) {
        return
      }
      addedVideoElements.forEach(el => {
        registeredVideoElements.add(el)
      })
      removedVideoElements.forEach(el => {
        const didRemove = registeredVideoElements.delete(el)
        if (!didRemove) {
          console.error("video-king", "Didn't manage to remove a HtmlVideoElement", el)
        }
      })

      publish(Array.from(registeredVideoElements))
    },
  }
}

function extractVideoElementsFromMutations (mutations: Array<MutationRecord>) {
  return mutations.reduce((acc, mutation) => {
    const didChildListChange = mutation.type == "childList"
    if (didChildListChange) {
      extractVideoElementsFromNodes(Array.from(mutation.addedNodes), acc.addedVideoElements)
      extractVideoElementsFromNodes(Array.from(mutation.removedNodes), acc.removedVideoElements)
    }
    return acc
  }, {
    addedVideoElements: new Set<HTMLVideoElement>(),
    removedVideoElements: new Set<HTMLVideoElement>(),
  })
}

function extractVideoElementsFromNodes (nodes: Array<Node>, buffer: Set<HTMLVideoElement>): void {
  nodes.forEach(node => {
    const isVideo = node.nodeName.toLowerCase() == "video"
    const hasChildren = node.hasChildNodes()
    if (isVideo) {
      buffer.add(node as HTMLVideoElement)
    } else if (hasChildren && node instanceof HTMLElement) {
      for (const videoEl of node.getElementsByTagName("video")) {
        buffer.add(videoEl)
      }
    }
  })
}