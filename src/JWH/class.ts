import { SignJWK, VerifyJWK } from '@z-base/cryptosuite'
import { JWHJSON } from '../JWHEntry/model/index.js'
import { extendJWH } from './extendJWH/index.js'
import { inspectJWH } from './inspectJWH/index.js'
import { mergeJWHSnapshots } from './mergeJWHSnapshots/index.js'
import { parseJWHString } from './parseJWHString/index.js'
import { startJWH } from './startJWH/index.js'
import { stringifySnapshot } from './stringifySnapshot/index.js'
import { JWHString, JWHSnapshot, ValidatedJWH } from './types/index.js'
import { validateJWHSnapshot } from './validateJWHSnapshot/index.js'

export interface JWHLike {
  snapshot(): JWHSnapshot
}

export class JWH implements JWHLike {
  #snapshot: JWHSnapshot

  constructor(snapshot: JWHSnapshot | JWHString = []) {
    this.#snapshot = typeof snapshot === 'string' ? parseJWHString(snapshot) : [...snapshot]
  }

  static async start(iss: string, doc: JWHJSON, signJwk: SignJWK): Promise<JWH> {
    return new JWH(await startJWH(iss, doc, signJwk))
  }

  static async merge(
    histories: Array<JWHLike | JWHSnapshot | JWHString>,
    verifyJwk?: VerifyJWK
  ): Promise<JWH> {
    const snapshots = histories.map((source) => {
      if (typeof source === 'string') return parseJWHString(source)
      if (Array.isArray(source)) return [...source]
      return source.snapshot()
    })

    return new JWH(await mergeJWHSnapshots(snapshots, verifyJwk))
  }

  snapshot(): JWHSnapshot {
    return [...this.#snapshot]
  }

  toString(): JWHString {
    return stringifySnapshot(this.#snapshot)
  }

  async validate(verifyJwk?: VerifyJWK): Promise<ValidatedJWH> {
    return validateJWHSnapshot(this.#snapshot, verifyJwk)
  }

  async extend(doc: JWHJSON, signJwk: SignJWK, verifyJwk?: VerifyJWK): Promise<JWH> {
    this.#snapshot = parseJWHString(
      await extendJWH(this.#snapshot, doc, signJwk, verifyJwk)
    )
    return this
  }

  async inspect(t: number, verifyJwk?: VerifyJWK) {
    return inspectJWH(this.#snapshot, t, verifyJwk)
  }
}
