import { JWHError } from '../../../.errors/class.js'
import {
  JWHEntryRecord,
  JWH_ROOT_POINTER,
} from '../../../JWHEntry/model/index.js'

export function computeOrderedEntries(
  entryByJti: Map<string, JWHEntryRecord>
): JWHEntryRecord[] {
  const roots = [...entryByJti.values()].filter(
    (entry) => entry.aft === JWH_ROOT_POINTER
  )

  if (roots.length !== 1) {
    throw new JWHError(
      'HISTORY_ROOT_COUNT_INVALID',
      'JWH must contain exactly one root entry (aft=U+0000)'
    )
  }

  const childByParent = new Map<string, string>()

  for (const entry of entryByJti.values()) {
    if (entry.aft === JWH_ROOT_POINTER) continue

    if (!entryByJti.has(entry.aft)) {
      throw new JWHError(
        'HISTORY_AFT_REFERENCE_MISSING',
        'JWH entry aft must reference an existing jti'
      )
    }

    if (childByParent.has(entry.aft)) {
      throw new JWHError(
        'HISTORY_FORK_DETECTED',
        'JWH history cannot fork: multiple entries reference the same aft'
      )
    }

    childByParent.set(entry.aft, entry.jti)
  }

  const ordered: JWHEntryRecord[] = []
  const seen = new Set<string>()
  let cursor = roots[0].jti

  while (true) {
    if (seen.has(cursor)) {
      throw new JWHError(
        'HISTORY_CYCLE_DETECTED',
        'JWH history must be acyclic'
      )
    }

    const current = entryByJti.get(cursor)
    if (!current) {
      throw new JWHError(
        'HISTORY_CHAIN_REFERENCE_UNRESOLVED',
        'JWH chain contains an unresolved jti reference'
      )
    }

    seen.add(cursor)
    ordered.push(current)

    const next = childByParent.get(cursor)
    if (!next) break
    cursor = next
  }

  if (ordered.length !== entryByJti.size) {
    throw new JWHError(
      'HISTORY_CHAIN_DISCONNECTED',
      'JWH history must be a single connected linear chain'
    )
  }

  return ordered
}
