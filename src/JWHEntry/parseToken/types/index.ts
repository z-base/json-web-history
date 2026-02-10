import { JWHEntryRecord } from '../../model/index.js'
import { JWHProtectedHeader } from '../../tokenizeEntry/types/index.js'

export interface ParsedJWHEntryToken {
  header: JWHProtectedHeader
  entry: JWHEntryRecord
  signature: ArrayBuffer
  signingInput: string
}
