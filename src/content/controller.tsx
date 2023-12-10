import { useEffect, useState } from "preact/hooks"
import { viewportIntersection } from "./intersection-observer"

interface Props {
  videoEl: HTMLVideoElement
}

export const Controller = ({ videoEl }: Props) => {
  const [isPaused, setIsPaused] = useState(videoEl.paused)
  const [isVideoInViewport, setIsVideoInViewport] = useState(false)
  const [zIndex, setZIndex] = useState<number>(() => {
    return getZIndexOfElement(videoEl) + 1
  })
  const [position, setPosition] = useState(() => {
    const { x, y } = videoEl.getBoundingClientRect()
    return { left: x, top: y }
  })

  useEffect(() => {
    const onPlayPauseChange = () => {
      console.log("paused", videoEl.paused)
      setIsPaused(videoEl.paused)
    }
    const updatePosition = () => {
      const { x, y } = videoEl.getBoundingClientRect()
      setPosition(prevPosition => {
        const didChangePosition = prevPosition.left != x || prevPosition.top != y
        return didChangePosition
          ? { left: x, top: y }
          : prevPosition
      })
    }
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)

    const unregister = viewportIntersection.register(videoEl, (entry) => {
      updatePosition()
      setIsVideoInViewport(entry.intersectionRatio > 0)
    })

    // Track position change
    const styleMutationObserver = new MutationObserver(() => {
      updatePosition()
      setZIndex(getZIndexOfElement(videoEl) + 1)
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
      zIndex: zIndex,
    }}>
    <div className="underlay"></div>
    <div><span>Is paused</span><span> - </span><span>{String(isPaused)}</span></div>
  </div>
}

function getZIndexOfElement (element: HTMLElement): number {
  const parsed = Math.floor(parseFloat(window.getComputedStyle(element).getPropertyValue("z-index")))
  return Number.isNaN(parsed) ? 0 : parsed
}