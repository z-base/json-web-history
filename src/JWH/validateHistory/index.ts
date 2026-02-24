import type { History } from '../../.types/index.js'
import { JWHError } from '../../.errors/class.js'
import { findRoot } from '../findRoot/index.js'
export async function validateHistory(history: History) {
  const { rootIndex, rootCommit } = findRoot(history)
  if (!rootCommit) throw new JWHError('MALFORMED_ROOT')
  const rootIssuer = rootCommit.headers.iss
  if (!rootIssuer) throw new JWHError('MISSING_ISSUER')
  let verificationMethod = history[rootIndex].headers.vrf
  if (!verificationMethod) throw new JWHError('MISSING_VERIFICATION_METHOD')
  let cursor = rootCommit
  while (true) {}
}
