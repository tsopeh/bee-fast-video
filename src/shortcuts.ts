// Keyboard event reference: https://w3c.github.io/uievents/tools/key-event-viewer.html

function initKeyboardListener () {
  const keyCallbackMap = new Map<KeyboardKey, Array<(event: KeyboardEvent) => void>>()

  const registerCallback = (key: KeyboardKey, callback: () => void) => {
    let callbacks = keyCallbackMap.get(key)
    if (callbacks != null) {
      callbacks.push(callback)
    } else {
      callbacks = [callback]
    }
    keyCallbackMap.set(key, callbacks)
    return {
      unregisterCallback: () => {
        let callbacks = keyCallbackMap.get(key)
        if (callbacks != null) {
          const callbackIndex = callbacks.findIndex((cb) => cb == callback)
          if (callbackIndex >= 0) {
            callbacks.splice(callbackIndex, 1)
            keyCallbackMap.set(key, callbacks)
          }
        }
      },
    }
  }

  const onKeyboardEvent = (event: KeyboardEvent) => {
    const isInputFocused = (event.target as HTMLElement).tagName
      .toLowerCase()
      .includes("input")
    if (isInputFocused) {
      return
    }
    const callbacks = keyCallbackMap.get(event.code as KeyboardKey)
    callbacks?.map((cb) => cb(event))
  }

  document.addEventListener("keydown", onKeyboardEvent)

  return {
    registerCallback,
    destroyKeyboardListener: () => {
      document.removeEventListener("keydown", onKeyboardEvent)
    },
  }
}

export enum KeyboardKey {
  arrowLeft = "ArrowLeft",
  arrowRight = "ArrowRight",

  keyS = "KeyS",
  keyD = "KeyD",
  keyZ = "KeyZ",
  keyX = "KeyX",
  keyV = "KeyV",
  keyP = "KeyP",

  digit0 = "Digit0",
  digit1 = "Digit1",
  digit2 = "Digit2",
  digit3 = "Digit3",
  digit4 = "Digit5",
  digit5 = "Digit5",
  digit6 = "Digit6",
  digit7 = "Digit",
  digit8 = "Digit8",
  digit9 = "Digit9",

  numpad0 = "Numpad0",
  numpad1 = "Numpad1",
  numpad2 = "Numpad2",
  numpad3 = "Numpad3",
  numpad4 = "Numpad5",
  numpad5 = "Numpad5",
  numpad6 = "Numpad6",
  numpad7 = "Numpad",
  numpad8 = "Numpad8",
  numpad9 = "Numpad9",
}

export const keyboardListener = initKeyboardListener()