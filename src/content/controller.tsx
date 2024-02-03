import { Accessor, createEffect, onCleanup, Setter, Show } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { BackwardIcon, ForwardIcon, NativeControlsIcon, PauseIcon, PictureInPictureIcon, PlayIcon, RemoveIcon, RepeatIcon, SlashIcon, SlowDownIcon, SpeedUpIcon } from "../assets/control-icons"
import { viewportIntersection } from "./intersection-observer"
import { keyboardListener } from "./shortcuts"

interface Props {
  videoEl: HTMLVideoElement
  isGloballyDisabled: Accessor<boolean>
  shouldBringToFront: Accessor<boolean>
  setShouldBringToFront: Setter<boolean>
}

export const Controller = (props: Props) => {
  const [state, setState] = createStore({
    shouldShowMoreControls: false,
    isVideoInViewport: false,
    position: getControllerPosition(props.videoEl),
    isPaused: props.videoEl.paused,
    playbackRate: props.videoEl.playbackRate,
    isLooped: props.videoEl.loop,
    isPictureInPicture: props.videoEl.ownerDocument.pictureInPictureElement == props.videoEl,
    isClosed: false,
  })

  const isDisabled = () => props.isGloballyDisabled() || state.isClosed || !state.isVideoInViewport

  const adjustPlaybackRate = (adjustment: number) => {
    props.videoEl.playbackRate = getValidPlaybackRate(props.videoEl.playbackRate, adjustment)
  }
  const seekBy = (seekMs: number) => {
    const seekSeconds = seekMs / 1000
    props.videoEl.currentTime = getValidSeekTime(props.videoEl.duration, props.videoEl.currentTime, seekSeconds)
  }
  const seekToNormalized = (normalized: number) => {
    if (normalized >= 0 && normalized <= 1) {
      props.videoEl.currentTime = Math.round(props.videoEl.duration * normalized)
    }
  }
  const togglePlayPause = () => {
    if (state.isPaused) {
      props.videoEl.play().catch(() => console.log("bee-fast-video:", "Could not play the video", props.videoEl))
    } else {
      props.videoEl.pause()
    }
  }
  const toggleLoop = () => {
    props.videoEl.loop = !props.videoEl.loop
    setState(produce((state) => {
      state.isLooped = props.videoEl.loop
    }))
  }
  const enterCinemaMode = () => {
    props.setShouldBringToFront(true)
  }
  const togglePictureInPicture = () => {
    if (state.isPictureInPicture) {
      props.videoEl.ownerDocument.exitPictureInPicture().catch(() => console.log("bee-fast-video:", "Could not exit from the picture-in-picture mode for video", props.videoEl))
    } else {
      props.videoEl.disablePictureInPicture = false
      props.videoEl.requestPictureInPicture().catch(() => console.log("bee-fast-video:", "Could not enter the picture-in-picture mode for video", props.videoEl))
    }
  }
  const close = () => {
    setState(produce((store) => {
      store.isClosed = true
    }))
  }

  // Handle viewport visibility change
  createEffect(() => {
    const { unregister } = viewportIntersection.register(props.videoEl, (entry) => {
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
    const onPlayPauseChange = () => {
      setState(produce(state => {state.isPaused = props.videoEl.paused}))
    }
    props.videoEl.addEventListener("play", onPlayPauseChange)
    props.videoEl.addEventListener("pause", onPlayPauseChange)

    const onPictureInPictureChange = () => {
      setState(produce(state => {
        state.isPictureInPicture = props.videoEl.ownerDocument.pictureInPictureElement == props.videoEl
      }))
    }
    props.videoEl.addEventListener("enterpictureinpicture", onPictureInPictureChange)
    props.videoEl.addEventListener("leavepictureinpicture", onPictureInPictureChange)

    const onRateChange = () => {
      setState(produce(state => {
        state.playbackRate = props.videoEl.playbackRate
      }))
    }
    props.videoEl.addEventListener("ratechange", onRateChange)

    const updatePosition = () => {
      const newPosition = getControllerPosition(props.videoEl)
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
        state.isLooped = props.videoEl.loop
      }))
      const shouldForceControls = props.shouldBringToFront() && !props.videoEl.controls
      if (shouldForceControls) {
        props.videoEl.controls = true
      }
    })
    styleMutationObserver.observe(props.videoEl, { childList: false, attributes: true })

    const intervalId = setInterval(() => {
      updatePosition()
    }, 1000)

    updatePosition()

    onCleanup(() => {
        props.videoEl.removeEventListener("play", onPlayPauseChange)
        props.videoEl.removeEventListener("pause", onPlayPauseChange)
        props.videoEl.removeEventListener("enterpictureinpicture", onPictureInPictureChange)
        props.videoEl.removeEventListener("leavepictureinpicture", onPictureInPictureChange)
        props.videoEl.removeEventListener("ratechange", onRateChange)
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
    const listeners = [
      keyboardListener.registerCallback("z", () => {
        adjustPlaybackRate(-0.25)
      }),
      keyboardListener.registerCallback("Z", () => {
        adjustPlaybackRate(-0.1)
      }),
      keyboardListener.registerCallback("x", () => {
        adjustPlaybackRate(+0.25)
      }),
      keyboardListener.registerCallback("X", () => {
        adjustPlaybackRate(+0.1)
      }),
      keyboardListener.registerCallback("a", () => {
        seekBy(-5_000)
      }),
      keyboardListener.registerCallback("A", () => {
        seekBy(-20_000)
      }),
      keyboardListener.registerCallback("d", () => {
        seekBy(+5_000)
      }),
      keyboardListener.registerCallback("D", () => {
        seekBy(+20_000)
      }),
      keyboardListener.registerCallback("s", () => {
        togglePlayPause()
      }),
      // Number keys from 1 to 10
      ...Array.from({ length: 10 })
        .map((_, index) => index)
        .map((_, index) => {
          const normalized = index / 10
          return keyboardListener.registerCallback(index.toString(), () => {
            seekToNormalized(normalized)
          })
        }),
      keyboardListener.registerCallback("p", () => {
        togglePictureInPicture()
      }),
      keyboardListener.registerCallback("P", () => {
        togglePictureInPicture()
      }),
    ]
    onCleanup(() => {
      listeners.forEach(l => l.unregisterCallback())
    })
  })

  createEffect(() => {
    if (!props.shouldBringToFront()) {
      return
    }
    const videoPosition = getElementPositionFromTopOfPage(props.videoEl)
    const { width, height } = props.videoEl.getBoundingClientRect()
    props.videoEl.remove()
    const shouldSetDifferentPosition =
      props.videoEl.style.position == null
      || props.videoEl.style.position == ""
      || props.videoEl.style.position == "static"
    if (shouldSetDifferentPosition) {
      props.videoEl.style.position = "absolute"
    }
    props.videoEl.style.left = `${videoPosition.left}px`
    props.videoEl.style.top = `${videoPosition.top}px`
    props.videoEl.style.width = `${width}px`
    props.videoEl.style.height = `${height}px`
    props.videoEl.style.zIndex = `${2147483647 - 10}`
    props.videoEl.controls = true
    props.videoEl.style.outline = "2px solid rgb(233, 171, 23, 0.6)"
    props.videoEl.style.backgroundColor = "#000000"
    props.videoEl.ownerDocument.body.appendChild(props.videoEl)
  })

  const stopPrevent = (event: Event) => {
    event.stopPropagation()
    event.preventDefault()
  }

  return <Show when={!isDisabled()}>
    <div
      class="controller"
      tabIndex={-1}
      style={{
        left: `${state.position.left}px`,
        top: `${state.position.top}px`,
      }}
      onClick={(event) => {
        stopPrevent(event)
      }}
      onDblClick={(event) => {
        stopPrevent(event)
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
              state.shouldShowMoreControls = true
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
              adjustPlaybackRate(-0.25)
            }}>
            <SlowDownIcon />
          </div>
          <div
            class="control"
            title="Speed up (X)"
            onClick={(event) => {
              event.stopPropagation()
              adjustPlaybackRate(+0.25)
            }}>
            <SpeedUpIcon />
          </div>
          <div
            class="control"
            title="Backward 5 seconds (A)"
            onClick={(event) => {
              event.stopPropagation()
              seekBy(-5_000)
            }}>
            <BackwardIcon />
          </div>
          <div
            class="control"
            title={`${state.isPaused ? "Play" : "Pause"} (S)`}
            onClick={(event) => {
              event.stopPropagation()
              togglePlayPause()
            }}>
            {state.isPaused ? <PlayIcon /> : <PauseIcon />}
          </div>
          <div
            class="control"
            title="Forward 5 seconds (D)"
            onClick={(event) => {
              event.stopPropagation()
              seekBy(+5_000)
            }}>
            <ForwardIcon />
          </div>
          <div
            class="control"
            title={state.isLooped ? "Disable loop" : "Loop"}
            onClick={(event) => {
              event.stopPropagation()
              toggleLoop()
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
              enterCinemaMode()
            }}>
            <NativeControlsIcon />
          </div>
          <div
            class="control"
            title={`${state.isPictureInPicture ? "Exit" : "Enter"} picture-in-picture (P)`}
            onClick={(event) => {
              event.stopPropagation()
              togglePictureInPicture()
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
              close()
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

function getValidPlaybackRate (current: number, adjustment: number): number {
  const chromeMinAllowedPlaybackRate = 0.1
  const chromeMaxAllowedPlaybackRate = 16
  return Math.min(chromeMaxAllowedPlaybackRate, Math.max(chromeMinAllowedPlaybackRate, current + adjustment))
}

function getValidSeekTime (totalDuration: number, currentTime: number, adjustment: number): number {
  return Math.min(totalDuration, Math.max(0, currentTime + adjustment))
}
