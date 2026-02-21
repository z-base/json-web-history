import type { Assertion } from '../createAssertion/index.js'
import type { JWH } from '../createHistory/index.js'
export function openHistory(history: JWH) {
  const handler: ProxyHandler<typeof history> = {
    // append-only: disallow overwrites and enforce frozen entries
    set(target, key, value) {
      if (typeof key !== 'string') return false

      // optional but sensible: block prototype-pollution keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype')
        return false

      if (Object.prototype.hasOwnProperty.call(target, key)) return false
      target[key] = Object.freeze(value as Assertion)
      return true
    },

    // disallow delete
    deleteProperty() {
      return false
    },

    // disallow defineProperty tricks
    defineProperty() {
      return false
    },

    // read-only entries: always return the frozen value
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver)
      return v && typeof v === 'object' ? Object.freeze(v) : v
    },
  }

  return new Proxy(history, handler)
}