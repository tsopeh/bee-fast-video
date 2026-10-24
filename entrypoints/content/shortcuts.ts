// Keyboard event reference: https://w3c.github.io/uievents/tools/key-event-viewer.html

import { onCleanup } from "solid-js"
import { pickTargetVideo } from "@/utils/target-video"
import { SEEK_STEP_MS, SPEED_STEP, seekBy, seekToNormalized, stepFrame, togglePlayPause } from "@/utils/video-mutators"
import { getFrameDuration } from "./frame-duration"

type VideoAction = (videoEl: HTMLVideoElement) => void

export type KeyboardShortcuts = ReturnType<typeof createKeyboardShortcuts>

/**
 * Keyboard shortcuts for the videos whose panel is shown. `adjustSpeed` is how the user changes the speed (see
 * `ControllersContainer`), so speed keys count as the user's choice for "remember my speed".
 */
export function createKeyboardShortcuts(adjustSpeed: (videoEl: HTMLVideoElement, adjustment: number) => void) {
  const keyActions = new Map<string, VideoAction>([
    ["z", (v) => adjustSpeed(v, -SPEED_STEP)],
    ["Z", (v) => adjustSpeed(v, -0.1)],
    ["x", (v) => adjustSpeed(v, +SPEED_STEP)],
    ["X", (v) => adjustSpeed(v, +0.1)],
    ["a", (v) => seekBy(v, -SEEK_STEP_MS)],
    ["A", (v) => seekBy(v, -4 * SEEK_STEP_MS)],
    ["d", (v) => seekBy(v, +SEEK_STEP_MS)],
    ["D", (v) => seekBy(v, +4 * SEEK_STEP_MS)],
    ["s", (v) => togglePlayPause(v)],
    // Above A and D, so frame steps sit right over seeking back and forward.
    ["q", (v) => stepFrame(v, -1, getFrameDuration(v))],
    ["e", (v) => stepFrame(v, 1, getFrameDuration(v))],
    // Number keys 0-9 seek to 0%-90%
    ...Array.from({ length: 10 }, (_, index): [string, VideoAction] => [
      index.toString(),
      (v) => seekToNormalized(v, index / 10),
    ]),
  ])

  // Videos whose panel is currently shown; only these can be controlled via shortcuts.
  const registeredVideos = new Set<HTMLVideoElement>()
  let lastInteractedVideo: HTMLVideoElement | undefined

  const markInteracted = (videoEl: HTMLVideoElement) => {
    lastInteractedVideo = videoEl
  }

  // Track the video under the pointer. Videos are often covered by the site's overlay elements, so the event target
  // is rarely the video itself; `elementsFromPoint` sees through them. Throttled, since it runs on `pointermove`.
  let lastPointerCheck = Number.NEGATIVE_INFINITY
  const onPointer = (event: PointerEvent) => {
    const now = event.timeStamp
    if (registeredVideos.size === 0 || (event.type === "pointermove" && now - lastPointerCheck < 150)) {
      return
    }
    lastPointerCheck = now
    const videoUnderPointer = document
      .elementsFromPoint(event.clientX, event.clientY)
      .find((el): el is HTMLVideoElement => registeredVideos.has(el as HTMLVideoElement))
    if (videoUnderPointer != null) {
      markInteracted(videoUnderPointer)
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const action = keyActions.get(event.key)
    if (action == null || event.altKey || event.ctrlKey || event.metaKey || isTyping(event)) {
      return
    }
    const target = pickTargetVideo(registeredVideos, lastInteractedVideo, (videoEl) => {
      const { width, height } = videoEl.getBoundingClientRect()
      return { area: width * height, isPlaying: !videoEl.paused && !videoEl.ended }
    })
    if (target != null) {
      // The page still receives the key; swallowing it would break the site's own shortcuts.
      action(target)
    }
  }

  // Capture phase on `window` runs before any handler on the page's elements, so a video player calling
  // `stopPropagation()` on key events can't block our shortcuts.
  const listeners = new AbortController()
  const { signal } = listeners
  window.addEventListener("keydown", onKeyDown, { capture: true, signal })
  window.addEventListener("pointermove", onPointer, { capture: true, passive: true, signal })
  window.addEventListener("pointerdown", onPointer, { capture: true, passive: true, signal })
  onCleanup(() => listeners.abort())

  return {
    registerVideo: (videoEl: HTMLVideoElement) => {
      registeredVideos.add(videoEl)
      return () => {
        registeredVideos.delete(videoEl)
      }
    },
    markInteracted,
  }
}

function isTyping(event: KeyboardEvent): boolean {
  // `composedPath()[0]` is the real target, also inside (open) shadow roots, where `event.target` is the shadow host.
  const element = event.composedPath()[0]
  if (!(element instanceof HTMLElement)) {
    return false
  }
  if (element instanceof HTMLInputElement) {
    // Sliders, checkboxes and buttons don't take text, e.g. our own seek and volume sliders.
    return !NON_TEXT_INPUT_TYPES.has(element.type)
  }
  const tagName = element.tagName.toLowerCase()
  return tagName === "textarea" || tagName === "select" || element.isContentEditable
}

const NON_TEXT_INPUT_TYPES = new Set([
  "range",
  "checkbox",
  "radio",
  "button",
  "submit",
  "reset",
  "color",
  "file",
  "image",
])
