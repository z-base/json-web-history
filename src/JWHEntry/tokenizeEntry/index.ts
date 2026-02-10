import { fromJSON, fromString, toBase64UrlString } from '@z-base/bytecodec'
import { SignJWK, VerificationCluster } from '@z-base/cryptosuite'
import { JWHEntry } from '../class.js'
import { normalizeEntryRecord } from '../normalizeEntryRecord/index.js'
import { JWHEntryRecord } from '../model/index.js'
import { JWHProtectedHeader } from './types/index.js'

export async function tokenizeEntry(
  entry: JWHEntry | JWHEntryRecord,
  signJwk: SignJWK
): Promise<Base64URLString> {
  const normalizedEntry = normalizeEntryRecord(entry)
  const alg: string = signJwk.alg ?? 'EdDSA'

  const header: JWHProtectedHeader = {
    typ: 'JWT',
    alg,
  }

  const protectedHeader = toBase64UrlString(fromJSON(header))
  const payload = toBase64UrlString(fromJSON(normalizedEntry))

  const signingInput = `${protectedHeader}.${payload}`
  const signatureBytes = await VerificationCluster.sign(
    signJwk,
    fromString(signingInput)
  )
  const signature = toBase64UrlString(signatureBytes)

  return `${protectedHeader}.${payload}.${signature}`
}

export type { JWHProtectedHeader } from './types/index.js'
