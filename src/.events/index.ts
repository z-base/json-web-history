import { History } from '../.types/index.js'

type Listener = (ev: History) => void

type EventMap = {
  corrupted: Set<Listener>
}

type EventType = keyof EventMap

export function addEventListener(
  eventMap: EventMap,
  type: EventType,
  callback: Listener,
  options?: { once?: boolean; signal?: AbortSignal }
) {
  if (!callback) return
  if (options?.signal?.aborted) return
  if (options?.signal)
    options.signal.addEventListener(
      'abort',
      () => removeEventListener(eventMap, type, callback),
      { once: true }
    )

  if (options?.once) {
    const wrapper: Listener = (ev) => {
      eventMap[type].delete(wrapper)
      callback(ev)
    }
    eventMap[type].add(wrapper)
    return
  }

  eventMap[type].add(callback)
}

export function removeEventListener(
  eventMap: EventMap,
  type: EventType,
  callback: Listener
) {
  eventMap[type].delete(callback)
}

export function dispatchEvent(
  eventMap: EventMap,
  type: EventType,
  ev: History
) {
  // clone to avoid mutation issues if listeners remove themselves
  for (const fn of [...eventMap[type]]) {
    try {
      fn(ev)
    } catch {
      // swallow — event systems should not crash caller
    }
  }
}
