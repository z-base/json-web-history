import type { Commit, History } from '../../.types/index.js'

export function findPrev(history: History, commit: Commit): Commit | false {
  const prevIndex = commit.headers.prv
  if (!prevIndex) return false
  const prevCommit = history[prevIndex]
  if (!prevCommit) return false
  return prevCommit
}
