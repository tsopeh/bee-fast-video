interface ObserveVideoElementsOptions {
  target: Node,
  onMutation: (mutations: Array<MutationRecord>) => void
}

export function observeForVideoElements ({
  target,
  onMutation,
}: ObserveVideoElementsOptions) {

  const observer = new MutationObserver(
    (mutations) => {
      onMutation(mutations)
    },
  )

  observer.observe(target, { childList: true, subtree: true })

  return {
    stopObserving: () => {
      observer.disconnect()
    },
  }
}