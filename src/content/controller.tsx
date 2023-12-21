import { createPortal, useEffect, useMemo, useState } from "preact/compat"
import { StateUpdater } from "preact/hooks"
import { BackwardIcon, ForwardIcon, NativeControlsIcon, PauseIcon, PictureInPictureIcon, PlayIcon, RemoveIcon, RepeatIcon, SlashIcon, SlowDownIcon, SpeedUpIcon } from "../assets/img/control-icons"
import { keyboardListener } from "../shortcuts"
import cssRules from "./controller.scss?inline" // read as transformed css string
import { viewportIntersection } from "./intersection-observer"

interface Props {
  videoEl: HTMLVideoElement
  shouldBringToFront: boolean
  setShouldBringToFront: StateUpdater<boolean>
}

export const Controller = ({ videoEl, shouldBringToFront, setShouldBringToFront }: Props) => {
  const [shouldShowMoreControls, setShouldShowMoreControls] = useState(false)
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null)
  const [isVideoInViewport, setIsVideoInViewport] = useState(false)
  const [position, setPosition] = useState(() => getControllerPosition(videoEl))
  const [playbackRate, setPlaybackRate] = useState(videoEl.playbackRate)
  const [isPaused, setIsPaused] = useState(() => videoEl.paused)
  const [isLooped, setIsLooped] = useState(() => videoEl.loop)
  const [isPictureInPicture, setIsPictureInPicture] = useState(() => document.pictureInPictureElement == videoEl)
  const [isClosed, setIsClosed] = useState(false)

  const userActions = useMemo(() => {
    return {
      adjustPlaybackRate: (adjustment: number) => {
        videoEl.playbackRate = getValidPlaybackRate(videoEl.playbackRate, adjustment)
      },
      seekBy: (seekMs: number) => {
        const seekSeconds = seekMs / 1000
        videoEl.currentTime = getValidSeekTime(videoEl.duration, videoEl.currentTime, seekSeconds)
      },
      seekToNormalized: (normalized: number) => {
        if (normalized >= 0 && normalized <= 1) {
          videoEl.currentTime = Math.round(videoEl.duration * normalized)
        }
      },
      togglePlayPause: () => {
        if (isPaused) {
          videoEl.play()
        } else {
          videoEl.pause()
        }
      },
      toggleLoop: () => {
        videoEl.loop = !videoEl.loop
        setIsLooped(videoEl.loop)
      },
      enterCinemaMode: () => {
        setShouldBringToFront(true)
      },
      togglePictureInPicture: () => {
        if (isPictureInPicture) {
          document.exitPictureInPicture()
        } else {
          videoEl.disablePictureInPicture = false
          videoEl.requestPictureInPicture()
        }
      },
      toggleClose: () => {
        setIsClosed((isClosed) => !isClosed)
      },
    }
  }, [videoEl, isPaused, setShouldBringToFront, isPictureInPicture])

  // React on video events
  useEffect(() => {
    const onPlayPauseChange = () => {
      setIsPaused(videoEl.paused)
    }
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)

    const onPictureInPictureChange = () => {
      setIsPictureInPicture(document.pictureInPictureElement == videoEl)
    }
    videoEl.addEventListener("enterpictureinpicture", onPictureInPictureChange)
    videoEl.addEventListener("leavepictureinpicture", onPictureInPictureChange)

    const onRateChange = () => {
      setPlaybackRate(videoEl.playbackRate)
    }
    videoEl.addEventListener("ratechange", onRateChange)

    const updatePosition = () => {
      setPosition(getControllerPosition(videoEl))
    }
    const unregister = viewportIntersection.register(videoEl, (entry) => {
      updatePosition()
      setIsVideoInViewport(entry.isIntersecting)
    })
    // Track position change
    const styleMutationObserver = new MutationObserver(() => {
      updatePosition()
      setIsLooped(videoEl.loop)
      const shouldForceControls = shouldBringToFront && !videoEl.controls
      if (shouldForceControls) {
        videoEl.controls = true
      }
    })
    styleMutationObserver.observe(videoEl, { childList: false, attributes: true, attributeFilter: ["style", "loop", "controls"] })

    return () => {
      videoEl.removeEventListener("play", onPlayPauseChange)
      videoEl.removeEventListener("pause", onPlayPauseChange)
      videoEl.removeEventListener("enterpictureinpicture", onPictureInPictureChange)
      videoEl.removeEventListener("leavepictureinpicture", onPictureInPictureChange)
      videoEl.removeEventListener("ratechange", onRateChange)
      unregister()
      styleMutationObserver.disconnect()
    }
  }, [shouldBringToFront, videoEl])

  // React on keyboard events
  useEffect(() => {
    if (!isVideoInViewport) {
      return
    }
    const listeners = [
      keyboardListener.registerCallback("z", () => {
        userActions.adjustPlaybackRate(-0.5)
      }),
      keyboardListener.registerCallback("Z", () => {
        userActions.adjustPlaybackRate(-0.1)
      }),
      keyboardListener.registerCallback("x", () => {
        userActions.adjustPlaybackRate(+0.5)
      }),
      keyboardListener.registerCallback("X", () => {
        userActions.adjustPlaybackRate(+0.1)
      }),
      keyboardListener.registerCallback("a", () => {
        userActions.seekBy(-5_000)
      }),
      keyboardListener.registerCallback("A", () => {
        userActions.seekBy(-20_000)
      }),
      keyboardListener.registerCallback("ArrowLeft", () => {
        userActions.seekBy(-5_000)
      }),
      keyboardListener.registerCallback("d", () => {
        userActions.seekBy(+5_000)
      }),
      keyboardListener.registerCallback("D", () => {
        userActions.seekBy(+20_000)
      }),
      keyboardListener.registerCallback("ArrowRight", () => {
        userActions.seekBy(+5_000)
      }),
      keyboardListener.registerCallback("s", () => {
        userActions.togglePlayPause()
      }),
      // Number keys from 1 to 10
      ...Array.from({ length: 10 })
        .map((_, index) => index)
        .reduce((acc, _, index) => {
          const digitKey = `Digit${index}`
          const numpadKey = `Numpad${index}`
          const normalized = index / 10
          acc.push(
            keyboardListener.registerCallback(digitKey, () => {
              userActions.seekToNormalized(normalized)
            }),
            keyboardListener.registerCallback(numpadKey, () => {
              userActions.seekToNormalized(normalized)
            }),
          )
          return acc
        }, [] as Array<{ unregisterCallback: () => void }>),
      keyboardListener.registerCallback("v", () => {
        userActions.toggleClose()
      }),
      keyboardListener.registerCallback("p", () => {
        userActions.togglePictureInPicture()
      }),
    ]
    return () => {
      listeners.forEach(l => l.unregisterCallback())
    }
  }, [isVideoInViewport, userActions])

  useEffect(() => {
    const onFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement as HTMLElement | null
      console.log("fullscreenElement", fullscreenElement)
      const isOutOfFullScreen = fullscreenElement == null
      const isHtmlInFullScreen = fullscreenElement == document.documentElement
      const isBodyInFullScreen = fullscreenElement == document.body
      const isVideoElementInFullScreen = fullscreenElement == videoEl
      const isVideoElementParentInFullScreen = fullscreenElement?.contains(videoEl) ?? false
      if (
        isOutOfFullScreen
        || isHtmlInFullScreen
        || isBodyInFullScreen
        || isVideoElementInFullScreen
        || !isVideoElementParentInFullScreen
      ) {
        setParentElement(null)
      } else {
        setParentElement(fullscreenElement)
      }

    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
    }
  }, [videoEl])

  useEffect(() => {
    if (shouldBringToFront) {
      const shouldSetDifferentPosition =
        videoEl.style.position == null
        || videoEl.style.position == ""
        || videoEl.style.position == "static"
      if (shouldSetDifferentPosition) {
        videoEl.style.position = "relative"
      }
      videoEl.style.zIndex = `${2147483647 - 10}` // max_int - 10
      videoEl.controls = true
    }
  }, [videoEl, shouldBringToFront])

  if (!isVideoInViewport || isClosed) {
    return null
  }

  const ui = (
    <>
      <style>{cssRules}</style>
      <div
        className="controller"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className="underlay" />
        <div
          className="controls"
        >
          <div
            className="control playback-rate"
            title="Video speed"
            onClick={(event) => {
              event.stopPropagation()
              setShouldShowMoreControls((shouldShow) => !shouldShow)
            }}
          >
            <span>{playbackRate.toFixed(2)}</span>
          </div>
          {!shouldShowMoreControls
            ? null
            : <>
              <div
                className="control"
                title="Slow down (Z)"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.adjustPlaybackRate(-0.25)
                }}>
                <SlowDownIcon />
              </div>
              <div
                className="control"
                title="Speed up (X)"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.adjustPlaybackRate(+0.25)
                }}>
                <SpeedUpIcon />
              </div>
              <div
                className="control (A)"
                title="Backward 5 seconds"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.seekBy(-5_000)
                }}>
                <BackwardIcon />
              </div>
              <div
                className="control"
                title={`${isPaused ? "Play" : "Pause"} (S)`}
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.togglePlayPause()
                }}>
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </div>
              <div
                className="control"
                title="Forward 5 seconds (D)"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.seekBy(+5_000)
                }}>
                <ForwardIcon />
              </div>
              <div
                className="control"
                title={isLooped ? "Disable loop" : "Loop"}
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.toggleLoop()
                }}>
                {
                  isLooped ?
                    <SlashIcon>
                      <RepeatIcon />
                    </SlashIcon>
                    : <RepeatIcon />
                }

              </div>
              <div
                className={`control ${shouldBringToFront ? "locked" : ""}`}
                title={
                  shouldBringToFront
                    ? "Reload the page to disable it!"
                    : "Enable native controls and bring to front all videos on this page."
                }
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.enterCinemaMode()
                }}>
                <NativeControlsIcon />
              </div>
              <div
                className="control"
                title={`${isPictureInPicture ? "Exit" : "Enter"} picture-in-picture (P)`}
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.togglePictureInPicture()
                }}>{
                isPictureInPicture
                  ? <SlashIcon>
                    <PictureInPictureIcon />
                  </SlashIcon>
                  : <PictureInPictureIcon />
              }
              </div>
              <div
                className="control"
                title="Toggle close (v)"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.toggleClose()
                }}>
                <RemoveIcon />
              </div>
            </>
          }
        </div>
      </div>
    </>

  )

  return parentElement != null
    ? createPortal(ui, parentElement)
    : ui
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
  const chromeMinAllowedPlaybackRate = 0
  const chromeMaxAllowedPlaybackRate = 16
  return Math.min(chromeMaxAllowedPlaybackRate, Math.max(chromeMinAllowedPlaybackRate, current + adjustment))
}

function getValidSeekTime (totalDuration: number, currentTime: number, adjustment: number): number {
  return Math.min(totalDuration, Math.max(0, currentTime + adjustment))
}
