import { JWHEntry } from '../class.js'
import { coerceEntryRecord, JWHEntryRecord } from '../model/index.js'

export function normalizeEntryRecord(entry: JWHEntry | JWHEntryRecord): JWHEntryRecord {
  if (entry instanceof JWHEntry) {
    return entry.toRecord()
  }

  return coerceEntryRecord(entry)
}
