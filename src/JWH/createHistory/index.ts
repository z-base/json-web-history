import { createAssertion, Assertion } from '../createAssertion/index.js'
import type { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { openHistory } from '../openHistory/index.js'

export type JWH = Record<string, Assertion>

export async function createHistory(
  issuer: string,
  verifyJwk: VerifyJWK,
  signJwk: SignJWK
): Promise<JWH> {
  const { proof, assertion } = await createAssertion(
    issuer,
    signJwk,
    Date.now(),
    {},
    verifyJwk
  )
  const root: JWH = { [proof]: assertion }
  return openHistory(root)
}
