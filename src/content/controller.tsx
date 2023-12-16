import { useEffect, useMemo, useState } from "preact/hooks"
import { BackwardIcon, ForwardIcon, NativeControlsIcon, PauseIcon, PictureInPictureIcon, PlayIcon, RemoveIcon, RepeatIcon, SlowDownIcon, SpeedUpIcon } from "../assets/img/control-icons"
import { KeyboardKey, keyboardListener } from "../shortcuts"
import { viewportIntersection } from "./intersection-observer"

interface Props {
  videoEl: HTMLVideoElement
}

export const Controller = ({ videoEl }: Props) => {
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
        videoEl.playbackRate -= 0.25
      },
      speedUp: () => {
        videoEl.playbackRate += 0.25
      },
      backward: () => {
        videoEl.currentTime = Math.floor(videoEl.currentTime - 5)
      },
      forward: () => {
        videoEl.currentTime = Math.floor(videoEl.currentTime + 5)
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
      toggleCinemaMode: () => {
        videoEl.controls = true
        videoEl.style.zIndex = `${2147483647 - 1}`
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
  }, [videoEl, isPictureInPicture, setIsClosed])

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
      keyboardListener.registerCallback(KeyboardKey.keyS, () => {
        userActions.slowDown()
      }),
      keyboardListener.registerCallback(KeyboardKey.keyD, () => {
        userActions.speedUp()
      }),
      keyboardListener.registerCallback(KeyboardKey.keyZ, () => {
        userActions.backward()
      }),
      keyboardListener.registerCallback(KeyboardKey.arrowLeft, () => {
        userActions.backward()
      }),
      keyboardListener.registerCallback(KeyboardKey.keyX, () => {
        userActions.forward()
      }),
      keyboardListener.registerCallback(KeyboardKey.arrowRight, () => {
        userActions.forward()
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
  }, [userActions, isVideoInViewport])

  if (!isVideoInViewport || isClosed) {
    return null
  }

  return <div
    className="controller"
    style={{
      top: position.top,
      left: position.left,
    }}
  >
    <div className="underlay"></div>
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
            title="Slow down (S)"
            onClick={(event) => {
              event.stopPropagation()
              userActions.slowDown()
            }}>
            <SlowDownIcon/>
          </div>
          <div
            className="control"
            title="Speed up (D)"
            onClick={(event) => {
              event.stopPropagation()
              userActions.speedUp()
            }}>
            <SpeedUpIcon/>
          </div>
          <div
            className="control (Z)"
            title="Backward 5 seconds"
            onClick={(event) => {
              event.stopPropagation()
              userActions.backward()
            }}>
            <BackwardIcon/>
          </div>
          <div
            className="control"
            title="Forward 5 seconds (X)"
            onClick={(event) => {
              event.stopPropagation()
              userActions.forward()
            }}>
            <ForwardIcon/>
          </div>
          <div
            className="control"
            title="Play/Pause"
            onClick={(event) => {
              event.stopPropagation()
              userActions.togglePlayPause()
            }}>
            {isPaused ? <PlayIcon/> : <PauseIcon/>}
          </div>
          <div
            className="control"
            title="Repeat"
            onClick={(event) => {
              event.stopPropagation()
              userActions.toggleLoop()
            }}>
            <RepeatIcon/>
          </div>
          <div
            className="control"
            title="Enable native controls and bring to front"
            onClick={(event) => {
              event.stopPropagation()
              userActions.toggleCinemaMode()
            }}>
            <NativeControlsIcon/>
          </div>
          <div
            className="control"
            title="Picture-in-Picture"
            onClick={(event) => {
              event.stopPropagation()
              userActions.togglePictureInPicture()
            }}>
            <PictureInPictureIcon/>
          </div>
          <div
            className="control"
            title="Close"
            onClick={(event) => {
              event.stopPropagation()
              userActions.toggleClose()
            }}>
            <RemoveIcon/>
          </div>
        </>
      }
    </div>
  </div>
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