import {
  type Body,
  createAssertion,
  Assertion,
} from '../createAssertion/index.js'
import type { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { openHistory } from '../openHistory/index.js'

export type JWH = Record<string, Assertion>

export async function createHistory(
  subject: string,
  content: Body,
  signJwk: SignJWK,
  verifyJwk: VerifyJWK
): Promise<JWH> {
  const { proof, assertion } = await createAssertion(
    signJwk,
    {
      sub: subject,
      nxt: null,
      prv: null,
      vrf: verifyJwk,
    },
    content
  )
  const root: JWH = { [proof]: assertion }
  return openHistory(root)
}
