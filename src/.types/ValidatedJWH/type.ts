import type { JWHEntryRecord } from '../JWHEntryRecord/type.js'
import type { JWHSnapshot } from '../JWHSnapshot/type.js'

export interface ValidatedJWH {
  snapshot: JWHSnapshot
  entries: JWHEntryRecord[]
  issuer: string
  docSchema: string
}
