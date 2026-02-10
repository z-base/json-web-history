import { JWHEntryRecord } from '../../../JWHEntry/model/index.js'

export function entryFingerprint(entry: JWHEntryRecord): string {
  return JSON.stringify({
    jti: entry.jti,
    iss: entry.iss,
    nbf: entry.nbf,
    aft: entry.aft,
    doc: entry.doc,
  })
}
