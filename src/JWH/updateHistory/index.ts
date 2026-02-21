import { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { createAssertion } from '../createAssertion/index.js'
import { findHead } from '../findHead/index.js'
import type { JWH } from '../createHistory/index.js'
import { mergeHistories } from '../mergeHistories/index.js'
export async function updateHistory(
  jwh: JWH,
  claims: Record<string, unknown>,
  signJwk: SignJWK,
  notBefore?: number,
  verificationMethod?: VerifyJWK
) {
  const original = jwh
  const { headIndex, headEntry } = findHead(jwh)
  if (!headIndex || !headEntry || typeof headEntry.iss !== 'string') return
  claims.prev = headIndex
  const { proof, assertion } = await createAssertion(
    headEntry.iss,
    signJwk,
    notBefore,
    claims,
    verificationMethod
  )
  jwh[proof] = assertion
  headEntry.next = proof
  return mergeHistories(original, jwh)
}