import { decode } from '@msgpack/msgpack'
import type { Assertion, Headers } from '../createAssertion/index.js'
import type { JWH } from '../createHistory/index.js'
import { fromBase64UrlString, toJSON } from '@z-base/bytecodec'

export function openHistory(history: JWH | Uint8Array | Base64URLString): JWH {
  const normalizedHistory: JWH =
    history instanceof Uint8Array
      ? (decode(history) as JWH)
      : typeof history === 'string'
        ? (toJSON(fromBase64UrlString(history)) as JWH)
        : history

  const target: JWH = {}
  for (const [key, value] of Object.entries(normalizedHistory)) {
    target[key] = value
  }
  const views = new WeakMap<Assertion, Assertion>()
  const headerViews = new WeakMap<Headers, Headers>()
  const handler: ProxyHandler<JWH> = {
    // append-only: disallow overwrites
    set(target, key, value) {
      if (typeof key !== 'string') return false

      // optional but sensible: block prototype-pollution keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype')
        return false

      if (Object.prototype.hasOwnProperty.call(target, key)) return false
      target[key] = value as Assertion
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

    // entry fields are immutable except "next"
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver)
      if (!v || typeof v !== 'object') return v
      const entry = v as Assertion
      const cached = views.get(entry)
      if (cached) return cached
      const view = new Proxy(entry, {
        set() {
          return false
        },
        get(entryTarget, entryProp, entryReceiver) {
          const entryValue = Reflect.get(entryTarget, entryProp, entryReceiver)
          if (
            entryProp !== 'headers' ||
            !entryValue ||
            typeof entryValue !== 'object'
          )
            return entryValue
          const headers = entryValue as Headers
          const cachedHeaders = headerViews.get(headers)
          if (cachedHeaders) return cachedHeaders
          const headerView = new Proxy(headers, {
            set(headerTarget, headerKey, headerValue) {
              if (headerKey !== 'nxt') return false
              if (headerValue !== null && typeof headerValue !== 'string')
                return false
              headerTarget.nxt = headerValue
              return true
            },
            deleteProperty() {
              return false
            },
            defineProperty() {
              return false
            },
          }) as Headers
          headerViews.set(headers, headerView)
          return headerView
        },
        deleteProperty() {
          return false
        },
        defineProperty() {
          return false
        },
      }) as Assertion
      views.set(entry, view)
      return view
    },
  }

  return new Proxy(target, handler)
}
