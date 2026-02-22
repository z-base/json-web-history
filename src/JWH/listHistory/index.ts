import { JWH } from '../createHistory/index.js'

export type StartingPoint = 'root' | 'head'

export async function listHistory(
  history: JWH,
  startingPoint: StartingPoint,
  limit: number = 1,
  includeHeader: boolean = false
) {}
