import { fromBase64UrlString, fromJSON } from '@z-base/bytecodec'
import { Commit } from '../../.types/index.js'
import { VerifyJWK } from '@z-base/cryptosuite'
export async function validateCommit(
  index: string,
  commit: Commit,
  verificationMethod: VerifyJWK
) {
  const addedNext = commit.headers.nxt
  delete (commit.headers as { nxt?: string | null }).nxt
  const signatureBytes = fromBase64UrlString(index)
  const protectedBytes = fromJSON(commit)
}
