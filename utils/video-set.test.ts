import { describe, expect, it } from "vitest"
import { computeNewState } from "./video-set"

// Minimal stand-ins for DOM nodes; `computeNewState` only relies on these members.
function fakeVideo(): HTMLVideoElement {
  return { nodeName: "VIDEO", nodeType: 1, hasChildNodes: () => false } as unknown as HTMLVideoElement
}

function fakeContainer(videos: Array<HTMLVideoElement>): Node {
  return {
    nodeName: "DIV",
    nodeType: 1,
    hasChildNodes: () => true,
    getElementsByTagName: () => videos,
  } as unknown as Node
}

function childListMutation(added: Array<Node>, removed: Array<Node> = []): MutationRecord {
  return { type: "childList", addedNodes: added, removedNodes: removed } as unknown as MutationRecord
}

describe("computeNewState", () => {
  it("returns the same set when no videos were added or removed", () => {
    const state = new Set([fakeVideo()])
    expect(computeNewState(state, [childListMutation([fakeContainer([])])])).toBe(state)
  })

  it("adds directly added videos and videos nested in added nodes", () => {
    const direct = fakeVideo()
    const nested = fakeVideo()
    const result = computeNewState(new Set(), [childListMutation([direct, fakeContainer([nested])])])
    expect(result).toEqual(new Set([direct, nested]))
  })

  it("removes removed videos without mutating the previous state", () => {
    const kept = fakeVideo()
    const removed = fakeVideo()
    const state = new Set([kept, removed])
    const result = computeNewState(state, [childListMutation([], [removed])])
    expect(result).toEqual(new Set([kept]))
    expect(state.size).toBe(2)
  })

  it("keeps a video that was removed and then re-added (e.g. moved in the DOM)", () => {
    const video = fakeVideo()
    const result = computeNewState(new Set([video]), [childListMutation([], [video]), childListMutation([video])])
    expect(result).toEqual(new Set([video]))
  })

  it("ignores non-childList mutations", () => {
    const state = new Set<HTMLVideoElement>()
    const attributeMutation = { type: "attributes" } as unknown as MutationRecord
    expect(computeNewState(state, [attributeMutation])).toBe(state)
  })
})
