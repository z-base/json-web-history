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

  const trustedCopy = structuredClone(trusted)

  const { rootIndex, rootEntry } = findRoot(trustedCopy)
  const rootSubject = rootEntry.headers.sub
  let verificationMethod = trustedCopy[rootIndex].headers.vrf
  if (!verificationMethod) throw new Error('Bad history')

  for (const [key, incoming] of Object.entries(alleged)) {
    if (Object.prototype.hasOwnProperty.call(trustedCopy, key)) {
      const known = trustedCopy[key]
      if (!known.headers.nxt && incoming.headers.nxt) {
        known.headers.nxt = incoming.headers.nxt
      }
      continue
    }
    trustedCopy[key] = incoming
  }

  let currentIndex: string | null = rootIndex
  let currentStep: JWH[string] | undefined = trustedCopy[currentIndex]
  let lastIndex: string | null = null
  let lastStep: JWH[string] | null = null

  while (currentIndex) {
    if (!currentStep) {
      badNodes = true
      break
    }

    const currentStepNext: string | null = currentStep.headers.nxt
    delete (currentStep.headers as { nxt?: string | null }).nxt
    const protectedBytes = encode(currentStep)
    currentStep.headers.nxt = currentStepNext

    const valid = await VerificationCluster.verify(
      verificationMethod,
      protectedBytes,
      toArrayBuffer(fromBase64UrlString(currentIndex))
    )

    if (
      !valid ||
      currentStep.headers.sub !== rootSubject ||
      (lastStep && lastStep.headers.nxt !== currentIndex) ||
      (lastIndex && currentStep.headers.prv !== lastIndex)
    ) {
      badNodes = true
      break
    }

    mergeResult[currentIndex] = currentStep
    if (currentStep.headers.vrf) verificationMethod = currentStep.headers.vrf
    lastIndex = currentIndex
    lastStep = currentStep
    currentIndex = currentStep.headers.nxt
    currentStep = currentIndex ? trustedCopy[currentIndex] : undefined
  }

  return { badNodes, mergeResult }
}
