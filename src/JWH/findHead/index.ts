import { JWH } from '../createHistory/index.js'

export function findHead(jwh: JWH) {
  for (const [key, entry] of Object.entries(jwh)) {
    if (!key || !entry) break
    if (!entry.next) return { headIndex: key, headEntry: entry }
    if (Object.prototype.hasOwnProperty.call(jwh, entry.next)) continue
  }
  throw new Error('missing history')
}
