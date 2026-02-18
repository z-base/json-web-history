export type JWHJSON =
  | null
  | boolean
  | number
  | string
  | Array<JWHJSON>
  | { [key: string]: JWHJSON }
