import { For, type JSX, type ParentProps, Show } from "solid-js"
import { browser } from "#imports"
import { BrainIcon, FitScreenIcon, GripIcon, HideIcon } from "@/assets/control-icons"
import iconLarge from "@/assets/icon-large.png"
import { formatHours, formatPlaybackRate } from "@/utils/format-time"
import { GET_SPEED, useSettings, useTotalSavedSeconds } from "@/utils/settings"

// Written by hand: keep in sync with `keyActions` in `shortcuts.ts` and the panel in `panel.tsx`. Only what the panel
// doesn't show by itself; its buttons have tooltips.

const KEYS: Array<{ keys: Array<string>; action: string }> = [
  { keys: ["Z", "X"], action: "Slower, faster" },
  { keys: ["A", "D"], action: "Back, forward 5 s" },
  { keys: ["Q", "E"], action: "Frame back, forward" },
  { keys: ["S"], action: "Play, pause" },
  { keys: ["0", "9"], action: "Jump to 0% … 90%" },
]

const TIPS: Array<{ icon: () => JSX.Element; tip: string }> = [
  { icon: () => <span class="chip">1.00</span>, tip: "Click for all controls. Right-click: back to 1.00." },
  { icon: () => <span class="chip">0:20</span>, tip: "Click for the time left at this speed." },
  { icon: () => <GripIcon />, tip: "Drag to move the panel." },
  { icon: () => <span class="handle" />, tip: "Drag the corner to resize. Double-click to undo." },
  { icon: () => <HideIcon />, tip: "Hide the panel until the page reloads." },
]

/** The speed of the video the keys act on in the active tab, or 1 when there's none. */
async function speedInActiveTab(): Promise<number> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  // Rejects when no frame answers: a page without a video, or one where the extension can't run.
  const speed: unknown = tab?.id == null ? undefined : await browser.tabs.sendMessage(tab.id, GET_SPEED).catch(() => {})
  return typeof speed === "number" ? speed : 1
}

export function Popup() {
  const settings = useSettings()
  const savedSeconds = useTotalSavedSeconds()
  const isOff = () => settings.isDisabledOnThisDomain()

  return (
    <main>
      <header>
        <img class="logo" src={iconLarge} alt="" />
        <h1>Bee Fast Video</h1>
        <Show when={savedSeconds() != null}>
          <p class="stats" title="Time saved by watching faster, on all your devices">
            <span class="stats-label">Time saved</span>
            <span class="stats-value">{formatHours(savedSeconds() ?? 0)}</span>
          </p>
        </Show>
      </header>

      <section class="site" classList={{ off: isOff() }}>
        <Setting class="site-switch" checked={!isOff()} onChange={() => settings.toggleBlacklistHostName()}>
          <span class="site-state">{isOff() ? "Off" : "On"} for</span>
          <span class="hostname">{settings.currentHostname()}</span>
        </Setting>
        <Setting
          class="remember"
          icon={<BrainIcon />}
          checked={settings.rememberedSpeed() != null}
          disabled={isOff()}
          onChange={async () =>
            settings.toggleRememberedSpeed(settings.rememberedSpeed() == null ? await speedInActiveTab() : undefined)
          }
        >
          Remember my speed
          <Show when={settings.rememberedSpeed()}>
            {(speed) => <span class="remembered-speed">{formatPlaybackRate(speed())}</span>}
          </Show>
        </Setting>
        <Setting
          class="fit"
          icon={<FitScreenIcon />}
          checked={settings.isFitVideosOnThisDomain()}
          disabled={isOff()}
          onChange={() => settings.toggleFitVideosOnThisDomain()}
        >
          Fit videos to the window
        </Setting>
      </section>

      <section>
        <h2>Keys</h2>
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
        <p class="hint">
          With <kbd>Shift</kbd>: speed by 0.1, seek by 20 s.
        </p>
      </section>

      <section>
        <h2>Panel</h2>
        <ul class="list tips">
          <For each={TIPS}>
            {(item) => (
              <li>
                <span class="icons">{item.icon()}</span>
                <span>{item.tip}</span>
              </li>
            )}
          </For>
        </ul>
        <p class="hint">Scroll over the speed, seek bar or volume to change them.</p>
      </section>
    </main>
  )
}

/** A row with a switch. The whole row is clickable. */
function Setting(
  props: ParentProps<{
    class: string
    icon?: JSX.Element
    checked: boolean
    disabled?: boolean
    onChange: () => void
  }>,
) {
  return (
    <label class={`setting ${props.class}`}>
      {props.icon}
      <span class="setting-text">{props.children}</span>
      <input
        type="checkbox"
        role="switch"
        class="switch"
        checked={props.checked}
        aria-checked={props.checked}
        disabled={props.disabled}
        onChange={() => props.onChange()}
      />
    </label>
  )
}
