import { JWH } from '../createHistory/index.js'

export function findHead(jwh: JWH) {
  for (const [proof, assertion] of Object.entries(jwh)) {
    if (!proof || !assertion) break
    if (!assertion.headers.nxt)
      return { headIndex: proof, headEntry: assertion }
    if (Object.prototype.hasOwnProperty.call(jwh, assertion.headers.nxt))
      continue
  }
  throw new Error('bad history')
}
