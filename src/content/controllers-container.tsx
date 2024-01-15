import { useEffect, useState } from "preact/compat"
import { keyboardListener } from "./shortcuts"
import contentCss from "./content.scss?inline" // read as transformed css string
import { Controller } from "./controller"
import { observeForVideoElements } from "./mutation-observer"
import { computeNewState } from "./state"

export const ControllersContainer = () => {

  const [videoElements, setVideoElements] = useState(() => {
    return new Set(document.body.querySelectorAll("video"))
  })

  const [isGloballyDisabled, setIsGloballyDisabled] = useState(false)
  useEffect(() => {
    const unregisterKeyboardFns = [
      keyboardListener.registerCallback("b", () => {
        setIsGloballyDisabled((prevState) => !prevState)
      }),
      keyboardListener.registerCallback("B", () => {
        setIsGloballyDisabled((prevState) => !prevState)
      }),
    ]
    return () => {
      unregisterKeyboardFns.forEach(({ unregisterCallback }) => {unregisterCallback()})
    }
  }, [])

  const [shouldBringToFront, setShouldBringToFront] = useState(false)
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
    <style>{contentCss}</style>
    {
      Array.from(videoElements).map((videoEl) => {
        return <Controller
          videoEl={videoEl}
          key={videoEl}
          isGloballyDisabled={isGloballyDisabled}
          shouldBringToFront={shouldBringToFront}
          setShouldBringToFront={setShouldBringToFront}
        />
      })
    }
  </div>
}
