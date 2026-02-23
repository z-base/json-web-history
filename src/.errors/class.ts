export type JWHCode =
  | 'MALFORMED_ROOT'
  | 'MALFORMED_NODE'
  | 'MALFORMED_HEAD'
  | 'MALFORMED_HISTORY'
  | 'MISSING_ISSUER'
  | 'MISSING_VERIFICATION_METHOD'

export class JWHError extends Error {
  readonly code: JWHCode

  constructor(code: JWHCode, message?: string) {
    const detail = message ?? code
    super(`{@z-base/jwh} ${detail}`)
    this.code = code
    this.name = 'JWHError'
  }
}
