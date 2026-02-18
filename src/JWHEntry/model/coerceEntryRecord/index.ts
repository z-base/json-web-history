import { JWHError } from '../../../.errors/class.js'
import { createEntryRecord } from '../createEntryRecord/index.js'
import { JWHEntryRecord } from '../types/index.js'

export function coerceEntryRecord(record: unknown): JWHEntryRecord {
  if (typeof record !== 'object' || record === null || Array.isArray(record)) {
    throw new JWHError(
      'ENTRY_INVALID_OBJECT',
      'JWH entry payload must be a JSON object'
    )
  }

  const value = record as Record<string, unknown>
  return createEntryRecord(
    value.iss as string,
    value.aft as string,
    value.doc as JWHEntryRecord['doc'],
    value.jti as string,
    value.nbf as number
  )
}
