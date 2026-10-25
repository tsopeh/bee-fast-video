import { createEffect, createSignal, onCleanup, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { readTabSpeed } from "@/utils/tab-speed"
import { FIT_TO_VIEWPORT_STYLES, setImportantStyles } from "@/utils/video-styles"
import type { App } from "./controllers-container"
import { trackDrag } from "./drag"
import { Panel } from "./panel"
import { trackSavedTime } from "./saved-time"
import type { VideoLayout } from "./video-tracker"

/** Smallest size a video can be resized to. */
const MIN_RESIZE_PX = 100

/**
 * Everything the extension does to one video. The site settings (fit videos, remembered speed) and the tab's speed apply
 * to every video, a resized video keeps its size, and the time it saves counts for the popup. The panel only exists
 * while the video is in view and visible.
 */
export function Controller(props: { video: HTMLVideoElement; app: App }) {
  const { video, app } = props
  const [layout, setLayout] = createStore<VideoLayout>({ isEligible: false, left: 0, top: 0, right: 0, bottom: 0 })
  const [isClosed, setIsClosed] = createSignal(false)

  createEffect(() => {
    if (!isClosed()) {
      onCleanup(app.tracker.track(video, setLayout))
    }
  })

  // Also while the panel isn't shown, e.g. for a video playing out of view.
  onCleanup(trackSavedTime(video))

  // Limit the video to 80% of the window, when that's on for the site.
  createEffect(() => {
    if (app.settings.isFitVideosOnThisDomain()) {
      onCleanup(setImportantStyles(video, FIT_TO_VIEWPORT_STYLES))
    }
  })

  // The speed last set in this tab wins, then the site's remembered speed, else the site's own speed. Sites often reset
  // the speed when a new video starts, sometimes in the same `<video>` element (YouTube), so it's applied again when a
  // video loads or starts playing. A change of the remembered speed reaches every video right away. The tab's speed
  // doesn't, since keys and buttons change only one video; it waits for the next start.
  createEffect(() => {
    const rememberedSpeed = app.settings.rememberedSpeed()
    const apply = () => {
      const speed = readTabSpeed() ?? rememberedSpeed
      if (speed != null && video.playbackRate !== speed) {
        video.playbackRate = speed
      }
    }
    apply()
    const listeners = new AbortController()
    video.addEventListener("loadedmetadata", apply, { signal: listeners.signal })
    video.addEventListener("play", apply, { signal: listeners.signal })
    onCleanup(() => listeners.abort())
  })

  // Resizing changes the `<video>`, not the site's player around it. The new size stays when the panel closes or hides.
  // Double-clicking the handle, hiding the panel for the video, or turning the extension off for the site undoes it.
  let restoreSize: (() => void) | undefined
  const resetSize = () => {
    restoreSize?.()
    restoreSize = undefined
  }
  onCleanup(resetSize)
  const startResize = (event: PointerEvent, handle: HTMLElement) => {
    const { width, height } = video.getBoundingClientRect()
    trackDrag(handle, event, (dx, dy) => {
      const restore = setImportantStyles(video, {
        width: `${Math.max(MIN_RESIZE_PX, width + dx)}px`,
        height: `${Math.max(MIN_RESIZE_PX, height + dy)}px`,
      })
      // Only the first restore puts back the size from before resizing.
      restoreSize ??= restore
    })
  }

  return (
    <Show when={!isClosed() && layout.isEligible}>
      <Panel
        video={video}
        app={app}
        layout={layout}
        onClose={() => {
          resetSize()
          setIsClosed(true)
        }}
        onResizeStart={startResize}
        onResizeReset={resetSize}
      />
    </Show>
  )
}
