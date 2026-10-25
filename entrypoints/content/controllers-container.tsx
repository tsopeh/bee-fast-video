import { createSignal, For, onCleanup, Show } from "solid-js"
import { browser } from "#imports"
import { isGetSpeed, type Settings, useSettings } from "@/utils/settings"
import { writeTabSpeed } from "@/utils/tab-speed"
import { adjustedPlaybackRate } from "@/utils/video-mutators"
import { watchVideos } from "@/utils/video-set"
import { Controller } from "./controller"
import { createKeyboardShortcuts, type KeyboardShortcuts } from "./shortcuts"
import { createVideoTracker, type VideoTracker } from "./video-tracker"

/** What every controller shares. */
export interface App {
  settings: Settings
  shortcuts: KeyboardShortcuts
  tracker: VideoTracker
  setSpeed: (video: HTMLVideoElement, rate: number) => void
  adjustSpeed: (video: HTMLVideoElement, adjustment: number) => void
}

export function ControllersContainer(props: { host: HTMLElement }) {
  const settings = useSettings()

  // The only way the user changes the speed: the panel's buttons, scrolling, right-click and keys. Only these changes
  // are remembered, not the ones the site makes, e.g. Twitch nudging the speed to catch up with a live stream.
  const setSpeed = (video: HTMLVideoElement, rate: number) => {
    video.playbackRate = rate
    writeTabSpeed(video.playbackRate)
    if (settings.rememberedSpeed() != null) {
      settings.updateRememberedSpeed(video.playbackRate)
    }
  }
  const adjustSpeed = (video: HTMLVideoElement, adjustment: number) =>
    setSpeed(video, adjustedPlaybackRate(video.playbackRate, adjustment))

  const app: App = {
    settings,
    shortcuts: createKeyboardShortcuts(settings.keys, settings.steps, adjustSpeed),
    tracker: createVideoTracker(props.host),
    setSpeed,
    adjustSpeed,
  }

  // Frames without a shown panel stay quiet, so the popup gets the answer from the frame that has one.
  const onMessage = (message: unknown, _sender: unknown, sendResponse: (speed: number) => void) => {
    const video = isGetSpeed(message) ? app.shortcuts.targetVideo() : undefined
    if (video != null) {
      sendResponse(video.playbackRate)
    }
  }
  browser.runtime.onMessage.addListener(onMessage)
  onCleanup(() => browser.runtime.onMessage.removeListener(onMessage))

  const [videos, setVideos] = createSignal(new Set<HTMLVideoElement>())
  onCleanup(watchVideos(document.body, setVideos))

  return (
    // Turning the extension off for the site removes all controllers, and their cleanup undoes every change they made
    // to the videos. Waiting for the settings keeps panels from flashing on sites where the extension is off.
    <Show when={settings.isLoaded() && !settings.isDisabledOnThisDomain()}>
      <For each={[...videos()]}>{(video) => <Controller video={video} app={app} />}</For>
    </Show>
  )
}
