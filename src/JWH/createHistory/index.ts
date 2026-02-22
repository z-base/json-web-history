import type { JWH } from '../../.types/index.js'
import type { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { openHistory } from '../openHistory/index.js'
import { createAssertion } from '../createAssertion/index.js'

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
  return root
}
