import { createEffect, createSignal, For, onCleanup } from "solid-js"
import { useSettings } from "../settings"
import contentCss from "./content.scss?inline" // read as transformed css string
import { Controller } from "./controller"
import { observeForVideoElements } from "./mutation-observer"
import { computeNewState } from "./state"

export function ControllersContainer () {

  const settings = useSettings()

  const [videoElements, setVideoElements] = createSignal(new Set(document.body.querySelectorAll("video")))

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
          isGloballyDisabled={settings.isDisabledOnThisDomain}
          shouldBringToFront={shouldBringToFront}
          setShouldBringToFront={setShouldBringToFront}
        />
      }}
    </For>
  </div>
}
