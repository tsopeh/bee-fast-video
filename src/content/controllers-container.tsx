import { createEffect, createSignal, For, onCleanup } from "solid-js"
import contentCss from "./content.scss?inline" // read as transformed css string
import { Controller } from "./controller"
import { observeForVideoElements } from "./mutation-observer"
import { keyboardListener } from "./shortcuts"
import { computeNewState } from "./state"

export function ControllersContainer () {

  const [videoElements, setVideoElements] = createSignal(new Set(document.body.querySelectorAll("video")))

  const [isGloballyDisabled, setIsGloballyDisabled] = createSignal(false)
  createEffect(() => {
    const unregisterKeyboardFns = [
      keyboardListener.registerCallback("b", () => {
        setIsGloballyDisabled((prevState) => !prevState)
      }),
      keyboardListener.registerCallback("B", () => {
        setIsGloballyDisabled((prevState) => !prevState)
      }),
    ]
    onCleanup(() => {
      unregisterKeyboardFns.forEach(({ unregisterCallback }) => {unregisterCallback()})
    })
  })

  const [shouldBringToFront, setShouldBringToFront] = createSignal(false)
  createEffect(() => {
    const { stopObserving } = observeForVideoElements({
      target: document.body,
      onMutation: (mutations) => {
        setVideoElements((prevState) => {
          return computeNewState(prevState, mutations)
        })
      },
    })

    onCleanup(() => {
      stopObserving()
    })
  })

  const videosArray = () => {
    return Array.from(videoElements()) as Array<HTMLVideoElement>
  }

  return <div>
    <style>{contentCss}</style>
    <For each={videosArray()}>
      {(videoEl) => {
        return <Controller
          videoEl={() => videoEl}
          isGloballyDisabled={isGloballyDisabled}
          shouldBringToFront={shouldBringToFront}
          setShouldBringToFront={setShouldBringToFront}
        />
      }}
    </For>
  </div>
}
