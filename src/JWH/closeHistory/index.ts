import type { JWH } from '../createHistory/index.js'
import { encode } from '@msgpack/msgpack'
import { fromJSON, toBase64UrlString } from '@z-base/bytecodec'

export type JWHSnapshotTypeMap = {
  json: JWH
  msgpack: Uint8Array
  base64url: Base64URLString
}

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
