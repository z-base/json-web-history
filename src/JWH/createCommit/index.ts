import { encode } from '@msgpack/msgpack'
import { toBase64UrlString } from '@z-base/bytecodec'
import { VerificationCluster, type SignJWK } from '@z-base/cryptosuite'
import type { Commit, Headers, Body } from '../../.types/index.js'

export async function createCommit(
  signJwk: SignJWK,
  headers: Partial<Headers> = { sub: null, nxt: null, prv: null, vrf: null },
  body: Body = {}
) {
  const commit: Commit = {
    headers: {
      sub: headers.sub ?? null,
      nxt: headers.nxt ?? null,
      prv: headers.prv ?? null,
      vrf: headers.vrf ?? null,
    },
    body,
  }
  const originalNxt: string | null = commit.headers.nxt
  delete (commit.headers as { nxt?: string | null }).nxt
  const proof = toBase64UrlString(
    await VerificationCluster.sign(signJwk, encode(commit))
  )
  commit.headers.nxt = originalNxt

  return { proof, commit }
}
