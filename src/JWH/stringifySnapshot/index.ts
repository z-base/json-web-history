import { JWHString, JWHSnapshot } from '../types/index.js'

export function stringifySnapshot(snapshot: JWHSnapshot): JWHString {
  return JSON.stringify(snapshot)
}
