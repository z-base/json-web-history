import { isJWHJSON } from '../isJWHJSON/index.js'
import {
  JWHAfter,
  JWHEntryRecord,
  JWHJSON,
  JWH_ROOT_POINTER,
} from '../types/index.js'

export function createEntryRecord(
  iss: string,
  aft: JWHAfter,
  doc: JWHJSON,
  jti: string = crypto.randomUUID(),
  nbf: number = Math.floor(Date.now() / 1000)
): JWHEntryRecord {
  if (typeof iss !== 'string' || iss.length === 0) {
    throw new TypeError('JWHEntry.iss must be a non-empty string')
  }

  if (typeof jti !== 'string' || jti.length === 0) {
    throw new TypeError('JWHEntry.jti must be a non-empty string')
  }

  if (typeof nbf !== 'number' || !Number.isFinite(nbf)) {
    throw new TypeError('JWHEntry.nbf must be a finite number')
  }

  if (aft !== JWH_ROOT_POINTER && (typeof aft !== 'string' || aft.length === 0)) {
    throw new TypeError('JWHEntry.aft must be a non-empty string or U+0000')
  }

  if (!isJWHJSON(doc)) {
    throw new TypeError('JWHEntry.doc must be valid JSON')
  }

  return {
    jti,
    iss,
    nbf,
    aft,
    doc,
  }
}
