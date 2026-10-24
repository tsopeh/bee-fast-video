import { onCleanup, type ParentProps, Show } from "solid-js"
import { createStore } from "solid-js/store"
import {
  BackwardIcon,
  ForwardIcon,
  GripIcon,
  HideIcon,
  MutedIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  SlowDownIcon,
  SpeedUpIcon,
  VolumeIcon,
} from "@/assets/control-icons"
import { formatPlaybackRate, formatTime, timeLeftAtSpeed } from "@/utils/format-time"
import { adjustVolume, SEEK_STEP_MS, SPEED_STEP, seekBy, toggleLoop, togglePlayPause } from "@/utils/video-mutators"
import { onWheelStep } from "@/utils/wheel-stepper"
import type { App } from "./controllers-container"
import { trackDrag } from "./drag"
import { trackFrameDuration } from "./frame-duration"
import type { VideoLayout } from "./video-tracker"

/** How far inside the video's top left corner the panel sits. */
const PANEL_INSET_PX = 5
/** Minimum time between speed and seek steps while scrolling. One second of scrolling: speed 1.00 to 2.50, or ~30 s. */
const WHEEL_RATE_INTERVAL_MS = 175
/** Volume change per mouse wheel step on the volume slider. */
const WHEEL_VOLUME_STEP = 0.05
/** Minimum time between volume steps while scrolling. One second of scrolling changes the volume by ~55%. */
const WHEEL_VOLUME_INTERVAL_MS = 80

/** Events after which the video's state may have changed, whether by our controls, the page or the browser. */
const VIDEO_EVENTS = [
  "play",
  "pause",
  "ratechange",
  "volumechange",
  "timeupdate",
  "durationchange",
  "loadedmetadata",
  "progress",
  "seeked",
  "emptied",
]

function readVideo(video: HTMLVideoElement) {
  const { seekable } = video
  return {
    isPaused: video.paused,
    playbackRate: video.playbackRate,
    isLooped: video.loop,
    currentTime: video.currentTime,
    duration: video.duration,
    // End of the seekable range; the seek bar's maximum for live streams, whose `duration` is `Infinity`.
    seekableEnd: seekable.length > 0 ? seekable.end(seekable.length - 1) : 0,
    volume: video.volume,
    isMuted: video.muted,
  }
}

interface Props {
  video: HTMLVideoElement
  app: App
  layout: VideoLayout
  onClose: () => void
  onResizeStart: (event: PointerEvent, handle: HTMLElement) => void
  onResizeReset: () => void
}

