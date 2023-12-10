import { useEffect, useState } from "preact/hooks"
import { observeForVideoElements } from "./mutation-observer"
import { computeNewState } from "./state"

export const ControllersContainer = () => {

  const [videoElements, setVideoElements] = useState(new Set<HTMLVideoElement>())

  useEffect(() => {
    const { stopObserving } = observeForVideoElements({
      target: document.body,
      onMutation: (mutations) => {
        setVideoElements((prevState) => {
          return computeNewState(prevState, mutations)
        })
      },
    })
    return () => {
      stopObserving()
    }
  }, [])

  return <div>
    {
      Array.from(videoElements).map((videoEl, index) => {
        return index
      })
    }
  </div>
}