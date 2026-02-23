import type { History, JWHSnapshotFormatMap } from '../../.types/index.js'
import { encode } from '@msgpack/msgpack'
import { fromJSON, toBase64UrlString } from '@z-base/bytecodec'

export function closeHistory<T extends keyof JWHSnapshotFormatMap>(
  snapshotFormat: T,
  openHistory: History
): JWHSnapshotFormatMap[T] {
  switch (snapshotFormat) {
    case 'json':
      return openHistory as JWHSnapshotFormatMap[T]

    case 'msgpack':
      return encode(openHistory) as JWHSnapshotFormatMap[T]

    case 'base64url':
      return toBase64UrlString(fromJSON(openHistory)) as JWHSnapshotFormatMap[T]

    default:
      throw new Error('Unsupported snapshot type')
  }
}
