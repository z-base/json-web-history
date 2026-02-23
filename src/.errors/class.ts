export type JWHCode = 'BAD_HISTORY'

export class JWHError extends Error {
  readonly code: JWHCode

  constructor(code: JWHCode, message?: string) {
    const detail = message ?? code
    super(`{@z-base/jwh} ${detail}`)
    this.code = code
    this.name = 'JWHError'
  }
}
