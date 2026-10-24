import { For, type JSX, type ParentProps, Show } from "solid-js"
import { browser } from "#imports"
import { BrainIcon, FitScreenIcon } from "@/assets/control-icons"
import iconLarge from "@/assets/icon-large.png"
import { formatHours, formatPlaybackRate } from "@/utils/format-time"
import { GET_SPEED, useSettings, useTotalSavedSeconds } from "@/utils/settings"

// Written by hand: keep in sync with `keyActions` in `shortcuts.ts`. Opposite keys share a row, and the step under
// it says what Shift changes.

const KEYS: Array<{ keys: Array<string>; action: string; step?: string; shiftStep?: string }> = [
  { keys: ["Z", "X"], action: "Slower, faster", step: "by 0.25", shiftStep: "by 0.1" },
  { keys: ["A", "D"], action: "Back, forward", step: "5 s", shiftStep: "20 s" },
  { keys: ["Q", "E"], action: "Frame back, forward" },
  { keys: ["S"], action: "Play, pause" },
  { keys: ["0–9"], action: "Jump to 0% … 90%" },
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
        <ul class="keys">
          <For each={KEYS}>
            {(item) => (
              <li>
                <span class="key-pair">
                  <For each={item.keys}>{(key) => <kbd>{key}</kbd>}</For>
                </span>
                <span class="action">
                  {item.action}
                  <Show when={item.step}>
                    <span class="step">
                      {item.step} · <kbd>Shift</kbd> {item.shiftStep}
                    </span>
                  </Show>
                </span>
              </li>
            )}
          </For>
        </ul>
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
