import { useEffect, useState } from "preact/hooks"
import { Observable } from "./observable"

interface Props {
  outsideStateChanges: Observable<Array<HTMLVideoElement>>
}

export const ControllersContainer = ({
  outsideStateChanges,
}: Props) => {

  const [videoElements, setVideoElements] = useState<Array<HTMLVideoElement>>([])

  useEffect(() => {
    const handleStateChange = (videos: Array<HTMLVideoElement>) => {
      setVideoElements(videos)
    }
    outsideStateChanges.subscribe(handleStateChange)
    return () => {
      outsideStateChanges.unsubscribe(handleStateChange)
    }
  }, [outsideStateChanges])

  return <div>
    {
      videoElements.map((videoEl, index) => {
        return index
      })
    }
  </div>
}