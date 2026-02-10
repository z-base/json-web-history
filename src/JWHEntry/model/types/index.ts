export const JWH_ROOT_POINTER = 'U+0000' as const

export type JWHJSON =
  | null
  | boolean
  | number
  | string
  | Array<JWHJSON>
  | { [key: string]: JWHJSON }

export type JWHAfter = typeof JWH_ROOT_POINTER | string

export interface JWHEntryRecord {
  jti: string
  iss: string
  nbf: number
  aft: JWHAfter
  doc: JWHJSON
}
