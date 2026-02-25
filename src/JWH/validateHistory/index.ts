import type { History, Commit } from '../../.types/index.js'
import { JWHError } from '../../.errors/class.js'
import { findRoot } from '../findRoot/index.js'
import { findNext } from '../findNext/index.js'
export async function validateHistory(history: History): Boolean {
  const { rootIndex, rootCommit } = findRoot(history)
  if (!rootCommit) throw new JWHError('MALFORMED_ROOT')
  const rootIssuer = rootCommit.headers.iss
  if (!rootIssuer) throw new JWHError('MISSING_ISSUER')
  let verificationMethod = history[rootIndex].headers.vrf
  if (!verificationMethod) throw new JWHError('MISSING_VERIFICATION_METHOD')
  let lastIndex: string | null = null
  let lastCommit: Commit | null = null
  let currentIndex: string = rootIndex
  let currentCommit: Commit = rootCommit
  while (true) {
    if (currentCommit.headers.nxt === null) return true
    try {
      const nextCursor = findNext(history, rootCommit)
      if (nextCursor) cursor = nextCursor
    } catch (err) {
      break
    }
  }
  return false
}
