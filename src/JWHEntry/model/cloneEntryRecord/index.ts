import { JWHEntryRecord } from '../types/index.js'

export function cloneEntryRecord(record: JWHEntryRecord): JWHEntryRecord {
  return JSON.parse(JSON.stringify(record)) as JWHEntryRecord
}
