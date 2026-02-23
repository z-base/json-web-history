import type { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import type { History } from '../../.types/index.js'
import { mergeHistories } from '../mergeHistories/index.js'
import { createCommit } from '../createCommit/index.js'
import { findHead } from '../findHead/index.js'

export async function updateHistory(
  history: History,
  content: Record<string, unknown>,
  signJwk: SignJWK,
  rotate: VerifyJWK | null = null
) {
  const original = history
  const { headIndex, headCommit } = findHead(history)
  if (!headIndex || !headCommit || typeof headCommit.headers.sub !== 'string')
    return
  const { proof, commit } = await createCommit(
    signJwk,
    {
      sub: headCommit.headers.sub,
      nxt: null,
      prv: headIndex,
      vrf: rotate,
    },
    content
  )
  history[proof] = commit
  headCommit.headers.nxt = proof
  return mergeHistories(original, history)
}
