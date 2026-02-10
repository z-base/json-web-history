import { JWHString, JWHSnapshot } from '../types/index.js'

export function parseJWHString(jwhString: JWHString): JWHSnapshot {
  const value = JSON.parse(jwhString) as unknown

  if (!Array.isArray(value)) {
    throw new TypeError('JWH String must serialize a JSON array of compact JWS tokens')
  }

  for (const token of value) {
    if (typeof token !== 'string' || token.length === 0) {
      throw new TypeError('JWH Snapshot tokens must be non-empty strings')
    }
  }

  return [...value]
}
