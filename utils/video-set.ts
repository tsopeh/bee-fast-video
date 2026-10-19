/**
 * Applies DOM mutations to the set of the page's videos. Returns the same set when nothing changed.
 *
 * Added nodes are searched for videos. Removed nodes aren't: a known video that is no longer in the document was
 * removed. Pages like React apps remove large subtrees all the time, and checking the few known videos is cheaper than
 * searching every removed subtree. A video that was added and removed in the same batch, or moved, ends up right too.
 */
export function computeNewState(oldState: Set<HTMLVideoElement>, mutations: Array<MutationRecord>) {
  let newState: Set<HTMLVideoElement> | undefined
  let hasRemovals = false
  for (const mutation of mutations) {
    if (mutation.type !== "childList") {
      continue
    }
    hasRemovals ||= mutation.removedNodes.length > 0
    for (const video of videosIn(mutation.addedNodes)) {
      if (video.isConnected && !(newState ?? oldState).has(video)) {
        newState ??= new Set(oldState)
        newState.add(video)
      }
    }
  }
  if (hasRemovals) {
    for (const video of oldState) {
      if (!video.isConnected) {
        newState ??= new Set(oldState)
        newState.delete(video)
      }
    }
  }
  return newState ?? oldState
}

/** Whether the mutations added a video to the document. */
export function addsVideo(mutations: Array<MutationRecord>): boolean {
  for (const mutation of mutations) {
    for (const video of videosIn(mutation.addedNodes)) {
      if (video.isConnected) {
        return true
      }
    }
  }
  return false
}

// Same as `Node.ELEMENT_NODE`. Unlike `instanceof HTMLElement`, comparing `nodeType` also works for nodes from other
// realms (e.g. iframes) and outside of browsers (unit tests).
const ELEMENT_NODE = 1

function* videosIn(nodes: Iterable<Node>): Generator<HTMLVideoElement> {
  for (const node of nodes) {
    if (node.nodeName === "VIDEO") {
      yield node as HTMLVideoElement
    } else if (node.nodeType === ELEMENT_NODE && node.hasChildNodes()) {
      yield* (node as Element).getElementsByTagName("video")
    }
  }
}
