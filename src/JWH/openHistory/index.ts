import { decode } from '@msgpack/msgpack'
import type { JWH } from '../createHistory/index.js'
import { fromBase64UrlString, toJSON } from '@z-base/bytecodec'

export function openHistory(history: JWH | Uint8Array | Base64URLString): JWH {
  return history instanceof Uint8Array
    ? (decode(history) as JWH)
    : typeof history === 'string'
      ? (toJSON(fromBase64UrlString(history)) as JWH)
      : history
}
