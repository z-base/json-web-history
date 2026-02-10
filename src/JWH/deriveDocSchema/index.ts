import { JWHJSON } from '../../JWHEntry/model/index.js'

export function deriveDocSchema(doc: JWHJSON): string {
  if (doc === null) return 'null'

  const type = typeof doc
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return type
  }

  if (Array.isArray(doc)) {
    const members = Array.from(new Set(doc.map((item) => deriveDocSchema(item)))).sort()
    return `array<${members.join('|')}>`
  }

  const members = Object.entries(doc)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${JSON.stringify(key)}:${deriveDocSchema(value)}`)

  return `object{${members.join(',')}}`
}
