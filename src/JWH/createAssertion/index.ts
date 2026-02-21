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
  const hadNxt = Object.prototype.hasOwnProperty.call(assertion.headers, 'nxt')
  const originalNxt: string | null | undefined = assertion.headers.nxt
  delete assertion.headers.nxt
  let proof = ''
  try {
    proof = toBase64UrlString(
      await VerificationCluster.sign(signJwk, encode(assertion))
    )
  } finally {
    if (hadNxt) assertion.headers.nxt = originalNxt
    else delete assertion.headers.nxt
  }

  return { proof, assertion }
}
