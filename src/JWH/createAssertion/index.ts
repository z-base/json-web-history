import { encode } from '@msgpack/msgpack'
import { toBase64UrlString } from '@z-base/bytecodec'
import {
  VerificationCluster,
  type VerifyJWK,
  type SignJWK,
} from '@z-base/cryptosuite'
import type { Assertion, Headers, Body } from '../../.types/index.js'

export async function createAssertion(
  signJwk: SignJWK,
  headers: Partial<Headers> = { sub: null, nxt: null, prv: null, vrf: null },
  body: unknown = {}
) {
  const assertion: Assertion = {
    headers: {
      sub: headers.sub ?? null,
      nxt: headers.nxt ?? null,
      prv: headers.prv ?? null,
      vrf: headers.vrf ?? null,
    },
    body,
  }
  const originalNxt: string | null = assertion.headers.nxt
  delete (assertion.headers as { nxt?: string | null }).nxt
  const proof = toBase64UrlString(
    await VerificationCluster.sign(signJwk, encode(assertion))
  )
  assertion.headers.nxt = originalNxt

  return { proof, assertion }
}
