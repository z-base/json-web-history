import { decode } from '@msgpack/msgpack'
import { fromBase64UrlString, toJSON } from '@z-base/bytecodec'
import type { History, JWHSnapshotFormat } from '../../.types/index.js'
export function openHistory(history: JWHSnapshotFormat): History {
  return history instanceof Uint8Array
    ? (decode(history) as History)
    : typeof history === 'string'
      ? (toJSON(fromBase64UrlString(history)) as History)
      : history
}
