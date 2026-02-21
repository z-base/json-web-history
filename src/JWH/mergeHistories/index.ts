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
      if (!known.next && typeof incoming.next === 'string') {
        known.next = incoming.next
      }
      continue
    }
    candidate[key] = { ...alleged[key] }
  }
  const { rootIndex, rootEntry } = findRoot(candidate)
  let verificationMethod = candidate[rootIndex].verificationMethod
  if (!verificationMethod) return
  let rootIssuer: string = rootEntry.iss
  let step: string | undefined = rootIndex
  while (step) {
    const current: JWH[string] | undefined = candidate[step]
    if (!current) return
    const signed = { ...current }
    delete signed.next
    const bytes = encode(signed)
    const valid = await VerificationCluster.verify(
      verificationMethod,
      bytes,
      toArrayBuffer(fromBase64UrlString(step))
    )
    if (!valid) return
    if (current.iss !== rootIssuer) return
    merged[step] = current
    const rotation = current.verificationMethod
    if (rotation) verificationMethod = rotation
    const next: string | undefined =
      typeof current.next === 'string' ? current.next : undefined
    step = typeof next === 'string' && next.length > 0 ? next : undefined
  }
  return openHistory(merged)
}
