import { encode } from '@msgpack/msgpack'
import type { JWH } from '../createHistory/index.js'
import { findRoot } from '../findRoot/index.js'
import { VerificationCluster } from '@z-base/cryptosuite'
import { fromBase64UrlString, toArrayBuffer } from '@z-base/bytecodec'
import { openHistory } from '../openHistory/index.js'

export async function mergeHistories(trusted: JWH, alleged: JWH) {
  const merged: JWH = {}
  const candidate: JWH = {}
  for (const [key, entry] of Object.entries(trusted)) {
    if (!entry || typeof entry !== 'object') continue
    if (!Object.prototype.hasOwnProperty.call(entry, 'headers')) continue
    candidate[key] = entry
  }
  for (const [key, incomingEntry] of Object.entries(alleged)) {
    if (!incomingEntry || typeof incomingEntry !== 'object') continue
    if (!Object.prototype.hasOwnProperty.call(incomingEntry, 'headers'))
      continue
    if (Object.prototype.hasOwnProperty.call(candidate, key)) {
      const known = candidate[key]
      if (!known.headers.nxt && typeof incomingEntry.headers.nxt === 'string') {
        known.headers.nxt = incomingEntry.headers.nxt
      }
      continue
    }
    candidate[key] = incomingEntry
  }
  const { rootIndex, rootEntry } = findRoot(candidate)
  let verificationMethod = candidate[rootIndex].headers.vrf
  if (!verificationMethod) return
  let rootSubject: string | null = rootEntry.headers.sub
  let lastNext: string | null | undefined = rootEntry.headers.nxt
  let step: string | null = rootIndex
  while (step) {
    const current: JWH[string] | undefined = candidate[step]
    if (!current) return
    const headers = current.headers
    const hadNxt = Object.prototype.hasOwnProperty.call(headers, 'nxt')
    const originalNxt: string | null | undefined = headers.nxt
    delete headers.nxt
    let bytes: Uint8Array
    try {
      bytes = encode(current)
    } finally {
      if (hadNxt) headers.nxt = originalNxt
      else delete headers.nxt
    }
    const valid = await VerificationCluster.verify(
      verificationMethod,
      bytes,
      toArrayBuffer(fromBase64UrlString(step))
    )
    if (!valid) return
    if (current.headers.prv !== lastNext) return
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
