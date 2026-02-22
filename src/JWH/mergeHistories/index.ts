import { encode } from '@msgpack/msgpack'
import type { JWH } from '../createHistory/index.js'
import { findRoot } from '../findRoot/index.js'
import { VerificationCluster } from '@z-base/cryptosuite'
import { fromBase64UrlString, toArrayBuffer } from '@z-base/bytecodec'

export async function mergeHistories(
  trusted: JWH,
  alleged: JWH
): Promise<{ badNodes: boolean; mergeResult: JWH }> {
  let badNodes: boolean = false
  const mergeResult: JWH = {}

  const { rootIndex, rootEntry } = findRoot(trusted)
  const rootSubject = rootEntry.headers.sub
  let verificationMethod = trusted[rootIndex].headers.vrf
  if (!verificationMethod) throw new Error('Bad history')

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

  let lastNext: string | null = null
  let step: string | null = rootIndex

  while (step) {
    const current: JWH[string] | undefined = trusted[step]
    if (!current) {
      badNodes = true
      break
    }
    const currentNxt: string | null = current.headers.nxt
    delete (current.headers as { nxt?: string | null }).nxt
    const bytes = encode(current)
    current.headers.nxt = currentNxt

    const valid = await VerificationCluster.verify(
      verificationMethod,
      bytes,
      toArrayBuffer(fromBase64UrlString(step))
    )
    if (
      !valid ||
      current.headers.sub !== rootSubject ||
      current.headers.prv !== lastNext ||
      (!!lastNext && trusted[lastNext]?.headers.nxt !== step)
    ) {
      badNodes = true
      delete trusted[step]
      break
    }

    mergeResult[step] = current
    if (current.headers.vrf) verificationMethod = current.headers.vrf
    lastNext = step
    step = current.headers.nxt
  }

  return { badNodes, mergeResult }
}
