import { JWHEntryRecord } from '../../JWHEntry/model/index.js'

export type JWHEntryToken = Base64URLString
export type JWHSnapshot = JWHEntryToken[]
export type JWHString = string

export interface ValidatedJWH {
  snapshot: JWHSnapshot
  entries: JWHEntryRecord[]
  issuer: string
  docSchema: string
}
