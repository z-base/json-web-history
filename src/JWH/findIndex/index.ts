import type { History, Commit } from '../../.types/index.js'
export function findIndex(history: History, index: string): Commit | false {
  if (!index || typeof index !== 'string') return false
  const commit = history[index]
  if (!commit) return false
  return commit
}
