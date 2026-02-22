import { decode } from '@msgpack/msgpack'
import { fromBase64UrlString, toJSON } from '@z-base/bytecodec'
import type { JWH } from '../../.types/index.js'
export function openHistory(history: JWH | Uint8Array | Base64URLString): JWH {
  return history instanceof Uint8Array
    ? (decode(history) as JWH)
    : typeof history === 'string'
      ? (toJSON(fromBase64UrlString(history)) as JWH)
      : history
}
