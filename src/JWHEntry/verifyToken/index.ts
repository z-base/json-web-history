import { fromString } from '@z-base/bytecodec'
import { VerificationCluster, VerifyJWK } from '@z-base/cryptosuite'
import { JWHEntryRecord } from '../model/index.js'
import { parseToken } from '../parseToken/index.js'

export async function verifyToken(
  token: string,
  verifyJwk: VerifyJWK
): Promise<JWHEntryRecord> {
  const parsed = parseToken(token)

  if (parsed.header.alg === 'none') {
    throw new TypeError('JWH does not permit alg=none')
  }

  if (verifyJwk.alg && verifyJwk.alg !== parsed.header.alg) {
    throw new TypeError('JWH token alg does not match the provided verification key')
  }

  const verified = await VerificationCluster.verify(
    verifyJwk,
    fromString(parsed.signingInput),
    parsed.signature
  )

  if (!verified) {
    throw new TypeError('JWH token signature verification failed')
  }

  return parsed.entry
}
