import type { JWHEntryRecord } from '../JWHEntryRecord/type.js'
import type { JWHProtectedHeader } from '../JWHProtectedHeader/type.js'

export interface ParsedJWHEntryToken {
  header: JWHProtectedHeader
  entry: JWHEntryRecord
  signature: ArrayBuffer
  signingInput: string
}
