import { For, type JSX } from "solid-js"
import {
  BackwardIcon,
  BrainIcon,
  FitScreenIcon,
  ForwardIcon,
  GripIcon,
  PictureInPictureIcon,
  PlayIcon,
  RemoveIcon,
  RepeatIcon,
  SlowDownIcon,
  SpeedIcon,
  SpeedUpIcon,
  VolumeIcon,
} from "@/assets/control-icons"
import iconLarge from "@/assets/icon-large.png"
import { useSettings } from "@/utils/settings"

// Written by hand: keep in sync with `keyActions` in `shortcuts.ts` and the panel in `controller.tsx`.

const KEYS: Array<{ keys: Array<string>; action: string }> = [
  { keys: ["Z", "X"], action: "Slower, faster by 0.25 (Shift: 0.1)" },
  { keys: ["A", "D"], action: "Back, forward 5 s (Shift: 20 s)" },
  { keys: ["Q", "E"], action: "One frame back, forward" },
  { keys: ["S"], action: "Play, pause" },
  { keys: ["P"], action: "Picture-in-picture" },
  { keys: ["0", "9"], action: "Jump to 0% … 90%" },
]

const PANEL: Array<{ icons: () => JSX.Element; action: string }> = [
  { icons: () => <SpeedIcon />, action: "The speed. Click to open the panel, scroll to change, right-click to reset." },
  { icons: () => [<SlowDownIcon />, <SpeedUpIcon />], action: "Slower, faster" },
  { icons: () => [<BackwardIcon />, <PlayIcon />, <ForwardIcon />], action: "Back 5 s, play, forward 5 s" },
  { icons: () => <RepeatIcon />, action: "Loop" },
  { icons: () => <PictureInPictureIcon />, action: "Picture-in-picture" },
  { icons: () => <BrainIcon />, action: "Remember my speed on this site" },
  { icons: () => <FitScreenIcon />, action: "Fit videos on this site to 80% of the window" },
  { icons: () => <RemoveIcon />, action: "Hide the panel for this video" },
  {
    icons: () => <span class="chip-text">0:20</span>,
    action: "Time. Click for the time left. Scroll the seek bar to move 5 s.",
  },
  { icons: () => <VolumeIcon />, action: "Mute. Scroll the slider to change the volume." },
  { icons: () => <GripIcon />, action: "Drag to move the panel" },
  { icons: () => <span class="handle" />, action: "Drag the video's corner to resize it. Double-click to undo." },
]

export function Popup() {
  const { currentHostname, isDisabledOnThisDomain, toggleBlacklistHostName } = useSettings()

  return (
    <main>
      <header>
        <img class="logo" src={iconLarge} alt="" />
        <h1>Bee Fast Video</h1>
      </header>

      <label class="site" classList={{ off: isDisabledOnThisDomain() }}>
        <span class="site-text">
          <span class="site-state">{isDisabledOnThisDomain() ? "Off" : "On"} for</span>
          <span class="hostname">{currentHostname()}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          class="switch"
          checked={!isDisabledOnThisDomain()}
          aria-checked={!isDisabledOnThisDomain()}
          onChange={() => toggleBlacklistHostName()}
        />
      </label>

      <section>
        <h2>Keys</h2>
        <p class="hint">They act on the video under the mouse, or the main one. Not while you type.</p>
        <ul class="list">
          <For each={KEYS}>
            {(item) => (
              <li>
                <span class="keys">
                  <For each={item.keys}>{(key) => <kbd>{key}</kbd>}</For>
                </span>
                <span>{item.action}</span>
              </li>
            )}
          </For>
        </ul>
      </section>

      <section>
        <h2>Panel</h2>
        <ul class="list">
          <For each={PANEL}>
            {(item) => (
              <li>
                <span class="icons">{item.icons()}</span>
                <span>{item.action}</span>
              </li>
            )}
          </For>
        </ul>
      </section>
    </main>
  )
}
