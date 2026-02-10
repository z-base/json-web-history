import {
  cloneEntryRecord,
  coerceEntryRecord,
  createEntryRecord,
  JWHAfter,
  JWHEntryRecord,
  JWHJSON,
  JWH_ROOT_POINTER,
  isJWHJSON,
} from './model/index.js'

export class JWHEntry {
  readonly #record: JWHEntryRecord

  constructor(
    iss: string,
    aft: JWHAfter,
    doc: JWHJSON,
    jti?: string,
    nbf?: number
  ) {
    this.#record = createEntryRecord(iss, aft, doc, jti, nbf)
  }

  static fromRecord(record: JWHEntryRecord): JWHEntry {
    const normalized = coerceEntryRecord(record)
    return new JWHEntry(
      normalized.iss,
      normalized.aft,
      normalized.doc,
      normalized.jti,
      normalized.nbf
    )
  }

  get jti(): string {
    return this.#record.jti
  }

  get iss(): string {
    return this.#record.iss
  }

  get nbf(): number {
    return this.#record.nbf
  }

  get aft(): JWHAfter {
    return this.#record.aft
  }

  get doc(): JWHJSON {
    return this.#record.doc
  }

  toRecord(): JWHEntryRecord {
    return cloneEntryRecord(this.#record)
  }
}

export {
  cloneEntryRecord,
  coerceEntryRecord,
  createEntryRecord,
  JWH_ROOT_POINTER,
  isJWHJSON,
}
export type { JWHAfter, JWHEntryRecord, JWHJSON } from './model/index.js'
