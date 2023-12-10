function initIntersectionObservable () {
  const callbacksMap: Map<HTMLVideoElement, (fn: IntersectionObserverEntry) => void> = new Map()
  const stepsCount = 100
  const intersectionObserver = new IntersectionObserver((entries) => {
    console.log("INTERSECTION ENTRIES", entries)
    entries.forEach(entry => {
      const callback = callbacksMap.get(entry.target as HTMLVideoElement)
      callback?.(entry)
    })
  }, {
    /* Note: root = null means viewport */
    root: null,
    rootMargin: "0px",
    threshold: Array.from({ length: stepsCount }).map((_, i) => (i + 1) / stepsCount),
  })

  return {
    register: (
      videoEl: HTMLVideoElement,
      callback: (intersection: IntersectionObserverEntry) => void,
    ) => {
      callbacksMap.set(videoEl, callback)
      intersectionObserver.observe(videoEl)
    },
    unregister: (videoEl: HTMLVideoElement) => {
      intersectionObserver.unobserve(videoEl)
      callbacksMap.delete(videoEl)
    },
  }
}

export const viewportIntersection = initIntersectionObservable()