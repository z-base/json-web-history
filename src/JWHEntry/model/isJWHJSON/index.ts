import { JWHJSON } from '../types/index.js'

export function isJWHJSON(value: unknown): value is JWHJSON {
  if (value === null) return true

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJWHJSON(item))
  }

  if (typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      if (!isJWHJSON(item)) return false
    }
    return true
  }

  return false
}
