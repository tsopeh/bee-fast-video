import { useEffect } from "preact/hooks"

interface Props {
  videoEl: HTMLVideoElement | undefined
}

export const VideoControls = ({
  videoEl,
}: Props) => {

  useEffect(() => {
    const handlePlayback = (event: Event) => {
      console.log("video-king", "play", event)
    }
    videoEl?.addEventListener("play", handlePlayback)
    return () => {
      videoEl?.removeEventListener("play", handlePlayback)
    }
  }, [videoEl])

  // if (videoEl == null) {
  //   return null
  // }

  return <div>
    VIDEO_KING
  </div>
}