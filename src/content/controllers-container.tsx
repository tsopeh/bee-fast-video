import { useEffect, useState } from "preact/compat"
import { Controller } from "./controller"
import { observeForVideoElements } from "./mutation-observer"
import { computeNewState } from "./state"

export const ControllersContainer = () => {

  const [videoElements, setVideoElements] = useState(() => {
    return new Set(document.body.querySelectorAll("video"))
  })

  const [shouldBringToFront, setShouldBringToFront] = useState(false)

  useEffect(() => {
    const { stopObserving } = observeForVideoElements({
      target: document.body,
      onMutation: (mutations) => {
        setVideoElements((prevState) => {
          const newState = computeNewState(prevState, mutations)
          // console.log("LATEST STATE", newState)
          return newState
        })
      },
    })
    return () => {
      stopObserving()
    }
  }, [])

  return <div>
    {
      Array.from(videoElements).map((videoEl) => {
        return <Controller
          videoEl={videoEl}
          key={videoEl.src}
          shouldBringToFront={shouldBringToFront}
          setShouldBringToFront={setShouldBringToFront}
        />
      })
    }
  </div>
}
