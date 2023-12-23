function initIntersectionObservable () {
  const callbacksMap: Map<HTMLVideoElement, (fn: IntersectionObserverEntry) => void> = new Map()
  const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const callback = callbacksMap.get(entry.target as HTMLVideoElement)
      callback?.(entry)
    })
  }, {
    /* Note: root = null means viewport */
    root: null,
    rootMargin: "0px",
    threshold: 0,
  })

  return {
    register: (
      videoEl: HTMLVideoElement,
      callback: (intersection: IntersectionObserverEntry) => void,
    ) => {
      callbacksMap.set(videoEl, callback)
      intersectionObserver.observe(videoEl)
      const unregisterHandler = () => {
        intersectionObserver.unobserve(videoEl)
        callbacksMap.delete(videoEl)
      }
      return {
        unregister: unregisterHandler,
      }
    },
  }
}

export const viewportIntersection = initIntersectionObservable()