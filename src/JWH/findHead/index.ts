import { JWHError } from '../../.errors/class.js'
import type { History } from '../../.types/index.js'

export function findHead(history: History) {
  for (const [proof, commit] of Object.entries(history)) {
    if (!proof || !commit) break
    if (!commit.headers.nxt) return { headIndex: proof, headCommit: commit }
    if (Object.prototype.hasOwnProperty.call(history, commit.headers.nxt))
      continue
  }
  throw new JWHError('BAD_HISTORY')
}
