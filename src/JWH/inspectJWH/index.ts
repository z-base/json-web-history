import { VerifyJWK } from '@z-base/cryptosuite'
import { JWHError } from '../../.errors/class.js'
import { JWHEntryRecord } from '../../JWHEntry/model/index.js'
import { JWHString, JWHSnapshot } from '../types/index.js'
import { validateJWHSnapshot } from '../validateJWHSnapshot/index.js'

export async function inspectJWH(
  snapshotInput: JWHSnapshot | JWHString,
  t: number,
  verifyJwk?: VerifyJWK
): Promise<JWHEntryRecord> {
  if (typeof t !== 'number' || !Number.isFinite(t)) {
    throw new JWHError(
      'HISTORY_INSPECT_TIME_INVALID',
      'Inspect time must be a finite number'
    )
  }

  const validated = await validateJWHSnapshot(snapshotInput, verifyJwk)
  const currentEntries = validated.entries.filter((entry) => entry.nbf <= t)

  if (currentEntries.length === 0) {
    throw new JWHError(
      'HISTORY_INSPECT_NO_VALID_ENTRY',
      'No JWH entry is valid at the requested time'
    )
  }

  currentEntries.sort((a, b) => {
    const byNbf = a.nbf - b.nbf
    if (byNbf !== 0) return byNbf
    return a.jti.localeCompare(b.jti)
  })

  return currentEntries[currentEntries.length - 1]
}
