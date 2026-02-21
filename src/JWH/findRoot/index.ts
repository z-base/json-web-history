import { JWH } from '../createHistory/index.js'

export function findRoot(jwh: JWH) {
  for (const [key, entry] of Object.entries(jwh)) {
    if (!key || !entry) break
    if (!entry.prev) return { rootIndex: key, rootEntry: entry }
    if (Object.prototype.hasOwnProperty.call(jwh, entry.prev)) continue
  }
  throw new Error('missing history')
}
