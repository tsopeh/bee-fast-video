// Keyboard event reference: https://w3c.github.io/uievents/tools/key-event-viewer.html

import { type Accessor, onCleanup } from "solid-js"
import { actionForKey, type KeyAction, type KeyBindings } from "@/utils/keys"
import type { Steps } from "@/utils/steps"
import { pickTargetVideo } from "@/utils/target-video"
import { seekBy, seekToNormalized, stepFrame, togglePlayPause } from "@/utils/video-mutators"
import { getFrameDuration } from "./frame-duration"

/**
 * What a key did, shown next to the panel. `direction` is which way the text moves: right for more or forward, left for
 * less or back, and 0 for in place.
 */
export interface Feedback {
  text: string
  direction: -1 | 0 | 1
}

/** What a key does. `shift` is whether Shift is held, which picks the second step. */
type VideoAction = (videoEl: HTMLVideoElement, shift: boolean) => Feedback

export type KeyboardShortcuts = ReturnType<typeof createKeyboardShortcuts>

/**
 * Keyboard shortcuts for the videos whose panel is shown. `adjustSpeed` is how the user changes the speed (see
 * `ControllersContainer`), so speed keys count as the user's choice for "remember my speed".
 */
export function createKeyboardShortcuts(
  keys: Accessor<KeyBindings>,
  steps: Accessor<Steps>,
  adjustSpeed: (videoEl: HTMLVideoElement, adjustment: number) => void,
) {
  const changeSpeed = (v: HTMLVideoElement, direction: -1 | 1, shift: boolean): Feedback => {
    const step = shift ? steps().shiftSpeed : steps().speed
    adjustSpeed(v, direction * step)
    return { text: `${sign(direction)}${step}`, direction }
  }
  const seek = (v: HTMLVideoElement, direction: -1 | 1, shift: boolean): Feedback => {
    const seconds = shift ? steps().shiftSeek : steps().seek
    seekBy(v, direction * seconds * 1000)
    return { text: `${sign(direction)}${seconds} s`, direction }
  }
  const stepOneFrame = (v: HTMLVideoElement, direction: -1 | 1): Feedback => {
    stepFrame(v, direction, getFrameDuration(v))
    return { text: `${sign(direction)}1 frame`, direction }
  }
  const actions: Record<KeyAction, VideoAction> = {
    slowDown: (v, shift) => changeSpeed(v, -1, shift),
    speedUp: (v, shift) => changeSpeed(v, +1, shift),
    rewind: (v, shift) => seek(v, -1, shift),
    forward: (v, shift) => seek(v, +1, shift),
    playPause: (v) => {
      // What it was before, since `play()` can fail, e.g. when the browser blocks playing with sound.
      const text = v.paused ? "Play" : "Pause"
      togglePlayPause(v)
      return { text, direction: 0 }
    },
    previousFrame: (v) => stepOneFrame(v, -1),
    nextFrame: (v) => stepOneFrame(v, +1),
  }
  // The others leave Shift to the page.
  const shiftActions = new Set<KeyAction>(["slowDown", "speedUp", "rewind", "forward"])

  // Number keys 0-9 seek to 0%-90%. They can't be changed.
  const actionFor = (event: KeyboardEvent): ((videoEl: HTMLVideoElement) => Feedback) | undefined => {
    if (/^[0-9]$/.test(event.key)) {
      return (v) => {
        seekToNormalized(v, Number(event.key) / 10)
        return { text: `${Number(event.key) * 10}%`, direction: 0 }
      }
    }
    const action = actionForKey(keys(), event)
    if (action == null || (event.shiftKey && !shiftActions.has(action))) {
      return undefined
    }
    return (v) => actions[action](v, event.shiftKey)
  }

  // Videos whose panel is currently shown, with how their panel shows feedback. Only these can be controlled via
  // shortcuts.
  const registeredVideos = new Map<HTMLVideoElement, (feedback: Feedback) => void>()
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
    const videoUnderPointer = elementsFromPoint(document, event.clientX, event.clientY).find(
      (el): el is HTMLVideoElement => registeredVideos.has(el as HTMLVideoElement),
    )
    if (videoUnderPointer != null) {
      markInteracted(videoUnderPointer)
    }
  }

  const targetVideo = () =>
    pickTargetVideo(registeredVideos.keys(), lastInteractedVideo, (videoEl) => {
      const { width, height } = videoEl.getBoundingClientRect()
      return { area: width * height, isPlaying: !videoEl.paused && !videoEl.ended }
    })

  const onKeyDown = (event: KeyboardEvent) => {
    const action = actionFor(event)
    if (action == null || event.altKey || event.ctrlKey || event.metaKey || isTyping(event)) {
      return
    }
    const target = targetVideo()
    if (target != null) {
      // The page still receives the key; swallowing it would break the site's own shortcuts.
      registeredVideos.get(target)?.(action(target))
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
    registerVideo: (videoEl: HTMLVideoElement, showFeedback: (feedback: Feedback) => void) => {
      registeredVideos.set(videoEl, showFeedback)
      return () => {
        registeredVideos.delete(videoEl)
      }
    },
    markInteracted,
    /** The video the keys act on, if any panel is shown. */
    targetVideo,
  }
}

/**
 * Like `document.elementsFromPoint`, but also looks inside open shadow roots, where the page's list stops at the host.
 * A shadow root's list also has the elements around it, so `visited` keeps it from going back into the same roots.
 */
function elementsFromPoint(
  root: Document | ShadowRoot,
  x: number,
  y: number,
  visited = new Set<Document | ShadowRoot>([root]),
): Array<Element> {
  return root.elementsFromPoint(x, y).flatMap((element) => {
    const shadowRoot = element.shadowRoot
    if (shadowRoot == null || visited.has(shadowRoot)) {
      return [element]
    }
    visited.add(shadowRoot)
    return elementsFromPoint(shadowRoot, x, y, visited)
  })
}

// A real minus sign, as wide as the plus.
const sign = (direction: -1 | 1) => (direction > 0 ? "+" : "−")

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
