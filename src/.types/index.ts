import { VerifyJWK } from '@z-base/cryptosuite'
export type JWHSnapshotFormat = History | Uint8Array | Base64URLString
export type JWHSnapshotFormatMap = {
  json: History
  msgpack: Uint8Array
  base64url: Base64URLString
}
export type JWHSnapshotFormatOptions = keyof JWHSnapshotFormatMap

export type Headers = {
  iss: string | null
  nxt: string | null
  prv: string | null
  vrf: VerifyJWK | null
}
export type Body = unknown
export type Commit = {
  headers: Headers
  body: Body
}
export type History = Record<string, Commit>
