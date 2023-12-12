import { useEffect, useState } from "preact/hooks"
import { viewportIntersection } from "./intersection-observer"

interface Props {
  videoEl: HTMLVideoElement
}

export const Controller = ({ videoEl }: Props) => {
  const [isPaused, setIsPaused] = useState(videoEl.paused)
  const [isVideoInViewport, setIsVideoInViewport] = useState(false)
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
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)

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
      unregister()
      styleMutationObserver.disconnect()
    }
  }, [])

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
  </div>
}

function getElementPosition (element: HTMLElement): { top: number, left: number } {
  const { x, y } = element.getBoundingClientRect()
  return {
    left: x + window.scrollX,
    top: y + window.scrollY,
  }
}