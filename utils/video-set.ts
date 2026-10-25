/** Sent by `shadow-roots.content.ts` from an element that just got an open shadow root. */
export const SHADOW_ROOT_EVENT = "bee-fast-video:shadow-root"

/**
 * Calls `onChange` with the videos under `root`, now and whenever they change. Also finds videos in open shadow roots,
 * at any depth, like Reddit's player. Returns a function that stops watching.
 *
 * A mutation observer doesn't see into shadow roots, so every shadow root found gets observed too. A shadow root
 * attached to an element that is already in the page comes from `shadow-roots.content.ts` instead.
 */
export function watchVideos(root: Element, onChange: (videos: Set<HTMLVideoElement>) => void) {
  const update = (newVideos: Set<HTMLVideoElement>) => {
    if (newVideos !== videos) {
      videos = newVideos
      onChange(videos)
    }
  }
  const observer = new MutationObserver((mutations) => update(computeNewState(videos, mutations, observe)))
  const observe = (node: Node) => observer.observe(node, { childList: true, subtree: true })
  const onShadowRoot = (event: Event) => {
    // The element itself, also when it sits inside other shadow roots and `event.target` is their outermost host.
    const host = event.composedPath()[0] as Element
    if (isShadowHost(host)) {
      observe(host.shadowRoot)
      update(withVideosIn(videos, host.shadowRoot.children, observe))
    }
  }
  const listeners = new AbortController()
  document.addEventListener(SHADOW_ROOT_EVENT, onShadowRoot, { capture: true, signal: listeners.signal })
  observe(root)
  let videos = new Set(videosIn([root], observe))
  onChange(videos)
  return () => {
    observer.disconnect()
    listeners.abort()
  }
}

/**
 * Applies DOM mutations to the set of the page's videos. Returns the same set when nothing changed. Calls
 * `onShadowRoot` for each open shadow root in the added nodes.
 *
 * Added nodes are searched for videos. Removed nodes aren't: a known video that is no longer in the document was
 * removed. Pages like React apps remove large subtrees all the time, and checking the few known videos is cheaper than
 * searching every removed subtree. A video that was added and removed in the same batch, or moved, ends up right too.
 */
export function computeNewState(
  oldState: Set<HTMLVideoElement>,
  mutations: Array<MutationRecord>,
  onShadowRoot: (root: ShadowRoot) => void = () => {},
) {
  let newState: Set<HTMLVideoElement> | undefined
  let hasRemovals = false
  for (const mutation of mutations) {
    if (mutation.type !== "childList") {
      continue
    }
    hasRemovals ||= mutation.removedNodes.length > 0
    const added = withVideosIn(newState ?? oldState, mutation.addedNodes, onShadowRoot)
    if (added !== oldState) {
      newState = added
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

/** Adds the connected videos in `nodes`, also in their shadow roots. Returns the same set when there are none. */
function withVideosIn(
  state: Set<HTMLVideoElement>,
  nodes: Iterable<Node>,
  onShadowRoot: (root: ShadowRoot) => void,
): Set<HTMLVideoElement> {
  let newState: Set<HTMLVideoElement> | undefined
  for (const video of videosIn(nodes, onShadowRoot)) {
    if (video.isConnected && !(newState ?? state).has(video)) {
      newState ??= new Set(state)
      newState.add(video)
    }
  }
  return newState ?? state
}

// Same as `Node.ELEMENT_NODE`. Unlike `instanceof HTMLElement`, comparing `nodeType` also works for nodes from other
// realms (e.g. iframes) and outside of browsers (unit tests).
const ELEMENT_NODE = 1

function* videosIn(nodes: Iterable<Node>, onShadowRoot: (root: ShadowRoot) => void): Generator<HTMLVideoElement> {
  for (const node of nodes) {
    if (node.nodeName === "VIDEO") {
      yield node as HTMLVideoElement
    } else if (node.nodeType === ELEMENT_NODE) {
      const element = node as Element
      if (element.hasChildNodes()) {
        yield* element.getElementsByTagName("video")
      }
      // `getElementsByTagName` doesn't look inside shadow roots, so they're searched one by one.
      for (const host of shadowHostsIn(element)) {
        onShadowRoot(host.shadowRoot)
        yield* videosIn(host.shadowRoot.children, onShadowRoot)
      }
    }
  }
}

// The extension's own host (see `index.tsx`). Its shadow root holds the panels, which change all the time.
const OWN_HOST = "BEE-FAST-VIDEO-ROOT"

type ShadowHost = Element & { shadowRoot: ShadowRoot }

const isShadowHost = (element: Element): element is ShadowHost =>
  element.shadowRoot != null && element.nodeName !== OWN_HOST

/**
 * Checks every element, which costs about 0.3 µs each in Chrome and 0.5 µs in Firefox, measured on a test page. That's
 * under 1 ms for an insert of 2,000 elements, and 5-10 ms for 20,000. Kept, since a shadow root attached before its
 * element is in the page shows up nowhere else.
 */
function* shadowHostsIn(element: Element): Generator<ShadowHost> {
  if (isShadowHost(element)) {
    yield element
  }
  if (element.hasChildNodes()) {
    for (const descendant of element.querySelectorAll("*")) {
      if (isShadowHost(descendant)) {
        yield descendant
      }
    }
  }
}
