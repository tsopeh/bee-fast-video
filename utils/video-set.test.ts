import { describe, expect, it } from "vitest"
import { computeNewState } from "./video-set"

// Minimal stand-ins for DOM nodes; `computeNewState` only relies on these members.
function fakeVideo(isConnected = true): HTMLVideoElement {
  return { nodeName: "VIDEO", nodeType: 1, isConnected, hasChildNodes: () => false } as unknown as HTMLVideoElement
}

function fakeContainer(videos: Array<HTMLVideoElement>, descendants: Array<Node> = []): Node {
  return {
    nodeName: "DIV",
    nodeType: 1,
    shadowRoot: null,
    hasChildNodes: () => true,
    getElementsByTagName: () => videos,
    querySelectorAll: () => descendants,
  } as unknown as Node
}

/** An element with an open shadow root that holds `children`. */
function fakeShadowHost(children: Array<Node>): Node {
  return {
    nodeName: "SOME-PLAYER",
    nodeType: 1,
    shadowRoot: { children },
    hasChildNodes: () => false,
  } as unknown as Node
}

function childListMutation(added: Array<Node>, removed: Array<Node> = []): MutationRecord {
  return { type: "childList", addedNodes: added, removedNodes: removed } as unknown as MutationRecord
}

function disconnect(video: HTMLVideoElement) {
  Object.assign(video, { isConnected: false })
}

describe("computeNewState", () => {
  it("returns the same set when no videos were added or removed", () => {
    const state = new Set([fakeVideo()])
    expect(computeNewState(state, [childListMutation([fakeContainer([])], [fakeContainer([])])])).toBe(state)
  })

  it("adds directly added videos and videos nested in added nodes", () => {
    const direct = fakeVideo()
    const nested = fakeVideo()
    const result = computeNewState(new Set(), [childListMutation([direct, fakeContainer([nested])])])
    expect(result).toEqual(new Set([direct, nested]))
  })

  it("adds videos in open shadow roots, also nested ones, and reports each shadow root", () => {
    const outer = fakeVideo()
    const inner = fakeVideo()
    const innerHost = fakeShadowHost([inner])
    const outerHost = fakeShadowHost([outer, fakeContainer([], [innerHost])])
    const roots: Array<unknown> = []
    const result = computeNewState(new Set(), [childListMutation([fakeContainer([], [outerHost])])], (root) =>
      roots.push(root),
    )
    expect(result).toEqual(new Set([outer, inner]))
    expect(roots).toEqual([(outerHost as Element).shadowRoot, (innerHost as Element).shadowRoot])
  })

  it("removes videos that left the document without mutating the previous state", () => {
    const kept = fakeVideo()
    const removed = fakeVideo()
    const state = new Set([kept, removed])
    disconnect(removed)
    // The removed node is the video's parent, not the video itself.
    const result = computeNewState(state, [childListMutation([], [fakeContainer([])])])
    expect(result).toEqual(new Set([kept]))
    expect(state.size).toBe(2)
  })

  it("keeps a video that was removed and then re-added (e.g. moved in the DOM)", () => {
    const video = fakeVideo()
    const result = computeNewState(new Set([video]), [childListMutation([], [video]), childListMutation([video])])
    expect(result).toEqual(new Set([video]))
  })

  it("skips a video that was added and then removed in the same batch", () => {
    const video = fakeVideo(false)
    const state = new Set<HTMLVideoElement>()
    expect(computeNewState(state, [childListMutation([video]), childListMutation([], [video])])).toBe(state)
  })

  it("ignores non-childList mutations", () => {
    const state = new Set<HTMLVideoElement>()
    const attributeMutation = { type: "attributes" } as unknown as MutationRecord
    expect(computeNewState(state, [attributeMutation])).toBe(state)
  })
})