/** The panel for one video, shown while the video is in view and visible. Starts collapsed each time it shows. */
export function Panel(props: Props) {
  const { video, app } = props
  const [state, setState] = createStore({
    ...readVideo(video),
    isExpanded: false,
    // Whether the time label shows the time until the end instead of the elapsed time.
    showRemainingTime: false,
    // Offset from the panel's place in the video's corner, set by dragging the grip.
    dragOffset: { x: 0, y: 0 },
  })

  // The store only notifies about values that changed, so reading everything on every event costs nothing extra.
  const sync = () => setState(readVideo(video))
  const listeners = new AbortController()
  for (const type of VIDEO_EVENTS) {
    video.addEventListener(type, sync, { signal: listeners.signal })
  }
  // `loop` is an attribute without an event.
  const loopObserver = new MutationObserver(sync)
  loopObserver.observe(video, { attributeFilter: ["loop"] })
  onCleanup(() => {
    listeners.abort()
    loopObserver.disconnect()
  })
  onCleanup(app.shortcuts.registerVideo(video))
  onCleanup(trackFrameDuration(video))

  // The seek bar's end. A live stream has no duration, only the part that can be seeked.
  const seekEnd = () => (Number.isFinite(state.duration) ? state.duration : state.seekableEnd)

  const startDrag = (event: PointerEvent & { currentTarget: HTMLDivElement }) => {
    // A copy: the store updates `dragOffset` in place.
    const start = { ...state.dragOffset }
    trackDrag(event.currentTarget, event, (dx, dy) => setState("dragOffset", { x: start.x + dx, y: start.y + dy }))
  }

  return (
    <>
      <div
        class="controller"
        classList={{ expanded: state.isExpanded }}
        tabIndex={-1}
        // The panel can sit outside its video, so pointer tracking alone may not attribute it to this video.
        on:pointerdown={() => app.shortcuts.markInteracted(video)}
        style={{
          left: `${props.layout.left + PANEL_INSET_PX + state.dragOffset.x}px`,
          top: `${props.layout.top + PANEL_INSET_PX + state.dragOffset.y}px`,
        }}
      >
        <div class="underlay" />
        <div class="controls">
          <div class="row">
            {/* First, so it stays in place when the panel opens and closes. */}
            <button
              type="button"
              class="control playback-rate"
              title={`Playback speed ${formatPlaybackRate(state.playbackRate)}×. Click to ${state.isExpanded ? "hide" : "show"} controls, scroll to change, right-click to reset to 1.00.`}
              on:click={() => setState("isExpanded", !state.isExpanded)}
              on:contextmenu={(event) => {
                event.preventDefault()
                app.setSpeed(video, 1)
              }}
              on:wheel={onWheelStep(WHEEL_RATE_INTERVAL_MS, (step) => app.adjustSpeed(video, step * SPEED_STEP))}
            >
              <span>{formatPlaybackRate(state.playbackRate)}</span>
            </button>
            <Show when={state.isExpanded}>
              <ControlButton title="Slow down (Z)" onClick={() => app.adjustSpeed(video, -SPEED_STEP)}>
                <SlowDownIcon />
              </ControlButton>
              <ControlButton title="Speed up (X)" onClick={() => app.adjustSpeed(video, +SPEED_STEP)}>
                <SpeedUpIcon />
              </ControlButton>
              <span class="divider" />
              <ControlButton title="Rewind 5 seconds (A)" onClick={() => seekBy(video, -SEEK_STEP_MS)}>
                <BackwardIcon />
              </ControlButton>
              <ControlButton title={`${state.isPaused ? "Play" : "Pause"} (S)`} onClick={() => togglePlayPause(video)}>
                {state.isPaused ? <PlayIcon /> : <PauseIcon />}
              </ControlButton>
              <ControlButton title="Fast forward 5 seconds (D)" onClick={() => seekBy(video, +SEEK_STEP_MS)}>
                <ForwardIcon />
              </ControlButton>
              <span class="divider" />
              <ControlButton
                title={state.isLooped ? "Disable loop" : "Loop"}
                active={state.isLooped}
                onClick={() => toggleLoop(video)}
              >
                <RepeatIcon />
              </ControlButton>
              <span class="divider" />
              <ControlButton title="Hide controls for this video" onClick={() => props.onClose()}>
                <HideIcon />
              </ControlButton>
            </Show>
          </div>
          <Show when={state.isExpanded}>
            <div class="row player-row">
              <input
                class="seek"
                type="range"
                title="Seek (scroll to rewind or fast forward 5 seconds)"
                min={0}
                max={seekEnd()}
                step="any"
                value={state.currentTime}
                style={{ "--progress": seekEnd() > 0 ? Math.min(state.currentTime / seekEnd(), 1) : 0 }}
                on:input={(event) => {
                  video.currentTime = event.currentTarget.valueAsNumber
                }}
                on:wheel={onWheelStep(WHEEL_RATE_INTERVAL_MS, (step) => seekBy(video, step * SEEK_STEP_MS))}
              />
              <ControlButton
                class="time"
                title={
                  state.showRemainingTime
                    ? `Time until the end at ${formatPlaybackRate(state.playbackRate)}×. Click to show the elapsed time.`
                    : "Elapsed time. Click to show the time until the end."
                }
                disabled={!Number.isFinite(state.duration)}
                onClick={() => setState("showRemainingTime", !state.showRemainingTime)}
              >
                {Number.isFinite(state.duration)
                  ? formatTime(
                      state.showRemainingTime
                        ? timeLeftAtSpeed(state.duration - state.currentTime, state.playbackRate)
                        : state.currentTime,
                    )
                  : state.duration === Number.POSITIVE_INFINITY
                    ? "LIVE"
                    : formatTime(state.currentTime)}
              </ControlButton>
              <ControlButton
                title={state.isMuted ? "Unmute" : "Mute"}
                onClick={() => {
                  video.muted = !video.muted
                }}
              >
                {state.isMuted || state.volume === 0 ? <MutedIcon /> : <VolumeIcon />}
              </ControlButton>
              <input
                class="volume"
                type="range"
                title="Volume (scroll to change)"
                min={0}
                max={1}
                step={0.05}
                value={state.isMuted ? 0 : state.volume}
                style={{ "--progress": state.isMuted ? 0 : state.volume }}
                on:input={(event) => {
                  video.volume = event.currentTarget.valueAsNumber
                  video.muted = false
                }}
                on:wheel={onWheelStep(WHEEL_VOLUME_INTERVAL_MS, (step) =>
                  adjustVolume(video, step * WHEEL_VOLUME_STEP),
                )}
              />
              {/* A row away from the hide button, so a drag that starts a little off doesn't hide the panel. */}
              <div class="grip" title="Drag to move" on:pointerdown={startDrag}>
                <GripIcon />
              </div>
            </div>
          </Show>
        </div>
      </div>
      <Show when={state.isExpanded}>
        <button
          type="button"
          class="resize-handle"
          title="Drag to resize, double-click to reset"
          style={{ left: `${props.layout.right}px`, top: `${props.layout.bottom}px` }}
          on:pointerdown={(event) => props.onResizeStart(event, event.currentTarget)}
          on:dblclick={() => props.onResizeReset()}
        />
      </Show>
    </>
  )
}

function ControlButton(
  props: ParentProps<{ title: string; onClick: () => void; active?: boolean; disabled?: boolean; class?: string }>,
) {
  return (
    <button
      type="button"
      class={props.class == null ? "control" : `control ${props.class}`}
      classList={{ active: props.active }}
      title={props.title}
      disabled={props.disabled}
      on:click={() => props.onClick()}
    >
      {props.children}
    </button>
  )
}
