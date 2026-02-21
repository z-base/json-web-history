import { encode } from '@msgpack/msgpack'
import { toBase64UrlString } from '@z-base/bytecodec'
import {
  VerificationCluster,
  type VerifyJWK,
  type SignJWK,
} from '@z-base/cryptosuite'

export type Headers = {
  sub: string | null
  nxt?: string | null
  prv?: string | null
  vrf: VerifyJWK | null
}
export type Body = unknown

export type Assertion = {
  headers: Headers
  body?: Body
}

export async function createAssertion(
  signJwk: SignJWK,
  headers: Headers = { sub: null, nxt: null, prv: null, vrf: null },
  body: unknown = {}
) {
  const assertion: Assertion = { headers, body }

  const proof = toBase64UrlString(
    await VerificationCluster.sign(signJwk, encode(assertion))
  )

  return { proof, assertion }
}
