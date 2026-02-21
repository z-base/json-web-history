import { generateVerificationPair } from '@z-base/cryptosuite'
import { createHistory, mergeHistories, updateHistory } from './dist/index.js'
const issuer = 'f27ec28f-5f21-486f-96d2-3ef81f8e1bab'
const { verifyJwk, signJwk } = await generateVerificationPair()

const genesis = await createHistory(issuer, verifyJwk, signJwk)

updateHistory(genesis, { mitä: 'botti' }, signJwk)

mergeHistories(genesis, await createHistory(issuer, verifyJwk, signJwk))

console.log(genesis)
