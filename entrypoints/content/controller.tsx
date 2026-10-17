import { type Accessor, createEffect, onCleanup, Show } from "solid-js"
import { createStore, produce } from "solid-js/store"
import {
  BackwardIcon,
  ExitFullscreenIcon,
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
  SpeedUpIcon,
  VolumeIcon,
} from "@/assets/control-icons"
import { formatTime } from "@/utils/format-time"
import {
  adjustPlaybackRate,
  getPictureInPictureAvailability,
  seekBy,
  toggleLoop,
  togglePictureInPicture,
  togglePlayPause,
} from "@/utils/video-mutators"
import { isVideoVisibleEnough } from "@/utils/video-visibility"
import { viewportIntersection } from "./intersection-observer"
import { keyboardShortcuts } from "./shortcuts"

/** How long a video must stay visible before its controller appears. */
const SETTLE_DELAY_MS = 1000
/** How long the pointer must rest on the collapsed widget before it reacts to the pointer. */
const HOVER_ARM_DELAY_MS = 300

interface Props {
  videoEl: Accessor<HTMLVideoElement>
  isGloballyDisabled: Accessor<boolean>
}

export const Controller = (props: Props) => {
  const [state, setState] = createStore({
    videoEl: props.videoEl(),
    shouldShowMoreControls: false,
    isVideoInViewport: false,
    isVisibleEnough: false,
    // Whether the video has been eligible for a controller long enough (see `SETTLE_DELAY_MS`).
    isSettled: false,
    // Whether the collapsed widget reacts to the pointer (see `HOVER_ARM_DELAY_MS`).
    isArmed: false,
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
    isFullscreen: false,
    // Offset of the widget from its default position (the video's top-left corner), set by dragging the grip.
    dragOffset: { x: 0, y: 0 },
    isClosed: false,
  })

  // The document's policy can't change after load, so it's enough to check once.
  const pictureInPictureAvailability = getPictureInPictureAvailability(props.videoEl())

  const isEligible = () => state.isVideoInViewport && state.isVisibleEnough
  const isDisabled = () => props.isGloballyDisabled() || state.isClosed || !isEligible() || !state.isSettled

  let controllerEl: HTMLDivElement | undefined

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

  // Show the controller only after the video stayed eligible for a moment, so that short-lived videos (e.g. thumbnails
  // turning into video previews on hover) don't make controllers flicker.
  createEffect(() => {
    if (!isEligible()) {
      setState("isSettled", false)
      // A dragged widget returns to its default position once the video leaves the viewport.
      setState("dragOffset", { x: 0, y: 0 })
      return
    }
    const timeoutId = setTimeout(() => setState("isSettled", true), SETTLE_DELAY_MS)
    onCleanup(() => clearTimeout(timeoutId))
  })

  // The collapsed widget lets the pointer pass through (`pointer-events: none`) until the pointer rests on it, so it
  // doesn't steal hover from the page, e.g. from thumbnails that play a preview while hovered. With `pointer-events:
  // none` the widget gets no pointer events itself, and after arming the browser doesn't consider it hovered until the
  // pointer moves (so no `pointerleave` either), hence the global pointer tracking for both arming and disarming.
  createEffect(() => {
    if (isDisabled() || state.shouldShowMoreControls) {
      return
    }
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const onPointerMove = (event: PointerEvent) => {
      const rect = controllerEl?.getBoundingClientRect()
      const isOver =
        rect != null &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      if (isOver) {
        if (!state.isArmed && timeoutId == null) {
          timeoutId = setTimeout(() => setState("isArmed", true), HOVER_ARM_DELAY_MS)
        }
      } else {
        clearTimeout(timeoutId)
        timeoutId = undefined
        if (state.isArmed) {
          setState("isArmed", false)
        }
      }
    }
    window.addEventListener("pointermove", onPointerMove, { capture: true, passive: true })
    onCleanup(() => {
      window.removeEventListener("pointermove", onPointerMove, { capture: true })
      clearTimeout(timeoutId)
    })
  })

  // Handle `isGloballyDisabled` changes.
  createEffect(() => {
    // When `isGloballyDisabled` becomes `false`, we cancel `isClosed`
    const shouldCancelIsClosed = !props.isGloballyDisabled()
    if (shouldCancelIsClosed) {
      setState(
        produce((state) => {
          state.isClosed = false
        }),
      )
    }
  })

  // React on video events
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

    // Track position change
    const styleMutationObserver = new MutationObserver(() => {
      updatePosition()
      setState(
        produce((state) => {
          state.isLooped = videoEl.loop
        }),
      )
    })
    styleMutationObserver.observe(videoEl, { childList: false, attributes: true })

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
      styleMutationObserver.disconnect()
      clearInterval(intervalId)
    })
  })

  // Make the video controllable via keyboard shortcuts while its controller is shown.
  createEffect(() => {
    if (isDisabled()) {
      return
    }
    onCleanup(keyboardShortcuts.registerVideo(state.videoEl))
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
        ref={controllerEl}
        class="controller"
        classList={{ passthrough: !state.shouldShowMoreControls && !state.isArmed }}
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
            </Show>
            <button
              type="button"
              class="control playback-rate"
              title="Video speed"
              onClick={(event) => {
                event.stopPropagation()
                setState(
                  produce((state) => {
                    state.shouldShowMoreControls = !state.shouldShowMoreControls
                  }),
                )
              }}
            >
              <span>{state.playbackRate.toFixed(2)}</span>
            </button>
            <Show when={state.shouldShowMoreControls}>
              <button
                type="button"
                class="control"
                title="Slow down (Z)"
                onClick={(event) => {
                  event.stopPropagation()
                  adjustPlaybackRate(state.videoEl, -0.25)
                }}
              >
                <SlowDownIcon />
              </button>
              <button
                type="button"
                class="control"
                title="Speed up (X)"
                onClick={(event) => {
                  event.stopPropagation()
                  adjustPlaybackRate(state.videoEl, +0.25)
                }}
              >
                <SpeedUpIcon />
              </button>
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
                title="Seek"
                min={0}
                max={Number.isFinite(state.duration) ? state.duration : state.seekableEnd}
                step="any"
                value={state.currentTime}
                onInput={(event) => {
                  state.videoEl.currentTime = event.currentTarget.valueAsNumber
                }}
              />
              <span class="time">
                {Number.isFinite(state.duration)
                  ? `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`
                  : state.duration === Number.POSITIVE_INFINITY
                    ? "LIVE"
                    : formatTime(state.currentTime)}
              </span>
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
  const { left, top } = getElementPositionFromTopOfPage(videoEl)
  return { left: left + 5, top: top + 5 }
}

function getElementPositionFromTopOfPage(element: HTMLElement): { top: number; left: number } {
  const { x, y } = element.getBoundingClientRect()
  return {
    left: x + window.scrollX,
    top: y + window.scrollY,
  }
}
