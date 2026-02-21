import { encode } from '@msgpack/msgpack'
import type { JWH } from '../createHistory/index.js'
import { findRoot } from '../findRoot/index.js'
import { VerificationCluster } from '@z-base/cryptosuite'
import { fromBase64UrlString, toArrayBuffer } from '@z-base/bytecodec'
import { openHistory } from '../openHistory/index.js'

function readEntry(source: JWH, key: string): JWH[string] | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(source, key)
  const value = descriptor?.value
  if (!value || typeof value !== 'object') return
  return value as JWH[string]
}

export async function mergeHistories(trusted: JWH, alleged: JWH) {
  const merged: JWH = {}
  const candidate: JWH = {}
  for (const key of Object.keys(trusted)) {
    const entry = readEntry(trusted, key)
    if (!entry) continue
    candidate[key] = entry
  }
  for (const key of Object.keys(alleged)) {
    const incoming = readEntry(alleged, key)
    if (!incoming) continue
    if (Object.prototype.hasOwnProperty.call(candidate, key)) {
      const known = candidate[key]
      if (!known.headers.nxt && typeof incoming.headers.nxt === 'string') {
        known.headers.nxt = incoming.headers.nxt
      }
      continue
    }
    candidate[key] = incoming
  }
  const { rootIndex, rootEntry } = findRoot(candidate)
  let verificationMethod = candidate[rootIndex].headers.vrf
  if (!verificationMethod) return
  let rootSubject: string | null = rootEntry.headers.sub
  let step: string | null = rootIndex
  while (step) {
    const current: JWH[string] | undefined = candidate[step]
    if (!current) return
    const headers = Object.getOwnPropertyDescriptor(current, 'headers')
      ?.value as JWH[string]['headers']
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
