import type { JWH, JWHSnapshotTypeMap } from '../../.types/index.js'
import { encode } from '@msgpack/msgpack'
import { fromJSON, toBase64UrlString } from '@z-base/bytecodec'

export async function closeHistory<T extends keyof JWHSnapshotTypeMap>(
  snapshotType: T,
  openHistory: JWH
): Promise<JWHSnapshotTypeMap[T]> {
  switch (snapshotType) {
    case 'json':
      return openHistory as JWHSnapshotTypeMap[T]

    case 'msgpack':
      return encode(openHistory) as JWHSnapshotTypeMap[T]

    case 'base64url':
      return toBase64UrlString(fromJSON(openHistory)) as JWHSnapshotTypeMap[T]

    default:
      throw new Error('Unsupported snapshot type')
  }
}
