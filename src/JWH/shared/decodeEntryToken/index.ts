import { VerifyJWK } from '@z-base/cryptosuite'
import { JWHEntryRecord } from '../../../JWHEntry/model/index.js'
import { parseToken } from '../../../JWHEntry/parseToken/index.js'
import { verifyToken } from '../../../JWHEntry/verifyToken/index.js'
import { JWHEntryToken } from '../../types/index.js'

export async function decodeEntryToken(
  token: JWHEntryToken,
  verifyJwk?: VerifyJWK
): Promise<JWHEntryRecord> {
  if (verifyJwk) {
    return verifyToken(token, verifyJwk)
  }

  return parseToken(token).entry
}
