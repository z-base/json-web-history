import { VerifyJWK } from '@z-base/cryptosuite'
import { JWHEntryRecord } from '../../JWHEntry/model/index.js'
import { deriveDocSchema } from '../deriveDocSchema/index.js'
import { parseJWHString } from '../parseJWHString/index.js'
import { computeOrderedEntries } from '../shared/computeOrderedEntries/index.js'
import { decodeEntryToken } from '../shared/decodeEntryToken/index.js'
import { entryFingerprint } from '../shared/entryFingerprint/index.js'
import { JWHSnapshot, JWHString, ValidatedJWH } from '../types/index.js'

export async function validateJWHSnapshot(
  snapshotInput: JWHSnapshot | JWHString,
  verifyJwk?: VerifyJWK
): Promise<ValidatedJWH> {
  const snapshot =
    typeof snapshotInput === 'string' ? parseJWHString(snapshotInput) : [...snapshotInput]

  if (snapshot.length === 0) {
    throw new TypeError('JWH Snapshot cannot be empty')
  }

  const entryByJti = new Map<string, JWHEntryRecord>()
  const tokenByJti = new Map<string, string>()
  let issuer: string | undefined
  let docSchema: string | undefined

  for (const token of snapshot) {
    const entry = await decodeEntryToken(token, verifyJwk)

    if (issuer === undefined) {
      issuer = entry.iss
    } else if (issuer !== entry.iss) {
      throw new TypeError('All JWH entries must have the same iss value')
    }

    const schema = deriveDocSchema(entry.doc)
    if (docSchema === undefined) {
      docSchema = schema
    } else if (docSchema !== schema) {
      throw new TypeError(
        'All JWH entries must have schema-compatible doc values within one history'
      )
    }

    const existing = entryByJti.get(entry.jti)
    if (existing) {
      const samePayload = entryFingerprint(existing) === entryFingerprint(entry)
      const reason = samePayload
        ? 'JWH cannot contain duplicate jti values'
        : 'JWH cannot contain conflicting payloads for the same jti'
      throw new TypeError(reason)
    }

    entryByJti.set(entry.jti, entry)
    tokenByJti.set(entry.jti, token)
  }

  const ordered = computeOrderedEntries(entryByJti)
  for (let index = 0; index < ordered.length; index += 1) {
    const expected = tokenByJti.get(ordered[index].jti)
    if (!expected || snapshot[index] !== expected) {
      throw new TypeError('JWH Snapshot must be ordered from root to head')
    }
  }

  return {
    snapshot,
    entries: ordered,
    issuer: issuer as string,
    docSchema: docSchema as string,
  }
}
