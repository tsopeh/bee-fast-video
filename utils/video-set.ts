/**
 * Applies DOM mutations to the set of the page's videos, in order, so that when one batch adds a video and then
 * removes it (or the other way around), the last change wins. Returns the same set when nothing changed.
 */
export function computeNewState(oldState: Set<HTMLVideoElement>, mutations: Array<MutationRecord>) {
  let newState: Set<HTMLVideoElement> | undefined
  for (const mutation of mutations) {
    if (mutation.type !== "childList") {
      continue
    }
    for (const video of videosIn(mutation.removedNodes)) {
      if ((newState ?? oldState).has(video)) {
        newState ??= new Set(oldState)
        newState.delete(video)
      }
    }
    for (const video of videosIn(mutation.addedNodes)) {
      if (!(newState ?? oldState).has(video)) {
        newState ??= new Set(oldState)
        newState.add(video)
      }
    }
  }
  return newState ?? oldState
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
