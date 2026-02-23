import { JWHError } from '../../.errors/class.js'
import type { History } from '../../.types/index.js'

export function findRoot(history: History) {
  for (const [proof, commit] of Object.entries(history)) {
    if (!proof || !commit) break
    if (!commit.headers.prv) return { rootIndex: proof, rootCommit: commit }
    if (Object.prototype.hasOwnProperty.call(history, commit.headers.prv))
      continue
  }
  throw new JWHError('BAD_HISTORY')
}
