import { useEffect, useState } from "preact/hooks"
import { PauseIcon, PictureInPictureIcon, PlayIcon, RemoveIcon } from "../assets/img/control-icons"
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

  useEffect(() => {
    const onPlayPauseChange = () => {
      setIsPaused(videoEl.paused)
    }
    const updatePosition = () => {
      setPosition(getControllerPosition(videoEl))
    }
    const onPictureInPictureChange = () => {
      setIsPictureInPicture(document.pictureInPictureElement == videoEl)
    }
    const onRateChange = () => {
      setPlaybackRate(videoEl.playbackRate)
    }
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)
    videoEl.addEventListener("enterpictureinpicture", onPictureInPictureChange)
    videoEl.addEventListener("leavepictureinpicture", onPictureInPictureChange)
    videoEl.addEventListener("ratechange", onRateChange)

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
  }, [])

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
        onClick={() => {
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
            title="Toggle play/pause"
            onClick={(event) => {
              event.stopPropagation()
              if (isPaused) {
                videoEl.play()
              } else {
                videoEl.pause()
              }
            }}>
            {isPaused ? <PlayIcon/> : <PauseIcon/>}
          </div>
          <div
            className="control"
            title="Toggle picture-in-picture"
            onClick={(event) => {
              if (isPictureInPicture) {
                document.exitPictureInPicture()
              } else {
                videoEl.disablePictureInPicture = false
                videoEl.requestPictureInPicture()
              }
            }}>
            <PictureInPictureIcon/>
          </div>
          <div
            className="control"
            title="Close for this video"
            onClick={(event) => {
              setIsClosed(true)
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