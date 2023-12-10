import { useEffect, useState } from "preact/hooks"
import { viewportIntersection } from "./intersection-observer"

interface Props {
  videoEl: HTMLVideoElement
}

export const Controller = ({ videoEl }: Props) => {

  const [isPaused, setIsPaused] = useState(videoEl.paused)
  const [position, setPosition] = useState({ top: -999, left: -999 })

  useEffect(() => {
    const onPlayPauseChange = (event: Event) => {
      console.log("paused", videoEl.paused)
      setIsPaused(videoEl.paused)
    }
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)

    const { x, y } = videoEl.getBoundingClientRect()
    setPosition({ left: x, top: y })

    // Track position change
    const styleMutationObserver = new MutationObserver((mutations) => {
      setPosition((prevPosition) => {
        return prevPosition
      })
    })
    styleMutationObserver.observe(videoEl, { childList: false, attributes: true, attributeFilter: ["style"] })

    viewportIntersection.register(videoEl, (_) => {
      const { x, y } = videoEl.getBoundingClientRect()
      setPosition(prevPosition => {
        const didChangePosition = prevPosition.left != x || prevPosition.top != y
        return didChangePosition
          ? { left: x, top: y }
          : prevPosition
      })
    })

    return () => {
      styleMutationObserver.disconnect()
      videoEl.removeEventListener("play", onPlayPauseChange)
      videoEl.removeEventListener("pause", onPlayPauseChange)
      viewportIntersection.unregister(videoEl)
    }
  }, [])

  return <div
    className="controller"
    style={{
      position: "fixed",
      top: position.top,
      left: position.left,
    }}>
    <div><span>Is paused</span> - <span>{String(isPaused)}</span></div>
  </div>
}