export function computeNewState(oldState: Set<HTMLVideoElement>, mutations: Array<MutationRecord>) {
  const { addedVideoElements, removedVideoElements } = extractVideoElementsFromMutations(mutations)

  const shouldProduceNewState = addedVideoElements.size > 0 || removedVideoElements.size > 0
  if (!shouldProduceNewState) {
    return oldState
  }

  const newState = new Set(oldState)
  addedVideoElements.forEach((el) => {
    newState.add(el)
  })
  removedVideoElements.forEach((el) => {
    const didRemove = newState.delete(el)
    if (!didRemove) {
      console.error("bee-fast-video", "Didn't manage to remove a HtmlVideoElement", el)
    }
  })

  return newState
}

function extractVideoElementsFromMutations(mutations: Array<MutationRecord>) {
  // One batch of mutations can add a video and then remove it, or the other way around. Only the last change counts,
  // so a video is taken out of the other group before it's put in one.
  return mutations.reduce(
    (acc, mutation) => {
      const didChildListChange = mutation.type === "childList"
      if (didChildListChange) {
        const added = extractVideoElementsFromNodes(Array.from(mutation.addedNodes))
        if (added.size > 0) {
          added.forEach((el) => {
            acc.removedVideoElements.delete(el)
            acc.addedVideoElements.add(el)
          })
        }
        const removed = extractVideoElementsFromNodes(Array.from(mutation.removedNodes))
        if (removed.size > 0) {
          removed.forEach((el) => {
            acc.addedVideoElements.delete(el)
            acc.removedVideoElements.add(el)
          })
        }
      }
      return acc
    },
    {
      addedVideoElements: new Set<HTMLVideoElement>(),
      removedVideoElements: new Set<HTMLVideoElement>(),
    },
  )
}

// Same as `Node.ELEMENT_NODE`. Unlike `instanceof HTMLElement`, comparing `nodeType` also works for nodes from other
// realms (e.g. iframes) and outside of browsers (unit tests).
const ELEMENT_NODE = 1

function extractVideoElementsFromNodes(nodes: Array<Node>): Set<HTMLVideoElement> {
  const acc = new Set<HTMLVideoElement>()
  nodes.forEach((node) => {
    const isVideo = node.nodeName.toLowerCase() === "video"
    const hasChildren = node.hasChildNodes()
    if (isVideo) {
      acc.add(node as HTMLVideoElement)
    } else if (hasChildren && node.nodeType === ELEMENT_NODE) {
      for (const videoEl of (node as Element).getElementsByTagName("video")) {
        acc.add(videoEl)
      }
    }
  })
  return acc
}
