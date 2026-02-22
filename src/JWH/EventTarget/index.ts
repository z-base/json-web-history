import { JWH } from '../createHistory/index.js'

type Listener = (ev: JWH) => void

const eventMap = {
  corrupted: new Set<Listener>(),
}

type EventType = keyof typeof eventMap

export function addEventListener(
  type: EventType,
  callback: Listener,
  options?: { once?: boolean }
) {
  if (!callback) return

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

export function removeEventListener(type: EventType, callback: Listener) {
  eventMap[type].delete(callback)
}

export function dispatchEvent(type: EventType, ev: JWH) {
  // clone to avoid mutation issues if listeners remove themselves
  for (const fn of [...eventMap[type]]) {
    try {
      fn(ev)
    } catch {
      // swallow — event systems should not crash caller
    }
  }
}
