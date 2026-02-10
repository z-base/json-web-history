import { SignJWK } from '@z-base/cryptosuite'
import {
  createEntryRecord,
  JWHJSON,
  JWH_ROOT_POINTER,
} from '../../JWHEntry/model/index.js'
import { tokenizeEntry } from '../../JWHEntry/tokenizeEntry/index.js'
import { JWHString } from '../types/index.js'

export async function startJWH(
  iss: string,
  doc: JWHJSON,
  signJwk: SignJWK
): Promise<JWHString> {
  const root = createEntryRecord(iss, JWH_ROOT_POINTER, doc)
  const token = await tokenizeEntry(root, signJwk)
  return JSON.stringify([token])
}
