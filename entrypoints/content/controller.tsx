import { type Accessor, createEffect, onCleanup, Show } from "solid-js"
import { createStore, produce } from "solid-js/store"
import {
  BackwardIcon,
  BrainIcon,
  ExitFullscreenIcon,
  FitScreenIcon,
  ForwardIcon,
  FullscreenIcon,
  GripIcon,
  MutedIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  RemoveIcon,
  RepeatIcon,
  SlashIcon,
  SlowDownIcon,
  SpeedIcon,
  SpeedUpIcon,
  VolumeIcon,
} from "@/assets/control-icons"
import { formatPlaybackRate, formatTime } from "@/utils/format-time"
import {
  adjustPlaybackRate,
  getPictureInPictureAvailability,
  seekBy,
  toggleLoop,
  togglePictureInPicture,
  togglePlayPause,
} from "@/utils/video-mutators"
import { FIT_TO_VIEWPORT_STYLES, setImportantStyles } from "@/utils/video-styles"
import { isVideoVisibleEnough } from "@/utils/video-visibility"
import { createWheelStepper } from "@/utils/wheel-stepper"
import { trackFrameDuration } from "./frame-duration"
import { toHostCoordinates } from "./host"
import { viewportIntersection } from "./intersection-observer"
import { keyboardShortcuts } from "./shortcuts"

/** Size of the resize handle (keep in sync with `.resize-handle` in `style.css`). */
const RESIZE_HANDLE_SIZE_PX = 12
/** Smallest size a video can be resized to. */
const MIN_RESIZE_PX = 100
/** Playback rate change per mouse wheel step on the speed label (same as the slow down / speed up buttons). */
const WHEEL_RATE_STEP = 0.25
/** Seek per mouse wheel step on the seek bar (same as the backward / forward buttons). */
const WHEEL_SEEK_STEP_MS = 5_000
/** Minimum time between speed and seek steps while scrolling. One second of scrolling: speed 1.00 to 2.50, or ~30 s. */
const WHEEL_RATE_INTERVAL_MS = 175
/** Volume change per mouse wheel step on the volume slider. */
const WHEEL_VOLUME_STEP = 0.05
/** Minimum time between volume steps while scrolling. One second of scrolling changes the volume by ~55%. */
const WHEEL_VOLUME_INTERVAL_MS = 80

interface Props {
  videoEl: Accessor<HTMLVideoElement>
  isGloballyDisabled: Accessor<boolean>
  /** Per-site setting: limit all videos to 80% of the window. */
  fitVideos: Accessor<boolean>
  toggleFitVideos: () => void
  /** Per-site setting: the speed for all videos, or `undefined` when "remember my speed" is off. */
  rememberedSpeed: Accessor<number | undefined>
  setRememberedSpeed: (speed: number | undefined) => void
}

