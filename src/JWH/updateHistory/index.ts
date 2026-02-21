import { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { createAssertion } from '../createAssertion/index.js'
import { findHead } from '../findHead/index.js'
import type { JWH } from '../createHistory/index.js'
import { mergeHistories } from '../mergeHistories/index.js'
export async function updateHistory(
  jwh: JWH,
  content: Record<string, unknown>,
  signJwk: SignJWK,
  rotate: VerifyJWK | null = null
) {
  const original = jwh
  const { headIndex, headEntry } = findHead(jwh)
  if (!headIndex || !headEntry || typeof headEntry.headers.sub !== 'string')
    return
  const { proof, assertion } = await createAssertion(signJwk, {
    sub: headEntry.headers.sub,
    nxt: null,
    prv: headIndex,
    vrf: rotate,
  })
  jwh[proof] = assertion
  headEntry.headers.nxt = proof
  return mergeHistories(original, jwh)
}
