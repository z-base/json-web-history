import { VerifyJWK } from '@z-base/cryptosuite'
import { JWHEntryRecord } from '../../JWHEntry/model/index.js'
import { deriveDocSchema } from '../deriveDocSchema/index.js'
import { parseJWHString } from '../parseJWHString/index.js'
import { computeOrderedEntries } from '../shared/computeOrderedEntries/index.js'
import { decodeEntryToken } from '../shared/decodeEntryToken/index.js'
import { entryFingerprint } from '../shared/entryFingerprint/index.js'
import { JWHString, JWHSnapshot } from '../types/index.js'

export async function mergeJWHSnapshots(
  snapshots: Array<JWHSnapshot | JWHString>,
  verifyJwk?: VerifyJWK
): Promise<JWHSnapshot> {
  if (snapshots.length === 0) {
    throw new TypeError('Merge requires at least one JWH Snapshot')
  }

  const entryByJti = new Map<string, JWHEntryRecord>()
  const tokenByJti = new Map<string, string>()
  let issuer: string | undefined
  let docSchema: string | undefined

  for (const snapshotInput of snapshots) {
    const snapshot =
      typeof snapshotInput === 'string' ? parseJWHString(snapshotInput) : snapshotInput

    for (const token of snapshot) {
      const entry = await decodeEntryToken(token, verifyJwk)

      if (issuer === undefined) {
        issuer = entry.iss
      } else if (issuer !== entry.iss) {
        throw new TypeError('Cannot merge snapshots from different issuers')
      }

      const currentSchema = deriveDocSchema(entry.doc)
      if (docSchema === undefined) {
        docSchema = currentSchema
      } else if (docSchema !== currentSchema) {
        throw new TypeError('Cannot merge snapshots with incompatible doc schemas')
      }

      const existing = entryByJti.get(entry.jti)
      if (existing) {
        if (entryFingerprint(existing) !== entryFingerprint(entry)) {
          throw new TypeError('Cannot merge snapshots with conflicting entries for the same jti')
        }
        continue
      }

      entryByJti.set(entry.jti, entry)
      tokenByJti.set(entry.jti, token)
    }
  }

  const ordered = computeOrderedEntries(entryByJti)

  return ordered.map((entry) => {
    const token = tokenByJti.get(entry.jti)
    if (!token) {
      throw new TypeError('Merged snapshot is missing a serialized token for an entry')
    }
    return token
  })
}
