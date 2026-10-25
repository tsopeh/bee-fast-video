import { createEffect, createSignal, For, type JSX, onCleanup, type ParentProps, Show } from "solid-js"
import { browser } from "#imports"
import { BrainIcon, FitScreenIcon } from "@/assets/control-icons"
import iconLarge from "@/assets/icon-large.png"
import { formatHours, formatPlaybackRate } from "@/utils/format-time"
import { bindingForKey, type KeyAction, keyLabel } from "@/utils/keys"
import { GET_SPEED, useSettings, useTotalSavedSeconds } from "@/utils/settings"
import { parseStep, type StepName } from "@/utils/steps"

// Written by hand: keep in sync with `actions` in `shortcuts.ts`. Opposite keys share a row, followed by how far they
// step, without and with Shift.

interface StepFields {
  step: StepName
  shiftStep: StepName
  unit?: string
  title: string
}

const KEYS: Array<{ keys: Array<KeyAction>; action: string; steps?: StepFields }> = [
  {
    keys: ["slowDown", "speedUp"],
    action: "Slow down, speed up",
    steps: { step: "speed", shiftStep: "shiftSpeed", title: "How much the speed changes" },
  },
  {
    keys: ["rewind", "forward"],
    action: "Rewind, fast forward",
    steps: { step: "seek", shiftStep: "shiftSeek", unit: "s", title: "How many seconds to jump" },
  },
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

  const stepField = (name: StepName, title: string) => (
    <StepField
      value={settings.steps()[name]}
      title={`${title}. Click to change.`}
      parse={(text) => parseStep(name, text)}
      onChange={(value) => settings.setStep(name, value)}
    />
  )

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
      <span class="action" classList={{ wide: item.steps == null }}>
        {item.action}
      </span>
      <Show when={item.steps}>
        {(steps) => (
          <>
            <span class="step">
              ±{stepField(steps().step, steps().title)}
              {steps().unit}
            </span>
            <span class="shift-step">
              or <kbd>Shift</kbd> ±{stepField(steps().shiftStep, `${steps().title}, with Shift`)}
              {steps().unit}
            </span>
          </>
        )}
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
          <Show when={!settings.areDefaultKeysAndSteps()}>
            <button type="button" class="reset-keys" onClick={() => settings.resetKeysAndSteps()}>
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

/**
 * A step that can be typed over, in a faint box so it looks editable. Enter or leaving the box saves it. Esc, or text
 * that isn't a number, puts the old value back.
 */
function StepField(props: {
  value: number
  title: string
  parse: (text: string) => number | undefined
  onChange: (value: number) => void
}) {
  const [text, setText] = createSignal(String(props.value))
  // Follows the stored value, also when Reset or another device changes it.
  createEffect(() => setText(String(props.value)))
  const show = (input: HTMLInputElement, value: number) => {
    input.value = String(value)
    setText(input.value)
  }
  const save = (input: HTMLInputElement) => {
    const value = props.parse(input.value)
    // Shown even when unchanged, since a value out of range is moved into it and storage wouldn't change.
    show(input, value ?? props.value)
    if (value != null && value !== props.value) {
      props.onChange(value)
    }
  }
  return (
    <input
      type="text"
      inputmode="decimal"
      class="step-field"
      title={props.title}
      value={text()}
      // As wide as its text, plus padding and border. The popup has no room to spare.
      style={{ width: `calc(${Math.max(text().length, 1)}ch + 6px)` }}
      onInput={(event) => setText(event.currentTarget.value)}
      onBlur={(event) => save(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          show(event.currentTarget, props.value)
          event.currentTarget.blur()
        } else if (event.key === "Enter") {
          // Saved here too, since a window without focus gets no blur until it has focus again.
          save(event.currentTarget)
          event.currentTarget.blur()
        }
      }}
    />
  )
}
