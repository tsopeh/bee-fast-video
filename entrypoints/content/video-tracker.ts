import { batch, onCleanup } from "solid-js"
import { isVideoVisibleEnough } from "@/utils/video-visibility"

/** Where a video is, relative to the host (see `host.ts`), and whether it can have a panel. */
export interface VideoLayout {
  /** In view, visible and big enough (see `isVideoVisibleEnough`). */
  isEligible: boolean
  left: number
  top: number
  right: number
  bottom: number
}

export type VideoTracker = ReturnType<typeof createVideoTracker>

/**
 * Follows where the tracked videos are and whether they can have a panel, for all videos at once. Anything that may
 * move, resize or hide a video schedules one pass on the next frame. The pass first reads every video in view, then
 * updates all panels together, so the page lays out once per frame however many videos there are. Videos out of view
 * cost nothing, and while no video is in view nothing runs at all, not even the timer.
 *
 * What triggers a pass: a video entering the view, a video changing size, any scroll (also inside scroll areas, which
 * move videos relative to the page), the window resizing, fullscreen changes (the host moves, see `host.ts`), and a 1 s
 * timer for moves nothing reports, like a layout change above the video.
 */
export function createVideoTracker(host: HTMLElement) {
  const tracked = new Map<HTMLVideoElement, (layout: Partial<VideoLayout>) => void>()
  const inView = new Set<HTMLVideoElement>()

  let frame: number | undefined
  const schedule = () => {
    if (inView.size > 0) {
      frame ??= requestAnimationFrame(update)
    }
  }
  const update = () => {
    frame = undefined
    if (inView.size === 0) {
      return
    }
    const origin = host.getBoundingClientRect()
    const layouts = [...inView].map((video): [HTMLVideoElement, VideoLayout] => {
      const rect = video.getBoundingClientRect()
      return [
        video,
        {
          isEligible: isVideoVisibleEnough(video, rect),
          left: rect.left - origin.left,
          top: rect.top - origin.top,
          right: rect.right - origin.left,
          bottom: rect.bottom - origin.top,
        },
      ]
    })
    batch(() => {
      for (const [video, layout] of layouts) {
        tracked.get(video)?.(layout)
      }
    })
  }

  let intervalId: ReturnType<typeof setInterval> | undefined
  const updateTimer = () => {
    if (inView.size > 0) {
      intervalId ??= setInterval(schedule, 1000)
    } else {
      clearInterval(intervalId)
      intervalId = undefined
    }
  }

  const intersectionObserver = new IntersectionObserver((entries) => {
    batch(() => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement
        const onChange = tracked.get(video)
        if (onChange == null) {
          continue
        }
        if (entry.isIntersecting) {
          inView.add(video)
        } else {
          inView.delete(video)
          onChange({ isEligible: false })
        }
      }
    })
    updateTimer()
    schedule()
  })
  const resizeObserver = new ResizeObserver(schedule)
  const listeners = new AbortController()
  const { signal } = listeners
  document.addEventListener("scroll", schedule, { capture: true, passive: true, signal })
  document.addEventListener("fullscreenchange", schedule, { signal })
  window.addEventListener("resize", schedule, { passive: true, signal })
  onCleanup(() => {
    intersectionObserver.disconnect()
    resizeObserver.disconnect()
    listeners.abort()
    clearInterval(intervalId)
    if (frame != null) {
      cancelAnimationFrame(frame)
    }
  })

  return {
    /** Calls `onChange` with the video's layout whenever it may have changed. Returns a function that stops it. */
    track: (video: HTMLVideoElement, onChange: (layout: Partial<VideoLayout>) => void) => {
      tracked.set(video, onChange)
      intersectionObserver.observe(video)
      resizeObserver.observe(video)
      return () => {
        tracked.delete(video)
        inView.delete(video)
        intersectionObserver.unobserve(video)
        resizeObserver.unobserve(video)
        updateTimer()
      }
    },
  }
}
