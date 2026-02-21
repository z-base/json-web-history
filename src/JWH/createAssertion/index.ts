import { encode } from '@msgpack/msgpack'
import { toBase64UrlString } from '@z-base/bytecodec'
import { VerificationCluster, VerifyJWK, SignJWK } from '@z-base/cryptosuite'

export type Required = {
  iss: string
  nbf: number
  next?: string
  prev?: string
  verificationMethod?: VerifyJWK
}

export type Assertion = Required & Omit<Record<string, unknown>, keyof Required>

export async function createAssertion(
  issuer: string,
  signJwk: SignJWK,
  notBefore: number = Date.now(),
  claims?: Record<string, unknown>,
  verificationMethod?: VerifyJWK
) {
  const assertion: Assertion = Object.freeze({
    iss: issuer,
    nbf: notBefore,
    ...(claims ?? {}),
    ...(verificationMethod ? { verificationMethod } : {}),
  })

  const proof = toBase64UrlString(
    await VerificationCluster.sign(signJwk, encode(assertion))
  )

  return { proof, assertion }
}
