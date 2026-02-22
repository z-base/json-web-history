import { JWH } from '../createHistory/index.js'
import { findHead } from '../findHead/index.js'
import { findRoot } from '../findRoot/index.js'

export type StartingPoint = 'root' | 'head'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function pickFromObject(
  obj: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(obj, f)) out[f] = obj[f]
  }
  return out
}

export function listHistory(
  history: JWH,
  startingPoint: StartingPoint = 'head',
  limitEntries: number = 1,
  pickFields: Array<string> | false = false,
  includeHeaders: boolean = false
): Array<Partial<JWH[string]>> {
  if (!history || typeof history !== 'object') throw new Error('Bad history')
  if (!Number.isFinite(limitEntries) || limitEntries <= 0) return []

  // Resolve start
  let currentKey: string
  let currentEntry: JWH[string]

  if (startingPoint === 'head') {
    const { headIndex, headEntry } = findHead(history)
    if (!headIndex || !headEntry) throw new Error('Bad history')
    currentKey = headIndex
    currentEntry = headEntry
  } else {
    const { rootIndex, rootEntry } = findRoot(history)
    if (!rootIndex || !rootEntry) throw new Error('Bad history')
    currentKey = rootIndex
    currentEntry = rootEntry
  }

  // Build prv -> [successors] index (so we can “flatten with lexography”)
  const succsByPrev = new Map<string, string[]>()
  for (const [k, v] of Object.entries(history)) {
    const prev = v?.headers?.prv
    if (typeof prev === 'string') {
      const arr = succsByPrev.get(prev)
      if (arr) arr.push(k)
      else succsByPrev.set(prev, [k])
    }
  }
  for (const [prev, arr] of succsByPrev) {
    arr.sort() // lexicographic flatten
    succsByPrev.set(prev, arr)
  }

  const project = (entry: JWH[string]): Partial<JWH[string]> => {
    const projected: Partial<JWH[string]> = {}
    if (includeHeaders) projected.headers = entry.headers

    if ('body' in entry) {
      const body = entry.body
      if (pickFields && isPlainObject(body))
        projected.body = pickFromObject(body, pickFields)
      else projected.body = body
    }
    return projected
  }

  const out: Array<Partial<JWH[string]>> = []
  const visited = new Set<string>()
  const direction: 'back' | 'forward' =
    startingPoint === 'head' ? 'back' : 'forward'

  while (out.length < limitEntries) {
    if (visited.has(currentKey))
      throw new Error(`Cycle detected at ${currentKey}`)
    visited.add(currentKey)

    out.push(project(currentEntry))

    let nextKey: string | null = null

    if (direction === 'back') {
      nextKey =
        typeof currentEntry.headers?.prv === 'string'
          ? currentEntry.headers.prv
          : null
    } else {
      // flatten: choose lexicographically smallest successor by prv-link
      const succs = succsByPrev.get(currentKey)
      if (succs && succs.length > 0) nextKey = succs[0]
      else
        nextKey =
          typeof currentEntry.headers?.nxt === 'string'
            ? currentEntry.headers.nxt
            : null
    }

    if (!nextKey) break

    const nextEntry = history[nextKey]
    if (!nextEntry)
      throw new Error(`Broken history: missing referenced entry ${nextKey}`)

    currentKey = nextKey
    currentEntry = nextEntry
  }

  return out
}
