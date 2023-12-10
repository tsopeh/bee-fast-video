type SubscriberFn<T> = (value: T) => void

export interface Observable<T> {
  subscribe: (fn: SubscriberFn<T>) => void
  unsubscribe: (fn: SubscriberFn<T>) => void
}

export function createObservable<T> (): { publish: SubscriberFn<T>, observable: Observable<T> } {
  const subscribers = new Set<SubscriberFn<T>>()
  return {
    publish: (value: T) => {
      subscribers.forEach(subscriber => subscriber(value))
    },
    observable: {
      subscribe: (fn) => {
        subscribers.add(fn)
      },
      unsubscribe: (fn) => {
        subscribers.delete(fn)
      },
    },
  }

}