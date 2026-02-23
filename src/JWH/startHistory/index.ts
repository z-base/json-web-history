import type { History } from '../../.types/index.js'
import type { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { createCommit } from '../createCommit/index.js'

export async function startHistory(
  subject: string,
  content: Body,
  signJwk: SignJWK,
  verifyJwk: VerifyJWK
): Promise<History> {
  const { proof, commit } = await createCommit(
    signJwk,
    {
      sub: subject,
      nxt: null,
      prv: null,
      vrf: verifyJwk,
    },
    content
  )
  const root: History = { [proof]: commit }
  return root
}
