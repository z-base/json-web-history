import type { Commit, History } from '../../.types/index.js'
import { normalizeCommit } from '../normalizeCommit/index.js'

export function findPrev(history: History, cursor: Commit): Commit | false {
  const prevIndex = cursor.headers.prv
  if (!prevIndex) return false
  const prevCommit = history[prevIndex]
  if (!prevCommit) return false
  return normalizeCommit(prevCommit)
}
