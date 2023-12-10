import { useEffect, useState } from "preact/hooks"

interface Props {
  videoEl: HTMLVideoElement
}

export const Controller = ({ videoEl }: Props) => {

  const [isPaused, setIsPaused] = useState(videoEl.paused)

  useEffect(() => {
    const onPlayPauseChange = (event: Event) => {
      console.log("paused", videoEl.paused)
      setIsPaused(videoEl.paused)
    }
    videoEl.addEventListener("play", onPlayPauseChange)
    videoEl.addEventListener("pause", onPlayPauseChange)

    return () => {
      videoEl.removeEventListener("play", onPlayPauseChange)
      videoEl.removeEventListener("pause", onPlayPauseChange)
    }
  }, [])

  return <div>
    <div><span>Is paused</span> - <span>{String(isPaused)}</span></div>
  </div>
}