import { encode } from '@msgpack/msgpack'
import type { JWH } from '../createHistory/index.js'
import { findRoot } from '../findRoot/index.js'
import { VerificationCluster, VerifyJWK } from '@z-base/cryptosuite'
import { fromBase64UrlString, toArrayBuffer } from '@z-base/bytecodec'
import { openHistory } from '../openHistory/index.js'

export async function mergeHistories(trusted: JWH, alleged: JWH) {
  const merged: JWH = {}
  const candidate: JWH = {}
  for (const [key, entry] of Object.entries(trusted)) {
    candidate[key] = { ...entry }
  }
  for (const key of Object.keys(alleged)) {
    if (Object.prototype.hasOwnProperty.call(candidate, key)) {
      const known = candidate[key]
      const incoming = alleged[key]
      if (!known.headers.nxt && typeof incoming.headers.nxt === 'string') {
        known.headers.nxt = incoming.headers.nxt
      }
      continue
    }
    candidate[key] = { ...alleged[key] }
  }
  const { rootIndex, rootEntry } = findRoot(candidate)
  let verificationMethod = candidate[rootIndex].headers.vrf
  if (!verificationMethod) return
  let rootSubject: string | null = rootEntry.headers.sub
  let step: string | null = rootIndex
  while (step) {
    const current: JWH[string] | undefined = candidate[step]
    if (!current) return
    const signed = { ...current }
    delete signed.headers.nxt
    const bytes = encode(signed)
    const valid = await VerificationCluster.verify(
      verificationMethod,
      bytes,
      toArrayBuffer(fromBase64UrlString(step))
    )
    if (!valid) return
    if (current.headers.sub !== rootSubject) return
    merged[step] = current
    const rotation = current.headers.vrf
    if (rotation) verificationMethod = rotation
    const next: string | null =
      typeof current.headers.nxt === 'string' ? current.headers.nxt : null
    step = typeof next === 'string' && next.length > 0 ? next : null
  }
  return openHistory(merged)
}
