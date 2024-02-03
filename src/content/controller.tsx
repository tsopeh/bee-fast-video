import { Accessor, createEffect, onCleanup, Setter, Show } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { BackwardIcon, ForwardIcon, NativeControlsIcon, PauseIcon, PictureInPictureIcon, PlayIcon, RemoveIcon, RepeatIcon, SlashIcon, SlowDownIcon, SpeedUpIcon } from "../assets/control-icons"
import { viewportIntersection } from "./intersection-observer"
import { keyboardListener } from "./shortcuts"
import { adjustPlaybackRate, seekBy, seekToNormalized, toggleLoop, togglePictureInPicture, togglePlayPause } from "./video-mutators"

interface Props {
  videoEl: Accessor<HTMLVideoElement>
  isGloballyDisabled: Accessor<boolean>
  shouldBringToFront: Accessor<boolean>
  setShouldBringToFront: Setter<boolean>
}

export const Controller = (props: Props) => {

  const [state, setState] = createStore({
    videoEl: props.videoEl(),
    shouldShowMoreControls: false,
    isVideoInViewport: false,
    position: getControllerPosition(props.videoEl()),
    isPaused: props.videoEl().paused,
    playbackRate: props.videoEl().playbackRate,
    isLooped: props.videoEl().loop,
    isPictureInPicture: props.videoEl().ownerDocument.pictureInPictureElement == props.videoEl(),
    isClosed: false,
  })

  const isDisabled = () => props.isGloballyDisabled() || state.isClosed || !state.isVideoInViewport

  // Handle viewport visibility change
  createEffect(() => {
    const { unregister } = viewportIntersection.register(state.videoEl, (entry) => {
      setState(produce(state => { state.isVideoInViewport = entry.isIntersecting }))
    })
    onCleanup(() => {
      unregister()
    })
  })

  // Handle `isGloballyDisabled` changes.
  createEffect(() => {
    // When `isGloballyDisabled` becomes `false`, we cancel `isClosed`
    const shouldCancelIsClosed = !props.isGloballyDisabled()
    if (shouldCancelIsClosed) {
      setState(produce(state => {
        state.isClosed = false
      }))
    }
  })

  // React on video events
  createEffect(() => {
    if (isDisabled()) {
      return
    }
    const videoEl = state.videoEl
    const onPlayPauseChange = () => {
      setState(produce(state => {state.isPaused = videoEl.paused}))
    }
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)

    const onPictureInPictureChange = () => {
      setState(produce(state => {
        state.isPictureInPicture = videoEl.ownerDocument.pictureInPictureElement == videoEl
      }))
    }
    videoEl.addEventListener("enterpictureinpicture", onPictureInPictureChange)
    videoEl.addEventListener("leavepictureinpicture", onPictureInPictureChange)

    const onRateChange = () => {
      setState(produce(state => {
        state.playbackRate = videoEl.playbackRate
      }))
    }
    videoEl.addEventListener("ratechange", onRateChange)

    const updatePosition = () => {
      const newPosition = getControllerPosition(videoEl)
      setState(produce(state => {
        const didPositionChange = state.position.left != newPosition.left || state.position.top != newPosition.top
        if (didPositionChange) {
          state.position.left = newPosition.left
          state.position.top = newPosition.top
        }
      }))
    }

    // Track position change
    const styleMutationObserver = new MutationObserver(() => {
      updatePosition()
      setState(produce(state => {
        state.isLooped = videoEl.loop
      }))
      const shouldForceControls = props.shouldBringToFront() && !videoEl.controls
      if (shouldForceControls) {
        videoEl.controls = true
      }
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
        styleMutationObserver.disconnect()
        clearInterval(intervalId)
      },
    )
  })

  // React on keyboard events
  createEffect(() => {
    if (isDisabled()) {
      return
    }
    const videoEl = state.videoEl
    const listeners = [
      keyboardListener.registerCallback("z", () => {
        adjustPlaybackRate(videoEl, -0.25)
      }),
      keyboardListener.registerCallback("Z", () => {
        adjustPlaybackRate(videoEl, -0.1)
      }),
      keyboardListener.registerCallback("x", () => {
        adjustPlaybackRate(videoEl, +0.25)
      }),
      keyboardListener.registerCallback("X", () => {
        adjustPlaybackRate(videoEl, +0.1)
      }),
      keyboardListener.registerCallback("a", () => {
        seekBy(videoEl, -5_000)
      }),
      keyboardListener.registerCallback("A", () => {
        seekBy(videoEl, -20_000)
      }),
      keyboardListener.registerCallback("d", () => {
        seekBy(videoEl, +5_000)
      }),
      keyboardListener.registerCallback("D", () => {
        seekBy(videoEl, +20_000)
      }),
      keyboardListener.registerCallback("s", () => {
        togglePlayPause(videoEl)
      }),
      // Number keys from 1 to 10
      ...Array.from({ length: 10 })
        .map((_, index) => index)
        .map((_, index) => {
          const normalized = index / 10
          return keyboardListener.registerCallback(index.toString(), () => {
            seekToNormalized(videoEl, normalized)
          })
        }),
      keyboardListener.registerCallback("p", () => {
        togglePictureInPicture(videoEl)
      }),
      keyboardListener.registerCallback("P", () => {
        togglePictureInPicture(videoEl)
      }),
    ]
    onCleanup(() => {
      listeners.forEach(l => l.unregisterCallback())
    })
  })

  // React on `shouldBringToFront`
  createEffect(() => {
    if (!props.shouldBringToFront()) {
      return
    }
    const videoEl = state.videoEl
    const videoPosition = getElementPositionFromTopOfPage(videoEl)
    const { width, height } = videoEl.getBoundingClientRect()
    videoEl.remove()
    const shouldSetDifferentPosition =
      videoEl.style.position == null
      || videoEl.style.position == ""
      || videoEl.style.position == "static"
    if (shouldSetDifferentPosition) {
      videoEl.style.position = "absolute"
    }
    videoEl.style.left = `${videoPosition.left}px`
    videoEl.style.top = `${videoPosition.top}px`
    videoEl.style.width = `${width}px`
    videoEl.style.height = `min(85vh, ${height}px)`
    videoEl.style.zIndex = `${2147483647 - 10}`
    videoEl.controls = true
    videoEl.style.outline = "2px solid rgb(233, 171, 23, 0.6)"
    videoEl.style.backgroundColor = "#000000"
    videoEl.ownerDocument.body.appendChild(videoEl)
  })

  return <Show when={!isDisabled()}>
    <div
      class="controller"
      tabIndex={-1}
      style={{
        left: `${state.position.left}px`,
        top: `${state.position.top}px`,
      }}
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
      }}
      onDblClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
      }}
    >
      <div class="underlay" />
      <div
        class="controls"
      >
        <div
          class="control playback-rate"
          title="Video speed"
          onClick={(event) => {
            event.stopPropagation()
            setState(produce(state => {
              state.shouldShowMoreControls = !state.shouldShowMoreControls
            }))
          }}
        >
          <span>{state.playbackRate.toFixed(2)}</span>
        </div>
        <Show when={state.shouldShowMoreControls}>
          <div
            class="control"
            title="Slow down (Z)"
            onClick={(event) => {
              event.stopPropagation()
              adjustPlaybackRate(state.videoEl, -0.25)
            }}>
            <SlowDownIcon />
          </div>
          <div
            class="control"
            title="Speed up (X)"
            onClick={(event) => {
              event.stopPropagation()
              adjustPlaybackRate(state.videoEl, +0.25)
            }}>
            <SpeedUpIcon />
          </div>
          <div
            class="control"
            title="Backward 5 seconds (A)"
            onClick={(event) => {
              event.stopPropagation()
              seekBy(state.videoEl, -5_000)
            }}>
            <BackwardIcon />
          </div>
          <div
            class="control"
            title={`${state.isPaused ? "Play" : "Pause"} (S)`}
            onClick={(event) => {
              event.stopPropagation()
              togglePlayPause(state.videoEl)
            }}>
            {state.isPaused ? <PlayIcon /> : <PauseIcon />}
          </div>
          <div
            class="control"
            title="Forward 5 seconds (D)"
            onClick={(event) => {
              event.stopPropagation()
              seekBy(state.videoEl, +5_000)
            }}>
            <ForwardIcon />
          </div>
          <div
            class="control"
            title={state.isLooped ? "Disable loop" : "Loop"}
            onClick={(event) => {
              event.stopPropagation()
              toggleLoop(state.videoEl)
              setState(produce((state) => {
                state.isLooped = state.videoEl.loop
              }))
            }}>
            <Show when={state.isLooped} fallback={<RepeatIcon />}>
              <SlashIcon>
                <RepeatIcon />
              </SlashIcon>
            </Show>
          </div>
          <div
            class={`control ${props.shouldBringToFront() ? "locked" : ""}`}
            title={
              props.shouldBringToFront()
                ? "Reload the page to disable this."
                : "Enable native controls and bring to front all videos on this page."
            }
            onClick={(event) => {
              event.stopPropagation()
              props.setShouldBringToFront(true)
            }}>
            <NativeControlsIcon />
          </div>
          <div
            class="control"
            title={`${state.isPictureInPicture ? "Exit" : "Enter"} picture-in-picture (P)`}
            onClick={(event) => {
              event.stopPropagation()
              togglePictureInPicture(state.videoEl)
            }}>
            <Show when={state.isPictureInPicture} fallback={<PictureInPictureIcon />}>
              <SlashIcon>
                <PictureInPictureIcon />
              </SlashIcon>
            </Show>
          </div>
          <div
            class="control"
            title="Toggle disable (B)"
            onClick={(event) => {
              event.stopPropagation()
              setState(produce((store) => {
                store.isClosed = true
              }))
            }}>
            <RemoveIcon />
          </div>
        </Show>
      </div>
    </div>
  </Show>
}

function getControllerPosition (videoEl: HTMLVideoElement): { top: number, left: number } {
  const { left, top } = getElementPositionFromTopOfPage(videoEl)
  return { left: left + 5, top: top + 5 }
}

function getElementPositionFromTopOfPage (element: HTMLElement): { top: number, left: number } {
  const { x, y } = element.getBoundingClientRect()
  return {
    left: x + window.scrollX,
    top: y + window.scrollY,
  }
}