export const Controller = (props: Props) => {
  const [state, setState] = createStore({
    videoEl: props.videoEl(),
    shouldShowMoreControls: false,
    isVideoInViewport: false,
    isVisibleEnough: false,
    position: getControllerPosition(props.videoEl()),
    isPaused: props.videoEl().paused,
    playbackRate: props.videoEl().playbackRate,
    isLooped: props.videoEl().loop,
    isPictureInPicture: props.videoEl().ownerDocument.pictureInPictureElement === props.videoEl(),
    currentTime: props.videoEl().currentTime,
    duration: props.videoEl().duration,
    // End of the seekable range; the seek bar's maximum for live streams, whose `duration` is `Infinity`.
    seekableEnd: 0,
    volume: props.videoEl().volume,
    isMuted: props.videoEl().muted,
    // Whether the time label shows the time until the end instead of the elapsed time.
    showRemainingTime: false,
    isFullscreen: false,
    // Offset of the widget from its default position (the video's top-left corner), set by dragging the grip.
    dragOffset: { x: 0, y: 0 },
    // Page coordinates of the resize handle, at the video's bottom-right corner.
    handlePosition: { left: 0, top: 0 },
    isClosed: false,
  })

  // The document's policy can't change after load, so it's enough to check once.
  const pictureInPictureAvailability = getPictureInPictureAvailability(props.videoEl())

  const isEligible = () => state.isVideoInViewport && state.isVisibleEnough
  const isDisabled = () => props.isGloballyDisabled() || state.isClosed || !isEligible()

  // Called after the user changed the speed through the extension. Only these changes are remembered, not the ones
  // made by the site, e.g. Twitch nudging the speed to catch up with a live stream.
  const onSpeedSetByUser = () => {
    if (props.rememberedSpeed() != null) {
      props.setRememberedSpeed(state.videoEl.playbackRate)
    }
  }
  const setSpeedByUser = (adjust: () => void) => {
    adjust()
    onSpeedSetByUser()
  }

  // Track whether the video is in the viewport and visible enough (see `isVideoVisibleEnough`). Pages toggle
  // visibility and size without moving the video, so visibility is also re-checked periodically.
  createEffect(() => {
    if (props.isGloballyDisabled() || state.isClosed) {
      return
    }
    const videoEl = state.videoEl
    const updateVisibility = () => {
      setState("isVisibleEnough", isVideoVisibleEnough(videoEl))
    }
    const { unregister } = viewportIntersection.register(videoEl, (entry) => {
      setState("isVideoInViewport", entry.isIntersecting)
      updateVisibility()
    })
    const intervalId = setInterval(updateVisibility, 1000)
    onCleanup(() => {
      unregister()
      clearInterval(intervalId)
    })
  })

  // The widget returns to its default position, collapsed, once the video leaves the viewport.
  createEffect(() => {
    if (!isEligible()) {
      setState({ dragOffset: { x: 0, y: 0 }, shouldShowMoreControls: false })
    }
  })

  // Turning the extension back on for the site brings back controllers hidden with the close button.
  createEffect(() => {
    const shouldCancelIsClosed = !props.isGloballyDisabled()
    if (shouldCancelIsClosed) {
      setState(
        produce((state) => {
          state.isClosed = false
        }),
      )
    }
  })

  // Follow changes to the video, whether they come from our controls, the page or the browser.
  createEffect(() => {
    if (isDisabled()) {
      return
    }
    const videoEl = state.videoEl
    const onPlayPauseChange = () => {
      setState(
        produce((state) => {
          state.isPaused = videoEl.paused
        }),
      )
    }
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)

    const onPictureInPictureChange = () => {
      setState(
        produce((state) => {
          state.isPictureInPicture = videoEl.ownerDocument.pictureInPictureElement === videoEl
        }),
      )
    }
    videoEl.addEventListener("enterpictureinpicture", onPictureInPictureChange)
    videoEl.addEventListener("leavepictureinpicture", onPictureInPictureChange)

    const onRateChange = () => {
      setState(
        produce((state) => {
          state.playbackRate = videoEl.playbackRate
        }),
      )
    }
    videoEl.addEventListener("ratechange", onRateChange)

    const onTimeChange = () => {
      const { seekable } = videoEl
      setState({
        currentTime: videoEl.currentTime,
        duration: videoEl.duration,
        seekableEnd: seekable.length > 0 ? seekable.end(seekable.length - 1) : 0,
      })
    }
    const timeEvents = ["timeupdate", "durationchange", "loadedmetadata", "progress", "seeked"]
    for (const type of timeEvents) {
      videoEl.addEventListener(type, onTimeChange)
    }
    onTimeChange()

    const onVolumeChange = () => {
      setState({ volume: videoEl.volume, isMuted: videoEl.muted })
    }
    videoEl.addEventListener("volumechange", onVolumeChange)

    const onFullscreenChange = () => {
      setState("isFullscreen", videoEl.ownerDocument.fullscreenElement === videoEl)
      // The video and the host (see `followFullscreen`) both move.
      requestAnimationFrame(updatePosition)
    }
    videoEl.ownerDocument.addEventListener("fullscreenchange", onFullscreenChange)

    const updatePosition = () => {
      const newPosition = getControllerPosition(videoEl)
      setState(
        produce((state) => {
          const didPositionChange = state.position.left !== newPosition.left || state.position.top !== newPosition.top
          if (didPositionChange) {
            state.position.left = newPosition.left
            state.position.top = newPosition.top
          }
        }),
      )
    }

    // Attribute changes (style, class, loop) may move the video or toggle its loop.
    const styleMutationObserver = new MutationObserver(() => {
      updatePosition()
      setState(
        produce((state) => {
          state.isLooped = videoEl.loop
        }),
      )
    })
    styleMutationObserver.observe(videoEl, { childList: false, attributes: true })

    // Scroll events don't bubble, but a capture listener on the document hears all of them, also from scroll areas
    // inside the page. The page's own scroll doesn't move the controller, but videos in scroll areas (or fixed ones)
    // move relative to the page.
    videoEl.ownerDocument.addEventListener("scroll", updatePosition, { capture: true, passive: true })

    // Catches moves nothing reports, e.g. a layout change above the video.
    const intervalId = setInterval(() => {
      updatePosition()
    }, 1000)

    updatePosition()

    onCleanup(() => {
      videoEl.removeEventListener("play", onPlayPauseChange)
      videoEl.removeEventListener("pause", onPlayPauseChange)
      videoEl.removeEventListener("enterpictureinpicture", onPictureInPictureChange)
      videoEl.removeEventListener("leavepictureinpicture", onPictureInPictureChange)
      videoEl.removeEventListener("ratechange", onRateChange)
      for (const type of timeEvents) {
        videoEl.removeEventListener(type, onTimeChange)
      }
      videoEl.removeEventListener("volumechange", onVolumeChange)
      videoEl.ownerDocument.removeEventListener("fullscreenchange", onFullscreenChange)
      videoEl.ownerDocument.removeEventListener("scroll", updatePosition, { capture: true })
      styleMutationObserver.disconnect()
      clearInterval(intervalId)
    })
  })

  // Constrain the video to the viewport when enabled for this site. Applies to every video on the page, also those
  // without a shown controller.
  createEffect(() => {
    if (props.isGloballyDisabled() || !props.fitVideos()) {
      return
    }
    onCleanup(setImportantStyles(state.videoEl, FIT_TO_VIEWPORT_STYLES))
  })

  // Apply the remembered speed to every video on the site, also those without a shown controller. Sites often reset
  // the speed when a new video starts, sometimes in the same `<video>` element (YouTube), so it's applied again when a
  // video loads or starts playing.
  createEffect(() => {
    const speed = props.rememberedSpeed()
    if (props.isGloballyDisabled() || speed == null) {
      return
    }
    const videoEl = state.videoEl
    const apply = () => {
      if (videoEl.playbackRate !== speed) {
        videoEl.playbackRate = speed
      }
    }
    apply()
    videoEl.addEventListener("loadedmetadata", apply)
    videoEl.addEventListener("play", apply)
    onCleanup(() => {
      videoEl.removeEventListener("loadedmetadata", apply)
      videoEl.removeEventListener("play", apply)
    })
  })

  const stepSpeedWheel = createWheelStepper(WHEEL_RATE_INTERVAL_MS)
  const stepVolumeWheel = createWheelStepper(WHEEL_VOLUME_INTERVAL_MS)
  const stepSeekWheel = createWheelStepper(WHEEL_RATE_INTERVAL_MS)

  // While the panel is open, a handle at the video's bottom-right corner resizes the video in place. The new size stays
  // when the panel closes. Double-clicking the handle, hiding the controls or turning the extension off for the site
  // restores the original size. Note that this resizes the `<video>`, not the site's player around it.
  let restoreSize: (() => void) | undefined
  const resetSize = () => {
    restoreSize?.()
    restoreSize = undefined
  }
  onCleanup(resetSize)
  createEffect(() => {
    if (props.isGloballyDisabled() || state.isClosed) {
      resetSize()
    }
  })
  const isResizeHandleShown = () => !isDisabled() && state.shouldShowMoreControls
  createEffect(() => {
    if (!isResizeHandleShown()) {
      return
    }
    const videoEl = state.videoEl
    // Keep the handle on the video's corner while the page scrolls, reflows or the video gets resized.
    let frame = 0
    const followCorner = () => {
      const rect = videoEl.getBoundingClientRect()
      setState("handlePosition", {
        ...toHostCoordinates(rect.right - RESIZE_HANDLE_SIZE_PX, rect.bottom - RESIZE_HANDLE_SIZE_PX),
      })
      frame = requestAnimationFrame(followCorner)
    }
    followCorner()
    onCleanup(() => cancelAnimationFrame(frame))
  })

  const startResize = (event: PointerEvent & { currentTarget: HTMLButtonElement }) => {
    event.preventDefault()
    const handle = event.currentTarget
    const videoEl = state.videoEl
    handle.setPointerCapture(event.pointerId)
    const { width, height } = videoEl.getBoundingClientRect()
    const start = { x: event.clientX, y: event.clientY, width, height }
    const onMove = (moveEvent: PointerEvent) => {
      const size = {
        width: `${Math.max(MIN_RESIZE_PX, start.width + moveEvent.clientX - start.x)}px`,
        height: `${Math.max(MIN_RESIZE_PX, start.height + moveEvent.clientY - start.y)}px`,
      }
      if (restoreSize == null) {
        restoreSize = setImportantStyles(videoEl, size)
      } else {
        videoEl.style.setProperty("width", size.width, "important")
        videoEl.style.setProperty("height", size.height, "important")
      }
    }
    const onEnd = () => {
      handle.removeEventListener("pointermove", onMove)
      handle.removeEventListener("pointerup", onEnd)
      handle.removeEventListener("pointercancel", onEnd)
    }
    handle.addEventListener("pointermove", onMove)
    handle.addEventListener("pointerup", onEnd)
    handle.addEventListener("pointercancel", onEnd)
  }

  // Make the video controllable via keyboard shortcuts while its controller is shown.
  createEffect(() => {
    if (isDisabled()) {
      return
    }
    onCleanup(keyboardShortcuts.registerVideo(state.videoEl, { onSpeedSetByUser }))
    onCleanup(trackFrameDuration(state.videoEl))
  })

  // Drag the widget by its grip. The offset is relative to the default position, so the widget keeps following its
  // video when the page scrolls or reflows.
  const startDrag = (event: PointerEvent & { currentTarget: HTMLDivElement }) => {
    event.preventDefault()
    const grip = event.currentTarget
    grip.setPointerCapture(event.pointerId)
    const start = { x: event.clientX, y: event.clientY, offset: { ...state.dragOffset } }
    const onMove = (moveEvent: PointerEvent) => {
      setState("dragOffset", {
        x: start.offset.x + moveEvent.clientX - start.x,
        y: start.offset.y + moveEvent.clientY - start.y,
      })
    }
    const onEnd = () => {
      grip.removeEventListener("pointermove", onMove)
      grip.removeEventListener("pointerup", onEnd)
      grip.removeEventListener("pointercancel", onEnd)
    }
    grip.addEventListener("pointermove", onMove)
    grip.addEventListener("pointerup", onEnd)
    grip.addEventListener("pointercancel", onEnd)
  }

  return (
    <Show when={!isDisabled()}>
      <div
        class="controller"
        classList={{ expanded: state.shouldShowMoreControls }}
        tabIndex={-1}
        // The widget can sit outside its video, so pointer tracking alone may not attribute it to this video.
        onPointerDown={() => keyboardShortcuts.markInteracted(state.videoEl)}
        style={{
          left: `${state.position.left + state.dragOffset.x}px`,
          top: `${state.position.top + state.dragOffset.y}px`,
        }}
      >
        <div class="underlay" />
        <div class="controls">
          <div class="row">
            <Show when={state.shouldShowMoreControls}>
              <div class="grip" title="Drag to move" onPointerDown={startDrag}>
                <GripIcon />
              </div>
              <button
                type="button"
                class="control"
                title="Slow down (Z)"
                onClick={(event) => {
                  event.stopPropagation()
                  setSpeedByUser(() => adjustPlaybackRate(state.videoEl, -0.25))
                }}
              >
                <SlowDownIcon />
              </button>
            </Show>
            <button
              type="button"
              class="control playback-rate"
              title={`Speed ${formatPlaybackRate(state.playbackRate)}×. Click to ${state.shouldShowMoreControls ? "hide" : "show"} controls, scroll to change speed, right-click to reset to 1.00.`}
              onClick={(event) => {
                event.stopPropagation()
                setState(
                  produce((state) => {
                    state.shouldShowMoreControls = !state.shouldShowMoreControls
                  }),
                )
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setSpeedByUser(() => {
                  state.videoEl.playbackRate = 1
                })
              }}
              onWheel={(event) => {
                event.preventDefault()
                const step = stepSpeedWheel(event.deltaY)
                if (step !== 0) {
                  setSpeedByUser(() => adjustPlaybackRate(state.videoEl, step * WHEEL_RATE_STEP))
                }
              }}
            >
              <SpeedIcon />
              <span>{formatPlaybackRate(state.playbackRate)}</span>
            </button>
            <Show when={state.shouldShowMoreControls}>
              <button
                type="button"
                class="control"
                title="Speed up (X)"
                onClick={(event) => {
                  event.stopPropagation()
                  setSpeedByUser(() => adjustPlaybackRate(state.videoEl, +0.25))
                }}
              >
                <SpeedUpIcon />
              </button>
              <span class="divider" />
              <button
                type="button"
                class="control"
                title="Backward 5 seconds (A)"
                onClick={(event) => {
                  event.stopPropagation()
                  seekBy(state.videoEl, -5_000)
                }}
              >
                <BackwardIcon />
              </button>
              <button
                type="button"
                class="control"
                title={`${state.isPaused ? "Play" : "Pause"} (S)`}
                onClick={(event) => {
                  event.stopPropagation()
                  togglePlayPause(state.videoEl)
                }}
              >
                {state.isPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
              <button
                type="button"
                class="control"
                title="Forward 5 seconds (D)"
                onClick={(event) => {
                  event.stopPropagation()
                  seekBy(state.videoEl, +5_000)
                }}
              >
                <ForwardIcon />
              </button>
              <span class="divider" />
              <button
                type="button"
                class="control"
                title={state.isLooped ? "Disable loop" : "Loop"}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleLoop(state.videoEl)
                  setState(
                    produce((state) => {
                      state.isLooped = state.videoEl.loop
                    }),
                  )
                }}
              >
                <Show when={state.isLooped} fallback={<RepeatIcon />}>
                  <SlashIcon>
                    <RepeatIcon />
                  </SlashIcon>
                </Show>
              </button>
              <button
                type="button"
                class="control"
                disabled={pictureInPictureAvailability !== "available"}
                title={
                  {
                    available: `${state.isPictureInPicture ? "Exit" : "Enter"} picture-in-picture (P)`,
                    blocked: "This site (or your browser settings) doesn't allow picture-in-picture.",
                    unsupported:
                      "Picture-in-picture isn't supported by this browser. Try the browser's own picture-in-picture button.",
                  }[pictureInPictureAvailability]
                }
                onClick={(event) => {
                  event.stopPropagation()
                  togglePictureInPicture(state.videoEl)
                }}
              >
                <Show when={state.isPictureInPicture} fallback={<PictureInPictureIcon />}>
                  <SlashIcon>
                    <PictureInPictureIcon />
                  </SlashIcon>
                </Show>
              </button>
              <span class="divider" />
              <button
                type="button"
                class="control"
                classList={{ active: props.rememberedSpeed() != null }}
                title={
                  props.rememberedSpeed() != null
                    ? `Remembering speed ${formatPlaybackRate(props.rememberedSpeed() ?? 1)}× for all videos on this site. Click to stop.`
                    : "Remember my speed for all videos on this site"
                }
                onClick={(event) => {
                  event.stopPropagation()
                  props.setRememberedSpeed(props.rememberedSpeed() == null ? state.videoEl.playbackRate : undefined)
                }}
              >
                <BrainIcon />
              </button>
              <button
                type="button"
                class="control"
                classList={{ active: props.fitVideos() }}
                title={
                  props.fitVideos()
                    ? "Videos on this site fit 80% of the window. Click to stop."
                    : "Fit videos on this site to 80% of the window"
                }
                onClick={(event) => {
                  event.stopPropagation()
                  props.toggleFitVideos()
                }}
              >
                <FitScreenIcon />
              </button>
              <span class="divider" />
              <button
                type="button"
                class="control"
                title="Hide controls for this video"
                onClick={(event) => {
                  event.stopPropagation()
                  setState(
                    produce((store) => {
                      store.isClosed = true
                    }),
                  )
                }}
              >
                <RemoveIcon />
              </button>
            </Show>
          </div>
          <Show when={state.shouldShowMoreControls}>
            <div class="row player-row">
              <input
                class="seek"
                type="range"
                title="Seek (scroll to seek 5 seconds)"
                min={0}
                max={Number.isFinite(state.duration) ? state.duration : state.seekableEnd}
                step="any"
                value={state.currentTime}
                onInput={(event) => {
                  state.videoEl.currentTime = event.currentTarget.valueAsNumber
                }}
                onWheel={(event) => {
                  event.preventDefault()
                  const step = stepSeekWheel(event.deltaY)
                  if (step !== 0) {
                    seekBy(state.videoEl, step * WHEEL_SEEK_STEP_MS)
                  }
                }}
              />
              <button
                type="button"
                class="control time"
                disabled={!Number.isFinite(state.duration)}
                title={
                  state.showRemainingTime
                    ? "Time until the end. Click to show the elapsed time."
                    : "Elapsed time. Click to show the time until the end."
                }
                onClick={() => setState("showRemainingTime", !state.showRemainingTime)}
              >
                {Number.isFinite(state.duration)
                  ? formatTime(state.showRemainingTime ? state.duration - state.currentTime : state.currentTime)
                  : state.duration === Number.POSITIVE_INFINITY
                    ? "LIVE"
                    : formatTime(state.currentTime)}
              </button>
              <button
                type="button"
                class="control"
                title={state.isMuted ? "Unmute" : "Mute"}
                onClick={() => {
                  state.videoEl.muted = !state.videoEl.muted
                }}
              >
                {state.isMuted || state.volume === 0 ? <MutedIcon /> : <VolumeIcon />}
              </button>
              <input
                class="volume"
                type="range"
                title="Volume"
                min={0}
                max={1}
                step={0.05}
                value={state.isMuted ? 0 : state.volume}
                onInput={(event) => {
                  state.videoEl.volume = event.currentTarget.valueAsNumber
                  state.videoEl.muted = false
                }}
                onWheel={(event) => {
                  event.preventDefault()
                  const step = stepVolumeWheel(event.deltaY)
                  if (step === 0) {
                    return
                  }
                  const current = state.videoEl.muted ? 0 : state.videoEl.volume
                  const volume = current + step * WHEEL_VOLUME_STEP
                  state.videoEl.volume = Math.min(1, Math.max(0, Math.round(volume * 100) / 100))
                  state.videoEl.muted = false
                }}
              />
              <button
                type="button"
                class="control"
                title={state.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                onClick={() => toggleFullscreen(state.videoEl)}
              >
                {state.isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button>
            </div>
          </Show>
        </div>
      </div>
      <Show when={isResizeHandleShown()}>
        <button
          type="button"
          class="resize-handle"
          title="Drag to resize, double-click to reset"
          style={{ left: `${state.handlePosition.left}px`, top: `${state.handlePosition.top}px` }}
          onPointerDown={startResize}
          onDblClick={resetSize}
        />
      </Show>
    </Show>
  )
}

function toggleFullscreen(videoEl: HTMLVideoElement) {
  if (videoEl.ownerDocument.fullscreenElement === videoEl) {
    videoEl.ownerDocument.exitFullscreen().catch(() => console.log("bee-fast-video:", "Could not exit fullscreen"))
  } else {
    videoEl.requestFullscreen().catch(() => console.log("bee-fast-video:", "Could not enter fullscreen", videoEl))
  }
}

function getControllerPosition(videoEl: HTMLVideoElement): { top: number; left: number } {
  const { x, y } = videoEl.getBoundingClientRect()
  return toHostCoordinates(x + 5, y + 5)
}
