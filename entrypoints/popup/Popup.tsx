import { createSignal, For, type JSX, onCleanup, type ParentProps, Show } from "solid-js"
import { browser } from "#imports"
import { BrainIcon, FitScreenIcon } from "@/assets/control-icons"
import iconLarge from "@/assets/icon-large.png"
import { formatHours, formatPlaybackRate } from "@/utils/format-time"
import { bindingForKey, type KeyAction, keyLabel } from "@/utils/keys"
import { GET_SPEED, useSettings, useTotalSavedSeconds } from "@/utils/settings"

// Written by hand: keep in sync with `actions` in `shortcuts.ts`. Opposite keys share a row, followed by how far they
// step, without and with Shift.

const KEYS: Array<{ keys: Array<KeyAction>; action: string; step?: string; shiftStep?: string }> = [
  { keys: ["slowDown", "speedUp"], action: "Slow down, speed up", step: "±0.25", shiftStep: "±0.1" },
  { keys: ["rewind", "forward"], action: "Rewind, fast forward", step: "±5 s", shiftStep: "±20 s" },
  { keys: ["previousFrame", "nextFrame"], action: "Previous, next frame" },
  { keys: ["playPause"], action: "Play/pause" },
]

/** For the key buttons' tooltips. */
const ACTION_NAMES: Record<KeyAction, string> = {
  slowDown: "Slow down",
  speedUp: "Speed up",
  rewind: "Rewind",
  forward: "Fast forward",
  playPause: "Play/pause",
  previousFrame: "Previous frame",
  nextFrame: "Next frame",
}

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
  // The action whose key button waits for a new key.
  const [recording, setRecording] = createSignal<KeyAction>()

  const onKeyDown = (event: KeyboardEvent) => {
    const action = recording()
    // Tab moves on, and the button losing focus stops waiting.
    if (action == null || event.key === "Tab") {
      return
    }
    // Keeps Space and Enter from clicking the button again.
    event.preventDefault()
    const binding = bindingForKey(event)
    if (event.key === "Escape" || binding != null) {
      setRecording(undefined)
    }
    if (binding != null) {
      settings.setKey(action, binding)
    }
  }
  window.addEventListener("keydown", onKeyDown)
  onCleanup(() => window.removeEventListener("keydown", onKeyDown))

  const keyRow = (item: (typeof KEYS)[number]) => (
    <li>
      <span class="key-pair">
        <For each={item.keys}>
          {(action) => (
            <button
              type="button"
              class="key"
              classList={{ recording: recording() === action }}
              title={
                recording() === action ? "Press a new key. Esc cancels." : `${ACTION_NAMES[action]}. Click to change.`
              }
              onClick={() => setRecording(recording() === action ? undefined : action)}
              onBlur={() => setRecording(undefined)}
            >
              {recording() === action ? "…" : keyLabel(settings.keys()[action].key)}
            </button>
          )}
        </For>
      </span>
      <span class="action" classList={{ wide: item.step == null }}>
        {item.action}
      </span>
      <Show when={item.step}>
        <span class="step">{item.step}</span>
        <span class="shift-step">
          or <kbd>Shift</kbd> {item.shiftStep}
        </span>
      </Show>
    </li>
  )

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
        <div class="keys-heading">
          <h2>Keys</h2>
          <Show when={!settings.areDefaultKeys()}>
            <button type="button" class="reset-keys" onClick={() => settings.resetKeys()}>
              Reset
            </button>
          </Show>
        </div>
        <ul class="keys">
          <For each={KEYS}>{keyRow}</For>
          {/* Always seek, so they can't be changed. */}
          <li>
            <span class="key-pair">
              <kbd>0–9</kbd>
            </span>
            <span class="action wide">Seek to 0% … 90% of the video</span>
          </li>
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
