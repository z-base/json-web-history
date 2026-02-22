import { JWH } from '../../.types/index.js'

export function findRoot(jwh: JWH) {
  for (const [proof, assertion] of Object.entries(jwh)) {
    if (!proof || !assertion) break
    if (!assertion.headers.prv)
      return { rootIndex: proof, rootEntry: assertion }
    if (Object.prototype.hasOwnProperty.call(jwh, assertion.headers.prv))
      continue
  }
  throw new Error('bad history')
}
