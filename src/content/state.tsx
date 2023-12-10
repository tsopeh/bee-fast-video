export function computeNewState (oldState: Set<HTMLVideoElement>, mutations: Array<MutationRecord>) {
  const { addedVideoElements, removedVideoElements } = extractVideoElementsFromMutations(mutations)

  const shouldProduceNewState = addedVideoElements.size > 0 || removedVideoElements.size > 0
  if (!shouldProduceNewState) {
    return oldState
  }

  const newState = new Set(oldState)
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
  // Subsequent mutations can add, then remove (or the other way around) some
  // video element. That's why we need to clear that element from previous group
  // before we assign that element.
  return mutations.reduce((acc, mutation) => {
    const didChildListChange = mutation.type == "childList"
    if (didChildListChange) {
      const added = extractVideoElementsFromNodes(Array.from(mutation.addedNodes))
      if (added.size > 0) {
        added.forEach(el => {
          acc.removedVideoElements.delete(el)
          acc.addedVideoElements.add(el)
        })
      }
      const removed = extractVideoElementsFromNodes(Array.from(mutation.removedNodes))
      if (removed.size > 0) {
        removed.forEach(el => {
          acc.addedVideoElements.delete(el)
          acc.removedVideoElements.add(el)
        })
      }
    }
    return acc
  }, {
    addedVideoElements: new Set<HTMLVideoElement>(),
    removedVideoElements: new Set<HTMLVideoElement>(),
  })
}

function extractVideoElementsFromNodes (nodes: Array<Node>): Set<HTMLVideoElement> {
  const acc = new Set<HTMLVideoElement>()
  nodes.forEach(node => {
    const isVideo = node.nodeName.toLowerCase() == "video"
    const hasChildren = node.hasChildNodes()
    if (isVideo) {
      acc.add(node as HTMLVideoElement)
    } else if (hasChildren && node instanceof HTMLElement) {
      for (const videoEl of node.getElementsByTagName("video")) {
        acc.add(videoEl)
      }
    }
  })
  return acc
}