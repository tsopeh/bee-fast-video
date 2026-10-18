// Keyboard event reference: https://w3c.github.io/uievents/tools/key-event-viewer.html

import { pickTargetVideo } from "@/utils/target-video"
import {
  adjustPlaybackRate,
  seekBy,
  seekToNormalized,
  stepFrame,
  togglePictureInPicture,
  togglePlayPause,
} from "@/utils/video-mutators"
import { getFrameDuration } from "./frame-duration"

type VideoAction = (videoEl: HTMLVideoElement) => void

const keyActions = new Map<string, VideoAction>([
  ["z", (v) => adjustPlaybackRate(v, -0.25)],
  ["Z", (v) => adjustPlaybackRate(v, -0.1)],
  ["x", (v) => adjustPlaybackRate(v, +0.25)],
  ["X", (v) => adjustPlaybackRate(v, +0.1)],
  ["a", (v) => seekBy(v, -5_000)],
  ["A", (v) => seekBy(v, -20_000)],
  ["d", (v) => seekBy(v, +5_000)],
  ["D", (v) => seekBy(v, +20_000)],
  ["s", (v) => togglePlayPause(v)],
  // Above A and D, so frame steps sit right over seeking back and forward.
  ["q", (v) => stepFrame(v, -1, getFrameDuration(v))],
  ["e", (v) => stepFrame(v, 1, getFrameDuration(v))],
  ["p", (v) => togglePictureInPicture(v)],
  ["P", (v) => togglePictureInPicture(v)],
  // Number keys 0-9 seek to 0%-90%
  ...Array.from({ length: 10 }, (_, index): [string, VideoAction] => [
    index.toString(),
    (v) => seekToNormalized(v, index / 10),
  ]),
])

const SPEED_KEYS = new Set(["z", "Z", "x", "X"])

interface RegisteredVideo {
  /** Called after a shortcut changed the speed, so "remember my speed" can save it. */
  onSpeedSetByUser: () => void
}

function initKeyboardShortcuts() {
  // Videos whose controller is currently shown; only these can be controlled via shortcuts.
  const registeredVideos = new Map<HTMLVideoElement, RegisteredVideo>()
  let lastInteractedVideo: HTMLVideoElement | undefined

  const markInteracted = (videoEl: HTMLVideoElement) => {
    lastInteractedVideo = videoEl
  }

  // Track the video under the pointer. Videos are often covered by the site's overlay elements, so the event target
  // is rarely the video itself; `elementsFromPoint` sees through them. Throttled, since it runs on `pointermove`.
  let lastPointerCheck = Number.NEGATIVE_INFINITY
  const onPointer = (event: PointerEvent) => {
    const now = event.timeStamp
    if (event.type === "pointermove" && now - lastPointerCheck < 150) {
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
    const target = pickTargetVideo(registeredVideos.keys(), lastInteractedVideo, (videoEl) => {
      const { width, height } = videoEl.getBoundingClientRect()
      return { area: width * height, isPlaying: !videoEl.paused && !videoEl.ended }
    })
    if (target != null) {
      // The page still receives the key; swallowing it would break the site's own shortcuts.
      action(target)
      if (SPEED_KEYS.has(event.key)) {
        registeredVideos.get(target)?.onSpeedSetByUser()
      }
    }
  }

  // Capture phase on `window` runs before any handler on the page's elements, so a video player calling
  // `stopPropagation()` on key events can't block our shortcuts.
  window.addEventListener("keydown", onKeyDown, { capture: true })
  window.addEventListener("pointermove", onPointer, { capture: true, passive: true })
  window.addEventListener("pointerdown", onPointer, { capture: true, passive: true })

  return {
    registerVideo: (videoEl: HTMLVideoElement, handlers: RegisteredVideo) => {
      registeredVideos.set(videoEl, handlers)
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

export const keyboardShortcuts = initKeyboardShortcuts()
