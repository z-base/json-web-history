import { generateVerificationPair } from '@z-base/cryptosuite'
import { createHistory, mergeHistories, updateHistory } from './dist/index.js'
const sub = 'f27ec28f-5f21-486f-96d2-3ef81f8e1bab'
const initial = await generateVerificationPair()

const genesis = await createHistory(
  sub,
  { ripin: 'rantti' },
  initial.signJwk,
  initial.verifyJwk
)

await updateHistory(genesis, { mitä: 'botti' }, initial.signJwk)

const rotated = await generateVerificationPair()

await updateHistory(
  genesis,
  { mitä: 'katti' },
  initial.signJwk,
  rotated.verifyJwk
)

await updateHistory(
  genesis,
  { mitä: 'katti', ripin: 'rapin', sitin: 'sontiainen' },
  rotated.signJwk
)

await mergeHistories(
  genesis,
  await createHistory(
    sub,
    { ripin: 'rantti' },
    initial.signJwk,
    initial.verifyJwk
  )
)

console.log(genesis)
