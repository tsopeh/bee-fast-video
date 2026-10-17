import { createEffect, createSignal, For, onCleanup } from "solid-js"
import { useSettings } from "@/utils/settings"
import { computeNewState } from "@/utils/video-set"
import { Controller } from "./controller"
import { observeForVideoElements } from "./mutation-observer"

export function ControllersContainer() {
  const settings = useSettings()

  const [videoElements, setVideoElements] = createSignal(new Set(document.body.querySelectorAll("video")))

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

  return (
    <For each={videosArray()}>
      {(videoEl) => {
        return <Controller videoEl={() => videoEl} isGloballyDisabled={settings.isDisabledOnThisDomain} />
      }}
    </For>
  )
}
