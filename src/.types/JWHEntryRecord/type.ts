import type { JWHAfter } from '../JWHAfter/type.js'
import type { JWHJSON } from '../JWHJSON/type.js'

export interface JWHEntryRecord {
  jti: string
  iss: string
  nbf: number
  aft: JWHAfter
  doc: JWHJSON
}
