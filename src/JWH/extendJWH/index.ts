import { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { JWHError } from '../../.errors/class.js'
import { createEntryRecord, JWHJSON } from '../../JWHEntry/model/index.js'
import { tokenizeEntry } from '../../JWHEntry/tokenizeEntry/index.js'
import { deriveDocSchema } from '../deriveDocSchema/index.js'
import { stringifySnapshot } from '../stringifySnapshot/index.js'
import { JWHString, JWHSnapshot } from '../types/index.js'
import { validateJWHSnapshot } from '../validateJWHSnapshot/index.js'

export async function extendJWH(
  snapshotInput: JWHSnapshot | JWHString,
  doc: JWHJSON,
  signJwk: SignJWK,
  verifyJwk?: VerifyJWK
): Promise<JWHString> {
  const validated = await validateJWHSnapshot(snapshotInput, verifyJwk)
  const docSchema = deriveDocSchema(doc)

  if (docSchema !== validated.docSchema) {
    throw new JWHError(
      'HISTORY_EXTEND_DOC_SCHEMA_MISMATCH',
      'Extended JWH entry doc must be schema-compatible with the existing history'
    )
  }

  const head = validated.entries[validated.entries.length - 1]
  const next = createEntryRecord(validated.issuer, head.jti, doc)
  const token = await tokenizeEntry(next, signJwk)
  return stringifySnapshot([...validated.snapshot, token])
}
