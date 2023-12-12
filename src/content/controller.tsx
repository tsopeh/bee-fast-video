import { useEffect, useState } from "preact/hooks"
import { viewportIntersection } from "./intersection-observer"

interface Props {
  videoEl: HTMLVideoElement
}

export const Controller = ({ videoEl }: Props) => {
  const [isPaused, setIsPaused] = useState(videoEl.paused)
  const [isVideoInViewport, setIsVideoInViewport] = useState(false)
  const [isPictureInPicture, setIsPictureInPicture] = useState(document.pictureInPictureElement == videoEl)
  const [position, setPosition] = useState(() => {
    return getElementPosition(videoEl)
  })

  useEffect(() => {
    const onPlayPauseChange = () => {
      console.log("paused", videoEl.paused)
      setIsPaused(videoEl.paused)
    }
    const updatePosition = () => {
      setPosition(getElementPosition(videoEl))
    }
    const onPictureInPictureChange = () => {
      setIsPictureInPicture(document.pictureInPictureElement == videoEl)
    }
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)
    videoEl.addEventListener("enterpictureinpicture", onPictureInPictureChange)
    videoEl.addEventListener("leavepictureinpicture", onPictureInPictureChange)

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
      unregister()
      styleMutationObserver.disconnect()
    }
  }, [])

  if (!isVideoInViewport) {
    return null
  }

  return <div
    className="controller"
    style={{
      top: position.top,
      left: position.left,
    }}>
    <div className="underlay"></div>
    <button onClick={(event) => {
      event.stopPropagation()
      if (isPaused) {
        videoEl.play()
      } else {
        videoEl.pause()
      }
    }}>{isPaused ? "Play" : "Pause"}</button>
    <button onClick={(event) => {
      if (isPictureInPicture) {
        document.exitPictureInPicture()
      } else {
        videoEl.disablePictureInPicture = false
        videoEl.requestPictureInPicture()
      }
    }}>pip
    </button>
  </div>
}

function getElementPosition (element: HTMLElement): { top: number, left: number } {
  const { x, y } = element.getBoundingClientRect()
  return {
    left: x + window.scrollX,
    top: y + window.scrollY,
  }
}