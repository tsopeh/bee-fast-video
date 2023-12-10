export function computeNewState (oldState: Set<HTMLVideoElement>, mutations: Array<MutationRecord>) {
  const newState = new Set(oldState)

  const { addedVideoElements, removedVideoElements } = extractVideoElementsFromMutations(mutations)

  addedVideoElements.forEach(el => {
    newState.add(el)
  })
  removedVideoElements.forEach(el => {
    const didRemove = newState.delete(el)
    if (!didRemove) {
      console.error("video-king", "Didn't manage to remove a HtmlVideoElement", el)
    }
  })

  return newState
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