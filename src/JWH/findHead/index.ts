import { JWHError } from '../../.errors/class.js'
import type { Commit, History } from '../../.types/index.js'
import { normalizeCommit } from '../normalizeCommit/index.js'

export function findHead(history: History): {
  headIndex: string
  headCommit: Commit
} {
  if (typeof history !== 'object') throw new JWHError('MALFORMED_HISTORY')
  for (const [index, commit] of Object.entries(history)) {
    if (commit.headers.nxt === null) {
      return { headIndex: index, headCommit: normalizeCommit(commit) }
    }
    if (Object.prototype.hasOwnProperty.call(history, commit.headers.nxt))
      continue
  }
  throw new JWHError('MALFORMED_HISTORY')
}
