import { JWHError } from '../../.errors/class.js'
import { JWHString, JWHSnapshot } from '../types/index.js'

export function parseJWHString(jwhString: JWHString): JWHSnapshot {
  let value: unknown
  try {
    value = JSON.parse(jwhString) as unknown
  } catch {
    throw new JWHError(
      'STRING_INVALID_JSON_ARRAY',
      'JWH String must serialize a JSON array of compact JWS tokens'
    )
  }

  if (!Array.isArray(value)) {
    throw new JWHError(
      'STRING_INVALID_JSON_ARRAY',
      'JWH String must serialize a JSON array of compact JWS tokens'
    )
  }

  for (const token of value) {
    if (typeof token !== 'string' || token.length === 0) {
      throw new JWHError(
        'STRING_INVALID_SNAPSHOT_TOKEN',
        'JWH Snapshot tokens must be non-empty strings'
      )
    }
  }

  return [...value]
}
