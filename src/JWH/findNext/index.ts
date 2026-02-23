import type { Commit, History } from '../../.types/index.js'

export function findNext(history: History, cursor: Commit): Commit | false {
  const nextIndex = cursor.headers.nxt
  if (!nextIndex) return false
  const nextCommit = history[nextIndex]
  if (!nextCommit) return false
  return nextCommit
}
