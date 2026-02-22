import { encode } from '@msgpack/msgpack'
import type { JWH } from '../createHistory/index.js'
import { findRoot } from '../findRoot/index.js'
import { VerificationCluster } from '@z-base/cryptosuite'
import { fromBase64UrlString, toArrayBuffer } from '@z-base/bytecodec'
import { openHistory } from '../openHistory/index.js'

export async function mergeHistories(trusted: JWH, alleged: JWH) {
  const merged: JWH = {}

  for (const [key, incoming] of Object.entries(alleged)) {
    if (Object.prototype.hasOwnProperty.call(trusted, key)) {
      const known = trusted[key]
      if (!known.headers.nxt && incoming.headers.nxt) {
        known.headers.nxt = incoming.headers.nxt
      }
      continue
    }
    trusted[key] = incoming
  }

  const { rootIndex, rootEntry } = findRoot(trusted)
  let verificationMethod = trusted[rootIndex].headers.vrf
  if (!verificationMethod) return
  const rootSubject = rootEntry.headers.sub

  let lastNext: string | null = null
  let step: string | null = rootIndex

  while (step) {
    const current: JWH[string] | undefined = trusted[step]
    if (!current) return

    const currentNxt: string | null = current.headers.nxt
    delete (current.headers as { nxt?: string | null }).nxt
    const bytes = encode(current)
    current.headers.nxt = currentNxt

    const valid = await VerificationCluster.verify(
      verificationMethod as NonNullable<typeof verificationMethod>,
      bytes,
      toArrayBuffer(fromBase64UrlString(step))
    )
    if (!valid) return
    if (current.headers.sub !== rootSubject) return

    if (lastNext && current.headers.prv !== lastNext) return

    merged[step] = current
    if (current.headers.vrf) verificationMethod = current.headers.vrf
    lastNext = current.headers.nxt
    step = current.headers.nxt
  }

  return openHistory(merged)
}
