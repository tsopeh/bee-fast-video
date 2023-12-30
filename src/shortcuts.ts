// Keyboard event reference: https://w3c.github.io/uievents/tools/key-event-viewer.html

function initKeyboardListener () {
  const keyCallbackMap = new Map<string, Array<(event: KeyboardEvent) => void>>()

  const registerCallback = (key: string, callback: () => void) => {
    let callbacks = keyCallbackMap.get(key)
    if (callbacks != null) {
      callbacks.push(callback)
    } else {
      callbacks = [callback]
    }
    keyCallbackMap.set(key, callbacks)
    return {
      unregisterCallback: () => {
        const callbacks = keyCallbackMap.get(key)
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
    const isTypingInInput = (event.target as HTMLElement).tagName
      .toLowerCase()
      .includes("input")
    const isTypingInContentEditableElement = (event.target as HTMLElement).isContentEditable
    const shouldSkipKeyboardEvent = isTypingInInput || isTypingInContentEditableElement
    if (shouldSkipKeyboardEvent) {
      return
    }
    const callbacks = keyCallbackMap.get(event.key)
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

export const keyboardListener = initKeyboardListener()