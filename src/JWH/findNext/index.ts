import type { Commit, History } from '../../.types/index.js'

export function findNext(history: History, commit: Commit): Commit | false {
  const nextIndex = commit.headers.nxt
  if (!nextIndex) return false
  const nextCommit = history[nextIndex]
  if (!nextCommit) return false
  return nextCommit
}
