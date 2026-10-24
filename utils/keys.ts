// The keys for the shortcuts, which the user can change in the popup. The number keys 0-9 always seek and can't be
// changed or taken.

export type KeyAction = "slowDown" | "speedUp" | "rewind" | "forward" | "playPause" | "previousFrame" | "nextFrame"

/**
 * `key` is `KeyboardEvent.key`, so a key follows the keyboard layout: on a French keyboard, Z is where QWERTY has W.
 * Letters are stored in lower case. `code` is the physical key, kept for keys set in the popup. It's needed with Shift,
 * which turns `[` into `{`, so the key alone wouldn't match.
 */
export interface KeyBinding {
  key: string
  code?: string
}

export type KeyBindings = Record<KeyAction, KeyBinding>

export const DEFAULT_KEYS: KeyBindings = {
  slowDown: { key: "z" },
  speedUp: { key: "x" },
  rewind: { key: "a" },
  forward: { key: "d" },
  playPause: { key: "s" },
  // Above A and D, so frame steps sit right over seeking back and forward.
  previousFrame: { key: "q" },
  nextFrame: { key: "e" },
}

const KEY_ACTIONS = Object.keys(DEFAULT_KEYS) as Array<KeyAction>

/** The keys with the user's changes. Only changed keys are stored, so an action added later gets its default. */
export function resolveKeys(changed: Partial<KeyBindings>): KeyBindings {
  return { ...DEFAULT_KEYS, ...changed }
}

export function areDefaultKeys(keys: KeyBindings): boolean {
  return KEY_ACTIONS.every((action) => keys[action].key === DEFAULT_KEYS[action].key)
}

type KeyPress = Pick<KeyboardEvent, "key" | "code" | "shiftKey">

/** The action for a key press, if any. Modifier keys other than Shift are the caller's to check. */
export function actionForKey(keys: KeyBindings, event: KeyPress): KeyAction | undefined {
  const key = normalizeKey(event.key)
  return (
    KEY_ACTIONS.find((action) => keys[action].key === key) ??
    (event.shiftKey ? KEY_ACTIONS.find((action) => keys[action].code === event.code) : undefined)
  )
}

/**
 * The binding for a key pressed in the popup, or `undefined` if it can't be used: the number keys seek, Shift picks the
 * bigger or smaller step, and the content script ignores keys pressed with Ctrl, Alt or Cmd.
 */
export function bindingForKey(
  event: KeyPress & Pick<KeyboardEvent, "altKey" | "ctrlKey" | "metaKey">,
): KeyBinding | undefined {
  const isModified = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey
  if (isModified || UNUSABLE_KEYS.has(event.key) || /^[0-9]$/.test(event.key)) {
    return undefined
  }
  return { key: normalizeKey(event.key), code: event.code }
}

// Escape cancels and Tab moves on. Shift, Ctrl, Alt and Cmd alone set their own flag above. "Dead" is the first key of
// an accent like `´`, and "Process" a key going to an input method.
const UNUSABLE_KEYS = new Set(["Escape", "Tab", "AltGraph", "CapsLock", "Dead", "Process", "Unidentified"])

/** The keys with `action` on `binding`. An action that had that key takes the old key of `action`, so none is lost. */
export function withKey(keys: KeyBindings, action: KeyAction, binding: KeyBinding): KeyBindings {
  const other = KEY_ACTIONS.find((a) => a !== action && keys[a].key === binding.key)
  return { ...keys, ...(other == null ? {} : { [other]: keys[action] }), [action]: binding }
}

/** Only the keys that differ from the defaults, for storage. */
export function changedKeys(keys: KeyBindings): Partial<KeyBindings> {
  return Object.fromEntries(KEY_ACTIONS.filter((a) => keys[a].key !== DEFAULT_KEYS[a].key).map((a) => [a, keys[a]]))
}

/** How a key is shown: `Z`, `Space`, `←`, `PgDn`. Short, since two keys share a narrow column in the popup. */
export function keyLabel(key: string): string {
  return KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key)
}

const KEY_LABELS: Record<string, string> = {
  " ": "Space",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Backspace: "⌫",
  Enter: "↵",
  PageUp: "PgUp",
  PageDown: "PgDn",
  Delete: "Del",
  Insert: "Ins",
  ContextMenu: "Menu",
}

// Caps Lock also makes `key` upper case, without Shift.
const normalizeKey = (key: string) => (key.length === 1 ? key.toLowerCase() : key)
