import { fromBase64UrlString, toArrayBuffer, toJSON } from '@z-base/bytecodec'
import { JWHError } from '../../.errors/class.js'
import { coerceEntryRecord } from '../model/index.js'
import { JWHProtectedHeader } from '../tokenizeEntry/types/index.js'
import { ParsedJWHEntryToken } from './types/index.js'

export function parseToken(token: string): ParsedJWHEntryToken {
  const parts = token.split('.')

  if (parts.length !== 3) {
    throw new JWHError(
      'TOKEN_INVALID_COMPACT_JWS',
      'JWH token must be a compact JWS with 3 dot-separated parts'
    )
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts

  const headerRaw = toJSON(fromBase64UrlString(encodedHeader))
  if (
    typeof headerRaw !== 'object' ||
    headerRaw === null ||
    Array.isArray(headerRaw) ||
    headerRaw.typ !== 'JWT' ||
    typeof headerRaw.alg !== 'string' ||
    headerRaw.alg.length === 0
  ) {
    throw new JWHError(
      'TOKEN_INVALID_PROTECTED_HEADER',
      'JWH token protected header must contain typ=JWT and non-empty alg'
    )
  }

  const header: JWHProtectedHeader = {
    typ: 'JWT',
    alg: headerRaw.alg,
  }

  const entryRaw = toJSON(fromBase64UrlString(encodedPayload))
  const entry = coerceEntryRecord(entryRaw)
  const signature = toArrayBuffer(fromBase64UrlString(encodedSignature))

  return {
    header,
    entry,
    signature,
    signingInput: `${encodedHeader}.${encodedPayload}`,
  }
}
