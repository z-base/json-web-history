import { JWHError } from '../../.errors/class.js'
import type { Commit, History } from '../../.types/index.js'
import { normalizeCommit } from '../normalizeCommit/index.js'

export function findRoot(history: History): {
  rootIndex: string
  rootCommit: Commit
} {
  if (typeof history !== 'object') throw new JWHError('MALFORMED_HISTORY')
  for (const [index, commit] of Object.entries(history)) {
    if (commit.headers.prv === null) {
      return { rootIndex: index, rootCommit: normalizeCommit(commit) }
    }
    if (Object.prototype.hasOwnProperty.call(history, commit.headers.prv))
      continue
  }
  throw new JWHError('MALFORMED_HISTORY')
}
