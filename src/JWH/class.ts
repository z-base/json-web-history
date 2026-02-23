import type {
  Commit,
  History,
  JWHSnapshotFormat,
  JWHSnapshotFormatOptions,
} from '../.types/index.js'
import { openHistory } from './openHistory/index.js'
import { closeHistory } from './closeHistory/index.js'
import { findHead } from './findHead/index.js'
import { findRoot } from './findRoot/index.js'
import { findPrev } from './findPrev/index.js'
import { findNext } from './findNext/index.js'
import { findIndex } from './findIndex/index.js'
export class JWH {
  private state: History
  private cursor: Commit
  constructor(snapshot: JWHSnapshotFormat) {
    this.state = openHistory(snapshot)
    const { headCommit } = findHead(this.state)
    this.cursor = headCommit
  }
  list() {}
  snapshot(format: JWHSnapshotFormatOptions): JWHSnapshotFormat {
    return closeHistory(format, this.state)
  }
  switchInto(index: string): void {
    const commit = findIndex(this.state, index)
    if (!commit) return
    this.cursor = commit
    return
  }
  switchPrev(): void {
    const prevCommit = findPrev(this.state, this.cursor)
    if (!prevCommit) return
    this.cursor = prevCommit
    return
  }
  switchNext(): void {
    const nextCommit = findNext(this.state, this.cursor)
    if (!nextCommit) return
    this.cursor = nextCommit
    return
  }
  switchHead(): void {
    const { headCommit } = findHead(this.state)
    if (!headCommit) return
    this.cursor = headCommit
    return
  }
  switchRoot(): void {
    const { rootCommit } = findRoot(this.state)
    if (!rootCommit) return
    this.cursor = rootCommit
    return
  }
}
