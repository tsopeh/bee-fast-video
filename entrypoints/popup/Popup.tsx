import { For, type JSX, type ParentProps, Show } from "solid-js"
import { browser } from "#imports"
import { BrainIcon, FitScreenIcon } from "@/assets/control-icons"
import iconLarge from "@/assets/icon-large.png"
import { formatHours, formatPlaybackRate } from "@/utils/format-time"
import { GET_SPEED, useSettings, useTotalSavedSeconds } from "@/utils/settings"

// Written by hand: keep in sync with `keyActions` in `shortcuts.ts`. Keys that do opposite things share a row.

const KEYS: Array<Array<{ key: string; action: string }>> = [
  [
    { key: "Z", action: "Slower" },
    { key: "X", action: "Faster" },
  ],
  [
    { key: "A", action: "Back 5 s" },
    { key: "D", action: "Forward 5 s" },
  ],
  [
    { key: "Q", action: "Frame back" },
    { key: "E", action: "Frame forward" },
  ],
  [
    { key: "S", action: "Play, pause" },
    { key: "0–9", action: "Jump to 0–90%" },
  ],
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
            {(row) => (
              <li>
                <For each={row}>
                  {(item) => (
                    <span class="key">
                      <kbd>{item.key}</kbd>
                      {item.action}
                    </span>
                  )}
                </For>
              </li>
            )}
          </For>
        </ul>
        <p class="hint">
          <kbd>Shift</kbd> for steps of 0.1 and 20 s
        </p>
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
