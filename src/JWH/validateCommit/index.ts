import { JWHError } from '../../.errors/class.js'
import { Commit } from '../../.types/index.js'

const HEADER_KEYS = ['iss', 'nxt', 'prv', 'vrf'] as const

export function normalizeCommit(candidate: unknown): Commit {
  if (!candidate || typeof candidate !== 'object')
    throw new JWHError('MALFORMED_NODE')

  const node = candidate as any

  if (!node.headers || typeof node.headers !== 'object')
    throw new JWHError('MALFORMED_NODE')

  const headers = node.headers

  const keys = Object.keys(headers)
  if (keys.length !== HEADER_KEYS.length) throw new JWHError('MALFORMED_NODE')

  for (const k of HEADER_KEYS) {
    if (!(k in headers)) throw new JWHError('MALFORMED_NODE')
  }

  if (!('body' in node)) throw new JWHError('MALFORMED_NODE')

  const out: Commit = {
    headers: {
      iss: headers.iss ?? null,
      nxt: headers.nxt ?? null,
      prv: headers.prv ?? null,
      vrf: headers.vrf ?? null,
    },
    body: node.body ?? null,
  }

  return out
}
