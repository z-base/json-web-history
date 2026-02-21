import { encode } from '@msgpack/msgpack'
import type { JWH } from '../createHistory/index.js'
import { findRoot } from '../findRoot/index.js'
import { VerificationCluster, VerifyJWK } from '@z-base/cryptosuite'
import { fromBase64UrlString, toArrayBuffer } from '@z-base/bytecodec'
import { openHistory } from '../openHistory/index.js'

export async function mergeHistories(trusted: JWH, alleged: JWH) {
  const merged: JWH = {}
  const { rootIndex, rootEntry } = findRoot(trusted)
  for (const key of Object.keys(alleged)) {
    if (Object.prototype.hasOwnProperty.call(trusted, key)) continue
    trusted[key] = alleged[key]
  }
  let verificationMethod = trusted[rootIndex].verificationMethod as VerifyJWK
  if (!verificationMethod) return
  let rootIssuer: string = rootEntry.iss
  let step: string = rootIndex
  while (step) {
    const bytes = encode(trusted)
    const valid = await VerificationCluster.verify(
      verificationMethod,
      bytes,
      toArrayBuffer(fromBase64UrlString(rootIndex))
    )
    if (!valid) return
    if (trusted[step].iss !== rootIssuer) return
    merged[step] = trusted[step]
    const rotation = merged[step].verificationMethod as VerifyJWK
    const next = merged[step].next
    if (next && next === 'string') {
      step = next
      if (rotation) {
        verificationMethod = rotation
      }
    }
  }
  return openHistory(merged)
}