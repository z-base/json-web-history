import type { History } from '../../.types/index.js'
import type { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { createCommit } from '../createCommit/index.js'

export async function startHistory(
  issuer: string,
  content: Body,
  signJwk: SignJWK,
  verifyJwk: VerifyJWK
): Promise<History> {
  const { proof, commit } = await createCommit(
    signJwk,
    {
      iss: issuer,
      nxt: null,
      prv: null,
      vrf: verifyJwk,
    },
    content
  )
  const root: History = { [proof]: commit }
  return root
}
