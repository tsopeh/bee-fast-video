import { createPortal, useEffect, useMemo, useState } from "preact/compat"
import { StateUpdater } from "preact/hooks"
import { BackwardIcon, ForwardIcon, NativeControlsIcon, PauseIcon, PictureInPictureIcon, PlayIcon, RemoveIcon, RepeatIcon, SlowDownIcon, SpeedUpIcon } from "../assets/img/control-icons"
import { KeyboardKey, keyboardListener } from "../shortcuts"
import cssRules from "./controller.scss?inline" // read as transformed css string
import { viewportIntersection } from "./intersection-observer"

interface Props {
  videoEl: HTMLVideoElement
  shouldBringToFront: boolean
  setShouldBringToFront: StateUpdater<boolean>
}

export const Controller = ({ videoEl, shouldBringToFront, setShouldBringToFront }: Props) => {
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null)
  const [isPaused, setIsPaused] = useState(() => videoEl.paused)
  const [isVideoInViewport, setIsVideoInViewport] = useState(false)
  const [isPictureInPicture, setIsPictureInPicture] = useState(() => document.pictureInPictureElement == videoEl)
  const [playbackRate, setPlaybackRate] = useState(videoEl.playbackRate)
  const [shouldShowMoreControls, setShouldShowMoreControls] = useState(false)
  const [position, setPosition] = useState(() => getControllerPosition(videoEl))
  const [isClosed, setIsClosed] = useState(false)

  const userActions = useMemo(() => {
    return {
      slowDown: () => {
        videoEl.playbackRate = getValidPlaybackRate(videoEl.playbackRate, -0.25)
      },
      speedUp: () => {
        videoEl.playbackRate = getValidPlaybackRate(videoEl.playbackRate, +0.25)
      },
      backward: () => {
        videoEl.currentTime = getValidSeekTime(videoEl.duration, videoEl.currentTime, -5)
      },
      forward: () => {
        videoEl.currentTime = getValidSeekTime(videoEl.duration, videoEl.currentTime, +5)
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
  }, [videoEl, isPaused, isPictureInPicture, setIsClosed])

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
    })
    styleMutationObserver.observe(videoEl, { childList: false, attributes: true, attributeFilter: ["style"] })

    return () => {
      videoEl.removeEventListener("play", onPlayPauseChange)
      videoEl.removeEventListener("pause", onPlayPauseChange)
      videoEl.removeEventListener("enterpictureinpicture", onPictureInPictureChange)
      videoEl.removeEventListener("leavepictureinpicture", onPictureInPictureChange)
      videoEl.removeEventListener("ratechange", onRateChange)
      unregister()
      styleMutationObserver.disconnect()
    }
  }, [videoEl])

  // React on keyboard events
  useEffect(() => {
    if (!isVideoInViewport) {
      return
    }
    const listeners = [
      keyboardListener.registerCallback(KeyboardKey.keyZ, () => {
        userActions.slowDown()
      }),
      keyboardListener.registerCallback(KeyboardKey.keyX, () => {
        userActions.speedUp()
      }),
      keyboardListener.registerCallback(KeyboardKey.keyA, () => {
        userActions.backward()
      }),
      keyboardListener.registerCallback(KeyboardKey.arrowLeft, () => {
        userActions.backward()
      }),
      keyboardListener.registerCallback(KeyboardKey.keyD, () => {
        userActions.forward()
      }),
      keyboardListener.registerCallback(KeyboardKey.arrowRight, () => {
        userActions.forward()
      }),
      keyboardListener.registerCallback(KeyboardKey.keyS, () => {
        userActions.togglePlayPause()
      }),
      // Number keys from 1 to 10
      ...Array.from({ length: 10 })
        .map((_, index) => index)
        .reduce((acc, _, index) => {
          const digitKey = `Digit${index}` as KeyboardKey
          const numpadKey = `Numpad${index}` as KeyboardKey
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
      keyboardListener.registerCallback(KeyboardKey.keyV, () => {
        userActions.toggleClose()
      }),
      keyboardListener.registerCallback(KeyboardKey.keyP, () => {
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
      videoEl.style.zIndex = `${2147483647 - 10}`
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
                  userActions.slowDown()
                }}>
                <SlowDownIcon />
              </div>
              <div
                className="control"
                title="Speed up (X)"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.speedUp()
                }}>
                <SpeedUpIcon />
              </div>
              <div
                className="control (A)"
                title="Backward 5 seconds"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.backward()
                }}>
                <BackwardIcon />
              </div>
              <div
                className="control"
                title="Play/Pause (S)"
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
                  userActions.forward()
                }}>
                <ForwardIcon />
              </div>
              <div
                className="control"
                title="Repeat"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.toggleLoop()
                }}>
                <RepeatIcon />
              </div>
              <div
                className="control"
                title="Enable native controls and bring to front"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.enterCinemaMode()
                }}>
                <NativeControlsIcon />
              </div>
              <div
                className="control"
                title="Picture-in-Picture (P)"
                onClick={(event) => {
                  event.stopPropagation()
                  userActions.togglePictureInPicture()
                }}>
                <PictureInPictureIcon />
              </div>
              <div
                className="control"
                title="Close"
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
